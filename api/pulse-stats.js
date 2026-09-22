// Daily counts for the Compass Pulse admin dashboard.
//
// GET /api/pulse-stats?days=7
//
// Open to anyone, so it is rate-limited, and everything it returns has to be
// safe to publish: counts, and a recent-events list of what happened and when.
//
// Days are Indianapolis days, not UTC days: a signup at 9pm Eastern belongs to
// the day it happened on for the person reading the dashboard.
//
// Nothing identifying leaves this endpoint — no names, no emails, no uids.
// Visit paths are the one field a stranger can write (track-visit takes
// whatever it is sent), and /campaign/:id is a team's live survey link, so a
// visit is only labelled with a known route, ids collapsed.

import { db } from './firebase.js';
import { applyRateLimit, safeServerError } from './_security.js';

const TIME_ZONE = 'America/Indiana/Indianapolis';
const DEFAULT_DAYS = 7;
const MAX_DAYS = 120;
const RECENT_LIMIT = 50;

// The endpoint is public and each miss reads users, campaigns and responses
// whole, so a warm instance answers repeat calls from memory for a minute.
const CACHE_MS = 60_000;
const CACHE = new Map();

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

// Mirrors the public routes in src/App.jsx. Anything else reads as "other".
const KNOWN_PATHS = new Set([
  '/', '/landing', '/demo', '/user-info', '/guide-select', '/pay', '/pay/success',
  '/form', '/summary', '/revisit/intake', '/revisit/summary', '/trait-selection',
  '/campaign-builder', '/campaign-verify', '/self-assessment', '/sign-in',
  '/dashboard', '/faq', '/documents', '/pricing',
]);

function visitLabel(rawPath) {
  const path = String(rawPath || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const campaign = path.match(/^\/campaign\/[^/]+(\/survey|\/complete)?$/);
  if (campaign) return `Visit /campaign/:id${campaign[1] || ''}`;
  if (/^\/documents\/[^/]+$/.test(path)) return 'Visit /documents/:doc';
  return KNOWN_PATHS.has(path) ? `Visit ${path}` : 'Visit (other page)';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Each call reads four whole collections, so keep it well under what one
  // open dashboard tab needs to feel live.
  const rate = applyRateLimit(req, res, { action: 'pulse-stats', limit: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const requested = Number.parseInt(String(req.query?.days ?? ''), 10);
  const days = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, MAX_DAYS)
    : DEFAULT_DAYS;

  const cached = CACHE.get(days);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return res.status(200).json(cached.body);
  }

  try {
    const keys = dayRange(days, Date.now());
    // authEvents grows with every visit, so only its window is read. The day
    // before the first key is a safe floor in any US zone; tally() trims the
    // rest. createdAt there is always an ISO string, so this compares cleanly.
    const floor = new Date(Date.parse(`${keys[0]}T00:00:00Z`) - 24 * 60 * 60 * 1000).toISOString();

    const [eventsSnap, usersSnap, campaignsSnap, responsesSnap] = await Promise.all([
      db.collection('authEvents').where('createdAt', '>=', floor).get(),
      db.collection('users').get(),
      db.collection('campaigns').get(),
      db.collection('responses').get(),
    ]);

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

    eventsSnap.docs.forEach((snap) => {
      const data = snap.data() || {};
      if (data.eventType !== 'visit') return;
      tally('visits', data.createdAt, { type: 'visit', label: visitLabel(data.path) });
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

    const body = {
      timeZone: TIME_ZONE,
      days,
      from: keys[0],
      to: keys[keys.length - 1],
      totals,
      series,
      recent,
    };
    CACHE.set(days, { at: Date.now(), body });
    return res.status(200).json(body);
  } catch (error) {
    return safeServerError(res, 'pulse-stats error:', error);
  }
}
