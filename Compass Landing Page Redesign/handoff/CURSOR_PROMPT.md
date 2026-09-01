# Cursor prompt — Compass landing page redesign (staging)

Apply the following changes to the staging landing page. Target files:

- `src/pages/CompassLanding.jsx`
- `src/styles/compass-landing.css`

Production is untouched — these files only render behind the `useCairnTheme` flag. A rendered reference of the final result is in `reference-hero-map.png` in this folder. Do not change anything not listed below.

---

## 1. Nav bar

- Remove `<ProcessTopRail utilityOnly />` from the page entirely (no chapter header / user name / guide in the upper right).
- Restore the brand block on the left of `.cl-nav` (the CSS for `.cl-brand` / `.cl-wordmark` already exists):

```jsx
<div className="cl-brand">
  <img src={ASSETS.logo} alt="Compass logo" />
  <span className="cl-wordmark">The Compass</span>
</div>
```

- Keep the nav links + "Begin your expedition →" button on the right, as-is, except rename the first link label from **"Your route"** to **"Your path"** (same `cl-route` scroll target).

## 2. Hero

- Eyebrow text: `AN AI-POWERED INDIVIDUAL DEVELOPMENT PLAN` (was "INDEPENDENT").
- H1 becomes (line 1 white, non-italic; line 2 italic gold — existing classes handle this):

```jsx
<h1>
  Leaders don&rsquo;t follow paths.
  <br />
  <em className="cl-gold">They set them.</em>
</h1>
```

- Replace the single `.cl-hero-sub` paragraph with THREE stacked elements:

```jsx
<p className="cl-hero-sub clx-lede">Not a course. Not a coach. Not a personality quiz.</p>
<p className="cl-hero-sub clx-body">
  The Compass is an <strong>Individual Development Plan</strong> built around how you
  actually lead — you answer, your team answers anonymously, and you spend a year
  practicing the traits that would change the most for the people you lead.
</p>
<p className="cl-hero-sub clx-body clx-pillars-line">
  <strong>
    <span>Your <em>Path</em>.</span>
    <span>Your <em>Guide</em>.</span>
    <span>Your <em>Growth</em>.</span>
  </strong>
</p>
```

Notes: only "Individual Development Plan" is bold (capitalized exactly like that); "The Compass is an" is plain. Anywhere "individual development plan" appears on this page it should be capitalized as "Individual Development Plan".

- CSS to add:

```css
.cl-hero-sub.clx-lede{font-size:20px;font-weight:600;color:rgba(255,248,240,0.92);}
.cl-hero-sub.clx-body{margin-top:30px;}
.cl-hero-sub.clx-body strong{font-weight:800;color:#FFF8F0;}
.clx-pillars-line strong{display:inline-flex;gap:26px;flex-wrap:wrap;justify-content:center;}
.clx-pillars-line strong em{font-style:normal;color:var(--cl-ember);}
```

## 3. "Your path" section header

- `SectionRule` label: `YOUR PATH` (was "YOUR ROUTE").
- H2: `Build a personalized growth plan. <em>At your pace.</em>` (was "Four waypoints. Your pace.").

## 4. Map — curled edges

Static (no animation) rolled-parchment edges on the left and right of the map only. Inside `.cl-map`, after the `<img>`:

```jsx
<div className="clx-curl is-left" aria-hidden="true" />
<div className="clx-curl is-right" aria-hidden="true" />
```

```css
.cl-map{overflow:hidden;border:0;border-radius:6px;}
.clx-curl{position:absolute;top:0;bottom:0;width:52px;z-index:3;pointer-events:none;}
.clx-curl.is-left{left:0;background:linear-gradient(90deg,#6e5636 0px,#a98b58 5px,#e9d9b0 13px,#f9f0d7 19px,#cdb488 26px,rgba(74,56,32,0.34) 32px,rgba(74,56,32,0.14) 40px,rgba(74,56,32,0) 52px);border-radius:5px 0 0 5px;}
.clx-curl.is-right{right:0;background:linear-gradient(270deg,#6e5636 0px,#a98b58 5px,#e9d9b0 13px,#f9f0d7 19px,#cdb488 26px,rgba(74,56,32,0.34) 32px,rgba(74,56,32,0.14) 40px,rgba(74,56,32,0) 52px);border-radius:0 5px 5px 0;}
```

## 5. Map — ten chapter nodes (replaces the four WAYPOINTS)

Replace the `WAYPOINTS` array with the ten chapters below. Each node is COLLAPSED by default: a small pill containing only a tan circle with the Roman numeral in dark navy, centered on the trail node. The ACTIVE node expands to the right to reveal its name; clicking another node collapses the previous one. Chapter I (Profile, at the signpost) starts active.

```js
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
```

Pin markup (positions now use `left`/`top`, not `bottom`/`right`):

```jsx
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
```

Pin CSS (replaces the current `.cl-pin` padding/position behavior; keep the existing colors/border/active glow rules):

```css
.cl-pin{transform:translate(-17px,-50%);white-space:nowrap;z-index:2;display:flex;align-items:center;padding:4px;}
.cl-pin.is-active{z-index:4;}
.clx-pin-num{width:26px;height:26px;border-radius:50%;background:var(--cl-gold);color:#14294A;font-weight:800;font-size:11px;letter-spacing:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.clx-pin-label{max-width:0;opacity:0;overflow:hidden;margin:0;transition:max-width 0.3s ease,opacity 0.25s ease,margin 0.3s ease;}
.cl-pin.is-active .clx-pin-label{max-width:220px;opacity:1;margin:0 12px 0 9px;}
```

The `translate(-17px,-50%)` keeps the tan numeral circle centered on the trail dot while the pill expands to the right.

## 6. Map — field journal card

- Move it off the curled edge: `.cl-journal{left:76px;z-index:4;}` (was `left:20px`).
- Header kicker becomes `CHAPTER {wp.num}` (replaces "FIELD JOURNAL"); keep the time on the right.
- Title is just the chapter name (no numeral, no "Waypoint").
- "WHAT YOU DO" label becomes `WHAT HAPPENS`, and its body is a bulleted list; "WHAT YOU WALK AWAY WITH" stays a paragraph:

```jsx
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
```

```css
.clx-bullets{margin:5px 0 14px;padding:0 0 0 17px;}
.clx-bullets li{font-size:14px;line-height:1.55;margin:3px 0;}
.clx-bullets li::marker{color:var(--cl-ember-deep);}
```

## 7. Closing section

Remove the standalone "Begin your expedition →" button that sits AFTER the "The path doesn't exist / until you set it." heading. The heading stays; the button inside the price card stays.

## 8. Everything else

Unchanged: pillars, guides, growth cards, showcase, privacy, pricing card, footer, all responsive rules.
