# Cursor prompt — Compass chapter header, global rollout

Paste this whole file as your first message to Cursor with this folder open in the repo.

---

You are working in the LEP2 repo (React + Vite + MUI, cairn theme). Read
`handoff-chapter-header/README.md` end to end before writing code — it is the spec, it is
high-fidelity, and its acceptance criteria are the definition of done. Also read
`handoff-chapter-header/Chapter Header Reference.html` (pixel spec of the header, not
shippable code) and the three page mocks in `handoff-chapter-header/mocks/`.

## Goal
Replace every page-level header treatment in the app with one canonical two-bar chapter
header: a navy utility bar with the wordmark centered, a white chapter rail whose left
corner is straddled by the 100px porthole, the chapter's steps as tabs in that rail, one
status chip at the right end, and a chapter drawer that opens from the chapter name or the
porthole. Then delete the surfaces it makes redundant — including the left journey sidebar
and the floating dashboard Dock.

## Order of work
1. Add `src/data/chapterMap.js` from `handoff-chapter-header/chapterMap.js`. It is the
   single source of truth for chapter numbers, names, step lists, and drawer copy —
   note that "what happens here" copy hangs off each STEP, not the chapter.
   Numbering is "of VII" and mirrors `CompassJourneySidebar.jsx`; delete any "of IX" strings.
2. Build `src/components/ChapterHeader.jsx` — both bars, porthole, tabs, chip slot, drawer.
   Props: `chapterId`, `activeStepId`, `chip`, `stepStatus`. Use MUI `sx` with existing
   tokens from `src/styles/cairn-theme.css` / `src/styles/tokens.js`. Do not add new hex
   values, fonts, or radii.
3. Add `variant="corner"` to `JourneyPorthole.jsx`: 100px, 4px navy bezel, 2px `#dfb64a`
   inner ring, amber diamond at 12 o'clock, 5px white outer ring, `phPulse` dot. It sits
   `position:absolute; left:28px; top:-38px` in the rail and must not be clipped.
4. Build the drawer as three columns exactly as specced: purpose (Fraunces italic 400,
   15.5px/1.55, max 46ch), "what happens here" (2-3 short fragments for the active step —
   no sentences, no time estimate, changes with the selected tab), map card
   (unchanged; opens the existing journey map modal). **No buttons in the drawer** — remove
   "Walk through again", "Replay the debrief", "See the full map"; keep replay entry points
   in the page body.
5. Convert `ProcessTopRail` into a thin wrapper around `ChapterHeader` so pages keep
   compiling, then migrate pages one at a time using the rollout table in the README:
   `/summary`, `/trait-selection`, `/form`, `/dashboard`, then the rest.
6. Dashboard: delete the `Dock` component from `CommandCenter.jsx`, move Today / Signal /
   Evidence / Practice / Journey into the rail as tabs, keep the existing gating
   (`phases.isGated`) and render the lock on the Practice tab. Remove the
   `showJourneyHeader` title/subtitle block and the per-tab `headerMeta` buttons.
7. Delete `CompassJourneySidebar.jsx` and its usages. No page has a left rail anymore;
   content stays centered in the existing content column.
8. Update `src/styles/DESIGN.md` with the header anatomy and the chip-per-archetype rule.

## Hard rules
- One header per page, one count/progress indicator per page. If a page had a title block,
  a step pager, and a progress banner, all three come out.
- The wordmark is centered on the window (`left:50%; translateX(-50%)`), not on the space
  left over by the right cluster, and must not shift between pages.
- Marketing and auth routes render bar 1 only, no chapter rail.
- Accessibility: tabs are real buttons reachable by keyboard; `aria-expanded` on the drawer
  trigger; `Esc` and outside click close the drawer; focus returns to the trigger; respect
  `prefers-reduced-motion` for `dropIn` and `phPulse`.
- Responsive rules are in the README (1180px and 900px breakpoints) — implement both.
- Do not restyle page bodies beyond removing the deleted chrome and reflowing the space.

## Report back
List, per route, the header props you passed, the chip you rendered, and what you deleted.
Flag any page whose step sequence is not covered by `chapterMap.js` instead of inventing
chapters.
