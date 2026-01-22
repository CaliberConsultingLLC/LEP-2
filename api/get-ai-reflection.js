import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
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
      prompt: `You are a blunt, practical friend. Direct, action-first, no fluff.`,
      params: { temperature: 0.7, frequency_penalty: 0.3, presence_penalty: 0.2 },
    };

    const reflectionNumber = body.reflectionNumber || 1;
    
    let systemPrompt = '';
    if (reflectionNumber === 1) {
      systemPrompt = `
${agent.prompt}
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style.

You've just reviewed their energy-related responses: what drains them (energyDrains) and what energizes them (leaderFuel).

Your job: deliver ONE short, punchy insight (under 250 characters) that synthesizes these two responses together to reveal a fresh perspective. DO NOT simply restate what they said. Instead, connect the dots between what drains them and what energizes them to reveal something they might not have noticed.

FOCUS:
- Use ONLY their energyDrains (situations they want to minimize) and leaderFuel (outcomes that energize them most)
- SYNTHESIZE the two responses - find the connection, pattern, or tension between them
- Provide a NEW perspective that they might not have considered
- Reveal what these two responses say about their leadership energy patterns when viewed together

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
- NO direct restatement of their answers
- NO generic observations
- Must synthesize both responses into a new insight
- Be punchy and fresh

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();
    } else {
      systemPrompt = `
${agent.prompt}
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style.

You've just reviewed their warning label (what their leadership style warns about) and their highlight reel (a significant team accomplishment).

Your job: deliver ONE short, punchy insight (under 250 characters) that synthesizes these two responses together to reveal a fresh perspective. DO NOT simply restate what they said. Instead, connect the dots between their warning label and their proud moment to reveal something they might not have noticed.

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
    return res.status(500).json({ error: 'Reflection AI Failed', details: String(err.message || err) });
  }
}
