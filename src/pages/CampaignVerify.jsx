import React from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Paper,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Dashboard,
  Group,
  Assessment,
  TrendingUp,
  CheckCircle,
  ArrowForward
} from '@mui/icons-material';

function CampaignVerify() {
  const navigate = useNavigate();

  const handleContinue = () => {
    // Navigate to dashboard or next step
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        py: 4,
        // full bleed bg
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0)',
        },
        // dark overlay
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
        },
      }}
    >
      <Container
        maxWidth={false}
            sx={{
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: '100vw',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 880 }}>
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
                sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 800,
                mb: 2,
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Your Growth Campaign is Ready!
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: 'rgba(255,255,255,0.9)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              You've taken the first step toward transformative leadership growth. Here's what happens next in your journey.
            </Typography>
          </Box>

          {/* Main Content Card */}
          <Paper
            sx={{
              p: { xs: 3, sm: 4 },
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.14)',
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.4)',
              bgcolor: 'rgba(255, 255, 255, 0.92)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))',
              width: '100%',
              mb: 4,
            }}
          >
            {/* What Happens Next Section */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #E07A3F, #C85A2A)',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(224,122,63,0.3)',
                  }}
                >
                  <TrendingUp sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  What Happens Next
                </Typography>
              </Stack>

              <Stack spacing={3}>
                {/* Step 1 */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(224,122,63,0.08)',
                    border: '1px solid',
                    borderColor: 'rgba(224,122,63,0.2)',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        minWidth: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                      }}
                    >
                      1
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                        }}
                      >
                        Share Your Campaign with Your Team
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1rem',
                          color: 'text.secondary',
                          lineHeight: 1.6,
                        }}
                      >
                        Your team members will receive a survey link where they can provide honest, anonymous feedback on your leadership behaviors. They'll rate each statement on two dimensions: <strong>Effort</strong> (how much you try) and <strong>Efficacy</strong> (how effective you are).
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Step 2 */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(99,147,170,0.08)',
                    border: '1px solid',
                    borderColor: 'rgba(99,147,170,0.2)',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        minWidth: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                      }}
                    >
                      2
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                        }}
                      >
                        Receive Comprehensive Insights
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1rem',
                          color: 'text.secondary',
                          lineHeight: 1.6,
                        }}
                      >
                        Once your team completes the survey, you'll gain access to your personalized Leadership Dashboard. This powerful tool combines your self-perception with team feedback to reveal blind spots, highlight strengths, and identify the most impactful growth opportunities.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Step 3 */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(224,122,63,0.08)',
                    border: '1px solid',
                    borderColor: 'rgba(224,122,63,0.2)',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        minWidth: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                      }}
                    >
                      3
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                        }}
                      >
                        Take Action on Your Growth Plan
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1rem',
                          color: 'text.secondary',
                          lineHeight: 1.6,
                        }}
                      >
                        Your dashboard will provide specific, actionable insights tailored to your leadership context. Use these insights to create targeted development goals, track your progress, and continuously refine your leadership approach based on real feedback from those who matter most—your team.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Key Features Grid */}
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 3,
                  textAlign: 'center',
                }}
              >
                What You'll Get
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
                      border: '1px solid',
                      borderColor: 'rgba(224,122,63,0.2)',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 20px rgba(224,122,63,0.2)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                      <Dashboard
                        sx={{
                          fontSize: 40,
                          color: 'primary.main',
                          mb: 1.5,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                        }}
                      >
                        Interactive Dashboard
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.9rem',
                          color: 'text.secondary',
                          lineHeight: 1.5,
                        }}
                      >
                        Visual insights that reveal gaps between your self-perception and team feedback
                </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
                      border: '1px solid',
                      borderColor: 'rgba(99,147,170,0.2)',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 20px rgba(99,147,170,0.2)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                      <Group
                        sx={{
                          fontSize: 40,
                          color: 'secondary.main',
                          mb: 1.5,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                        }}
                      >
                        Team Feedback
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.9rem',
                          color: 'text.secondary',
                          lineHeight: 1.5,
                        }}
                      >
                        Honest, anonymous feedback from your direct reports on your leadership behaviors
                </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
                      border: '1px solid',
                      borderColor: 'rgba(224,122,63,0.2)',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 20px rgba(224,122,63,0.2)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                      <Assessment
                        sx={{
                          fontSize: 40,
                          color: 'primary.main',
                          mb: 1.5,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                        }}
                      >
                        Actionable Insights
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.9rem',
                          color: 'text.secondary',
                          lineHeight: 1.5,
                        }}
                      >
                        Specific recommendations tailored to your unique leadership context and challenges
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              </Box>

            {/* Call to Action */}
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(224,122,63,0.1), rgba(99,147,170,0.1))',
                border: '2px solid',
                borderColor: 'primary.main',
                textAlign: 'center',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                <CheckCircle sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  Ready to Begin?
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1rem',
                  color: 'text.secondary',
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                Your leadership growth journey starts now. Share your campaign with your team and unlock insights that will transform how you lead.
                  </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="primary"
                  size="large"
                  onClick={handleContinue}
                  endIcon={<ArrowForward />}
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.1rem',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(224,122,63,0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(224,122,63,0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  View My Dashboard
                  </Button>
              <Button
                  variant="outlined"
                color="primary"
                  size="large"
                onClick={() => navigate('/campaign-builder')}
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.1rem',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Back to Campaign
              </Button>
            </Stack>
          </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default CampaignVerify;
