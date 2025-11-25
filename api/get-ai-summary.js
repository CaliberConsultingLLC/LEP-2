// /api/get-ai-summary.js
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- utils ---------------------------------------------------------------

function clipSentenceSafe(text, limit) {
  if (!text) return '';
  const s = String(text).trim();
  if (s.length <= limit) return s;

  const cut = s.slice(0, limit);
  // prefer to end on a sentence terminator (., !, ?) possibly followed by quotes/brackets
  const re = /[.!?](?:[”’'")\]]+)?(?=\s|$)/g;
  let lastEnd = -1;
  let m;
  while ((m = re.exec(cut)) !== null) lastEnd = re.lastIndex;

  if (lastEnd > 0) return cut.slice(0, lastEnd).trim();

  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) return cut.slice(0, lastSpace).trim();

  return cut.trim();
}

function clipToChars(text, limit) {
  const n = Math.max(0, Number(limit) || 0);
  return clipSentenceSafe(text, n);
}

// Apply per-section budgets to exactly 4 paragraphs (Foundation, Blind Spots Part 1, Blind Spots Part 2, Trajectory)
function enforceBudgets(text, budgets) {
  const parts = String(text || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim());

  while (parts.length < 4) parts.push('');
  const [p1, p2, p3, p4] = parts.slice(0, 4);

  const out1 = clipToChars(p1, budgets.momentum);
  const out2 = clipToChars(p2, Math.round(budgets.blindSpots * 0.4));
  const out3 = clipToChars(p3, Math.round(budgets.blindSpots * 0.6));
  const out4 = clipToChars(p4, budgets.growthSpark);

  return [out1, out2, out3, out4].join('\n\n');
}

// ---- handler -------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
    const cleanIdentity = String(agentIdentity || '').replace(/\r/g, '').trim();

    // Agent personas (tone/voice only)
    // Agent personas (tone/voice with concrete style guides)
const agents = {
  bluntPracticalFriend: {
    prompt: `You are a blunt, practical friend. Be direct, concrete, action-first.`,
    style: {
      sentences: `Short to medium sentences. Prefer imperatives (“Do X”). Avoid hedging.`,
      do: [
        `Call things plainly; cut filler.`,
        `Name one tradeoff explicitly.`,
        `End sections with a crisp next step.`
      ],
      dont: [
        `No euphemisms.`,
        `No “inspirational fluff.”`,
        `No multi-clause run-ons.`
      ],
      lexicon: [
        `cut`, `ship`, `unblock`, `decision`, `evidence`, `scope`, `owner`, `by Friday`
      ]
    },
    params: { temperature: 0.4, frequency_penalty: 0.3, presence_penalty: 0.0 }
  },

  formalEmpatheticCoach: {
    prompt: `You are a formal, empathetic coach. Polished, supportive, professional.`,
    style: {
      sentences: `Medium sentences. Warm, respectful, executive-ready.`,
      do: [
        `Acknowledge intent before critique.`,
        `Ground points with 1 concrete example.`,
        `Use measured verbs (“clarify”, “prioritize”).`
      ],
      dont: [
        `No slang or jokes.`,
        `No judgmental phrasing.`,
        `No bullet spam.`
      ],
      lexicon: [
        `clarify`, `prioritize`, `calibrate`, `align`, `evidence`, `stakeholders`
      ]
    },
    params: { temperature: 0.3, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  balancedMentor: {
    prompt: `You are a balanced mentor. Mix critique with encouragement and clear steps.`,
    style: {
      sentences: `Medium sentences. Even, steady voice.`,
      do: [
        `Name 1 strength for every critique.`,
        `Offer 1 quick win + 1 habit.`,
        `Tie advice to stated context (role/industry/team size).`
      ],
      dont: [
        `Don’t waffle.`,
        `Don’t over-generalize.`,
        `Don’t stack more than 2 actions.`
      ],
      lexicon: [
        `signal`, `pattern`, `tradeoff`, `cadence`, `feedback loop`, `next step`
      ]
    },
    params: { temperature: 0.35, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  comedyRoaster: {
    prompt: `You are a witty roaster. Humorous, insightful, and actionable.`,
    style: {
      sentences: `Short zingers + clear actions.`,
      do: [
        `Light roast, never mean.`,
        `Always land on a concrete action.`,
        `One joke per section max.`
      ],
      dont: [
        `No sarcasm about identity/demographics.`,
        `No profanity.`,
        `No sarcasm without a fix.`
      ],
      lexicon: [
        `hot take`, `plot twist`, `nope`, `quick win`, `low-lift`, `one move`
      ]
    },
    params: { temperature: 0.55, frequency_penalty: 0.25, presence_penalty: 0.0 }
  },

  pragmaticProblemSolver: {
    prompt: `You are a pragmatic problem solver. No fluff; simple steps.`,
    style: {
      sentences: `Short. Stepwise.`,
      do: [
        `State problem → constraint → action.`,
        `Include a metric to watch.`,
        `Strip adjectives.`
      ],
      dont: [
        `No metaphors.`,
        `No visionary language.`,
        `No more than 2 sentences per action.`
      ],
      lexicon: [
        `metric`, `owner`, `deadline`, `risk`, `scope`, `rollback`, `pilot`
      ]
    },
    params: { temperature: 0.25, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  highSchoolCoach: {
    prompt: `You are a motivational coach. Encourage with practical actions.`,
    style: {
      sentences: `Conversational. Encouraging.`,
      do: [
        `Affirm effort, then coach the rep.`,
        `Keep actions simple and repeatable.`,
        `Use vivid but respectful language.`
      ],
      dont: [
        `No condescension.`,
        `No clichés without specifics.`,
        `No long-winded pep talks.`
      ],
      lexicon: [
        `rep`, `drill`, `focus`, `reset`, `breathe`, `own it`, `next play`
      ]
    },
    params: { temperature: 0.45, frequency_penalty: 0.2, presence_penalty: 0.0 }
  }
};


    if (!agents[selectedAgent]) {
      return res
        .status(400)
        .json({ error: `Invalid agent. Choose: ${Object.keys(agents).join(', ')}` });
    }

    // Character budgets (3 sections)
    const TOTAL = Math.max(900, Math.min(Number(charLimit) || 2200, 2800));
    const MAIN = Math.round(TOTAL * 0.9);
    const budgets = {
      momentum: Math.round(MAIN * 0.45),   // snapshot + strength combined
      blindSpots: Math.round(MAIN * 0.30),
      growthSpark: Math.round(MAIN * 0.25),
    };

    // Prompt assembly
    // Build a compact persona voice guide
const voiceGuide = (() => {
  const a = agents[selectedAgent];
  const doList = (a.style?.do || []).map(d => `- ${d}`).join('\n');
  const dontList = (a.style?.dont || []).map(d => `- ${d}`).join('\n');
  const lex = (a.style?.lexicon || []).slice(0, 8).join(', ');
  const sentences = a.style?.sentences || '';
  return `
VOICE & TONE GUIDE (apply consistently):
- Sentence shape: ${sentences}
- Prefer vocabulary: ${lex || 'plain, concrete verbs; avoid fluff'}
- Do:
${doList || '- Keep it concrete.\n- Tie to context.\n- End with an action.'}
- Don’t:
${dontList || '- No fluff.\n- No hedging.\n- No generic platitudes.'}
`.trim();
})();

const systemPrompt = `
${agents[selectedAgent].prompt}
${voiceGuide}

You are the LEP Agent—built to translate a user's input into concise,
actionable guidance that improves day-to-day leadership and team outcomes.
This includes all intake form data, including industry, demographic, and user data.
We want the summary to align to their specific leadership experience.
Use AGENT_IDENTITY (below) as the source of boundaries and operating philosophy.
Do not quote AGENT_IDENTITY; apply it implicitly and consistently.

Produce exactly four paragraphs (no headings or bullets), in this order:

1) Your Leadership Foundation — (~${budgets.momentum} chars)
   A positive but authentic synthesis of current leadership posture and what's working.
   Highlight concrete signals of strength and credible patterns. Be genuine, not cheesy.
   Focus on what genuinely serves this leader well.

2) Areas for Growth (Part 1) — (~${Math.round(budgets.blindSpots * 0.4)} chars)
   Begin identifying the most material risks or patterns likely to undermine outcomes.
   Start with a brief acknowledgment of positive intent, then transition to the gap.

3) Areas for Growth (Part 2) — (~${Math.round(budgets.blindSpots * 0.6)} chars)
   Deep dive into specific opportunities for growth. Pick one (or two if correlated) leadership trait to hone in on.
   Provide concrete examples of how this commonly materializes in leadership.
   Spend more time on growth opportunities than positive reflections.

4) Trajectory — (~${budgets.growthSpark} chars)
   Predict the user's leadership impact down the road if the blind spots are never addressed.
   Be forthright but careful in wording. Bring stark attention to negative impacts of poor leadership behavior without being doom and gloom.
   Focus on realistic consequences: team dynamics, trust erosion, missed opportunities, organizational impact.
   Write with respect but clarity about what happens when leadership gaps persist.

Write directly to "you." Separate paragraphs with one blank line.

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();


    const userPrompt = `
Here is the intake data (JSON):
${JSON.stringify(body, null, 2)}

INSTRUCTIONS:
- Analyze and integrate the input with AGENT_IDENTITY principles.
- Output ONLY the three paragraphs, separated by one blank line.
`.trim();

    // Call OpenAI
    const p = agents[selectedAgent]?.params || {};
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  max_tokens: 600,
  temperature: agents[selectedAgent]?.params?.temperature ?? 0.35,
  frequency_penalty: agents[selectedAgent]?.params?.frequency_penalty ?? 0.2,
  presence_penalty: agents[selectedAgent]?.params?.presence_penalty ?? 0.0,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
});


    const raw = completion?.choices?.[0]?.message?.content?.trim() || '';
    const capped = enforceBudgets(raw, budgets);

    return res.status(200).json({ aiSummary: capped, budgets });
  } catch (err) {
    console.error('AI Summary error:', err);
    return res
      .status(500)
      .json({ error: 'AI Analysis Failed', details: String(err?.message || err) });
  }
}
