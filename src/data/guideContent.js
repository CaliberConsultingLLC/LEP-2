// Guide content registry.
//
// Structure per route key:
//   { title, mentor: [{text, pose, cta}, ...], catalyst: [...], challenger: [...] }
//
// Each persona gets 2–3 entries. The overlay rotates to a new entry on every
// route/tab change. `pose` maps to a key in the persona's `poses` object in
// guidePersonas.js — the overlay swaps the owl image accordingly.
//
// Persona display names are TBD ("Guide 1", "Guide 2", "Guide 3" in the UI)
// until final names are approved. Internally Mentor / Catalyst / Challenger
// remain as stable IDs.

export const GUIDE_CONTENT = {

  // ── Default fallback ────────────────────────────────────────────────────
  default: {
    title: 'A word before you start',
    mentor: [
      { text: 'Take a breath. You belong here. Nothing on this page needs to be perfect — it just needs to be honest.', pose: 'idle', cta: 'Okay' },
      { text: 'There are no wrong answers here, only incomplete ones. Give me the real version.', pose: 'think', cta: 'Got it' },
    ],
    catalyst: [
      { text: 'Hey — good to see you. Let\'s keep moving. First instinct usually wins.', pose: 'idle', cta: 'Let\'s go' },
      { text: 'You\'re already doing it by being here. Keep the momentum going.', pose: 'point', cta: 'Okay' },
    ],
    challenger: [
      { text: 'Don\'t stall on me. Put the first real thing down and we\'ll sharpen it later.', pose: 'idle', cta: 'Fine' },
      { text: 'I\'m watching the clock. Less browsing, more deciding.', pose: 'armsCross', cta: 'Okay' },
    ],
  },

  // ── Guide selection ──────────────────────────────────────────────────────
  guideSelect: {
    title: 'Choose your guide',
    mentor: [
      { text: 'Pick the voice that will serve you best right now — not the one you wish you needed.', pose: 'idle', cta: 'Choosing' },
      { text: 'You can change this later. But your first instinct is usually correct.', pose: 'think', cta: 'Okay' },
    ],
    catalyst: [
      { text: 'Go with your gut. You can always swap guides — don\'t overthink the first pick.', pose: 'point', cta: 'Got it' },
      { text: 'Pick the energy that gets you moving, not the one that feels safe.', pose: 'pointUp', cta: 'Okay' },
    ],
    challenger: [
      { text: 'Pick the one you\'d least enjoy being challenged by. That\'s the one you need.', pose: 'armsCross', cta: 'Fine' },
      { text: 'Comfort doesn\'t build leaders. Pick accordingly.', pose: 'idle', cta: 'Noted' },
    ],
  },

  // ── Profile / user info ──────────────────────────────────────────────────
  userInfo: {
    title: 'Profile creation',
    mentor: [
      { text: 'Start with what\'s steady: your name, your role, the team you lead. The harder things come later.', pose: 'idle', cta: 'Okay' },
      { text: 'This page is about context, not performance. Just be accurate.', pose: 'read', cta: 'Got it' },
    ],
    catalyst: [
      { text: 'Quick fill. Name, email, role — you know these. Thirty seconds and we\'re through.', pose: 'point', cta: 'On it' },
      { text: 'Don\'t overthink the title. Use what\'s on your business card and let\'s move.', pose: 'idle', cta: 'Moving' },
    ],
    challenger: [
      { text: 'Use the name you answer to in real life. Don\'t dress it up.', pose: 'idle', cta: 'Got it' },
      { text: 'Your title doesn\'t matter here as much as your honesty does.', pose: 'armsCross', cta: 'Understood' },
    ],
  },

  // ── Intake / behaviors ───────────────────────────────────────────────────
  intake: {
    title: 'Behaviors & instincts',
    mentor: [
      { text: 'Answer as the leader you actually are, not the one you\'d like to be seen as. We do more with honest than with impressive.', pose: 'read', cta: 'Understood' },
      { text: 'If a question surprises you, sit with it. The discomfort is part of the data.', pose: 'think', cta: 'Okay' },
      { text: 'No one sees these answers but you. That\'s the whole point.', pose: 'lantern', cta: 'Continuing' },
    ],
    catalyst: [
      { text: 'Gut answer first. You can always revisit — but don\'t sit on a question too long.', pose: 'idle', cta: 'Okay' },
      { text: 'One pass through. If you\'re still stuck after five seconds, go with the first impulse.', pose: 'point', cta: 'Going' },
      { text: 'Progress beats perfection. Keep the pace up.', pose: 'pointUp', cta: 'Moving' },
    ],
    challenger: [
      { text: 'If you\'re hedging, you\'re lying. Pick the answer that makes you a little uncomfortable.', pose: 'armsCross', cta: 'Fine' },
      { text: 'Your team sees patterns you\'ve rationalized for years. This is where we name them.', pose: 'sign', cta: 'Got it' },
      { text: 'Don\'t soften it. The leaders who grow fastest are brutally honest with themselves first.', pose: 'idle', cta: 'Alright' },
    ],
  },

  // ── AI summary / leadership reflection ──────────────────────────────────
  summary: {
    title: 'Your reflection',
    mentor: [
      { text: 'Read it slowly. Notice what resonates and what chafes — both are signal.', pose: 'read', cta: 'Reading' },
      { text: 'The parts that feel a little too accurate are the ones worth sitting with longest.', pose: 'think', cta: 'Noted' },
    ],
    catalyst: [
      { text: 'Skim for the highlights, then pick one thing to act on this week. Don\'t drown in the detail.', pose: 'page', cta: 'Got it' },
      { text: 'Read it once, then decide. A summary that leads to action beats one you study forever.', pose: 'pointUp', cta: 'Okay' },
    ],
    challenger: [
      { text: 'The parts you want to argue with are usually the parts you needed to see.', pose: 'armsCross', cta: 'Okay' },
      { text: 'There\'s a pattern here you already knew about. Now you can\'t unknow it.', pose: 'sign', cta: 'Fine' },
    ],
  },

  // ── Trait selection ──────────────────────────────────────────────────────
  traitSelection: {
    title: 'Choosing your focus',
    mentor: [
      { text: 'Pick the traits where growth would change the most for the people you lead — not the ones that look best on paper.', pose: 'map', cta: 'Okay' },
      { text: 'If you\'re drawn to all of them, start with the one that\'s been on your mind the longest.', pose: 'think', cta: 'Got it' },
    ],
    catalyst: [
      { text: 'Three traits. Go with what lights up first — we\'ll sequence them together.', pose: 'point', cta: 'Pick' },
      { text: 'Don\'t deliberate. The instinctive three are almost always the right three.', pose: 'pointUp', cta: 'Selecting' },
    ],
    challenger: [
      { text: 'Choose the ones you\'ve been avoiding. Those are the real ones.', pose: 'armsCross', cta: 'Alright' },
      { text: 'Picking the comfortable traits is a form of hiding. You know which three actually matter.', pose: 'sign', cta: 'Fine' },
    ],
  },

  // ── Campaign intro ───────────────────────────────────────────────────────
  campaignIntro: {
    title: 'Starting a campaign',
    mentor: [
      { text: 'A campaign is a small, bounded experiment. You\'re not fixing yourself — you\'re running a test.', pose: 'map', cta: 'Got it' },
      { text: 'Think of this as an invitation for your team to be honest with you. That takes courage on both sides.', pose: 'lantern', cta: 'Okay' },
    ],
    catalyst: [
      { text: 'Name it, ship it, iterate. Three weeks beats three months of planning.', pose: 'pointUp', cta: 'Ready' },
      { text: 'You\'ve done harder things in a Monday standup. Let\'s build this.', pose: 'plain', cta: 'Building' },
    ],
    challenger: [
      { text: 'Pick something you\'ll actually do. Not something that sounds ambitious in a meeting.', pose: 'idle', cta: 'Fine' },
      { text: 'If you\'re already thinking about how this will look, you\'re doing it wrong. Pick the real thing.', pose: 'armsCross', cta: 'Noted' },
    ],
  },

  // ── Campaign builder ─────────────────────────────────────────────────────
  campaignBuilder: {
    title: 'Building your campaign',
    mentor: [
      { text: 'Keep scope small enough that it fits inside a normal week. If it needs heroics, shrink it.', pose: 'page', cta: 'Okay' },
      { text: 'The right behavior to target is the one your team would point to first.', pose: 'think', cta: 'Noted' },
    ],
    catalyst: [
      { text: 'Tight scope beats big vision. One behavior, one team, three weeks.', pose: 'point', cta: 'Setting' },
      { text: 'Name it specifically enough that you\'d know on Thursday if it happened or not.', pose: 'idle', cta: 'Got it' },
    ],
    challenger: [
      { text: 'If you can\'t name who\'ll notice the change, it\'s not real work.', pose: 'sign', cta: 'Got it' },
      { text: 'Vague campaigns produce vague results. Make it specific or don\'t bother.', pose: 'armsCross', cta: 'Fine' },
    ],
  },

  // ── Campaign verify / launch ─────────────────────────────────────────────
  campaignVerify: {
    title: 'Confirming your setup',
    mentor: [
      { text: 'Last look before you invite anyone. Read like you\'re the person opening that email.', pose: 'read', cta: 'Reading' },
      { text: 'If something feels off, fix it now. Your team will take their cue from how this lands.', pose: 'map', cta: 'Checking' },
    ],
    catalyst: [
      { text: 'Looks right? Ship it. You can edit messaging later — it\'s not chiseled in stone.', pose: 'pointUp', cta: 'Ship' },
      { text: 'Done is better than perfect here. Your team will appreciate the directness.', pose: 'plain', cta: 'Launching' },
    ],
    challenger: [
      { text: 'If it feels mushy, rewrite the behavior before you send this to humans.', pose: 'sign', cta: 'Okay' },
      { text: 'One honest sentence is worth more than a paragraph of careful hedging.', pose: 'armsCross', cta: 'Got it' },
    ],
  },

  // ── Campaign survey (self or team) ───────────────────────────────────────
  campaignRun: {
    title: 'Running the survey',
    mentor: [
      { text: 'Answer in your voice, not the voice of the form. The specific beats the tidy.', pose: 'page', cta: 'Got it' },
      { text: 'You\'re not being graded. You\'re being seen. Let that feel different.', pose: 'lantern', cta: 'Okay' },
    ],
    catalyst: [
      { text: 'One pass, quickly. You\'ll thank yourself for not agonizing.', pose: 'idle', cta: 'Going' },
      { text: 'First answer is usually the most honest. Trust it.', pose: 'point', cta: 'Moving' },
    ],
    challenger: [
      { text: 'Don\'t game the scale. Pick the score that matches what you\'d say about someone else in your position.', pose: 'armsCross', cta: 'Alright' },
      { text: 'Self-serving answers waste everyone\'s time, including yours.', pose: 'sign', cta: 'Fine' },
    ],
  },

  // ── Campaign complete ─────────────────────────────────────────────────────
  campaignComplete: {
    title: 'You finished',
    mentor: [
      { text: 'Well done. Let it settle for a minute before you jump to what\'s next.', pose: 'idle', cta: 'Okay' },
      { text: 'You gave something real to this. That counts for more than you think.', pose: 'lantern', cta: 'Thanks' },
    ],
    catalyst: [
      { text: 'Done. Good. Now hand the next one to your team before the energy dies.', pose: 'pointUp', cta: 'Next' },
      { text: 'You finished ahead of most people who started this. Keep that pace.', pose: 'plain', cta: 'Moving' },
    ],
    challenger: [
      { text: 'You finished the easy part. The real work starts when results come back.', pose: 'idle', cta: 'Understood' },
      { text: 'Don\'t celebrate yet. Wait until you\'ve actually changed something.', pose: 'armsCross', cta: 'Noted' },
    ],
  },

  // ── Dashboard (overview tab) ─────────────────────────────────────────────
  dashboard: {
    title: 'Your dashboard',
    mentor: [
      { text: 'Look for the one thing you keep avoiding. That\'s usually where the leverage is.', pose: 'map', cta: 'Okay' },
      { text: 'Patterns are more useful than peaks. What keeps showing up?', pose: 'think', cta: 'Looking' },
    ],
    catalyst: [
      { text: 'Pick one card to act on today. Don\'t leave this page without a move.', pose: 'point', cta: 'Picking' },
      { text: 'Dashboards are for deciding, not for admiring. What\'s the next step?', pose: 'pointUp', cta: 'Moving' },
    ],
    challenger: [
      { text: 'Bad news first. Open the tab you wish you didn\'t have to.', pose: 'armsCross', cta: 'Fine' },
      { text: 'The number that makes you defensive is the number that matters most.', pose: 'sign', cta: 'Noted' },
    ],
  },

  // ── Dashboard — growth plan tab ──────────────────────────────────────────
  dashboardGrowth: {
    title: 'Growth plan',
    mentor: [
      { text: 'Small commitments kept beat big commitments dropped. One behavior, one week at a time.', pose: 'page', cta: 'Okay' },
      { text: 'The plan only works if the behaviors are specific enough to be observable.', pose: 'think', cta: 'Got it' },
    ],
    catalyst: [
      { text: 'Block 20 minutes on your calendar right now for the top item. Future-you will be relieved.', pose: 'pointUp', cta: 'Got it' },
      { text: 'One behavior this week. Not five. One. Go.', pose: 'point', cta: 'Blocking' },
    ],
    challenger: [
      { text: 'Which of these have you already told yourself you\'d do — and haven\'t? Start there.', pose: 'sign', cta: 'Alright' },
      { text: 'A growth plan is a mirror. Don\'t look away.', pose: 'armsCross', cta: 'Fine' },
    ],
  },

  // ── Dashboard — campaign details tab ────────────────────────────────────
  dashboardCampaign: {
    title: 'Campaign details',
    mentor: [
      { text: 'Listen for what your team is saying beneath the numbers. Patterns live in the margins.', pose: 'map', cta: 'Okay' },
      { text: 'The most valuable feedback is the kind that surprises you. Find it.', pose: 'read', cta: 'Looking' },
    ],
    catalyst: [
      { text: 'Find the one response that surprised you. Reply to that person — even a short note.', pose: 'point', cta: 'Going' },
      { text: 'Data is only useful the moment before you decide. Decide something.', pose: 'plain', cta: 'Deciding' },
    ],
    challenger: [
      { text: 'You don\'t get points for reading. You get points for what you change on Monday.', pose: 'armsCross', cta: 'Understood' },
      { text: 'If nothing here surprises you, you weren\'t listening to your team.', pose: 'sign', cta: 'Fine' },
    ],
  },

  // ── Dashboard — results tab ──────────────────────────────────────────────
  dashboardResults: {
    title: 'Results',
    mentor: [
      { text: 'Hold the highs and the lows side by side. Both are partial views of the same leader.', pose: 'lantern', cta: 'Okay' },
      { text: 'Where your self-score and your team\'s score diverge most — that\'s the conversation to have.', pose: 'think', cta: 'Noted' },
    ],
    catalyst: [
      { text: 'Celebrate one high, then pick one gap to close this month. Keep it to those two.', pose: 'pointUp', cta: 'Got it' },
      { text: 'Your team gave you data. The fastest leaders use it within 48 hours.', pose: 'plain', cta: 'On it' },
    ],
    challenger: [
      { text: 'The gap you rationalize is the gap your team talks about when you\'re not in the room.', pose: 'idle', cta: 'Fine' },
      { text: 'Look at where your team rated you lowest. That\'s the real number.', pose: 'armsCross', cta: 'Looking' },
    ],
  },

  // ── Landing / home ───────────────────────────────────────────────────────
  landing: {
    title: 'Welcome',
    mentor: [
      { text: 'This is a place to look at your leadership clearly. Start when you\'re ready — there\'s no wrong door.', pose: 'greet', cta: 'Begin' },
      { text: 'What you learn here stays with you long after the data does.', pose: 'lantern', cta: 'Okay' },
    ],
    catalyst: [
      { text: 'Ready? One good hour today saves you a hundred confused meetings later. Hit start.', pose: 'greet', cta: 'Start' },
      { text: 'The leaders who move fastest are the ones who start before they feel ready.', pose: 'pointUp', cta: 'Starting' },
    ],
    challenger: [
      { text: 'You didn\'t come here to browse. Pick a door and walk through it.', pose: 'greet', cta: 'Enter' },
      { text: 'Curiosity without action is just avoidance with better PR.', pose: 'armsCross', cta: 'Fine' },
    ],
  },

  // ── Sign in ──────────────────────────────────────────────────────────────
  signIn: {
    title: 'Signing in',
    mentor: [
      { text: 'Welcome back. Take the next step at your own pace.', pose: 'idle', cta: 'Thanks' },
      { text: 'Returning here says something. Let\'s pick up where the real work is.', pose: 'lantern', cta: 'Okay' },
    ],
    catalyst: [
      { text: 'Good. Sign in, and we\'ll get you back in motion.', pose: 'idle', cta: 'Got it' },
      { text: 'Back again — that means you\'re serious. Let\'s make it count.', pose: 'point', cta: 'Moving' },
    ],
    challenger: [
      { text: 'Sign in. We left work unfinished.', pose: 'idle', cta: 'Okay' },
      { text: 'You came back. Good. Now actually do something with it this time.', pose: 'armsCross', cta: 'Fine' },
    ],
  },

  // ── FAQ ──────────────────────────────────────────────────────────────────
  faq: {
    title: 'Questions',
    mentor: [
      { text: 'Good questions mean you\'re paying attention. Browse freely — nothing here is a test.', pose: 'read', cta: 'Okay' },
      { text: 'The question you\'re most hesitant to ask is usually the most important one.', pose: 'think', cta: 'Got it' },
    ],
    catalyst: [
      { text: 'Skim. Pick the two you most need. Come back for the rest.', pose: 'page', cta: 'Got it' },
      { text: 'Don\'t read everything. Find the one thing blocking you and fix it.', pose: 'point', cta: 'Skimming' },
    ],
    challenger: [
      { text: 'Read the one you\'re most tempted to skip.', pose: 'sign', cta: 'Fine' },
      { text: 'If you\'re in the FAQ, something\'s unclear. Name it and fix it.', pose: 'armsCross', cta: 'Okay' },
    ],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Resolve a route + optional tab string to a content key.
export function resolveRouteKey(pathname = '', search = '') {
  const p   = String(pathname || '').toLowerCase();
  const qs  = new URLSearchParams(search || '');
  const tab = String(qs.get('tab') || '').toLowerCase();

  if (p === '/' || p.startsWith('/landing')) return 'landing';
  if (p.startsWith('/sign-in'))              return 'signIn';
  if (p.startsWith('/user-info'))            return 'userInfo';
  if (p.startsWith('/guide-select'))         return 'guideSelect';
  if (p.startsWith('/form'))                 return 'intake';
  if (p.startsWith('/summary'))              return 'summary';
  if (p.startsWith('/trait-selection'))      return 'traitSelection';
  if (p.startsWith('/campaign-intro'))       return 'campaignIntro';
  if (p.startsWith('/campaign-builder'))     return 'campaignBuilder';
  if (p.startsWith('/campaign-verify'))      return 'campaignVerify';
  if (p.startsWith('/campaign/') && p.endsWith('/complete')) return 'campaignComplete';
  if (p.startsWith('/campaign/'))            return 'campaignRun';
  if (p.startsWith('/faq'))                  return 'faq';
  if (p.startsWith('/dashboard')) {
    if (tab.includes('growth'))   return 'dashboardGrowth';
    if (tab.includes('campaign')) return 'dashboardCampaign';
    if (tab.includes('result'))   return 'dashboardResults';
    return 'dashboard';
  }
  return 'default';
}

// Return the full array of messages for a route + persona.
export function getGuideMessages(routeKey, personaId) {
  const bucket  = GUIDE_CONTENT[routeKey] || GUIDE_CONTENT.default;
  const entries = bucket[personaId] || GUIDE_CONTENT.default[personaId] || GUIDE_CONTENT.default.mentor;
  return Array.isArray(entries) ? entries : [entries];
}

// Single-message shim for backward compat (returns first entry).
export function getGuideMessage(routeKey, personaId) {
  const msgs = getGuideMessages(routeKey, personaId);
  return {
    title: (GUIDE_CONTENT[routeKey] || GUIDE_CONTENT.default).title || 'Guide',
    text:  msgs[0].text,
    cta:   msgs[0].cta || 'Okay',
    pose:  msgs[0].pose || 'idle',
  };
}
