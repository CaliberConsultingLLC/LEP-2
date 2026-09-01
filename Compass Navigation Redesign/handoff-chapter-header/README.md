# Handoff: Compass Chapter Header — global rollout

## What this is
The **new canonical top-of-page structure for every page in The Compass**: two stacked
bars, a corner porthole, chapter steps as tabs, one status chip, and a chapter drawer.
It replaces the current per-page header treatments, the left journey sidebar, and the
floating dashboard Dock.

Design reference: `Chapter Header Reference.html` in this bundle (pixel spec, not
shippable code) plus the three approved page mocks in `mocks/`. The approved direction
is option **4a** from the design exploration; 4b (Signal dashboard) and 4c (intake
question) show the same header on the two other page archetypes.

**Fidelity: high.** Structure, spacing, and type below are final. Every value maps to an
existing token in `src/styles/cairn-theme.css` / `src/styles/tokens.js` — do not
introduce new hex values, fonts, or radii.

---

## Anatomy

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  BAR 1 · navy, 60px            THE COMPASS            STAGING  ⬤Guide  (AR)  │  ← --navy-950
├──────────────────────────────────────────────────────────────────────────────┤
│ ⌾ 100px    CHAPTER III OF VII ▾                                              │
│ porthole   Leadership Reflection │ ①Summary ②Trait Selection ③Campaign …  [chip]│  ← BAR 2, white, 78px
└──────────────────────────────────────────────────────────────────────────────┘
     ↑ porthole straddles both bars: top:-38px, 5px white ring
```

### Bar 1 — navy utility bar (`--navy-950`, height 60px, padding 0 28px)
| Slot | Content | Spec |
|---|---|---|
| Left | empty 120px spacer (balances the right cluster) | — |
| Center | `The Compass` wordmark, **absolutely centered to the viewport** | Cinzel 600, 23px, `letter-spacing:-.03em`, `font-variant:small-caps`, `--amber-soft` |
| Right | env label · Guide pill · avatar | mono 8px `.16em` at 50% amber; pill `--navy-800` bg, `1px rgba(244,206,161,.22)`, pill radius; avatar 30px circle, Fraunces 700 12px |

The wordmark is centered on the **window**, not on the remaining space — it must not
shift when the right cluster grows. Use `position:absolute; left:50%; transform:translateX(-50%)`.

### Bar 2 — chapter rail (white, height 78px, `padding: 0 28px 0 152px`, `border-bottom:1px solid --sand-200`)
Left padding of **152px** is reserved for the porthole. Content order, left → right:

1. **Chapter block** (button, opens the drawer)
   - eyebrow: mono 9px 700 `.22em` uppercase, `--orange-deep` → `CHAPTER III OF VII`
   - caret: 10px `▾` (`--ink-soft`) closed / `▴` (`--orange`) open
   - title: Fraunces 500 21px `-.02em`, `--ink`, `white-space:nowrap` → chapter name
2. **Divider** — 1px × 34px `--sand-200`, `margin: 0 22px`
3. **Step tabs** — one per step in the chapter (see below)
4. `flex:1` spacer
5. **Status chip** — one per page archetype (see below)

### Porthole
- 100px circle, `position:absolute; left:28px; top:-38px` inside bar 2 (`z-index:3`), so it
  straddles the navy bar and the rail.
- 4px navy gradient bezel (`linear-gradient(155deg, --navy-700, --navy-950 70%)`), 2px
  `#dfb64a` inner ring at `inset:3px`, 8px amber diamond pinned at 12 o'clock, 92px map
  lens inside, orange location dot with the existing `phPulse` animation.
- Reuse `JourneyPorthole.jsx` — add `variant="corner"` (100px, 5px white outer ring
  `box-shadow: … , 0 0 0 5px #fff`).
- Clicking the porthole opens the same drawer as the chapter block.

### Step tabs
Active: full-height (78px) tab, `border-bottom:2px solid --orange`, numeral in an 18px
`--orange` filled circle (mono 8.5px 700 white), label Manrope 700 13.5px `--ink`.
Upcoming: `padding:0 18px; opacity:.6`, numeral in an 18px circle with
`1px --sand-300` border, label Manrope 600 13.5px `--ink-soft`.
Completed: `--green` filled circle with a ✓ glyph, otherwise upcoming styling.
Locked: upcoming styling at `opacity:.45` plus a 10px lock glyph after the label; not
clickable, and it carries the gate that the page used to explain after the click.

### Status chip (right end of bar 2)
`--sand-50` bg, `1px --sand-200`, pill radius, `padding:7px 14px`, `gap:10-12px`.
Contents are per archetype — one chip only, never two:
- **Sequence page** — mono `.2em` uppercase label + dot track + `n / total`
  (`SELECTED ⬤⬤⬤ 0 / 3`, `STAGE ⬤○○○ 1 / 4`)
- **Dashboard** — `RESPONSES 7 / 8` │ status word in `--green` (`Signal ready`)
- **Intake** — `QUESTION 14 / 32` + 92px×5px progress track + `Saved`

---

## The chapter drawer (revised — three columns)

Opens from the chapter block or the porthole. Full-width panel over the content area:
`background:--navy-950`, `border-bottom:1px solid rgba(244,206,161,.2)`,
`box-shadow:0 24px 48px rgba(9,16,31,.3)`, `animation: dropIn 240ms cubic-bezier(.2,.8,.2,1)`.
Inner grid: `padding: 26px 44px 30px 152px` (aligns with the rail's 152px),
`grid-template-columns: minmax(0,1fr) minmax(0,1fr) 272px; gap:40px; align-items:start`.

| Column | Content |
|---|---|
| **1 · Purpose** | eyebrow `WHAT THIS CHAPTER IS FOR` (mono 9.5px `--orange`) + `chapter.purpose` in Fraunces *italic* **400, 15.5px/1.55**, `#e8ddce`, `max-width:46ch`. Deliberately smaller than the old 20px line — it is context, not a headline. |
| **2 · What happens here** | `border-left:1px solid rgba(244,206,161,.14); padding-left:30px`. Eyebrow `WHAT HAPPENS HERE` (mono 9px, 60% amber) + 2-3 bulleted rows (5px orange dot, Manrope 500 13px/1.45, `#f0e9de`) from `step.whatHappens` for the **active step only** — not the chapter. Short fragments, no periods, no full sentences ("Four stages, read in order" / "Team score, trait by trait" / "Nothing to choose yet"). It says what this screen is, not what the chapter is, and **never** repeats the step names already in the rail. No time estimate, no footer meta line. |
| **3 · Review the map** | Unchanged from the approved mock: eyebrow `CHAPTER n OF VII` + a 112px map card (`journey-base` image, navy gradient scrim, mono caption). Click opens the existing full journey map modal. |

**Buttons are removed from the drawer.** The old "Walk through again / Replay the debrief /
See the full map" pills come out. Replay belongs on the page it replays (keep the existing
`phases.startReplay` entry point in the page body or a per-page overflow menu); "See the
full map" is now the map card itself.

Behaviour: click chapter block or porthole to toggle; `Esc` and outside-click close;
`aria-expanded` on the trigger, `role="region"` + `aria-label="Chapter overview"` on the
panel; focus moves to the panel on open and returns to the trigger on close. State is
per-page and not persisted.

---

## Copy source
Chapter names, numbers, and purposes — and the per-step "what happens here" fragments — live in
**`chapterMap.js`** (in this bundle → move to `src/data/chapterMap.js`). It is the single
source of truth and mirrors the phase list currently in `CompassJourneySidebar.jsx`.
Chapter numbering is **of VII**, matching that file — the older "of IX" strings in the
build are wrong and should be removed.

---

## Rollout: what changes per page

| Page / route | Chapter · active step | Chip | What is deleted from the page |
|---|---|---|---|
| `/user-info` | I · Your Context | `STEP 1 / 2` | page title block, `ProcessChapterHeader` subtitle |
| `/guide-select` | I · Choose Your Guide | `STEP 2 / 2` | page title block |
| `/form` (intake) | II · active step | `QUESTION n / 32` + progress + `Saved` | `ProcessTopRail` title/subtitle, the `Question n / 32` meta line, the autosave alert banner, the chapter intro dialog (its copy is now the drawer) |
| `/summary` | III · Summary | `STAGE n / 4` | chapter title block, bottom `‹ Trait Selection · Campaign Builder ›` pager |
| `/trait-selection` | III · Trait Selection | `SELECTED n / 3` | chapter title block, bottom pager, the in-page `0/3 selected` line under the CTA |
| `/campaign-intro`, `/campaign-builder`, `/campaign-verify` | IV · matching step | `STATEMENTS n / m` | per-page step headers and next/back chrome that duplicates the tabs |
| `/campaign/self` | V · Self-Assessment | `QUESTION n / m` | title block, progress banner |
| `/dashboard?tab=journey` (window open) | VI · Response Status | `RESPONSES n / m` | title block |
| `/dashboard?tab=*` | VII · Today / Signal / Evidence / Practice / Journey | `RESPONSES n / m` + status word | **the floating Dock**, the `showJourneyHeader` title/subtitle block, the per-tab action buttons in `headerMeta` (`Review the evidence →` is the Evidence tab; `Replay` moves into the page body) |
| all authenticated pages | — | — | **`CompassJourneySidebar` — deleted, not hidden.** The dashboard has no left rail; content is centered in the existing content column. |

Marketing / auth routes (`/`, `/pricing`, `/faq`, `/sign-in`, checkout) keep the plain
navy bar with no chapter rail: render bar 1 only.

---

## Implementation notes
- Build one component, `src/components/ChapterHeader.jsx`, that renders both bars, the
  porthole, the tabs, the chip, and the drawer. It replaces `ProcessTopRail` +
  `ProcessChapterHeader` as the single header surface; keep `ProcessTopRail` as a thin
  wrapper for one release if that is cheaper than touching every page at once.
- Props: `chapterId`, `activeStepId`, `chip` (a small render object or node), plus
  optional `stepStatus` (`{ [stepId]: 'done' | 'locked' }`) for gating.
- The header is `position:sticky; top:0` as a unit (both bars, `z-index:20`). The porthole
  needs `overflow:visible` on both bars.
- Responsive: below 1180px, drop step numerals and shorten labels to their first word;
  below 900px, replace the tab row with a single "Step n of m" button that opens the
  drawer, and shrink the porthole to 72px (`top:-26px`, rail padding-left 108px).
- Reduced motion: skip `dropIn` and `phPulse`.
- Do not hardcode hex. Every value above exists in `cairn-theme.css`.

## Acceptance criteria
1. Every authenticated page renders exactly one header (two bars) and no other page-level
   title block, and no page renders two count/progress indicators.
2. The wordmark is centered on the window on every page and does not move between pages.
3. The porthole straddles both bars with a 5px white ring, and clicking it opens the drawer.
4. The drawer shows purpose (left, 15.5px italic), a 2-3 fragment "what happens here" list
   for the active step (middle), and the map card (right) — no buttons, no time estimate.
   Switching steps changes the middle column; the purpose column does not change.
5. `CompassJourneySidebar` is gone from the tree; the dashboard Dock is gone; Practice
   still cannot be reached before Evidence, and the lock is visible on the tab.
6. Chapter numbering reads "of VII" everywhere and matches `chapterMap.js`.
7. Keyboard: tabs are reachable and activate on Enter/Space; `Esc` closes the drawer;
   focus returns to the trigger.
