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

const WAYPOINTS = [
  { num: 'I',    name: 'Profile',             pin: 'PROFILE',            time: '10 MIN',    pos: { left: '13.7%', top: '86.5%' },
    happens: ['Create your account', 'Choose your guide', 'Give your leader context'],
    gets: 'Your account is set, your guide is chosen, and your context is in. Nothing has been scored yet — that is next.' },
  { num: 'II',   name: 'Behaviors',           pin: 'BEHAVIORS',          time: '15 MIN',    pos: { left: '29.4%', top: '72.4%' },
    happens: ['A short intake on how you actually lead', 'Answered as you normally show up, not your best day'],
    gets: 'The raw material every later chapter reads from — how you actually lead, not a type.' },
  { num: 'III',  name: 'Reflection',          pin: 'REFLECTION',         time: '20 MIN',    pos: { left: '42.5%', top: '85.5%' },
    happens: ['Your answers come back as a written reflection', 'Read it in four short parts'],
    gets: 'A current-state mirror. Sit with it long enough to recognize yourself before you build anything.' },
  { num: 'IV',   name: 'Growth Campaign',     pin: 'GROWTH CAMPAIGN',    time: '15 MIN',    pos: { left: '50.5%', top: '76.5%' },
    happens: ['Choose three growth traits', 'Shape the statements your team will rate'],
    gets: 'The campaign your year runs on: three traits, fifteen statements, in language you would stand behind.' },
  { num: 'V',    name: 'Calibrate',           pin: 'CALIBRATE',          time: '10 MIN',    pos: { left: '59%',   top: '71.5%' },
    happens: ['Rate yourself first', 'Invite your team to answer anonymously'],
    gets: 'Your benchmark is in and the team has a way to answer. Closing the window opens the first reading — a signal, not a verdict.' },
  { num: 'VI',   name: 'Review & Reflect',    pin: 'REVIEW & REFLECT',   time: '1 SITTING', pos: { left: '76.5%', top: '57%' },
    happens: ['Read the team\u2019s signal next to your own', 'See where their read differs from yours'],
    gets: 'A first honest reading of how the team experiences you, next to how you see yourself.' },
  { num: 'VII',  name: 'Action Plan',         pin: 'ACTION PLAN',        time: '30 MIN',    pos: { left: '82%',   top: '47%' },
    happens: ['Build a one-page action plan', 'One visible practice per trait'],
    gets: 'A one-page plan you live, not log into — held until the next check-in tells you whether it is landing.' },
  { num: 'VIII', name: 'Check-in Assessment', pin: 'CHECK-IN',           time: 'MONTH 3',   pos: { left: '86%',   top: '31.9%' },
    happens: ['Your team calibrates again', 'The new signal lands next to the first'],
    gets: 'A growth line, not a snapshot: whether the practice is landing where the team can feel it.' },
  { num: 'IX',   name: 'Revise Action Plan',  pin: 'REVISE PLAN',        time: '20 MIN',    pos: { left: '84.5%', top: '22.8%' },
    happens: ['Keep what landed, rewrite what did not', 'Revised with your guide alongside'],
    gets: 'A sharper plan for the back half of the year, built on evidence instead of intention.' },
  { num: 'X',    name: 'Final Assessment',    pin: 'FINAL',              time: 'MONTH 9',   pos: { left: '83.8%', top: '14.5%' },
    happens: ['A final self-assessment and team calibration', 'The year read back to you'],
    gets: 'The arc of the year in one place — where you started, what changed, and what your team can now feel.' },
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
      'A written reflection built from your own answers — your instincts, and what each one costs you. A TED talk inspires everyone the same way. This reads you.',
  },
  {
    key: 'growth',
    label: (
      <>
        Your <em>Growth</em>
      </>
    ),
    body:
      'A coach never meets your team. Compass asks them — anonymously, three times across the year — and lays their answer against yours. That gap is the growth edge.',
  },
  {
    key: 'guide',
    label: (
      <>
        Your <em>Guide</em>
      </>
    ),
    body:
      'Some feedback stings. You choose the voice that walks you through the difficult pages and harder conversations, all year. Nobody summits alone.',
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
    pitch: '$250 to learn what your team says after you leave the room? Honestly, a bargain.',
  },
];

const GROWTH = [
  {
    kicker: 'TWICE THIS YEAR',
    title: 'Your self-assessment',
    body:
      'A 15-minute intake at the start and again at month nine — each producing a written 3–4 page reflection on how you actually lead.',
  },
  {
    kicker: 'THREE TIMES THIS YEAR',
    title: 'Team calibration',
    body:
      'Anonymous 5-minute team surveys at the start, month three, and month nine — your self-view laid against how they experience you, every gap named.',
  },
  {
    kicker: 'ALL YEAR',
    title: 'Action plans + your data',
    body:
      'An action plan built on the three traits you choose, revised after every calibration — with your guide alongside. Twelve months of access to all of it.',
  },
];

const SHOWCASE_TABS = [
  { id: 'signals', label: 'Signals overview' },
  { id: 'gap', label: 'The gap map' },
  { id: 'plan', label: 'Your action plan' },
];

const SIGNAL_ROWS = [
  { name: 'Decisive Direction', compass: 5.3, effort: 6.9, efficacy: 4.5, growth: '+0.4', down: false },
  { name: 'Coaching', compass: 7.8, effort: 7.1, efficacy: 8.1, growth: '+1.8', down: false },
  { name: 'Strategic Patience', compass: 5.9, effort: 6.4, efficacy: 5.7, growth: '−0.7', down: true },
];

const GAP_ROWS = [
  { name: 'Decisive Direction', you: 8.4, team: 6.1, delta: '−2.3', up: false },
  { name: 'Coaching', you: 5.6, team: 7.9, delta: '+2.3', up: true },
  { name: 'Strategic Patience', you: 6.9, team: 5.8, delta: '−1.1', up: false },
];

const GUIDE_INSIGHTS = {
  gap: {
    'Decisive Direction': {
      mentor:
        'You gave yourself 8.4 because you decide fast. They gave you 6.1 because they find out afterward. Both are true.',
      catalyst:
        'That 2.3 is one habit wide — say the why before the what. Closable by the month-3 calibration.',
      challenger:
        'You experience decisiveness. They experience speed without a map. The −2.3 is what that costs you.',
      bestFriend:
        'They’re not saying you can’t decide. They’re saying they can’t see how you decide. That’s fixable.',
      mother:
        'A −2.3 on direction means they’re guessing what you want. Guessing wears a team down.',
      roaster:
        'An 8.4 self-score against their 6.1. The 2.3 in between? Every decision you made alone and called alignment.',
    },
    Coaching: {
      mentor:
        'You scored yourself 5.6. They scored you 7.9. You’re the last one to see the coaching they already feel.',
      catalyst: 'A +2.3 the right way. They’re already getting the coaching. Now do it on purpose.',
      challenger:
        'You think you’re behind on coaching. They don’t. Stop arguing with the people you lead.',
      bestFriend: 'They’re not being nice. They’re telling you this is working. Believe them.',
      mother: 'You under-count the care you give. They didn’t. That’s a gift — protect it.',
      roaster:
        'You 5.6, them 7.9. Humble isn’t the same as accurate. They’re saying you’re better at this than you think. Awkward.',
    },
    'Strategic Patience': {
      mentor:
        'You feel patient. They feel the wait without the why. Name the pause, and it becomes leadership instead of delay.',
      catalyst:
        'Patience down a point. Speed is a gift until the team can’t see where you’re going with it.',
      challenger:
        'A −1.1 on patience. You call it urgency. They call it being rushed. Which one is the room living in?',
      bestFriend:
        'They’re not asking you to slow down forever. They’re asking to catch up. That’s fair.',
      mother:
        'Urgency without rest wears a team thin. A little more air in the room, and they’ll meet you there.',
      roaster:
        'You 6.9, them 5.8. You think you’re waiting. They think you’re already gone. Cute mismatch.',
    },
  },
  signals: {
    'Decisive Direction': {
      mentor:
        '5.3 Compass — the lowest on the board. Effort is there. Efficacy isn’t. They feel the call, not the why.',
      catalyst: '6.9 effort, 4.5 efficacy. The leak is the landing. Say the why and this is closable.',
      challenger: 'Lowest Compass you have. Speed without a map. The 4.5 efficacy is the bill.',
      bestFriend: 'They’re not asking you to decide less. They’re asking to see how you decide.',
      mother: 'Direction without the why wears a team down. Name it, and they’ll walk with you.',
      roaster: 'Lots of motion, not a lot of “we knew that was coming.” 4.5 efficacy. Ouch — and useful.',
    },
    Coaching: {
      mentor: '7.8 Compass. Highest on the board — and the +1.8 is the proof they felt it.',
      catalyst: 'Up 1.8. Coaching is compounding. Keep feeding this and month 9 writes itself.',
      challenger: 'Best number you have. Don’t coast it. Growth you don’t tend regresses.',
      bestFriend: 'They felt the coaching. That’s the kind of number you protect, not explain away.',
      mother: 'Look what grew where you paid attention. This is care they can point to.',
      roaster: 'Coaching’s the bright one. Try not to get sentimental. Just do it again.',
    },
    'Strategic Patience': {
      mentor:
        '5.9 Compass — just above direction. Efficacy is the short number: the wait without the why.',
      catalyst: 'Down 0.7. Speed is a gift until they can’t see where you’re going with it.',
      challenger:
        'You call it urgency. They call it being rushed. The 5.7 efficacy is which one the room is living in.',
      bestFriend: 'They’re not asking you to slow down forever. They’re asking to catch up.',
      mother: 'Urgency without rest wears a team thin. A little air, and they’ll meet you there.',
      roaster: 'Patience took the L. Better at listening, worse at waiting. Poetry.',
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

function MeterPair({ you, team }) {
  return (
    <div>
      <div className="cl-signal-label">
        <span>YOU</span>
        <span>{you.toFixed(1)}</span>
      </div>
      <div className="cl-signal-meter">
        <span style={{ width: `${you * 10}%` }} />
      </div>
      <div className="cl-signal-label team">
        <span>TEAM</span>
        <span>{team.toFixed(1)}</span>
      </div>
      <div className="cl-signal-meter team">
        <span style={{ width: `${team * 10}%` }} />
      </div>
    </div>
  );
}

function SignalRow({ row, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`cl-signal-row${selected ? ' is-active' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(row.name)}
    >
      <span className="cl-signal-name">{row.name}</span>
      <span className="cl-signal-metric is-compass">{row.compass.toFixed(1)}</span>
      <span className="cl-signal-metric">{row.effort.toFixed(1)}</span>
      <span className="cl-signal-metric">{row.efficacy.toFixed(1)}</span>
      <span className={`cl-signal-metric is-growth${row.down ? ' is-down' : ''}`}>{row.growth}</span>
    </button>
  );
}

function GapRow({ row, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`cl-gap-row${selected ? ' is-active' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(row.name)}
    >
      <span className="cl-signal-name">{row.name}</span>
      <MeterPair you={row.you} team={row.team} />
      <span className={`cl-gap-delta${row.up ? ' is-up' : ''}`}>{row.delta}</span>
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

  const wp = WAYPOINTS[waypoint];
  const guide = GUIDES.find((g) => g.id === activeGuide);
  const railQuote =
    showcase === 'plan'
      ? GUIDE_INSIGHTS.plan[activeGuide]
      : GUIDE_INSIGHTS[showcase][showcase === 'gap' ? gapTrait : signalTrait][activeGuide];

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
        <span className="cl-eyebrow">AN AI-POWERED INDIVIDUAL DEVELOPMENT PLAN</span>
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
          <img src={ASSETS.mountains} alt="Mountain route map" />
          <div className="clx-curl is-left" aria-hidden="true" />
          <div className="clx-curl is-right" aria-hidden="true" />
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
            <span className="cl-journal-label ember">WHAT YOU WALK AWAY WITH</span>
            <p>{wp.gets}</p>
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
                  {GAP_ROWS.map((row) => (
                    <GapRow
                      key={row.name}
                      row={row}
                      selected={gapTrait === row.name}
                      onSelect={setGapTrait}
                    />
                  ))}
                </div>
              )}

              {showcase === 'signals' && (
                <div className="cl-gap-stack">
                  <span className="cl-kicker">SIGNALS OVERVIEW · MONTH 4 · {signalTrait.toUpperCase()}</span>
                  <div className="cl-signal-head" aria-hidden="true">
                    <span />
                    <span>Compass</span>
                    <span>Effort</span>
                    <span>Efficacy</span>
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
                        <em>6.1 today → 7.5 by month 9</em>
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
          What you get. <em>And what you pay.</em>
        </h2>

        <div className="cl-price-card">
          <span className="cl-price-kicker">INTRODUCTORY PRICE · FIRST SET OF USERS</span>
          <div className="cl-price-row">
            <span className="cl-price-was">$500</span>
            <span className="cl-price-now">$250</span>
            <span className="cl-price-per">/ leader / year</span>
          </div>
          <p className="cl-price-copy">
            $500 per leader, per year. The first set of users pays $250 — same product, introductory
            price. Same whether you buy it or your company does. No tiers inside.
          </p>
          <button type="button" className="cl-btn-ember cl-btn-lg" onClick={startJourney}>
            Begin your expedition — $250
          </button>
        </div>

        {/* Sits under the price as a reminder of what the $250 actually buys. */}
        <div className="cl-offering">
          <h2>
            Everything you get. <em>Nothing behind a tier.</em>
          </h2>
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
