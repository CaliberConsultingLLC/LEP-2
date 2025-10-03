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
      params: { temperature: 0.4, frequency_penalty: 0.3, presence_penalty: 0.0 },
    };

    const systemPrompt = `
${agent.prompt}

You are the Compass Reflection Agent. Your job is to deliver ONE short, specific hook
that makes the user pause and reflect. They have completed half of the assessment so far, 
so we want to demonstrate value without providing solutions or definitive outcomes yet.
Consider all intake data from the user, using it to shape your hook so that the user sees a 
genuinely personalized and pertinent insight (not just a fortune cookie that applies to all)

RULES:
- Max 100 characters.
- Must tie directly to their behavior patterns (use role/team context if available).
- Voice: blunt, concrete, practical (never fluffy or generic).
- End with a question that invites thought (not yes/no).
- Purpose: intrigue the user and spark curiosity, not provide a solution.

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();

    const userPrompt = `Here is the intake data so far (profile + behaviors):\n${JSON.stringify(
      body,
      null,
      2
    )}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 100, // ~100 characters
      temperature: agent.params.temperature,
      frequency_penalty: agent.params.frequency_penalty,
      presence_penalty: agent.params.presence_penalty,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    let text = completion?.choices?.[0]?.message?.content?.trim() || '';
    // enforce 100 chars max
    if (text.length > 100) text = text.slice(0, 100).trim();

    return res.status(200).json({ reflection: text });
  } catch (err) {
    console.error('Reflection AI error:', err);
    return res
      .status(500)
      .json({ error: 'Reflection AI Failed', details: String(err?.message || err) });
  }
}
