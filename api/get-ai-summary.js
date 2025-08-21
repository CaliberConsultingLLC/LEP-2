// api/get-ai-summary.js
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sentence-safe clip: prefer last sentence end (., !, ?) before limit; else last space; else hard cut.
function clipSentenceSafe(text, limit) {
  if (!text) return '';
  const s = text.trim();
  if (s.length <= limit) return s;
  const cut = s.slice(0, limit);

  // Find last sentence terminator within limit (handles quotes/brackets after punctuation)
  const re = /[.!?](?:[”’'")\]]+)?(?=\s|$)/g;
  let lastEnd = -1;
  let m;
  while ((m = re.exec(cut)) !== null) lastEnd = re.lastIndex;

  if (lastEnd > 0) return cut.slice(0, lastEnd).trim();

  // Fallback: last whitespace
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) return cut.slice(0, lastSpace).trim();

  // Final fallback: hard cut
  return cut.trim();
}

function enforceBudgets(text, budgets) {
  const parts = text.split(/\n\s*\n/).map(s => s.trim());
  while (parts.length < 4) parts.push('');
  const [p1, p2, p3, p4] = parts.slice(0, 4);

  const out1 = clipSentenceSafe(p1, budgets.snapshot);
  const out2 = clipSentenceSafe(p2, budgets.strength);
  const out3 = clipSentenceSafe(p3, budgets.blindSpots);
  const out4 = clipSentenceSafe(p4, budgets.growthSpark);

  return [out1, out2, out3, out4].join('\n\n');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = req.body || {};
    const { selectedAgent = 'balancedMentor', charLimit } = body;

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

    // DEFAULT TOTAL = 2000 (safe range 800–2600)
    const TOTAL = Math.max(800, Math.min(Number(charLimit) || 2000, 2600));
    const budgets = {
      snapshot: Math.round(TOTAL * 0.25),
      strength: Math.round(TOTAL * 0.20),
      blindSpots: Math.round(TOTAL * 0.30),
      growthSpark: Math.round(TOTAL * 0.25)
    };

    const systemPrompt = `
${agents[selectedAgent].prompt}

Produce exactly four paragraphs (no headings or bullets):
1) Snapshot (~${budgets.snapshot} chars)
2) Strength (~${budgets.strength} chars)
3) Blind Spots (~${budgets.blindSpots} chars)
4) Growth Spark (~${budgets.growthSpark} chars)

Rules:
- Write directly to "you".
- Aim near the character budgets.
- End each paragraph at a natural sentence boundary.
- Separate paragraphs with one blank line.
    `.trim();

    const userPrompt =
      'Analyze this leadership intake data and produce the four paragraphs:\n' +
      JSON.stringify(body);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 700, // allows ~2000 chars comfortably
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
