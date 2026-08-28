# Compass Launch Plan

Date: 24 August 2026
Horizon: public access within ~two weeks
Status: plan only — not yet in build

This document is the working plan for remaining launch items. It is grounded in how Compass is built today (Cairn/staging as the real product; legacy production skin still in the tree). Each item is tagged **Must / Should / Later** for public access.

---

## What must be in place before the public can access it

The public cannot use Compass until these are true. Several list items are polish; these are the gates.

### Must

- **Production runtime** — Cairn is the real product, but it is currently host-gated to `compass-staging` / `staging.northstarpartners.org`. `app.northstarpartners.org` never enables it. Staging also **bypasses login**, **seeds fake dashboard data**, **writes dummy campaign tokens**, and **skips Firestore when writes fail**. Flipping “staging buttons off” is not enough.
- **Real persistence** — Intake, summary, traits, campaigns, and team responses must survive a new browser, a new device, and a team member who never visited the leader’s machine. Today much of the Cairn path is `localStorage` plus `allowStagingPersistenceBypass`.
- **Auth that actually protects the dashboard** — `ProtectedRoute` currently returns children whenever Cairn is on. Password reset, welcome email, and resume-journey only matter if accounts are real.
- **Team survey for non-users** — Invite link + password must load campaign data from the server, not `campaign_${id}` in the leader’s `localStorage`. This is the first thing a customer’s team will hit.
- **Payment, or a conscious delay** — Landing already sells **$250 / year**. If that is live at launch, Stripe (or a hold) must sit in the flow. If we are not charging week one, the landing copy has to change.
- **Legal / org footer** — Terms, privacy, IP, contact. UserInfo already has agree-checkboxes; those dialogs need real documents.
- **AI summary quality** — This is the product. Short summaries will feel unfinished.
- **Evidence → Practice navigation** — Users can get stuck on Evidence and never reach Practice. That is a product dead-end, not polish.

### Should (painful if missing, tool can technically open)

- Demo environment (internal QA / sales, not a public gate unless “Try it” is on the landing page)
- Pop-up / ceremony coverage on every real handoff
- Team + self assessment on a phone
- Hear Another Guide placement
- Reflection Moment copy
- Guide overlay copy for all six personas (three voices already have fallbacks)

### Later / after public if time runs out

- Guide carousel scale-up
- Full CSV fill for every P1/P2 step
- Permanent dark top bar + hiding dark-mode
- Dashboard left-nav restyle (visual, not a data gate)

---

## Work plan (highest priority first)

### 1. Demo environment — Should for public / Must for this week’s QA

**Intent:** A disposable, no-account run: Intake → Summary → traits → campaign creation, then **stop**. No login stored. Built so we can judge Agent output fast.

Current staging is **not** this. `stagingSeed.js` fills the whole year (dashboard, fake team, fake campaigns). `UserInfo` still creates Firebase users. `StagingDevPanel` jumps around the full product.

**Build as**

- A dedicated `/demo` (or `/try`) route, not “staging with login skipped.”
- **sessionStorage**, namespaced (`demo_*`), wiped on tab close. Do not write Firestore. Do not touch real `userInfo` / `campaignRecords` keys.
- Skip `/user-info`, skip Stripe, skip dashboard. After campaign verify: a “Demo complete” screen, no team invite, no sign-up prompt unless we want a conversion CTA.
- Still call `/api/get-ai-summary` and `/api/get-campaign` so output is real. Rate-limit demo IPs.
- Default a guide (Mentor) **or** keep a one-screen guide pick — summary voice depends on it.
- Hide `StagingDevPanel`, journey map, and resume-account chrome on demo routes.

**Consider**

- Demo will share OpenAI spend with production unless requests are tagged (`source: demo`).
- If someone bookmarks `/demo` after launch, it must stay obviously fake and must not pollute production data.
- “Straight to Intake” skips Profile Details (`/form?stage=profile`). Summary uses role/industry/team size. Inject a small anonymous profile, or keep a 30-second context step.

**Open question:** Internal-only URL vs a public “Try the intake” on the landing page? Skip Guide Select, or keep it?

---

### 2. AI Summary prompt — Must

Current narrative prompt in `api/promptBuilder.js` caps **Trailhead 4–6 sentences, Markers/Hazards 2–3 + two examples, New Trail 3–5**. Extraction also says “Keep all fields concise.” That is why it feels short.

**Build as**

- Roughly **2× spoken length** per beat (e.g. Trailhead 8–12 sentences, framing 4–6, New Trail 6–10), without turning it into a report.
- Keep safety rules: no advice, no trait lists, no survey mechanics, stay-behavior hazards only.
- Re-run a small eval set (`reports/summary_eval_*`) before calling it done.
- Demo env is the right place to judge this.

**Consider**

- Longer JSON + 6 guide voices already stresses the 60s function timeout. Keep extraction compact and only expand the **spoken** pass.
- UI truncates (e.g. New Trail intro `slice(0, 5)` sentences). Prompt changes without UI changes will still look short.

---

### 3. Stripe payment shell — Must if charging at launch

No Stripe code exists. `Pricing.jsx` is a marketing page. Live flow is Landing → `/user-info` (Firebase account) → profile → `/guide-select` → `/form?stage=intake`. Payment should sit **after Guide, before Intake**.

**Build as**

- New `/pay` (or `/checkout`) between Guide Select and Intake.
- Shell now: price, what they get, “Continue to payment” placeholder, success/cancel routes, webhook stub, entitlement flag (`paidAt` on the user/response doc).
- Wire Checkout + webhook when keys land (test mode first). Gate Intake on `paid` unless demo.
- **Do not** put secret keys in the client.

**Consider**

- Account is created **before** pay today. Abandoned signups will sit in Firebase. Better: create the account at UserInfo, collect pay before Intake, and treat unpaid accounts as “cannot generate a summary.”
- Refund promise on the landing page (“30-day, keep your reflection”) needs a Stripe refund path later.
- Org/Team “Contact us” vs Individual $250 — confirm one SKU for v1.
- Demo and internal testers must bypass pay.

**Open question:** Is $250 / year the only live SKU? Paywall Intake only, or also Summary?

---

### 4. Password reset — Must

The Forgot Password **button already calls** `sendPasswordResetEmail`. This is almost certainly config, not a missing click handler: Firebase authorized domains, action URL (`VITE_APP_BASE_URL` / `VITE_APP_SIGN_IN_URL`), email template, and whether Cairn’s continue URL points at `/sign-in?reset=1`.

**Build as**

- Diagnose on staging with a real account: Network tab + Firebase Auth logs.
- Confirm authorized domains for whatever becomes public.
- Landing on `/sign-in?reset=1` currently **sends another reset email**. After they set a password, they should just sign in — fix that loop.
- Clear success/error copy; don’t reveal whether an email exists more than we already do.

**Consider**

- Welcome email already has a reset link (`api/send-welcome-email.js`). Same continue URL must work for both.
- Production host change will break this again if domains aren’t updated in the same cutover.

---

### 5. Team + Self assessment: real links + mobile — Must

Team members are not Compass users. `CampaignSurvey` / `NewCampaignIntro` still prefer `localStorage['campaign_${id}']`. Staging writes `accessToken: 'stage-team-token'`. Cairn can skip the closed-survey check.

**Build as**

- Team intro/survey: **always** load from `/api/get-team-campaign-intro` + password verify, then persist the response through `/api/submit-team-response`.
- Self assessment can stay authenticated; team must not require an account.
- Strip Compass chrome for respondents: no guide overlay, no journey sidebar, no dashboard map. One column, large tap targets, sliders that work with a thumb.
- Same layout treatment for **self** survey “just in case”; no other pages.

**Consider**

- Password + 12-hour HMAC token (`api/_campaignAccess.js`) — confirm that expiry is acceptable for a team that takes a few days.
- Closed-survey and “already submitted” states on a phone.
- Landscape vs portrait; iOS Safari `100svh`; no hover-only controls.

---

### 6. Persistence + auth (start now, finish at cutover) — Must

This is the hidden half of “staging → production.”

**Build as**

- Inventory every `useCairnTheme` / `isStagingRuntime` / `allowStagingPersistenceBypass` / `useFakeDashboardData` branch.
- Dashboard must default to **real** data (`VITE_DASHBOARD_DATA_SOURCE=real`).
- `ProtectedRoute` must require Firebase on the public host. Keep `?dev=1` only in local/dev.
- Stop auto-seeding (`autoSeedIfNeeded`) on the public build.
- Sign-in hydrate path already exists in `SignIn.jsx` — make the write path (intake/summary/campaign) match it.

**Consider**

- Testers with seed data in `localStorage` will look like real users. Plan a one-time wipe or seed-version bust when Cairn goes public.
- Repository console / `showDevTools` must stay off in production.

---

### 7. Pop-up / ceremony audit — Should

Pop-ups are `JourneyCeremonyGate` + `FLOW_HANDOFFS` in `journeyModel.js`, plus intake chapter dialogs. They **do not fire on refresh** (`suppressInitialFlow`). Same-chapter steps only fire if a handoff is registered.

**Already covered:** profile→guide, summary→traits, traits→builder/intro, builder→verify, chapter jumps (intake, summary, campaign survey, Signal, Practice).

**Likely gaps (matches missing popup on Verify)**

- Arrive via Staging panel / deep link / refresh → no popup.
- `/campaign-intro` → verify if builder is skipped.
- Verify → **self survey** (`/campaign/:id`) — chapter 2→3 should fire; confirm it does on the real button, not the panel.
- Self complete → team invite return.
- Survey complete → dashboard.
- **Evidence** has no ceremony (only Signal and Practice).
- Intake inner popups vs chapter ceremony can duplicate or skip (`IntakeForm` already skips a duplicate at step 2).

**Build as**

- Walk the real buttons from Landing → Practice once, list every navigation, add a handoff or chapter copy where the next action isn’t obvious.
- Verify page should explain: self first, then team link, don’t share the self URL. That copy exists in `FLOW_HANDOFFS`; if it didn’t show, the gate didn’t run.

---

### 8. Evidence page nav bug — Must (dashboard dead-end)

`EvidenceView` sets `hideSideArrows={Boolean(chapter.row)}`. Intro/Floor/Gaps have side arrows; **trait exhibits hide them** and only show in-page trait arrows. Last trait → Close / Practice is easy to lose. Signal has the same `WalkthroughStage` pattern.

**Build as**

- Never hide the chapter arrows. Trait-to-trait can stay as a secondary control.
- Pin one consistent control: bottom Back/Next **or** side arrows, not both competing.
- Keep a visible “Continue to Practice” on the close step (header already has a compact button when Practice isn’t gated).

---

### 9. Hear Another Guide — Should

Button lives in the **New Trail** column in `Summary.jsx`. Left column is “Your reflection trail” (~232px).

**Build as**

- Move the control under the trail list; style it as a compact trail-width pill (not full marketing-button size).
- Keep `GuidePickerMenu`. Drop the extra helper paragraph if it doesn’t fit; the trail context is enough.
- Switching guide must still swap cached `summariesByGuide` without regenerating.

---

### 10. Reflection Moment copy — Should

This is the intake clarification pause (`/api/get-ai-reflection.js`), not the Summary briefing. Default notice is generic (“could be read two ways…”). Guide overlay has a `reflection` step that is mostly empty in the CSV.

**Build as**

- Distinct notice vs questions vs “we’re generating your reflection.”
- Stop repeating the same honesty line from Behaviors intro.
- If no clarification is needed, skip the empty pause (Cairn already auto-submits in that case — confirm the user never sees a blank moment).

**Open question:** Which block felt redundant — the AI notice, the guide bubble, or the chapter popup?

---

### 11. Guide carousel — Later / Should if it looks unfinished

`GuideSelect.jsx`: 3-up carousel, ~475px tall, side cards recede. New art is already in `public/Guide Images/` (untracked).

**Build as**

- Larger center portrait, bolder name/tagline, quieter side cards.
- Wire select-art to the new Guide Images set if those are the launch assets.
- Don’t add a 4th visible card; it will fight the layout.

---

### 12. Guide documents (CSVs) — Should (content); import is Must for them to appear

`content/guides/3-guide-copy.csv` is the authoring sheet. The **running app still reads `src/data/guideContent.js`**, which only has Mentor / Catalyst / Challenger. CSV overwrite does **not** hot-reload. Best Friend / Mother / Roaster fall back to Mentor-ish defaults in the overlay.

**Build as**

- Fill P0 rows for all six `*_text` columns (page defaults + intake questions + summary stages + trait selection). P1 Signal/Evidence/Practice if time.
- Import pipeline: CSV → `guideContent.js` (or a generated JSON the overlay already understands).
- Voices must stay in character; blank cell = fall back to that guide’s page default, not Mentor.

**Open question:** Draft all six voices from the existing three, or wait for a filled sheet and only import?

---

### 13. North Star org info on landing — Must (trust / legal)

`CompassLanding.jsx` ends with a one-line colophon: “North Star Partners · $250 early adopter · 30-day guarantee.” No address, contact, IP, or policy links.

**Build as**

- Standard footer: North Star Partners, The Compass product line, © year, “The Compass is a product of…”, contact email, Terms, Privacy, IP/trademark line.
- Reuse the same links in UserInfo agree-dialogs.

**Open question:** Legal entity name, contact email, and whether Terms/Privacy exist yet.

---

### 14. Top nav: dark bar, hide dark-mode — Later

`CompassTopbar` is light by default; dark is `data-dark` via `useDarkMode` (`cairn_dark_mode` in localStorage). Toggle is the sun/moon button.

**Build as**

- Force the **bar** to the current dark visual (navy, amber type) in light mode pages. Do not force the whole app into dark.
- Hide the toggle; leave `useDarkMode` in code.
- Recheck contrast: sand page + navy bar is fine; map banner and Guide pill already have dark variants.

**Consider**

- Users with `cairn_dark_mode=true` already stored — ignore or respect? Recommend ignore while the toggle is gone.

---

### 15. Dashboard: Dock → left nav + restyle — Later (visual)

Cairn dashboard **is** `CommandCenter`. The second top nav is `Dock` (Today / Signal / Evidence / Practice). `Dashboard.jsx` already has a leftover left-nav (`DashNavSidebar`) that **never renders** because of `if (useCairnTheme) return <CommandCenter />`.

**Build as**

- Move Dock to a left rail (Today + Signal + Evidence + Practice; Journey if it stays).
- Keep gating (locks / checkmarks).
- Restyle Command Center to Cairn cards/tokens (that file still has some one-off values).
- Evidence/Signal arrows (item 8) should be designed in the same pass so the page doesn’t grow a third nav system.

---

### 16. Staging → Production — Must, do last

Cairn is the product, not the old `app.northstarpartners.org` skin. Promoting staging is the path. Removing staging buttons is not the cutover.

| If we only “remove staging buttons” | What actually breaks |
|---|---|
| Cairn stays host-gated | Public domain never gets this UI |
| `ProtectedRoute` still bypasses auth | Anyone can open `/dashboard` |
| `VITE_DASHBOARD_DATA_SOURCE` defaults to **fake** | Real team data never shows |
| `autoSeedIfNeeded` still runs | Every new visitor gets Alex-the-staging-user |
| Campaign writes still swallow Firestore errors | Team links 404 for real respondents |
| `StagingDevPanel` hidden but `?dev=1` / `/dev-*` remain | Public backdoors |
| Firebase Auth domains / action URLs still staging | Password reset and welcome email die |
| OpenAI + campaign secrets only on staging project | Summary/campaign fail on the new host |
| CSP / env (`OPENAI_API_KEY`, `CAMPAIGN_ACCESS_SECRET`, mail) | Silent API failures |

**Cutover sequence**

1. Make Cairn the default theme (not staging-host-only).
2. Real data + real auth + no seed + no panel + no persistence bypass.
3. Point the public domain at this Vercel project (or rename staging → production in Vercel). Keep a **private** preview for us (`?theme=cairn` + auth), not a second product.
4. Firebase authorized domains, Auth email templates, `VITE_APP_BASE_URL`.
5. Stripe live keys + webhook endpoint on that domain.
6. Smoke: signup → pay → intake → summary → campaign → **team on a different phone** → dashboard Signal/Evidence/Practice.
7. Only then strip “staging” copy and URLs.

Do **not** keep two public apps. The legacy non-Cairn tree in `App.jsx` becomes dead once Cairn is default; it can stay in code for a sprint, then be deleted.

---

## Suggested two-week sequence

**Week 1 — make it true, then make it testable**

Demo + summary length (so we can judge the Agent) → persistence/auth inventory → Stripe shell → password reset → team link + mobile survey.

**Week 1–2 — don’t ship a confusing product**

Pop-up audit, Evidence nav, Hear Another Guide, Reflection copy, landing footer.

**If time**

Carousel, guide CSV fill + import, dark top bar, dashboard left nav.

**Last 2–3 days**

Production cutover + end-to-end on a phone that is not the development machine.

---

## Open questions

1. **Demo:** Internal-only, or linked from the landing page? Skip Guide Select?
2. **Paywall:** $250/year the only SKU? Block Intake, or also Summary, until paid?
3. **Guide CSV:** Draft all six voices, or wait for a filled sheet and only import?
4. **Public URL:** Promote `compass-staging` as the public host, or attach `app.northstarpartners.org` (or another domain) to this project?
5. **Footer:** Legal name, contact email, Terms/Privacy URLs if they exist.
6. **Reflection Moment:** Which screen felt redundant (AI notice, guide bubble, or chapter popup)?

Start with (1) Demo + (2) Summary length once the demo/guide questions are answered — those two unlock every other quality check.
