# Cursor task — replace the Trait Selection and Campaign Builder content areas

## What this is

A visual redesign of the **main content area only** on two Chapter IV pages in the Cairn (staging) theme:

- `src/pages/TraitSelection.jsx` — route `/trait-selection`
- `src/pages/CampaignBuilder.jsx` — route `/campaign-builder`

Open `reference.html` in this folder for a 1:1 pixel reference of both screens (1280 × 800). Everything in the reference above the content area — `CompassTopbar`, `ChapterHeader` porthole / chapter title / step tabs / status chip — is the existing shell and is **unchanged**. It is drawn in the reference only so you can see the pages in context.

## Scope rules

**Change only** the `useCairnTheme` render branch of each page — the JSX inside `<CompassLayout>`.

**Do not change:**
- `ProcessTopRail` / `ChapterHeader` / `CompassTopbar` / `JourneyPorthole` and their props (including the existing `chip={{ variant: 'sequence', ... }}` values).
- The legacy (non-Cairn) render branch at the bottom of each file.
- Data loading, `localStorage` keys (`focusAreas`, `selectedTraits`, `currentCampaign`), navigation targets, the guide context, or the `CairnGuidePanel` right rail.
- Selection logic: still exactly three traits, `handleTraitToggle` / `setSelectedTraits` semantics unchanged.

**Remove from these two pages:** `CairnLeftRail` (the 248px left spine of pills) and, on Campaign Builder, `CairnFlowButtons` — both pages now carry their own footer row. `CairnLeftRail` is still used elsewhere; do not delete the component.

## Design tokens

Use the existing tokens — `src/styles/tokens.js` (`colors`, `fonts`, `radii`, `shadows`, `surfaces`) and the CSS vars in `src/styles/cairn-theme.css`. No new colors. Mapping for the values in the reference:

| Reference hex | Token |
| --- | --- |
| `#0f1c2e` | `colors.ink` / `--ink` |
| `#44566c` | `colors.inkSoft` / `--ink-soft` |
| `#10223c` | `colors.navy900` |
| `#3f647b` | `colors.navy500` |
| `#e07a3f` | `colors.orange` |
| `#c0612a` | `colors.orangeDeep` |
| `#2f855a` | `colors.green` |
| `#fbf7f0` / `#f4ecdd` / `#e8dbc3` / `#d1bc93` | `colors.sand50` / `sand100` / `sand200` / `sand300` |
| `#f4cea1` | `colors.amberSoft` |
| card `20px` radius | `radii.lg`, `surfaces.card` |
| row `14px` radius | `radii.md` |

Type: `fonts.serif` (Fraunces) for the page headline, `fonts.sans` (Manrope) for body and rows, `fonts.mono` (JetBrains Mono) for eyebrows and micro-labels. `Montserrat` 800 stays on the footer nav labels, matching `CairnFlowButtons`.

---

## 1. Trait Selection — `/trait-selection`

One full-width card (`surfaces.card`, radius `radii.lg`, padding `26px 28px`, `display:flex; flex-direction:column; gap:18px`) filling the stage. Three stacked regions: header, five rows, footer.

### Header
- Eyebrow, `fonts.mono` 10.2px / 700 / `.22em` / uppercase / `colors.orangeDeep`: **Step 1 · Choose three**
- Headline, `fonts.serif` 28px / 500 / `-.02em` / lh 1.1 / `colors.ink`: **The three traits your year runs on**
- Intro, `fonts.sans` 13.5px / lh 1.55 / `colors.inkSoft`, `max-width:56ch`: *Five came out of your reflection. Pick the three that would change the most for the people you lead — you can change them until you build.*

There is **no** trait tracker / roman-numeral chip block on this page. The five rows are the only trait UI.

### The five rows

One row per entry in `focusAreas` (there are always five), rendered as a list — no one-at-a-time rail, no `activeIndex`. Each row is a click target that toggles selection via the existing `handleTraitToggle(focusArea.id)`.

Row: `display:grid; grid-template-columns:34px 232px 1fr 116px; align-items:center; gap:18px; padding:7px 16px; border-radius:radii.md`, list `gap:8px`.

1. **State circle** — 30px, `radii.circle`. Selected: `colors.green` fill, white `✓` in `fonts.serif` 700 12.5px. Unselected: `colors.sand200` fill, empty.
2. **Name block** —
   - `focusArea.subTraitName`, `fonts.sans` 800 15px, `colors.navy900`.
   - Second line, `display:flex; align-items:center; gap:7px; margin-top:3px`: `focusArea.traitName` at `fonts.sans` 11.5px `colors.inkSoft`, then — for the first three entries only, which are the reflection's recommendations — a **Suggested** tag: `fonts.mono` 8px / 700 / `.12em` / uppercase, `colors.orangeDeep` on `rgba(224,122,63,.1)`, padding `2px 5px`, radius 4px, `white-space:nowrap`. The tag must sit inline beside the parent trait name, never above it and never wrapping.
3. **Risk / Payoff** — `display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:22px`.
   - Label `Risk`: `fonts.mono` 8px / 700 / `.14em` / uppercase / `colors.orangeDeep`, `margin-bottom:4px`. Body: `focusArea.risk` (fall back to the existing `buildHazard()` output, stripped of the trailing "if this subtrait remains underdeveloped" clause).
   - Label `Payoff`: same, `colors.navy500`. Body: `focusArea.impact` (fall back to `buildImpactPreview()`).
   - Both bodies: `fonts.sans` 12px / lh 1.4 / `colors.ink`, clamped to two lines (`display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden`). Five rows plus header and footer must fit the fixed stage height without scrolling — keep the clamp.
   - The old **Context** column is removed. `buildTrailMarker()` is no longer rendered on this page.
4. **Action pill** — full column width, `padding:9px 0`, `radii.pill`, `fonts.sans` 800 12px.
   - Unselected: white fill, `1px solid colors.sand300`, `colors.navy900`, label **Choose**.
   - Selected: `colors.green` fill, `1px solid colors.green`, white, label **Selected**.
   - When three are already selected, unselected rows are non-interactive (existing `isDisabled` behavior) — dim to `opacity:.55`, keep the label "Choose".

Selected row surface: `background: color-mix(in srgb, var(--green) 6%, #fff)`, `border: 1px solid color-mix(in srgb, var(--green) 34%, var(--sand-200))`. Unselected: `colors.sand50` on `colors.sand200`.

The old centered "Trait N: …" detail pane, the `◆` divider, the three Context/Risks/Payoff cards and the "Choose This Trait" button are all removed.

### Footer
`border-top: 1px solid colors.sand200; padding-top:14px; display:flex; align-items:center; justify-content:space-between`.
- Left, `fonts.sans` 12.5px `colors.inkSoft`: **"{n} of three selected. Swap any of them before you build."** (reference shows "Three of three selected.")
- Right: label **Reflection** (`Montserrat` 800 13px `colors.inkSoft`) → 38px circle back button (`1.5px solid colors.sand300`, chevron-left, → `/summary`) → primary pill **Build the campaign**: `padding:12px 24px`, `radii.pill`, `colors.navy900` on `colors.amberSoft`, `shadows.buttonPrimary`, navigating to `/campaign-builder` via the existing `handleContinue()`. Disabled (`colors.sand200` fill, `colors.inkSoft` text) until three are selected.

---

## 2. Campaign Builder — `/campaign-builder`

Same card shell, same three regions, so the two pages read as one step.

### Header
`display:flex; align-items:flex-start; justify-content:space-between; gap:32px`.

Left column:
- Eyebrow: **Step 2 · Verify the questions**
- Headline (`fonts.serif` 28px, as above): **The sentences your team will rate**
- Intro: *Keep what feels fair and useful. Remove anything confusing, unfair, or outside this stretch. Your team sees only what you keep.*

Right column — the trait switcher, `display:flex; gap:8px; flex-shrink:0; margin-top:24px` so the pills sit level with the headline, not with the intro. One pill per campaign trait, replacing the left rail:

- `display:inline-flex; align-items:center; padding:11px 18px; border-radius:radii.md; white-space:nowrap` — width follows the label, no fixed width.
- Label only: the sub-trait name (`selectedTraitInfo[i].subTraitName`, e.g. Clarity / Deadline Management / Vision). No numerals, no roman numerals, no kept-count line.
- `fonts.sans` 700 13.5px.
- Active: `colors.navy900` fill, `colors.amberSoft` text, `shadows.buttonPrimary`. Inactive: white fill, `1px solid colors.sand200`, `colors.navy900` text.
- Clicking sets `expandedTrait`.

### Statement rows
One row per statement of the active trait (max five), list `gap:9px`.

`display:grid; grid-template-columns:30px 1fr 108px; align-items:center; gap:16px; padding:14px 16px; border-radius:radii.md`.

1. Index, `fonts.mono` 700 11px `colors.inkSoft`.
2. Statement text, `fonts.sans` 600 15px / lh 1.45 / `colors.navy900`, left-aligned (the current build centers it — don't).
3. Toggle pill, `padding:8px 0`, `radii.pill`, `fonts.sans` 800 11.8px, wired to the existing `handleStatementDismiss(trait, index, checked)`.

Kept row: `colors.sand50` on `colors.sand200`; pill = `rgba(224,122,63,.12)` fill, `1px solid rgba(224,122,63,.32)`, `colors.orangeDeep`, label **Remove**.

Removed row: `background: color-mix(in srgb, var(--orange-deep) 7%, var(--sand-50))`, `border: 1px solid color-mix(in srgb, var(--orange-deep) 32%, transparent)`, text `colors.inkSoft` with `text-decoration:line-through`, index in `colors.orangeDeep`; pill = `colors.green` fill, white, label **Restore**.

### Footer
Same rule and geometry as Trait Selection.
- Left, `fonts.sans` 12.5px `colors.inkSoft`: **"{kept} of {total} statements kept across three traits."** followed by **Rebuild campaign** as an inline text button (`colors.orangeDeep`, 700) wired to `handleRebuildCampaign()`.
- Right: label **Traits** → 38px circle back button → `/trait-selection` → primary pill **Review & send**, which keeps the current behavior: write `normalizeCampaignItems(campaign)` to `currentCampaign` in `localStorage`, then `navigate('/campaign-verify')`.

---

## Acceptance checks

1. Both pages render inside the existing shell with no change to the topbar, porthole, step tabs or status chip.
2. Trait Selection: all five `focusAreas` visible at once, no scrolling at 1280 × 800; Suggested tag inline beside the parent trait name on the first three; pill labels are exactly `Choose` and `Selected`; only Risk and Payoff columns.
3. Campaign Builder: three name-only pills sized to their text, level with the headline; active pill navy; statement rows left-aligned with Remove / Restore.
4. Selecting three traits still enables the primary action; `selectedTraits` and `currentCampaign` are written exactly as before.
5. Dark mode (`useDarkMode`) still resolves: use the tokens rather than the literal hexes so `[data-dark="true"]` overrides flow through.
6. No new dependencies, no new global CSS; styling stays in `sx` with tokens.
