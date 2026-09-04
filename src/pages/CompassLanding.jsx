import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guideImage } from '../data/guideArt';
import { SUPPORT_EMAIL, SUPPORT_MAILTO, DOCUMENTS_PATH, FAQ_PATH } from '../data/supportLinks';
import '../styles/compass-landing.css';

/**
 * Staging-only landing page.
 *
 * Home.jsx renders this component instead of the legacy MUI landing when
 * `useCairnTheme` is true (staging host, or `?theme=cairn`). Production is
 * untouched — nothing else in the app imports this file.
 *
 * Implements design "Compass Landing Options" → Turn 4 / 4a.
 */

const ASSETS = {
  logo: '/landing/CompassLogo.png',
  mountains: '/landing/mountains.png',
};

/* The `different` copy marks its key phrase with **asterisks** — the one claim
   that has to land even if the reader skims the rest of the paragraph. */
function withEmphasis(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? <strong key={i}>{part}</strong> : part
  );
}

const WAYPOINTS = [
  { num: 'I',    name: 'Profile',             pin: 'PROFILE',            time: '10 MIN',    pos: { left: '13.7%', top: '86.5%' },
    happens: ['Setting up your account and choosing your guide', 'A short intake on your industry, your role, and the team you actually lead'],
    different: 'Every product opens with a sign-up form and never mentions it again. The Compass **reads those fields as leadership context** — so every insight that follows is aimed at your industry, your level, and your team, not at leaders in general.' },
  { num: 'II',   name: 'Behaviors',           pin: 'BEHAVIORS',          time: '15 MIN',    pos: { left: '29.4%', top: '72.4%' },
    happens: ['The Compass asks how you lead day to day — answered as you normally show up, not as your best day', 'Your answers become the baseline every later chapter is measured against'],
    different: 'Most assessments sort you into a type and hand you the type’s advice. Nothing here gets scored against a personality grid — **your own words become the reference point**, which is what makes your team’s answers comparable later.' },
  { num: 'III',  name: 'Reflection',          pin: 'REFLECTION',         time: '20 MIN',    pos: { left: '42.5%', top: '85.5%' },
    happens: ['The Compass writes your personalized leadership insights map — four short parts, drawn entirely from your own answers', 'Your guide walks you through it, page by page'],
    different: 'A generated report usually reads like it could belong to anyone. This one is **written from nothing but your own answers** — no archetypes, no benchmark cohort — and your guide reads it with you, so the hardest pages land in a voice you chose.' },
  { num: 'IV',   name: 'Growth Campaign',     pin: 'GROWTH CAMPAIGN',    time: '15 MIN',    pos: { left: '50.5%', top: '76.5%' },
    happens: ['Your annual growth campaign gets built alongside the Compass', 'Three traits get chosen, and fifteen statements your team will answer get written'],
    different: 'Every 360 tool ships a fixed question bank written by someone who has never met your team. Here **the statements come out of your own vocabulary** — which is the reason nobody can wave the results off as somebody else’s survey.' },
  { num: 'V',    name: 'Calibrate',           pin: 'CALIBRATE',          time: '10 MIN',    pos: { left: '59%',   top: '71.5%' },
    happens: ['Your campaign goes live — your answers first, then your team’s, anonymously', 'The first real data on how you are doing lands'],
    different: 'Most feedback tools survey the team and hand the leader a score. You answer the same statements first, on purpose — so what comes back isn’t a grade, it’s **the distance between how you see it and how they do**.' },
  { num: 'VI',   name: 'Review & Reflect',    pin: 'REVIEW & REFLECT',   time: '1 SITTING', pos: { left: '76.5%', top: '57%' },
    happens: ['Your narrative and data analysis land in your dashboard', 'The Compass walks you through how to read them'],
    different: 'Dashboards hand over numbers and leave the interpreting to you — which is how most feedback quietly goes unused. The Compass **reads the results with you**, narrative first, and says plainly what the gap between your view and theirs means.' },
  { num: 'VII',  name: 'Action Plan',         pin: 'ACTION PLAN',        time: '30 MIN',    pos: { left: '82%',   top: '47%' },
    happens: ['A guided exercise in your field journal', 'A practical one-page action plan for the year comes out of it'],
    different: 'Development plans usually get written once and filed where nobody reads them again. This one is one page, and **the next assessment reports directly against it** — the plan is what gets graded, not you.' },
  { num: 'VIII', name: 'Check-in Assessment', pin: 'CHECK-IN',           time: 'MONTH 3',   pos: { left: '86%',   top: '31.9%' },
    happens: ['The second assessment of your growth campaign runs', 'Your dashboard and field journal update with the new results'],
    different: 'A one-and-done survey can only ever give you a snapshot. Running the same statements a second time **turns a score into a trend** — and tells you whether three months of practice changed anything your team can actually feel.' },
  { num: 'IX',   name: 'Revise Action Plan',  pin: 'REVISE PLAN',        time: '20 MIN',    pos: { left: '84.5%', top: '22.8%' },
    happens: ['The updated feedback lands against your action plan, line by line', 'A revision for the back half of the year, made with your guide alongside'],
    different: 'Mid-year, most plans get adjusted on instinct — or not at all. This revision is **made against three months of evidence** from the people you actually lead, with a guide in the room who already knows what the numbers said.' },
  { num: 'X',    name: 'Final Assessment',    pin: 'FINAL',              time: 'MONTH 9',   pos: { left: '83.8%', top: '14.5%' },
    happens: ['A final self-assessment and team calibration close the year', 'A year-end ceremony celebrating your growth as a leader'],
    different: 'Most programs end with a certificate and a feeling. This one ends with the arc — **three readings across a year**, your view beside your team’s, showing exactly where you started and what actually changed.' },
];

/* The "Your Path, Your Guide, Your Growth" promise from the hero now lives
   here, one label leading into each pillar. Order is Path → Growth → Guide,
   matching the pillars' existing sequence rather than the nav's. */
const PILLARS = [
  {
    key: 'path',
    label: (
      <>
        Your <em>Path</em>
      </>
    ),
    body:
      'A rich summary built from your answers — your context, your behaviors, and your instincts. A book or TED talk inspires everyone similarly; the Compass reads you specifically.',
  },
  {
    key: 'growth',
    label: (
      <>
        Your <em>Growth</em>
      </>
    ),
    body:
      'Your team responds to anonymous surveys that you help craft — three times over a year. The Compass layers their responses with yours, revealing any gaps. That gap is your growth opportunity.',
  },
  {
    key: 'guide',
    label: (
      <>
        Your <em>Guide</em>
      </>
    ),
    body:
      'You’re not alone, but not all of us receive feedback the same way. You choose the voice that walks you through the difficult pages and harder discoveries throughout the year.',
  },
];

const GUIDES = [
  {
    id: 'mentor',
    name: 'Mentor',
    img: guideImage('mentor', 'idle'),
    crop: guideImage('mentor', 'idle'),
    accent: '#2F4A5C',
    tagline: 'Warm. Grounded. Asks the quiet questions.',
    quip: 'The quietest person in the meeting usually holds the most accurate map of it.',
    pitch:
      'Most leaders wait for a crisis to look inward. You could simply decide to look. I’ll hold the lantern.',
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    img: guideImage('catalyst', 'idle'),
    crop: guideImage('catalyst', 'idle'),
    accent: '#B8532C',
    tagline: 'Energetic. Optimistic. Ships first drafts fast.',
    quip: 'Teams don’t follow the plan. They follow whoever moves first.',
    pitch: 'Fifteen minutes today. A different team by spring. Why are we still talking?',
  },
  {
    id: 'challenger',
    name: 'Challenger',
    img: guideImage('challenger', 'idle'),
    crop: guideImage('challenger', 'idle'),
    accent: '#5A3C66',
    tagline: 'Direct. Honest. Won’t let you hide.',
    quip: 'If nobody disagreed with you this month, you weren’t agreed with. You were managed.',
    pitch: 'You call yourself self-aware. Prove it — ask the people who work for you.',
  },
  {
    id: 'bestFriend',
    name: 'Best Friend',
    img: guideImage('bestFriend', 'idle'),
    crop: guideImage('bestFriend', 'idle'),
    accent: '#1E6B75',
    tagline: 'Loyal. Easy company. Says the hard thing kindly.',
    quip: 'Nobody quits the company. They quit the Tuesday version of their boss.',
    pitch:
      'You’d want to know if something was off. Your team already knows. Let’s hear them out — together.',
  },
  {
    id: 'mother',
    name: 'Mother',
    img: guideImage('mother', 'idle'),
    crop: guideImage('mother', 'idle'),
    accent: '#C47A6A',
    tagline: 'Steady care. Warm accountability.',
    quip: 'A team can only be as honest as its leader is unhurried.',
    pitch: 'You invest in everyone but yourself. This year, that changes — I’ll see to it.',
  },
  {
    id: 'roaster',
    name: 'Roaster',
    img: guideImage('roaster', 'idle'),
    crop: guideImage('roaster', 'idle'),
    accent: '#A33A32',
    tagline: 'Sharp humor. Cuts through the spin.',
    quip: 'Everyone says they want feedback. What they want is applause with footnotes.',
    pitch: '$500 to learn what your team says after you leave the room? Honestly, a bargain.',
  },
];

const GROWTH = [
  {
    kicker: 'ONCE, AT THE START',
    title: 'Your self-assessment',
    body:
      'A 15-minute intake on how you actually lead — built into a personalized insights map that paints the full picture of you as a leader, in your own answers.',
  },
  {
    kicker: 'THREE TIMES THIS YEAR',
    title: 'Your growth campaign',
    body:
      'Anonymous 5-minute team surveys at the start, month three, and month nine — your own perception against how they experience your leadership. Every gap is named.',
  },
  {
    kicker: 'ALL YEAR',
    title: 'Action plans + your data',
    body:
      'An action plan built on the three traits you choose, revised after every calibration — with your guide alongside. Twelve months of access to all of it.',
  },
];

const SHOWCASE_TABS = [
  { id: 'signals', label: 'Signals Overview' },
  { id: 'effort', label: 'Effort & Effectiveness' },
  { id: 'gap', label: 'Gap Map' },
  { id: 'plan', label: 'Action Plan' },
];

/* Every score on this page is on the same 0–100 scale the product itself
   uses — no decimals, no second scale to translate. */
const SIGNAL_ROWS = [
  { name: 'Decisive Direction', compass: 53, effort: 69, efficacy: 45, growth: '+4', down: false },
  { name: 'Coaching', compass: 78, effort: 71, efficacy: 81, growth: '+18', down: false },
  { name: 'Strategic Patience', compass: 59, effort: 64, efficacy: 57, growth: '−7', down: true },
];

const GAP_ROWS = [
  { name: 'Decisive Direction', you: 84, team: 61 },
  { name: 'Coaching', you: 56, team: 79 },
  { name: 'Strategic Patience', you: 71, team: 54 },
];

const GUIDE_INSIGHTS = {
  gap: {
    'Decisive Direction': {
      mentor:
        'You gave yourself 84 because you decide fast. They gave you 61 because they find out afterward. Both are true.',
      catalyst:
        'Those 23 points are one habit wide — say the why before the what. Closable by the month-3 calibration.',
      challenger:
        'You experience decisiveness. They experience speed without a map. The 23 points between you is what that costs.',
      bestFriend:
        'They’re not saying you can’t decide. They’re saying they can’t see how you decide. That’s fixable.',
      mother:
        'Twenty-three points apart on direction means they’re guessing what you want. Guessing wears a team down.',
      roaster:
        'An 84 self-score against their 61. The 23 in between? Every decision you made alone and called alignment.',
    },
    Coaching: {
      mentor:
        'You scored yourself 56. They scored you 79. You’re the last one to see the coaching they already feel.',
      catalyst: 'Twenty-three points the right way. They’re already getting the coaching. Now do it on purpose.',
      challenger:
        'You think you’re behind on coaching. They don’t. Stop arguing with the people you lead.',
      bestFriend: 'They’re not being nice. They’re telling you this is working. Believe them.',
      mother: 'You under-count the care you give. They didn’t. That’s a gift — protect it.',
      roaster:
        'You 56, them 79. Humble isn’t the same as accurate. They’re saying you’re better at this than you think. Awkward.',
    },
    'Strategic Patience': {
      mentor:
        'You feel patient at 71. They feel the wait at 54. Name the pause, and it becomes leadership instead of delay.',
      catalyst:
        'Seventeen points down. Speed is a gift until the team can’t see where you’re going with it.',
      challenger:
        'Seventeen points on patience. You call it urgency. They call it being rushed. Which one is the room living in?',
      bestFriend:
        'They’re not asking you to slow down forever. They’re asking to catch up. That’s fair.',
      mother:
        'Urgency without rest wears a team thin. A little more air in the room, and they’ll meet you there.',
      roaster:
        'You 71, them 54. You think you’re waiting. They think you’re already gone. Cute mismatch.',
    },
  },
  signals: {
    'Decisive Direction': {
      mentor:
        '53 out of 100 — the lowest on the board, and it moved 4 points all year. They feel the call, not the why.',
      catalyst: '53 and barely climbing. Four points is a rounding error. Say the why out loud and this number moves.',
      challenger: 'Lowest Compass you have, with 4 points to show for the year. Speed without a map costs exactly this.',
      bestFriend: 'A 53 isn’t a verdict on you. It’s a note that they can’t see how you decide yet.',
      mother: '53, up 4. Slow progress is still progress — but direction without the why wears a team down.',
      roaster: '53 out of 100, up a whole 4 points. At this pace you’ll be adequate sometime next decade.',
    },
    Coaching: {
      mentor: '78 out of 100, up 18. Highest on the board and the biggest move — the 18 is the proof they felt it.',
      catalyst: 'Up 18 points. Coaching is compounding. Keep feeding this and month 9 writes itself.',
      challenger: 'Best number you have. Don’t coast it. Growth you stop tending regresses.',
      bestFriend: 'They felt the coaching, and 18 points is them saying so. Protect that.',
      mother: 'Look what grew where you paid attention. Eighteen points of care they can point to.',
      roaster: '78, up 18. Coaching’s the bright one. Try not to get sentimental — just do it again.',
    },
    'Strategic Patience': {
      mentor: '59 out of 100, and down 7. Just above direction, and moving the wrong way.',
      catalyst: 'Down 7. Speed is a gift until they can’t see where you’re going with it.',
      challenger:
        'A 7-point drop. You call it urgency. They call it being rushed. Guess which one the room is living in.',
      bestFriend: 'They’re not asking you to slow down forever. They’re asking to catch up.',
      mother: 'A 59, down 7. Urgency without rest wears a team thin. Give the room a little air.',
      roaster: 'Patience took the L — down 7. Better at listening, worse at waiting. Poetry.',
    },
  },
  effort: {
    'Decisive Direction': {
      mentor: '69 effort, 45 effectiveness. You’re spending the energy. It isn’t landing where they stand.',
      catalyst: 'Effort 69, effectiveness 45. The leak is the landing, not the work. Say the why and this closes.',
      challenger: 'You put in 69 and delivered 45. That 24-point drop is the bill for deciding alone.',
      bestFriend: 'You’re trying — 69 says so. They just can’t follow the trying. That’s fixable.',
      mother: 'All that effort, and only 45 of it reaches them. Let them see the thinking, not just the answer.',
      roaster: '69 effort, 45 effectiveness. Lots of motion, not a lot of “we knew that was coming.”',
    },
    Coaching: {
      mentor: '71 effort, 81 effectiveness. You get more back than you put in. That’s a gift — notice it.',
      catalyst: 'Effectiveness above effort. This one pays interest. Do more of exactly this.',
      challenger: 'Effectiveness 81 on 71 effort. You’re good at this and still under-claiming it. Stop.',
      bestFriend: 'It costs you less than it gives them. That’s what a strength feels like from the inside.',
      mother: 'Eighty-one back on seventy-one given. Care rarely returns that cleanly. Keep it.',
      roaster: 'You get 81 out of a 71 effort. Somewhere a consultant is furious.',
    },
    'Strategic Patience': {
      mentor: '64 effort, 57 effectiveness. You’re waiting. They’re experiencing the wait without the why.',
      catalyst: 'Effort 64, effectiveness 57. Name the pause out loud and it becomes leadership instead of delay.',
      challenger: 'Seven points of your patience never arrive. Silence isn’t the same as strategy.',
      bestFriend: 'You’re holding back on purpose. They just can’t tell it’s on purpose.',
      mother: 'The patience is real; it isn’t reaching them. Say what you’re waiting for.',
      roaster: '64 in, 57 out. You think you’re waiting. They think you’re already gone.',
    },
  },
  plan: {
    mentor:
      'One root, one branch, one goal. You don’t report to this page — you live it, and the next calibration tells the truth.',
    catalyst: 'The root feeds you. The branch is what the team sees. They’ll see it by March.',
    challenger:
      'Your branch is public — end every meeting naming the decision. They’ll know if you skip it.',
    bestFriend: 'It’s one page you could recite in an elevator. That’s exactly why it works.',
    mother: 'Tend the root and the branch, and the goal takes care of itself. I’ll check on the gardener.',
    roaster: 'A year of growth on one page. Even you can’t lose this one.',
  },
};

const PRIVACY_TERMS = [
  {
    lead: 'Your data is yours.',
    body:
      ' Your reflection, scores, and gaps are never shared with your boss, your executive team, or HR. If it’s ever shared, you shared it.',
  },
  {
    lead: 'Your team is anonymous to you.',
    body: ' You see the aggregate — never who said what.',
  },
  {
    lead: 'No org dashboard — by design.',
    body: ' Companies buy seats; each leader owns the journey.',
  },
];

const NAV_LINKS = [
  { label: 'Your path', id: 'cl-route' },
  { label: 'Your guide', id: 'cl-guide' },
  { label: 'Your growth', id: 'cl-growth' },
  { label: 'Pricing', id: 'cl-pricing' },
];

function SectionRule({ label }) {
  return (
    <div className="cl-rule">
      <span>{label}</span>
    </div>
  );
}

/* One trait, two stacked bars. Used by the Effort & Efficacy panel: the top
   bar is what you spend, the bottom is what actually lands. */
function MeterPair({ topLabel, topValue, bottomLabel, bottomValue }) {
  return (
    <div>
      <div className="cl-signal-label">
        <span>{topLabel}</span>
        <span>{topValue}</span>
      </div>
      <div className="cl-signal-meter">
        <span style={{ width: `${topValue}%` }} />
      </div>
      <div className="cl-signal-label team">
        <span>{bottomLabel}</span>
        <span>{bottomValue}</span>
      </div>
      <div className="cl-signal-meter team">
        <span style={{ width: `${bottomValue}%` }} />
      </div>
    </div>
  );
}

function SignalRow({ row, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`cl-signal-row is-trio${selected ? ' is-active' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(row.name)}
    >
      <span className="cl-signal-name">{row.name}</span>
      <span className="cl-signal-metric is-compass">
        {row.compass}
        <em className="cl-signal-outof">/ 100</em>
      </span>
      <span className={`cl-signal-metric is-growth${row.down ? ' is-down' : ''}`}>{row.growth}</span>
    </button>
  );
}

function EffortRow({ row, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`cl-gap-row is-pair${selected ? ' is-active' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(row.name)}
    >
      <span className="cl-signal-name">{row.name}</span>
      <MeterPair
        topLabel="EFFORT"
        topValue={row.effort}
        bottomLabel="EFFICACY"
        bottomValue={row.efficacy}
      />
    </button>
  );
}

/* The gap map is a table now, not meters — the meters moved to Effort &
   Efficacy. The gap itself is subtracted here rather than authored, so the
   column can never drift away from the two numbers sitting beside it. */
function GapRow({ row, selected, onSelect }) {
  const gap = row.team - row.you;
  const down = gap < 0;
  return (
    <button
      type="button"
      className={`cl-signal-row is-quad${selected ? ' is-active' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(row.name)}
    >
      <span className="cl-signal-name">{row.name}</span>
      <span className="cl-signal-metric">{row.you}</span>
      <span className="cl-signal-metric is-team">{row.team}</span>
      <span className={`cl-signal-metric is-gap${down ? ' is-down' : ''}`}>
        {down ? '−' : '+'}
        {Math.abs(gap)}
      </span>
    </button>
  );
}

export default function CompassLanding() {
  const navigate = useNavigate();
  const [waypoint, setWaypoint] = useState(0);
  const [activeGuide, setActiveGuide] = useState('mentor');
  const [showcase, setShowcase] = useState('signals');
  const [gapTrait, setGapTrait] = useState('Decisive Direction');
  const [signalTrait, setSignalTrait] = useState('Decisive Direction');
  const [effortTrait, setEffortTrait] = useState('Decisive Direction');

  const wp = WAYPOINTS[waypoint];
  const guide = GUIDES.find((g) => g.id === activeGuide);
  const showcaseTrait =
    showcase === 'gap' ? gapTrait : showcase === 'effort' ? effortTrait : signalTrait;
  const railQuote =
    showcase === 'plan'
      ? GUIDE_INSIGHTS.plan[activeGuide]
      : GUIDE_INSIGHTS[showcase][showcaseTrait][activeGuide];

  const startJourney = () => navigate('/user-info');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="cl-page" data-compass-landing>
      <div className="cl-first">
      <nav className="cl-nav" aria-label="Primary">
        <div className="cl-brand">
          <img src={ASSETS.logo} alt="Compass logo" />
          <span className="cl-wordmark">The Compass</span>
        </div>
        <div className="cl-nav-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              className="cl-nav-link"
              onClick={() => scrollTo(link.id)}
            >
              {link.label}
            </button>
          ))}
          <button type="button" className="cl-btn-ember" onClick={startJourney}>
            Begin your expedition →
          </button>
        </div>
      </nav>

      <header className="cl-hero">
        <div className="cl-hero-copy">
        <span className="cl-eyebrow">AN AI-SUPPORTED INDIVIDUAL DEVELOPMENT PLAN</span>
        <h1>
          Leaders don&rsquo;t follow paths.
          <br />
          <em className="cl-gold">They set them.</em>
        </h1>
        <p className="cl-hero-sub clx-lede">Not a course. Not a coach. Not a personality quiz.</p>
        <p className="cl-hero-sub clx-body">
          The Compass is an <strong>Individual Development Plan</strong> built around how you
          actually lead — you answer, your team answers anonymously, and you spend a year
          practicing the traits that would change the most for the people you lead.
        </p>
        <div className="cl-pillars-grid">
          {PILLARS.map((pillar) => (
            <div className="cl-pillar" key={pillar.key}>
              <h3>{pillar.label}</h3>
              <p>{pillar.body}</p>
            </div>
          ))}
        </div>
        </div>
        <div className="cl-hero-cta">
          <button type="button" className="cl-btn-ghost" onClick={() => scrollTo('cl-route')}>
            Walk the expedition ↓
          </button>
        </div>
      </header>
      </div>

      <section className="cl-section cl-route" id="cl-route" aria-label="Your path">
        <SectionRule label="YOUR PATH" />
        <h2>
          Build a personalized growth plan. <em>At your pace.</em>
        </h2>
        <div className="cl-map">
          <div className="clx-curl is-left" aria-hidden="true" />
          <div className="clx-curl is-right" aria-hidden="true" />
          {/* The artwork and everything anchored to it sit in an inner frame, so
              the parchment margin around it widens the sheet without moving the
              pins off the hills or scaling the illustration. */}
          <div className="cl-map-inner">
          <img src={ASSETS.mountains} alt="Mountain route map" />
          {WAYPOINTS.map((point, i) => (
            <button
              key={point.num}
              type="button"
              className={`cl-pin${i === waypoint ? ' is-active' : ''}`}
              style={point.pos}
              aria-pressed={i === waypoint}
              onClick={() => setWaypoint(i)}
            >
              <span className="clx-pin-num">{point.num}</span>
              <span className="clx-pin-label">{point.pin}</span>
            </button>
          ))}
          <div className="cl-journal">
            <div className="cl-journal-head">
              <span className="cl-kicker">CHAPTER {wp.num}</span>
              <span className="cl-journal-time">{wp.time}</span>
            </div>
            <h3>{wp.name}</h3>
            <span className="cl-journal-label">WHAT HAPPENS</span>
            <ul className="clx-bullets">
              {wp.happens.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <span className="cl-journal-label ember">HOW THIS IS DIFFERENT</span>
            <p>{withEmphasis(wp.different)}</p>
          </div>
          </div>
        </div>
        <div className="cl-next-cta">
          <button type="button" className="cl-btn-ghost" onClick={() => scrollTo('cl-guide')}>
            Meet your guide ↓
          </button>
        </div>
      </section>

      <section className="cl-section cl-guides" id="cl-guide" aria-label="Your guide">
        <SectionRule label="YOUR GUIDE" />
        <h2>
          Six voices. <em>You pick who walks with you.</em>
        </h2>
        <div className="cl-guide-grid">
          {GUIDES.map((g) => {
            const on = activeGuide === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={`cl-guide-tile${on ? ' is-active' : ''}`}
                style={{ '--tile-accent': g.accent }}
                aria-pressed={on}
                onClick={() => setActiveGuide(g.id)}
              >
                <img src={g.img} alt={g.name} />
                <span className="cl-guide-name">{g.name}</span>
                <span className="cl-guide-tag">{g.tagline}</span>
                <div className="cl-guide-quote">
                  <p>&ldquo;{g.quip}&rdquo;</p>
                  <span className="cl-attrib">— {g.name.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="cl-guide-detail">
          <div className="cl-guide-detail-portrait">
            <img src={guide.img} alt={guide.name} />
          </div>
          <div>
            <div className="cl-guide-detail-head">
              <span className="cl-guide-detail-name">{guide.name}</span>
              <span className="cl-guide-detail-tag">{guide.tagline}</span>
            </div>
            <p className="cl-guide-detail-pitch">&ldquo;{guide.pitch}&rdquo;</p>
          </div>
        </div>
        <div className="cl-next-cta">
          <button type="button" className="cl-btn-ghost" onClick={() => scrollTo('cl-growth')}>
            How will I grow? ↓
          </button>
        </div>
      </section>

      <section className="cl-section cl-growth" id="cl-growth" aria-label="Your growth">
        <SectionRule label="YOUR GROWTH" />

        <div className="cl-showcase">
          <h2>
            This is what the year looks like. <em>Your guide reads it with you.</em>
          </h2>
          {/* Toggle buttons rather than a role="tab" widget: the panels below
              are plain content, not tabpanels, and cairn-theme.css repaints
              [aria-selected="true"] globally. */}
          <div className="cl-tabs" role="group" aria-label="Product showcase">
            {SHOWCASE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={showcase === tab.id}
                className={`cl-tab${showcase === tab.id ? ' is-active' : ''}`}
                onClick={() => setShowcase(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="cl-showcase-stage">
            <div className="cl-panel-frame">
            <div className="cl-panel-body">
              {showcase === 'gap' && (
                <div className="cl-gap-stack">
                  <span className="cl-kicker">PERCEPTION GAP · {gapTrait.toUpperCase()}</span>
                  <div className="cl-signal-head is-quad" aria-hidden="true">
                    <span />
                    <span>You</span>
                    <span>Team</span>
                    <span>Gap</span>
                  </div>
                  {GAP_ROWS.map((row) => (
                    <GapRow
                      key={row.name}
                      row={row}
                      selected={gapTrait === row.name}
                      onSelect={setGapTrait}
                    />
                  ))}
                  <p className="cl-signal-foot">
                    Gap is their read minus yours — the subtraction is already done. Below zero
                    means they experience less of it than you believe you give.
                  </p>
                  <p className="cl-signal-meta">
                    Campaign 2 of 3 · Team responses 7 of 9 · aggregate only, always.
                  </p>
                </div>
              )}

              {showcase === 'effort' && (
                <div className="cl-gap-stack">
                  <span className="cl-kicker">
                    EFFORT &amp; EFFICACY · MONTH 4 · {effortTrait.toUpperCase()}
                  </span>
                  {SIGNAL_ROWS.map((row) => (
                    <EffortRow
                      key={row.name}
                      row={row}
                      selected={effortTrait === row.name}
                      onSelect={setEffortTrait}
                    />
                  ))}
                  <p className="cl-signal-foot">
                    Effort is what you spend. Efficacy is what lands.
                  </p>
                </div>
              )}

              {showcase === 'signals' && (
                <div className="cl-gap-stack">
                  <span className="cl-kicker">SIGNALS OVERVIEW · MONTH 4 · {signalTrait.toUpperCase()}</span>
                  <div className="cl-signal-head is-trio" aria-hidden="true">
                    <span />
                    <span>Compass</span>
                    <span>Growth</span>
                  </div>
                  {SIGNAL_ROWS.map((row) => (
                    <SignalRow
                      key={row.name}
                      row={row}
                      selected={signalTrait === row.name}
                      onSelect={setSignalTrait}
                    />
                  ))}
                  <p className="cl-signal-foot">
                    Compass is your blended score out of 100. Growth is the points it moved since
                    the last campaign.
                  </p>
                  <p className="cl-signal-meta">
                    Campaign 2 of 3 · Team responses 7 of 9 · aggregate only, always.
                  </p>
                </div>
              )}

              {showcase === 'plan' && (
                <div className="cl-gap-stack">
                  <span className="cl-kicker">ACTION PLAN · DECISIVE DIRECTION</span>
                  <p className="cl-plan-intro">
                    Built once after your calibration, revised when new signals land. One page. You
                    live it — you don&apos;t log into it.
                  </p>
                  <div className="cl-plan-steps">
                    <div className="cl-plan-step">
                      <span className="cl-plan-label">ENVISION · IN THEIR SHOES</span>
                      <p className="quote">
                        &ldquo;Priorities shift mid-week and I find out in the standup. So I&apos;ve
                        stopped planning ahead.&rdquo;
                      </p>
                    </div>
                    <div className="cl-plan-step">
                      <span className="cl-plan-label">ROOT · WHAT FEEDS THE CHANGE</span>
                      <p>
                        Study one framework on decision cadence; bring the idea of &ldquo;decision
                        debt&rdquo; to the team.
                      </p>
                    </div>
                    <div className="cl-plan-step">
                      <span className="cl-plan-label ember">BRANCH · WHAT THE TEAM SEES</span>
                      <p>Close every meeting by naming the decision, the why, and who owns it.</p>
                    </div>
                    <div className="cl-plan-step is-last">
                      <div className="cl-plan-goal-label">
                        <span>TRAIT GOAL</span>
                        <em>61 today → 75 by month 9</em>
                      </div>
                      <div className="cl-plan-goal-meter">
                        <span style={{ width: '61%' }} />
                        <i />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="cl-panel-rail">
              <div className="cl-rail-portrait">
                <img src={guide.crop} alt={guide.name} />
              </div>
              <div className="cl-rail-quote">
                <p>&ldquo;{railQuote}&rdquo;</p>
                <span className="cl-attrib">— {guide.name.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="cl-guide-index" role="group" aria-label="Choose a guide">
            {GUIDES.map((g) => {
              const on = activeGuide === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`cl-guide-index-item${on ? ' is-active' : ''}`}
                  style={{ '--tile-accent': g.accent }}
                  aria-pressed={on}
                  aria-label={g.name}
                  onClick={() => setActiveGuide(g.id)}
                >
                  <span className="cl-guide-index-face">
                    <img src={g.img} alt="" />
                  </span>
                  <span className="cl-guide-index-name">{g.name}</span>
                </button>
              );
            })}
          </div>
          </div>
        </div>
        <div className="cl-next-cta">
          <button type="button" className="cl-btn-ghost" onClick={() => scrollTo('cl-pricing')}>
            How much will this cost me? ↓
          </button>
        </div>
      </section>

      <section className="cl-section cl-close" id="cl-pricing" aria-label="Your package">
        <SectionRule label="YOUR PACKAGE" />
        <h2>
          Full access. <em>No premium paywall.</em>
        </h2>

        {/* What you get, then what you pay — the section heading covers both,
            so the cards carry no heading of their own. */}
        <div className="cl-offering">
          <div className="cl-growth-grid">
            {GROWTH.map((card) => (
              <div className="cl-growth-card" key={card.title}>
                <span className="cl-growth-card-kicker">{card.kicker}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="cl-price-card">
          <span className="cl-price-kicker">ONE PRICE · NO TIERS</span>
          <div className="cl-price-row">
            <span className="cl-price-now">$500</span>
            <span className="cl-price-per">/ leader / year</span>
          </div>
          <p className="cl-price-copy">
            $500 per leader, per year. Same whether you buy it or your company does. No tiers
            inside. If you have been given an introductory code, you enter it at checkout.
          </p>
          <button type="button" className="cl-btn-ember cl-btn-lg" onClick={startJourney}>
            Begin your expedition — $500
          </button>
        </div>

        {/* Reframed from "the privacy contract" — same terms, stated as a promise. */}
        <div className="cl-privacy" aria-label="Our promise to you">
          <div className="cl-privacy-grid">
            <div>
              <span className="cl-privacy-kicker">OUR PROMISE TO YOU</span>
              <h2>
                Honest answers require <em>a locked journal.</em>
              </h2>
              <p className="cl-privacy-lede">
                This only works if everyone can tell the truth. So the rules are absolute, in both
                directions:
              </p>
            </div>
            <div className="cl-privacy-list">
              {PRIVACY_TERMS.map((term) => (
                <div className="cl-privacy-item" key={term.lead}>
                  <span className="cl-privacy-check">✓</span>
                  <p>
                    <strong>{term.lead}</strong>
                    {term.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="cl-close-title">
          The path doesn&apos;t exist
          <br />
          <em>until you set it.</em>
        </h2>
      </section>

      <footer className="cl-org-footer">
        <div className="cl-org-footer-inner">
          <p className="cl-org-kicker">North Star Partners</p>
          <p className="cl-org-about">
            The Compass is a product of North Star Partners. The methodology, assessments, written
            reflections, and campaign materials are proprietary intellectual property. Unauthorized
            copying or redistribution is not permitted.
          </p>
          <p className="cl-org-contact">
            Questions:{' '}
            <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
          </p>
          <p className="cl-org-legal">
            © {new Date().getFullYear()} North Star Partners. All rights reserved.{' '}
            <a href={DOCUMENTS_PATH}>Terms of Use</a> and <a href={`${DOCUMENTS_PATH}#privacy`}>Privacy Policy</a>
            {' '}apply when you create an account.{' '}
            <a href={FAQ_PATH}>FAQ</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
