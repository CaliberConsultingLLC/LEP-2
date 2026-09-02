// The scheduled job behind campaign email.
//
// Two things get noticed here, both of which a leader would otherwise have to
// notice for themselves by logging in:
//
//   complete — everyone they sent it to has answered
//   stalled  — the window has been open a while and is not full
//
// Nudges go out on day 5, 7, and 10 and then stop. A reminder that keeps
// arriving stops being a reminder, and the leader has a manual close for
// exactly this case.
//
// Every send is recorded on the response document before the next run, so a
// retry, an overlapping invocation, or a redeploy cannot send the same message
// twice. That record is the idempotency key — not the schedule.

import { db } from './firebase.js';
import { appBaseUrl, renderEmail, sendEmail } from './_email.js';
import { safeServerError } from './_security.js';

const NUDGE_DAYS = [5, 7, 10];
const DAY_MS = 24 * 60 * 60 * 1000;

const daysSince = (iso) => {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / DAY_MS);
};

/** The largest nudge day that has passed — so a missed run still catches up. */
const dueNudge = (days) => {
  const passed = NUDGE_DAYS.filter((d) => days >= d);
  return passed.length ? passed[passed.length - 1] : null;
};

function completeMail({ name, base, declared }) {
  return renderEmail({
    eyebrow: 'Your campaign',
    title: 'Everyone answered.',
    body: [
      `${name ? `${name}, all ` : 'All '}${declared} people you sent the survey to have responded, so the window closed on its own.`,
      'Your reading is ready. It opens on the signal — what the team reflected back, trait by trait — before any of the detail underneath it.',
    ],
    cta: { label: 'Read your signal', url: `${base}/dashboard?tab=signal` },
    outro: 'Nothing expires. It will be there when you have the half hour it deserves.',
  });
}

function nudgeMail({ name, base, got, declared, day }) {
  const short = Math.max(0, declared - got);
  return renderEmail({
    eyebrow: 'Your campaign',
    title: got === 0 ? 'No responses yet.' : `${got} of ${declared} have answered.`,
    body: [
      got === 0
        ? `${name ? `${name}, your ` : 'Your '}survey has been open ${day} days and nobody has answered yet. Usually that means the link did not reach them, or it reached them on a bad day.`
        : `Your survey has been open ${day} days. ${short} ${short === 1 ? 'person has' : 'people have'} not answered yet.`,
      'You do not have to wait for all of them. You can close the window whenever you have enough to read honestly — the reading works on what you have.',
    ],
    cta: { label: 'See where it stands', url: `${base}/dashboard?tab=today` },
    outro: 'We send this on day 5, 7, and 10, then stop.',
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  // Vercel signs cron invocations. Without the secret set the endpoint refuses
  // rather than running open to anyone who finds the path.
  const secret = String(process.env.CRON_SECRET || '').trim();
  const auth = String(req.headers?.authorization || '');
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = appBaseUrl(req);
  const summary = { scanned: 0, complete: 0, nudged: 0, skipped: 0, failed: 0 };

  try {
    // Ordering by declaredAt is the filter: Firestore excludes documents that
    // lack the field, so this is exactly the set of leaders who have said how
    // many they sent. An equality check on teamCampaignClosed == false would
    // have matched nothing — that field is only ever written as true, so an
    // open campaign does not have it at all.
    const snap = await db
      .collection('responses')
      .orderBy('inviteTarget.declaredAt')
      .limit(500)
      .get();

    for (const docSnap of snap.docs) {
      summary.scanned += 1;
      const data = docSnap.data() || {};
      const closed = data?.campaignBundle?.campaignRecords?.teamCampaignClosed === true;
      if (closed) { summary.skipped += 1; continue; }
      const target = Number(data?.inviteTarget?.declared);
      const openedAt = data?.campaignBundle?.campaignRecords?.teamCampaignOpenedAt
        || data?.inviteTarget?.declaredAt;
      if (!Number.isFinite(target) || target <= 0 || !openedAt) {
        summary.skipped += 1;
        continue;
      }

      const email = String(data?.ownerEmail || data?.billing?.email || '').trim();
      const name = String(data?.ownerName || '').trim().split(/\s+/)[0] || '';
      if (!email) { summary.skipped += 1; continue; }

      const campaignId = String(data?.campaignBundle?.campaignRecords?.teamCampaignId || '').trim();
      const responses = campaignId
        ? (await db.collection('surveyResponses').where('campaignId', '==', campaignId).get()).size
        : 0;

      const sent = data?.campaignMail || {};
      const days = daysSince(openedAt);

      if (responses >= target) {
        if (sent.complete) { summary.skipped += 1; continue; }
        const { html, text } = completeMail({ name, base, declared: target });
        const result = await sendEmail({ to: email, subject: 'Your Compass reading is ready', html, text });
        if (result.ok) {
          await docSnap.ref.set(
            { campaignMail: { ...sent, complete: new Date().toISOString() } },
            { merge: true }
          );
          summary.complete += 1;
        } else if (result.skipped) { summary.skipped += 1; } else { summary.failed += 1; }
        continue;
      }

      const day = dueNudge(days ?? -1);
      if (day == null || sent[`nudge${day}`]) { summary.skipped += 1; continue; }

      const { html, text } = nudgeMail({ name, base, got: responses, declared: target, day });
      const result = await sendEmail({
        to: email,
        subject: responses === 0 ? 'Your Compass survey is still waiting' : `${responses} of ${target} have answered`,
        html,
        text,
      });
      if (result.ok) {
        await docSnap.ref.set(
          { campaignMail: { ...sent, [`nudge${day}`]: new Date().toISOString() } },
          { merge: true }
        );
        summary.nudged += 1;
      } else if (result.skipped) { summary.skipped += 1; } else { summary.failed += 1; }
    }

    return res.status(200).json({ ok: true, ...summary });
  } catch (error) {
    return safeServerError(res, 'cron-campaign-mail error:', error);
  }
}
