import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function pickThemeFromDrains(drains = []) {
  const text = String((drains || []).join(' ').toLowerCase());
  if (!text) return 'constant uncertainty and emotional friction';
  if (/(conflict|mediating|concerns|unspoken|stakeholders)/.test(text)) return 'relational tension and unresolved people dynamics';
  if (/(changes|priorities|direction|goals|clear)/.test(text)) return 'ambiguity and shifting priorities';
  if (/(meetings|repeating|understanding|decode)/.test(text)) return 'communication loops that slow momentum';
  if (/(inconsistent|contributions|performance)/.test(text)) return 'inconsistent execution and accountability drag';
  return 'operational noise that drains your focus';
}

function pickAvoidancePattern(fuel = []) {
  const text = String((fuel || []).join(' ').toLowerCase());
  if (!text) return 'prolonged ambiguity where ownership stays unclear';
  if (/(team gel|learned|recognition|succeed together)/.test(text)) return 'disconnected team moments where alignment is weak';
  if (/(project|time|chaos|order|on time)/.test(text)) return 'unstructured situations where standards blur';
  if (/(problem no one else could|solving)/.test(text)) return 'shared problem-solving when roles are unclear';
  return 'situations that dilute clarity and collective ownership';
}

function buildFirstReflection(body) {
  const drainsTheme = pickThemeFromDrains(body?.energyDrains || []);
  const avoidTheme = pickAvoidancePattern(body?.leaderFuel || []);
  const sentence = `You are drained by ${drainsTheme} and seem to avoid ${avoidTheme}. That pattern can quietly narrow how boldly and consistently you lead.`;
  return sentence.length <= 250 ? sentence : sentence.slice(0, 247).trimEnd() + '...';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-ai-reflection',
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) {
      return;
    }
    const body = req.body || {};

    // Always use blunt friend
    const selectedAgent = 'bluntPracticalFriend';

    // load agent identity
    const identityPath = path.join(process.cwd(), 'api', 'AgentIdentity.txt');
    let agentIdentity = '';
    try {
      agentIdentity = fs.readFileSync(identityPath, 'utf8');
    } catch {}
    const cleanIdentity = String(agentIdentity || '').replace(/\r/g, '').trim();

    // Agent definition (subset: just bluntPracticalFriend)
    const agent = {
      prompt: `You are a blunt, practical friend. Direct, observational, no fluff.`,
      params: { temperature: 0.7, frequency_penalty: 0.3, presence_penalty: 0.2 },
    };

    const reflectionNumber = Number(body.reflectionNumber || 1);
    
    let systemPrompt = '';
    if (reflectionNumber === 1) {
      const deterministicObservation = buildFirstReflection(body);
      return res.status(200).json({ reflection: deterministicObservation });
    } else {
      systemPrompt = `
${agent.prompt}
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style.

You've just reviewed their warning label (what their leadership style warns about) and their highlight reel (a significant team accomplishment).

Your job: deliver ONE short, punchy observation (under 250 characters) that synthesizes these two responses together to reveal a fresh perspective. DO NOT simply restate what they said. Instead, connect the dots between their warning label and their proud moment to reveal something they might not have noticed.

FOCUS:
- Use ONLY their warningLabel (their leadership warning label) and proudMoment (their significant team accomplishment description)
- SYNTHESIZE the two responses - find the connection, pattern, or tension between them
- Provide a NEW perspective that they might not have considered
- Reveal what these two responses say about their leadership when viewed together

STRUCTURE:
- Start with an observation that connects both responses
- Reveal a pattern, tension, or insight that emerges when viewing them together
- Be punchy and fresh - avoid generic statements
- DO NOT end with a question - the only question is in the text box below

TONE:
- Confident, conversational, human.
- Use real-world language, not corporate buzzwords.
- Sharp and insightful - like you're pointing out something they didn't see
- Fresh perspective, not a restatement

RULES:
- Max 250 characters total.
- NO questions in the reflection text
- NO advice, coaching, or directives
- Avoid "should", "try", "consider", "need to", "must", "recommend"
- NO direct restatement of their answers
- NO generic observations
- Must synthesize both responses into a new insight
- Be punchy and fresh

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();
    }

    const userPrompt = `Here is the intake data so far (profile + behaviors):\n${JSON.stringify(
      body,
      null,
      2
    )}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 250, // ~250 characters
      temperature: agent.params.temperature,
      frequency_penalty: agent.params.frequency_penalty,
      presence_penalty: agent.params.presence_penalty,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    let text = completion?.choices?.[0]?.message?.content?.trim() || '';
    // enforce 250 chars max
    if (text.length > 250) text = text.slice(0, 250).trim();


    return res.status(200).json({ reflection: text });
  } catch (err) {
    return safeServerError(res, 'Reflection AI error:', err);
  }
}
