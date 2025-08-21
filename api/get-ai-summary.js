// api/get-ai-summary.js
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Clip helper – stops at last space or period before the limit
function clipClean(s, n) {
  if (!s) return '';
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const lastPunct = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf(' '));
  return cut.slice(0, lastPunct > 0 ? lastPunct + 1 : n).trim();
}

// Enforce budgets per section
function enforceBudgets(text, budgets) {
  const parts = text.split(/\n\s*\n/).map(s => s.trim());
  while (parts.length < 4) parts.push('');
  const [p1, p2, p3, p4] = parts.slice(0, 4);
  const out1 = clipClean(p1, budgets.snapshot);
  const out2 = clipClean(p2, budgets.strength);
  const out3 = clipClean(p3, budgets.blindSpots);
  const out4 = clipClean(p4, budgets.growthSpark);
  return [out1, out2, out3, out4].join('\n\n');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { selectedAgent = 'balancedMentor', charLimit } = body;

    // Agent tones
    const agents = {
      bluntPracticalFriend: { prompt: `You are a blunt, practical friend. Be direct, concrete, and action-first.` },
      formalEmpatheticCoach: { prompt: `You are a formal, empathetic coach. Be polished, supportive, and professional.` },
      balancedMentor: { prompt: `You are a balanced mentor. Mix critique with encouragement and clear steps.` },
      comedyRoaster: { prompt: `You are a witty roaster. Be humorous but insightful and actionable.` },
      pragmaticProblemSolver: { prompt: `You are a pragmatic problem solver. No fluff—explain issues and steps simply.` },
      highSchoolCoach: { prompt: `You are a motivational coach. Encourage while giving simple, practical actions.` }
    };

    if (!agents[selectedAgent]) {
      return res.status(400).json({ error: `Invalid agent. Choose one of: ${Object.keys(agents).join(', ')}` });
    }

    // Larger budgets (default total 1600 instead of 1200)
    const TOTAL = Math.max(800, Math.min(Number(charLimit) || 1600, 2400));
    const budgets = {
      snapshot: Math.round(TOTAL * 0.25),
      strength: Math.round(TOTAL * 0.20),
      blindSpots: Math.round(TOTAL * 0.30),
      growthSpark: Math.round(TOTAL * 0.25)
    };

    const systemPrompt = `
${agents[selectedAgent].prompt}

Produce exactly four paragraphs.

FORMAT (no headings, no bullets):
1) Snapshot (~${budgets.snapshot} chars)
2) Strength (~${budgets.strength} chars)
3) Blind Spots (~${budgets.blindSpots} chars)
4) Growth Spark (~${budgets.growthSpark} chars)

Rules:
- Write directly to "you".
- Keep near the character budgets.
- End each paragraph at a natural stop (sentence or word).
- Separate paragraphs with one blank line.
`;

    const userPrompt = `Analyze this leadership intake data and produce the 4 paragraphs:\n${JSON.stringify(body)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 600, // allow for longer paragraphs
      messages: [
        { role: 'system', content: systemPrompt.trim() },
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
