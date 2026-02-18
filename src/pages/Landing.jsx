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
  { key: 'method', label: 'Methodology' },
  { key: 'process', label: 'How It Works' },
  { key: 'deliverables', label: 'Deliverables' },
];

function Landing() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);

  const panel = useMemo(() => {
    if (sections[activeSection].key === 'method') {
      return (
        <Box sx={{ px: { xs: 0.25, md: 0.5 }, pb: { xs: 0.9, md: 1.2 } }}>
          <Grid container spacing={0} alignItems="stretch" sx={{ m: 0, width: '100%' }}>
            {[
              {
                icon: <Psychology sx={{ fontSize: 36, color: 'primary.main' }} />,
                title: 'Mirror-Accurate',
                text: 'The Compass gives you an objective reflection of your current leadership approach.',
                bullets: [
                  'Highlights both your strengths and your growth opportunities with clarity.',
                  'Helps you understand how your leadership may be experienced by others.',
                  'Creates language you can use in meaningful conversations with your team.',
                ],
              },
              {
                icon: <AutoAwesome sx={{ fontSize: 36, color: 'primary.main' }} />,
                title: 'Signal Over Noise',
                text: 'The Compass focuses your attention on the leadership shifts that matter most right now.',
                bullets: [
                  'Prioritizes high-impact growth areas so you can move with confidence.',
                  'Keeps feedback practical and easy to apply in real team settings.',
                  'Reduces overwhelm by turning insight into clear direction.',
                ],
              },
              {
                icon: <Insights sx={{ fontSize: 36, color: 'primary.main' }} />,
                title: 'Built for Action',
                text: 'You leave with clear priorities that turn reflection into real leadership momentum.',
                bullets: [
                  'Connects self-awareness to practical next steps you can act on quickly.',
                  'Supports stronger alignment and trust through focused development.',
                  'Keeps your growth plan personal, relevant, and sustainable.',
                ],
              },
            ].map((item) => (
              <Grid item xs={12} md={4} key={item.title} sx={{ display: 'flex', p: { xs: 0.9, md: 1 } }}>
                <Box
                  sx={{
                    p: 3.25,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.08)',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    width: '100%',
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
                      mb: 1.2,
                    }}
                  >
                    {item.text}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.3 }}>
                    {item.bullets.map((bullet) => (
                      <Typography
                        key={bullet}
                        component="li"
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.9rem',
                          color: 'text.secondary',
                          lineHeight: 1.55,
                          mb: 0.35,
                        }}
                      >
                        {bullet}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }

    if (sections[activeSection].key === 'process') {
      return (
        <Box sx={{ px: { xs: 0.25, md: 0.5 }, pb: { xs: 0.9, md: 1.2 } }}>
          <Grid container spacing={0} alignItems="stretch" sx={{ m: 0, width: '100%' }}>
            {[
              {
                title: 'Leadership Intake',
                text: 'A concise intake that helps you reflect on how you lead, decide, and respond in key moments.',
                bullets: [
                  'Designed to keep you engaged while revealing meaningful leadership patterns.',
                  'Balances perspective, context, and day-to-day leadership realities.',
                ],
              },
              {
                title: 'Reflection Results',
                text: 'A clear reflection of your current leadership strengths, tensions, and likely trajectory.',
                bullets: [
                  'Gives you a grounded view of where you are today and what comes next.',
                  'Written to feel personal, practical, and professionally useful.',
                ],
              },
              {
                title: 'Trait Selection',
                text: 'You receive five personalized growth traits so you can choose your most relevant focus.',
                bullets: [
                  'Keeps your development choices specific instead of generic.',
                  'Preserves your autonomy while giving clear direction.',
                ],
              },
              {
                title: 'Growth Campaign',
                text: 'Build your campaign and move forward with a dashboard that supports ongoing development.',
                bullets: [
                  'Creates a shared language for growth, accountability, and progress.',
                  'Keeps your journey organized in one place over time.',
                ],
              },
            ].map((step, idx) => (
              <Grid item xs={12} sm={6} md={3} key={step.title} sx={{ display: 'flex', p: { xs: 0.85, md: 0.95 } }}>
                <Box
                  sx={{
                    p: 2.7,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.08)',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    width: '100%',
                    height: '100%',
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
                  <Box component="ul" sx={{ m: 0, mt: 0.3, pl: 2.1 }}>
                    {step.bullets.map((bullet) => (
                      <Typography
                        key={bullet}
                        component="li"
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.86rem',
                          color: 'text.secondary',
                          lineHeight: 1.52,
                          mb: 0.25,
                        }}
                      >
                        {bullet}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }

    return (
      <Stack spacing={3}>
        <Grid container spacing={0} alignItems="stretch" sx={{ m: 0, width: '100%' }}>
          {[
            {
              icon: <Route sx={{ fontSize: 34, color: 'primary.main' }} />,
              title: 'Reflection Summary',
              text: 'A clear, objective portrait of your current leadership with practical context.',
              bullets: [
                'Shows what is working now and where growth will create the biggest lift.',
                'Helps you move forward with confidence, not just information.',
              ],
            },
            {
              icon: <TrendingUp sx={{ fontSize: 34, color: 'primary.main' }} />,
              title: 'Focus Traits',
              text: 'Five prioritized growth traits tailored to your current leadership needs.',
              bullets: [
                'Keeps your development path practical and high impact.',
                'Makes your next growth step clear and actionable.',
              ],
            },
            {
              icon: <Inventory2 sx={{ fontSize: 34, color: 'primary.main' }} />,
              title: 'Action Dashboard',
              text: 'Your campaign details, progress points, and supporting resources in one place.',
              bullets: [
                'Keeps your growth journey visible so momentum does not fade.',
                'Supports continuity, accountability, and measurable progress.',
              ],
            },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.title} sx={{ display: 'flex', p: 1 }}>
              <Box
                sx={{
                  p: 2.95,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.08)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  width: '100%',
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
                    mb: 1,
                  }}
                >
                  {item.text}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.1 }}>
                  {item.bullets.map((bullet) => (
                    <Typography
                      key={bullet}
                      component="li"
                      sx={{
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontSize: '0.88rem',
                        color: 'text.secondary',
                        lineHeight: 1.5,
                        mb: 0.25,
                      }}
                    >
                      {bullet}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" justifyContent="center" sx={{ mt: 2.8, pt: 0.25 }}>
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
        minHeight: '100vh',
        width: '100vw',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.62)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        py: { xs: 1.25, md: 1.6 },
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 2.5 } }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1260,
            mx: 'auto',
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'rgba(255,255,255,0.62)',
            bgcolor: 'rgba(15, 30, 58, 0.54)',
            boxShadow: '0 20px 44px rgba(18, 31, 56, 0.20)',
            px: { xs: 2.5, md: 5 },
            py: { xs: 2.6, md: 3.2 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 2.6 },
            backdropFilter: 'blur(1px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src="/CompassLogo.png"
            alt=""
            sx={{
              position: 'absolute',
              left: '50%',
              top: { xs: -120, md: -218 },
              transform: 'translateX(-50%)',
              width: { xs: 500, md: 820 },
              opacity: 0.18,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Stack spacing={1.35} sx={{ textAlign: 'center', alignItems: 'center', position: 'relative', zIndex: 1, mt: { xs: 0.4, md: 0.8 } }}>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: { xs: '2.75rem', md: '3.2rem' },
                    fontWeight: 500,
                    color: '#FFFFFF',
                    lineHeight: 1.06,
                    textTransform: 'uppercase',
                    letterSpacing: '0.036em',
                  }}
                >
                  THE COMPASS
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: { xs: '1.18rem', md: '1.34rem' },
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  A Growth Guide for Exactly You
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: { xs: '0.95rem', md: '1.02rem' },
                    color: 'rgba(247, 250, 255, 0.95)',
                    lineHeight: 1.62,
                    maxWidth: 920,
                  }}
                >
                  There is no shortage of leadership advice out there. Most of it is good, some of it is great, but none of it was written with you or your team in mind. The Compass was built to cut through the noise and identify meaningful areas of growth for YOU and your team, with a heavy bias on transparency and action. Read more below to see how it works:
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.4} alignItems="center" justifyContent="center" sx={{ width: '100%', position: 'relative', zIndex: 1, mt: 0.4 }}>
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
                  color: idx === activeSection ? '#FFFFFF' : 'rgba(247, 250, 255, 0.95)',
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
              borderColor: 'rgba(255,255,255,0.35)',
              bgcolor: 'rgba(255,255,255,0.1)',
              p: { xs: 2.2, md: 3.2 },
              pb: { xs: 2.6, md: 3.4 },
              overflow: 'visible',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box sx={{ px: { xs: 0.4, md: 0.6 }, pt: { xs: 0.4, md: 0.55 }, pb: { xs: 0.8, md: 1.1 } }}>
              {panel}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Landing;

