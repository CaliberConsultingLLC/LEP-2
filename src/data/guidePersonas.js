// Guide persona registry.
// Select / greet art: /public/guides/<file>.png (standard pose, transparent BG).
// Extra poses for Mentor / Catalyst / Challenger still live in /public/hero/
// until the full Guide Images set is wired.

const SELECT_ART = {
  mentor: '/Guide%20Images/Mentor_01.png',
  catalyst: '/Guide%20Images/Catalyst_01.png',
  challenger: '/Guide%20Images/Challenger_01.png',
  bestFriend: '/Guide%20Images/BestFriend_01.png',
  mother: '/Guide%20Images/Mother_01.png',
  roaster: '/Guide%20Images/Roaster_01.png',
};

const selectArt = (id) => SELECT_ART[id];

export const GUIDE_PERSONAS = [
  {
    id: 'mentor',
    name: 'Mentor',
    tagline: 'Warm. Grounded. Asks the quiet questions.',
    voice:
      'Speaks in long vowels. Invites reflection before action. Never rushes.',
    poses: {
      idle: selectArt('mentor'),
      greet: selectArt('mentor'),
      think: '/hero/MentorThink.png',
      map: '/hero/MentorMap.png',
      read: '/hero/MentorBook.png',
      lantern: '/hero/MentorLantern.png',
      page: '/hero/MentorPage.png',
    },
    accent: '#2F4A5C', // deep teal-blue — Mentor pendant
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    tagline: 'Energetic. Optimistic. Ships first drafts fast.',
    voice:
      'Short sentences. Celebrates momentum. Converts hesitation into action.',
    poses: {
      idle: selectArt('catalyst'),
      greet: selectArt('catalyst'),
      point: '/hero/CatalystPoint.png',
      pointUp: '/hero/CatalystPointUp.png',
      page: '/hero/CatalystPage.png',
      plain: '/hero/Catalyst.png',
    },
    accent: '#B8532C', // burnt orange / rust — Catalyst pendant
  },
  {
    id: 'challenger',
    name: 'Challenger',
    tagline: 'Direct. Honest. Won’t let you hide.',
    voice:
      'Plain words. Names the avoidance. Pushes you to commit before you feel ready.',
    poses: {
      idle: selectArt('challenger'),
      greet: selectArt('challenger'),
      armsCross: '/hero/ChallengeArmsCross.png',
      sign: '/hero/ChallengerSign.png',
      mad: '/hero/ChallengerMad.png',
    },
    accent: '#5A3C66', // deep plum — Challenger pendant
  },
  {
    id: 'bestFriend',
    name: 'Best Friend',
    tagline: 'Loyal. Easy company. Says the hard thing kindly.',
    voice:
      'Talks like someone who already knows your patterns. Keeps it human, never clinical.',
    poses: {
      idle: selectArt('bestFriend'),
      greet: selectArt('bestFriend'),
    },
    accent: '#1E6B75', // teal — Best Friend scarf / medallion
  },
  {
    id: 'mother',
    name: 'Mother',
    tagline: 'Steady care. Warm accountability.',
    voice:
      'Protective without soft-pedaling. Reminds you what matters and won’t let you abandon it.',
    poses: {
      idle: selectArt('mother'),
      greet: selectArt('mother'),
    },
    accent: '#C47A6A', // peach / rose — Mother shawl / medallion
  },
  {
    id: 'roaster',
    name: 'Roaster',
    tagline: 'Sharp humor. Cuts through the spin.',
    voice:
      'Needles the ego so the truth can land. Funny on purpose — never cruel without a point.',
    poses: {
      idle: selectArt('roaster'),
      greet: selectArt('roaster'),
    },
    accent: '#A33A32', // deep red — Roaster scarf / medallion
  },
];

/** Selectable guides only (excludes placeholders). */
export const SELECTABLE_GUIDE_PERSONAS = GUIDE_PERSONAS.filter((p) => !p.placeholder);

export const DEFAULT_GUIDE_ID = 'mentor';

export const getPersona = (id) =>
  SELECTABLE_GUIDE_PERSONAS.find((p) => p.id === id)
  || GUIDE_PERSONAS.find((p) => p.id === id)
  || SELECTABLE_GUIDE_PERSONAS[0];
