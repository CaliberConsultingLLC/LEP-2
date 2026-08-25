import React, { useState } from 'react';
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { buttons, colors, fonts, radii, surfaces, type } from '../styles/tokens';
import { seedDemoContext, startDemoSession } from '../utils/demoMode';

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

function DemoStart() {
  const navigate = useNavigate();
  const [name, setName] = useState('You');
  const [role, setRole] = useState('Team lead');
  const [industry, setIndustry] = useState('Professional services');
  const [teamSize, setTeamSize] = useState('8');

  const handleStart = () => {
    startDemoSession();
    seedDemoContext({ name, role, industry, teamSize });
    navigate('/guide-select');
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
      <Box sx={{ ...surfaces.card, width: '100%', maxWidth: 520, p: { xs: 3, md: 4 } }}>
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
            mb: 1.5,
          }}
        >
          Run Compass once, then open the rooms.
        </Typography>
        <Typography sx={{ ...type.body, mb: 3 }}>
          This is a throwaway session. Intake, summary, and campaign are real.
          After the campaign, sample team answers land on your statements so
          Signal, Evidence, Practice, and Journey are open. Nothing is written
          to the live account store.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, mb: 3 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
          <TextField
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Industry"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            fullWidth
          >
            {INDUSTRIES.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Team size"
            type="number"
            value={teamSize}
            onChange={(event) => setTeamSize(event.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
          />
        </Box>

        <Box
          component="button"
          type="button"
          onClick={handleStart}
          sx={{
            all: 'unset',
            boxSizing: 'border-box',
            cursor: 'pointer',
            textAlign: 'center',
            ...buttons.primary,
            width: '100%',
            borderRadius: radii.pill,
          }}
        >
          Choose a guide
        </Box>
      </Box>
    </Box>
  );
}

export default DemoStart;
