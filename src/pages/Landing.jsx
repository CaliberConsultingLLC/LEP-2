import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Button, 
  Stack, 
  Typography, 
  Card, 
  CardContent,
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
  Security
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
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.68)), url(/LEP2.jpg)',
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
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={4.5}>
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box sx={{ mb: 4 }}>
              <img 
                src="/CompassLogo.png" 
                alt="The Compass Logo" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  maxHeight: '200px',
                  width: 'auto'
                }} 
              />
            </Box>
            <Typography 
              sx={{ 
                fontFamily: 'Gemunu Libre, sans-serif', 
                fontSize: { xs: '2rem', md: '2.5rem' }, 
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
                lineHeight: 1.2
              }}
            >
              Compass: Leadership Reflection and Growth
            </Typography>
            <Typography 
              sx={{ 
                fontFamily: 'Gemunu Libre, sans-serif', 
                fontSize: { xs: '1.1rem', md: '1.25rem' }, 
                color: 'text.secondary',
                maxWidth: '820px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              A focused leadership experience that turns self-perception and team perspective into a clear, actionable growth campaign.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              sx={{ mt: 2 }}
            >
              {['10–12 minutes to complete', 'Private by design', 'Built for real teams'].map((item) => (
                <Box
                  key={item}
                  sx={{
                    px: 2,
                    py: 0.75,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(255,255,255,0.85)',
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.95rem',
                    color: 'text.secondary',
                  }}
                >
                  {item}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Information Cards */}
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(230,238,255,0.8))',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  boxShadow: 4,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Psychology sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Gemunu Libre, sans-serif', 
                      fontSize: '1.1rem', 
                      fontWeight: 700,
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    Purpose
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontFamily: 'Gemunu Libre, sans-serif', 
                      fontSize: '0.95rem',
                      color: 'text.secondary',
                      lineHeight: 1.5
                    }}
                  >
                    Build a clear mirror of your leadership today so you can grow with intent, not guesswork.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,235,220,0.8))',
                  border: '1px solid',
                  borderColor: 'secondary.main',
                  boxShadow: 4,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Insights sx={{ fontSize: 48, color: 'secondary.main', mb: 1.5 }} />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Gemunu Libre, sans-serif', 
                      fontSize: '1.1rem', 
                      fontWeight: 700,
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    Process
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontFamily: 'Gemunu Libre, sans-serif', 
                      fontSize: '0.95rem',
                      color: 'text.secondary',
                      lineHeight: 1.5
                    }}
                  >
                    Answer high-signal questions, review a tailored summary, and select focus traits for action.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,255,240,0.8))',
                  border: '1px solid',
                  borderColor: 'success.main',
                  boxShadow: 4,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 1.5 }} />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Gemunu Libre, sans-serif', 
                      fontSize: '1.1rem', 
                      fontWeight: 700,
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    Outcome
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontFamily: 'Gemunu Libre, sans-serif', 
                      fontSize: '0.95rem',
                      color: 'text.secondary',
                      lineHeight: 1.5
                    }}
                  >
                    A focused growth campaign and dashboard you can revisit with clarity and momentum.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* How It Works Section */}
          <Card
            sx={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              boxShadow: 4,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography 
                sx={{ 
                  fontFamily: 'Gemunu Libre, sans-serif', 
                  fontSize: '1.5rem', 
                  fontWeight: 700,
                  mb: 3,
                  color: 'text.primary',
                  textAlign: 'center'
                }}
              >
                Your Compass Journey
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    minWidth: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    1
                  </Box>
                  <Box>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '1.1rem', 
                        fontWeight: 600,
                        mb: 0.5,
                        color: 'text.primary'
                      }}
                    >
                      Establish Your Leadership Snapshot
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '0.95rem',
                        color: 'text.secondary',
                        lineHeight: 1.6
                      }}
                    >
                      Move through a concise, high-signal intake that captures how you lead, decide, and show up.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    minWidth: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: 'secondary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    2
                  </Box>
                  <Box>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '1.1rem', 
                        fontWeight: 600,
                        mb: 0.5,
                        color: 'text.primary'
                      }}
                    >
                      Receive a Precise Reflection
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '0.95rem',
                        color: 'text.secondary',
                        lineHeight: 1.6
                      }}
                    >
                      See patterns and implications that are grounded in your data yet clearly articulated.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    minWidth: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    3
                  </Box>
                  <Box>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '1.1rem', 
                        fontWeight: 600,
                        mb: 0.5,
                        color: 'text.primary'
                      }}
                    >
                      Choose Focus Traits
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '0.95rem',
                        color: 'text.secondary',
                        lineHeight: 1.6
                      }}
                    >
                      Select the traits that will shift your leadership most, then build your growth campaign.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    minWidth: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: 'secondary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    4
                  </Box>
                  <Box>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '1.1rem', 
                        fontWeight: 600,
                        mb: 0.5,
                        color: 'text.primary'
                      }}
                    >
                      Activate the Dashboard
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontSize: '0.95rem',
                        color: 'text.secondary',
                        lineHeight: 1.6
                      }}
                    >
                      Use results, resources, and campaign insights to stay informed, supported, and accountable.
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Outcome Section */}
          <Card
            sx={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92))',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 3,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  mb: 2,
                  color: 'text.primary',
                  textAlign: 'center',
                }}
              >
                The Outcome You Should Expect
              </Typography>
              <Grid container spacing={2}>
                {[
                  'A clear narrative of how your leadership is experienced today.',
                  'A grounded trajectory that shows what changes if nothing shifts.',
                  'Five data-driven traits to anchor your personal growth campaign.',
                  'A dashboard that keeps your results and actions in one place.',
                ].map((item) => (
                  <Grid item xs={12} md={6} key={item}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.85)',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mt: 0.8,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.98rem',
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
            </CardContent>
          </Card>

          {/* Consent Agreement Section */}
          <Card
            sx={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
              border: '2px solid',
              borderColor: consentAgreed ? 'success.main' : 'warning.main',
              boxShadow: 6,
            }}
          >
            <CardContent sx={{ p: 4 }}>
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
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

export default Landing;

