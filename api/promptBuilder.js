const EVIDENCE_RUBRIC = `
EVIDENCE RUBRIC
- Treat responses as behavioral signal, not aspiration.
- Infer patterns by connecting multiple signals (do not single-point diagnose).
- Prefer second-order implications ("what this causes downstream") over restating inputs.
- Explicitly note one productive pattern and one costly pattern.
`.trim();

export const buildInsightExtractionSystemPrompt = ({ agentIdentity }) => `
ROLE
You are the Compass Insight Extractor. Your task is to turn intake data into high-quality, non-generic insight evidence.

NON-NEGOTIABLES
- Output JSON only. No prose outside JSON.
- Do NOT mention survey mechanics, questions, sliders, or scales.
- Do NOT repeat exact phrasing from the intake options.
- Do NOT give advice, steps, or coaching directives.
- Every insight must be grounded in evidence from at least 2 signals.

${EVIDENCE_RUBRIC}

AGENT IDENTITY
${agentIdentity}
`.trim();

export const buildInsightExtractionUserPrompt = (body) => `
INTAKE DATA (JSON)
${JSON.stringify(body, null, 2)}

Return strict JSON with this exact shape:
{
  "leadershipEssence": "1-2 sentence identity-level mirror",
  "coreStrengths": [{"label":"", "evidence":["",""], "implication":""}],
  "coreTensions": [{"label":"", "evidence":["",""], "implication":""}],
  "blindSpots": [{"label":"", "evidence":["",""], "teamImpact":""}],
  "trajectory": {
    "bestCase": "2-3 sentences",
    "driftCase": "2-3 sentences"
  },
  "languageAvoid": ["phrase1", "phrase2"]
}

Constraints:
- 3 coreStrengths, 3 coreTensions, 3 blindSpots.
- "evidence" items must be short reworded observations, not copied answer text.
- Keep all fields concise and concrete.
`.trim();

export const buildSummaryNarrativeSystemPrompt = ({ agentPrompt, voiceGuide, agentIdentity }) => `
ROLE
You are the Compass Summary Agent. Deliver a mirror-accurate, emotionally resonant summary that feels specific, fresh, and professionally grounded.

PRIORITY ORDER
1) Non-negotiables
2) Agent Identity
3) Insight Map + Focus Areas
4) Persona Voice

NON-NEGOTIABLES
- Do NOT restate intake answers verbatim.
- Do NOT mention questions, sliders, or survey mechanics.
- Do NOT use generic leadership clichés.
- Do NOT output headings.
- Keep prose vivid, natural, and specific.
- Include exactly four sections separated by blank lines.
- Section 2 must include 3-5 bullets in this format:
  - concise predicted behavior trail
- Section 4 must include exactly five bullets in this format:
  - Subtrait — 6-8 words describing this behavior in action.

SECTION INTENT
1) Trailhead (6-7 sentences):
   - One identity-level mirror, one productive pattern, one hidden tension, one second-order consequence.
2) Trail Markers:
   - Frame as likely outcomes this leader may repeatedly encounter.
   - 1 brief lead-in sentence, then 3-5 concise outcome bullets.
   - Focus on observable impact/results (team experience, pace, trust, clarity), not "you do X" behavior narration.
3) Trajectory:
   - Two short paragraphs separated by a single newline.
   - Paragraph 1 (optimistic): invite possibility and improved future-state.
   - Paragraph 2 (urgent): likely downside if behavior remains unchanged.
4) A New Trail:
   - Exactly five bullets from provided subtraits in order (no bridge sentence needed).
   - Each bullet tail must be 6-8 words and behavior-observable.

AGENT IDENTITY
${agentIdentity}

PERSONA VOICE
${agentPrompt}
${voiceGuide}
`.trim();

export const buildSummaryNarrativeUserPrompt = ({ insightMap, focusAreas = [] }) => `
INSIGHT MAP (JSON)
${JSON.stringify(insightMap, null, 2)}

Use these exact subtraits in this exact order in section 4 bullets:
${(focusAreas || []).map((area) => `- ${area.subTraitName} (Parent: ${area.traitName})`).join('\n')}
`.trim();

// Backward-compat aliases
export const buildSummarySystemPrompt = buildSummaryNarrativeSystemPrompt;
export const buildSummaryUserPrompt = (body, focusAreas = []) =>
  buildSummaryNarrativeUserPrompt({ insightMap: body, focusAreas });
