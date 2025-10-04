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
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style and invites the user to pause and think.  
You’ve just reviewed half of their assessment responses.

Your job: deliver ONE short reflection (under 100 characters) to engage the user  
It should read like a moment of awareness — real, specific, and personal.

STRUCTURE:
1. Begin with a brief framing phrase (e.g. "Using your responses so far, let's pause and reflect...")
2. Follow with a direct insight that points to a pattern or energy balance in how they lead.
3. End with a question that draws them in — something that *invites engagement* rather than a yes/no answer.

TONE:
- Confident, conversational, human.
- Use real-world language, not corporate buzzwords.
- Feel like you’re talking *with* them, not *at* them.
- Keep curiosity alive: “What might shift if…” / “How would it feel if…” / “Where might that come from…”

RULES:
- Max 100 characters total.
- Reflect their behavioral tone, not surface details.
- Avoid generic praise, motivational quotes, or filler.
- Sound like someone who knows them — short, warm, and sharp.
- Consider their industry, leadership experience, job title, and other demographic info if it feels pertinent.
- 

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
    return res.status(500).json({ error: 'Reflection AI Failed', details: String(err.message || err) });
  }
}
