// Guide persona registry. Images live in /public/hero/.
// Each persona has several poses so the overlay can vary its look later.
// Keep poses lightweight — the full list of files for future animation:
//   Mentor:     MentorWave, MentorBook, MentorLantern, MentorMap,
//               MentorPage, MentorThink, MentorWave2
//   Catalyst:   Catalyst, CatalystIntro, CatalystPage, CatalystPoint,
//               CatalystPointUp, CatalystWave
//   Challenger: Challenger, ChallengeArmsCross, ChallengerMad,
//               ChallengerSign, ChallengerWave

export const GUIDE_PERSONAS = [
  {
    id: 'mentor',
    name: 'Mentor',
    tagline: 'Warm. Grounded. Asks the quiet questions.',
    voice:
      'Speaks in long vowels. Invites reflection before action. Never rushes.',
    // idle = default pose shown in the overlay
    // greet = used when persona is first selected / welcome state
    poses: {
      idle: '/hero/MentorWave.png',
      greet: '/hero/MentorWave2.png',
      think: '/hero/MentorThink.png',
      map: '/hero/MentorMap.png',
      read: '/hero/MentorBook.png',
      lantern: '/hero/MentorLantern.png',
      page: '/hero/MentorPage.png',
    },
    accent: '#2F4A5C', // deep teal-blue — sampled from Mentor's pendant
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    tagline: 'Energetic. Optimistic. Ships first drafts fast.',
    voice:
      'Short sentences. Celebrates momentum. Converts hesitation into action.',
    poses: {
      idle: '/hero/CatalystWave.png',
      greet: '/hero/CatalystIntro.png',
      point: '/hero/CatalystPoint.png',
      pointUp: '/hero/CatalystPointUp.png',
      page: '/hero/CatalystPage.png',
      plain: '/hero/Catalyst.png',
    },
    accent: '#B8532C', // burnt orange / rust — sampled from Catalyst's pendant
  },
  {
    id: 'challenger',
    name: 'Challenger',
    tagline: 'Direct. Honest. Won’t let you hide.',
    voice:
      'Plain words. Names the avoidance. Pushes you to commit before you feel ready.',
    poses: {
      idle: '/hero/ChallengerWave.png',
      greet: '/hero/Challenger.png',
      armsCross: '/hero/ChallengeArmsCross.png',
      sign: '/hero/ChallengerSign.png',
      mad: '/hero/ChallengerMad.png',
    },
    accent: '#5A3C66', // deep plum / purple — sampled from Challenger's pendant
  },
  // Placeholders — full personas coming soon
  {
    id: 'placeholder-scout',
    name: 'Scout',
    tagline: 'Curious. Forward-looking. Maps the next ridge.',
    voice: 'Coming soon — a guide who helps you spot what’s ahead.',
    poses: { idle: '/hero/MentorMap.png', greet: '/hero/MentorMap.png' },
    accent: '#3D6B5A',
    placeholder: true,
  },
  {
    id: 'placeholder-anchor',
    name: 'Anchor',
    tagline: 'Steady. Practical. Holds the line.',
    voice: 'Coming soon — a guide who keeps the work grounded.',
    poses: { idle: '/hero/MentorThink.png', greet: '/hero/MentorThink.png' },
    accent: '#4A5568',
    placeholder: true,
  },
  {
    id: 'placeholder-spark',
    name: 'Spark',
    tagline: 'Bold. Inventive. Starts the fire.',
    voice: 'Coming soon — a guide who pushes creative courage.',
    poses: { idle: '/hero/CatalystPointUp.png', greet: '/hero/CatalystPointUp.png' },
    accent: '#A05A2C',
    placeholder: true,
  },
];

/** Selectable guides only (excludes placeholders). */
export const SELECTABLE_GUIDE_PERSONAS = GUIDE_PERSONAS.filter((p) => !p.placeholder);

export const DEFAULT_GUIDE_ID = 'mentor';

export const getPersona = (id) =>
  SELECTABLE_GUIDE_PERSONAS.find((p) => p.id === id)
  || GUIDE_PERSONAS.find((p) => p.id === id)
  || SELECTABLE_GUIDE_PERSONAS[0];
