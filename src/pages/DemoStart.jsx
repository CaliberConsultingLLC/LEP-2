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
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { buttons, colors, fonts, radii, shadows, surfaces, type } from '../styles/tokens';
import { seedDemoContext, seedDemoPersona, startDemoSession } from '../utils/demoMode';

const INDUSTRIES = [
  'Professional services',
  'Technology',
  'Healthcare',
  'Education',
  'Nonprofit',
  'Manufacturing',
  'Government',
  'Other',
];

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
  const [name, setName] = useState('You');
  const [role, setRole] = useState('Team lead');
  const [industry, setIndustry] = useState('Professional services');
  const [teamSize, setTeamSize] = useState('8');
  const [busy, setBusy] = useState(false);

  const runFull = () => {
    startDemoSession();
    seedDemoContext({ name, role, industry, teamSize });
    navigate('/guide-select');
  };

  const runPersona = () => {
    setBusy(true);
    startDemoSession();
    seedDemoPersona({ name, teamSize });
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
            closing the tab ends it.
          </Typography>
        </Box>

        <Box sx={{ ...surfaces.card, p: { xs: 2.4, md: 3 }, mb: 2.5 }}>
          <Typography sx={{ ...type.eyebrow, mb: 1.6 }}>Your context</Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.75,
          }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth />
            <TextField
              select
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              fullWidth
            >
              {INDUSTRIES.map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Team size"
              type="number"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              inputProps={{ min: 0 }}
              fullWidth
            />
          </Box>
          <Typography sx={{ ...type.bodyMuted, mt: 1.4, fontSize: 12.5 }}>
            Used by both paths. The generated persona keeps your name and team size
            and brings its own leadership answers.
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          alignItems: 'stretch',
        }}>
          <PathCard
            primary
            eyebrow="The whole thing"
            title="Take the full experience"
            body="Choose a guide, give the full context, and answer the intake yourself. The summary is generated from what you actually said — this is the product as a customer meets it."
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
        </Box>
      </Box>
    </Box>
  );
}

export default DemoStart;
