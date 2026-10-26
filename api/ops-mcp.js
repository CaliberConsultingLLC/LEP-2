// Compass Ops: a READ-ONLY MCP connector over the Compass Firestore data, for
// asking Claude questions like "how many registrations today?".
//
// URL: /api/ops-mcp?key=<OPS_CONNECTOR_TOKEN>. The key is the only lock, so
// treat the full URL like a password. Without OPS_CONNECTOR_TOKEN set, every
// request is refused.
//
// Signs in as the same "robot" Firebase account the Compass site uses and only
// ever issues GET / runQuery calls. There is no write path in this file.

import { timingSafeEqual } from 'node:crypto';

const clean = (raw) => String(raw ?? '').trim().replace(/^["']|["']$/g, '');
const PROJECT_ID = clean(process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID);
const WEB_API_KEY = clean(process.env.FIREBASE_WEB_API_KEY) || clean(process.env.VITE_FIREBASE_API_KEY);
const ROBOT_EMAIL = clean(process.env.FIREBASE_ROBOT_EMAIL);
const ROBOT_PASSWORD = clean(process.env.FIREBASE_ROBOT_PASSWORD);
const OPS_TOKEN = clean(process.env.OPS_CONNECTOR_TOKEN);

const TIME_ZONE = 'America/Indiana/Indianapolis';
const SERVER_INFO = { name: 'compass-ops', version: '1.0.0' };
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

// ---------------------------------------------------------------- firestore

let cached = { token: null, expiresAt: 0 };

async function robotToken() {
  const missing = [];
  if (!PROJECT_ID) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!WEB_API_KEY) missing.push('FIREBASE_WEB_API_KEY');
  if (!ROBOT_EMAIL) missing.push('FIREBASE_ROBOT_EMAIL');
  if (!ROBOT_PASSWORD) missing.push('FIREBASE_ROBOT_PASSWORD');
  if (missing.length) throw new Error(`Connector not configured. Missing: ${missing.join(', ')}`);
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ROBOT_EMAIL, password: ROBOT_PASSWORD, returnSecureToken: true }),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.idToken) throw new Error(`Robot sign-in failed: ${body?.error?.message || res.status}`);
  cached = { token: body.idToken, expiresAt: Date.now() + Number(body.expiresIn || 3600) * 1000 };
  return cached.token;
}

const DOCS = () => `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function fsFetch(path, init = {}) {
  const token = await robotToken();
  const res = await fetch(`${DOCS()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const payload = await res.json().catch(() => ({}));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore ${res.status}: ${payload?.error?.message || 'error'}`);
  return payload;
}

function decode(v) {
  if (!v || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue?.fields);
  if ('referenceValue' in v) return v.referenceValue;
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, val] of Object.entries(fields || {})) out[k] = decode(val);
  return out;
}
const idOf = (name) => String(name || '').split('/').pop();

function encode(value) {
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  return { stringValue: String(value) };
}

/** where: [[field, op, value]] with op in == >= < */
async function query(collection, { where = [], fields } = {}) {
  const OPS = { '==': 'EQUAL', '>=': 'GREATER_THAN_OR_EQUAL', '<': 'LESS_THAN' };
  const sq = { from: [{ collectionId: collection }] };
  const filters = where.map(([field, op, value]) => ({
    fieldFilter: { field: { fieldPath: field }, op: OPS[op], value: encode(value) },
  }));
  if (filters.length === 1) sq.where = filters[0];
  if (filters.length > 1) sq.where = { compositeFilter: { op: 'AND', filters } };
  if (fields) sq.select = { fields: fields.map((f) => ({ fieldPath: f })) };
  const rows = await fsFetch(':runQuery', { method: 'POST', body: JSON.stringify({ structuredQuery: sq }) });
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r?.document)
    .map((r) => ({ id: idOf(r.document.name), ...decodeFields(r.document.fields) }));
}

async function getDoc(collection, id) {
  const doc = await fsFetch(`/${collection}/${encodeURIComponent(id)}`);
  return doc ? { id, ...decodeFields(doc.fields) } : null;
}

// ---------------------------------------------------------------- time

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const stampFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});
const toMs = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};
const dayKey = (ms) => dayFmt.format(new Date(ms));
const local = (v) => { const ms = toMs(v); return ms === null ? null : `${stampFmt.format(new Date(ms))} ET`; };

function dayRange(days) {
  const [y, m, d] = dayKey(Date.now()).split('-').map(Number);
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) keys.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  return keys;
}
const clampDays = (n, def = 1, max = 365) => {
  const v = Number.parseInt(String(n ?? ''), 10);
  return Number.isFinite(v) && v > 0 ? Math.min(v, max) : def;
};

// ---------------------------------------------------------------- journey

const STAGES = [
  'Signed up',
  'Paid',
  'Intake in progress',
  'Intake complete',
  'Summary generated',
  'Campaign built',
  'Self assessment complete',
  'Team feedback in progress',
  'Team campaign closed',
];

function journeyOf(resp, teamResponseCount) {
  const r = resp || {};
  const recs = r.campaignBundle?.campaignRecords || {};
  const billing = r.billing || {};
  const paid = billing.paid === true;
  const refunded = Boolean(billing.refundedAt) && !paid;
  const intakeStarted = Boolean(r.intakeDraft) || Boolean(r.latestFormData);
  const intakeComplete = r.intakeStatus?.complete === true || Boolean(r.intakeLock?.locked);
  const summary = Boolean(r.summaryCache);
  const campaignBuilt = Boolean(recs.selfCampaignId);
  const selfDone = recs.selfCompleted === true;
  const teamClosed = recs.teamCampaignClosed === true;

  let stage = 'Signed up';
  if (paid) stage = 'Paid';
  if (intakeStarted) stage = 'Intake in progress';
  if (intakeComplete) stage = 'Intake complete';
  if (intakeComplete && summary) stage = 'Summary generated';
  if (campaignBuilt) stage = 'Campaign built';
  if (selfDone) stage = 'Self assessment complete';
  if (selfDone && teamResponseCount > 0) stage = 'Team feedback in progress';
  if (teamClosed) stage = 'Team campaign closed';

  const welcome = r.ops?.welcomeEmail || null;
  return {
    stage,
    checklist: {
      paid: paid ? `yes (${local(billing.paidAt) || 'date unknown'}${billing.amountTotal ? `, $${(billing.amountTotal / 100).toFixed(2)}` : ''})` : refunded ? `refunded ${local(billing.refundedAt)}` : 'no',
      intake: intakeComplete ? 'complete' : intakeStarted ? `in progress${r.intakeDraft?.currentStep != null ? ` (step ${r.intakeDraft.currentStep})` : ''}` : 'not started',
      summaryGenerated: summary,
      campaignBuilt: campaignBuilt ? `yes (${local(recs.createdAt || recs.savedAt) || 'date unknown'})` : 'no',
      selfAssessmentComplete: selfDone,
      teamResponses: teamResponseCount,
      teamCampaignClosed: teamClosed ? `yes (${local(recs.teamCampaignClosedAt) || 'date unknown'})` : 'no',
    },
    emails: {
      welcome: welcome ? `${welcome.status || 'unknown'} (${local(welcome.updatedAt) || 'date unknown'})` : 'no record',
      campaignMail: Object.fromEntries(Object.entries(r.campaignMail || {}).map(([k, v]) => [k, local(v) || v])),
    },
    ids: { selfCampaignId: recs.selfCampaignId || null, teamCampaignId: recs.teamCampaignId || null },
  };
}

async function teamCountsByOwner() {
  const rows = await query('surveyResponses', { fields: ['ownerUid', 'campaignId'] });
  const counts = new Map();
  rows.forEach((row) => { if (row.ownerUid) counts.set(row.ownerUid, (counts.get(row.ownerUid) || 0) + 1); });
  return counts;
}

// ---------------------------------------------------------------- tools

const TOOLS = [
  {
    name: 'registrations',
    description: 'New Compass account sign-ups by day (Eastern time), with who signed up. Use for "how many registrations today / this week". days=1 means today only.',
    inputSchema: { type: 'object', properties: { days: { type: 'integer', description: 'Number of days ending today (default 1 = today).' } } },
    run: async ({ days }) => {
      const n = clampDays(days, 1);
      const keys = dayRange(n);
      const users = await query('users', { fields: ['name', 'email', 'uid', 'createdAt'] });
      const inWindow = users
        .map((u) => ({ ...u, ms: toMs(u.createdAt) }))
        .filter((u) => u.ms !== null && keys.includes(dayKey(u.ms)))
        .sort((a, b) => b.ms - a.ms);
      const byDay = Object.fromEntries(keys.map((k) => [k, 0]));
      inWindow.forEach((u) => { byDay[dayKey(u.ms)] += 1; });
      return {
        window: `${keys[0]} to ${keys[keys.length - 1]} (Eastern)`,
        total: inWindow.length,
        allTimeAccounts: users.length,
        byDay,
        people: inWindow.map((u) => ({ name: u.name || '', email: u.email || '', signedUp: local(u.createdAt) })),
      };
    },
  },
  {
    name: 'find_user',
    description: 'Search Compass accounts by part of a name or email. Returns matches with email and sign-up date. Use before user_journey when you only have a partial name.',
    inputSchema: { type: 'object', properties: { search: { type: 'string' } }, required: ['search'] },
    run: async ({ search }) => {
      const q = String(search || '').trim().toLowerCase();
      if (!q) throw new Error('search is required');
      const users = await query('users', { fields: ['name', 'email', 'uid', 'createdAt'] });
      const hits = users.filter((u) => `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(q));
      return {
        matches: hits.length,
        users: hits.slice(0, 25).map((u) => ({ name: u.name || '', email: u.email || '', uid: u.uid || '', signedUp: local(u.createdAt) })),
      };
    },
  },
  {
    name: 'user_journey',
    description: 'Where a specific leader is in the Compass process: current stage, payment, intake, campaign, self assessment, team response count, and which emails went out. Pass an email (preferred) or uid.',
    inputSchema: { type: 'object', properties: { email: { type: 'string' }, uid: { type: 'string' } } },
    run: async ({ email, uid }) => {
      let user = null;
      const em = String(email || '').trim().toLowerCase();
      if (uid) {
        user = (await query('users', { where: [['uid', '==', String(uid)]] }))[0] || { uid: String(uid) };
      } else if (em) {
        const all = await query('users', { fields: ['name', 'email', 'uid', 'createdAt'] });
        user = all.find((u) => String(u.email || '').trim().toLowerCase() === em) || null;
      } else {
        throw new Error('Pass an email or uid.');
      }
      if (!user?.uid) return { found: false, note: `No account found for ${em || uid}. Try find_user with part of the name.` };
      const [resp, team] = await Promise.all([
        getDoc('responses', user.uid),
        query('surveyResponses', { where: [['ownerUid', '==', user.uid]], fields: ['ownerUid'] }),
      ]);
      return {
        found: true,
        name: user.name || resp?.ownerName || '',
        email: user.email || resp?.ownerEmail || '',
        uid: user.uid,
        signedUp: local(user.createdAt),
        marketingOptIn: user.consent?.marketingOptIn ?? null,
        ...journeyOf(resp, team.length),
        stageOrder: STAGES,
      };
    },
  },
  {
    name: 'user_results',
    description: 'A leader\'s actual experience and data: profile and intake answers, the guide they picked, the generated reflection, campaign records, and each team member\'s survey answers. Pass an email (preferred) or uid. Use user_journey for status only; use this to look at what they answered and were shown.',
    inputSchema: { type: 'object', properties: { email: { type: 'string' }, uid: { type: 'string' } } },
    run: async ({ email, uid }) => {
      const em = String(email || '').trim().toLowerCase();
      let user = null;
      if (uid) {
        user = (await query('users', { where: [['uid', '==', String(uid)]] }))[0] || { uid: String(uid) };
      } else if (em) {
        const all = await query('users', { fields: ['name', 'email', 'uid', 'createdAt'] });
        user = all.find((u) => String(u.email || '').trim().toLowerCase() === em) || null;
      } else {
        throw new Error('Pass an email or uid.');
      }
      if (!user?.uid) return { found: false, note: `No account found for ${em || uid}. Try find_user with part of the name.` };
      const [resp, team] = await Promise.all([
        getDoc('responses', user.uid),
        query('surveyResponses', { where: [['ownerUid', '==', user.uid]] }),
      ]);
      if (!resp) return { found: true, uid: user.uid, email: user.email || '', note: 'Account exists but has no responses document yet.' };
      const { id: _id, intakeDraft, latestFormData, summaryCache, campaignBundle, billing, ops, ...rest } = resp;
      return {
        found: true,
        name: user.name || resp.ownerName || '',
        email: user.email || resp.ownerEmail || '',
        uid: user.uid,
        signedUp: local(user.createdAt),
        journey: journeyOf(resp, team.length),
        intakeAnswers: latestFormData || intakeDraft?.formData || null,
        intakeDraft: intakeDraft || null,
        reflection: summaryCache || null,
        campaign: campaignBundle || null,
        billing: billing || null,
        teamResponses: team.map(({ id, ...t }) => ({ id, ...t })),
        otherFields: rest,
      };
    },
  },
  {
    name: 'funnel',
    description: 'How many leaders are at each stage of the Compass journey right now, optionally listing who is at a given stage (e.g. who is stuck at "Intake in progress").',
    inputSchema: {
      type: 'object',
      properties: { listStage: { type: 'string', description: `Optional. One of: ${STAGES.join(', ')}` } },
    },
    run: async ({ listStage }) => {
      const [users, responses, teamCounts] = await Promise.all([
        query('users', { fields: ['name', 'email', 'uid', 'createdAt'] }),
        query('responses'),
        teamCountsByOwner(),
      ]);
      const respById = new Map(responses.map((r) => [r.id, r]));
      const counts = Object.fromEntries(STAGES.map((s) => [s, 0]));
      const listed = [];
      let paidAccounts = 0;
      users.forEach((u) => {
        if (respById.get(u.uid)?.billing?.paid === true) paidAccounts += 1;
        const j = journeyOf(respById.get(u.uid), teamCounts.get(u.uid) || 0);
        counts[j.stage] += 1;
        if (listStage && j.stage.toLowerCase() === String(listStage).toLowerCase()) {
          listed.push({ name: u.name || '', email: u.email || '', signedUp: local(u.createdAt) });
        }
      });
      return { totalAccounts: users.length, paidAccounts, note: 'byStage counts each leader once, at their furthest stage, so paid leaders who moved on are counted under later stages. paidAccounts is the total ever recorded as paid by the site (Stripe is the source of truth; refunds issued before the refund webhook existed may not be reflected).', byStage: counts, ...(listStage ? { stage: listStage, people: listed } : {}) };
    },
  },
  {
    name: 'site_visits',
    description: 'Site visits (one per browser session, as logged by the Compass site) by day in Eastern time, with top pages. days=1 means today.',
    inputSchema: { type: 'object', properties: { days: { type: 'integer' } } },
    run: async ({ days }) => {
      const n = clampDays(days, 1, 120);
      const keys = dayRange(n);
      const floor = new Date(Date.parse(`${keys[0]}T00:00:00Z`) - 86_400_000).toISOString();
      const events = await query('authEvents', { where: [['createdAt', '>=', floor]] });
      const byDay = Object.fromEntries(keys.map((k) => [k, 0]));
      const pages = {};
      let total = 0;
      events.forEach((e) => {
        if (e.eventType !== 'visit') return;
        const ms = toMs(e.createdAt);
        if (ms === null || !(dayKey(ms) in byDay)) return;
        byDay[dayKey(ms)] += 1;
        total += 1;
        let p = String(e.path || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
        p = p.replace(/^\/campaign\/[^/]+/, '/campaign/:id').replace(/^\/documents\/[^/]+$/, '/documents/:doc');
        pages[p] = (pages[p] || 0) + 1;
      });
      const topPages = Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([path, visits]) => ({ path, visits }));
      return { window: `${keys[0]} to ${keys[keys.length - 1]} (Eastern)`, total, byDay, topPages };
    },
  },
  {
    name: 'activity_summary',
    description: 'One-shot daily rollup for a window: sign-ups, payments, campaigns created, team responses, emails sent/failed, password resets, visits. Good for "how did we do this week".',
    inputSchema: { type: 'object', properties: { days: { type: 'integer', description: 'Default 7.' } } },
    run: async ({ days }) => {
      const n = clampDays(days, 7, 120);
      const keys = dayRange(n);
      const floor = new Date(Date.parse(`${keys[0]}T00:00:00Z`) - 86_400_000).toISOString();
      const [users, responses, campaigns, survey, events] = await Promise.all([
        query('users', { fields: ['createdAt'] }),
        query('responses', { fields: ['billing', 'ops', 'campaignMail'] }),
        query('campaigns', { fields: ['createdAt', 'campaignType'] }),
        query('surveyResponses', { fields: ['createdAt', 'submittedAt', 'timestamp'] }),
        query('authEvents', { where: [['createdAt', '>=', floor]] }),
      ]);
      const rows = Object.fromEntries(keys.map((k) => [k, {
        signups: 0, payments: 0, revenue: 0, campaigns: 0, teamResponses: 0, emailsSent: 0, emailsFailed: 0, passwordResets: 0, visits: 0,
      }]));
      const bump = (stamp, field, by = 1) => {
        const ms = toMs(stamp);
        if (ms === null) return;
        const row = rows[dayKey(ms)];
        if (row) row[field] += by;
      };
      users.forEach((u) => bump(u.createdAt, 'signups'));
      campaigns.forEach((c) => bump(c.createdAt, 'campaigns'));
      survey.forEach((s) => bump(s.createdAt || s.submittedAt || s.timestamp, 'teamResponses'));
      responses.forEach((r) => {
        if (r.billing?.paid) { bump(r.billing.paidAt, 'payments'); bump(r.billing.paidAt, 'revenue', (r.billing.amountTotal || 0) / 100); }
        const w = r.ops?.welcomeEmail;
        if (w?.status === 'sent') bump(w.updatedAt, 'emailsSent');
        else if (w?.status) bump(w.updatedAt, 'emailsFailed');
        Object.values(r.campaignMail || {}).forEach((stamp) => bump(stamp, 'emailsSent'));
      });
      events.forEach((e) => {
        if (e.eventType === 'visit') bump(e.createdAt, 'visits');
        if (e.eventType === 'password-reset') bump(e.createdAt, 'passwordResets');
      });
      const totals = {};
      Object.values(rows).forEach((row) => Object.entries(row).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; }));
      return { window: `${keys[0]} to ${keys[keys.length - 1]} (Eastern)`, totals, byDay: rows, note: 'Payments/revenue come from what the site recorded; Stripe is the source of truth for money.' };
    },
  },
];

// ---------------------------------------------------------------- MCP / HTTP

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function handleRpc(msg) {
  const { id, method, params } = msg || {};
  const isNotification = id === undefined || id === null;
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      return ok(id, {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'Read-only access to The Compass (Compass leadership platform) data: sign-ups, user journey stage, funnel, site visits, activity rollups. All dates are Eastern time.',
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({
          name, description, inputSchema, annotations: { readOnlyHint: true, openWorldHint: false },
        })),
      });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return fail(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const data = await tool.run(params?.arguments || {});
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], isError: false });
      } catch (err) {
        return ok(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
      }
    }
    default:
      if (isNotification) return null;
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

function tokenMatches(given) {
  if (!OPS_TOKEN) return false;
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(OPS_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!tokenMatches(req.query?.key)) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method === 'GET') {
    // No server-initiated stream; tell clients to use POST only.
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (req.method === 'DELETE') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json(fail(null, -32700, 'Parse error')); }
  }
  const messages = Array.isArray(body) ? body : [body];
  const replies = (await Promise.all(messages.map(handleRpc))).filter(Boolean);
  if (!replies.length) return res.status(202).end();
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(Array.isArray(body) ? replies : replies[0]));
}
