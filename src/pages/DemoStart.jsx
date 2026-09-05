// Two ways into the demo.
//
// "Take the full experience" is the real product: pick a guide, answer the
// intake, read a summary written from your own answers. It takes as long as
// the product takes, which is the point when you are showing someone the work.
//
// "Generate a persona for me" skips to the reflection with a finished intake
// already in place. It is for showing the back half — summary, campaign,
// dashboard rooms — without spending fifteen minutes to get there.

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { buttons, colors, fonts, radii, shadows, surfaces, type } from '../styles/tokens';
import { seedDemoBlankIntake, seedDemoPersona, seedDemoShowcase, startDemoSession } from '../utils/demoMode';
import { FIXTURES } from '../utils/catalogFixtures';


function PathCard({ eyebrow, title, body, cta, onClick, primary = false, busy = false }) {
  return (
    <Box
      sx={{
        ...surfaces.card,
        p: { xs: 2.4, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        height: '100%',
        boxSizing: 'border-box',
        border: primary ? `1px solid ${colors.orange}` : undefined,
      }}
    >
      <Typography sx={{ ...type.eyebrow, color: primary ? colors.orangeDeep : colors.inkSoft }}>
        {eyebrow}
      </Typography>
      <Typography sx={{
        fontFamily: fonts.serif, fontSize: 21, fontWeight: 500, lineHeight: 1.2, color: colors.ink,
      }}>
        {title}
      </Typography>
      <Typography sx={{ ...type.body, flex: 1 }}>{body}</Typography>
      <Box
        component="button"
        type="button"
        onClick={onClick}
        disabled={busy}
        sx={{
          all: 'unset',
          boxSizing: 'border-box',
          cursor: busy ? 'wait' : 'pointer',
          textAlign: 'center',
          width: '100%',
          mt: '4px',
          ...(primary
            ? buttons.primary
            : {
                ...buttons.outlinedPrimary,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }),
          borderRadius: radii.pill,
          opacity: busy ? 0.6 : 1,
          ...(primary ? { boxShadow: shadows.buttonPrimary } : null),
        }}
      >
        {busy ? 'Building your run…' : cta}
      </Box>
    </Box>
  );
}

function DemoStart() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const runFull = () => {
    startDemoSession();
    seedDemoBlankIntake();
    navigate('/guide-select');
  };

  const runShowcase = () => {
    setBusy(true);
    startDemoSession();
    seedDemoShowcase();
    // Straight to the finished reflection — no regen flag, because the whole
    // point is that nothing has to be generated.
    window.location.assign('/summary?stage=trailhead');
  };

  const runPersona = () => {
    setBusy(true);
    startDemoSession();
    seedDemoPersona({});
    // Full page load on purpose: GuideContext resolves the picked voice from
    // storage on mount, and `regen=live` tells Summary to generate rather than
    // replay a cached run.
    window.location.assign('/summary?stage=trailhead&regen=live');
  };

  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: colors.sand50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 880 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{ ...type.eyebrow, mb: 1.2 }}>Internal demo</Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: fonts.serif,
              fontWeight: 500,
              fontSize: { xs: 28, md: 34 },
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: colors.textPrimary,
              mb: 1.2,
            }}
          >
            Run Compass, then open the rooms.
          </Typography>
          <Typography sx={{ ...type.body, maxWidth: '58ch', mx: 'auto' }}>
            A throwaway session. Nothing is written to the live account store, and
            closing the tab ends it. Three ways to run it, and one way to just look
            at it.
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          alignItems: 'stretch',
        }}>
          <PathCard
            primary
            eyebrow="The whole thing"
            title="Take the full experience"
            body="Your context, a guide, and the intake answered by you. The summary is generated from what you actually said — this is the product as a customer meets it."
            cta="Start the intake"
            onClick={runFull}
          />
          <PathCard
            eyebrow="Skip ahead"
            title="Generate a persona for me"
            body="A finished intake from a random leader and a random guide, taken straight to the reflection. The campaign is already closed, so the dashboard rooms open behind it."
            cta="Generate and go to the reflection"
            onClick={runPersona}
            busy={busy}
          />
          <PathCard
            eyebrow="Show someone"
            title="Walk it without the wait"
            body="Start on a finished reflection, pick your traits, build the campaign — then one button skips your assessment and the wait for the team and opens the dashboard. The parts worth showing, none of the waiting."
            cta="Open the reflection"
            onClick={runShowcase}
            busy={busy}
          />
        </Box>

        {/* Set apart from the three above on purpose. Those start a run and
            carry you forward; this one starts nothing. It is a list. */}
        <Box
          sx={{
            ...surfaces.card,
            mt: 2,
            p: { xs: 2.4, md: 3 },
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            borderStyle: 'dashed',
          }}
        >
          <Box sx={{ flex: '1 1 340px', minWidth: 0 }}>
            <Typography sx={{ ...type.eyebrow, color: colors.inkSoft, mb: '6px' }}>
              Don&rsquo;t run it — just look at it
            </Typography>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontSize: 21,
                fontWeight: 500,
                lineHeight: 1.2,
                color: colors.ink,
                mb: '6px',
              }}
            >
              Page catalog
            </Typography>
            <Typography sx={{ ...type.body }}>
              Every page in the product, listed, each one openable in{' '}
              {FIXTURES.length} states — {FIXTURES.map((f) => f.label.toLowerCase()).join(', ')}.
              Every link resets first, so a page looks the same on the tenth visit as
              the first. For checking design changes, not for showing anyone.
            </Typography>
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => navigate('/demo/catalog')}
            sx={{
              all: 'unset',
              boxSizing: 'border-box',
              cursor: 'pointer',
              textAlign: 'center',
              flex: '0 0 auto',
              px: '20px',
              py: '10px',
              borderRadius: radii.pill,
              border: `1px solid ${colors.navy500}`,
              color: colors.navy600,
              fontFamily: fonts.sans,
              fontWeight: 700,
              fontSize: 13,
              transition: '120ms',
              '&:hover': { bgcolor: 'rgba(63, 100, 123, 0.08)' },
              '&:focus-visible': { outline: `2px solid ${colors.navy500}`, outlineOffset: 2 },
            }}
          >
            Open the catalog
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default DemoStart;
