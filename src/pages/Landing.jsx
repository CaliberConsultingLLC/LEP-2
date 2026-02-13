import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Psychology,
  Insights,
  TrendingUp,
  AutoAwesome,
  Route,
  Inventory2,
} from '@mui/icons-material';

const sections = [
  { key: 'method', label: 'Compass Method' },
  { key: 'process', label: 'How It Works' },
  { key: 'deliverables', label: 'Deliverables' },
];

function Landing() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);

  const panel = useMemo(() => {
    if (sections[activeSection].key === 'method') {
      return (
        <Grid container spacing={3}>
          {[
            {
              icon: <Psychology sx={{ fontSize: 36, color: 'primary.main' }} />,
              title: 'Mirror-Accurate',
              text: 'Compass synthesizes your responses into a nuanced reflection instead of repeating your inputs.',
            },
            {
              icon: <AutoAwesome sx={{ fontSize: 36, color: 'primary.main' }} />,
              title: 'Signal Over Noise',
              text: 'Each section is designed to capture high-value leadership patterns quickly and clearly.',
            },
            {
              icon: <Insights sx={{ fontSize: 36, color: 'primary.main' }} />,
              title: 'Built for Action',
              text: 'You leave with concrete focus traits that convert reflection into a practical growth campaign.',
            },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.title}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#FFFFFF',
                  height: '100%',
                }}
              >
                <Box sx={{ mb: 1.5 }}>{item.icon}</Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 1,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.98rem',
                    color: 'text.secondary',
                    lineHeight: 1.65,
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (sections[activeSection].key === 'process') {
      return (
        <Grid container spacing={2.5}>
          {[
            {
              title: 'Leadership Intake',
              text: 'A concise set of prompts to capture how you lead, decide, and respond under pressure.',
            },
            {
              title: 'Reflection Results',
              text: 'A precise narrative of your current leadership strengths, tensions, and likely trajectory.',
            },
            {
              title: 'Trait Selection',
              text: 'Five data-driven traits are surfaced so you can choose your most relevant growth focus.',
            },
            {
              title: 'Growth Campaign',
              text: 'Build your campaign and move forward with a dashboard that supports ongoing development.',
            },
          ].map((step, idx) => (
            <Grid item xs={12} sm={6} md={3} key={step.title}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#FFFFFF',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {idx + 1}
                </Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  {step.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.94rem',
                    color: 'text.secondary',
                    lineHeight: 1.6,
                  }}
                >
                  {step.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Stack spacing={3}>
        <Grid container spacing={2.5}>
          {[
            {
              icon: <Route sx={{ fontSize: 34, color: 'primary.main' }} />,
              title: 'Reflection Summary',
              text: 'A clear portrait of your current leadership with grounded context and directional clarity.',
            },
            {
              icon: <TrendingUp sx={{ fontSize: 34, color: 'primary.main' }} />,
              title: 'Focus Traits',
              text: 'Five prioritized growth traits selected from your intake patterns.',
            },
            {
              icon: <Inventory2 sx={{ fontSize: 34, color: 'primary.main' }} />,
              title: 'Action Dashboard',
              text: 'Your campaign details, progress points, and supporting resources in one place.',
            },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.title}>
              <Box
                sx={{
                  p: 2.75,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#FFFFFF',
                  height: '100%',
                }}
              >
                <Box sx={{ mb: 1.25 }}>{item.icon}</Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 0.75,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.95rem',
                    color: 'text.secondary',
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/user-info')}
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1.05rem',
              px: 5,
              py: 1.35,
              borderRadius: 999,
              boxShadow: 'none',
            }}
          >
            I&apos;m Ready to Grow
          </Button>
        </Stack>
      </Stack>
    );
  }, [activeSection, navigate]);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: '#F5F7FB',
        py: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        <Box
          sx={{
            height: '100%',
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#FBFCFE',
            boxShadow: '0 18px 46px rgba(19, 29, 56, 0.08)',
            px: { xs: 2.5, md: 5 },
            py: { xs: 2.5, md: 4 },
            display: 'grid',
            gridTemplateRows: 'auto auto 1fr',
            gap: { xs: 2, md: 3 },
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img
                    src="/CompassLogo.png"
                    alt="The Compass Logo"
                    style={{ height: '82px', width: 'auto', display: 'block' }}
                  />
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: { xs: '2rem', md: '2.35rem' },
                      fontWeight: 700,
                      color: 'text.primary',
                      lineHeight: 1.05,
                    }}
                  >
                    Compass
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: { xs: '1.35rem', md: '1.65rem' },
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  Clarity for leaders. Momentum for teams.
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    maxWidth: 760,
                  }}
                >
                  A guided introduction to how Compass helps you understand your leadership patterns and move from reflection to focused action.
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              >
                {['No survey fatigue', 'Data-grounded insights', 'Designed for real teams'].map((pill) => (
                  <Box
                    key={pill}
                    sx={{
                      px: 1.8,
                      py: 0.7,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#FFFFFF',
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '0.9rem',
                      color: 'text.secondary',
                      textAlign: 'center',
                    }}
                  >
                    {pill}
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.25} alignItems="center">
            {sections.map((section, idx) => (
              <Button
                key={section.key}
                variant={idx === activeSection ? 'contained' : 'text'}
                color="primary"
                onClick={() => setActiveSection(idx)}
                sx={{
                  borderRadius: 999,
                  px: 2.2,
                  py: 0.75,
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '0.98rem',
                  boxShadow: 'none',
                  border: idx === activeSection ? 'none' : '1px solid',
                  borderColor: 'divider',
                  bgcolor: idx === activeSection ? 'primary.main' : '#FFFFFF',
                }}
              >
                {section.label}
              </Button>
            ))}
          </Stack>

          <Box
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#FDFEFF',
              p: { xs: 2, md: 3 },
              overflow: 'hidden',
            }}
          >
            {panel}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Landing;

