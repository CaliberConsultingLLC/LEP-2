// /api/get-ai-summary.js
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { buildSummarySystemPrompt, buildSummaryUserPrompt } from './promptBuilder.js';
import traitSystem from '../src/data/traitSystem.js';
import { intakeContext } from '../src/data/intakeContext.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache AgentIdentity.txt at module scope to avoid re-reading on every request
let cachedAgentIdentity = '';
const identityPath = path.join(process.cwd(), 'api', 'AgentIdentity.txt');
try {
  cachedAgentIdentity = fs.readFileSync(identityPath, 'utf8').replace(/\r/g, '').trim();
} catch {
  cachedAgentIdentity = '';
}

// Norms context is centralized in src/data/intakeContext.js

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

function enforceThreeParagraphs(text, maxChars) {
  const parts = String(text || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  while (parts.length < 3) parts.push('');
  const total = Math.max(0, Number(maxChars) || 0);
  const firstBudget = Math.max(520, Math.floor(total * 0.32));
  const secondBudget = Math.max(520, Math.floor(total * 0.32));
  const thirdBudget = Math.max(520, total - firstBudget - secondBudget);
  const [p1, p2, p3] = parts.slice(0, 3);
  const out1 = clipToChars(p1, firstBudget);
  const out2 = clipToChars(p2, secondBudget);
  const out3 = clipToChars(p3, thirdBudget);
  return [out1, out2, out3].join('\n\n').trim();
}

function ensureFiveSubtraitBullets(text, focusAreas) {
  if (!Array.isArray(focusAreas) || focusAreas.length < 5) return text;
  const subtraits = focusAreas
    .map((a) => a?.subTraitName)
    .filter(Boolean)
    .slice(0, 5);
  if (!subtraits.length) return text;

  const sections = String(text || '').split(/\n\s*\n/);
  while (sections.length < 3) sections.push('');
  const lastIdx = sections.length - 1;
  const last = sections[lastIdx] || '';
  const lines = last.split('\n');
  const bullets = lines.filter((line) => line.trim().startsWith('- '));
  const narrative = lines.filter((line) => !line.trim().startsWith('- ')).join(' ').trim();

  const bulletMap = new Map();
  bullets.forEach((line) => {
    const content = line.replace(/^\s*-\s*/, '');
    const key = content.split('—')[0].trim().toLowerCase();
    if (key) bulletMap.set(key, line);
  });

  const shortSentence = (value) => {
    if (!value) return '';
    const match = String(value).match(/^[^.!?]+[.!?]?/);
    return match ? match[0].trim() : String(value).trim();
  };

  const focusMap = new Map();
  focusAreas.forEach((area) => {
    if (area?.subTraitName) {
      focusMap.set(area.subTraitName.toLowerCase(), area);
    }
  });

  const fallbackBehavior = (name) => {
    const area = focusMap.get(name.toLowerCase());
    const source = shortSentence(area?.impact) || shortSentence(area?.example) || shortSentence(area?.risk);
    const guidance = source || 'Small shifts here change how your team experiences your leadership.';
    return `- ${name} — ${guidance}`;
  };
  const finalBullets = subtraits.map((name) => {
    const key = name.toLowerCase();
    return bulletMap.get(key) || fallbackBehavior(name);
  });

  const rebuilt = `${narrative ? `${narrative}\n` : ''}${finalBullets.join('\n')}`.trim();
  sections[lastIdx] = rebuilt;
  return sections.join('\n\n').trim();
}


function buildFocusAreas(data) {
  const CORE_TRAITS = traitSystem?.CORE_TRAITS || [];
  if (!CORE_TRAITS.length) return [];

  const scores = {};
  CORE_TRAITS.forEach((trait) => { scores[trait.id] = 0; });

  const addScore = (traitId, weight = 1) => {
    if (!traitId || scores[traitId] == null) return;
    scores[traitId] += weight;
  };

  // ---- norms-based scoring ----
  const norms = Array.isArray(data?.societalResponses) ? data.societalResponses : [];
  const normItems = intakeContext?.societalNorms?.items || [];
  if (normItems.length && norms.length) {
    const traitMap = {
      Shepherd: 'teamDevelopment',
      Courage: 'emotionalIntelligence',
      Navigator: 'strategicThinking',
    };
    const scored = normItems.map((item, idx) => {
      const raw = Number(norms[idx]);
      const score = item.reverse ? (11 - raw) : raw;
      return { item, score };
    });
    let flagged = scored.filter((s) => s.score <= 3);
    if (!flagged.length) {
      flagged = scored.filter((s) => s.score >= 4 && s.score <= 5);
    }
    flagged.forEach(({ item, score }) => {
      const weight = score <= 3 ? (4 - score) : 1;
      (item.traitsUndermined || []).forEach((t) => addScore(traitMap[t], weight));
    });
  }

  // ---- behavior-based scoring ----
  const roleModelTraitMap = {
    communicated: 'communication',
    'made decisions': 'decisionMaking',
    'thought strategically': 'strategicThinking',
    'executed & followed through': 'execution',
    'developed their team': 'teamDevelopment',
    'shaped culture': 'teamDevelopment',
    'built relationships': 'emotionalIntelligence',
    'handled challenges': 'decisionMaking',
    'inspired others': 'teamDevelopment',
    'balanced priorities': 'strategicThinking',
  };
  addScore(roleModelTraitMap[data?.roleModelTrait], 2);

  if (data?.decisionPace?.includes('Fix')) addScore('execution', 1);
  if (data?.decisionPace?.includes('Feedback')) addScore('decisionMaking', 1);

  if (Array.isArray(data?.leaderFuel) && data.leaderFuel[0]) {
    const topFuel = data.leaderFuel[0];
    if (topFuel.includes('team gel') || topFuel.includes('learned') || topFuel.includes('recognition')) {
      addScore('teamDevelopment', 1);
    } else if (topFuel.includes('project') || topFuel.includes('chaos')) {
      addScore('execution', 1);
    } else if (topFuel.includes('problem')) {
      addScore('decisionMaking', 1);
    }
  }

  if (data?.visibilityComfort?.includes('spotlight')) addScore('communication', 1);
  if (data?.visibilityComfort?.includes('behind the scenes')) addScore('execution', 1);

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => CORE_TRAITS.find((t) => t.id === id))
    .filter(Boolean);

  const pickSubTrait = (trait) => {
    if (!trait?.subTraits?.length) return null;
    const key = JSON.stringify({
      role: data?.role || '',
      industry: data?.industry || '',
      trait: trait.id,
    });
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) % trait.subTraits.length;
    }
    return trait.subTraits[hash] || trait.subTraits[0];
  };

  const generatedAreas = ranked.slice(0, 5).map((trait) => {
    const subTrait = pickSubTrait(trait);
    if (!subTrait) return null;
    const example = subTrait.riskSignals?.underuse?.[0]
      || `Struggling with ${subTrait.name.toLowerCase()} can show up in day-to-day execution.`;
    const risk = subTrait.riskSignals?.underuse?.[1] || example;
    const impact = subTrait.impact
      || `Improving ${subTrait.name.toLowerCase()} can strengthen trust, alignment, and outcomes.`;
    return {
      id: `${trait.id}-${subTrait.id}`,
      traitName: trait.name,
      traitDefinition: trait.definition || trait.description,
      subTraitName: subTrait.name,
      subTraitDefinition: subTrait.definition || subTrait.shortDescription,
      example,
      risk,
      impact,
    };
  }).filter(Boolean);

  return generatedAreas.slice(0, 5);
}

/**
 * Apply per-section budgets to exactly 4 paragraphs (canonical format):
 * [0] Your Leadership Foundation
 * [1] Areas for Growth (Part 1)
 * [2] Areas for Growth (Part 2)
 * [3] Trajectory
 */
function enforceBudgets(text, budgets) {
  const parts = String(text || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim());

  while (parts.length < 4) parts.push('');
  const [p1, p2, p3, p4] = parts.slice(0, 4);

  const out1 = clipToChars(p1, budgets.foundation);
  const out2 = clipToChars(p2, budgets.growthPart1);
  const out3 = clipToChars(p3, budgets.growthPart2);
  const out4 = clipToChars(p4, budgets.trajectory);

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
    
    // Input validation: ensure body is an object
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body: must be an object' });
    }
    
    const { selectedAgent = 'balancedMentor', charLimit } = body;
    
    // Log missing expected fields (non-blocking)
    if (!body.societalResponses && !body.selectedAgent) {
      console.warn('get-ai-summary: Missing expected fields (societalResponses, selectedAgent)');
    }
    
    // Use cached Agent Identity (loaded at module scope)
    const cleanIdentity = cachedAgentIdentity;

    // Agent personas (tone/voice only)
    // Agent personas (tone/voice with concrete style guides)
const agents = {
  bluntPracticalFriend: {
    prompt: `You are a blunt, practical friend. Be direct, concrete, and no-fluff.`,
    style: {
      sentences: `Short to medium sentences. Declarative and crisp.`,
      do: [
        `Call things plainly; cut filler.`,
        `Name one tradeoff explicitly.`,
        `Keep it grounded in context.`
      ],
      dont: [
        `No euphemisms.`,
        `No “inspirational fluff.”`,
        `No multi-clause run-ons.`
      ],
      lexicon: [
        `cut`, `clarity`, `decision`, `evidence`, `scope`, `boundary`, `tradeoff`
      ]
    },
    params: { temperature: 0.4, frequency_penalty: 0.3, presence_penalty: 0.0 }
  },

  formalEmpatheticCoach: {
    prompt: `You are a formal, empathetic guide. Polished, supportive, professional.`,
    style: {
      sentences: `Medium sentences. Warm, respectful, executive-ready.`,
      do: [
        `Acknowledge intent before critique.`,
        `Ground points with 1 concrete example.`,
        `Use measured verbs (“clarify”, “align”).`
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
    prompt: `You are a balanced mentor. Mix critique with encouragement and calm clarity.`,
    style: {
      sentences: `Medium sentences. Even, steady voice.`,
      do: [
        `Name 1 strength for every critique.`,
        `Tie observations to stated context (role/industry/team size).`,
        `Keep the tone steady and grounded.`
      ],
      dont: [
        `Don’t waffle.`,
        `Don’t over-generalize.`,
        `Don’t list steps or directives.`
      ],
      lexicon: [
        `signal`, `pattern`, `tradeoff`, `cadence`, `feedback loop`
      ]
    },
    params: { temperature: 0.35, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  comedyRoaster: {
    prompt: `You are a witty roaster. Humorous, insightful, and respectful.`,
    style: {
      sentences: `Short zingers + clear insights.`,
      do: [
        `Light roast, never mean.`,
        `Always land on a concrete insight.`,
        `One joke per paragraph max.`
      ],
      dont: [
        `No sarcasm about identity/demographics.`,
        `No profanity.`,
        `No sarcasm without insight.`
      ],
      lexicon: [
        `hot take`, `plot twist`, `nope`, `low-lift`, `one move`
      ]
    },
    params: { temperature: 0.55, frequency_penalty: 0.25, presence_penalty: 0.0 }
  },

  pragmaticProblemSolver: {
    prompt: `You are a pragmatic problem solver. No fluff; plain-spoken.`,
    style: {
      sentences: `Short. Plain.`,
      do: [
        `State problem → constraint → implication.`,
        `Include a concrete detail.`,
        `Strip adjectives.`
      ],
      dont: [
        `No metaphors.`,
        `No visionary language.`,
        `No step lists or directives.`
      ],
      lexicon: [
        `metric`, `risk`, `scope`, `constraint`, `signal`, `boundary`
      ]
    },
    params: { temperature: 0.25, frequency_penalty: 0.2, presence_penalty: 0.0 }
  },

  highSchoolCoach: {
    prompt: `You are an encouraging coach. Motivational, clear, and respectful.`,
    style: {
      sentences: `Conversational. Encouraging.`,
      do: [
        `Affirm effort, then mirror the pattern.`,
        `Keep language simple and repeatable.`,
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

    const maxChars = Math.max(1200, Math.min(Number(charLimit) || 1500, 1800));

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
${doList || '- Keep it concrete.\n- Tie to context.\n- End with a clear insight.'}
- Don’t:
${dontList || '- No fluff.\n- No hedging.\n- No generic platitudes.'}
`.trim();
})();

    const focusAreas = buildFocusAreas(body);

    const systemPrompt = buildSummarySystemPrompt({
      agentPrompt: agents[selectedAgent].prompt,
      voiceGuide,
      agentIdentity: cleanIdentity,
    });


    const userPrompt = buildSummaryUserPrompt(body, focusAreas);

    // Call OpenAI
    // max_tokens: 600 ≈ 2400 chars at ~4 chars/token, aligned with TOTAL budget of 2000 chars
    const p = agents[selectedAgent]?.params || {};
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  max_tokens: 750,
  temperature: agents[selectedAgent]?.params?.temperature ?? 0.35,
  frequency_penalty: agents[selectedAgent]?.params?.frequency_penalty ?? 0.2,
  presence_penalty: agents[selectedAgent]?.params?.presence_penalty ?? 0.0,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
});


    const raw = completion?.choices?.[0]?.message?.content?.trim() || '';
    const capped = ensureFiveSubtraitBullets(enforceThreeParagraphs(raw, maxChars), focusAreas);

    return res.status(200).json({ aiSummary: capped, maxChars, focusAreas });
  } catch (err) {
    console.error('AI Summary error:', err);
    return res
      .status(500)
      .json({ error: 'AI Analysis Failed', details: String(err?.message || err) });
  }
}
