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
                  borderColor: 'rgba(255,255,255,0.16)',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  height: '100%',
                }}
              >
                <Box sx={{ mb: 1.5, color: '#F5F7FF' }}>{item.icon}</Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#F5F7FF',
                    mb: 1,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.98rem',
                    color: 'rgba(235, 240, 255, 0.82)',
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
                  borderColor: 'rgba(255,255,255,0.16)',
                  bgcolor: 'rgba(255,255,255,0.05)',
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
                    color: '#F5F7FF',
                  }}
                >
                  {step.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.94rem',
                    color: 'rgba(235, 240, 255, 0.82)',
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
                  borderColor: 'rgba(255,255,255,0.16)',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  height: '100%',
                }}
              >
                <Box sx={{ mb: 1.25, color: '#F5F7FF' }}>{item.icon}</Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#F5F7FF',
                    mb: 0.75,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.95rem',
                    color: 'rgba(235, 240, 255, 0.82)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" justifyContent="center" sx={{ mt: 2.25 }}>
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
              fontWeight: 700,
              letterSpacing: '0.02em',
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
        backgroundImage:
          'linear-gradient(rgba(8, 12, 22, 0.62), rgba(8, 12, 22, 0.62)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        py: { xs: 1, md: 1.5 },
      }}
    >
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        <Box
          sx={{
            height: { xs: 'calc(100vh - 16px)', md: 'calc(100vh - 24px)' },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'rgba(255,255,255,0.18)',
            bgcolor: 'rgba(12, 18, 30, 0.82)',
            boxShadow: '0 28px 72px rgba(0,0,0,0.45)',
            px: { xs: 2.5, md: 5 },
            py: { xs: 2, md: 2.75 },
            display: 'grid',
            gridTemplateRows: 'auto auto 1fr',
            gap: { xs: 1.5, md: 2.25 },
            backdropFilter: 'blur(2px)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
                  <Box
                    component="img"
                    src="/CompassLogo.png"
                    alt=""
                    sx={{
                      position: 'absolute',
                      left: -24,
                      top: -32,
                      width: 220,
                      opacity: 0.08,
                      pointerEvents: 'none',
                      display: { xs: 'none', md: 'block' },
                    }}
                  />
                  <img
                    src="/CompassLogo.png"
                    alt="The Compass Logo"
                    style={{ height: '108px', width: 'auto', display: 'block' }}
                  />
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: { xs: '2rem', md: '2.35rem' },
                      fontWeight: 700,
                      color: '#F5F7FF',
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
                    color: '#F5F7FF',
                    lineHeight: 1.2,
                  }}
                >
                  Clarity for leaders. Momentum for teams.
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    color: 'rgba(235, 240, 255, 0.82)',
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
                      borderColor: 'rgba(255,255,255,0.25)',
                      bgcolor: 'rgba(255,255,255,0.08)',
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '0.9rem',
                      color: 'rgba(235, 240, 255, 0.78)',
                      textAlign: 'center',
                    }}
                  >
                    {pill}
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
            {sections.map((section, idx) => (
              <Button
                key={section.key}
                variant={idx === activeSection ? 'contained' : 'text'}
                color="primary"
                onClick={() => setActiveSection(idx)}
                sx={{
                  borderRadius: 999,
                  px: 2.8,
                  py: 0.9,
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: 'none',
                  border: idx === activeSection ? 'none' : '1px solid',
                  borderColor: 'rgba(255,255,255,0.28)',
                  bgcolor: idx === activeSection ? 'primary.main' : 'rgba(255,255,255,0.08)',
                  color: idx === activeSection ? '#FFFFFF' : '#F5F7FF',
                  textTransform: 'none',
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
              borderColor: 'rgba(255,255,255,0.2)',
              bgcolor: 'rgba(6, 10, 18, 0.34)',
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

