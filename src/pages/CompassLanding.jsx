import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/compass-landing.css';

const ASSETS = {
  logo: '/landing/CompassLogo.png',
  mountains: '/landing/mountains.png',
  mentor: '/landing/MentorLantern.png',
  challenger: '/landing/ChallengerArmsCross.png',
};

const WAYPOINTS = [
  {
    pin: 'I · YOUR REFLECTION',
    pinStyle: { left: '11%', bottom: '15%' },
    card: { num: 'I · Uncover', time: '15 MIN' },
    what: 'A 15-minute intake on how you lead under real conditions — the decisions you face, the pressure you carry, how your team hears you. Not a personality quiz.',
    get: 'Your written reflection: 3–4 pages on how you actually lead — your instincts, your blind spots, what each costs you. Instant, private, and yours alone.',
  },
  {
    pin: 'II · YOUR THREE TRAITS',
    pinStyle: { left: '39%', bottom: '21%' },
    card: { num: 'II · Reflect', time: 'INSTANT' },
    what: 'The reflection surfaces five growth traits calibrated to you — each one named, defined, and tied to a moment from your own intake.',
    get: 'You choose the three traits your year runs on. Not assigned — chosen. That decision shapes every check-in that follows.',
  },
  {
    pin: 'III · TEAM CALIBRATION',
    pinStyle: { left: '61%', bottom: '39%' },
    card: { num: 'III · Calibrate', time: '5 MIN' },
    what: 'Your team answers a 5-minute anonymous survey on observable behaviors — the same traits, seen from the other side of the table.',
    get: 'Your perception-gap map: how you see it laid against how they experience it, every gap named. Aggregate only, never individuals.',
  },
  {
    pin: 'IV · THE SUMMIT',
    pinStyle: { right: '5%', top: '10%' },
    card: { num: 'IV · Embark', time: '1 YEAR' },
    what: "A year-long campaign built on your three traits — check-ins, milestones, course corrections, and a guide who won't let it drift.",
    get: 'A dashboard of your journey, and — twelve months on — change your team can feel, and can say they feel.',
  },
];

const NAV_LINKS = [
  { label: 'The route', id: 'route' },
  { label: 'What you receive', id: 'route' },
  { label: 'Calibration', id: 'calibration' },
  { label: 'Pricing', id: 'pricing' },
];

function HorizonDivider({ label }) {
  return (
    <div className="cl-horizon" aria-hidden={false}>
      <span className="cl-horizon-line left" />
      <span className="cl-horizon-diamond" />
      <span className="cl-horizon-label">{label}</span>
      <span className="cl-horizon-diamond" />
      <span className="cl-horizon-line right" />
    </div>
  );
}

function JournalPages({ active }) {
  return (
    <>
      <div className={`cl-journal${active === 0 ? ' active' : ''}`} aria-hidden={active !== 0}>
        <span className="cl-journal-label">Field journal · Waypoint I — The reflection</span>
        <p className="cl-journal-quote">
          “You lead from momentum. When a room stalls, you fill the silence — often before your team
          has finished forming a thought.”
        </p>
        <span className="cl-journal-meta">Page 2 of 4 · instant, and yours alone</span>
        <img className="cl-journal-guide" src={ASSETS.mentor} alt="" />
      </div>

      <div className={`cl-journal${active === 1 ? ' active' : ''}`} aria-hidden={active !== 1}>
        <span className="cl-journal-label">Field journal · Waypoint II — The three traits</span>
        <div className="cl-trait-list">
          <span className="cl-trait chosen">Decisive Direction ✓</span>
          <span className="cl-trait chosen">Coaching ✓</span>
          <span className="cl-trait chosen">Strategic Patience ✓</span>
          <span className="cl-trait open">Change Leadership</span>
          <span className="cl-trait open">Vision Casting</span>
        </div>
        <span className="cl-journal-meta">Five calibrated options · you chose three</span>
      </div>

      <div className={`cl-journal${active === 2 ? ' active' : ''}`} aria-hidden={active !== 2}>
        <span className="cl-journal-label">Field journal · Waypoint III — Calibration</span>
        <div className="cl-journal-bars">
          <div>
            <div className="cl-mini-bar-head" style={{ color: '#3F647B' }}>
              <span>HOW YOU SEE IT</span>
              <span>8.4</span>
            </div>
            <div className="cl-mini-bar-track">
              <div className="cl-mini-bar-fill" style={{ width: '84%', background: '#3F647B' }} />
            </div>
          </div>
          <div>
            <div className="cl-mini-bar-head" style={{ color: '#B8532C' }}>
              <span>HOW YOUR TEAM SEES IT</span>
              <span>6.1</span>
            </div>
            <div className="cl-mini-bar-track">
              <div className="cl-mini-bar-fill" style={{ width: '61%', background: '#B8532C' }} />
            </div>
          </div>
        </div>
        <span className="cl-journal-meta">Gap: −2.3 · where your year starts</span>
      </div>

      <div className={`cl-journal${active === 3 ? ' active' : ''}`} aria-hidden={active !== 3}>
        <span className="cl-journal-label">Field journal · Waypoint IV — The dashboard</span>
        <div className="cl-dash-rows">
          <div className="cl-dash-row">
            <span>Campaign progress</span>
            <span style={{ color: '#B8532C' }}>Month 4 of 12</span>
          </div>
          <div className="cl-dash-progress">
            <div />
          </div>
          <div className="cl-dash-row">
            <span>Team responses</span>
            <span style={{ color: '#2F855A' }}>7 of 9 in</span>
          </div>
          <div className="cl-dash-row">
            <span>Next check-in</span>
            <span>Coaching · Tue</span>
          </div>
        </div>
        <span className="cl-journal-meta">A year of milestones and course corrections</span>
      </div>
    </>
  );
}

export default function CompassLanding() {
  const navigate = useNavigate();
  const [activeWaypoint, setActiveWaypoint] = useState(0);
  const active = WAYPOINTS[activeWaypoint];
  const calendlyUrl = String(import.meta.env.VITE_CALENDLY_URL || '').trim();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startJourney = () => navigate('/user-info');

  const talkToUs = () => {
    if (calendlyUrl) {
      window.open(calendlyUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // Placeholder until Calendly URL is configured in VITE_CALENDLY_URL
    scrollTo('pricing');
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
          <button type="button" className="cl-btn cl-btn-ember cl-btn-nav" onClick={startJourney}>
            Begin Your Journey →
          </button>
        </div>
      </nav>

      <section className="cl-hero" aria-label="Hero">
        <div className="cl-starfield" aria-hidden />
        <div className="cl-hero-inner">
          <span className="cl-eyebrow">Leadership development · Calibrated by your team</span>
          <h1>
            <em>Leaders don&apos;t follow paths.</em>
            <br />
            <span className="cl-gold-line">They set them.</span>
          </h1>
          <p className="cl-hero-sub">
            A written reflection of how you lead. An anonymous team survey of how it lands. A
            year-long campaign to close the gap. That&apos;s Compass — the whole of it.
          </p>
          <div className="cl-hero-ctas">
            <button type="button" className="cl-btn cl-btn-ember cl-btn-hero" onClick={startJourney}>
              Start your journey
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-outline cl-btn-hero"
              onClick={() => scrollTo('route')}
            >
              See the route
            </button>
          </div>
          <div className="cl-step-strip" aria-hidden>
            <span>I · UNCOVER — 15 MIN</span>
            <span className="cl-arrow">→</span>
            <span>II · REFLECT — INSTANT</span>
            <span className="cl-arrow">→</span>
            <span>III · CALIBRATE — 5 MIN</span>
            <span className="cl-arrow">→</span>
            <span className="cl-ember-step">IV · EMBARK — 1 YEAR</span>
          </div>
        </div>
      </section>

      <HorizonDivider label="The route" />

      <section className="cl-route" id="route">
        <div className="cl-route-head">
          <h2>
            The route <em>you&apos;re charting.</em>
          </h2>
          <p className="cl-route-sub">
            Click a waypoint — each one leaves a page in your field journal
          </p>
        </div>

        <div className="cl-map-frame">
          <span className="cl-tick tl" aria-hidden />
          <span className="cl-tick tr" aria-hidden />
          <span className="cl-tick bl" aria-hidden />
          <span className="cl-tick br" aria-hidden />
          <div className="cl-map-stage">
            <img src={ASSETS.mountains} alt="Mountain route map with four waypoints" />
            {WAYPOINTS.map((wp, i) => (
              <button
                key={wp.pin}
                type="button"
                className={`cl-wp-pin${activeWaypoint === i ? ' active' : ''}`}
                style={wp.pinStyle}
                aria-pressed={activeWaypoint === i}
                onClick={() => setActiveWaypoint(i)}
              >
                {wp.pin}
              </button>
            ))}
            <JournalPages active={activeWaypoint} />
          </div>
        </div>

        <div className="cl-step-cards" role="tablist" aria-label="Route waypoints">
          {WAYPOINTS.map((wp, i) => (
            <button
              key={wp.card.num}
              type="button"
              role="tab"
              aria-selected={activeWaypoint === i}
              className={`cl-wp-card${activeWaypoint === i ? ' active' : ''}`}
              onClick={() => setActiveWaypoint(i)}
            >
              <div className="cl-wp-card-row">
                <span className="cl-wp-num">{wp.card.num}</span>
                <span className="cl-wp-time">{wp.card.time}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="cl-detail">
          <div>
            <span className="cl-detail-label slate">What happens</span>
            <p className="cl-detail-what">{active.what}</p>
          </div>
          <div>
            <span className="cl-detail-label ember">What you receive</span>
            <p className="cl-detail-get">{active.get}</p>
          </div>
        </div>
      </section>

      <HorizonDivider label="Waypoint III · In depth" />

      <section className="cl-calibration" id="calibration">
        <div className="cl-cal-grid">
          <div className="cl-cal-left">
            <span className="cl-cal-eyebrow">Waypoint III · Calibration</span>
            <h2>
              The mirror only your team <em>can hold up.</em>
            </h2>
            <p className="cl-cal-body">
              A 5-minute anonymous survey on observable behaviors, laid against your self-view.
              Every gap named. You see the aggregate — never individuals.
            </p>
            <div className="cl-quote-row">
              <img src={ASSETS.challenger} alt="" />
              <div className="cl-quote-card">
                <p>
                  “You call it decisiveness. Your team calls it steamrolling — 2.3 points apart.”
                </p>
                <span className="cl-quote-attr">— Challenger, one of your three guides</span>
              </div>
            </div>
          </div>

          <div className="cl-gap-panel">
            <div className="cl-gap-head">
              <span className="cl-gap-trait">Decisive Direction</span>
              <span className="cl-gap-score">−2.3</span>
            </div>
            <div className="cl-gap-bars">
              <div>
                <div className="cl-gap-bar-head" style={{ color: '#6393AA' }}>
                  <span>HOW YOU SEE IT</span>
                  <span>8.4</span>
                </div>
                <div className="cl-gap-track">
                  <div
                    className="cl-gap-fill"
                    style={{
                      width: '84%',
                      background: 'linear-gradient(90deg, #3F647B, #6393AA)',
                      boxShadow: '0 0 20px rgba(99,147,170,0.8)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="cl-gap-bar-head" style={{ color: '#E07A3F' }}>
                  <span>HOW YOUR TEAM EXPERIENCES IT</span>
                  <span>6.1</span>
                </div>
                <div className="cl-gap-track">
                  <div
                    className="cl-gap-fill"
                    style={{
                      width: '61%',
                      background: 'linear-gradient(90deg, #C0612A, #E07A3F)',
                      boxShadow: '0 0 20px rgba(224,122,63,0.8)',
                    }}
                  />
                </div>
              </div>
            </div>
            <p className="cl-gap-takeaway">
              The decisiveness you feel is landing as pressure. This is where your year should
              start.
            </p>
          </div>
        </div>
      </section>

      <HorizonDivider label="Pricing" />

      <section className="cl-pricing" id="pricing">
        <div className="cl-price-grid">
          <div className="cl-price-card featured">
            <span className="cl-price-tier ember">Team · Early adopter</span>
            <div className="cl-price-row">
              <span className="cl-price-was">$500</span>
              <span className="cl-price-now">$250</span>
              <span className="cl-price-unit">/ year</span>
            </div>
            <p className="cl-price-body">
              One leader, one team, one year — every waypoint above, plus your guide.
            </p>
            <button type="button" className="cl-btn cl-btn-ember cl-btn-card" onClick={startJourney}>
              Start free, upgrade when ready
            </button>
          </div>

          <div className="cl-price-card plain">
            <span className="cl-price-tier muted">Organization</span>
            <div className="cl-price-row">
              <span className="cl-price-now plain">$500</span>
              <span className="cl-price-unit">/ leader / year</span>
            </div>
            <p className="cl-price-body">
              You buy the seats; each leader owns the journey. Nothing shared upward. No org
              dashboard — by design.
            </p>
            <button
              type="button"
              className="cl-btn cl-btn-ghost-gold cl-btn-card"
              onClick={talkToUs}
            >
              Talk to us
            </button>
          </div>
        </div>

        <div className="cl-close">
          <h2>
            The path doesn&apos;t exist
            <br />
            <em>until you set it.</em>
          </h2>
          <button type="button" className="cl-btn cl-btn-ember cl-btn-close" onClick={startJourney}>
            Begin Your Journey →
          </button>
          <p className="cl-footer-line">North Star Partners · Free to start · No credit card</p>
        </div>
      </section>
    </div>
  );
}
