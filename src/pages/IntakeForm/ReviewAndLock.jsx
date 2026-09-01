// The last step of the intake: every question and every answer, read back.
//
// Replaces the AI clarification screen that used to sit here. The leader has
// answered everything; before the summary generates they verify five chapters
// of their own answers and lock the intake. After locking the answers are the
// record — visible forever, editable never.
//
// The ledger is built from live state on every render. Nothing here holds its
// own copy of a question or an answer: `behaviorSet` and
// `societalNormsQuestions` come from IntakeForm exactly as the leader saw
// them, so the recap and the intake cannot drift apart.

import React, { useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { SOCIETAL_NORM_RULES } from '../../data/intakeContext';
import { useGuide } from '../../context/GuideContext';
import {
  colors,
  fonts,
  radii,
  shadows,
  surfaces,
  type,
} from '../../styles/tokens';

// Sits between sand200 and sand300: a card edge that reads on the sand50
// chapter field without competing with the chapter card's own border.
const CARD_EDGE = 'color-mix(in srgb, var(--sand-200, #e8dbc3) 62%, var(--sand-300, #d1bc93))';
// The chapter kicker owns the orange. A theme eyebrow in the same colour turns
// every card into a competing headline, so it takes a muted warm grey instead.
const THEME_INK = 'color-mix(in srgb, var(--ink-soft, #44566c) 52%, var(--sand-300, #d1bc93))';

const pad2 = (n) => String(n).padStart(2, '0');
const clean = (v) => String(v ?? '').trim();

// ---------------------------------------------------------------------------
// Ledger model — five verification units, assembled from live state
// ---------------------------------------------------------------------------

const CONTEXT_ROWS = [
  { key: 'industry', prompt: 'Industry' },
  { key: 'department', prompt: 'Department' },
  { key: 'role', prompt: 'Job title' },
  { key: 'responsibilities', prompt: 'What is your team responsible for?', long: true },
  { key: 'teamSize', prompt: 'Team size' },
  { key: 'leadershipExperience', prompt: 'Years leading people' },
];

const isStory = (q) => q?.type === 'text';

/**
 * Row numbers are per chapter, but they are taken from the position in
 * `behaviorSet` the intake itself counted from — so the number on the recap is
 * the number the leader saw when they answered.
 */
function buildGroups({ formData, societalResponses, behaviorSet, societalNormsQuestions, persona }) {
  const habits = [];
  const stories = [];
  let storiesStarted = false;
  behaviorSet.forEach((q) => {
    if (q?.type === 'intro') {
      storiesStarted = true;
      return;
    }
    if (storiesStarted && isStory(q)) stories.push(q);
    else habits.push(q);
  });

  const row = (q, i) => ({ ...q, num: pad2(i + 1) });

  return [
    {
      id: 'context',
      kicker: 'Chapter I',
      title: 'Your Context',
      shortTitle: 'context',
      rows: CONTEXT_ROWS.map((r, i) => ({
        id: r.key,
        num: pad2(i + 1),
        prompt: r.prompt,
        type: 'context',
        value: clean(formData?.[r.key]),
        long: r.long,
      })),
    },
    {
      id: 'habits',
      kicker: 'Chapter II',
      title: 'Daily Leadership Habits',
      shortTitle: 'these seventeen',
      rows: habits.map(row),
    },
    {
      id: 'stories',
      kicker: 'Chapter II',
      title: 'Your Stories',
      shortTitle: 'the stories',
      rows: stories.map(row),
    },
    {
      id: 'insights',
      kicker: 'Chapter II',
      title: 'Leadership Insights',
      shortTitle: 'the ten statements',
      rows: (societalNormsQuestions || []).map((template, i) => ({
        id: `societal-${i}`,
        num: pad2(i + 1),
        type: 'societal',
        displayTemplate: String(template || ''),
        score: societalResponses?.[i],
      })),
    },
    {
      id: 'guide',
      kicker: 'Chapter I',
      title: 'Your Guide',
      shortTitle: 'your guide',
      rows: [{
        id: 'guide',
        num: '01',
        type: 'guide',
        prompt: 'The voice that walks the rest of Compass with you',
        persona,
      }],
    },
  ];
}

// ---------------------------------------------------------------------------
// Answer renderers — one per question type
// ---------------------------------------------------------------------------

const Dot = () => (
  <Box
    aria-hidden
    sx={{
      width: 5,
      height: 5,
      borderRadius: radii.circle,
      bgcolor: colors.orange,
      flexShrink: 0,
      mt: '6px',
    }}
  />
);

const ValueText = ({ children, sx }) => (
  <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, color: colors.ink, ...sx }}>
    {children}
  </Typography>
);

const NoteText = ({ children }) => (
  <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 12.5, lineHeight: 1.5, color: colors.inkSoft, mt: '3px' }}>
    {children}
  </Typography>
);

const Unanswered = () => (
  <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, fontStyle: 'italic', color: colors.inkSoft, opacity: 0.75 }}>
    Not answered
  </Typography>
);

/** Orange dot + chosen option. `{primary, secondary}` options show the second line as a note. */
function ChoiceAnswer({ value, note }) {
  if (!value) return <Unanswered />;
  return (
    <Box sx={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <Dot />
      <Box sx={{ minWidth: 0 }}>
        <ValueText>{value}</ValueText>
        {note ? <NoteText>{note}</NoteText> : null}
      </Box>
    </Box>
  );
}

function PillsAnswer({ values }) {
  if (!values?.length) return <Unanswered />;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
      {values.map((v, i) => (
        <Box
          key={`${v}-${i}`}
          sx={{
            px: '10px',
            py: '5px',
            borderRadius: radii.pill,
            bgcolor: colors.sand50,
            border: `1px solid ${colors.sand200}`,
            fontFamily: fonts.sans,
            fontSize: 12.5,
            fontWeight: 600,
            lineHeight: 1.35,
            color: colors.ink,
          }}
        >
          {v}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Scoring reads the extremes of a ranking, so the recap marks them too: first
 * in orange, last in muted navy, the middle deliberately quiet.
 */
function RankingAnswer({ values }) {
  if (!values?.length) return <Unanswered />;
  const last = values.length - 1;
  return (
    <Stack spacing="4px">
      {values.map((v, i) => {
        const isFirst = i === 0;
        const isLast = i === last;
        return (
          <Box key={`${v}-${i}`} sx={{ display: 'flex', gap: '9px', alignItems: 'baseline' }}>
            <Typography
              sx={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1.6,
                flexShrink: 0,
                color: isFirst ? colors.orangeDeep : isLast ? colors.navy300 : colors.sand300,
              }}
            >
              {i + 1}
            </Typography>
            <Typography
              sx={{
                fontFamily: fonts.sans,
                fontSize: 12.5,
                fontWeight: isFirst ? 700 : 500,
                lineHeight: 1.45,
                color: isFirst ? colors.ink : isLast ? colors.inkSoft : colors.ink,
              }}
            >
              {v}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

/** Six dichotomies: the side the value leans to is inked, the other recedes. */
function SlidersAnswer({ sliders, values }) {
  if (!sliders?.length) return <Unanswered />;
  return (
    <Stack spacing="6px">
      {sliders.map((s, i) => {
        const raw = Number(values?.[i]);
        const v = Number.isFinite(raw) ? raw : 5.5;
        const pct = ((v - (s.min ?? 1)) / ((s.max ?? 10) - (s.min ?? 1))) * 100;
        const leansRight = pct > 50;
        return (
          <Box key={`${s.left}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
            <Typography sx={{
              fontFamily: fonts.sans, fontSize: 10.5, lineHeight: 1.3, textAlign: 'right', flexShrink: 0,
              fontWeight: leansRight ? 500 : 700,
              color: leansRight ? colors.inkSoft : colors.ink,
              opacity: leansRight ? 0.7 : 1,
            }}>
              {s.left}
            </Typography>
            <Box sx={{ position: 'relative', width: 92, height: 3, borderRadius: radii.pill, bgcolor: colors.sand200, flexShrink: 0 }}>
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: `${Math.max(0, Math.min(100, pct))}%`,
                transform: 'translate(-50%, -50%)',
                width: 7, height: 7, borderRadius: radii.circle, bgcolor: colors.orange,
              }} />
            </Box>
            <Typography sx={{
              fontFamily: fonts.sans, fontSize: 10.5, lineHeight: 1.3, flexShrink: 0,
              fontWeight: leansRight ? 700 : 500,
              color: leansRight ? colors.ink : colors.inkSoft,
              opacity: leansRight ? 1 : 0.7,
            }}>
              {s.right}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

/** Full text, no clamp — they are signing off on it, so they have to read it. */
function StoryAnswer({ value }) {
  if (!clean(value)) return <Unanswered />;
  return (
    <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.58, color: colors.ink }}>
      {value}
    </Typography>
  );
}

/** Ten dots filled to the raw score. Never the reversed one — that is scoring, not an answer. */
function SocietalAnswer({ score }) {
  const n = Number(score);
  if (!Number.isFinite(n)) return <Unanswered />;
  const word = SOCIETAL_NORM_RULES.scale[n] || '';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <Box
            key={i}
            aria-hidden
            sx={{
              width: 7, height: 7, borderRadius: radii.circle,
              bgcolor: i < n ? colors.orange : 'transparent',
              border: i < n ? 'none' : `1px solid ${colors.sand300}`,
            }}
          />
        ))}
      </Box>
      <Typography sx={{
        fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: colors.orangeDeep, whiteSpace: 'nowrap',
      }}>
        {word} · {n}
      </Typography>
    </Box>
  );
}

/**
 * The statement with its blank filled by the leader's own answer, so the row
 * reads back as the sentence they actually agreed to rather than a fill-in.
 */
function FilledTemplate({ template, score }) {
  const word = SOCIETAL_NORM_RULES.scale[Number(score)] || '';
  const [before, after] = String(template || '').split('____');
  if (!word || after === undefined) return <>{template}</>;
  return (
    <>
      {before}
      <Box component="span" sx={{ fontWeight: 700, fontStyle: 'italic', color: colors.orangeDeep }}>
        {word.toLowerCase()}
      </Box>
      {after}
    </>
  );
}

function GuideAnswer({ persona }) {
  if (!persona) return <Unanswered />;
  return (
    <Box sx={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <Box aria-hidden sx={{
        width: 5, height: 5, borderRadius: radii.circle, mt: '6px', flexShrink: 0,
        bgcolor: persona.accent || colors.orange,
      }} />
      <Box sx={{ minWidth: 0 }}>
        <ValueText>{persona.name}</ValueText>
        {persona.tagline ? <NoteText>{persona.tagline}</NoteText> : null}
      </Box>
    </Box>
  );
}

/** Dispatches on question type. Everything reads from live state. */
function AnswerFor({ row, formData }) {
  switch (row.type) {
    case 'context':
      return row.long ? <StoryAnswer value={row.value} /> : <ChoiceAnswer value={row.value} />;
    case 'societal':
      return <SocietalAnswer score={row.score} />;
    case 'guide':
      return <GuideAnswer persona={row.persona} />;
    case 'multi-select':
      return <PillsAnswer values={formData?.[row.id]} />;
    case 'ranking':
      return <RankingAnswer values={formData?.[row.id]} />;
    case 'sliders':
      return <SlidersAnswer sliders={row.sliders} values={formData?.[row.id]} />;
    case 'text':
      return <StoryAnswer value={formData?.[row.id]} />;
    case 'radio': {
      const value = formData?.[row.id];
      // `decisionPace` options are {primary, secondary}: the second line is a
      // gloss on the choice, not a separate answer.
      const match = (row.options || []).find((o) => (o?.primary ?? o) === value);
      const note = row.id === 'roleModelTrait'
        ? clean(formData?.roleModelTraitElaboration)
        : (match && typeof match === 'object' ? match.secondary : '');
      return <ChoiceAnswer value={clean(value)} note={note} />;
    }
    default:
      return <ChoiceAnswer value={clean(formData?.[row.id])} />;
  }
}

// ---------------------------------------------------------------------------
// Question card
// ---------------------------------------------------------------------------

function QuestionCard({ row, formData, onEdit, locked, flashed }) {
  return (
    <Box
      sx={{
        bgcolor: colors.surface1,
        border: `1px solid ${CARD_EDGE}`,
        borderRadius: radii.md,
        p: '15px 18px',
        display: 'grid',
        alignItems: 'start',
        gap: '16px',
        gridTemplateColumns: '26px minmax(0, 0.78fr) minmax(0, 1fr) 76px',
        ...(flashed ? { animation: 'reviewRowFlash 1900ms ease-out 1' } : null),
        // Below ~1000px the card stacks: asked on top, a rule, then answered.
        '@media (max-width: 1000px)': {
          gridTemplateColumns: '26px minmax(0, 1fr) 44px',
          rowGap: '12px',
        },
      }}
    >
      <Typography sx={{
        fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, lineHeight: 1.7,
        color: colors.sand300, pt: '1px',
      }}>
        {row.num}
      </Typography>

      <Box sx={{ minWidth: 0 }}>
        {row.theme ? (
          <Typography sx={{
            fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: THEME_INK, mb: '5px',
          }}>
            {row.theme}
          </Typography>
        ) : null}
        <Typography sx={{
          fontFamily: fonts.serif, fontSize: 14.5, fontWeight: 500, lineHeight: 1.38, color: colors.ink,
        }}>
          {row.type === 'societal'
            ? <FilledTemplate template={row.displayTemplate} score={row.score} />
            : row.prompt}
        </Typography>
      </Box>

      {/* The vertical rule is what makes the pairing readable. Without it the
          two columns read as one run-on line. */}
      <Box
        sx={{
          minWidth: 0,
          alignSelf: 'stretch',
          borderLeft: `1px solid ${CARD_EDGE}`,
          pl: '22px',
          '@media (max-width: 1000px)': {
            gridColumn: '2 / 4',
            borderLeft: 'none',
            borderTop: `1px solid ${CARD_EDGE}`,
            pl: 0,
            pt: '12px',
          },
        }}
      >
        <AnswerFor row={row} formData={formData} />
      </Box>

      {locked ? <Box /> : (
        <Box
          component="button"
          type="button"
          className="edit-btn"
          onClick={() => onEdit(row.id)}
          aria-label={`Edit: ${row.prompt || row.displayTemplate}`}
          sx={{
            all: 'unset',
            boxSizing: 'border-box',
            cursor: 'pointer',
            justifySelf: 'end',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            px: '10px',
            height: 30,
            borderRadius: radii.pill,
            border: `1px solid ${colors.sand200}`,
            fontFamily: fonts.sans,
            fontSize: 11.5,
            fontWeight: 700,
            color: colors.inkSoft,
            transition: 'border-color 140ms, color 140ms, background 140ms',
            '&:hover': { borderColor: colors.orange, color: colors.navy900, bgcolor: colors.sand50 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            '@media (max-width: 1000px)': {
              gridRow: 1,
              gridColumn: 3,
              width: 44, height: 44, px: 0, borderRadius: radii.circle,
            },
          }}
        >
          Edit
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

function ChapterCard({
  group, index, open, verified, locked, onToggle, onVerify,
  formData, onEdit, flashedRow,
}) {
  const count = group.rows.length;
  const verifyLabel = open ? 'Looks right' : verified ? 'Verified' : 'Verify';

  const verifyStyle = open
    ? { bgcolor: colors.orange, color: '#fff', border: '1px solid transparent', boxShadow: shadows.buttonSecondary }
    : verified
      ? { bgcolor: 'rgba(47,133,90,.09)', color: colors.green, border: `1px solid ${colors.green}` }
      : { bgcolor: colors.surface1, color: colors.navy900, border: `1px solid ${colors.navy500}` };

  return (
    <Box
      sx={{
        ...surfaces.card,
        p: 0,
        overflow: 'hidden',
        border: verified && !open ? '1px solid rgba(47,133,90,.34)' : undefined,
      }}
    >
      {/* Header row */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: '14px',
        p: '16px 20px',
      }}>
        <Box aria-hidden sx={{
          width: 26, height: 26, borderRadius: radii.circle, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fonts.mono, fontSize: 11, fontWeight: 700,
          ...(verified
            ? { bgcolor: colors.green, color: '#fff', border: '1px solid transparent' }
            : { bgcolor: colors.sand50, color: THEME_INK, border: `1px solid ${colors.sand200}` }),
        }}>
          {verified ? '✓' : index + 1}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{
            fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: colors.orangeDeep,
          }}>
            {group.kicker}
          </Typography>
          <Typography sx={{
            fontFamily: fonts.serif, fontSize: 19, fontWeight: 600, fontStyle: 'italic',
            lineHeight: 1.2, color: colors.ink,
          }}>
            {group.title}
          </Typography>
        </Box>

        <Box sx={{
          px: '9px', py: '4px', borderRadius: radii.pill, flexShrink: 0,
          bgcolor: colors.sand50, border: `1px solid ${colors.sand200}`,
          fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, color: THEME_INK,
        }}>
          {count} question{count === 1 ? '' : 's'}
        </Box>

        <Box sx={{ flex: 1, minWidth: 12 }} />

        {locked ? (
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0,
            px: '16px', minHeight: 44, borderRadius: radii.pill,
            bgcolor: colors.navy900, color: colors.amberSoft,
            fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700,
          }}>
            <span aria-hidden>🔒</span> Locked
          </Box>
        ) : (
          <Box
            component="button"
            type="button"
            onClick={open ? onVerify : onToggle}
            aria-expanded={open}
            sx={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              px: '18px', minHeight: 44, borderRadius: radii.pill,
              fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700,
              transition: 'transform 140ms, background 140ms',
              '&:hover': { transform: 'translateY(-1px)' },
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              ...verifyStyle,
            }}
          >
            {verifyLabel}
            <Box component="span" aria-hidden sx={{ fontSize: 11 }}>
              {open ? '✓' : verified ? '✓' : '⌄'}
            </Box>
          </Box>
        )}
      </Box>

      {/* Body — all-or-nothing: every question in the chapter, or none. */}
      {open ? (
        <Box sx={{ bgcolor: colors.sand50, borderTop: `1px solid ${colors.sand200}`, p: '16px 20px 20px' }}>
          <Stack spacing="10px">
            {group.rows.map((row) => (
              <QuestionCard
                key={row.id}
                row={row}
                formData={formData}
                onEdit={onEdit}
                locked={locked}
                flashed={flashedRow === row.id}
              />
            ))}
          </Stack>

          {/* Repeated at the foot so a long chapter does not force a scroll
              back to the header to confirm it. */}
          {locked ? null : (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: '18px' }}>
              <Box
                component="button"
                type="button"
                onClick={onVerify}
                sx={{
                  all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  px: '22px', minHeight: 44, borderRadius: radii.pill,
                  bgcolor: colors.orange, color: '#fff',
                  fontFamily: fonts.sans, fontSize: 13, fontWeight: 700,
                  boxShadow: shadows.buttonSecondary,
                  transition: 'transform 140ms',
                  '&:hover': { transform: 'translateY(-1px)' },
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                <Box component="span" aria-hidden>✓</Box>
                That is right — verify {group.shortTitle}
              </Box>
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Review & Lock
// ---------------------------------------------------------------------------

export default function ReviewAndLock({
  formData,
  societalResponses,
  behaviorSet,
  societalNormsQuestions,
  onEdit,
  onLock,
  isSubmitting = false,
  locked = false,
  lockedAt = '',
  flashedRow = '',
}) {
  const { persona } = useGuide();
  const groups = useMemo(
    () => buildGroups({ formData, societalResponses, behaviorSet, societalNormsQuestions, persona }),
    [formData, societalResponses, behaviorSet, societalNormsQuestions, persona]
  );

  const [openId, setOpenId] = useState('');
  const [verified, setVerified] = useState({});

  const verifiedCount = groups.filter((g) => verified[g.id]).length;
  const allVerified = verifiedCount === groups.length;

  const toggle = (id) => setOpenId((prev) => (prev === id ? '' : id));
  const verify = (id) => {
    setVerified((prev) => ({ ...prev, [id]: true }));
    setOpenId('');
  };

  const lockedDate = useMemo(() => {
    if (!lockedAt) return '';
    const d = new Date(lockedAt);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).toUpperCase();
  }, [lockedAt]);

  return (
    <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
      <style>{`@keyframes reviewRowFlash { 0% { background: rgba(224,122,63,.14); } 100% { background: #fff; } }`}</style>

      {/* Heading */}
      <Box sx={{ textAlign: 'center', mb: '20px' }}>
        <Typography sx={{ ...type.eyebrow, mb: '10px' }}>THE LAST LOOK</Typography>
        <Typography sx={{ ...type.pageTitle, mb: '8px' }}>Read it back before it locks.</Typography>
        <Typography sx={{ ...type.subtitle, mx: 'auto', textAlign: 'center' }}>
          Five stretches of the intake. Open one, read what you actually said, and mark it right.
          When all five are verified you can lock the whole thing in.
        </Typography>
      </Box>

      {/* Ledger */}
      <Stack spacing="10px" sx={{ mb: '18px' }}>
        {groups.map((group, i) => (
          <ChapterCard
            key={group.id}
            group={group}
            index={i}
            open={openId === group.id}
            verified={Boolean(verified[group.id])}
            locked={locked}
            onToggle={() => toggle(group.id)}
            onVerify={() => verify(group.id)}
            formData={formData}
            onEdit={onEdit}
            flashedRow={flashedRow}
          />
        ))}
      </Stack>

      {locked ? <LockedBanner date={lockedDate} onRead={onLock} /> : (
        <SignOffPanel
          verifiedCount={verifiedCount}
          total={groups.length}
          allVerified={allVerified}
          isSubmitting={isSubmitting}
          onLock={onLock}
        />
      )}
    </Box>
  );
}

// The five pips are the whole gate. There is no acknowledgement checkbox —
// verifying every chapter is the acknowledgement.
function Pips({ count, total }) {
  return (
    <Box sx={{ display: 'flex', gap: '5px' }} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <Box key={i} sx={{
          width: 7, height: 7, borderRadius: radii.circle,
          bgcolor: i < count ? colors.green : 'transparent',
          border: i < count ? 'none' : '1px solid rgba(244,206,161,.42)',
        }} />
      ))}
    </Box>
  );
}

function SignOffPanel({ verifiedCount, total, allVerified, isSubmitting, onLock }) {
  return (
    <Box sx={{
      position: 'relative',
      borderRadius: radii.lg,
      border: '1px solid rgba(244,206,161,.18)',
      background: 'linear-gradient(158deg, #16304f 0%, #09101f 76%)',
      overflow: 'hidden',
      p: { xs: '22px 24px', md: '26px 32px' },
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: { xs: 'stretch', md: 'center' },
      gap: { xs: '20px', md: '40px' },
    }}>
      <Box aria-hidden sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${colors.brass}, transparent)`,
      }} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#e1af43', mb: '8px',
        }}>
          The sign-off
        </Typography>
        <Typography sx={{
          fontFamily: fonts.serif, fontSize: 24, fontWeight: 500, lineHeight: 1.2,
          color: '#f0e9de', mb: '10px',
        }}>
          This becomes the record.
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 1.6, color: colors.navy300, maxWidth: '58ch' }}>
          Your reflection, the three traits you build the year on, and every score after are read
          from these answers. Once you lock it in they cannot be changed — not by you, and not by us.
        </Typography>
      </Box>

      <Stack spacing="10px" alignItems={{ xs: 'stretch', md: 'flex-end' }} sx={{ flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Pips count={verifiedCount} total={total} />
          <Typography sx={{
            fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: colors.navy300,
          }}>
            {allVerified ? 'All five verified' : `${verifiedCount} of ${total} verified`}
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={allVerified && !isSubmitting ? onLock : undefined}
          disabled={!allVerified || isSubmitting}
          sx={{
            all: 'unset', boxSizing: 'border-box',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 200, minHeight: 46, px: '28px', borderRadius: radii.pill,
            fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700,
            cursor: allVerified && !isSubmitting ? 'pointer' : 'not-allowed',
            transition: 'transform 140ms, box-shadow 140ms',
            ...(allVerified
              ? {
                  bgcolor: colors.orange,
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(224,122,63,.3)',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 30px rgba(224,122,63,.36)' },
                }
              : {
                  bgcolor: 'rgba(224,122,63,.28)',
                  color: 'rgba(255,255,255,.5)',
                  boxShadow: 'none',
                }),
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          {isSubmitting ? 'Locking…' : 'Lock it in'}
        </Box>

        <Typography sx={{
          fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 1.5,
          color: colors.navy300, textAlign: { xs: 'left', md: 'right' },
        }}>
          {allVerified
            ? 'Your answers stay visible to you. They stop being editable.'
            : 'Verify every stretch above to unlock this.'}
        </Typography>
      </Stack>
    </Box>
  );
}

// Navy, not white-and-green: green stays for per-chapter verification only.
function LockedBanner({ date, onRead }) {
  return (
    <Box sx={{
      position: 'relative',
      borderRadius: radii.lg,
      border: '1px solid rgba(244,206,161,.18)',
      background: 'linear-gradient(158deg, #16304f 0%, #09101f 76%)',
      overflow: 'hidden',
      p: { xs: '22px 24px', md: '24px 32px' },
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: { xs: 'stretch', md: 'center' },
      gap: { xs: '18px', md: '40px' },
    }}>
      <Box aria-hidden sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${colors.brass}, transparent)`,
      }} />

      <Box aria-hidden sx={{
        width: 42, height: 42, borderRadius: radii.circle, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'rgba(244,206,161,.12)', border: '1px solid rgba(244,206,161,.24)',
        fontSize: 17,
      }}>
        🔒
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#e1af43', mb: '6px',
        }}>
          {date ? `Locked · ${date}` : 'Locked'}
        </Typography>
        <Typography sx={{ fontFamily: fonts.serif, fontSize: 23, fontWeight: 500, lineHeight: 1.2, color: '#f0e9de', mb: '6px' }}>
          Your intake is closed.
        </Typography>
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 1.6, color: colors.navy300, maxWidth: '58ch' }}>
          Nothing above can change from here. You can open this page any time to read exactly what you said.
        </Typography>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={onRead}
        sx={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 46, px: '28px', borderRadius: radii.pill,
          bgcolor: colors.orange, color: '#fff',
          fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(224,122,63,.3)',
          transition: 'transform 140ms',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        }}
      >
        Read your reflection
      </Box>
    </Box>
  );
}
