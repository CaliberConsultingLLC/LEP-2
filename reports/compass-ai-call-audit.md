# Compass AI Call Audit — Inventory + Summary Prompt Assessment

> **STATUS AS OF 2026-08-28 — much of this report is now historical.**
>
> Everything below describes the OpenAI-era pipeline as it stood on 2026-08-27.
> It has since been rebuilt. Read it as the diagnosis that motivated the work,
> not as a description of the current system.
>
> **Fixed:**
> - Finding 1 (extraction truncating into an empty map that shipped as a 200) —
>   the pipeline moved to Anthropic structured outputs with a hard validity gate
>   and an extraction retry. An unusable map now returns 502 instead of six
>   confident narratives written from nothing.
> - Finding 2 (length spec contradicting the fixtures) — resolved in the other
>   direction from what this report recommended. The product owner wanted MORE
>   substance, so the ambitious lengths were kept and the "keep writing until you
>   hit them" padding instruction was replaced with coverage requirements.
> - Finding 3 (padding fallbacks) — removed. Thin beats regenerate with specific
>   feedback rather than having seeds concatenated onto them.
> - Finding 4 (gate that could not detect failure) — replaced.
> - Finding 5 (latency) — the summary now splits into a fast first request plus a
>   background one, and the function ceiling moved to 300s.
> - Finding 6 (prompt waste) — alias fields, indentation, and the raw body dump
>   are gone; prompts are ordered for cache hits.
> - Finding 7 (structured→flat→structured round-trip) — Summary.jsx now renders
>   from the structured object.
>
> **Not what this report predicted:** probing the deployed endpoint with an empty
> `{}` body returned a complete six-guide profile of a leader who supplied no
> data. Extraction had NOT truncated — there was simply no input validation at
> all, which this report never flagged. Now gated on a minimum signal count.
>
> **Measured since:** extraction at `high` effort runs ~145s, `medium` ~128s with
> no observed quality difference in map cardinality; `high` was kept. Two live
> runs across different intake profiles produced identical map structure and
> Trailhead length, which is the consistency question this report was written to
> answer.
>
> Current implementation lives on the `claude-port-insight-map` branch.


Date: 2026-08-27
Scope: every place in Compass where a model is asked to produce output that costs tokens.
Environment audited: `compass-staging` (Vercel project `prj_mthR81CrjAbpODQb0M3I0snc8quF`), host `staging.northstarpartners.org`.
Provider: OpenAI. All live calls run `gpt-4o-mini` except `dismiss-statement` (`gpt-3.5-turbo`).

---

## Part 1 — Inventory of agent calls

### 1. Intake Clarification Check
- **Endpoint:** `POST /api/get-ai-reflection` — `api/get-ai-reflection.js`
- **What it does:** Reads the finished intake and decides whether two answers on the same construct contradict each other badly enough to be worth one open follow-up question. Defaults hard to "no question."
- **Page:** `src/pages/IntakeForm.jsx:1357` (the clarification step; refetches when the compacted intake key changes) and `src/pages/DevSkipOne.jsx:818`
- **Model / caps:** `gpt-4o-mini`, `max_tokens: 420`, `temperature: 0.2`, `response_format: json_object`
- **Tokens per call:** ~1,200 in / ~40–420 out (usually ~40 — it returns the empty result most of the time)
- **Frequency:** 1x per intake, more if the user backs up and edits answers
- **Live in staging:** Yes

### 2. Insight Extraction (summary pass 1)
- **Endpoint:** `POST /api/get-ai-summary` — first call inside `api/get-ai-summary.js:352`
- **What it does:** Turns the raw intake body into a persona-blind "evidence map": leadership mirror, protective/pressure patterns, 3 strengths, 3 tensions, 3 blind spots, a contradiction map, the locked spoken seeds (2 marker moments + 2 paired hazards), a best/drift trajectory, 5 focus sub-trait recommendations, and self-reported confidence. This is the reasoning layer — everything downstream is voice.
- **Page:** `src/pages/Summary.jsx:388` (the Trailhead moment), plus `src/components/StagingDevPanel.jsx:148` and `src/pages/DevSkipOne.jsx:832`
- **Model / caps:** `gpt-4o-mini`, `max_tokens: 1800`, `temperature: 0.2`, `response_format: json_object`
- **Tokens per call:** ~2,340 in / capped at 1,800 out (the schema actually wants ~2,200–2,800 — see Finding 1)
- **Frequency:** 1x per summary generation
- **Live in staging:** Yes

### 3. Guide Narrative (summary pass 2) — x6
- **Endpoint:** same `POST /api/get-ai-summary` — `generateGuideNarrative()` fanned out over all six guides via `Promise.allSettled`
- **What it does:** Speaks the evidence map out loud in one guide's voice, as four beats: **Trailhead**, **Trail Markers** (framing + 2 present-tense scenes), **Upcoming Hazards** (framing + 2 paired year-later scenes), **A New Trail**. Facts are locked; only diction changes between guides.
- **Page:** `src/pages/Summary.jsx` — this is what renders the whole journey (`summarySections` at line 657, stages at 662–706)
- **Model / caps:** `gpt-4o-mini`, `max_tokens: 1100`, `temperature` 0.38–0.58 by guide, `response_format: json_object`
- **Tokens per call:** ~5,500–6,200 in / ~600–1,100 out
- **Frequency:** 6 per summary, plus a full retry round for any guide whose `trailhead` came back empty
- **Live in staging:** Yes
- **Subtotal for the summary endpoint:** **~38,000 in / ~6,800 out ≈ 45,000 tokens per completed intake**, before retries

### 4. Campaign Statement Builder
- **Endpoint:** `POST /api/get-campaign` — `api/get-campaign.js:172`
- **What it does:** Takes the flattened summary + 3 chosen focus areas and writes 5 observable, team-ratable statements per trait (effort x efficacy).
- **Page:** `src/pages/CampaignBuilder.jsx:220` (build) and `:330` (rebuild), plus a silent prefetch from `src/pages/Summary.jsx:335`
- **Model / caps:** `gpt-4o-mini`, `max_tokens: 600` (900 on rebuild), `temperature` 0.35 / 0.7 on rebuild
- **Tokens per call:** ~1,200–1,500 in / <=600–900 out
- **Frequency:** at least 2 per journey — the Summary page prefetches one automatically whether or not the user ever builds a campaign — plus one per rebuild
- **Live in staging:** Yes

### 5. Dashboard Guide Insight
- **Endpoint:** `POST /api/get-agent-insight` — `api/get-agent-insight.js:196`
- **What it does:** One short interpretation (55–75 words, or 20–35 in campaign-results view) of a selected sub-trait's efficacy/effort position, in the user's chosen voice. Has a self-policing retry: if `significant_gap` is false but the model mentioned a gap anyway, it re-calls with an enforcement clause, then falls back to hardcoded text.
- **Page:** `src/pages/Dashboard/ResultsTab.jsx:957`
- **Model / caps:** `gpt-4o-mini`, `max_tokens: 260` (220 on retry), `temperature` 0.45 / 0.35
- **Tokens per call:** ~600 in / <=260 out; client-cached per (view, guide, trait, rounded scores)
- **Frequency:** once per unique sub-trait/view the user opens — a leader browsing 15 sub-traits across 2 views is ~30 calls, about **18,000 in / 4,000 out**
- **Live in staging:** Yes

### 6. Statement Replacement
- **Endpoint:** `POST /api/dismiss-statement` — `api/dismiss-statement.js:41`
- **What it does:** Regenerates one survey statement to replace a dismissed one.
- **Page:** none — no client currently calls this endpoint. `CampaignBuilder.jsx` tracks `dismissedStatements` locally and filters them out without regenerating.
- **Model / caps:** `gpt-3.5-turbo`, `max_tokens: 100`
- **Tokens per call:** ~400 in / <=100 out
- **Live in staging:** Deployed and reachable, but **dead** — nothing invokes it

### 7. Legacy Express routes (`server.js`)
- **What they are:** 7 more `openai.chat.completions.create` calls on `gpt-3.5-turbo` at `server.js:374, 460, 494, 608, 645, 758, 797` — an older single-pass summary, an older campaign builder, `/dismiss-trait`, `/dismiss-statement`.
- **Page:** none. Only reachable through the local Express dev server (`npm run dev:server`). Vercel serves `api/*` and never touches these.
- **Live in staging:** **No.** Worth deleting — two divergent prompt implementations in one repo is a real maintenance hazard.

### 8. `src/pages/Dashboard/cc/guideInsight.js`
A cleaner `useGuideInsight` hook wrapping the same `/api/get-agent-insight` endpoint. **Not imported anywhere.** Dead code.

---

## Part 2 — Whole-tool token estimate

One leader, end to end (intake → summary → campaign → dashboard browsing), all `gpt-4o-mini`:

| Call | Input | Output |
|---|---:|---:|
| Intake clarification | ~1,200 | ~100 |
| **Summary — extraction** | **~2,340** | **~1,700** |
| **Summary — 6 narratives** | **~35,000** | **~5,100** |
| Campaign prefetch + build | ~2,500 | ~1,100 |
| Dashboard insights (~30) | ~18,000 | ~4,000 |
| **Total** | **~59,000** | **~12,000** |

At `gpt-4o-mini` list pricing ($0.15/M in, $0.60/M out) that is roughly **$0.017 per leader**, of which the summary is about **$0.010**.

**The headline: the single most important moment in this product costs one cent.** Cost is not the constraint here. Quality is. That fact should shape every recommendation below.

Estimates are derived from measured prompt sizes (`api/promptBuilder.js` built against a realistic intake body) and modelled output sizes, not from live metering. See "How to replace these with real numbers" at the end.

---

## Part 3 — Deep assessment: the summary call

### What it is trying to do

Compass's whole promise sits in the Trailhead. The emotional sequence the prompt names — **Seen → Exposed → Hopeful → Motivated** — is the product. Get the Trailhead right and the leader stays for the Markers, the Hazards, and the campaign. Get it generic and the rest of the tool is a well-designed shell around a horoscope.

The architecture is genuinely good, and that is worth saying plainly before the criticism:

- **Splitting extraction from voice is the right call.** Facts get computed once, persona-blind, then six voices speak the same truth. That is the correct way to guarantee that switching from Mentor to Roaster changes the *diction* and not the *diagnosis*.
- **The locked spoken seeds are the right mechanism.** Forcing `markerMoments` and `hazardIfStay` to pair 1:1, extracted once and rewritten only in diction, is what makes Markers and Hazards feel like the same story rather than two lists.
- **The stay-behavior constraint is a genuinely sharp product insight.** Banning "quitting / attrition / turnover" and forcing the hazard to be about what people who *stay* learn to do — withholding, working around, over-asking — is more honest, more specific, and more uncomfortable than any turnover warning.
- **The guide voice specs are unusually well-written.** `neverSoundsLike` and "if a line could have been written by any of the other five guides, rewrite it" are the right constraints.

The problems are not in the thinking. They are in the plumbing between the two passes, and in a length spec that fights itself.

---

### Finding 1 — The extraction pass is structurally over-budget. This is the big one.

`max_tokens: 1800`. The JSON schema it is required to fill asks for:

- 6 prose fields (1–5 sentences each)
- `futureRiskIfUnchanged` at 3–5 sentences
- 3 string arrays x 3 items
- `coreStrengths` + `coreTensions` + `blindSpots` = 9 objects, each with a label, **two** evidence lines, and an implication
- 2 `contradictionMap` entries (tension + cause + effect)
- `spokenSeeds`: two 2-sentence fields, 2 marker scenes, 2 hazard scenes
- `trajectory`: two 4–6 sentence narratives
- 5 `focusRecommendations` with rationales
- `languageAvoid` + `confidence`

Modelled at realistic prose density, that serializes to **~2,200 tokens in a lean run and ~2,800 in a full one**. Both exceed 1,800.

What happens when it truncates:

1. Output is cut mid-JSON, so there is no closing brace.
2. `extractFirstJsonObject` (`api/get-ai-summary.js:36`) tries the fenced match, then `JSON.parse`, then a `{`...`}` slice. A truncated object has no final `}`, so all three fail and it returns `null`.
3. `normalizeInsightMap(null)` (line 56) returns a **fully-populated, fully-empty** object — every string `''`, every array `[]`.
4. That empty map is stringified into all six narrative prompts as `LOCKED SPOKEN SEEDS` and `INSIGHT MAP`.
5. The narrative system prompt then says: *"Do NOT invent claims, motives, or scenes that are not in the insight map."*

So the model is handed nothing, told not to make anything up, and asked for 25–36 sentences. It produces exactly what you would expect: fluent, warm, and about nobody.

**Nothing anywhere detects this.** `finish_reason` is never read. There is no validity check on the insight map, and no extraction retry — the only retry logic in the file is for narratives. A run where extraction silently died still returns HTTP 200 with six complete-looking summaries.

**This is the primary hypothesis for the inconsistency.** It is not that the model is moody. It is that some runs have an evidence map and some runs have nothing, and the two are indistinguishable from the response.

**How to confirm it in 30 seconds:** if a live staging summary contains any of these exact strings, extraction returned nothing on that run —

- `"A reliable leadership asset that already creates clarity and momentum for others."` (`get-ai-summary.js:159`)
- `"A recurring tension that quietly shapes how the team experiences your leadership."` (`get-ai-summary.js:170`)
- `"In a high-stakes meeting, the room slows while people wait for your final read before they commit."` (`guideSummary.js:118`)
- `"Under deadline pressure, clarity arrives late and the team spends energy decoding mixed signals."` (`guideSummary.js:119`)

Those are hardcoded fallbacks. They are tells.

---

### Finding 2 — The length spec contradicts your own reference fixtures

The narrative prompt calls length "non-negotiable":

> Trailhead: 8-12 sentences. Markers framing: 5-7. Hazards framing: 5-7. New Trail: 7-10.
> If you finish under the minimum sentence counts, keep writing until you hit them.

The hand-authored "this is what good looks like" fixtures in `src/data/stagingGuideSummaries.js` — the ones the UI was designed around — measure:

| Guide | Trailhead | Markers | Hazards | New Trail |
|---|---:|---:|---:|---:|
| mentor | 4 | 3 | 2 | 4 |
| catalyst | 5 | 3 | 3 | 4 |
| challenger | 4 | 3 | 2 | 5 |
| bestFriend | 4 | 2 | 1 | 3 |
| mother | 5 | 2 | 2 | 3 |
| roaster | 6 | 2 | 3 | 4 |

**Spec floor: 25 sentences minimum. Your own best examples: 11–15.** The prompt is demanding roughly double the length of the thing you actually designed.

This matters more than it looks. "Keep writing until you hit the count" is a direct instruction to pad, and padding is precisely the mechanism that turns a specific mirror into generic leadership prose. The model has nowhere to go for sentences 8 through 12 except abstraction. The prompt is asking for the failure mode you are worried about.

One of the two is wrong. Based on the fixtures — which read genuinely well — the spec is.

---

### Finding 3 — The length "enforcement" is padding, and the padding damages the output

`normalizeGuideSummary` in `src/utils/guideSummary.js` is the only length enforcement, and it works by concatenation:

**Trailhead (line 108):** if under 8 sentences, it appends `seeds.clearestAsset` and `seeds.coreTension` verbatim. Those are the *same two seeds* the model was just asked to weave into the Trailhead. So the flagship beat of the product ends by restating its own opening, in flatter, persona-blind prose. And it still lands at 6 sentences, so it does not even hit the floor it was padding toward.

**New Trail (line 137):** if under 7 sentences, it splices in sentences from `insightMap.trajectory.bestCase`. That text was written by the extraction pass, which is explicitly instructed to have **no guide voice at all**. So the closing beat — the "Motivated" note the whole emotional arc builds to — gets analytic, voiceless sentences grafted onto the end of a Mentor or Roaster monologue. This directly defeats the persona architecture the rest of the system works hard to protect.

**Markers framing and Hazards framing have no floor at all.** A one-sentence framing ships as-is.

Net: delivered length varies from roughly 2 sentences to 12 per beat, with no feedback to the model and no signal to you.

---

### Finding 4 — The success gate cannot detect failure

The only quality check in the whole endpoint is `result.value?.trailhead` being truthy (`get-ai-summary.js:396`).

But `normalizeGuideSummary` *manufactures* a trailhead from the seeds when the model returns nothing. So a narrative call that produced garbage still passes the gate, still gets stored in `summariesByGuide`, and still ships. The 502 at line 411 only fires when all six fail *and* the seeds were also empty — which is nearly never.

There is no check that the sentence counts landed, that the locked seeds survived into the output, that the voice is distinguishable from the other five, or that the text is not a hardcoded fallback.

---

### Finding 5 — Latency risk at the exact moment that matters

- Vercel `maxDuration: 60` for `api/get-ai-summary.js`
- Client timeout: 90s (`Summary.jsx:388`)
- The work: 6 concurrent narrative calls, then **a second full round** of retries for any that came back without a trailhead

Two sequential rounds of six concurrent `gpt-4o-mini` calls, each generating up to 1,100 tokens, against a 60-second function ceiling is not comfortable. When it blows the ceiling, the function is killed and the client sees a hard failure — at the Trailhead. The client's 90s timeout is generous relative to a limit it can never reach, which means the real failure mode is a truncated function, not a clean timeout you can message around.

Compounding it: only **one** of the six narratives is displayed. The other five exist so guide-switching is instant. That is a defensible product call, but the price is p95 latency at the single worst moment to pay it.

---

### Finding 6 — Prompt waste and dead signals

- **No prefix caching.** The narrative system prompt opens `ROLE\nYou are ${guideName}` — the six prompts diverge at about 15 characters, so OpenAI's automatic prefix cache (needs >=1024 shared tokens) gets nothing. The genuinely shared blocks — safety non-negotiables, Compass philosophy, WHAT TO WRITE, LENGTH, SECTION INTENT — are ~1,400 tokens. Move them to the front and put the VOICE block last, and 5 of 6 calls hit cache at half price and lower latency.
- **Duplicated alias fields.** `normalizeInsightMap` writes `leadershipEssence`, `signaturePattern`, `hiddenCost`, and `missingOutcome` as literal copies of four other fields. The extraction prompt never asks for them. They then get pretty-printed into all six narrative prompts: ~200–300 wasted tokens x 6, and worse, they invite the model to read a duplicate as a second independent signal.
- **`JSON.stringify(map, null, 2)`** costs ~284 tokens of pure indentation x 6 calls.
- **`confidence` is extracted and never read.** The model self-reports `overall` / `trailhead` / `trajectory` confidence and nothing in the codebase consumes it. This is the natural hook for the whole consistency problem and it is sitting unused.
- **`languageAvoid` is extracted, embedded, and never invoked.** It rides along inside the insight map JSON, but the narrative prompt never tells the model to avoid those phrases. The prompt has its own hardcoded cliché ban instead. The per-leader list is inert.
- **The entire raw `req.body` is stringified into the extraction prompt** (`promptBuilder.js:34`), including `sessionId` and anything else the client attached.

---

### Finding 7 — The structured to flat to structured round-trip

The server builds clean structured JSON, `flattenGuideSummary` collapses it to a `\n\n`-delimited string, and `Summary.jsx:657` splits it back apart on blank lines. `flattenGuideSummary` applies `.filter(Boolean)` before joining — so an empty beat does not produce an empty slot, it *disappears*, and every later section shifts up one heading.

Guarded for the Trailhead (empty trailhead means the guide is marked missing and retried). Not guarded for the middle beats. Low probability, high blast radius: Hazards content rendered under "Trail Markers." The structured object is already in the payload as `summariesByGuide` — the page should read that directly rather than parse a string it just serialized.

---

## Part 4 — The take on consistency

**Direct answer: no, you cannot get consistent length, depth, and quality out of this call as it stands today. But the reason is not the model, and the fix is not mostly a prompting problem.**

Three things are fighting you, in order of size:

1. **A token ceiling that silently amputates the reasoning pass**, with no detection, no retry, and a fallback path that looks identical to success. This alone would produce exactly the variance you are describing.
2. **A length spec that contradicts your own design references and instructs the model to pad.** Padding is how you manufacture generic.
3. **"Enforcement" implemented as concatenation**, which fixes the sentence count by damaging the voice and duplicating content.

None of those are "the model is inconsistent." They are deterministic bugs producing non-deterministic-looking output. That is good news: they are all fixable, and most are small.

### Recommended order

**Immediate (an afternoon):**
1. Raise extraction `max_tokens` to 4000. Read `finish_reason` on both passes and log it. This is the highest-value ten minutes in the codebase.
2. Add a validity gate on the insight map — require `spokenSeeds.markerMoments.length === 2`, `hazardIfStay.length === 2`, `coreStrengths.length === 3` — and retry extraction once before any narrative call fires. Right now extraction gets zero retries and narratives get one; that is backwards. Extraction is the pass that cannot be recovered from.
3. Delete the four alias fields and the `null, 2` indent from what gets embedded in the narrative prompt.

**This week:**
4. **Reconcile the length spec with the fixtures.** Move the spec to roughly Trailhead 5–7, Markers framing 3–4, Hazards framing 3–4, New Trail 4–6 — close to your own best examples — and delete "keep writing until you hit them." Then enforce it by counting sentences server-side and re-asking, not by padding.
5. Replace both padding fallbacks with regeneration. Never splice `trajectory.bestCase` into a guide's voice.
6. Switch both passes to `response_format: { type: 'json_schema', strict: true }`. That eliminates the entire parse-failure class and lets you declare `minItems` on the arrays instead of hoping.
7. Have `Summary.jsx` render from `summariesByGuide[selectedGuideId]` directly and stop round-tripping through flattened text.

**The strategic one:**
8. **Move the extraction pass off `gpt-4o-mini`.** Extraction is where the actual inference lives — connecting multiple signals into a pattern nobody named. That is the specific thing small models are worst at, and the specific thing this product sells. It is *one* call. On `gpt-4o` it costs about **$0.034** instead of $0.001. Against a product whose entire AI spend is under two cents a leader, that is the cheapest quality upgrade available, and it should move perceived depth more than any prompt edit on this list.

   The six narratives are a voice-and-length task, which `4o-mini` handles adequately. Upgrade those second, if at all.

**Also worth doing:**
9. Generate only the selected guide synchronously; generate the other five lazily on first switch, or in a background write. Cuts the Trailhead wait substantially and takes the function well clear of `maxDuration`.
10. Restructure the narrative system prompt so the ~1,400 shared tokens come first and the VOICE block last, for prefix caching.
11. Wire `confidence` into something — at minimum log it; ideally let a low-confidence run produce a shorter, more honest Trailhead rather than a padded one.
12. Delete the 7 legacy `gpt-3.5-turbo` calls in `server.js` and the unused `guideInsight.js`.

---

## How to replace these estimates with real numbers

Everything above is static analysis. The prompt sizes are measured — built by the real `api/promptBuilder.js` against a realistic intake body. The output sizes are modelled. To make this empirical, run about 10 live summaries against staging with varied intake payloads and record, per call: `usage.prompt_tokens`, `usage.completion_tokens`, `finish_reason`, per-beat sentence counts, whether the locked seeds appear in the output, and whether any hardcoded fallback string appears.

If Finding 1 is right, `finish_reason: "length"` will show up on the extraction call in a meaningful share of runs — and those runs will be exactly the summaries that read flat.
