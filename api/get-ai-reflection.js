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

    const reflectionNumber = body.reflectionNumber || 1;
    
    let systemPrompt = '';
    if (reflectionNumber === 1) {
      systemPrompt = `
${agent.prompt}
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style.

You've just reviewed their energy-related responses: what drains them (energyDrains) and what energizes them (leaderFuel).

Your job: deliver ONE short reflection (under 250 characters) that reframes or rewords their energy responses without giving any inference or leading about impact.

FOCUS:
- Use ONLY their energyDrains (situations they want to minimize) and leaderFuel (outcomes that energize them most)
- Simply reframe or reword what they've shared about their energy patterns
- DO NOT make inferences about impact, team success, or outcomes
- DO NOT lead them toward any conclusions

STRUCTURE:
- Simply restate or reframe their energy patterns in a clear, direct way
- DO NOT end with a question - the only question is in the text box below

TONE:
- Confident, conversational, human.
- Use real-world language, not corporate buzzwords.
- Direct and factual - just reframing what they've shared

RULES:
- Max 250 characters total.
- NO questions in the reflection text
- NO inferences about impact or outcomes
- NO leading statements
- Just a reframing/rephrasing of their energy responses

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();
    } else {
      systemPrompt = `
${agent.prompt}
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style.

You've just reviewed their warning label (what their leadership style warns about) and their highlight reel (a significant team accomplishment).

Your job: deliver ONE short reflection (under 250 characters) that reframes or rewords their warning label and proud moment responses without giving any inference or leading about impact.

FOCUS:
- Use ONLY their warningLabel (their leadership warning label) and proudMoment (their significant team accomplishment description)
- Simply reframe or reword what they've shared about their warning label and proud moment
- DO NOT make inferences about risk, advantage, or how traits create challenges
- DO NOT lead them toward any conclusions about duality or impact

STRUCTURE:
- Simply restate or reframe their warning label and proud moment in a clear, direct way
- DO NOT end with a question - the only question is in the text box below

TONE:
- Confident, conversational, human.
- Use real-world language, not corporate buzzwords.
- Direct and factual - just reframing what they've shared

RULES:
- Max 250 characters total.
- NO questions in the reflection text
- NO inferences about risk, advantage, or impact
- NO leading statements about traits or behaviors
- Just a reframing/rephrasing of their warning label and proud moment responses

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
