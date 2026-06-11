import React, { useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { buttons, colors, fonts, type } from '../../../styles/tokens';
import { useGuide } from '../../../context/GuideContext';

// ----------------------------------------------------------------------------
// Gate page — shown when Evidence is visited before the Signal walkthrough is
// complete, or Practice before Evidence. Centered ceremony: lock eyebrow,
// serif headline, italic explanation, one primary door back to the
// prerequisite phase.
// ----------------------------------------------------------------------------

const GATE_GUIDE_LINE =
  'Each room opens in order — that\u2019s not bureaucracy, it\u2019s pacing. The sequence is how the signal stays understandable.';

const COPY = {
  evidence: {
    eyebrow: 'Evidence · Not yet open',
    headline: 'The signal comes first.',
    body: 'This room makes sense only after you\u2019ve read what your team reflected back. The debrief takes about five minutes.',
    cta: 'Read the signal',
    goTo: 'signal',
  },
  practice: {
    eyebrow: 'Practice · Not yet open',
    headline: 'Evidence before practice.',
    body: 'Practice built on an unverified signal doesn\u2019t hold. Read the evidence first — then we\u2019ll choose the behavior.',
    cta: 'Review the evidence',
    goTo: 'evidence',
  },
};

export default function GatePage({ phase, onGoTab }) {
  const copy = COPY[phase] || COPY.evidence;
  const { setPageMessage, clearPageMessage } = useGuide();

  useEffect(() => {
    setPageMessage({ text: GATE_GUIDE_LINE, pose: 'point', eyebrow: 'One step at a time' });
    return () => clearPageMessage();
  }, [setPageMessage, clearPageMessage]);

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2.4, md: 4 },
        py: { xs: 4, md: 5 },
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1.6 }}>
          <LockOutlined sx={{ fontSize: 13, color: colors.orangeDeep }} />
          <Typography sx={{ ...type.eyebrow }}>{copy.eyebrow}</Typography>
        </Stack>
        <Typography
          component="h1"
          sx={{
            fontFamily: fonts.serif,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            fontSize: { xs: 28, md: 36 },
            lineHeight: 1.1,
            color: colors.textPrimary,
            mb: 1.6,
          }}
        >
          {copy.headline}
        </Typography>
        <Typography sx={{ ...type.italicBody, fontSize: 16, color: colors.textSecondary, mb: 3 }}>
          {copy.body}
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={() => onGoTab(copy.goTo)}
          sx={{ all: 'unset', cursor: 'pointer', ...buttons.primary }}
        >
          {copy.cta} →
        </Box>
      </Box>
    </Box>
  );
}
