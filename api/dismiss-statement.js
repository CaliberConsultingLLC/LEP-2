import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { traitName, statementIndex, currentTraits, aiSummary } = req.body;

  if (!traitName || statementIndex === undefined || !currentTraits || !aiSummary) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('Dismissing statement for trait:', traitName, 'at index:', statementIndex);
    const trait = currentTraits.find(t => t.trait === traitName);
    if (!trait) {
      return res.status(400).json({ error: 'Trait not found' });
    }

    const currentStatement = trait.statements[statementIndex];
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: `
You are a leadership coach tasked with generating a new team-facing survey statement for a continuous improvement campaign. The statement should align with the given leadership trait and be suitable for rating on a dual-axis 9-box grid (Effort vs. Efficacy).

The response must be a single clean statement with no additional text, headers, or symbols:
- NO bullet points.
- NO asterisks.
- NO dashes.
- NO markdown symbols.
- ONLY the clean statement text.
`
        },
        {
          role: 'user',
          content: `Generate a new survey statement for the leadership trait "${traitName}" to replace the current statement "${currentStatement}". Base the new statement on the leadership analysis: ${aiSummary}.`
        }
      ]
    });

    const newStatement = response.choices[0].message.content.trim();
    console.log('New statement generated:', newStatement);

    const updatedTraits = currentTraits.map(trait => {
      if (trait.trait === traitName) {
        const newStatements = [...trait.statements];
        newStatements[statementIndex] = newStatement;
        return { ...trait, statements: newStatements };
      }
      return trait;
    });

    res.status(200).json({ campaign: updatedTraits });
  } catch (error) {
    console.error('Error dismissing statement:', error);
    res.status(500).json({ error: 'Failed to dismiss statement' });
  }
};