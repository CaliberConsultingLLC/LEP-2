import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Button, 
  Stack, 
  Typography, 
  Checkbox,
  FormControlLabel,
  Divider,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Psychology, 
  Insights, 
  TrendingUp, 
  Security,
  Group
} from '@mui/icons-material';

function Landing() {
  const navigate = useNavigate();
  const [consentAgreed, setConsentAgreed] = useState(false);

  const handleGetStarted = () => {
    if (!consentAgreed) {
      return;
    }
    console.log('Get Started button clicked, navigating to /user-info');
    navigate('/user-info');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: 'linear-gradient(rgba(247, 249, 255, 0.72), rgba(247, 249, 255, 0.72)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={6}>
          {/* Hero Section */}
          <Box
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(232,240,255,0.88) 45%, rgba(255,255,255,0.9) 100%)',
              boxShadow: '0 28px 70px rgba(22, 33, 62, 0.18)',
              border: '1px solid rgba(255,255,255,0.65)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Grid container spacing={5} alignItems="center">
              <Grid item xs={12} md={6}>
                <Stack spacing={2.5} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Box>
                    <img
                      src="/CompassLogo.png"
                      alt="The Compass Logo"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: '150px',
                        width: 'auto'
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: { xs: '2.4rem', md: '3.2rem' },
                      fontWeight: 700,
                      color: 'text.primary',
                      lineHeight: 1.1,
                    }}
                  >
                    Leadership clarity that turns insight into action.
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: { xs: '1.05rem', md: '1.2rem' },
                      color: 'text.secondary',
                      lineHeight: 1.75,
                    }}
                  >
                    Compass is a premium reflection experience for leaders who want a precise snapshot of how they lead today,
                    plus a growth campaign that creates momentum with their team.
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    justifyContent={{ xs: 'center', md: 'flex-start' }}
                  >
                    {['10-12 minutes', 'Private by design', 'Built for real teams'].map((item) => (
                      <Box
                        key={item}
                        sx={{
                          px: 2.5,
                          py: 0.9,
                          borderRadius: 999,
                          border: '1px solid rgba(255,255,255,0.7)',
                          bgcolor: 'rgba(255,255,255,0.8)',
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.95rem',
                          color: 'text.secondary',
                          boxShadow: '0 8px 24px rgba(22, 33, 62, 0.08)',
                        }}
                      >
                        {item}
                      </Box>
                    ))}
                  </Stack>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '0.95rem',
                      color: 'text.secondary',
                    }}
                  >
                    Complete the consent section below to begin.
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 22px 50px rgba(22, 33, 62, 0.14)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'text.primary',
                      mb: 2,
                    }}
                  >
                    The Compass Method
                  </Typography>
                  <Stack spacing={2.5}>
                    {[
                      {
                        title: 'Leadership Snapshot',
                        text: 'A precise intake that captures how you lead, decide, and show up.',
                      },
                      {
                        title: 'Expert Reflection',
                        text: 'A clear narrative that synthesizes patterns without repeating your answers.',
                      },
                      {
                        title: 'Focus Traits',
                        text: 'Five data-driven traits that anchor your personal growth campaign.',
                      },
                      {
                        title: 'Dashboard Continuity',
                        text: 'Your results, resources, and actions in one place you can revisit.',
                      },
                    ].map((step, index) => (
                      <Box key={step.title} sx={{ display: 'flex', gap: 2 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: index % 2 === 0 ? 'primary.main' : 'secondary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontWeight: 700,
                            flexShrink: 0,
                            boxShadow: '0 10px 22px rgba(22, 33, 62, 0.18)',
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1.05rem',
                              fontWeight: 600,
                              color: 'text.primary',
                              mb: 0.5,
                            }}
                          >
                            {step.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.95rem',
                              color: 'text.secondary',
                              lineHeight: 1.6,
                            }}
                          >
                            {step.text}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Purpose / Process / Outcome */}
          <Grid container spacing={4} alignItems="stretch">
            {[
              {
                icon: <Psychology sx={{ fontSize: 46, color: 'primary.main' }} />,
                title: 'Purpose',
                text: 'Reveal how your leadership is actually experienced so growth is intentional, not accidental.',
              },
              {
                icon: <Insights sx={{ fontSize: 46, color: 'secondary.main' }} />,
                title: 'Process',
                text: 'A high-signal intake, followed by a clear reflection and a focused campaign your team can respond to.',
              },
              {
                icon: <TrendingUp sx={{ fontSize: 46, color: 'success.main' }} />,
                title: 'Outcome',
                text: 'A growth map you can share, revisit, and measure inside your personal dashboard.',
              },
            ].map((item) => (
              <Grid item xs={12} md={4} key={item.title}>
                <Box
                  sx={{
                    p: 3.5,
                    height: '100%',
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.86)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 20px 45px rgba(22, 33, 62, 0.12)',
                  }}
                >
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      mb: 1,
                      color: 'text.primary',
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '0.96rem',
                      color: 'text.secondary',
                      lineHeight: 1.7,
                    }}
                  >
                    {item.text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Outcomes */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 26px 60px rgba(22, 33, 62, 0.12)',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={5}>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: { xs: '1.6rem', md: '2rem' },
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 1.5,
                  }}
                >
                  What you walk away with
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    color: 'text.secondary',
                    lineHeight: 1.7,
                  }}
                >
                  A full-context understanding of your leadership today, plus a tangible path forward that you can activate
                  with your team.
                </Typography>
              </Grid>
              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  {[
                    'A clear narrative of how your leadership is experienced today.',
                    'A grounded trajectory that shows what changes if nothing shifts.',
                    'Five data-driven traits to anchor your growth campaign.',
                    'A dashboard that keeps your results and actions in one place.',
                  ].map((item) => (
                    <Grid item xs={12} sm={6} key={item}>
                      <Box
                        sx={{
                          p: 2.25,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(255,255,255,0.85)',
                          border: '1px solid rgba(255,255,255,0.7)',
                          boxShadow: '0 12px 28px rgba(22, 33, 62, 0.08)',
                          height: '100%',
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.95rem',
                            color: 'text.secondary',
                            lineHeight: 1.6,
                          }}
                        >
                          {item}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>

          {/* Who It's For */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 22px 50px rgba(22, 33, 62, 0.12)',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Group sx={{ fontSize: 38, color: 'primary.main' }} />
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1.45rem',
                      fontWeight: 700,
                      color: 'text.primary',
                    }}
                  >
                    Who Compass is for
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.98rem',
                    color: 'text.secondary',
                    lineHeight: 1.7,
                  }}
                >
                  Leaders who want a sharper mirror, clearer language, and a practical way to turn insight into action.
                </Typography>
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  {[
                    'You lead a team and want feedback that feels specific, not generic.',
                    'You are curious about the gap between your intent and how others experience it.',
                    'You want a focused growth campaign you can share with your team.',
                    'You need a dashboard that keeps your progress visible and actionable.',
                  ].map((item) => (
                    <Grid item xs={12} sm={6} key={item}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(255,255,255,0.85)',
                          border: '1px solid rgba(255,255,255,0.7)',
                          boxShadow: '0 12px 28px rgba(22, 33, 62, 0.08)',
                          height: '100%',
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.95rem',
                            color: 'text.secondary',
                            lineHeight: 1.6,
                          }}
                        >
                          {item}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>

          {/* Consent Agreement Section */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background: 'rgba(255,255,255,0.92)',
              border: '2px solid',
              borderColor: consentAgreed ? 'success.main' : 'warning.main',
              boxShadow: '0 24px 60px rgba(22, 33, 62, 0.16)',
            }}
          >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Security sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography 
                  sx={{ 
                    fontFamily: 'Gemunu Libre, sans-serif', 
                    fontSize: '1.5rem', 
                    fontWeight: 700,
                    color: 'text.primary'
                  }}
                >
                  Consent to Participate
                </Typography>
              </Box>

              <Typography 
                sx={{ 
                  fontFamily: 'Gemunu Libre, sans-serif', 
                  fontSize: '1rem',
                  color: 'text.secondary',
                  lineHeight: 1.8,
                  mb: 3
                }}
              >
                This leadership development tool collects information about your background, experiences, and leadership preferences to create a personalized leadership development plan. Your responses will be stored securely and used by North Star Partners, LLC to generate your plan, provide insights or feedback, and improve the quality of this tool. All personally identifying information will be kept strictly confidential and will not be shared with any employer or third party without your consent. Participation is voluntary, and you can exit the tool at any time.
              </Typography>

              <Typography 
                sx={{ 
                  fontFamily: 'Gemunu Libre, sans-serif', 
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 2
                }}
              >
                By selecting "I Agree," you consent to the collection and use of your data by North Star Partners, LLC as described above.
              </Typography>

              <Divider sx={{ my: 3 }} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                    sx={{
                      color: 'primary.main',
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                }
                label={
                  <Typography 
                    sx={{ 
                      fontFamily: 'Gemunu Libre, sans-serif', 
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                  >
                    I Agree to Participate
                  </Typography>
                }
                sx={{ mb: 3 }}
              />

              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGetStarted}
                  disabled={!consentAgreed}
                  sx={{ 
                    fontFamily: 'Gemunu Libre, sans-serif', 
                    fontSize: '1.125rem', 
                    px: 5, 
                    py: 1.5,
                    minWidth: '200px',
                    '&:disabled': {
                      opacity: 0.5
                    }
                  }}
                >
                  I'm Ready to Grow
                </Button>
              </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export default Landing;

