import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { aiSummary } = req.body || {};
  if (!aiSummary) {
    return res.status(400).json({ error: 'aiSummary is required' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `
    Generate a continuous improvement campaign with 5 leadership traits, each with 3 survey statements. Statements should be framed for the user to answer about their leader (the original user). Each statement must be a clear, fully articulated sentence (8-12 words), focused on the leadership trait, and independently answerable on a dual-dimension axis of Effort and Efficacy (the user must be able to answer "Are they intentional/giving effort?" and "Are they effective/meeting my needs?"). Avoid short quips; ensure each statement is a complete, standalone sentence. Return the output as a raw JSON array of objects with "trait" (string) and "statements" (array of 3 strings). Do not include Markdown, backticks, or extra text. Example: [{"trait": "Strategic Planning", "statements": ["They plan projects with clear steps.", "They anticipate risks before issues arise.", "They set achievable goals for the team."]}]. Use this leadership summary: ${aiSummary}
    `
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }

    let campaign;
    try {
      // Strip potential Markdown formatting (e.g., ```json and newlines)
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      }
      campaign = JSON.parse(cleanedContent);
      if (!Array.isArray(campaign) || campaign.length !== 5 || !campaign.every(item => item.trait && Array.isArray(item.statements) && item.statements.length === 3)) {
        throw new Error('Invalid campaign format');
      }
    } catch (parseError) {
      throw new Error('Failed to parse OpenAI response as JSON: ' + parseError.message);
    }

    res.status(200).json({ campaign });
  } catch (error) {
    console.error('Error in get-campaign:', error);
    res.status(500).json({ error: 'Failed to generate campaign: ' + error.message });
  }
};