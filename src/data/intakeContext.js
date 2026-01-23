export const SOCIETAL_NORM_RULES = {
  scale: {
    1: 'Never',
    2: 'Rarely',
    3: 'Seldom',
    4: 'Occasionally',
    5: 'Sometimes',
    6: 'Often',
    7: 'Usually',
    8: 'Frequently',
    9: 'Almost Always',
    10: 'Always',
  },
  reverseFormula: 'reverse_score = 11 - raw_score',
  threshold: 3,
  refinementRange: { min: 4, max: 5 },
};

export const SOCIETAL_NORM_ITEMS = [
  {
    id: 'norm_leader_answers_1',
    statement: 'When challenges arise, I share the answer from my experience and expertise.',
    displayTemplate: 'When challenges arise, I ____ share the answer from my experience and expertise.',
    reverse: true,
    normDriver: 'Leaders have the answers/solve problems',
    traitsUndermined: ['Courage'],
  },
  {
    id: 'norm_visible_reaction',
    statement: 'I visibly react before I respond to difficult or bad news that is shared with me about the company',
    displayTemplate: 'I ____ visibly react before I respond to difficult or bad news that is shared with me about the company.',
    reverse: true,
    normDriver: 'A visible reaction reminds employees that my job is more stressful than theirs',
    traitsUndermined: ['Shepherd', 'Courage'],
    interpretationNote:
      'Low score after reverse suggests risk of visible overreaction or emotional deadness; balanced expression supports sharing.',
  },
  {
    id: 'norm_blanket_corrections',
    statement:
      'When the correction/learning from a team member’s mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.',
    displayTemplate:
      "When the correction/learning from a team member's mistake will benefit the whole team, I ____ address the entire team about it to ensure consistency.",
    reverse: true,
    normDriver: 'Blanket corrections are acceptable and effective',
    traitsUndermined: ['Shepherd', 'Courage'],
  },
  {
    id: 'norm_hiring_fit',
    statement: 'I am intentional about hiring employees that equally fit the need and the company culture and values.',
    displayTemplate: 'I ____ hire employees that equally fit the need and the company culture and values.',
    reverse: false,
    normDriver: 'A good fit is subservient to proficient skills',
    traitsUndermined: ['Shepherd', 'Navigator'],
  },
  {
    id: 'norm_dissent_growth',
    statement:
      'My response to dissenting viewpoints shows the team that challenging one another is good thing that leads to growth and innovation',
    displayTemplate:
      'My response to dissenting viewpoints ____ shows the team that challenging one another leads to growth and innovation.',
    reverse: false,
    normDriver: 'Don’t question the bosses/leaderships’ decisions',
    traitsUndermined: ['Courage'],
  },
  {
    id: 'norm_one_liners',
    statement:
      'I am known among employees for one-line phrases like ‘do what’s right,’ ‘challenges mean learning,’ or ‘We’re in this together.’ Perhaps, jokes about it exist among employees.',
    displayTemplate:
      'I am ____ known among employees for one-line phrases like "do what’s right," "challenges mean learning," or "We’re in this together."',
    reverse: false,
    normDriver: 'Cliché one liners are futile or childish',
    traitsUndermined: ['Shepherd', 'Navigator'],
  },
  {
    id: 'norm_more_answers',
    statement: 'I have more answers than I do questions in our team discussions.',
    displayTemplate: 'I ____ have more answers than I do questions in our team discussions.',
    reverse: true,
    normDriver: 'Leaders have the answers/solve problems',
    traitsUndermined: ['Shepherd', 'Courage'],
  },
  {
    id: 'norm_metrics_control',
    statement:
      'It is important that our employee performance metrics are are directly connected to their work AND in their control.',
    displayTemplate:
      'It is ____ important that our employee performance metrics are directly connected to their work and in their control.',
    reverse: false,
    normDriver: 'Outcomes are performance metrics',
    traitsUndermined: ['Navigator'],
    interpretationNote:
      'Outcomes matter but are influenced by variables outside employee control; balance includes controllable behaviors and attitudes.',
  },
  {
    id: 'norm_repeat_vision',
    statement: 'I communicate processes, vision, and expectations so much that I am tired of hearing it.',
    displayTemplate:
      'I ____ communicate processes, vision, and expectations so much that I am tired of hearing it.',
    reverse: false,
    normDriver: 'My team knows what matters…they are adults',
    traitsUndermined: ['Navigator'],
    interpretationNote: 'Silence tells stories; people fill gaps with assumptions.',
  },
  {
    id: 'norm_share_struggles',
    statement: 'I openly share with my team when I am struggling professionally.',
    displayTemplate: 'When I am struggling professionally, I ____ openly share that information with my team.',
    reverse: false,
    normDriver: 'Don’t acknowledge weakness',
    traitsUndermined: ['Shepherd', 'Courage'],
  },
];

export const SOCIETAL_NORM_STATEMENTS = SOCIETAL_NORM_ITEMS.map((item) => item.statement);
export const SOCIETAL_NORM_DISPLAY_TEMPLATES = SOCIETAL_NORM_ITEMS.map((item) => item.displayTemplate);
export const SOCIETAL_NORM_REVERSE = SOCIETAL_NORM_ITEMS.filter((item) => item.reverse).map((item) => item.statement);

export const intakeContext = {
  societalNorms: {
    rules: SOCIETAL_NORM_RULES,
    items: SOCIETAL_NORM_ITEMS,
  },
};
