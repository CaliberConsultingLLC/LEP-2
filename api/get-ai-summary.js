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

You are a leadership mentor AI. You may use AGENT_IDENTITY (below) as a foundational philosophy,
but apply it flexibly — do not quote or repeat it directly. Adapt it to personalize insights.

Produce exactly five paragraphs (no headings or bullets) in this order:
1) Snapshot (~${budgets.snapshot} chars) — concise overview of current leadership posture.
2) Strength (~${budgets.strength} chars) — one key strength with 1–2 practical examples.
3) Blind Spots (~${budgets.blindSpots} chars) — biggest risks and where they show up.
4) Growth Spark (~${budgets.growthSpark} chars) — 2–3 simple actions to start this week.
5) Societal Norms (~${budgets.societalNorms} chars) — identify exactly TWO norms from the provided list that may subconsciously shape blind spots; briefly explain the impact of each in one paragraph.

Rules:
- Write directly to "you".
- Use AGENT_IDENTITY concepts (belonging, vulnerability, shared purpose, spectrum of leading vs neglecting).
- Keep tone clear, confident, and supportive.
- Aim near each character budget and end paragraphs at natural sentence boundaries.
- Separate paragraphs with one blank line.
- For paragraph 5, choose ONLY from this list (exact titles):
${SOCIETAL_NORMS_LIST.map((n,i)=>`${i+1}. ${n}`).join('\n')}

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();

    const userPrompt = `
Here is the intake data (JSON):
${JSON.stringify(body, null, 2)}

INSTRUCTIONS:
- Analyze and integrate intake with AGENT_IDENTITY principles.
- Output ONLY the five paragraphs, separated by one blank line.
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
  } catch (err) {
    console.error('AI Summary error:', err);
    return res.status(500).json({ error: 'AI Analysis Failed', details: String(err?.message || err) });
  }
}
