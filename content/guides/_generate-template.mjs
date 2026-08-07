import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = __dirname;

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(file, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? '')).join(','));
  }
  const body = `${lines.join('\n')}\n`;
  const target = path.join(dir, file);
  try {
    fs.writeFileSync(target, body, 'utf8');
    return file;
  } catch (err) {
    if (err && err.code === 'EBUSY') {
      const alt = file.replace(/\.csv$/i, '.UPDATED.csv');
      fs.writeFileSync(path.join(dir, alt), body, 'utf8');
      console.warn(`${file} is locked — wrote ${alt} instead. Close Excel and rename/replace.`);
      return alt;
    }
    throw err;
  }
}

// Existing first-line copy from guideContent.js (defaults) + sensible seeds
const existing = {
  default: {
    mentor: { text: 'Take a breath. You belong here. Nothing on this page needs to be perfect — it just needs to be honest.', cta: 'Okay' },
    catalyst: { text: "Hey — good to see you. Let's keep moving. First instinct usually wins.", cta: "Let's go" },
    challenger: { text: "Don't stall on me. Put the first real thing down and we'll sharpen it later.", cta: 'Fine' },
  },
  landing: {
    mentor: { text: "Welcome. Take a look around — when you're ready, we'll start with who you are.", cta: 'Okay' },
    catalyst: { text: "You found it. Hit begin when you're ready to move.", cta: "Let's go" },
    challenger: { text: 'Stop browsing. Start.', cta: 'Fine' },
  },
  signIn: {
    mentor: { text: 'Sign in so we can keep your work with you.', cta: 'Okay' },
    catalyst: { text: 'Quick sign-in, then we move.', cta: 'On it' },
    challenger: { text: 'Authenticate. Then do the work.', cta: 'Got it' },
  },
  userInfo: {
    mentor: { text: "Start with what's steady: your name, your role, the team you lead. The harder things come later.", cta: 'Okay' },
    catalyst: { text: "Quick fill. Name, email, role — you know these. Thirty seconds and we're through.", cta: 'On it' },
    challenger: { text: "Use the name you answer to in real life. Don't dress it up.", cta: 'Got it' },
  },
  guideSelect: {
    mentor: { text: 'Pick the voice that will serve you best right now — not the one you wish you needed.', cta: 'Choosing' },
    catalyst: { text: "Go with your gut. You can always swap guides — don't overthink the first pick.", cta: 'Got it' },
    challenger: { text: "Pick the one you'd least enjoy being challenged by. That's the one you need.", cta: 'Fine' },
  },
  intake: {
    mentor: { text: 'Answer as the leader you actually are, not the one you’d like to be seen as. We do more with honest than with impressive.', cta: 'Understood' },
    catalyst: { text: "Gut answer first. You can always revisit — but don't sit on a question too long.", cta: 'Okay' },
    challenger: { text: "If you're hedging, you're lying. Pick the answer that makes you a little uncomfortable.", cta: 'Fine' },
  },
  summary: {
    mentor: { text: 'Read it slowly. Notice what resonates and what chafes — both are signal.', cta: 'Reading' },
    catalyst: { text: "Skim for the highlights, then pick one thing to act on this week. Don't drown in the detail.", cta: 'Got it' },
    challenger: { text: 'The parts you want to argue with are usually the parts you needed to see.', cta: 'Okay' },
  },
  traitSelection: {
    mentor: { text: 'Pick the traits where growth would change the most for the people you lead — not the ones that look best on paper.', cta: 'Okay' },
    catalyst: { text: "Three traits. Go with what lights up first — we'll sequence them together.", cta: 'Pick' },
    challenger: { text: "Choose the ones you've been avoiding. Those are the real ones.", cta: 'Alright' },
  },
  campaignIntro: {
    mentor: { text: "A campaign is a small, bounded experiment. You're not fixing yourself — you're running a test.", cta: 'Got it' },
    catalyst: { text: 'Name it, ship it, iterate. Three weeks beats three months of planning.', cta: 'Ready' },
    challenger: { text: "Pick something you'll actually do. Not something that sounds ambitious in a meeting.", cta: 'Fine' },
  },
  campaignBuilder: {
    mentor: { text: 'Keep scope small enough that it fits inside a normal week. If it needs heroics, shrink it.', cta: 'Okay' },
    catalyst: { text: 'Tight scope beats big vision. One behavior, one team, three weeks.', cta: 'Setting' },
    challenger: { text: "If you can't name who'll notice the change, it's not real work.", cta: 'Got it' },
  },
  campaignVerify: {
    mentor: { text: "Last look before you invite anyone. Read like you're the person opening that email.", cta: 'Reading' },
    catalyst: { text: "Looks right? Ship it. You can edit messaging later — it's not chiseled in stone.", cta: 'Ship' },
    challenger: { text: 'If it feels mushy, rewrite the behavior before you send this to humans.', cta: 'Okay' },
  },
  campaignRun: {
    mentor: { text: 'Answer in your voice, not the voice of the form. The specific beats the tidy.', cta: 'Got it' },
    catalyst: { text: "One pass, quickly. You'll thank yourself for not agonizing.", cta: 'Going' },
    challenger: { text: "Don't game the scale. Pick the score that matches what you'd say about someone else in your position.", cta: 'Alright' },
  },
  campaignComplete: {
    mentor: { text: "Well done. Let it settle for a minute before you jump to what's next.", cta: 'Okay' },
    catalyst: { text: 'Done. Good. Now hand the next one to your team before the energy dies.', cta: 'Next' },
    challenger: { text: 'You finished the easy part. The real work starts when results come back.', cta: 'Understood' },
  },
  dashboard: {
    mentor: { text: "Look for the one thing you keep avoiding. That's usually where the leverage is.", cta: 'Okay' },
    catalyst: { text: "Pick one card to act on today. Don't leave this page without a move.", cta: 'Picking' },
    challenger: { text: "Bad news first. Open the tab you wish you didn't have to.", cta: 'Fine' },
  },
  dashboardToday: {
    mentor: { text: 'Begin where you actually are. The season name is honest. Let it land before you decide anything.', cta: 'Okay' },
    catalyst: { text: 'Welcome back. Pick the tile that felt heaviest this week and start there.', cta: 'Going' },
    challenger: { text: 'Before you click anything: which of those three tiles are you avoiding? That’s the one.', cta: 'Fine' },
  },
  dashboardSignal: {
    mentor: { text: 'The signal is what your team is reflecting back. Hold it lightly — patterns matter more than any one number.', cta: 'Okay' },
    catalyst: { text: "Scan the map, then pick one trait to dig into. Don't try to fix the whole board.", cta: 'Scanning' },
    challenger: { text: 'Find the number you dislike most. Start there.', cta: 'Fine' },
  },
  dashboardEvidence: {
    mentor: { text: 'Evidence is sourced, not stylized. Take your time in here — nothing is summarized on your behalf.', cta: 'Okay' },
    catalyst: { text: 'Receipts first. Then decide what to change.', cta: 'Got it' },
    challenger: { text: 'If the evidence surprises you, you were guessing before.', cta: 'Fine' },
  },
  dashboardPractice: {
    mentor: { text: 'You are not starting over. You are carrying the signal into practice now — a plan for every trait, one visible behavior at a time.', cta: 'Okay' },
    catalyst: { text: 'One visible behavior per trait. Keep it small enough to keep.', cta: 'Building' },
    challenger: { text: "A plan you won't do is worse than no plan. Shrink it.", cta: 'Alright' },
  },
  dashboardJourney: {
    mentor: { text: "This is the whole trail. Notice how far you've already come before you eye the next station.", cta: 'Okay' },
    catalyst: { text: 'Find the next open station and go. Momentum beats nostalgia.', cta: 'Going' },
    challenger: { text: "Don't linger on completed stations. Open the next door.", cta: 'Fine' },
  },
  dashboardGrowth: {
    mentor: { text: 'Small commitments kept beat big commitments dropped. One behavior, one week at a time.', cta: 'Okay' },
    catalyst: { text: 'Block 20 minutes on your calendar right now for the top item. Future-you will be relieved.', cta: 'Got it' },
    challenger: { text: "Which of these have you already told yourself you'd do — and haven't? Start there.", cta: 'Alright' },
  },
  dashboardCampaign: {
    mentor: { text: 'Listen for what your team is saying beneath the numbers. Patterns live in the margins.', cta: 'Okay' },
    catalyst: { text: 'Find the one response that surprised you. Reply to that person — even a short note.', cta: 'Going' },
    challenger: { text: "You don't get points for reading. You get points for what you change on Monday.", cta: 'Understood' },
  },
  dashboardResults: {
    mentor: { text: 'Hold the highs and the lows side by side. Both are partial views of the same leader.', cta: 'Okay' },
    catalyst: { text: 'Celebrate one high, then pick one gap to close this month. Keep it to those two.', cta: 'Got it' },
    challenger: { text: "The gap you rationalize is the gap your team talks about when you're not in the room.", cta: 'Fine' },
  },
  faq: {
    mentor: { text: 'Ask the real question. Confusion usually means something important is still fuzzy.', cta: 'Okay' },
    catalyst: { text: 'Skim. Pick the two you most need. Come back for the rest.', cta: 'Got it' },
    challenger: { text: "Read the one you're most tempted to skip.", cta: 'Fine' },
  },
};

const stepSeeds = {
  'summary|trailhead': { mentor: { text: 'Mirror the current signal. Your clearest current-state leadership reflection.', cta: 'Reading' } },
  'summary|markers': { mentor: { text: 'Notice the recurring moments — signals that show up under pressure and momentum.', cta: 'Noticing' } },
  'summary|hazards': { mentor: { text: 'What may break if left unaddressed. Sit with the risk before you skip past it.', cta: 'Okay' } },
  'summary|new-trail': { mentor: { text: 'Choose where to build forward. Focused growth traits create a sharper trajectory.', cta: 'Choosing' } },
  'dashboardSignal|threshold': { mentor: { text: 'The signal is what your team is reflecting back. Hold it lightly — patterns matter more than any one number.', cta: 'Okay' } },
  'dashboardSignal|traits': { mentor: { text: 'Three traits, one at a time — strongest ground first. The arrow walks you down; nothing is hidden, just paced.', cta: 'Got it' } },
  'dashboardSignal|gap': { mentor: { text: "Three gaps, one at a time. When your read and your team's diverge, neither is wrong — the distance itself is the finding.", cta: 'Looking' } },
  'dashboardSignal|checkin': { mentor: { text: 'However this is landing for you is the right answer. I just want to know where you are.', cta: 'Okay' } },
  'dashboardSignal|close': { mentor: { text: 'A debrief should end in a door, not a number. Pick the one that matches where you are.', cta: 'Choosing' } },
  'dashboardSignal|snapshot': { mentor: { text: 'This is your signal at rest. Walk it again any time — or go verify it in the evidence room.', cta: 'Okay' } },
  'dashboardSignal|reaction-resonates': { mentor: { text: 'Good. Resonance means the mirror is clear. Keep that honesty when you pick a next step.', cta: 'Okay' } },
  'dashboardSignal|reaction-surprises': { mentor: { text: "Surprise is useful. Don't explain it away — follow it into the evidence.", cta: 'Got it' } },
  'dashboardSignal|reaction-stings': { mentor: { text: "If it stings, it's usually close to something true. Stay with it a moment longer than you want to.", cta: 'Okay' } },
  'dashboardSignal|reaction-disagree': { mentor: { text: 'Disagreement is allowed. Test it against the receipts before you dismiss the signal.', cta: 'Fine' } },
  'dashboardEvidence|ev-intro': { mentor: { text: 'Evidence is sourced, not stylized. Take your time in here — nothing is summarized on your behalf.', cta: 'Okay' } },
  'dashboardEvidence|ev-floor': { mentor: { text: 'Three statements, ranked by need. If you only change one thing this cycle, the top of this list is where it counts.', cta: 'Got it' } },
  'dashboardEvidence|ev-gaps': { mentor: { text: "A gap isn't an accusation. It's a precise map of where a conversation would teach you the most.", cta: 'Okay' } },
  'dashboardEvidence|ev-trait': { mentor: { text: 'One trait exhibit at a time. Read the receipts for this trait before you invent a story about it.', cta: 'Reading' } },
  'dashboardEvidence|ev-close': { mentor: { text: 'Verified ground. Now we build on it — an action plan for every trait, starting where the signal points.', cta: 'Next' } },
  'dashboardEvidence|snapshot': { mentor: { text: 'The receipts keep. Come back any time a claim needs checking — or walk the room again.', cta: 'Okay' } },
  'dashboardPractice|pr-intro': { mentor: { text: 'You are not starting over. You are carrying the signal into practice now — a plan for every trait, one visible behavior at a time.', cta: 'Okay' } },
  'dashboardPractice|pr-edge': { mentor: { text: 'Start where the signal points. This trait is asking for a different approach, not more effort.', cta: 'Building' } },
  'dashboardPractice|pr-lifting': { mentor: { text: 'This is already a gift — the plan is about keeping it deliberate so it grows instead of coasting.', cta: 'Okay' } },
  'dashboardPractice|pr-strength': { mentor: { text: 'This is strong because you work at it. Protect the strength — and you — from quiet erosion.', cta: 'Got it' } },
  'dashboardPractice|pr-commit': { mentor: { text: 'Promises, said out loud. Keep them small enough that you actually do them.', cta: 'Committing' } },
  'dashboardPractice|snapshot': { mentor: { text: 'The bearing is set. These promises hold until the next check-in reads the signal again.', cta: 'Okay' } },
  'dashboardGate|default': { mentor: { text: 'One step at a time. Finish the prior station before you force this door open.', cta: 'Okay' } },
};

// One row per intake click-through beat (behavior question ids match IntakeForm.behaviorSet).
const intakeBehaviorQuestions = [
  ['q-resourcePick', 'The Quick Pick', 'Q1 · When resources are tight…', 'think'],
  ['q-projectApproach', 'The Team Puzzle', 'Q2 · Complex project, first move', 'map'],
  ['q-energyDrains', 'The Energy Drain', 'Q3 · Three situations to minimize', 'think'],
  ['q-crisisResponse', 'The Fire Drill', 'Q4 · Crisis hits — rank responses', 'point'],
  ['q-pushbackFeeling', 'The Pushback Moment', 'Q5 · Emotions when challenged', 'armsCross'],
  ['q-roleModelTrait', 'The Role Model', 'Q6 · Leader you admire', 'lantern'],
  ['q-warningLabel', 'The Warning Label', 'Q7 · Your leadership warning label', 'sign'],
  ['q-leaderFuel', 'The Leader\'s Fuel', 'Q8 · What energizes you most', 'greet'],
  ['q-proudMoment', 'The Highlight Reel', 'Q9 · Significant team accomplishment', 'read'],
  ['q-behaviorDichotomies', 'The Balance Line', 'Q10 · Behavior sliders', 'map'],
  ['q-visibilityComfort', 'The Spotlight', 'Q11 · High-visibility comfort', 'idle'],
  ['q-decisionPace', 'The Lesson Loop', 'Q12 · When something goes wrong', 'think'],
  ['q-teamPerception', 'The Performance Check', 'Q13 · Team member missing expectations', 'point'],
];

const intakeSocietalQuestions = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return [`societal-${n}`, `Insights ${n} of 10`, `Societal/insights scale question ${n}`, 'read'];
});

const intakeSteps = [
  ['P0', 'intake', 'default', 'Intake', 'Arrive / fallback', 'Any /form intake moment without a more specific step', 'Fallback if step unknown', 'read'],
  ['P0', 'intake', 'behaviors-intro', 'Intake', 'Behaviors intro ceremony', 'Ceremony/popup before behavior questions', 'Chapter II kickoff — before Q1', 'lantern'],
  ...intakeBehaviorQuestions.map(([stepKey, theme, when, pose]) => (
    ['P0', 'intake', stepKey, 'Intake - Behaviors', theme, when, 'Unique line when user lands on this question (next-click changes guide text)', pose]
  )),
  ['P0', 'intake', 'reflection', 'Intake - Reflection', 'Reflection / AI pause', 'After behavior questions, before mindset block', 'Sit with the mirror', 'read'],
  ['P0', 'intake', 'mindset-intro', 'Intake - Insights', 'Mindset / insights intro', 'Popup before societal/insights questions', 'Transition into scale questions', 'idle'],
  ...intakeSocietalQuestions.map(([stepKey, theme, when, pose]) => (
    ['P0', 'intake', stepKey, 'Intake - Insights', theme, when, 'Unique line each time they advance to the next insights question', pose]
  )),
  ['P2', 'intake', 'agent-select', 'Intake - Agent (legacy)', 'Choose AI agent voice', 'Non-Cairn path only; Cairn usually skips', 'Optional / legacy', 'greet'],
];

const steps = [
  ['P0', 'userInfo', 'default', 'Profile / User Info', 'Arrive on page', 'First load of /user-info', 'Page-level default line', 'idle'],
  ['P0', 'guideSelect', 'default', 'Guide Select', 'Arrive on page', '/guide-select carousel', 'Selection screen; overlay usually hidden here but keep copy for panel/future', 'greet'],
  ...intakeSteps,
  ['P0', 'summary', 'default', 'Summary', 'Arrive on page', '/summary first load / no stage override', 'Fallback if stage unknown', 'read'],
  ['P0', 'summary', 'trailhead', 'Summary', 'Trailhead stage', 'Click/advance to Trailhead (stage 1)', 'Mirror current signal', 'read'],
  ['P0', 'summary', 'markers', 'Summary', 'Trail Markers stage', 'Click/advance to Trail Markers', 'Recurring moments', 'map'],
  ['P0', 'summary', 'hazards', 'Summary', 'Upcoming Hazards stage', 'Click/advance to Hazards', 'Risks if unaddressed', 'think'],
  ['P0', 'summary', 'new-trail', 'Summary', 'A New Trail stage', 'Click/advance to New Trail', 'Bridge into trait selection', 'lantern'],
  ['P0', 'traitSelection', 'default', 'Trait Selection', 'Arrive / browsing', '/trait-selection with nothing special', 'How to choose', 'map'],
  ['P0', 'traitSelection', 'focus-trait', 'Trait Selection', 'Focused a trait card', 'User clicks/focuses a trait to inspect', 'React to focus without requiring select', 'think'],
  ['P0', 'traitSelection', 'selected-1', 'Trait Selection', '1 of 3 selected', 'selectedTraits.length === 1', 'Encourage second pick', 'idle'],
  ['P0', 'traitSelection', 'selected-2', 'Trait Selection', '2 of 3 selected', 'selectedTraits.length === 2', 'Nudge the hard third', 'point'],
  ['P0', 'traitSelection', 'selected-3', 'Trait Selection', '3 of 3 ready', 'selectedTraits.length === 3', 'Confirm and advance', 'greet'],
  ['P1', 'campaignIntro', 'default', 'Campaign Intro', 'Arrive on page', '/campaign-intro', 'What a campaign is', 'map'],
  ['P0', 'campaignBuilder', 'default', 'Campaign Builder', 'Arrive / drafting', '/campaign-builder general', 'Scope + prompt curation', 'page'],
  ['P1', 'campaignBuilder', 'curating', 'Campaign Builder', 'Curating prompts', 'User editing/keeping/removing prompts', 'Fair useful feedback cues', 'think'],
  ['P1', 'campaignBuilder', 'ready-to-verify', 'Campaign Builder', 'Ready to verify', 'Kept set looks complete', 'Push to verify', 'point'],
  ['P0', 'campaignVerify', 'default', 'Campaign Verify', 'Arrive / review', '/campaign-verify', 'Last look before invite', 'read'],
  ['P1', 'campaignVerify', 'about-to-launch', 'Campaign Verify', 'About to launch', 'Final confirm moment', 'Ship courage / honesty', 'greet'],
  ['P0', 'campaignRun', 'default', 'Campaign Survey', 'Taking survey', '/campaign/:id survey in progress', 'Honest scoring', 'page'],
  ['P0', 'campaignComplete', 'default', 'Campaign Complete', 'Finished survey', '/campaign/:id/complete', 'Close the loop', 'greet'],
  ['P0', 'dashboardToday', 'default', 'Command Center · Today', 'Arrive on Today', '/dashboard?tab=today', 'Season + tiles', 'idle'],
  ['P1', 'dashboardToday', 'season', 'Command Center · Today', 'Season callout focus', 'User focuses season headline', 'Season honesty', 'lantern'],
  ['P0', 'dashboardSignal', 'default', 'Command Center · Signal', 'Arrive / fallback', '/dashboard?tab=signal without chapter override', 'Fallback', 'map'],
  ['P0', 'dashboardSignal', 'snapshot', 'Command Center · Signal', 'Snapshot mode', 'Signal snapshot view', 'At-rest signal', 'map'],
  ['P0', 'dashboardSignal', 'threshold', 'Command Center · Signal', 'Chapter: Threshold', 'Walkthrough chapter Threshold', 'Open the debrief', 'read'],
  ['P0', 'dashboardSignal', 'traits', 'Command Center · Signal', 'Chapter: The Signal', 'Walkthrough chapter Traits', 'Trait-by-trait pace', 'map'],
  ['P0', 'dashboardSignal', 'gap', 'Command Center · Signal', 'Chapter: The Gap', 'Walkthrough chapter Gap', 'Self vs team distance', 'map'],
  ['P0', 'dashboardSignal', 'checkin', 'Command Center · Signal', 'Chapter: Check-in', 'Walkthrough check-in', 'Emotional landing', 'think'],
  ['P1', 'dashboardSignal', 'reaction-resonates', 'Command Center · Signal', 'Check-in: Resonates', 'User picks resonates', 'Tone-specific reaction', 'idle'],
  ['P1', 'dashboardSignal', 'reaction-surprises', 'Command Center · Signal', 'Check-in: Surprises', 'User picks surprises', 'Tone-specific reaction', 'think'],
  ['P1', 'dashboardSignal', 'reaction-stings', 'Command Center · Signal', 'Check-in: Stings', 'User picks stings', 'Tone-specific reaction', 'lantern'],
  ['P1', 'dashboardSignal', 'reaction-disagree', 'Command Center · Signal', 'Check-in: Disagree', 'User picks disagree', 'Tone-specific reaction', 'armsCross'],
  ['P0', 'dashboardSignal', 'close', 'Command Center · Signal', 'Chapter: The Close', 'Walkthrough close', 'Pick a door forward', 'point'],
  ['P0', 'dashboardEvidence', 'default', 'Command Center · Evidence', 'Arrive / fallback', '/dashboard?tab=evidence', 'Fallback', 'read'],
  ['P0', 'dashboardEvidence', 'snapshot', 'Command Center · Evidence', 'Snapshot mode', 'Evidence snapshot', 'Receipts at rest', 'map'],
  ['P0', 'dashboardEvidence', 'ev-intro', 'Command Center · Evidence', 'Chapter: The Receipts', 'Walkthrough intro', 'Sourced not stylized', 'read'],
  ['P0', 'dashboardEvidence', 'ev-floor', 'Command Center · Evidence', 'Chapter: The Floor', 'Walkthrough floor', 'Ranked needs', 'lantern'],
  ['P0', 'dashboardEvidence', 'ev-gaps', 'Command Center · Evidence', 'Chapter: The Gaps', 'Walkthrough gaps (if self data)', 'Conversation map', 'lantern'],
  ['P0', 'dashboardEvidence', 'ev-trait', 'Command Center · Evidence', 'Chapter: Trait exhibit', 'Per-trait evidence card', 'Reusable line for each trait exhibit', 'map'],
  ['P0', 'dashboardEvidence', 'ev-close', 'Command Center · Evidence', 'Chapter: Close', 'Walkthrough close', 'Bridge to practice', 'point'],
  ['P0', 'dashboardPractice', 'default', 'Command Center · Practice', 'Arrive / fallback', '/dashboard?tab=practice', 'Fallback', 'lantern'],
  ['P0', 'dashboardPractice', 'snapshot', 'Command Center · Practice', 'Snapshot mode', 'Practice snapshot', 'Bearing set', 'lantern'],
  ['P0', 'dashboardPractice', 'pr-intro', 'Command Center · Practice', 'Chapter: Why Practice', 'Walkthrough intro', 'Carry signal into practice', 'lantern'],
  ['P1', 'dashboardPractice', 'pr-edge', 'Command Center · Practice', 'Planning an Edge trait', 'Trait role = edge', 'Different approach not more effort', 'point'],
  ['P1', 'dashboardPractice', 'pr-lifting', 'Command Center · Practice', 'Planning a Lifting trait', 'Trait role = lifting', 'Keep gift deliberate', 'map'],
  ['P1', 'dashboardPractice', 'pr-strength', 'Command Center · Practice', 'Planning a Strength trait', 'Trait role = strength', 'Protect from erosion', 'map'],
  ['P0', 'dashboardPractice', 'pr-commit', 'Command Center · Practice', 'Chapter: Commitment', 'Commit-all chapter', 'Small enough to keep', 'map'],
  ['P0', 'dashboardJourney', 'default', 'Command Center · Journey', 'Arrive / map', '/dashboard?tab=journey', 'Whole trail', 'map'],
  ['P1', 'dashboardJourney', 'station-focus', 'Command Center · Journey', 'Focused a station', 'User selects a journey station', 'React to station status generically', 'think'],
  ['P1', 'dashboardGate', 'default', 'Command Center · Gate', 'Locked phase gate', 'GatePage when tab locked', 'One step at a time', 'point'],
  ['P2', 'dashboard', 'default', 'Dashboard (legacy overview)', 'Arrive', 'Legacy dashboard path', 'Keep for non-CC path', 'map'],
  ['P2', 'dashboardGrowth', 'default', 'Dashboard · Growth (legacy)', 'Arrive', 'Legacy growth tab', 'Optional', 'page'],
  ['P2', 'dashboardCampaign', 'default', 'Dashboard · Campaign (legacy)', 'Arrive', 'Legacy campaign tab', 'Optional', 'map'],
  ['P2', 'dashboardResults', 'default', 'Dashboard · Results (legacy)', 'Arrive', 'Legacy results tab', 'Optional', 'lantern'],
  ['P2', 'landing', 'default', 'Landing', 'Arrive', '/ or /landing', 'Usually overlay hidden; optional brand voice', 'greet'],
  ['P2', 'signIn', 'default', 'Sign In', 'Arrive', '/sign-in', 'Usually overlay hidden', 'idle'],
  ['P2', 'faq', 'default', 'FAQ', 'Arrive', '/faq', 'Help tone', 'think'],
  ['P2', 'default', 'default', 'Fallback', 'Unknown route', 'Any unmatched route', 'Safety net copy', 'idle'],
];

const guides = ['mentor', 'catalyst', 'challenger', 'bestFriend', 'mother', 'roaster'];

const copyHeaders = [
  'priority', 'routeKey', 'stepKey', 'pageLabel', 'stepLabel', 'whenItShows', 'notes', 'suggestedPose',
  ...guides.map((g) => `${g}_text`),
];

const copyRows = steps.map(([priority, routeKey, stepKey, pageLabel, stepLabel, whenItShows, notes, suggestedPose]) => {
  const row = { priority, routeKey, stepKey, pageLabel, stepLabel, whenItShows, notes, suggestedPose };
  const seedKey = `${routeKey}|${stepKey}`;
  const pageExisting = existing[routeKey] || {};
  const stepSeed = stepSeeds[seedKey] || {};
  for (const g of guides) {
    const fromStep = stepSeed[g];
    const fromPage = stepKey === 'default' ? pageExisting[g] : null;
    const src = fromStep || fromPage || null;
    row[`${g}_text`] = src?.text || '';
  }
  return row;
});

writeCsv('3-guide-copy.csv', copyHeaders, copyRows);

writeCsv('1-personas.csv', [
  'guideId', 'displayName', 'tagline', 'voiceBlurb', 'accentHex', 'imagePrefix', 'status', 'notes',
], [
  { guideId: 'mentor', displayName: 'Mentor', tagline: 'Warm. Grounded. Asks the quiet questions.', voiceBlurb: 'Speaks in long vowels. Invites reflection before action. Never rushes.', accentHex: '#2F4A5C', imagePrefix: 'Mentor', status: 'live', notes: 'Already in app; refresh art + copy from this sheet' },
  { guideId: 'catalyst', displayName: 'Catalyst', tagline: 'Energetic. Optimistic. Ships first drafts fast.', voiceBlurb: 'Short sentences. Celebrates momentum. Converts hesitation into action.', accentHex: '#B8532C', imagePrefix: 'Catalyst', status: 'live', notes: 'Already in app' },
  { guideId: 'challenger', displayName: 'Challenger', tagline: 'Direct. Honest. Won’t let you hide.', voiceBlurb: 'Plain words. Names the avoidance. Pushes you to commit before you feel ready.', accentHex: '#5A3C66', imagePrefix: 'Challenger', status: 'live', notes: 'Already in app' },
  { guideId: 'bestFriend', displayName: 'Best Friend', tagline: '', voiceBlurb: '', accentHex: '', imagePrefix: 'BestFriend', status: 'new', notes: 'Fill from your sheet; replaces a placeholder' },
  { guideId: 'mother', displayName: 'Mother', tagline: '', voiceBlurb: '', accentHex: '', imagePrefix: 'Mother', status: 'new', notes: 'Confirm final display name' },
  { guideId: 'roaster', displayName: 'Roaster', tagline: '', voiceBlurb: '', accentHex: '', imagePrefix: 'Roaster', status: 'new', notes: 'Confirm final display name' },
]);

const poseRows = [];
const semanticPoses = [
  ['idle', 'Default resting pose', 'Most page defaults'],
  ['greet', 'Greeting / welcome / selection', 'Guide select, completions, warm opens'],
  ['think', 'Reflective / considering', 'Hard questions, hazards, disagreement'],
  ['read', 'Reading / studying', 'Summary, evidence receipts'],
  ['map', 'Orienting / pointing to the path', 'Journey, trait picks, signal map'],
  ['lantern', 'Guiding light / care', 'Ceremonies, practice, stings'],
  ['point', 'Directing action / urgency', 'Action nudges, gates, ship moments'],
  ['pointUp', 'Amped / celebrate momentum', 'High-energy wins'],
  ['page', 'Document / drafting', 'Builder, survey answering'],
  ['armsCross', 'Skeptical / holding the line', 'Pressure / challenge'],
  ['sign', 'Calling it out', 'Naming avoidance'],
  ['mad', 'Max intensity (use sparingly)', 'Rare spikes'],
];

for (const [poseKey, meaning, usedWhen] of semanticPoses) {
  poseRows.push({
    sheet: 'semantic',
    guideId: '*',
    poseKey,
    meaning,
    usedWhen,
    mentor_file: '',
    catalyst_file: '',
    challenger_file: '',
    bestFriend_file: '',
    mother_file: '',
    roaster_file: '',
    notes: "Map each guide's 01-08 files onto these poseKeys in the file columns (or fill the files section below)",
  });
}

const prefixes = [
  ['mentor', 'Mentor', 6],
  ['catalyst', 'Catalyst', 7],
  ['challenger', 'Challenger', 6],
  ['bestFriend', 'BestFriend', 7],
  ['mother', 'Mother', 8],
  ['roaster', 'Roaster', 8],
];

for (const [guideId, prefix, count] of prefixes) {
  for (let i = 1; i <= 8; i += 1) {
    const num = String(i).padStart(2, '0');
    const exists = i <= count;
    const row = {
      sheet: 'files',
      guideId,
      poseKey: exists ? '' : '',
      meaning: exists ? 'FILL: assign poseKey (idle/greet/think/...)' : 'no file yet',
      usedWhen: '',
      mentor_file: '',
      catalyst_file: '',
      challenger_file: '',
      bestFriend_file: '',
      mother_file: '',
      roaster_file: '',
      notes: exists ? `Current file: ${prefix}_${num}.png — put poseKey in poseKey column` : 'slot unused',
    };
    row[`${guideId}_file`] = exists ? `${prefix}_${num}.png` : '';
    poseRows.push(row);
  }
}

writeCsv('2-pose-legend.csv', [
  'sheet', 'guideId', 'poseKey', 'meaning', 'usedWhen',
  'mentor_file', 'catalyst_file', 'challenger_file', 'bestFriend_file', 'mother_file', 'roaster_file', 'notes',
], poseRows);

fs.writeFileSync(path.join(dir, 'HOW-TO-USE.txt'), `Guide content authoring pack
=============================

Import these three CSVs into one Google Sheet as three tabs
(File → Import → Upload → Insert new sheet(s)):

  1-personas.csv      → tab: Personas
  2-pose-legend.csv   → tab: Pose Legend
  3-guide-copy.csv    → tab: Guide Copy   ← main work tab

How to fill Guide Copy
----------------------
- Each ROW is one page-step beat the app can show.
- routeKey + stepKey are stable IDs — do not rename those two columns.
- Fill *_text for all six guides (the bubble copy). No CTA columns — unused in UI.
- suggestedPose should match a poseKey from the Pose Legend tab.
- priority: P0 = ship first, P1 = important within-page variants, P2 = legacy/optional.
- Mentor / Catalyst / Challenger page defaults are prefilled from current app copy.
  Many step-specific beats only have a Mentor draft — rewrite in all six voices.
- Leave a cell blank only if you want that guide to fall back to the page default.

Within-page steps worth filling
-------------------------------
Intake: behaviors-intro, each q-* behavior question, reflection,
        mindset-intro, societal-1..10 (one line per next-click)
Summary: trailhead, markers, hazards, new-trail
Trait Selection: focus-trait, selected-1, selected-2, selected-3
Signal: threshold, traits, gap, checkin, reactions, close
Evidence: ev-intro, ev-floor, ev-gaps, ev-trait, ev-close
Practice: pr-intro, pr-edge, pr-lifting, pr-strength, pr-commit

When the sheet is ready
-----------------------
1. Download CSV/XLSX back into this folder (same names is fine)
2. Tell the agent: "reimport guides"
   (CSV overwrite alone does not hot-reload the app)

Do not put secrets in these files.
`);

console.log(`Wrote ${copyRows.length} guide-copy rows to ${dir}`);
