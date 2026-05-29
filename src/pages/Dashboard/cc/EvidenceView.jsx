import React, { useEffect, useMemo, useState } from 'react';
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material';
import StatTable from '../../../components/StatTable';
import { chips, colors, fonts, motion, shadows, surfaces, type } from '../../../styles/tokens';
import { useBenchmarkData } from './dashboardData.js';
import { getQuadrant } from './quadrants.js';
import { useGuideInsight } from './guideInsight.js';
import { useGuide } from '../../../context/GuideContext';
import TraitQuadrant from './TraitQuadrant.jsx';

const STAT_COLUMNS = [
  { key: 'efficacy', label: 'Efficacy' },
  { key: 'effort', label: 'Effort' },
  { key: 'compass', label: 'Compass', highlight: true },
];

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const eyebrow = (color) => ({
  fontFamily: fonts.mono,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color,
});

const fmtGap = (n) => (n == null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`);

// ----------------------------------------------------------------------------
// Interpretive + guide helpers
// ----------------------------------------------------------------------------
function buildStatementStatRows(team, self) {
  if (!team) return [];
  const rows = [
    {
      key: 'team',
      label: 'Team',
      efficacy: team.efficacy,
      effort: team.effort,
      compass: Math.round(team.lepScore),
      color: colors.navy900,
    },
  ];
  if (self) {
    rows.push({
      key: 'self',
      label: 'Self',
      efficacy: self.efficacy,
      effort: self.effort,
      compass: Math.round(self.lepScore),
      color: colors.orange,
    });
    rows.push({
      key: 'gap',
      label: 'Gap',
      efficacy: fmtGap(Math.round(self.efficacy - team.efficacy)),
      effort: fmtGap(Math.round(self.effort - team.effort)),
      compass: fmtGap(Math.round(self.lepScore - team.lepScore)),
      color: colors.textSecondary,
    });
  }
  return rows;
}

function statementGapSentence(team, self) {
  if (!team || !self) return '';
  const eGap = Math.round(self.efficacy - team.efficacy);
  const fGap = Math.round(self.effort - team.effort);
  if (Math.max(Math.abs(eGap), Math.abs(fGap)) < 12) {
    return 'Your read and your team’s are close on this statement — the picture is shared.';
  }
  if (Math.abs(eGap) >= Math.abs(fGap)) {
    return eGap > 0
      ? 'You feel more is landing here than your team is reflecting back — worth getting curious about what they aren’t yet feeling.'
      : 'Your team feels more is landing than you give yourself credit for — let that land.';
  }
  return fGap > 0
    ? 'You’re carrying more effort on this than they can see — it’s okay to name that cost out loud.'
    : 'Your team feels the effort here more than you do — their read is asking to be acknowledged.';
}

function buildStatementGuide(focusRow, team, self, idx, total, hasSelfData, insight) {
  const label = focusRow?.subTrait || focusRow?.trait || 'this trait';
  if (!team) {
    return { text: `Statement ${idx + 1} of ${total} — your team hasn’t weighed in here yet.`, faq: [] };
  }
  const zone = getQuadrant(team.effort, team.efficacy);
  const text = `Statement ${idx + 1} of ${total} on ${label} reads as “${zone.label}.”`;
  const faq = [];
  if (team.text) faq.push({ q: 'What does this statement say?', a: team.text });
  faq.push({ q: `What does “${zone.label}” mean?`, a: zone.meaning });
  faq.push({ q: 'What should I do about it?', a: zone.stance });
  if (hasSelfData && self) {
    faq.push({ q: 'How do my read and my team’s compare?', a: statementGapSentence(team, self) });
  }
  if (insight) faq.push({ q: 'Anything else worth noticing?', a: insight });
  return { text, faq };
}

function askingBody(team, self) {
  if (!team) return 'Your team hasn’t weighed in on this statement yet.';
  const zone = getQuadrant(team.effort, team.efficacy);
  let body = zone.meaning;
  if (self) {
    const gap = statementGapSentence(team, self);
    if (gap) body += ` ${gap}`;
  }
  return body;
}

const EFFICACY_EXPLAIN =
  'Efficacy is the vertical axis — how well your team feels you’re meeting their needs. The higher a point sits, the more that statement is landing for them. With this view on, compare how the five statements stack from bottom to top.';
const EFFORT_EXPLAIN =
  'Effort is the horizontal axis — how intentional and attentive you are. The further right a point sits, the more deliberate energy that statement reflects. With this view on, see how the five statements spread from left to right.';

// ----------------------------------------------------------------------------
// Quadrant chip + assessment snapshot (mirrors the Signal page)
// ----------------------------------------------------------------------------
function QuadrantChip({ zone }) {
  return (
    <Tooltip
      arrow
      placement="top"
      title={
        <Box sx={{ p: 0.4 }}>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700, mb: 0.5 }}>{zone.label}</Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 1.5, mb: 0.6 }}>{zone.meaning}</Typography>
          <Typography sx={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', opacity: 0.92 }}>{zone.stance}</Typography>
        </Box>
      }
      slotProps={{ tooltip: { sx: { maxWidth: 280, p: 1.2 } } }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          px: 1,
          py: 0.4,
          borderRadius: 999,
          border: `1px solid ${zone.color}`,
          bgcolor: 'transparent',
          cursor: 'help',
        }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: zone.color, flexShrink: 0 }} />
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: zone.color }}>
          {zone.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function AssessSnapshot({ dotColor, label, metric, t }) {
  const zone = metric ? getQuadrant(metric.effort, metric.efficacy) : null;
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ flexWrap: 'wrap', rowGap: 0.6 }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700, color: t.ink }}>{label}</Typography>
      </Stack>
      {zone ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <QuadrantChip zone={zone} />
          <Typography sx={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: t.inkSoft }}>
            Compass {Math.round(metric.lepScore)}
          </Typography>
        </Stack>
      ) : (
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, fontStyle: 'italic', color: t.inkSoft }}>
          Not yet rated
        </Typography>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------------
// Trait chips — centered selector at the top of the right panel
// ----------------------------------------------------------------------------
function TraitChipRow({ rows, focusKey, onFocus, t }) {
  const sorted = useMemo(() => {
    return [...rows]
      .filter((r) => r.team)
      .sort((a, b) => Math.abs(b.team.delta) - Math.abs(a.team.delta));
  }, [rows]);

  if (!sorted.length) return null;

  return (
    <Box>
      <Typography sx={{ ...eyebrow(t.inkFaint), textAlign: 'center', mb: 1 }}>Select a trait</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ rowGap: 1 }}>
        {sorted.map((row) => {
          const isActive = row.trait === focusKey;
          const label = row.subTrait || row.trait;
          return (
            <Box
              key={row.trait}
              component="button"
              type="button"
              onClick={() => onFocus(row.trait)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                ...chips.base,
                ...chips.hover,
                px: 1.9,
                py: 0.95,
                height: 'auto',
                fontFamily: fonts.sans,
                fontSize: 13.5,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '0.02em',
                textTransform: 'none',
                color: isActive ? colors.amberSoft : t.inkSoft,
                bgcolor: isActive ? colors.navy900 : 'transparent',
                borderColor: isActive ? colors.navy900 : colors.borderSoft,
                boxShadow: isActive ? shadows.card : 'none',
                transition: motion.standard,
                '&:hover': isActive ? {} : { color: t.ink, borderColor: t.inkSoft },
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              {label}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------------
// Statement chips — centered numbered selector (1–5)
// ----------------------------------------------------------------------------
function StatementChipRow({ total, activeIdx, onSelect, t }) {
  if (!total) return null;
  return (
    <Box>
      <Typography sx={{ ...eyebrow(t.inkFaint), textAlign: 'center', mb: 1 }}>Select a statement</Typography>
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === activeIdx;
          return (
            <Box
              key={i}
              component="button"
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Statement ${i + 1}`}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                width: 40,
                height: 40,
                borderRadius: chips.base.borderRadius,
                border: '1px solid',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fonts.serif,
                fontStyle: 'italic',
                fontSize: 16,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? colors.amberSoft : t.inkSoft,
                bgcolor: isActive ? colors.navy900 : 'transparent',
                borderColor: isActive ? colors.navy900 : colors.borderSoft,
                boxShadow: isActive ? shadows.card : 'none',
                transition: motion.standard,
                '&:hover': isActive ? {} : { color: t.ink, borderColor: t.inkSoft },
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              {i + 1}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------------
export default function EvidenceView({ t, selectedAgent }) {
  const { loaded, rows, hasSelfData, selfDataSource } = useBenchmarkData();
  const intakeData = useMemo(() => readJson('latestFormData', null), []);
  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const { setPageMessage, clearPageMessage } = useGuide();

  const [focusKey, setFocusKey] = useState(null);
  const [statementIdx, setStatementIdx] = useState(0);
  const [axisMode, setAxisMode] = useState(null);

  useEffect(() => {
    if (!focusKey && rows.length) {
      const first = rows.find((r) => r.team) || rows[0];
      if (first) setFocusKey(first.trait);
    }
  }, [rows, focusKey]);

  useEffect(() => {
    setStatementIdx(0);
  }, [focusKey]);

  const focusRow = rows.find((r) => r.trait === focusKey) || rows.find((r) => r.team) || rows[0] || null;

  const teamStatements = focusRow?.team?.statements || [];
  const selfStatements = focusRow?.self?.statements || [];
  const totalStatements = Math.max(teamStatements.length, selfStatements.length);
  const currentTeam = teamStatements[statementIdx] || null;
  const currentSelf = selfStatements[statementIdx] || null;

  const { insight, loading } = useGuideInsight({
    view: 'detailed',
    rows,
    focusRow,
    hasSelfData,
    selectedAgent,
    intakeData,
  });

  const firstName = String(userInfo?.name || '').split(/\s+/)[0] || '';

  // Guide carries a concise statement narrative; an isolated axis explains itself.
  useEffect(() => {
    if (axisMode === 'efficacy') {
      setPageMessage({ text: EFFICACY_EXPLAIN, pose: 'read', eyebrow: 'Efficacy' });
      return;
    }
    if (axisMode === 'effort') {
      setPageMessage({ text: EFFORT_EXPLAIN, pose: 'read', eyebrow: 'Effort' });
      return;
    }
    if (!focusRow?.team) return;
    const detail = insight && !loading ? insight : '';
    const guide = buildStatementGuide(focusRow, currentTeam, currentSelf, statementIdx, Math.max(totalStatements, 1), hasSelfData, detail);
    setPageMessage({
      text: guide.text,
      faq: guide.faq,
      pose: 'read',
      eyebrow: focusRow.subTrait || focusRow.trait,
    });
  }, [focusRow?.trait, statementIdx, currentTeam, currentSelf, axisMode, insight, loading, hasSelfData, totalStatements, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  if (!loaded && !rows.length) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...type.sectionTitle, fontSize: 22, color: t.inkSoft }}>
          Loading the evidence…
        </Typography>
      </Box>
    );
  }

  if (!rows.some((r) => r.team)) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, py: 3 }}>
        <Typography sx={{ ...eyebrow(t.accentDeep), mb: 1.6 }}>Evidence</Typography>
        <Typography sx={{ ...type.lead, fontSize: { xs: 24, md: 28 }, color: t.ink, lineHeight: 1.25 }}>
          Evidence will appear once the campaign closes.
        </Typography>
      </Box>
    );
  }

  const statRows = buildStatementStatRows(currentTeam, currentSelf);
  const statementText =
    currentTeam?.text || currentSelf?.text || 'No statement available for this view yet.';

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, pt: 2.2, pb: 4 }}>
      {/* Compact header */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ ...eyebrow(t.accentDeep), mb: 0.4 }}>
          Evidence{firstName ? ` · ${firstName}` : ''}
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontSize: { xs: 24, md: 30 },
            letterSpacing: '-0.02em',
            color: t.ink,
            lineHeight: 1.15,
            fontWeight: 500,
          }}
        >
          The statements behind the signal
        </Typography>
      </Box>

      {/* Two-column composition */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 480px' },
          gap: { xs: 2.4, md: 4 },
          alignItems: 'start',
        }}
      >
        {/* Left column — the quadrant hero in one calm card */}
        <Box sx={{ ...surfaces.card, p: { xs: 2, md: 2.6 } }}>
          <TraitQuadrant
            mode="statements"
            statementTrait={focusRow}
            statementIdx={statementIdx}
            onStatementClick={(idx) => setStatementIdx(idx)}
            rows={rows}
            t={t}
            hasSelfData={hasSelfData}
            selfDataSource={selfDataSource}
            axisMode={axisMode}
            onAxisModeChange={setAxisMode}
            size={640}
          />
        </Box>

        {/* Right column — controls + numbers + meaning, one cohesive panel */}
        <Box sx={{ ...surfaces.card, p: { xs: 2.2, md: 2.6 } }}>
          <TraitChipRow rows={rows} focusKey={focusRow?.trait} onFocus={setFocusKey} t={t} />

          <Divider sx={{ borderColor: colors.borderSoft, my: 2 }} />

          <StatementChipRow
            total={totalStatements}
            activeIdx={statementIdx}
            onSelect={setStatementIdx}
            t={t}
          />

          <Divider sx={{ borderColor: colors.borderSoft, my: 2 }} />

          <Typography
            sx={{
              fontFamily: fonts.serif,
              fontSize: 16.5,
              fontStyle: 'italic',
              fontWeight: 500,
              lineHeight: 1.45,
              color: t.ink,
              mb: 1.8,
            }}
          >
            “{statementText}”
          </Typography>

          <StatTable columns={STAT_COLUMNS} rows={statRows} sx={{ mb: 2 }} />

          <Stack spacing={1.4}>
            <AssessSnapshot dotColor={colors.orange} label="Self Assess" metric={currentSelf} t={t} />
            <AssessSnapshot dotColor={colors.navy900} label="Team Assess" metric={currentTeam} t={t} />
          </Stack>

          <Divider sx={{ borderColor: colors.borderSoft, my: 2 }} />

          <Box>
            <Typography sx={{ ...eyebrow(t.accentDeep), mb: 0.6 }}>What this is asking</Typography>
            <Typography
              sx={{
                fontFamily: fonts.sans,
                fontSize: 13.5,
                lineHeight: 1.55,
                color: t.inkSoft,
              }}
            >
              {askingBody(currentTeam, currentSelf)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
