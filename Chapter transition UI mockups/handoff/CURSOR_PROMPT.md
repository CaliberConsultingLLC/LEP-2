# Cursor prompt — replace the chapter-transition popup with the "guide panel" ceremony

## What this is

`Chapter Handoff Popup.dc.html` (in this zip) is the approved design for the chapter-transition
popup. **Option `2a`, in the section labelled Turn 2 at the top of the file, is the approved
design.** Turn 1 (`1a`, `1b`, `1c`) is earlier exploration — reference only, do not build it.

Open the file in a browser and click **I'm Finished** on `2a` to see the full interaction.

## Scope — this replaces the popup everywhere

This is the **only** chapter-transition popup. It replaces the current ceremony card in every
case where it fires today:

- `src/components/JourneyChapterCeremony.jsx` — rewrite the card. The two-beat state machine
  (`complete` → `walk` → `begin`) stays; the layout and copy model change.
- `src/components/JourneyCeremonyGate.jsx` — trigger logic stays as-is (fires on `chapterId`
  change, forward-only, once per chapter via the `journeyCeremonySeen` localStorage map).
- It fires **between every chapter change**, all nine chapters, for every guide.
- `JourneyPorthole.jsx` (`variant="ceremony"`) stays the map lens. No change needed except the
  diameter passed in (236 instead of 218).

## What changes from today's card

Today the card shows: eyebrow, title, `completeBlurb`, `Next: arriveHint`, button. Two long
paragraphs of description on both beats.

New model:

**Beat 1 — Complete.** Nothing but the map, the chapter line, the title, and the button.
No `completeBlurb`, no `Next:` hint. The user just finished this stretch; do not describe it
back to them.

- Card: 620 × 320 fixed, `#fbf7f0`, `1px solid var(--sand-200)`, `--cairn-radius-xl`,
  padding `26px 30px 26px 26px`, grid `236px 1fr`, **gap 40px**, `align-items: center`,
  `box-sizing: border-box`.
- Porthole: `variant="ceremony"`, diameter **236**.
- Eyebrow: JetBrains Mono 11.5px / 800 / `.16em` / uppercase — `CHAPTER {ROMAN} ·` in
  `var(--orange-deep)` then `COMPLETE ✓` in `var(--green)`.
- Title: Fraunces 31px / 600 / 1.1 / `-.02em` / `var(--ink)` — the chapter label only.
- Button: existing `buttons.primary`. Label **"I'm Finished"**. During the walk beat it reads
  "On the trail…" and is disabled at `opacity: .6`.

**Beat 2 — Arrive.** The card **keeps its size** and grows a guide panel out of its right edge.
Words stay in the card; the panel holds only the portrait.

- Guide panel: 250 × 320, `#10223C`, animates `width: 0 → 250` over `660ms
  cubic-bezier(.2,.8,.2,1)`, `opacity 0 → 1` over `380ms` with a `140ms` delay. The card
  wrapper is `display:flex; overflow:hidden; border-radius:24px` so the panel unfolds cleanly.
  - **Collapsed-state gotcha:** a `width: 0` flex item still lays out its children at
    min-content and blows up the card height. The panel needs `min-width: 0; position: relative;
    height: 320px; overflow: hidden`, and its contents must sit in an
    `position:absolute; left:0; top:0; width:250px; height:100%` inner div.
  - Portrait: the zoomed art used on the landing rail — `/public/landing/alt/<guide>-alt.png`,
    `position:absolute; left:50%; top:-8%; transform:translateX(-50%); width:210%`.
  - Bottom fade: `linear-gradient(180deg, rgba(16,34,60,0) 48%, rgba(16,34,60,.6) 78%,
    rgba(9,16,31,.96) 100%)`, plus `inset 18px 0 34px -18px rgba(4,9,26,.8)` on the left edge.
  - Attribution over the fade: `— MENTOR` (the selected guide's name), JetBrains Mono 10px /
    700 / `.2em` / uppercase / `var(--amber-soft)`, centered, `bottom: 16px`.
- Card text swaps to: eyebrow `CHAPTER {ROMAN} OF VII` (orange-deep), title = next chapter
  label, then **the guide's line for that chapter** — Fraunces italic 15.5px / 500 / 1.45 /
  `var(--ink-soft)`, max-width 300px, fading in `translateY(8px) → 0` over `520ms` with a
  `280ms` delay. Then the button, label **"Let's get started"**.
- **No `blurb` and no `arriveHint` on this beat.** The guide's line is the only prose. The
  guide is not briefing them on tasks — they are setting the mindset for the phase.

## Guide copy — the one content dependency

Each of the nine chapters needs one short line per guide (2 sentences max, ~160 characters),
in that guide's voice, about the mindset for the chapter they are entering. Not a task list.

Reference line (Mentor, arriving at Chapter V · Review & Reflect):

> "You are about to see your leadership through someone else's eyes. What lands here is not a
> verdict — it is the distance between what you intend and what they feel."

Structure it alongside the existing guide copy, e.g. a new
`src/data/guideChapterLines.js`:

```js
export const GUIDE_CHAPTER_LINES = {
  mentor: { behaviors: '…', campaign: '…', assessment: '…', reflect: '…', /* … */ },
  catalyst: { … }, challenger: { … }, bestFriend: { … }, mother: { … }, roaster: { … },
};
```

Key it off the station `key` values in
`src/pages/Dashboard/journey/journeyModel.js` (`intake`, `behaviors`, `campaign`,
`assessment`, `reflect`, `action`, `checkin`, `revise`, `final`) and the guide ids in
`src/data/guidePersonas.js` (`mentor`, `catalyst`, `challenger`, `bestFriend`, `mother`,
`roaster`). Fall back to `mentor` when a guide id is missing, same as
`src/data/guideBriefings.js` does today. Resolve the active guide from `GuideContext`
(`personaId`) with the `selectedGuideId` localStorage value as fallback.

`completeBlurb`, `blurb`, and `arriveHint` in `journeyModel.js` / `chapterMap` are no longer
read by the ceremony. Leave them in place for other surfaces; just stop passing them into the
card.

## Behavior that must not regress

- Backdrop `rgba(9,16,31,.5)` + `backdrop-filter: blur(4px)`, rendered through `createPortal`
  into `document.body` at `z-index: 10050`.
- The 600ms backdrop-dismiss guard and the trailing-`mouseup` swallow (desktop nav clicks were
  instantly dismissing the popup).
- `Escape` closes. `prefers-reduced-motion` skips the walk and the panel animation
  (show the arrived state directly).
- The map walk still follows `COMPASS_TRAIL` between the two stations' point indices.
  The mockup uses a `setInterval` tick because `requestAnimationFrame` is throttled in the
  preview iframe; in the app keep `requestAnimationFrame`, which is correct there.
- Mobile: below ~640px the guide panel should stack under the card (full width, portrait
  cropped to ~180px tall) rather than expanding sideways.

## Files in this zip

- `Chapter Handoff Popup.dc.html` — the mockup. `2a` is the approved design.
- `assets/journey-base.png` — copy of `/public/journey-base.png` (1536×1024), used by the lens.
- `assets/guides/*.png` — copies of `/public/guides/` and `/public/landing/alt/` art used in
  the mockup. Use the repo's own files, not these copies.
