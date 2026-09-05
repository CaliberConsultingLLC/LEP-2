// /api/regenerate-statement.js
//
// Replaces one dismissed survey statement with a fresh one for the same trait.
//
// Before this existed, dismissing a statement only tinted the row and
// decremented a counter — the statement still went out to the team. Replacing
// in place fixes that at the root: the campaign always holds five real
// statements, so whatever the builder saves is already correct and there is no
// filter to forget.
//
// What a leader rejects is itself signal. Every prior dismissal for the trait is
// sent along so the replacement takes a genuinely different angle rather than
// rephrasing something they have already turned down once.

import { NARRATIVE_MODEL, createJson, hasAnthropicKey } from './_anthropic.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

const MAX_STATEMENT_CHARS = 140;

const REPLACEMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['statement', 'angle'],
  properties: {
    statement: {
      type: 'string',
      description: 'One team-facing statement about an observable leader behavior. At most 140 characters.',
    },
    angle: {
      type: 'string',
      description: 'A few words naming how this differs from the dismissed one. Not shown to the leader.',
    },
  },
};

const SYSTEM_PROMPT = `
You write team-facing survey statements for Compass leadership campaigns.

A leader has dismissed one statement from their campaign. Write the single statement that replaces it.

WHAT MAKES A USABLE STATEMENT
- An observable behavior a teammate could witness, written from the team's perspective.
- Rateable independently on EFFORT (how much the leader visibly tries) and EFFICACY (how well it lands).
  "Is a good communicator" fails both. "Clearly explains priorities in team meetings" passes both.
- At most 140 characters. No numbering, no markdown, no quotation marks.
- Plain observable language. Not a trait name, not a competency label, not coaching advice.

REPLACING A DISMISSED STATEMENT
- Take a different angle on the same sub-trait. Do not rephrase what they dismissed — they already said no
  to that, and returning it in new words is the one thing guaranteed to be useless.
- Do not overlap with the statements they kept. The five should probe five distinct behaviors.
- If several dismissals for this trait circle the same theme, that theme is likely the uncomfortable one.
  Do not dodge it — approach it through a behavior that is more concrete and easier to observe, so the team
  can rate what actually happens rather than an abstraction the leader can argue with.
- Stay inside the sub-trait. A replacement that drifts to a different competency breaks the campaign's structure.
`.trim();

function buildUserPrompt({ traitName, subTraitName, dismissed, kept, previouslyDismissed, focus }) {
  return `
SUB-TRAIT BEING MEASURED
${subTraitName || traitName}${traitName && subTraitName && traitName !== subTraitName ? ` (part of ${traitName})` : ''}

STATEMENT THE LEADER JUST DISMISSED
${dismissed}

STATEMENTS THEY KEPT (do not overlap with these)
${kept.length ? kept.map((s) => `- ${s}`).join('\n') : '- (none yet)'}
${previouslyDismissed.length ? `
ALSO DISMISSED EARLIER FOR THIS TRAIT (avoid these angles too)
${previouslyDismissed.map((s) => `- ${s}`).join('\n')}
` : ''}${focus ? `
WHAT THIS TRAIT IS SUPPOSED TO SURFACE FOR THIS LEADER
${JSON.stringify(focus)}
` : ''}
Write the one replacement statement now.
`.trim();
}

// Same wrapping-quote rule as the campaign builder: strip only a matching
// pair, so a statement that legitimately ends on a quote keeps it.
const QUOTE_PAIRS = [['"', '"'], ["'", "'"], ['“', '”'], ['‘', '’']];

function stripWrappingQuotes(text) {
  for (const [open, close] of QUOTE_PAIRS) {
    if (text.length > 1 && text.startsWith(open) && text.endsWith(close)) {
      const inner = text.slice(1, -1);
      if (!inner.includes(open) && !inner.includes(close)) return inner.trim();
    }
  }
  return text;
}

const clean = (v) => stripWrappingQuotes(String(v || '').replace(/\s+/g, ' ').trim());

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, { action: 'regenerate-statement', limit: 60, windowMs: 60_000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!hasAnthropicKey()) {
    return res.status(503).json({ error: 'Statement regeneration is not configured.' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;
    const body = req.body || {};

    const dismissed = clean(body.dismissedStatement);
    const traitName = clean(body.traitName);
    const subTraitName = clean(body.subTraitName);
    if (!dismissed || !(traitName || subTraitName)) {
      return res.status(400).json({ error: 'dismissedStatement and a trait name are required.' });
    }

    const kept = (Array.isArray(body.keptStatements) ? body.keptStatements : []).map(clean).filter(Boolean).slice(0, 8);
    const previouslyDismissed = (Array.isArray(body.previouslyDismissed) ? body.previouslyDismissed : [])
      .map(clean).filter(Boolean).filter((s) => s !== dismissed).slice(0, 8);

    // Optional: the focus area from the persisted insight map, so the
    // replacement probes what this trait was chosen to reveal about this leader.
    const focus = body.focus && typeof body.focus === 'object'
      ? {
          subTraitName: clean(body.focus.subTraitName),
          rationale: clean(body.focus.rationale),
          predictedTeamRead: clean(body.focus.predictedTeamRead),
        }
      : null;

    const avoid = new Set([dismissed, ...kept, ...previouslyDismissed].map((s) => s.toLowerCase()));

    let statement = '';
    let angle = '';
    for (let attempt = 0; attempt < 2 && !statement; attempt += 1) {
      const { data } = await createJson({
        model: NARRATIVE_MODEL,
        system: attempt === 0
          ? SYSTEM_PROMPT
          : `${SYSTEM_PROMPT}\n\nYour previous attempt repeated a statement already on the list or ran too long. Take a distinctly different angle and stay under 140 characters.`,
        user: buildUserPrompt({ traitName, subTraitName, dismissed, kept, previouslyDismissed, focus }),
        schema: REPLACEMENT_SCHEMA,
        maxTokens: 1200,
        effort: 'low',
        thinking: false,
      });

      const candidate = clean(data?.statement);
      if (candidate && candidate.length <= MAX_STATEMENT_CHARS && !avoid.has(candidate.toLowerCase())) {
        statement = candidate;
        angle = clean(data?.angle);
      }
    }

    if (!statement) {
      return res.status(502).json({ error: 'Could not generate a distinct replacement statement.' });
    }

    return res.status(200).json({ statement, angle });
  } catch (err) {
    return safeServerError(res, 'Statement regeneration error:', err);
  }
}
