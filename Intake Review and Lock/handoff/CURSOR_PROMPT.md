# Build the Review & Lock step — and delete the reflection moment

## What this is

The approved design for the last step of the intake. It replaces the AI "reflection"
clarification step entirely.

**Design canvas:** https://claude.ai/code/artifact/5824d20f-d150-48f4-9fcd-391bf21c4903

Three artboards. `Main` is a working prototype — click it before you write anything.
Expand a chapter, hit "Looks right", edit a row, lock it in. `Mobile` and `MobileOpen`
are the phone layouts. The `.dc.html` sources sit next to this file if you want to read
exact values out of the markup rather than the picture.

**Do not lift the mockup's markup into the app.** It is inline-styled standalone HTML.
Rebuild it in MUI `sx` against `src/styles/tokens.js` (`colors`, `type`, `surfaces`,
`buttons`, `radii`, `fonts`, `shadows`, `hairlines`) the way the rest of `IntakeForm.jsx`
does. Every hex in the mockup is already a token; if you find yourself typing `#e8dbc3`,
you want `colors.sand200`.

---

## What the step does

The leader has answered everything. Before the summary generates, they see **every
question and every answer they gave**, grouped into five chapters. Each chapter is a
verification unit: open it, read it, mark it right. When all five are verified they can
lock the intake. After locking, the answers are permanently read-only.

The whole page fits one viewport on arrival — five closed chapter rows plus the sign-off
panel, no scrolling. Scrolling only happens once they open something.

---

## Scope

### Remove — the reflection / clarification step

In `src/pages/IntakeForm.jsx`:

- `stepVars` (~L1191): drop `clarificationStep`. `agentStep` becomes `societalEnd + 1`.
  Add `reviewStep` in its place — it is the new terminal step.
- The whole `{currentStep === clarificationStep && ( ... )}` render block (~L2655–2800).
- The `/api/get-ai-reflection` fetch effect (~L1367–1449) and its
  `clarification` / `clarificationStatus` / `clarificationAnswers` state.
- `buildClarificationPayload`, `finishClarification` (~L1707), and the
  `clarificationSubmitLockRef`.
- `key = 'reflection'` in the guide-step effect (~L1221).
- `reflectionNumber` / `reflectionText` in the draft-resume guard (~L841).
- `clarification` and `clarificationAnswers` from `buildDraftPayload()` (~L1245).

`handleSubmit` currently receives a clarification payload from `finishClarification`.
It now gets called by the lock action instead, with no payload. Keep everything else in
it — the Firestore write, the localStorage clears, the
`navigate('/summary?stage=trailhead', ...)`. **Bump the draft `draftVersion` to 4** so
in-flight v3 drafts carrying `clarification` do not resume into a step that no longer
exists; on a v3 draft, drop the clarification keys and clamp `currentStep` to
`reviewStep`.

Also delete the now-dead `/api/get-ai-reflection` handler in `server.js` / `api/` if
nothing else calls it — grep first.

### Note on the guide step

In cairn mode `finishClarification` already skipped `agentStep` and submitted straight
through (`if (useCairnTheme) { handleSubmit(payload); return; }`), defaulting
`selectedAgent` to `balancedMentor`. The guide is really chosen at `/guide-select` in
Chapter I. **Keep that behaviour** — `reviewStep` is the last step a cairn user sees, and
the guide appears in the ledger as a read-back row, not a picker. Leave the legacy
`agentStep` block alone for the non-cairn path.

---

## Build — `src/pages/IntakeForm/ReviewAndLock.jsx`

Pull it out as its own component. `IntakeForm.jsx` is 3200 lines already; do not add 600
more. It takes `{ formData, societalResponses, behaviorSet, societalNormsQuestions,
onEdit, onLock, isSubmitting }` and owns only its own open/verified state.

### The ledger model

Build the five groups from live state — never a hardcoded copy of the questions:

| Group | Source | Rows |
|---|---|---|
| Your Context | `formData` fields from step 1 | industry, department, role, responsibilities, teamSize, tenure |
| Daily Leadership Habits | `behaviorSet.filter(q => q.type !== 'intro' && !isStory(q))` | 17 |
| Your Stories | the three `type: 'text'` entries after `STORY_INTRO_ENTRY` | honestRewind, proudMoment, shelvedIdea |
| Leadership Insights | `SOCIETAL_NORM_DISPLAY_TEMPLATES` × `societalResponses` | 10 |
| Your Guide | `useGuide()` persona | 1 |

Row numbering is per chapter, zero-padded (`01`, `02`…), from the same
`behaviorSet` index the intake used — so the number on the recap matches the number the
leader saw when answering.

### Answer renderers

One renderer per `q.type`. This is most of the work; get them right:

- **`radio` / context field** — orange 5px dot + the chosen option, Manrope 13.5/600.
  `decisionPace` options are `{primary, secondary}`: show `primary` as the value and
  `secondary` as the italic note line. `roleModelTrait` shows
  `formData.roleModelTraitElaboration` as its note.
- **`multi-select`** — the selected values as pills: `sand50` fill, `sand200` border,
  999px radius, 12.5/600, `flex-wrap` with 7px gap.
- **`ranking`** — numbered list in the leader's saved order. Index in mono 10/700; rank 1
  is `orangeDeep` + bold label, the last is `navy300` + `inkSoft` label, the middle is
  `sand300`. Scoring reads the extremes, so the recap should too.
- **`sliders`** (`behaviorDichotomies`) — six rows of `left label · 92px track · right
  label`, dot at `((v - 1) / 9) * 100%`. The side the value leans to is `ink`, the other
  is muted.
- **`text`** — Fraunces italic 13.5/1.58, full text, no clamp. They are signing off on it;
  they have to be able to read it.
- **societal norms** — render the `displayTemplate` with `____` replaced by the scale word
  from `SOCIETAL_NORM_RULES.scale`. Right side: ten 7px dots filled to the score, then
  `WORD · N` in mono caps `orangeDeep`. Show the **raw** score, never the reversed one.
- **guide** — persona accent dot + name + tagline.

### Layout — this is the part that was wrong before

A chapter body is a `sand50` field. **Each question is its own white card** —
`1px solid` `#eadfc9` (between `sand200` and `sand300`), `radii.md`, 15px/18px padding,
10px gap between cards. Inside each card:

```
grid-template-columns: 26px  minmax(0,0.78fr)  minmax(0,1fr)  76px
gap: 16px;  align-items: start
[ number ]  [ theme + prompt ]  [ answer ]  [ Edit ]
```

The answer column carries `borderLeft: 1px solid #eadfc9; paddingLeft: 22px;
alignSelf: stretch`. **That vertical rule is load-bearing** — it is the thing that made
the earlier version unreadable when it was missing. Do not drop it.

Theme eyebrow is mono 8.5/700/.2em uppercase in a muted warm grey (`#9d8e79`), *not*
`orangeDeep` — the chapter kicker owns the orange. Prompt is Fraunces 14.5/500/1.38.

Below ~1000px the card stacks: prompt block on top, a horizontal rule, answer below,
Edit as a 44px round icon button top-right. See `MobileOpen`.

### Chapter header row

```
[ status dot 26px ]  [ kicker / title ]  [ count pill ]  ————————  [ Verify button ]
```

- Status dot: index number in mono while unverified (`sand50` fill, `sand200` border,
  `#9d8e79` ink); a white ✓ on `colors.green` once verified.
- Kicker: `Chapter I` / `Chapter II`, mono 9/700/.22em, `orangeDeep`.
- Title: Fraunces 19/600 italic.
- Count pill: `6 questions` — mono 10/700 on `sand50` with a `sand200` border.
- Card border goes `rgba(47,133,90,.34)` when verified and closed.

### Verify — the state machine

Three states on one button, `minHeight: 44`:

| State | Label | Style | Click |
|---|---|---|---|
| closed, unverified | `Verify` + chevron-down | outlined `navy500`, white fill, `navy900` ink | open |
| open | `Looks right` + check | filled `colors.orange`, white ink, orange shadow | verify **and** close |
| closed, verified | `Verified` + check | `rgba(47,133,90,.09)` fill, `green` ink and border | re-open (stays verified) |

All-or-nothing: a chapter shows **every** question or none. No previews, no "and 16 more".

Repeat the orange `Looks right — verify <chapter>` button centred at the foot of the
expanded list, so a long chapter does not force a scroll back up to the header.

There is no "expand all" control. It was cut deliberately.

### The gate

Five pips + `N of 5 verified` (mono 9.5/.16em) above the lock button. **`Lock it in` is
inert until all five are verified** — that is the whole gate; there is no acknowledgement
checkbox. Disabled: `rgba(224,122,63,.28)` fill, `rgba(255,255,255,.5)` ink, no shadow,
hint reads *"Verify every stretch above to unlock this."* Enabled: `colors.orange`,
white, `0 8px 24px rgba(224,122,63,.3)`.

### Edit round-trip

`Edit` calls `onEdit(questionKey)`, which sets `currentStep` to that question's step and
sets a `returnToReview` flag. While the flag is set the intake shows a `sand100` bar
above the question — **← Back to review** on the left, `Changing one answer · re-verifies
that chapter` on the right — and the question's own Next button reads **Save and return**.
Both routes land back on `reviewStep`.

On save: mark the row edited (a 1.9s amber flash on the card) **and set that chapter's
`verified` back to `false` and re-open it.** Changing an answer after verifying it costs a
re-read. This is intentional; without it the gate is decoration.

### The sign-off panel

Full-width, `radii.lg`, `linear-gradient(158deg, #16304f 0%, #09101f 76%)`, `1px solid
rgba(244,206,161,.18)`, 3px brass gradient rule along the top. Left: `THE SIGN-OFF`
eyebrow in `#e1af43`, Fraunces 24 `#f0e9de` **"This becomes the record."**, one 13px
`navy300` paragraph. Right: the pips and the lock button.

---

## The lock

### The popup

Reuse the approved chapter-ceremony shell (`JourneyChapterCeremony.jsx`) — 620×320
`sand50` card with the 250×320 navy guide panel unfolded on its right. Two beats on the
same shell:

**Beat 1 — confirm.** `THE SIGN-OFF` eyebrow · Fraunces 30 **"This becomes the record."**
· one paragraph on irreversibility · **Lock it in** (orange) and **Keep reading** (ghost,
`sand300` border).

**Beat 2 — the reflection handoff.** Fires immediately on lock. `CHAPTER II · LOCKED ✓` ·
Fraunces 30 **"Reflect and Digest"** · the guide's line in Fraunces italic 15.5 behind a
2px `#e1af43` left rule · **Read your reflection** (navy primary) → `handleSubmit()` →
`/summary?stage=trailhead`.

**Guide art:** use `guidePoses()` / `guideImage()` from `src/data/guideArt.js` with the
persona from `useGuide()` — art lives in `/public/Guide Images/`. The mockup ships a
`mentor-alt.webp` for convenience; **it is not the app's asset path.** `guideArt.js` says
so at the top of the file. Whatever guide the leader picked in Chapter I is the guide in
this popup.

Beat 2 duplicates what `JourneyCeremonyGate` would fire on the `behaviors → reflect`
chapter change when `/summary` mounts. Pick one — either have the lock popup own it and
mark `journeyCeremonySeen` for the `reflect` chapter so the gate stays quiet, or let the
lock popup close and the gate fire on arrival. **Do not ship both**; the leader would see
the same owl twice.

### Persistence

`handleSubmit` already writes `responses/{uid}` with `intakeStatus.complete = true`. Add
alongside it:

```js
intakeLock: { locked: true, lockedAt: <ISO>, lockedFrom: 'review-step' }
```

Then make it actually immutable rather than merely hidden:

- **`firestore.rules`** — reject an update to `responses/{uid}` that changes
  `intakeDraft` or `latestFormData` once `resource.data.intakeLock.locked == true`. This
  is the real lock. Everything else is UI.
- **`IntakeForm`** — if `intakeLock.locked`, the form does not accept a resume into any
  question step; it lands on `reviewStep` in its locked presentation.
- **`ReviewAndLock`** — locked state: every `Edit` gone, each chapter header showing a
  `🔒 Locked` navy seal instead of Verify, and the sign-off panel replaced by the navy
  locked banner (`Locked · <date>` in `#e1af43`, Fraunces 23 "Your intake is closed.",
  and **Read your reflection** re-opening beat 2). The ledger itself stays on the page and
  stays readable forever.

The locked banner is **navy, not white-and-green** — that was a specific call. Green stays
for per-chapter verification only.

---

## Chapter map and header

`src/data/chapterMap.js`, chapter `behaviors`, currently has two steps (`habits`,
`insights`). Add a third:

```js
{
  id: 'review',
  label: 'Review & Lock',
  path: '/form?step=review',
  whatHappens: ['Every answer, read back', 'Verify each stretch', 'Locked for good'],
}
```

Then in `IntakeForm`, extend `intakeActiveStepId` to return `'review'` on `reviewStep`.
The header chip should read `Step 3 of 3` (or `4 of 4` if `context` is rendering as a
chapter-II step in your build — match whatever `ChapterHeader` is already showing on the
habits step, do not invent a count).

`chapter.arriveHint` for `behaviors` still promises a reflection — reword it.

---

## Copy — final, do not improvise

- Eyebrow: `THE LAST LOOK`
- H1: **Read it back before it locks.**
- Sub: *Five stretches of the intake. Open one, read what you actually said, and mark it
  right. When all five are verified you can lock the whole thing in.*
- Sign-off H2: **This becomes the record.**
- Sign-off body: *Your reflection, the three traits you build the year on, and every score
  after are read from these answers. Once you lock it in they cannot be changed — not by
  you, and not by us.*
- Locked hint: *Your answers stay visible to you. They stop being editable.*
- Gate hint: *Verify every stretch above to unlock this.*
- Locked banner: **Your intake is closed.** / *Nothing above can change from here. You can
  open this page any time to read exactly what you said.*

---

## Acceptance

1. On arrival at 1440×1000, nothing scrolls — five closed chapters and the sign-off panel
   all visible. Check at 1440×900 too.
2. No chapter ever shows a partial list.
3. On an expanded card, question and answer are unmistakably paired: own card, own border,
   vertical rule between the two columns.
4. Every one of the 37 answers renders in its correct format, read from live state — pick
   an account mid-intake and confirm the recap matches what was actually submitted.
5. `Lock it in` cannot be reached with 4 of 5 verified.
6. Edit → change → save returns to `reviewStep`, flashes the row, and that chapter is
   unverified and open again.
7. After locking, a hard refresh lands on the locked ledger. A hand-crafted Firestore
   write to `intakeDraft` is rejected by the rules.
8. The owl appears exactly once between locking and the summary.
9. `grep -ri "clarification\|get-ai-reflection" src api server.js` comes back empty except
   for anything genuinely unrelated.
10. No raw hex in the new component — tokens only.

## Known gap

Ranking and slider questions in the mockup's edit view are a flat placeholder. In the app,
`Edit` navigates to the real question step, so those controls come back as they already
exist. Nothing to build.
