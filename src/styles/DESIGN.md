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

Every process page opens with the Option C chapter header by default:

```text
[porthole 116px] │ CHAPTER II OF IX · BEHAVIORS & INSTINCTS
                 │ Instincts Under Pressure
                 │ Name the instincts that shape how you show up...
                                                   [META PLATE]
```

- Full tier row: porthole, vertical divider, text stack, right meta plate.
- Container: `display:flex`, `align-items:center`, `justify-content:space-between`, `gap:28px`, `border-bottom:1px solid --sand-200`, `padding-bottom:22px`, `margin-bottom:34px`.
- Left cluster: `display:flex`, `align-items:center`, `gap:26px`.
- Divider: `1px` vertical rule in `--sand-200` (`my:4px`) between porthole and text stack.
- Text stack gap is `9px`, title remains Fraunces 500 / 30px (Tier 1), subtitle uses `type.subtitle`.
- Eyebrow format is always `Chapter {ROMAN} of IX · {Chapter Name}`. The separator dot uses `--sand-300`.
- Meta plate frame: `surface-1`, `1px --sand-200` border, `radius-md`, `px:18px`, `py:13px`, `shadows.card`.
- Meta plate label: Mono 9.5px, 700, 0.18em tracking, uppercase, `--ink-soft`.
- Meta plate state row: pip set + count when `{ current, total }` is available and `total <= 8`; otherwise render count/value only. Active pips use `--orange`, idle pips use `--sand-300`.
- The meta slot replaces all per-page progress bars and step indicators.
- The porthole map position updates only when the chapter changes and stays still while paging within a chapter.
- The compact tier uses the same hairline and meta plate but removes the porthole and vertical divider.

### Header / Body Alignment Rule

Header column width must always equal page content column width.

- `ProcessTopRail contentMaxWidth` and `CompassLayout contentMaxWidth` must match on every page using both.
- Header and body share the same horizontal content padding via shared constants (`CONTENT_PX`) so porthole/plate edges align with cards below.
- No page should render a header that is visually narrower or wider than its body column.

### Journey Porthole

Use `src/components/JourneyPorthole.jsx` as the circular lens onto the
current map station.

- Sizes: 116px for headers, 218px for ceremony cards.
- Bezel: navy gradient, gold ring, north diamond, glass glint, and inner shadow.
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
