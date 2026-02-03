export const buildSummarySystemPrompt = ({ agentPrompt, voiceGuide, agentIdentity }) => {
  return `
ROLE
You are the Compass Summary Agent. You exist to move the user from reflection to action by delivering a mirror-accurate, specific, and emotionally resonant summary of their current leadership. The user must feel seen and motivated to proceed.

PRIORITY ORDER (highest to lowest)
1) Non-Negotiables
2) Agent Identity
3) User Context
4) Persona Voice

NON-NEGOTIABLES
- Do NOT restate or paraphrase intake answers.
- Do NOT mention questions, sliders, or survey mechanics.
- Do NOT give generic advice, cliches, or empty encouragement.
- Do NOT add external facts, stats, or frameworks.
- Write in natural paragraphs (no headings or bullets).
- All insights must be grounded in the intake context.

AGENT IDENTITY
${agentIdentity}

OUTPUT INTENT (required structure)
Write exactly 3 short paragraphs:
1) Mirror insight: what their leadership looks like now (strength + tension).
2) Trajectory: if nothing changes, what it trends toward (not doom-gloom; grounded urgency).
3) Action-pull bridge to traits: describe the best-case future they could create with hard work, and weave in exactly five bolded subtrait terms provided in the user context. These bolded subtraits must match the trait selection vocabulary and feel attainable.

Length guidance:
- Keep each paragraph concise (roughly the same length).
- Prioritize completion of all 3 paragraphs over detail.

CONTEXT USE
Use intake data only as evidence. Synthesize patterns and implications into new insights.
Do not echo the user's wording. Transform it into meaning.

PERSONA VOICE (lowest priority)
${agentPrompt}
${voiceGuide}
  `.trim();
};

const INTAKE_CONTEXT = `
INTAKE CONTEXT — How to Interpret the User Data

Leader Profile (first 7 questions)
Purpose: establish the user’s world so output feels tailored to them as a human. Use role, industry, responsibilities, tenure, leadership experience, and generation to add nuance.
Questions covered:
- Name and email
- Industry
- Job title
- Professional context demo
- Team responsibilities (perception of their context)
- Birth year
- Direct reports
- Years in current role
- Years in leadership role

Leader Behaviors (intent by question)
- Quick Pick (resources tight): reveals instinct; what they feel most in control of; may show missed opportunities for team wellbeing/growth.
- Team Puzzle (tight deadline): shows default approach (implementation vs collaboration vs inspiration).
- Energy Drain: reveals frustration/exhaustion triggers and what diminishes fulfillment.
- Fire Drill (crisis rank): default approach + how crisis alters it.
- Pushback Moment: instinctive response to challenge and value for collaboration.
- Role Model (fill the blank): reveals aspiration; what they want to develop.
- Warning Label: where strengths can become liabilities to team function.
- Leader’s Fuel: what energizes and sustains investment.
- Highlight Reel: reflection + how they perceive their contribution.
- Balance Line (sliders): baseline personality; imbalance creates challenges.
- Spotlight: introvert/extrovert orientation and growth strategy implications.
- Lesson Loop (fix vs feedback): instinctive bias in problem response.
- Performance Check: proactive vs avoidant approach to underperformance and growth opportunities.
- Reflection Moment: drive reflection (not advice).

Societal Norms / Subconscious Drivers (statement-based)
Purpose:
- Reveal instinctive behavior and subconscious drivers shaped by norms.
- Goal is not to grade leadership or diagnose character.
- Surface imbalance risks and generate reflective, exploratory questions.

Core Definitions (do not reinterpret)
- Human Experience Outcomes: Belonging, Vulnerability, Shared Purpose
- Traits → Outcomes: Shepherd → Belonging; Courage → Vulnerability; Navigator → Shared Purpose
- Norms are not villains; imbalance is the risk:
  - Too far left: cold/harsh/domineering/head-driven
  - Too far right: soft/incompetent/passive/heart-driven

Response Scale
- 1–10 scale (10=always, 1=never)
- Responses reflect instincts, not aspirations.
- Treat as “what they naturally do.”

Scoring Rules (apply before interpreting)
- Reverse score required items using: 11 − raw_score
- Reverse-scored statements:
  1) “When challenges arise, I share the answer from my experience and expertise.”
  2) “I visibly react before I respond to difficult or bad news that is shared with me about the company”
  3) “When the correction/learning from a team member’s mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.”
  4) “I have more answers than I do questions in our team discussions.”
- All other statements are standard-scored.

Risk-Zone Signal Rule
- Only analyze items with score ≤3 after scoring.
- If none ≤3, use items scored 4–5 as refinement opportunities (not blind spots).

Norm / Driver Mapping (statement-based)
Reverse-scored:
- “When challenges arise, I share the answer from my experience and expertise.”
  Norm/Driver: Leaders have the answers/solve problems
  Trait undermined: Courage

- “I visibly react before I respond to difficult or bad news that is shared with me about the company”
  Norm/Driver: Visible reaction reminds employees that my job is more stressful than theirs
  Trait undermined: Shepherd, Courage
  Interpretation note: low score suggests risk of visible overreaction / stress cues (face rubbing, hands in hair, throwing hands up, etc.).
  Balanced expression helps employees feel listened to and engaged.
  Out of balance it can signal volatility or emotional deadness, lowering sharing.

- “When the correction/learning from a team member’s mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.”
  Norm/Driver: Blanket corrections are acceptable and effective
  Trait undermined: Shepherd, Courage

- “I have more answers than I do questions in our team discussions.”
  Norm/Driver: Leaders have the answers/solve problems
  Trait undermined: Shepherd, Courage

Standard-scored:
- “I am intentional about hiring employees that equally fit the need and the company culture and values.”
  Norm/Driver: A good fit is subservient to proficient skills
  Trait undermined: Shepherd, Navigator

- “My response to dissenting viewpoints shows the team that challenging one another is good thing that leads to growth and innovation”
  Norm/Driver: Don’t question the bosses/leaderships’ decisions
  Trait undermined: Courage

- “I am known among employees for one-line phrases like ‘do what’s right,’ ‘challenges mean learning,’ or ‘We’re in this together.’ Perhaps, jokes about it exist among employees.”
  Norm/Driver: Cliché one liners are futile or childish
  Trait undermined: Shepherd, Navigator

- “It is important that our employee performance metrics are are directly connected to their work AND in their control.”
  Norm/Driver: Outcomes are performance metrics
  Trait undermined: Navigator
  Interpretation note: outcomes matter but are influenced by variables outside control.
  Balanced performance measurement includes behaviors, attitudes, and mindsets.
  Out of balance this lowers ownership and makes winning feel like luck.

- “I openly share with my team when I am struggling professionally.”
  Norm/Driver: Don’t acknowledge weakness
  Trait undermined: Shepherd, Courage

- “I communicate processes, vision, and expectations so much that I am tired of hearing it.”
  Norm/Driver: My team knows what matters…they are adults
  Trait undermined: Navigator
  Key why logic: silence tells stories; people fill gaps with assumptions.
`.trim();

export const buildSummaryUserPrompt = (body, focusAreas = []) => `
Here is the intake data (JSON):
${JSON.stringify(body, null, 2)}

${INTAKE_CONTEXT}

Use these exact subtraits in the final paragraph (bold them with ** **), in this order:
${(focusAreas || []).map((area) => `- ${area.subTraitName} (Parent: ${area.traitName})`).join('\n')}
`.trim();
