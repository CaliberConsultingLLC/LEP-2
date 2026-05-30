import React, { useEffect, useMemo, useState } from 'react';
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material';
import StatTable from '../../components/StatTable';
import { chips, colors, fonts, motion, radii, shadows, surfaces, type } from '../../styles/tokens';
import { useBenchmarkData } from './cc/dashboardData.js';
import { useGuide } from '../../context/GuideContext';
import { JOURNEY_STATIONS, JOURNEY_BASE_SRC } from './journey/journeyStations.js';

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

const STATUS_META = {
  complete: { label: 'Complete', color: colors.green },
  current: { label: 'You are here', color: colors.orange },
  upcoming: { label: 'Still ahead', color: colors.textSecondary },
};

// ----------------------------------------------------------------------------
// Map marker
// ----------------------------------------------------------------------------
function StationMarker({ station, index, status, isSelected, onSelect }) {
  const isComplete = status === 'complete';
  const isCurrent = status === 'current';
  const dotBg = isComplete ? colors.green : isCurrent ? colors.orange : colors.surface1;
  const dotColor = isComplete || isCurrent ? 'white' : colors.textSecondary;
  const border = isComplete || isCurrent ? 'none' : `1.5px solid ${colors.sand300}`;

  return (
    <Tooltip arrow placement="top" title={station.label}>
      <Box
        component="button"
        type="button"
        onClick={() => onSelect(station.key)}
        aria-label={`${station.label} — ${STATUS_META[status].label}`}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          position: 'absolute',
          left: `${station.x * 100}%`,
          top: `${station.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 3,
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: dotBg,
          border,
          color: dotColor,
          fontFamily: fonts.mono,
          fontSize: 12,
          fontWeight: 700,
          boxShadow: isSelected
            ? `0 0 0 4px ${colors.surface1}, 0 0 0 6px ${isCurrent ? colors.orange : colors.green}`
            : '0 2px 6px rgba(15,28,46,0.22)',
          transition: motion.standard,
          '&:hover': { transform: 'translate(-50%, -50%) scale(1.12)' },
          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        }}
      >
        {isComplete ? '✓' : index + 1}
        {isCurrent && (
          <Box
            sx={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              border: `2px solid ${colors.orange}`,
              opacity: 0.55,
              animation: 'journeyPulse 2.4s ease-out infinite',
              '@keyframes journeyPulse': {
                '0%': { transform: 'scale(0.9)', opacity: 0.55 },
                '70%': { transform: 'scale(1.5)', opacity: 0 },
                '100%': { transform: 'scale(1.5)', opacity: 0 },
              },
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

// ----------------------------------------------------------------------------
// Station detail panel
// ----------------------------------------------------------------------------
function StationPanel({ station, status, assessment, plan, overlay = false }) {
  const meta = STATUS_META[status];
  const shell = overlay
    ? {
        background: 'color-mix(in srgb, var(--surface-1) 85%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
      }
    : surfaces.card;
  return (
    <Box sx={{ ...shell, p: { xs: 2, md: 2.3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.6 }}>
        <Typography sx={eyebrow(colors.orangeDeep)}>Where you are</Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.7,
            px: 1,
            py: 0.4,
            borderRadius: radii.pill,
            border: `1px solid ${meta.color}`,
          }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color }} />
          <Typography sx={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: meta.color }}>
            {meta.label}
          </Typography>
        </Box>
      </Stack>

      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontSize: { xs: 22, md: 26 },
          letterSpacing: '-0.02em',
          color: colors.textPrimary,
          lineHeight: 1.15,
          fontWeight: 500,
          mb: 1,
        }}
      >
        {station.label}
      </Typography>

      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontSize: 15,
          fontStyle: 'italic',
          lineHeight: 1.5,
          color: colors.textSecondary,
        }}
      >
        {station.blurb}
      </Typography>

      {/* Assessment data */}
      {station.kind === 'assessment' && (
        <>
          <Divider sx={{ borderColor: colors.borderSoft, my: 2 }} />
          {assessment?.available ? (
            <>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.4 }}>
                <Typography sx={{ fontFamily: fonts.serif, fontSize: 34, fontWeight: 600, color: colors.textPrimary, lineHeight: 1 }}>
                  {assessment.overall}
                </Typography>
                <Typography sx={{ ...eyebrow(colors.textSecondary) }}>Compass · team read</Typography>
              </Stack>
              <StatTable columns={STAT_COLUMNS} rows={assessment.rows} />
            </>
          ) : (
            <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.55, color: colors.textSecondary }}>
              This reading is still ahead of you. When this campaign closes, its Compass scores will land right here.
            </Typography>
          )}
        </>
      )}

      {/* Action / practice-plan data */}
      {station.kind === 'action' && (
        <>
          <Divider sx={{ borderColor: colors.borderSoft, my: 2 }} />
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.2 }}>
            <Typography sx={eyebrow(colors.accentDeep || colors.orangeDeep)}>Practice commitments</Typography>
            <Typography sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', color: colors.textSecondary }}>
              {plan.loggedCount} / {plan.items.length}
            </Typography>
          </Stack>
          {plan.items.length ? (
            <Stack spacing={0}>
              {plan.items.map((p) => (
                <Stack
                  key={p.name}
                  direction="row"
                  alignItems="center"
                  spacing={1.2}
                  sx={{ px: 1, py: 0.7, borderRadius: radii.md, bgcolor: p.has ? 'color-mix(in srgb, var(--green) 7%, transparent)' : 'transparent' }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: p.has ? colors.green : colors.sand100,
                      border: p.has ? 'none' : `1px solid ${colors.sand300}`,
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      color: p.has ? 'white' : colors.textSecondary,
                    }}
                  >
                    {p.has ? '✓' : '○'}
                  </Box>
                  <Typography sx={{ flex: 1, fontFamily: fonts.sans, fontSize: 13.5, fontWeight: p.has ? 600 : 500, color: p.has ? colors.textPrimary : colors.textSecondary }}>
                    {p.name}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.55, color: colors.textSecondary }}>
              No practice commitments logged yet — this is where your plan will live.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------------
export default function JourneyTab() {
  const { rows, hasSelfData } = useBenchmarkData();
  const userInfo = useMemo(() => readJson('userInfo', {}), []);
  const intakeData = useMemo(() => readJson('latestFormData', null), []);
  const campaignRecords = useMemo(() => readJson('campaignRecords', {}), []);
  const { setPageMessage, clearPageMessage } = useGuide();

  const liveCampaignId = String(campaignRecords?.teamCampaignId || '').trim();
  const hasTeamData = rows.some((r) => r.team);
  const firstName = String(userInfo?.name || '').split(/\s+/)[0] || '';

  // Practice-plan map for the current campaign, keyed by traitId:subTraitId.
  const planMap = useMemo(() => {
    const userKey = userInfo?.email || userInfo?.name || 'anonymous';
    const byCampaign = readJson('actionPlansByCampaign', {});
    const cid = liveCampaignId || 'current';
    const plans = byCampaign?.[cid]?.[userKey]?.plans || {};
    const map = {};
    Object.entries(plans).forEach(([traitId, subs]) => {
      Object.entries(subs || {}).forEach(([subId, payload]) => {
        const items = (payload?.items || []).filter((it) => String(it?.text || '').trim());
        if (items.length) map[`${traitId}:${subId}`] = items;
      });
    });
    return map;
  }, [userInfo, liveCampaignId]);

  // Completion of the nine steps — derived defensively from what we can see.
  const hasAnyPlan = Object.keys(planMap).length > 0;
  const completion = useMemo(() => {
    const intakeDone = Boolean(intakeData || userInfo?.name);
    const campaignDone = Boolean(liveCampaignId) || hasTeamData;
    return [
      intakeDone,
      campaignDone, // Behaviors & Instincts
      campaignDone, // Campaign Creation
      hasTeamData, // Self & Team Assessment
      hasTeamData && hasSelfData, // Review & Reflect
      hasAnyPlan, // Action Plan
      false, // Check-In Assessment
      false, // Revise Action Plan
      false, // Final Assessment
    ];
  }, [intakeData, userInfo, liveCampaignId, hasTeamData, hasSelfData, hasAnyPlan]);

  const currentIndex = useMemo(() => {
    const i = completion.findIndex((c) => !c);
    return i === -1 ? JOURNEY_STATIONS.length - 1 : i;
  }, [completion]);

  const statusFor = (idx) => (completion[idx] ? 'complete' : idx === currentIndex ? 'current' : 'upcoming');

  const [selectedKey, setSelectedKey] = useState(null);
  const selectedIndex = useMemo(() => {
    const byKey = JOURNEY_STATIONS.findIndex((s) => s.key === selectedKey);
    return byKey === -1 ? currentIndex : byKey;
  }, [selectedKey, currentIndex]);
  const selectedStation = JOURNEY_STATIONS[selectedIndex];
  const selectedStatus = statusFor(selectedIndex);

  // Assessment snapshot for the selected station (current campaign only for now).
  const assessment = useMemo(() => {
    if (selectedStation.kind !== 'assessment') return null;
    const isCurrentCampaign = selectedStation.campaign === 'team';
    if (!isCurrentCampaign || !hasTeamData) return { available: false };
    const teamRows = rows.filter((r) => r.team);
    const overall = Math.round(teamRows.reduce((s, r) => s + r.team.lepScore, 0) / teamRows.length);
    const statRows = teamRows.map((r) => ({
      key: r.trait,
      label: r.subTrait || r.trait,
      efficacy: r.team.efficacy,
      effort: r.team.effort,
      compass: Math.round(r.team.lepScore),
      color: colors.textPrimary,
    }));
    return { available: true, overall, rows: statRows };
  }, [selectedStation, rows, hasTeamData]);

  // Practice-plan snapshot for the selected action station.
  const plan = useMemo(() => {
    if (selectedStation.kind !== 'action') return { items: [], loggedCount: 0 };
    const items = rows.map((r) => ({
      name: r.subTrait || r.trait,
      has: Boolean(planMap[`${r.traitId}:${r.subTraitId}`]),
    }));
    return { items, loggedCount: items.filter((i) => i.has).length };
  }, [selectedStation, rows, planMap]);

  // Guide narrative on select.
  useEffect(() => {
    const meta = STATUS_META[selectedStatus];
    const text = `${selectedStation.label} — ${meta.label.toLowerCase()}. ${selectedStation.blurb}`;
    setPageMessage({ text, pose: 'map', eyebrow: 'The Journey' });
  }, [selectedStation, selectedStatus, setPageMessage]);

  useEffect(() => () => clearPageMessage(), [clearPageMessage]);

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.4, md: 4 }, pt: 1.4, pb: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 1.2 }}>
        <Typography sx={{ ...eyebrow(colors.orangeDeep), mb: 0.4 }}>
          The Journey{firstName ? ` · ${firstName}` : ''}
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.serif,
            fontSize: { xs: 24, md: 30 },
            letterSpacing: '-0.02em',
            color: colors.textPrimary,
            lineHeight: 1.15,
            fontWeight: 500,
          }}
        >
          The record of your becoming
        </Typography>
      </Box>

      {/* Full-bleed map stage. The area behind the image is the exact dashboard
          background (--surface-2), and the image feathers fully into it on all
          edges — so there is no rectangle, the map simply melts into the page.
          Height is capped so the whole page fits in view without scrolling. */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'var(--surface-2)',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-block', maxWidth: '100%', lineHeight: 0 }}>
          <Box
            component="img"
            src={JOURNEY_BASE_SRC}
            alt="Your leadership journey map"
            draggable={false}
            sx={{
              display: 'block',
              width: 'auto',
              maxWidth: '100%',
              maxHeight: { xs: '52vh', md: 'min(66vh, 680px)' },
              userSelect: 'none',
              // Feather all four edges fully into the page background.
              maskImage:
                'radial-gradient(ellipse 122% 120% at 50% 49%, #000 38%, transparent 84%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 122% 120% at 50% 49%, #000 38%, transparent 84%)',
            }}
          />
          {/* Dark-mode calm-down: multiply a navy wash only in dark theme. */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              "html[data-theme='cairn'][data-dark='true'] &": {
                background: 'rgba(10,18,30,0.5)',
                mixBlendMode: 'multiply',
              },
            }}
          />
          {/* Interactive station markers */}
          {JOURNEY_STATIONS.map((station, idx) => (
            <StationMarker
              key={station.key}
              station={station}
              index={idx}
              status={statusFor(idx)}
              isSelected={station.key === selectedStation.key}
              onSelect={setSelectedKey}
            />
          ))}

          {/* "Where you are" readout — floats over the empty upper-left of the map. */}
          <Box
            sx={{
              position: 'absolute',
              top: '3%',
              left: '2%',
              width: 'min(86%, 312px)',
              maxHeight: '90%',
              overflowY: 'auto',
              zIndex: 4,
            }}
          >
            <StationPanel
              station={selectedStation}
              status={selectedStatus}
              assessment={assessment}
              plan={plan}
              overlay
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
