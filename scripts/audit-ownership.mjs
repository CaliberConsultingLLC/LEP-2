// Who owns what, before and after the ownership rules land.
//
// firestore.rules now decides read access on surveyResponses, campaigns and
// users from an ownership FIELD on each document. That is only safe if every
// existing document actually carries it: the rule denies on a missing field,
// which is the right direction — a stranger cannot read it — but it also means
// a leader stops being able to see their own team's responses.
//
// So this counts them. Read-only by default; it prints what it would change
// and changes nothing.
//
//   node scripts/audit-ownership.mjs           # report
//   node scripts/audit-ownership.mjs --fix     # backfill what can be inferred
//
// Only surveyResponses can be repaired automatically, by reading the owner off
// the campaign the response was submitted to. A campaign or user document with
// no owner has nothing to infer one from, and is listed for a human instead.
//
// Needs the robot's credentials, the same four the deployment uses:
//   VITE_FIREBASE_PROJECT_ID  FIREBASE_WEB_API_KEY
//   FIREBASE_ROBOT_EMAIL      FIREBASE_ROBOT_PASSWORD
// Taken from the environment, or from .env.local if it is there.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load .env.local without a dependency. Vercel's values win if both are set.
const envFile = path.join(root, '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key] === undefined) {
      process.env[key] = raw.trim().replace(/^["']|["']$/g, '');
    }
  }
}

const { db } = await import('../api/firebase.js');

const FIX = process.argv.includes('--fix');

const LIVE_PROJECT = 'compass-staging-14d59';

// collection -> the field that names its owner
const OWNED = [
  ['surveyResponses', 'ownerUid'],
  ['campaigns', 'ownerUid'],
  ['users', 'uid'],
];

const missingOwner = (data, field) => {
  const v = data?.[field];
  return v === undefined || v === null || String(v).trim() === '';
};

// The local .env.local points at a DIFFERENT Firebase project than the
// deployment does. Auditing the wrong database and reporting "all clear" is
// the exact shape of mistake this script exists to prevent, so say out loud
// which one is being read before reading it.
function announceTarget() {
  const project =
    process.env.GCLOUD_PROJECT
    || process.env.VITE_FIREBASE_PROJECT_ID
    || process.env.FIREBASE_PROJECT_ID;
  console.log('');
  console.log(`Project: ${project || '(none configured)'}`);
  if (project !== LIVE_PROJECT) {
    console.log(`  ^ this is NOT the live project (${LIVE_PROJECT}).`);
    console.log('    Anything below describes a different database.');
    console.log(`    Set VITE_FIREBASE_PROJECT_ID=${LIVE_PROJECT} plus the robot`);
    console.log('    credentials from the Vercel production scope to read the real one.');
  }
  return project;
}

async function main() {
  announceTarget();
  const report = [];
  const orphans = { surveyResponses: [], campaigns: [], users: [] };

  for (const [name, field] of OWNED) {
    const snap = await db.collection(name).get();
    const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    const bad = docs.filter((d) => missingOwner(d.data, field));
    orphans[name] = bad;
    report.push({ collection: name, field, total: docs.length, missing: bad.length });
  }

  console.log('\nOwnership audit\n');
  for (const r of report) {
    const flag = r.missing === 0 ? 'ok' : 'NEEDS ATTENTION';
    console.log(
      `  ${r.collection.padEnd(16)} ${String(r.total).padStart(5)} docs  ` +
      `${String(r.missing).padStart(5)} without ${r.field.padEnd(9)} ${flag}`
    );
  }

  const totalMissing = report.reduce((n, r) => n + r.missing, 0);
  if (totalMissing === 0) {
    console.log('\nEvery document carries its owner. The rules can be published safely.\n');
    return;
  }

  // surveyResponses can be repaired: the campaign knows who it belongs to.
  const repairable = [];
  const unrepairable = [];
  for (const doc of orphans.surveyResponses) {
    const campaignId = String(doc.data?.campaignId || '').trim();
    if (!campaignId) { unrepairable.push({ collection: 'surveyResponses', id: doc.id, why: 'no campaignId' }); continue; }
    const campaign = await db.collection('campaigns').doc(campaignId).get();
    const owner = campaign.exists ? String(campaign.data()?.ownerUid || '').trim() : '';
    if (!owner) { unrepairable.push({ collection: 'surveyResponses', id: doc.id, why: `campaign ${campaignId} has no ownerUid` }); continue; }
    repairable.push({ id: doc.id, ownerUid: owner, campaignId });
  }
  for (const [name] of OWNED.slice(1)) {
    for (const doc of orphans[name]) {
      unrepairable.push({ collection: name, id: doc.id, why: 'nothing to infer an owner from' });
    }
  }

  if (repairable.length) {
    console.log(`\n${repairable.length} survey response(s) can be repaired from their campaign:`);
    for (const r of repairable.slice(0, 20)) console.log(`  ${r.id}  ->  ownerUid ${r.ownerUid}  (campaign ${r.campaignId})`);
    if (repairable.length > 20) console.log(`  ...and ${repairable.length - 20} more`);
  }
  if (unrepairable.length) {
    console.log(`\n${unrepairable.length} document(s) a human has to decide about:`);
    for (const r of unrepairable.slice(0, 20)) console.log(`  ${r.collection}/${r.id}  ${r.why}`);
    if (unrepairable.length > 20) console.log(`  ...and ${unrepairable.length - 20} more`);
  }

  if (!FIX) {
    console.log('\nNothing was changed. Re-run with --fix to write the repairs above.\n');
    return;
  }

  let done = 0;
  for (const r of repairable) {
    await db.collection('surveyResponses').doc(r.id).update({ ownerUid: r.ownerUid });
    done += 1;
  }
  console.log(`\nBackfilled ${done} survey response(s).`);
  if (unrepairable.length) console.log(`${unrepairable.length} still need a decision — nothing was guessed.`);
  console.log('');
}

main().catch((err) => {
  console.error('\naudit failed:', err?.message || err);
  if (err?.missing) console.error('missing config:', err.missing.join(', '));
  process.exit(1);
});
