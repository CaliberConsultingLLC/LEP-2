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
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style and invites the user to pause and think.  
You've just reviewed their energy-related responses: what drains them and what energizes them.

Your job: deliver ONE short reflection (under 250 characters) about how their energy level contributes to their team's success.
It should read like a moment of awareness — real, specific, and personal.

FOCUS:
- Use ONLY their energyDrains (situations they want to minimize) and leaderFuel (outcomes that energize them most)
- Generate insight about how their energy patterns impact the team
- Connect what drains them and what energizes them to team success

STRUCTURE:
1. Follow with a direct insight about how their energy management affects the team.
2. End with a question that draws them in — something that *invites engagement* rather than a yes/no answer.

TONE:
- Confident, conversational, human.
- Use real-world language, not corporate buzzwords.
- Feel like you're talking *with* them, not *at* them.
- Keep curiosity alive: "What might shift if…" / "How would it feel if…" / "Where might that come from…"

RULES:
- Max 250 characters total.
- Focus specifically on energy and team impact.
- Avoid generic praise, motivational quotes, or filler.
- Sound like someone who knows them — short, warm, and sharp.
- DO NOT include phrases like "Using your responses so far, let's pause and reflect..." or similar framing phrases.

=== AGENT_IDENTITY ===
${cleanIdentity}
=== END IDENTITY ===
`.trim();
    } else {
      systemPrompt = `
${agent.prompt}
You are the Compass Reflection Agent — a blunt, practical friend who notices patterns in leadership style and invites the user to pause and think.  
You've just reviewed their warning label (what their leadership style warns about) and their highlight reel (a significant team accomplishment).

Your job: deliver ONE short reflection (under 250 characters) about how poor behavior is often a corruption of a positive trait.
Help them understand the risk AND advantage of their behaviors.

FOCUS:
- Use ONLY their warningLabel (their leadership warning label) and proudMoment (their significant team accomplishment description)
- Connect their warning label to their proud moment - show how the same traits that create success can also create challenges
- Help them see that their strengths have both positive and negative expressions
- Generate insight about the risk AND advantage of their behaviors

STRUCTURE:
1. Follow with a direct insight connecting their warning label to their proud moment.
2. Show how the same traits create both success and challenges.
3. End with a question that draws them in — something that *invites engagement* rather than a yes/no answer.

TONE:
- Confident, conversational, human.
- Use real-world language, not corporate buzzwords.
- Feel like you're talking *with* them, not *at* them.
- Keep curiosity alive: "What might shift if…" / "How would it feel if…" / "Where might that come from…"

RULES:
- Max 250 characters total.
- Focus on the duality of their traits - both risk and advantage.
- Avoid generic praise, motivational quotes, or filler.
- Sound like someone who knows them — short, warm, and sharp.

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
