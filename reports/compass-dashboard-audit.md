# Compass Dashboard — New-User Experience Audit

Date: 26 August 2026
Scope: post-campaign dashboard only (Today → Signal → Evidence → Practice). Planning document, no code changes.
Persona: paid $250, finished intake, picked traits, ran the team survey, waited. Has never seen results. Curious, invested, slightly nervous.

---

## Part 1 — Emotional and cognitive response, walking it cold

### Arrival (Today)

- **The first screen is about the process, not about me.** I paid to find out what my team thinks. What I get is a status board: "Chapter V · Review & Reflect · Season: Embarking · 5 of 9." Curiosity survives one orientation screen. This is several.
- **The vocabulary arrives all at once and unexplained.** Chapter, Season, Embarking, Station, Bearing, Compass, Signal, Evidence, Practice, Journey, Edge, Root, Branch, Natural Gift. Fourteen house words before a single finding. It reads as a club I just joined and don't yet speak the language of.
- **Three different "big numbers," none of them clearly mine.** The Signal card shows a Compass score for the *biggest-delta* trait. The Signal walkthrough opens on an *overall* Compass. Each trait card carries its own. I never learn which number is "my score."
- **The most threatening data point sits unframed on the landing page.** `EvidenceFocalCard` renders my single lowest-scoring statement, verbatim, before any narrative — while the Evidence tab that would explain it is locked. The punch lands before the context, and the door to the context is bolted.
- **Locks read as withheld goods, not as pacing.** Three of five tabs are locked on arrival. The intent (sequence protects comprehension) is right; the read on a purchase is "I bought this and it's greyed out."
- **"Where you are · 5/9" is the best thing on the page.** It tells me this is a longer arc, not a one-shot report. It's the element that made me want to keep going. (Chapters 7–9 are hardcoded `false` with nothing behind them, so the promise is currently hollow.)
- **"Sit with this" is the card that looks personal and is the least personal.** Three static prompts, deterministically seeded — it will never change for this user, ever.
- **The hero does one thing well:** name plus one clear next step. That combination is the reason I click through.

### The Signal walkthrough

- **The Threshold page is the strongest moment in the product.** "Your team has reflected back," the respondent count, one enormous number, and an honest caveat that a number can't hold a team's experience. I felt addressed. I also felt appropriately nervous. That's exactly right.
- **But the number arrives with no anchor whatsoever.** 62 out of 100. Is that good? Bad? Normal? No band, no benchmark, no "most leaders land between." A number without a reference point produces anxiety, not insight. This is the single largest missed emotional beat in the experience.
- **The score formula quietly contradicts the narrative.** Compass is `(efficacy × 2 + effort) / 3`. A "Natural Gift" — high impact at low cost, which the copy tells me to celebrate — is *penalized* by the formula. "Off Target" — hard work that isn't landing, the thing I'm told to fix — is *rewarded* by it. An attentive leader will find this and start discounting everything else.
- **The pacing of the trait walk is genuinely good.** One trait per screen, strongest ground first, edge last, arrow down. The zone chip with its meaning-and-stance tooltip is a nice piece of design. I did not feel ambushed.
- **The narratives are visibly templated.** Four zone templates, three traits, numbers slotted in. By the second trait I can see the machinery. Being *seen* collapses into being *processed* — at the exact moment the product is trying to make me feel known.
- **Nothing in the debrief references anything I said.** I completed a long intake and received an AI summary about my own leadership. The debrief never says "you described yourself as X — your team's read on X is Y." The most personal data in the system goes unused precisely where personalization matters most.
- **I never know how long the hard part lasts.** There's no progress indicator in the walkthrough (`ProgressDots` is written and never rendered). In an emotionally loaded sequence, unknown duration reads as dread.
- **The Gap chapter is well-written and kind** — "you undersell X" lands warmly rather than as a correction.

### The Check-in

- **Being asked "how is this landing?" is disarming and welcome.** The most human moment in the product. Marking it private was the right call.
- **And then it goes nowhere.** The reaction changes one headline and one sub-line on the very next screen, plus one guide line. That's it.
- **A full emotional beat is written and never rendered.** Every reaction carries a `pausePage` — a title and a real paragraph ("It's supposed to be heavy… the sting is proof of investment, not failure"). It exists in `debriefContent.js` and no component displays it. The best writing in the file is dead code.
- **The reaction never travels.** Evidence doesn't know I said "it stings." Practice doesn't know. Today doesn't know. If I said "I don't see it," the product should behave differently for the rest of the session. It behaves identically.
- **It's asked once, at the wrong moment.** The sting is sharpest *after* the evidence, not before it. No second read, and no reflecting the movement back to me.

### Evidence

- **"Now, the receipts" is a strong opening**, and the counting stats (teammates heard / statements rated / traits measured) make the spend feel substantiated.
- **The "in your team's words" claim is not true, and I will notice.** These are Compass-authored statements my team *rated numerically*. No teammate wrote anything. The moment I realize the receipts aren't testimony, I discount the framing everywhere else.
- **The Floor and Gaps pages are the sharpest, most usable screens in the product.** "The three statements asking loudest" is concrete, ranked, actionable. This is where I felt properly challenged rather than merely told.
- **The per-trait explorer stalls me.** Five statement rows, a scatter plot, three mode buttons — no legend, no explanation of what the map is or how to read it, and no quadrant names. Meanwhile the Signal view *did* name the zones (Natural Gift, Full Strength, Untapped, Off Target). Two quadrant languages, no bridge; the deep view feels like a different product rather than a zoom.
- **The completed-state Evidence snapshot is broken.** `TraitSwitcher` is handed `onPrev`/`onNext` and accepts only `title`, so on the return visit I'm stuck on one trait with no way to reach the other two. "Come back any time" fails on the first return.
- **Nothing leaves this product.** No print, no export, no share. I want to bring the three lowest statements to my next 1:1 and I cannot.

### Practice

- **"Understanding isn't the finish line" is the right frame,** and Envision → Root → Branch → Commit is a genuinely good spine. The vocabulary earns itself here in a way it doesn't on Today.
- **Then the energy curve inverts.** Seven prompts × three traits = twenty-one screens, mostly empty textareas. After twenty screens of being read to, I'm asked to write roughly fifteen short essays. This is where motivation dies.
- **No drafting help, right after maximum analysis.** The product just told me in detail what's wrong, in which zone, on which statement, with what gap — then hands me a blank box labeled "What will your team see different this week?" and offers nothing. It has everything it needs to propose three candidate behaviors I could edit. A blank box after rich analysis reads as abandonment.
- **Root recommendations are a pleasant surprise** — a book, a video, a practice, each with a *why*. But the catalog is small and static; an unmatched subtrait falls back to Bill Walsh and Simon Sinek, which reads generic the moment I compare notes with anyone.
- **The goal slider is a highlight.** "A 6–10 point lift in a cycle is meaningful and felt. Beyond that becomes pressure, not practice." That line does more coaching work than most of the debrief.
- **But the goal has nothing behind it.** I set a numeric target for "next cycle," and there is no next cycle — Chapter 7 (Check-In Assessment) doesn't exist. I'm committing to a number nothing will ever measure.
- **The commitment gate has real weight** — all three plans complete before "Set the bearing." That's the emotional peak.
- **And the peak is not acknowledged by the product.** After committing: no confirmation moment, no artifact, no reminder, no date. Structurally worse — Today still says "Choose the one behavior your team should be able to feel next," and the Journey card still shows Chapter 6 incomplete, because Practice writes `practiceStudio_*` keys while Today, the journey model, and the process rail all read `actionPlansByCampaign`. I did the hardest thing the product asked, and the product doesn't know.
- **My promise to my team is never shown back to me.** The snapshot reads `plan.commitPromise`; the flow writes `commitMessage`. It silently falls back to my "what were they experiencing" answer. The one sentence I wrote *for my team* disappears.

### The arc as a whole

- **It is roughly 90% receive, 10% do.** Twenty screens of being read to, then twenty-one of being asked to write. There's no middle register — nothing I can poke, sort, compare, or test a hypothesis against.
- **Everything is present tense.** No date, no countdown, no second reading, no forward hook. When I close the tab I have no reason to open it again.
- **The writing is the strongest asset in the product.** Genuinely good, specific, humane prose. The problem is not the words — it's that the words are doing all of the work alone.

---

## Part 2 — What to change to hit "seen, understood, challenged, intrigued, motivated"

### A. Anchor every number (fixes: anxiety, "is this good?")

- **Band every score in plain language.** `62 · Uneven — felt by some, not most`, with a marker on a 0–100 strip. Four or five named bands, used identically everywhere a Compass score appears.
- **Show the spread, not just the average.** You already hold per-respondent ratings. "Four of six rated this above 70; one rated it below 30" turns a statistic into a room full of people. Highest-value data addition available, and it requires no new collection.
- **Add a consensus signal per trait** — *your team agrees* vs *your team is split*. A split team is the most interesting finding in any 360, and the current model averages it away entirely.
- **Resolve the Compass/narrative contradiction.** Either weight efficacy alone and report effort as a separate cost axis, or teach the formula explicitly on the Threshold page. Right now the story praises what the number punishes.
- **Name one number as "your score"** and make every other number visibly subordinate to it.

### B. Make the check-in do real work (fixes: "it asked and didn't listen")

- **Render the `pausePage` that's already written.** One full screen that meets the reaction before moving on. The copy exists; only the component is missing.
- **Carry the reaction through the whole session.** Evidence intro, Practice intro, and Today all shift tone and order. *I don't see it* → Evidence opens on the gaps with a "check this claim" affordance. *It stings* → Practice opens with one plan, not three.
- **Ask twice.** Once after the signal, once after the evidence — where the sting is actually sharpest — and reflect the movement back: "You said it stung. After the receipts, it reads as fair. That shift is worth noticing." That single sentence is the strongest *watched and understood* moment available.
- **Allow one optional typed sentence,** private, shown back at the commitment.

### C. Close the loop with what the leader already told you (fixes: "generic," "templated")

- **Use the intake and AI summary in the debrief.** One screen: "In your intake you described yourself as X. Your team's read on X is Y." Highest-yield *seen* moment in the system, at the cost of one screen.
- **Quote their own intake language back at the commitment.** Nothing produces the feeling of being known like being quoted accurately.

### D. Give them something to argue with (fixes: passivity, "processed not seen")

- **Add a prediction step before the reveal.** Before the Threshold number: "What do you think your team said?" One slider per trait, twenty seconds. Then show the actual.
  - The gap becomes *theirs* — discovered, not asserted.
  - Surprise becomes measurable and personal.
  - It gives the check-in real material to respond to.
  - It converts the most passive stretch of the product into an experience, for roughly one screen of build.

### E. Rebalance the writing load in Practice (fixes: where motivation dies)

- **Draft, don't interrogate.** Generate three candidate behaviors per trait from zone + lowest statement + gap. The leader picks one and edits. Keep the blank box as the third option, never the only option.
- **Cut the required prompts to what actually produces a commitment:** one behavior, one visible signal, one goal. Make Envision and Root optional depth rather than gates.
- **Or stage it: one trait now, two scheduled.** Commit to the edge trait today, book the others. Three full plans in one sitting after a heavy debrief is not a realistic ask.

### F. Make the commitment a real event (fixes: the flat peak)

- **Unify the plan store** so Today, the Journey card, and the process rail all recognize a finished plan. The product must know I did the thing.
- **Build a commitment screen with weight:** the three behaviors in my own words, on one page, dated, framed as "held for 30 days."
- **Give me something to take out of the building** — a one-pager with the three behaviors, the three lowest statements, and what my team can expect. Printable, emailable. This is the artifact I'd actually use in a 1:1, and today nothing leaves the product.
- **Set the return date on the commit screen.** A calendar file, a reminder, a countdown. A goal with no scheduled re-read is a promise the product can't keep.

### G. Turn Today into a home instead of a lobby (fixes: "process, not results")

- **Post-debrief, Today should be about the commitment, not the pipeline.** Large: the behavior I promised, days held, next re-read date. Small: links back to Signal and Evidence.
- **Remove the spoiler.** Don't show the lowest statement before Evidence opens; show it afterward, attached to the plan that addresses it.
- **Make "Sit with this" actually personal** — draw from my edge trait, my reaction, or my own commitment sentence.

### H. Reduce the orientation tax (fixes: the vocabulary wall)

- **Define each house word where it first appears** — one inline line or a hover on Compass, Signal, Evidence, Practice, Bearing. Earn the language instead of assuming it.
- **Collapse the nav layers.** Process rail + dock + chapter header + side arrows + ceremony modal is four navigation systems plus an interstitial. Put phase progress inside the walkthrough (`ProgressDots` already exists, unused) and let the chapter header rest.
- **State the duration up front:** "Five chapters · about six minutes." Known length converts dread into willingness.
- **Deal with chapters 7–9.** Either stub them or label them "opens in your next cycle." A 5/9 that can never reach 9 curdles from motivating to hollow on the second visit.

### I. One quadrant language at two altitudes (fixes: the Evidence stall)

- **Name the zones on the statement map with the same four names used in Signal.** A statement sitting in Off Target should say Off Target.
- **Add a first-encounter legend** — what the axes mean, what a dot is, why it matters.
- When trait-level and statement-level share one vocabulary, Evidence reads as a *zoom* rather than a second, unrelated product. That is what makes going deeper feel intriguing instead of taxing.

### J. Silent breaks worth fixing regardless of direction

- Evidence snapshot trait switcher is inert — `onPrev`/`onNext` passed to a component that accepts only `title`. Return visitors see one trait of three.
- `commitPromise` vs `commitMessage` — the sentence written for the team is never displayed back.
- Today, the journey model, and the process rail read `actionPlansByCampaign`; Practice writes `practiceStudio_*`. Completing all three plans never registers anywhere outside Practice.
- `ProgressDots` and `SnapshotHeader` are built and never rendered.
- `pausePage` copy is written for all four reactions and never rendered.

---

## If only three things get built

1. **Anchor the numbers** — bands, spread, consensus. Removes the anxiety sitting under every screen and makes the data feel like a reading rather than a verdict.
2. **Predict-then-reveal, plus a check-in that carries** — converts the most passive stretch into the most personal one, and makes the product feel like it is watching *me* rather than running a script.
3. **Draft the practice and make the commitment an event** — moves the effort curve off the leader exactly when they're most spent, and gives the arc a real ending they can carry out of the room.
