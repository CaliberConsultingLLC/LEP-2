# Compass Design System

Anchored on the **locked-in pages**: Summary, Trait Selection, Intake Form,
User Info, Guide Select, and every Campaign step. The dashboard / Command
Center is being brought back **onto** this system — it is not a source of
truth.

## Single source of truth

`src/styles/cairn-theme.css` is the canonical declaration. Every token —
color, radius, shadow, motion — lives there as a CSS custom property scoped
under `html[data-theme="cairn"]`. Dark mode is handled by the same file via
`html[data-theme="cairn"][data-dark="true"]` overrides. Components written
in JS never have to branch on theme: they read CSS vars and inherit
whichever scope is active.

`src/styles/tokens.js` is a thin JS mirror so MUI `sx` props can import
named constants instead of typing `'var(--cairn-radius-lg)'` inline. **It
does not introduce new values.** If a value isn't in `cairn-theme.css`,
add it to the CSS file first, then mirror it in `tokens.js`, then add a
sample to `/design`.

## Journey Map Rules

The Journey Map integration is now the canonical progress system for Compass.
Where these rules conflict with older component patterns, these rules win.

### Typography

| Role | Font | Spec |
|---|---|---|
| Brand / map title / banner chapter name | **Cinzel** | 600, small-caps, tight tracking (-0.02 to -0.045em) |
| Page titles (header system) | **Fraunces** | 500, 30px (Tier 1) / 26px (Tier 2), letter-spacing -0.02em, line-height 1.12, color `--ink` |
| Subtitles / chapter voice | **Fraunces italic** | 500, 15.5px, line-height 1.45, color `--ink-soft`, max-width 52ch |
| Eyebrows / meta / counts | **JetBrains Mono** | 700, 10px, letter-spacing 0.22em, uppercase, color `--orange-deep` (eyebrow) or `--ink-soft` (meta) |
| Body / UI / controls | **Manrope** | 400-800 per existing scale |
| Question statements (instruments) | **Fraunces** | 500, 20px, line-height 1.4, color `--ink` |

Cinzel loads app-wide with weights 500, 600, and 700 alongside Fraunces,
Manrope, and JetBrains Mono.

### Page Headers

Every authenticated Compass page uses one canonical two-bar chapter header
(`src/components/ChapterHeader.jsx`). Marketing and auth routes render the navy
utility bar only.

```text
BAR 1 · navy 60px          THE COMPASS          STAGING  Guide  AR
BAR 2 · white 78px   ⌾  CHAPTER III OF VII ▾ | Trailhead · Markers · Hazards · New Trail   [chip]
                     100px porthole straddles both bars (top:-38px, 5px white ring)
```

- Utility bar: `--navy-950`, wordmark absolutely centered on the window
  (`left:50%; translateX(-50%)`), Cinzel 600 / 23px / small-caps / `--amber-soft`.
  Right cluster is env label, Guide pill, avatar. The wordmark must not shift
  when the right cluster grows.
- Chapter rail: white, `padding: 0 28px 0 152px`, `border-bottom: 1px solid --sand-200`.
  Left: chapter block (eyebrow `CHAPTER n OF VII`, Fraunces 21px name). Then a
  34px sand divider, step tabs, `flex:1`, one status chip.
- Copy, numbers, and step lists live in `src/data/chapterMap.js`. Numbering is
  **of VII**. "What happens here" hangs off the active step, not the chapter.
  Chapter popups fire only when `chapterId` changes (complete → begin next).
  Tab changes inside a chapter do not popup.
  Chapter III tabs are the four reflection stages (Trailhead, Trail Markers,
  Future Hazards, A New Trail) via `/summary?stage=`. The summary card is
  centered in the body; do not restore a left reflection rail.
  Chapter VI (Review & Act) holds Today, Signal, Evidence, and Practice as one
  residual dashboard. Chapter VII is the year Journey map — not the daily plan.
- Porthole: `JourneyPorthole` `variant="corner"` — 100px, 4px navy bezel, 2px
  brass inner ring, amber diamond at 12 o'clock, 5px white outer ring. Clicking
  it or the chapter name opens the drawer.
- Drawer: three columns (purpose / what happens here / map card). No buttons.
  Purpose is Fraunces italic 400, 15.5px/1.55, max 46ch. Map card opens the
  existing journey map modal.
- One header per page. One count/progress chip per page. Never two chips.

#### Status chip (right end of bar 2)

`--sand-50` bg, `1px --sand-200`, pill radius, `padding: 7px 14px`. One chip only:

| Archetype | Chip |
|---|---|
| Sequence page | mono label + dot track + `n / total` (`SELECTED 0 / 3`, `STAGE 1 / 4`) |
| Dashboard | `RESPONSES n / m` + status word in `--green` (`Signal ready`) |
| Intake | `QUESTION n / 32` + 92×5px progress track + `Saved` |

#### Responsive

- Below 1180px: drop step numerals; shorten tab labels to the first word.
- Below 900px: replace the tab row with `Step n of m` (opens the drawer);
  porthole 72px, `top:-26px`, rail padding-left 108px.
- Step tabs never `flex-shrink`. Native button chrome is stripped (`appearance: none`,
  transparent face) so the numbered labels stay visible and the chip stays on the right.

#### Reduced motion

Skip drawer `dropIn` and porthole `phPulse` when `prefers-reduced-motion` is set.

### Header / Body Alignment Rule

The chapter header is full-bleed (both bars span the window). Page bodies stay
in the existing `CompassLayout` content column. Do not add a left journey rail.

### Journey Porthole

Use `src/components/JourneyPorthole.jsx` as the circular lens onto the
current map station.

- Sizes: 100px `corner` (chapter header), 116px `header` (legacy/ceremony support), 218px `ceremony`.
- Bezel: navy gradient, brass/gold ring, north diamond, glass glint, and inner shadow.
- Corner variant adds a 5px white outer ring so it straddles the navy bar and the rail.
- Map background: `journey-base.png`, centered on the current station from the traced trail geometry.
- Center dot: orange with white border and a soft pulse, disabled under `prefers-reduced-motion`.
- Station changes transition with `background-position 1300ms cubic-bezier(0.2,0.8,0.2,1)`.

### Buttons And Selection Controls

- Primary button: pill radius, `--navy-900` background, `--amber-soft` text, Manrope 700 13px, letter-spacing 0.04em, padding 12px 22px, `white-space: nowrap`, hover to `--navy-800` with `translateY(-1px)`.
- Ghost button: transparent, 1px `--navy-500` border, `--navy-900` text, same pill and typography.
- Selection state for Likert pills, chips, and tabs: unselected uses white background, `--sand-200` border, and `--ink-soft` text; selected uses `--navy-900` background, `--amber-soft` text, and 700 weight.

## Catalog

The `/design` route renders every token live. Use it as a visual reference
when reviewing changes. It runs only under the cairn theme.

## Tokens

### Radii (`tokens.radii` → `--cairn-radius-*`)

| Token  | Value | Use                                                |
| ------ | ----- | -------------------------------------------------- |
| `sm`   | 10px  | Inner controls, small alerts                       |
| `md`   | 14px  | Inputs, alerts, secondary cards, inner data areas  |
| `lg`   | 20px  | **Primary cards (canonical)** — Paper / Card root  |
| `xl`   | 24px  | Hero / highlight cards (use sparingly)             |
| `pill` | 999px | Buttons, chips, toggles                            |

**Rule:** Never invent a radius. If you find yourself reaching for `borderRadius: 8`
or `borderRadius: 16`, stop. Use a token. If no token fits, add one to the CSS first.

### Colors (`tokens.colors` → CSS vars)

Brand navy ladder: `navy950 → navy300`. Body text uses the surface-aware
aliases (`textPrimary`, `textSecondary`) so dark mode flips automatically.

| Token             | Light value                  | Use                                       |
| ----------------- | ---------------------------- | ----------------------------------------- |
| `navy900`         | `#10223C`                    | Primary action bg, AppBar, focused ink    |
| `navy800`         | `#162A44`                    | Primary action hover                      |
| `amberSoft`       | `#F4CEA1`                    | Primary action **text**, AppBar text       |
| `orange`          | `#E07A3F`                    | Secondary action, accent ink              |
| `orangeDeep`      | `#C0612A`                    | Eyebrow text, link, focused input label   |
| `efficacyBlue`    | `#2B6BA8`                    | Efficacy-mode dial chrome (not navy)      |
| `gapNegative`     | `#B4321F`                    | Perception gap when team − self is < 0    |
| `gapPositive`     | `#2F6B4F`                    | Perception gap when team − self is ≥ 0    |
| `brass`           | amber 75% + orange-deep      | Dial case ring and north-arrow mid        |
| `dialFace`        | `#F4ECDD` (does not remap)   | Compass dial face — stays cream in dark   |
| `sand50`          | `#FBF7F0`                    | Page background (light), chip bg          |
| `sand100`         | `#F4ECDD`                    | Subtle wash surface, alert bg             |
| `sand200`         | `#E8DBC3`                    | Card border, divider                      |
| `surface1`        | `#FFFFFF` (light) / `#10223C` (dark) | Card background                  |
| `surface2`        | `var(--sand-50)`             | Recessed surface                          |
| `textPrimary`     | `var(--ink)` → `#0F1C2E`     | Primary copy                              |
| `textSecondary`   | `var(--ink-soft)` → `#44566C`| Secondary copy                            |
| `borderSoft`      | `var(--sand-200)`            | All hairlines                             |
| `ringFocus`       | `rgba(224,122,63,0.32)`      | Focus rings on every interactive element  |

**Rule:** Never write a hex literal in a component. Use the token. The same
component will then look correct in dark mode without any conditional.

### Shadows (`tokens.shadows`)

| Token                  | Use                                                  |
| ---------------------- | ---------------------------------------------------- |
| `none`                 | Inner cards, flat surfaces                           |
| `card`                 | **Canonical card shadow** (matches MuiPaper-root)    |
| `cardHover`            | Hover lift on interactive cards                      |
| `inset`                | Pressed look (used sparingly)                        |
| `overlay`              | Popovers, menus, modals                              |
| `buttonPrimary`        | Primary button rest                                  |
| `buttonPrimaryHover`   | Primary button hover                                 |
| `buttonSecondary`      | Secondary (orange) button rest                       |
| `appBar`               | Top app bar                                          |
| `dialCase`             | Compass dial navy bezel                              |
| `dialNode`             | Unselected dial node                                 |
| `dialNext`             | Evidence next-trait arrow button                     |

### Type (`tokens.type`)

Pre-built sx fragments. Apply with `sx={{ ...type.eyebrow }}`.

| Token         | Pattern                                                       |
| ------------- | ------------------------------------------------------------- |
| `eyebrow`     | JetBrains Mono, 10px, 0.22em tracking, uppercase, orange-deep |
| `lead`        | Fraunces 22–26px, -0.018em tracking, primary text             |
| `sectionTitle`| Fraunces italic 18px, primary text                            |
| `body`        | Manrope 14px / 1.55                                           |
| `bodyMuted`   | Manrope 13px / 1.5, secondary text                            |
| `italicBody`  | Fraunces italic 15.5px / 1.5 — interpretive prose             |
| `monoLabel`   | JetBrains Mono 9.5px caps — stat row labels, axis labels      |
| `statNumber`  | JetBrains Mono 17px tabular-nums                              |

### Motion

`tokens.motion.standard` → `var(--cairn-motion)` → `180ms cubic-bezier(.2,.8,.2,1)`.
Use it on every `transition` declaration.

## Surfaces (`tokens.surfaces`)

Composable sx fragments — spread them in:

```jsx
<Box sx={{ ...surfaces.card, p: 3 }}>...</Box>
```

| Token       | When to use                                                    |
| ----------- | -------------------------------------------------------------- |
| `card`      | Default standalone card. Border + canonical shadow + radius lg |
| `cardFlat`  | Card nested inside another card (no shadow)                    |
| `cardInner` | Smaller grouped subsection inside a card (radius md, no shadow)|

## Buttons (`tokens.buttons`)

| Token             | Pattern                                                |
| ----------------- | ------------------------------------------------------ |
| `primary`         | Navy bg, amber-soft text, pill, primary CTA            |
| `secondary`       | Orange bg, white text, pill, secondary CTA             |
| `outlinedPrimary` | Transparent bg, navy border + text                     |

For most buttons just use MUI `<Button variant="contained">` — the cairn-theme.css
overrides handle styling. Reach for these sx fragments only when you need a
custom-base element (e.g. a styled `<Box component="button">`).

## Chips (`tokens.chips`)

| Token    | Pattern                                                       |
| -------- | ------------------------------------------------------------- |
| `base`   | Mono caps, 11px, sand-50 bg, sand-200 border                  |
| `active` | Selected state — navy bg, amber-soft text                     |
| `hover`  | Hover state nesting                                           |

Compose:

```jsx
<Box sx={{ ...chips.base, ...chips.hover, ...(active && chips.active) }} />
```

## Hard rules

These are enforced by `.cursor/rules/compass-design-system.mdc` and apply
to every new or modified Compass component:

1. **No hex literals in components.** Use tokens.
2. **No off-scale radii.** Use `radii.*`.
3. **No off-scale shadows.** Use `shadows.*`.
4. **No off-scale font sizes.** Use a `type.*` preset or document the deviation.
5. **No nested cards with shadows.** Inner cards use `surfaces.cardFlat` or `surfaces.cardInner`.
6. **Always test dark mode.** Open `/design` with the dark toggle.
7. **The locked-in pages are canon.** When in doubt, match what Summary / Trait
   Selection / Intake Form / Guide Select already do.

## Adding a new token

1. Add the CSS custom property to `src/styles/cairn-theme.css` under
   `html[data-theme="cairn"]`.
2. If the token should change in dark mode, add the override under
   `html[data-theme="cairn"][data-dark="true"]`.
3. Mirror the value in `src/styles/tokens.js`.
4. Add a sample to `src/pages/DesignSystem.jsx` so it shows up at `/design`.
5. Document it here.
