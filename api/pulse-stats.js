// Daily counts for the Compass Pulse admin dashboard.
//
// GET /api/pulse-stats?key=...&days=7
//
// The key is a shared secret held in PULSE_STATS_KEY. Without it set the
// endpoint refuses rather than running open to anyone who finds the path.
//
// Days are Indianapolis days, not UTC days: a signup at 9pm Eastern belongs to
// the day it happened on for the person reading the dashboard.
//
// Nothing identifying leaves this endpoint — no names, no emails, no uids.
// The recent-events list says what happened and when, not to whom.

import crypto from 'node:crypto';
import { db } from './firebase.js';
import { safeServerError } from './_security.js';

const TIME_ZONE = 'America/Indiana/Indianapolis';
const DEFAULT_DAYS = 7;
const MAX_DAYS = 120;
const RECENT_LIMIT = 50;

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Stored stamps are ISO strings, Dates, or Firestore timestamps. */
function toMs(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (typeof value?._seconds === 'number') return value._seconds * 1000;
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

const dayKey = (ms) => dayKeyFormat.format(new Date(ms));

/**
 * The last `days` calendar days ending today, oldest first. Stepped on the
 * date itself rather than by 24h, so a DST change cannot skip or repeat a day.
 */
function dayRange(days, nowMs) {
  const [y, m, d] = dayKey(nowMs).split('-').map(Number);
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return keys;
}

function keyMatches(provided, expected) {
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const expected = String(process.env.PULSE_STATS_KEY || '').trim();
  if (!expected) {
    return res.status(503).json({ error: 'Pulse stats are not configured' });
  }
  if (!keyMatches(req.query?.key, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const requested = Number.parseInt(String(req.query?.days ?? ''), 10);
  const days = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, MAX_DAYS)
    : DEFAULT_DAYS;

  try {
    const [visitsSnap, usersSnap, campaignsSnap, responsesSnap] = await Promise.all([
      db.collection('authEvents').where('eventType', '==', 'visit').get(),
      db.collection('users').get(),
      db.collection('campaigns').get(),
      db.collection('responses').get(),
    ]);

    const keys = dayRange(days, Date.now());
    const byDay = new Map(keys.map((date) => [date, {
      date, visits: 0, signups: 0, campaigns: 0, emailsSent: 0, emailsFailed: 0,
    }]));
    const events = [];

    /** Counts the stamp, and lists the event, only if it falls in the window. */
    const tally = (field, stamp, event) => {
      const ms = toMs(stamp);
      if (ms === null) return;
      const bucket = byDay.get(dayKey(ms));
      if (!bucket) return;
      bucket[field] += 1;
      if (event) events.push({ ts: new Date(ms).toISOString(), ...event });
    };

    visitsSnap.docs.forEach((snap) => {
      const data = snap.data() || {};
      tally('visits', data.createdAt, { type: 'visit', label: `Visit ${String(data.path || '/').slice(0, 200)}` });
    });

    usersSnap.docs.forEach((snap) => {
      tally('signups', snap.data()?.createdAt, { type: 'signup', label: 'New account' });
    });

    campaignsSnap.docs.forEach((snap) => {
      const data = snap.data() || {};
      const kind = data.campaignType === 'self' ? 'Self' : data.campaignType === 'team' ? 'Team' : 'New';
      tally('campaigns', data.createdAt, { type: 'campaign', label: `${kind} campaign created` });
    });

    responsesSnap.docs.forEach((snap) => {
      const data = snap.data() || {};
      const welcome = data.ops?.welcomeEmail;
      const status = String(welcome?.status || '').trim();
      if (status === 'sent') {
        tally('emailsSent', welcome.updatedAt, { type: 'email', label: 'Welcome email sent' });
      } else if (status) {
        tally('emailsFailed', welcome.updatedAt, { type: 'email-failed', label: 'Welcome email failed' });
      }

      // campaignMail only records sends that went out: { complete, nudge5, ... }.
      Object.entries(data.campaignMail || {}).forEach(([kind, stamp]) => {
        const label = kind === 'complete'
          ? 'Campaign complete email sent'
          : /^nudge\d+$/.test(kind)
            ? `Day ${kind.slice(5)} nudge email sent`
            : 'Campaign email sent';
        tally('emailsSent', stamp, { type: 'email', label });
      });
    });

    const series = keys.map((k) => byDay.get(k));
    const totals = series.reduce((sum, row) => {
      Object.keys(sum).forEach((field) => { sum[field] += row[field]; });
      return sum;
    }, { visits: 0, signups: 0, campaigns: 0, emailsSent: 0, emailsFailed: 0 });

    const recent = events
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, RECENT_LIMIT);

    return res.status(200).json({
      timeZone: TIME_ZONE,
      days,
      from: keys[0],
      to: keys[keys.length - 1],
      totals,
      series,
      recent,
    });
  } catch (error) {
    return safeServerError(res, 'pulse-stats error:', error);
  }
}
