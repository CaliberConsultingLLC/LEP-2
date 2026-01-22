import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Group,
  Assessment,
  TrendingUp,
  CheckCircle,
  ContentCopy,
  Link as LinkIcon,
  Lock
} from '@mui/icons-material';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function CampaignVerify() {
  const navigate = useNavigate();
  const [campaignLink, setCampaignLink] = useState('');
  const [campaignPassword, setCampaignPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({ link: false, password: false });

  const generatePassword = (length = 10) => {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
  };

  useEffect(() => {
    const generateCampaign = async () => {
      try {
        // Get user info from localStorage (collected earlier)
        const userInfoStr = localStorage.getItem('userInfo');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : { name: '', email: '' };
        const storedCredentialsStr = localStorage.getItem('dashboardCredentials');
        const storedCredentials = storedCredentialsStr ? JSON.parse(storedCredentialsStr) : null;
        const dashboardPassword = storedCredentials?.password || generatePassword(10);

        setUserEmail(userInfo.email || '');
        setUserPassword(dashboardPassword);
        localStorage.setItem('dashboardCredentials', JSON.stringify({
          email: userInfo.email || '',
          password: dashboardPassword,
        }));

        // Get campaign data from localStorage
        const campaignData = JSON.parse(localStorage.getItem('currentCampaign') || '[]');
        
        if (campaignData.length === 0) {
          setError('No campaign data found. Please return to the campaign builder.');
          setIsGenerating(false);
          return;
        }

        // Generate unique ID and password
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const password = Math.random().toString(36).substr(2, 8);

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'campaigns'), {
          userInfo,
          campaign: campaignData,
          password,
          timestamp: new Date(),
        });

        const link = `${window.location.origin}/campaign/${docRef.id}`;
        setCampaignLink(link);
        setCampaignPassword(password);
        setError(null);
      } catch (err) {
        console.error('Error generating campaign:', err);
        setError('Failed to generate campaign link. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateCampaign();
  }, []);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [type]: true });
      setTimeout(() => {
        setCopied({ ...copied, [type]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
              Share your campaign with your team to begin collecting feedback and unlock your personalized leadership insights.
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
            {isGenerating ? (
              <Stack alignItems="center" spacing={3} sx={{ py: 6 }}>
                <Stack direction="row" spacing={2}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: '0s',
                    }}
                  />
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: '0.3s',
                    }}
                  />
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: '0.6s',
                    }}
                  />
                </Stack>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.125rem',
                    color: 'text.primary',
                  }}
                >
                  Generating your campaign link...
                </Typography>
                <style>
                  {`
                    @keyframes pulse {
                      0% { transform: scale(1); opacity: 1; }
                      50% { transform: scale(1.5); opacity: 0.7; }
                      100% { transform: scale(1); opacity: 1; }
                    }
                  `}
                </style>
              </Stack>
            ) : error ? (
              <Alert severity="error" sx={{ fontFamily: 'Gemunu Libre, sans-serif', mb: 3 }}>
                {error}
              </Alert>
            ) : (
              <>
                {/* Campaign Link & Password Section */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(224,122,63,0.1), rgba(99,147,170,0.1))',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    mb: 4,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
                    <CheckCircle sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Typography
                      sx={{
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'text.primary',
                      }}
                    >
                      Share Your Campaign
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1rem',
                      color: 'text.secondary',
                      mb: 3,
                      textAlign: 'center',
                      lineHeight: 1.6,
                    }}
                  >
                    Share the link and password below with your team members. They'll use these to access the survey and provide feedback on your leadership.
                  </Typography>

                  <Stack spacing={3}>
                    {/* Campaign Link */}
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1.5,
                        }}
                      >
                        Campaign Link
                      </Typography>
                      <TextField
                        fullWidth
                        value={campaignLink}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => copyToClipboard(campaignLink, 'link')}
                                edge="end"
                                sx={{ color: 'primary.main' }}
                              >
                                <ContentCopy />
                              </IconButton>
                            </InputAdornment>
                          ),
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkIcon sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'Gemunu Libre, sans-serif',
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '& fieldset': {
                              borderColor: 'primary.main',
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                      {copied.link && (
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.875rem',
                            color: 'primary.main',
                            mt: 1,
                            textAlign: 'center',
                          }}
                        >
                          Link copied to clipboard!
                        </Typography>
                      )}
                    </Box>

                    {/* Campaign Password */}
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1.5,
                        }}
                      >
                        Campaign Password
                      </Typography>
                      <TextField
                        fullWidth
                        value={campaignPassword}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => copyToClipboard(campaignPassword, 'password')}
                                edge="end"
                                sx={{ color: 'primary.main' }}
                              >
                                <ContentCopy />
                              </IconButton>
                            </InputAdornment>
                          ),
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'Gemunu Libre, sans-serif',
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '& fieldset': {
                              borderColor: 'primary.main',
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                      {copied.password && (
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.875rem',
                            color: 'primary.main',
                            mt: 1,
                            textAlign: 'center',
                          }}
                        >
                          Password copied to clipboard!
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>

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
                            Access Your Dashboard
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1rem',
                              color: 'text.secondary',
                              lineHeight: 1.6,
                              mb: 2,
                            }}
                          >
                            Visit your dashboard to see results, resources, your action plan, and journey map. Use the credentials below to sign in.
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.95rem',
                                color: 'text.primary',
                                fontWeight: 600,
                              }}
                            >
                              Email: <Box component="span" sx={{ fontWeight: 700 }}>{userEmail || '—'}</Box>
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.95rem',
                                color: 'text.primary',
                                fontWeight: 600,
                              }}
                            >
                              Password: <Box component="span" sx={{ fontWeight: 700 }}>{userPassword || '—'}</Box>
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/dashboard')}
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1rem',
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                            }}
                          >
                            Go to Dashboard
                          </Button>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Step 2 */}
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
                            Share with Your Team
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1rem',
                              color: 'text.secondary',
                              lineHeight: 1.6,
                            }}
                          >
                            Send the link and password above to your team members. They'll use these credentials to access the survey and provide honest, anonymous feedback on your leadership behaviors.
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Step 3 */}
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
                            Team Completes Survey
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1rem',
                              color: 'text.secondary',
                              lineHeight: 1.6,
                            }}
                          >
                            Your team members will rate each leadership statement on two dimensions: <strong>Effort</strong> (how much you try) and <strong>Efficacy</strong> (how effective you are). This dual-axis feedback provides a comprehensive view of your leadership impact.
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Step 4 */}
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
                          4
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
                            Receive Your Insights
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
                          <Group
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
                          <Assessment
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
                          <TrendingUp
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
                            Growth Tracking
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
                  </Grid>
                </Box>

                {/* Navigation */}
                <Box sx={{ textAlign: 'center' }}>
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
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default CampaignVerify;
