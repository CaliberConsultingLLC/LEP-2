import React from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MOCK_TRAITS = [
  {
    trait: 'Communication',
    subTrait: 'Clarity Under Pressure',
    statements: [
      'Brian communicates priorities clearly when timelines are tight.',
      'Brian explains trade-offs in ways that are easy to understand.',
      'Brian creates alignment quickly when priorities shift.',
      'Brian adapts communication style to different team members.',
      'Brian shares context early so stakeholders are not surprised.',
    ],
  },
  {
    trait: 'Execution',
    subTrait: 'Follow-Through',
    statements: [
      'Brian consistently follows through on commitments.',
      'Brian keeps projects moving when blockers appear.',
      'Brian balances speed and quality during delivery.',
      'Brian maintains momentum across competing priorities.',
      'Brian closes loops and confirms work is complete.',
    ],
  },
  {
    trait: 'Coaching',
    subTrait: 'Growth Minded Support',
    statements: [
      'Brian provides useful coaching in day-to-day work.',
      'Brian gives actionable feedback that improves performance.',
      'Brian supports development without micromanaging.',
      'Brian helps team members identify specific growth next steps.',
      'Brian balances challenge and support in development conversations.',
    ],
  },
];

const buildMockCampaignMeta = (campaignType) => {
  const idSuffix = campaignType === 'self' ? 'self' : 'team';
  return {
    campaignType,
    ownerId: 'mock-dev-owner',
    bundleId: 'mock-dev-bundle',
    campaign: MOCK_TRAITS,
    password: `mock-${idSuffix}-password`,
  };
};

export default function DevSkipAssessments() {
  const navigate = useNavigate();

  const launchMockAssessment = (campaignType) => {
    const mockId = campaignType === 'self' ? 'mock-self-assess' : 'mock-team-assess';
    const meta = buildMockCampaignMeta(campaignType);

    localStorage.setItem(`campaign_${mockId}`, JSON.stringify(meta));
    localStorage.setItem('mockAssessmentMeta', JSON.stringify({ mockId, campaignType, createdAt: new Date().toISOString() }));

    if (campaignType === 'self') {
      localStorage.setItem('selfCampaignCompleted', 'false');
    }

    navigate(`/campaign/${mockId}/survey`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: 'linear-gradient(rgba(8, 14, 26, 0.55), rgba(8, 14, 26, 0.55)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        py: { xs: 4, md: 7 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(244,248,255,0.9))',
            border: '1px solid rgba(69,112,137,0.28)',
          }}
        >
          <Stack spacing={2.2}>
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: { xs: '1.5rem', md: '1.9rem' },
                fontWeight: 800,
                color: 'text.primary',
              }}
            >
              Dev Assessments (Mock)
            </Typography>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', color: 'text.secondary', lineHeight: 1.6 }}>
              Use these shortcuts to jump directly into isolated mock assessment runs. These mocks are separate from your normal campaign creation flow and can be used for rapid UI/content iteration.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ pt: 1 }}>
              <Button
                variant="contained"
                onClick={() => launchMockAssessment('self')}
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#457089',
                  '&:hover': { bgcolor: '#375d78' },
                }}
              >
                Mock Self Assess
              </Button>
              <Button
                variant="contained"
                onClick={() => launchMockAssessment('team')}
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#457089',
                  '&:hover': { bgcolor: '#375d78' },
                }}
              >
                Mock Team Assess
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700 }}
              >
                Back Home
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
