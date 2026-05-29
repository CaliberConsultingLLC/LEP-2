/**
 * Curated training and education recommendations per subtrait.
 * Used in the Practice "Root" card. Generic enough to be useful even when
 * the leader's exact subtrait isn't in the catalog.
 */

const DEFAULT_RECS = [
  {
    type: 'Read',
    title: 'The Score Takes Care of Itself',
    by: 'Bill Walsh',
    why: 'A standard of performance is built one observable behavior at a time.',
  },
  {
    type: 'Watch',
    title: 'Listen to Understand',
    by: 'Simon Sinek · 12 min',
    why: 'Most leadership friction starts before the work begins.',
  },
  {
    type: 'Practice',
    title: 'One Small Daily Reset',
    by: 'A 5-minute end-of-day note',
    why: 'Capture one moment you led well and one you would re-do.',
  },
];

const RECS_BY_SUBTRAIT = {
  Clarity: [
    {
      type: 'Read',
      title: 'Made to Stick · Chapter on Simple',
      by: 'Chip & Dan Heath',
      why: 'A clear message is one core thread, not three competing ones.',
    },
    {
      type: 'Watch',
      title: 'How to Give a Briefing in 90 Seconds',
      by: 'HBR · 9 min',
      why: 'Constraint forces structure. Structure produces clarity.',
    },
    {
      type: 'Practice',
      title: 'The One-Sentence Test',
      by: 'Before any meeting',
      why: 'If you cannot say the point in a sentence, you are not ready to say it at all.',
    },
  ],
  'Decision Quality': [
    {
      type: 'Read',
      title: 'Thinking in Bets',
      by: 'Annie Duke',
      why: 'Separate decision quality from outcome quality. The two are not the same.',
    },
    {
      type: 'Watch',
      title: 'How Amazon Decides · 6-pager system',
      by: 'Various · 14 min',
      why: 'Make the reasoning visible, then let the conversation refine it.',
    },
    {
      type: 'Practice',
      title: 'State Criteria Before You Decide',
      by: 'In your next decision meeting',
      why: 'Criteria first, options second. The order changes the conversation.',
    },
  ],
  Prioritization: [
    {
      type: 'Read',
      title: 'Essentialism',
      by: 'Greg McKeown',
      why: 'A disciplined "no" protects the few "yeses" that matter.',
    },
    {
      type: 'Watch',
      title: 'The Eisenhower Matrix in Practice',
      by: 'Productivity coach · 10 min',
      why: 'Urgent and important are not the same. Treat them differently.',
    },
    {
      type: 'Practice',
      title: 'Publish a "Not Doing" List',
      by: 'Once a week',
      why: 'Make the tradeoffs visible to your team — and to yourself.',
    },
  ],
  Communication: [
    {
      type: 'Read',
      title: 'Crucial Conversations',
      by: 'Patterson · Grenny · McMillan · Switzler',
      why: 'High-stakes talks rarely fail on content. They fail on safety.',
    },
    {
      type: 'Watch',
      title: 'The Art of the Second Question',
      by: 'TED · 11 min',
      why: 'The first question protects you. The second one opens the room.',
    },
    {
      type: 'Practice',
      title: 'Ask, Don\'t Tell, Once a Day',
      by: 'For one week',
      why: 'Find the conversation you usually steer, and let someone else steer it.',
    },
  ],
};

export function getRootRecommendations(subTraitName) {
  const key = String(subTraitName || '').trim();
  if (RECS_BY_SUBTRAIT[key]) return RECS_BY_SUBTRAIT[key];
  // Loose match by trait name (e.g. "Communication & Clarity" might match "Clarity")
  const loose = Object.keys(RECS_BY_SUBTRAIT).find((k) =>
    key.toLowerCase().includes(k.toLowerCase())
  );
  if (loose) return RECS_BY_SUBTRAIT[loose];
  return DEFAULT_RECS;
}
