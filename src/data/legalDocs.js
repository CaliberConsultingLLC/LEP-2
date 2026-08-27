import { SUPPORT_EMAIL } from './supportLinks';

export const LEGAL_DOCS = [
  {
    id: 'terms',
    title: 'Terms of Use',
    body: [
      'Compass is an AI-powered independent development plan (IDP) for how you lead. By creating an account you agree to use it for lawful professional development, keep your login secure, and not misuse generated guidance.',
      'Compass is decision support and reflection — not legal, medical, or HR advice. Leadership decisions remain yours.',
      'The methodology, assessments, written reflections, campaign materials, and guide voices are proprietary to North Star Partners. You may not copy, scrape, or redistribute them.',
      'We may suspend access that puts other users, team anonymity, or the service at risk.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    body: [
      'Compass collects the profile and assessment data you provide so we can generate your reflection, campaign, and dashboard. That record belongs to you as the leader on the account.',
      'Your reflection, scores, and gaps are not shared with your boss, executive team, or HR by Compass. If they are shared, you shared them.',
      'Team survey answers are stored as an aggregate you can read. Compass does not show you who said what.',
      'We use account data to operate the product, send transactional email (welcome, campaign complete), and improve quality. We do not sell your data.',
      `Questions about your data: ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    id: 'survey',
    title: 'Team survey & anonymity',
    body: [
      'After your self-assessment you send a separate link to your team. They answer the same observable statements you did. The survey is short and does not require a Compass account.',
      'You see counts and combined scores — never individual responses, names, or emails attached to answers.',
      'More responses make a steadier Signal. If only a few people answer, treat the pattern as a sketch, not a conclusion.',
      'Once you accept no more answers (or the expected team count is in), the campaign locks and the dashboard can calculate. Locked surveys reject new submits.',
    ],
  },
  {
    id: 'support',
    title: 'How to get support',
    body: [
      `Email ${SUPPORT_EMAIL}. Include the email on your Compass account and what you were doing when something broke.`,
      'We can help with sign-in, the team survey link, and reading the dashboard. We cannot recover anonymous team answers or tell you who said what.',
      'Account and product questions go to that inbox. It is also the address on the welcome email.',
    ],
  },
];

export function legalDocById(id) {
  return LEGAL_DOCS.find((doc) => doc.id === id) || LEGAL_DOCS[0];
}

export function legalParagraphs(id) {
  return legalDocById(id).body;
}
