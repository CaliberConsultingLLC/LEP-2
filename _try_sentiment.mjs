import fs from 'fs';

// Load .env.local without printing anything from it.
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const handler = (await import('./api/get-sentiment-narrative.js')).default;

const room = (n, min, max, agree, consensus) => ({ n, min, max, agree, dissent: n - agree, consensus });

const traits = [
  {
    key: 'communication-clarity',
    name: 'Clarity',
    zone: 'Natural, needs tending',
    team: { compass: 64, effort: 30, efficacy: 81 },
    self: { compass: 66, effort: 55, efficacy: 72 },
    statements: [
      { text: 'My leader adapts their communication style to different team members.', effort: 37, efficacy: 100, effortSelf: 60, efficacySelf: 70,
        room: { effort: room(21, 20, 60, 18, 'settled'), efficacy: room(21, 88, 100, 21, 'unanimous') } },
      { text: 'I rarely need to ask for clarification after receiving direction.', effort: 21, efficacy: 99, effortSelf: 50, efficacySelf: 74,
        room: { effort: room(21, 10, 40, 19, 'settled'), efficacy: room(21, 90, 100, 21, 'unanimous') } },
      { text: 'I feel confident I know what success looks like for my role.', effort: 46, efficacy: 97, effortSelf: 58, efficacySelf: 100,
        room: { effort: room(21, 25, 70, 17, 'settled'), efficacy: room(21, 85, 100, 20, 'unanimous') } },
      { text: 'My leader communicates expectations clearly before starting a project.', effort: 26, efficacy: 60, effortSelf: 52, efficacySelf: 98,
        room: { effort: room(21, 5, 55, 16, 'settled'), efficacy: room(21, 20, 95, 11, 'split') } },
      { text: 'Complex decisions are explained in a way I can understand and act on.', effort: 20, efficacy: 50, effortSelf: 48, efficacySelf: 94,
        room: { effort: room(21, 5, 45, 17, 'settled'), efficacy: room(21, 15, 90, 10, 'split') } },
    ],
  },
];

const mk = () => { const r = { code: 0, body: null }; return { setHeader() {}, status(c) { r.code = c; return this; }, json(b) { r.body = b; return r; }, _r: r }; };
const res = mk();
await handler({ method: 'POST', headers: {}, body: { traits, guideId: 'challenger', hasSelfData: true, respondents: 21, resultsAnalysis: null } }, res);

console.log('HTTP', res._r.code);
const out = res._r.body;
if (out?.answersByTrait) {
  for (const [k, qs] of Object.entries(out.answersByTrait)) {
    for (const q of ['q01', 'q02', 'q03']) {
      const a = qs[q];
      if (!a) { console.log(`\n### ${k} ${q}: MISSING`); continue; }
      console.log(`\n### ${k} · ${q}`);
      console.log('VERDICT:    ', a.verdict);
      console.log('DEFINITION: ', a.definition);
      console.log('READING:    ', a.reading);
      console.log('CONSEQUENCE:', a.consequence);
    }
  }
  console.log('\nincomplete:', JSON.stringify(out.incomplete));
} else {
  console.log(JSON.stringify(out).slice(0, 600));
}
