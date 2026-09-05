// The catalog — a contact sheet, not a run.
//
// The other three demo doors start a *flow*: they seed a session and hand you
// to the first page, and you walk forward from there. This one doesn't go
// anywhere. It is a list of every page in the product, and every state that
// page can be caught in, so a design change can be looked at without playing
// the game to reach it.
//
// Each link wipes storage, loads its fixture, and hard-navigates. Every entry
// is therefore identical to the last one regardless of what you clicked in
// between — which is the whole point, because pages write to storage as you
// read them and a catalog that remembered your clicks would rot the same way
// staging did.
//
// No API is called from here. See catalogFixtures.js for why the guide copy is
// canned and why there are three fixtures rather than one.

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, radii, surfaces, type } from '../styles/tokens';
import { startDemoSession } from '../utils/demoMode';
import { applyFixture, FIXTURES, getFixture } from '../utils/catalogFixtures';
import { STAGING_SELF_ID, STAGING_TEAM_ID } from '../utils/stagingSeed';

// `in` lists the fixtures a page is worth looking at under. A page listed
// under two fixtures is one route drawing two different things — that is the
// reason the catalog has a second axis at all.
const GROUPS = [
  {
    label: 'Way in',
    pages: [
      { label: 'Landing', path: '/', in: ['fresh', 'mid', 'finished'] },
      { label: 'Sign in', path: '/sign-in', in: ['fresh'] },
      { label: 'Account', path: '/user-info', in: ['fresh'] },
      { label: 'Guide select', path: '/guide-select', in: ['fresh'] },
      { label: 'Pricing', path: '/pricing', in: ['fresh'] },
      { label: 'Checkout', path: '/pay', in: ['fresh'] },
      { label: 'Checkout success', path: '/pay/success', in: ['fresh'] },
    ],
  },
  {
    label: 'Intake',
    pages: [
      { label: 'Your context', path: '/form?stage=profile', in: ['fresh', 'mid'] },
      {
        label: 'Daily behaviors',
        path: '/form?stage=intake',
        in: ['fresh', 'mid'],
        hint: 'Fresh opens on question 1; mid opens with answers already in.',
      },
      { label: 'Leadership insights', path: '/form?step=3', in: ['fresh', 'mid'] },
      {
        label: 'Review & lock',
        path: '/form?stage=review',
        in: ['mid', 'finished'],
        hint: 'Mid is still lockable; finished draws the sealed ledger.',
      },
    ],
  },
  {
    label: 'Reflection',
    pages: [
      { label: 'Summary', path: '/summary', in: ['mid', 'finished'] },
      { label: 'Summary — trailhead', path: '/summary?stage=trailhead', in: ['mid', 'finished'] },
      { label: 'Summary snapshot', path: '/summary-static', in: ['mid', 'finished'] },
    ],
  },
  {
    label: 'Growth campaign',
    pages: [
      { label: 'Trait selection', path: '/trait-selection', in: ['mid', 'finished'] },
      { label: 'Campaign builder', path: '/campaign-builder', in: ['mid', 'finished'] },
      { label: 'Review and submit', path: '/campaign-verify', in: ['mid', 'finished'] },
    ],
  },
  {
    label: 'Assessment',
    pages: [
      { label: 'Information', path: '/self-assessment', in: ['mid', 'finished'] },
      { label: 'Team invite', path: '/self-assessment?step=invite', in: ['mid', 'finished'] },
      {
        label: 'Self survey',
        path: `/campaign/${STAGING_SELF_ID}/survey`,
        in: ['mid', 'finished'],
        hint: 'Finished draws the closed-survey state.',
      },
      { label: 'Self complete', path: `/campaign/${STAGING_SELF_ID}/complete`, in: ['mid', 'finished'] },
      { label: 'Team intro', path: `/campaign/${STAGING_TEAM_ID}`, in: ['mid', 'finished'] },
      { label: 'Team survey', path: `/campaign/${STAGING_TEAM_ID}/survey`, in: ['mid', 'finished'] },
      {
        label: 'Team complete',
        path: `/campaign/${STAGING_TEAM_ID}/complete`,
        in: ['mid', 'finished'],
        hint: 'The teammate’s thank-you — a different page from the self one above it.',
      },
    ],
  },
  {
    label: 'Command center',
    pages: [
      { label: 'Current bearing', path: '/dashboard?tab=bearing', in: ['mid', 'finished'] },
      {
        label: 'Narrative',
        path: '/dashboard?tab=narrative',
        in: ['finished'],
        hint: 'The eight-page reading, opened on page one — the deck remembers where you stopped, and the wipe forgets it.',
      },
      {
        label: 'Signal',
        path: '/dashboard?tab=results',
        in: ['mid', 'finished'],
        hint: 'Mid is still gathering; finished has the signal in.',
      },
      { label: 'Evidence', path: '/dashboard?tab=evidence', in: ['finished'] },
      { label: 'Practice', path: '/dashboard?tab=practice', in: ['finished'] },
      { label: 'Journey', path: '/dashboard?tab=journey', in: ['mid', 'finished'] },
    ],
  },
  {
    label: 'Standalone',
    pages: [
      { label: 'FAQ', path: '/faq', in: ['fresh'] },
      { label: 'Documents', path: '/documents', in: ['fresh'] },
      { label: 'Design system', path: '/design', in: ['fresh'] },
      { label: 'Not found', path: '/no-such-page', in: ['fresh'] },
    ],
  },
];

const FIXTURE_TINT = {
  fresh: { bg: 'rgba(143, 179, 205, 0.16)', ink: colors.navy600, line: 'rgba(143, 179, 205, 0.55)' },
  mid: { bg: 'rgba(224, 122, 63, 0.13)', ink: colors.orangeDeep, line: 'rgba(224, 122, 63, 0.45)' },
  finished: { bg: 'rgba(47, 133, 90, 0.13)', ink: colors.green, line: 'rgba(47, 133, 90, 0.42)' },
};

function FixtureChip({ id, onClick, disabled }) {
  const tint = FIXTURE_TINT[id] || FIXTURE_TINT.mid;
  const fixture = getFixture(id);
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={fixture?.blurb || ''}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: disabled ? 'wait' : 'pointer',
        px: '10px',
        py: '4px',
        borderRadius: radii.pill,
        bgcolor: tint.bg,
        border: `1px solid ${tint.line}`,
        color: tint.ink,
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        transition: '120ms',
        opacity: disabled ? 0.5 : 1,
        '&:hover': disabled ? undefined : { filter: 'brightness(0.94)' },
        '&:focus-visible': { outline: `2px solid ${tint.line}`, outlineOffset: 2 },
      }}
    >
      {fixture?.label || id}
    </Box>
  );
}

function DemoCatalog() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // Entering the catalog starts (and clears) the throwaway session, so the
  // storage shim is installed before any fixture is written and nothing here
  // can reach a real account on this browser.
  useEffect(() => {
    startDemoSession();
  }, []);

  const open = (path, fixtureId) => {
    setBusy(true);
    startDemoSession();
    applyFixture(fixtureId);
    // Hard load on purpose: GuideContext and the page's own mount-time reads
    // resolve out of storage once, so the fixture has to be on disk before the
    // tree is built. A client-side push would render against the old state.
    window.location.assign(path);
  };

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: colors.sand50, px: 2, py: { xs: 3, md: 5 } }}>
      <Box sx={{ width: '100%', maxWidth: 940, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ ...type.eyebrow, mb: 1.2 }}>Internal demo · catalog</Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: fonts.serif,
              fontWeight: 500,
              fontSize: { xs: 26, md: 32 },
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: colors.textPrimary,
              mb: 1.2,
            }}
          >
            Every page, in every state it can be caught in.
          </Typography>
          <Typography sx={{ ...type.body, maxWidth: '64ch' }}>
            Pick a state and a page. Each link wipes the session, loads that state, and
            lands you on the page — so what you see is the same every visit no matter
            what you clicked before it. Guide copy is canned; this is for looking at
            design, not at what the agent says.
          </Typography>
        </Box>

        <Box
          sx={{
            ...surfaces.card,
            p: { xs: 1.8, md: 2.2 },
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {FIXTURES.map((fixture) => {
            const tint = FIXTURE_TINT[fixture.id] || FIXTURE_TINT.mid;
            return (
              <Box key={fixture.id} sx={{ display: 'flex', gap: 1.4, alignItems: 'baseline' }}>
                <Box
                  sx={{
                    flexShrink: 0,
                    minWidth: 92,
                    px: '10px',
                    py: '3px',
                    borderRadius: radii.pill,
                    bgcolor: tint.bg,
                    border: `1px solid ${tint.line}`,
                    color: tint.ink,
                    fontFamily: fonts.sans,
                    fontWeight: 700,
                    fontSize: 11,
                    textAlign: 'center',
                  }}
                >
                  {fixture.label}
                </Box>
                <Typography sx={{ ...type.body, fontSize: 13 }}>{fixture.blurb}</Typography>
              </Box>
            );
          })}
        </Box>

        {GROUPS.map((group) => (
          <Box key={group.label} sx={{ mb: 2.4 }}>
            <Typography sx={{ ...type.eyebrow, mb: 1, color: colors.inkSoft }}>
              {group.label}
            </Typography>
            <Box sx={{ ...surfaces.card, p: 0, overflow: 'hidden' }}>
              {group.pages.map((page, idx) => (
                <Box
                  key={page.path + page.label}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1.2,
                    px: { xs: 1.6, md: 2 },
                    py: 1.3,
                    borderTop: idx === 0 ? 'none' : `1px solid ${colors.borderSoft}`,
                  }}
                >
                  <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: fonts.sans,
                        fontWeight: 700,
                        fontSize: 14,
                        color: colors.ink,
                        lineHeight: 1.3,
                      }}
                    >
                      {page.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: fonts.mono,
                        fontSize: 11,
                        color: colors.inkSoft,
                        wordBreak: 'break-all',
                      }}
                    >
                      {page.path}
                    </Typography>
                    {page.hint && (
                      <Typography
                        sx={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkSoft, mt: '2px' }}
                      >
                        {page.hint}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                    {page.in.map((fixtureId) => (
                      <FixtureChip
                        key={fixtureId}
                        id={fixtureId}
                        disabled={busy}
                        onClick={() => open(page.path, fixtureId)}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}

        <Box
          component="button"
          type="button"
          onClick={() => navigate('/demo')}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 12,
            color: colors.inkSoft,
            textDecoration: 'underline',
            '&:focus-visible': { outline: `2px solid ${colors.orange}`, outlineOffset: 2 },
          }}
        >
          ← Back to the demo doors
        </Box>
      </Box>
    </Box>
  );
}

export default DemoCatalog;
