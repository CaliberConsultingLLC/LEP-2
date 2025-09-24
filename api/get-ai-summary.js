import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sentence-safe clip
function clipSentenceSafe(text, limit) {
  if (!text) return '';
  const s = text.trim();
  if (s.length <= limit) return s;
  const cut = s.slice(0, limit);

  const re = /[.!?](?:[”’'")\]]+)?(?=\s|$)/g;
  let lastEnd = -1;
  let m;
  while ((m = re.exec(cut)) !== null) lastEnd = re.lastIndex;

  if (lastEnd > 0) return cut.slice(0, lastEnd).trim();
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) return cut.slice(0, lastSpace).trim();
  return cut.trim();
}

// Apply per-section budgets to exactly 5 paragraphs
function enforceBudgets(text, budgets) {
  const parts = text.split(/\n\s*\n/).map(s => s.trim());
  while (parts.length < 5) parts.push('');
  const [p1, p2, p3, p4, p5] = parts.slice(0, 5);

  const out1 = clipSentenceSafe(p1, budgets.snapshot);
  const out2 = clipSentenceSafe(p2, budgets.strength);
  const out3 = clipSentenceSafe(p3, budgets.blindSpots);
  const out4 = clipSentenceSafe(p4, budgets.growthSpark);
  const out5 = clipSentenceSafe(p5, budgets.societalNorms);

  return [out1, out2, out3, out4, out5].join('\n\n');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = req.body || {};
    const { selectedAgent = 'balancedMentor', charLimit } = body;

    // Load external agent identity doc
    const identityPath = path.join(process.cwd(), 'api', 'AgentIdentity.txt');
    let agentIdentity = '';
    try {
      agentIdentity = fs.readFileSync(identityPath, 'utf8');
    } catch {
      agentIdentity = '';
    }

    // Agent tones
    const agents = {
      bluntPracticalFriend: { prompt: `You are a blunt, practical friend. Be direct, concrete, action-first.` },
      formalEmpatheticCoach: { prompt: `You are a formal, empathetic coach. Polished, supportive, professional.` },
      balancedMentor: { prompt: `You are a balanced mentor. Mix critique with encouragement and clear steps.` },
      comedyRoaster: { prompt: `You are a witty roaster. Humorous, insightful, and actionable.` },
      pragmaticProblemSolver: { prompt: `You are a pragmatic problem solver. No fluff; simple steps.` },
      highSchoolCoach: { prompt: `You are a motivational coach. Encourage with practical actions.` }
    };
    if (!agents[selectedAgent]) {
      return res.status(400).json({ error: `Invalid agent. Choose: ${Object.keys(agents).join(', ')}` });
    }

    // Character budget allocation
    const TOTAL = Math.max(900, Math.min(Number(charLimit) || 2200, 2800));
    const MAIN = Math.round(TOTAL * 0.9);
    const budgets = {
      snapshot: Math.round(MAIN * 0.25),
      strength: Math.round(MAIN * 0.20),
      blindSpots: Math.round(MAIN * 0.30),
      growthSpark: Math.round(MAIN * 0.25),
      societalNorms: Math.max(
        120,
        TOTAL - (
          Math.round(MAIN * 0.25) +
          Math.round(MAIN * 0.20) +
          Math.round(MAIN * 0.30) +
          Math.round(MAIN * 0.25)
        )
      )
    };

    const SOCIETAL_NORMS_LIST = [
      "A good fit is subservient to skill proficiency",
      "If you want something done right, do it yourself",
      "A visible reaction reminds employees that my job is more stressful than theirs",
      "Don’t question the bosses/leadership’s decisions",
      "Leaders have the answers/solve problems",
      "Outcomes are performance metrics",
      "Don’t acknowledge weakness",
      "Blanket corrections are acceptable and effective",
      "Vulnerability makes you soft",
      "Work and personal are segregated realities",
      "My team knows they are integral to the work",
      "My team knows what matters...they are adults",
      "Sit down feedback is reserved for correction and direction",
      "We all know what went wrong, talking about it slows us down",
      "You can affirm too much",
      "Putting “people first” doesn’t include swift dismissal",
      "Too much bonding makes a team complacent",
      "Affirmation to a “bad employee” will make them worse",
      "Cliche one-liners are futile or childish",
      "An “open-door policy” makes me available"
    ];

    // Clean identity text
    const cleanIdentity = String(agentIdentity || '').replace(/\r/g, '').trim();

    // Prompts
    const systemPrompt = `
${agents[selectedAgent].prompt}

You are the LEP Agent—built to translate a leader’s intake into concise,
actionable guidance that improves day-to-day leadership and team outcomes.
This includes all intake form data, including industry, demographic, and user data.
We want the summary to align to their specific leadership experience.
Use AGENT_IDENTITY (below) as the source of boundaries and operating philosophy.
Do not quote AGENT_IDENTITY; apply it implicitly and consistently.

Produce exactly three paragraphs (no headings or bullets), in this order:

1) Momentum — (~${budgets.snapshot + budgets.strength} chars)
   A tight synthesis of current leadership posture and what’s working.
   Highlight concrete signals of momentum and credible strengths (briefly).

2) Blind Spots — (~${budgets.blindSpots} chars)
   The most material risks or patterns likely to undermine outcomes. Pick one (or two if correlated) leadership trait to hone in on as a likely opportunity for growth. Ensure that you share examples of how this commonly materializes in leadership.

3) Growth Spark — (~${budgets.growthSpark} chars)
   1-2 pragmatic actions the leader can start this week to make a positive impact on the listed (or implied) blindspots.

Write directly to “you.” Separate paragraphs with one blank line.

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();

// Call OpenAI
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  max_tokens: 800,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
});

const raw = completion?.choices?.[0]?.message?.content?.trim() || '';
const capped = enforceBudgets(raw, budgets);

return res.status(200).json({ aiSummary: capped, budgets });
  }
}
