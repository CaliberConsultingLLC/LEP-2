import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  {
    pin: 'I · UNCOVER',
    time: '15 MIN',
    title: 'Waypoint I — Uncover',
    pos: { left: '11%', bottom: '15%' },
    does:
      'A 15-minute intake on how you lead under real conditions — the decisions you face, the pressure you carry, how your team hears you. Not a personality quiz.',
    gets:
      'Your written reflection: 3–4 pages of AI-drawn insight on how you actually lead — your instincts, your blind spots, what each one costs you. Instant, private, yours alone.',
  },
  {
    pin: 'II · REFLECT',
    time: 'INSTANT',
    title: 'Waypoint II — Reflect',
    pos: { left: '39%', bottom: '21%' },
    does:
      'The reflection surfaces five growth traits calibrated to you — each named, defined, and tied to a moment from your own intake.',
    gets:
      'You choose the three traits your year runs on. Not assigned — chosen. That decision shapes every check-in that follows.',
  },
  {
    pin: 'III · CALIBRATE',
    time: '5 MIN',
    title: 'Waypoint III — Calibrate',
    pos: { left: '61%', bottom: '39%' },
    does:
      'Your team answers a 5-minute survey on observable behaviors — the same traits, seen from the other side of the table. Fully anonymous to you.',
    gets:
      'Your perception-gap map: how you see it laid against how they experience it, every gap named. Aggregate only, never individuals.',
  },
  {
    pin: 'IV · EMBARK',
    time: '1 YEAR',
    title: 'Waypoint IV — Embark',
    pos: { right: '5%', top: '10%' },
    does:
      'A year-long campaign on your three traits: your team recalibrates at months 3 and 9, you re-assess at month 9, and your guide won’t let it drift.',
    gets:
      'A living action plan revised after every calibration, a dashboard of the whole journey, and — twelve months on — change your team can feel.',
  },
];

const PILLARS = [
  {
    num: '01',
    title: (
      <>
        AI insight into how <em>you</em> lead
      </>
    ),
    body:
      'A written reflection built from your own answers — your instincts, and what each one costs you. A TED talk inspires everyone the same way. This reads you.',
  },
  {
    num: '02',
    title: <>Your team&apos;s honest read</>,
    body:
      'A coach never meets your team. Compass asks them — anonymously, three times across the year — and lays their answer against yours. That gap is the growth edge.',
  },
  {
    num: '03',
    title: <>A guide for the hard parts</>,
    body:
      'Some feedback stings. You choose the voice that walks you through the difficult pages and harder conversations, all year. Nobody summits alone.',
  },
];

const GUIDES = [
  {
    id: 'mentor',
    name: 'Mentor',
    img: '/guides/mentor.png',
    alt: '/landing/alt/mentor-alt.png',
    accent: '#2F4A5C',
    tagline: 'Warm. Grounded. Asks the quiet questions.',
    quip: 'The quietest person in the meeting usually holds the most accurate map of it.',
    pitch:
      'Most leaders wait for a crisis to look inward. You could simply decide to look. I’ll hold the lantern.',
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    img: '/guides/catalyst.png',
    alt: '/landing/alt/catalyst-alt.png',
    accent: '#B8532C',
    tagline: 'Energetic. Optimistic. Ships first drafts fast.',
    quip: 'Teams don’t follow the plan. They follow whoever moves first.',
    pitch: 'Fifteen minutes today. A different team by spring. Why are we still talking?',
  },
  {
    id: 'challenger',
    name: 'Challenger',
    img: '/guides/challenger.png',
    alt: '/landing/alt/challenger-alt.png',
    accent: '#5A3C66',
    tagline: 'Direct. Honest. Won’t let you hide.',
    quip: 'If nobody disagreed with you this month, you weren’t agreed with. You were managed.',
    pitch: 'You call yourself self-aware. Prove it — ask the people who work for you.',
  },
  {
    id: 'bestFriend',
    name: 'Best Friend',
    img: '/guides/best-friend.png',
    alt: '/landing/alt/bestFriend-alt.png',
    accent: '#1E6B75',
    tagline: 'Loyal. Easy company. Says the hard thing kindly.',
    quip: 'Nobody quits the company. They quit the Tuesday version of their boss.',
    pitch:
      'You’d want to know if something was off. Your team already knows. Let’s hear them out — together.',
  },
  {
    id: 'mother',
    name: 'Mother',
    img: '/guides/mother.png',
    alt: '/landing/alt/mother-alt.png',
    accent: '#C47A6A',
    tagline: 'Steady care. Warm accountability.',
    quip: 'A team can only be as honest as its leader is unhurried.',
    pitch: 'You invest in everyone but yourself. This year, that changes — I’ll see to it.',
  },
  {
    id: 'roaster',
    name: 'Roaster',
    img: '/guides/roaster.png',
    alt: '/landing/alt/roaster-alt.png',
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
  { id: 'gap', label: 'The gap map' },
  { id: 'signals', label: 'Signals overview' },
  { id: 'plan', label: 'Your action plan' },
];

const SIGNAL_ROWS = [
  { name: 'Decisive Direction', compass: 6.1, effort: 7.4, efficacy: 5.5, growth: '+1.2', down: false },
  { name: 'Coaching', compass: 6.8, effort: 6.2, efficacy: 7.1, growth: '+1.6', down: false },
  { name: 'Strategic Patience', compass: 5.8, effort: 6.9, efficacy: 5.2, growth: '−0.7', down: true },
];

const GAP_ROWS = [
  { name: 'Decisive Direction', you: 8.4, team: 6.1, delta: '−2.3' },
  { name: 'Coaching', you: 7.2, team: 6.8, delta: '−0.4' },
  { name: 'Strategic Patience', you: 6.9, team: 5.8, delta: '−1.1' },
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
        'You’re close. A four-tenths gap on coaching is a conversation you haven’t had yet — not a verdict.',
      catalyst: 'Nearly even. One more real coaching moment before month 3 and this one closes.',
      challenger:
        'You scored yourself 7.2. They gave 6.8. Close isn’t the same as true. Ask who you haven’t developed.',
      bestFriend:
        'They’re almost with you on this one. Almost is a gift — it means they want you to finish it.',
      mother: 'You’re tending them. They’re asking for a little more time. You can give that.',
      roaster:
        'A −0.4. The smallest gap on the map. Don’t let that make you skip it — that’s how it grows.',
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
        '6.1 Compass. They feel the decisions land. They don’t feel invited into how they got there.',
      catalyst: 'Effort is high, efficacy is the leak. Say the why before the what and this number moves.',
      challenger:
        'You are deciding. They are catching up. A 5.5 efficacy score is the cost of speed without a map.',
      bestFriend:
        'They’re not asking you to slow every call. They’re asking to see the call being made.',
      mother: 'Direction without the why wears a team down. Name it, and they’ll walk with you.',
      roaster:
        '7.4 effort, 5.5 efficacy. Lots of motion. Not a lot of “we knew that was coming.”',
    },
    Coaching: {
      mentor: 'This is the one that’s moving. 6.8 Compass — and the growth line is the proof they felt it.',
      catalyst: 'Up 1.6. Coaching is compounding. Keep feeding this and month 9 writes itself.',
      challenger: 'Best number on the board. Don’t coast it — growth you don’t tend regresses.',
      bestFriend: 'They felt the coaching. That’s the kind of number you protect, not explain away.',
      mother: 'Look what grew where you paid attention. This is care they can point to.',
      roaster: 'Coaching’s the bright one. Try not to get sentimental. Just do it again.',
    },
    'Strategic Patience': {
      mentor:
        '5.8 Compass on patience. Efficacy is the short number — the wait without the why.',
      catalyst: 'Down 0.7. Speed is a gift until they can’t see where you’re going with it.',
      challenger:
        'You call it urgency. They call it being rushed. The 5.2 efficacy is which one the room is living in.',
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
  { label: 'Your route', id: 'cl-route' },
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
      <span className="cl-gap-delta">{row.delta}</span>
    </button>
  );
}

export default function CompassLanding() {
  const navigate = useNavigate();
  const [waypoint, setWaypoint] = useState(0);
  const [activeGuide, setActiveGuide] = useState('mentor');
  const [showcase, setShowcase] = useState('gap');
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
      <nav className="cl-nav" aria-label="Primary">
        <div className="cl-brand">
          <img src={ASSETS.logo} alt="" />
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
        <span className="cl-eyebrow">NOT A COURSE. NOT A COACH. AN EXPEDITION.</span>
        <h1>
          Leaders don&apos;t follow paths.
          <br />
          <em className="cl-gold">They set them.</em>
        </h1>
        <p className="cl-hero-sub">
          Compass gets the truth out — anonymously — and turns it into your year of growth. One map.
          One guide. One team, finally honest.
        </p>
        <div className="cl-hero-cta">
          <button type="button" className="cl-btn-ghost" onClick={() => scrollTo('cl-route')}>
            Walk the expedition ↓
          </button>
        </div>
      </header>

      <section className="cl-section cl-route" id="cl-route" aria-label="Your route">
        <SectionRule label="YOUR ROUTE" />
        <h2>
          Four waypoints. <em>Your pace.</em>
        </h2>
        <div className="cl-map">
          <img src={ASSETS.mountains} alt="Mountain route map" />
          {WAYPOINTS.map((point, i) => (
            <button
              key={point.pin}
              type="button"
              className={`cl-pin${i === waypoint ? ' is-active' : ''}`}
              style={point.pos}
              aria-pressed={i === waypoint}
              onClick={() => setWaypoint(i)}
            >
              {point.pin}
            </button>
          ))}
          <div className="cl-journal">
            <div className="cl-journal-head">
              <span className="cl-kicker">FIELD JOURNAL</span>
              <span className="cl-journal-time">{wp.time}</span>
            </div>
            <h3>{wp.title}</h3>
            <span className="cl-journal-label">WHAT YOU DO</span>
            <p>{wp.does}</p>
            <span className="cl-journal-label ember">WHAT YOU WALK AWAY WITH</span>
            <p>{wp.gets}</p>
          </div>
        </div>
      </section>

      <section className="cl-section cl-pillars" aria-label="What Compass gives you">
        <div className="cl-pillars-grid">
          {PILLARS.map((pillar) => (
            <div className="cl-pillar" key={pillar.num}>
              <div className="cl-pillar-head">
                <span className="cl-pillar-num">{pillar.num}</span>
                <h3>{pillar.title}</h3>
              </div>
              <p>{pillar.body}</p>
            </div>
          ))}
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
      </section>

      <section className="cl-section cl-growth" id="cl-growth" aria-label="Your growth">
        <SectionRule label="YOUR GROWTH" />
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

        <div className="cl-showcase">
          <h3>
            See it before you buy it. <em>Click around — your guide reacts.</em>
          </h3>
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
                <img src={guide.alt} alt={guide.name} />
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
      </section>

      <section className="cl-privacy" aria-label="The privacy contract">
        <div className="cl-privacy-grid">
          <div>
            <span className="cl-privacy-kicker">THE PRIVACY CONTRACT</span>
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
      </section>

      <section className="cl-close" id="cl-pricing" aria-label="Pricing">
        <div className="cl-price-card">
          <span className="cl-price-kicker">EARLY ADOPTER · FIRST 200 LEADERS</span>
          <div className="cl-price-row">
            <span className="cl-price-was">$500</span>
            <span className="cl-price-now">$250</span>
            <span className="cl-price-per">/ year</span>
          </div>
          <p className="cl-price-copy">
            Half off, nothing else different. Same price whether you buy it or your company does. No
            tiers, no premium package, no paywalls inside.
          </p>
          <button type="button" className="cl-btn-ember cl-btn-lg" onClick={startJourney}>
            Begin your expedition — $250
          </button>
          <p className="cl-price-fine">
            30-day money-back guarantee. Not what we promised? Full refund, keep your reflection.
          </p>
        </div>

        <h2>
          The path doesn&apos;t exist
          <br />
          <em>until you set it.</em>
        </h2>
        <button type="button" className="cl-btn-ember cl-btn-lg" onClick={startJourney}>
          Begin your expedition →
        </button>
        <p className="cl-colophon">North Star Partners · $250 early adopter · 30-day guarantee</p>
      </section>
    </div>
  );
}
