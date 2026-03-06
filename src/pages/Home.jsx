import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  Psychology,
  Insights,
  TrendingUp,
  AutoAwesome,
  Route,
  Inventory2,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { allowDevBypass, showDevTools } from '../config/runtimeFlags';

const sections = [
  { key: 'method', label: 'Methodology' },
  { key: 'process', label: 'How It Works' },
  { key: 'deliverables', label: 'Deliverables' },
];

function Home() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const journeyContentRef = useRef(null);
  const boldVisionaryPreset = {
    industry: 'Media',
    role: 'Innovation Lead',
    responsibilities: 'Champion experimentation and learning loops.',
    birthYear: '1990',
    teamSize: 9,
    leadershipExperience: 5,
    careerExperience: 8,
    resourcePick: 'Expectations',
    projectApproach: 'Gather the team for a collaborative brainstorming session.',
    energyDrains: [
      'Pursuing goals that lack clear direction',
      'Meetings with limited or no outcomes',
      'Decoding unspoken concerns from the team',
    ],
    crisisResponse: [
      'Immediately gather the team to collaborate on potential solutions.',
      'Maintain composure and provide clear, decisive direction to the team.',
      'Delegate ownership to team members while providing support from the sidelines.',
      'First verify all facts and details before taking any action.',
      'Jump in directly to handle the most critical aspects myself.',
    ],
    pushbackFeeling: ['Motivated', 'Competitive', 'Curious'],
    roleModelTrait: 'inspired others',
    warningLabel: 'Flammable: Sparks fly under pressure',
    leaderFuel: [
      'Solving a problem no one else could',
      'Turning chaos into order',
      'Seeing the team gel and succeed together',
      'Hearing the team say they learned something',
      'My team getting the recognition it deserves',
      'Nailing a tough project on time',
    ],
    proudMoment: 'Took a risky idea and rallied stakeholders into a successful pilot.',
    behaviorDichotomies: [7, 5, 8, 6, 8],
    visibilityComfort: 'I thrive in the spotlight.',
    decisionPace: 'The Fix — Get things back on track',
    teamPerception: 'Set clear expectations and create a performance improvement plan.',
    selectedAgent: 'comedyRoaster',
    userReflection: '',
    societalResponses: [8, 7, 8, 6, 7, 6, 8, 7, 8, 6],
    sessionId: 'dev-bold-visionary',
  };

  const handleBeginJourney = () => {
    console.log('Begin Your Journey button clicked, navigating to /landing');
    navigate('/landing');
  };

  const handleResumeJourney = () => {
    console.log('Sign In button clicked, navigating to /sign-in');
    navigate('/sign-in');
  };

  const handleDevSummary = () => {
    localStorage.setItem('latestFormData', JSON.stringify(boldVisionaryPreset));
    navigate('/summary', { state: { formData: boldVisionaryPreset } });
  };

  const panel = useMemo(() => {
    if (sections[activeSection].key === 'method') {
      return [
        {
          icon: <Psychology sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Mirror-Accurate',
          text: 'Objective reflection of your current leadership approach.',
          bullets: [
            'Highlights strengths and growth opportunities with clarity.',
            'Shows how your leadership may be experienced by others.',
            'Creates language for meaningful team conversations.',
          ],
        },
        {
          icon: <AutoAwesome sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Signal Over Noise',
          text: 'Focuses your attention on the highest-impact shifts.',
          bullets: [
            'Prioritizes what matters most right now.',
            'Keeps feedback practical and easy to apply.',
            'Turns insight into clear direction.',
          ],
        },
        {
          icon: <Insights sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Built for Action',
          text: 'You leave with priorities you can apply immediately.',
          bullets: [
            'Connects self-awareness to practical next steps.',
            'Supports trust and alignment through focused development.',
            'Keeps your growth plan personal and sustainable.',
          ],
        },
      ];
    }

    if (sections[activeSection].key === 'process') {
      return [
        {
          icon: <Route sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Leadership Intake',
          text: 'A concise intake to reflect on how you lead and decide.',
          bullets: [
            'Captures meaningful patterns without overwhelming you.',
            'Balances context and day-to-day realities.',
          ],
        },
        {
          icon: <Psychology sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Reflection Results',
          text: 'A grounded view of strengths, tensions, and trajectory.',
          bullets: [
            'Shows where you are now and what comes next.',
            'Delivered in practical, clear language.',
          ],
        },
        {
          icon: <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Trait Selection',
          text: 'Choose the growth traits that best fit your current team reality.',
          bullets: [
            'Prioritizes practical growth over generic advice.',
            'Turns awareness into clear decisions.',
          ],
        },
        {
          icon: <Inventory2 sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Growth Campaign',
          text: 'Build your campaign and track progress in the dashboard.',
          bullets: [
            'Turns reflection into a focused development path.',
            'Keeps momentum visible over time.',
          ],
        },
      ];
    }

    return [
      {
        icon: <Route sx={{ fontSize: 32, color: 'primary.main' }} />,
        title: 'Reflection Summary',
        text: 'A clear portrait of your leadership with practical context.',
        bullets: [
          'Shows what is working and where growth creates the biggest lift.',
          'Helps you move with confidence, not just information.',
        ],
      },
      {
        icon: <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />,
        title: 'Focus Traits',
        text: 'Five personalized growth traits tailored to your needs.',
        bullets: [
          'Keeps your development path specific and high impact.',
          'Makes the next step clear and actionable.',
        ],
      },
      {
        icon: <Inventory2 sx={{ fontSize: 32, color: 'primary.main' }} />,
        title: 'Action Dashboard',
        text: 'Campaign details, milestones, and resources in one place.',
        bullets: [
          'Prevents momentum loss after insights are delivered.',
          'Supports accountability and measurable progress.',
        ],
      },
    ];
  }, [activeSection]);

  const handleHeroSectionSelect = (sectionIdx) => {
    setActiveSection(sectionIdx);
    window.setTimeout(() => {
      journeyContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background:
          'linear-gradient(180deg, #F3F6FB 0%, #EDF3FC 62%, #EAF1FB 100%)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(120deg, rgba(9,16,31,0.92), rgba(16,34,60,0.88)), url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid rgba(15,23,42,0.14)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(800px 360px at 84% 18%, rgba(94,145,176,0.30), transparent 65%), radial-gradient(560px 300px at 6% 46%, rgba(91,132,167,0.28), transparent 72%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          component="img"
          src="/CompassLogo.png"
          alt=""
          sx={{
            position: 'absolute',
            left: { xs: -112, md: -178 },
            top: { xs: 22, md: 8 },
            width: { xs: 240, md: 380 },
            opacity: 0.3,
            filter: 'drop-shadow(0 14px 30px rgba(6,12,24,0.38))',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: { xs: 3, md: 5 } }}>
          <Stack spacing={{ xs: 2.2, md: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1.2 }}>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: { xs: '1.55rem', md: '1.95rem' },
                  fontWeight: 700,
                  letterSpacing: '0.025em',
                  color: '#F7FAFF',
                  textTransform: 'uppercase',
                }}
              >
                The Compass
              </Typography>
              <Button
                variant="outlined"
                onClick={handleResumeJourney}
                sx={{
                  color: '#F7FAFF',
                  borderColor: 'rgba(247,250,255,0.65)',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  '&:hover': {
                    borderColor: '#FFFFFF',
                    bgcolor: 'rgba(255,255,255,0.12)',
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>

            <Grid container spacing={{ xs: 2.2, md: 3 }} alignItems="stretch">
              <Grid item xs={12} md={7}>
                <Stack spacing={1.5}>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      color: '#FFFFFF',
                      fontSize: { xs: '2rem', md: '3rem' },
                      lineHeight: 1.03,
                      fontWeight: 700,
                      maxWidth: 760,
                    }}
                  >
                    Turn leadership insight into decisive, measurable growth.
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(233,242,255,0.96)',
                      fontSize: { xs: '1rem', md: '1.08rem' },
                      lineHeight: 1.62,
                      maxWidth: 690,
                    }}
                  >
                    The Compass translates your leadership patterns into a focused growth campaign.
                    <br />
                    Less noise, stronger direction, and a dashboard that keeps progress visible.
                  </Typography>

                  <Stack direction="row" spacing={1.2} flexWrap="wrap" sx={{ pt: 0.6 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleBeginJourney}
                      sx={{ px: 3.4, py: 1.1, boxShadow: '0 8px 20px rgba(25,50,72,0.30)' }}
                    >
                      Begin Your Journey
                    </Button>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: 0.5 }}>
                    {sections.map((section, idx) => (
                      <Button
                        key={section.key}
                        variant={activeSection === idx ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleHeroSectionSelect(idx)}
                        sx={{
                          px: 1.5,
                          py: 0.48,
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          color:
                            activeSection === idx ? '#FFFFFF' : 'rgba(239,247,255,0.95)',
                          bgcolor:
                            activeSection === idx
                              ? 'rgba(63,100,123,0.96)'
                              : 'rgba(255,255,255,0.05)',
                          borderColor:
                            activeSection === idx
                              ? 'rgba(99,147,170,0.95)'
                              : 'rgba(255,255,255,0.32)',
                          boxShadow:
                            activeSection === idx
                              ? '0 8px 18px rgba(16,33,54,0.34)'
                              : 'none',
                          '&:hover': {
                            bgcolor:
                              activeSection === idx
                                ? 'rgba(52,83,106,0.98)'
                                : 'rgba(255,255,255,0.13)',
                            borderColor: 'rgba(255,255,255,0.62)',
                          },
                        }}
                      >
                        {section.label}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    height: '100%',
                    minHeight: 280,
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.24)',
                    background:
                      'linear-gradient(160deg, rgba(16,33,58,0.86), rgba(8,17,33,0.94))',
                    boxShadow: '0 16px 34px rgba(3,10,22,0.36)',
                    p: { xs: 1.4, md: 1.7 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2.2,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.30)',
                      background: 'linear-gradient(120deg, rgba(8,15,30,0.50), rgba(8,15,30,0.16))',
                      aspectRatio: '16 / 9',
                    }}
                  >
                    <Box
                      component="video"
                      src="/Recording 2026-03-05 202621.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover',
                        filter: 'saturate(1.05) contrast(1.02)',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, rgba(8,14,24,0.08), rgba(8,14,24,0.30))',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          bgcolor: 'rgba(255,255,255,0.20)',
                          border: '1px solid rgba(255,255,255,0.52)',
                          backdropFilter: 'blur(2px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.24)',
                          opacity: 0.55,
                        }}
                      >
                        <Box
                          sx={{
                            width: 0,
                            height: 0,
                            borderTop: '10px solid transparent',
                            borderBottom: '10px solid transparent',
                            borderLeft: '16px solid #FFFFFF',
                            ml: 0.4,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 12,
                        right: 12,
                        bottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          height: 4,
                          borderRadius: 999,
                          bgcolor: 'rgba(255,255,255,0.26)',
                          overflow: 'hidden',
                        }}
                      >
                        <Box sx={{ width: '34%', height: '100%', bgcolor: '#E07A3F' }} />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>

      <Container
        maxWidth="xl"
        ref={journeyContentRef}
        sx={{ py: { xs: 2.2, md: 3.2 }, position: 'relative' }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(720px 260px at 12% 18%, rgba(111,154,131,0.12), transparent 70%), radial-gradient(720px 260px at 90% 82%, rgba(99,147,170,0.12), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Stack spacing={1.4}>
          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontWeight: 700,
              color: '#14314A',
              fontSize: { xs: '1.2rem', md: '1.45rem' },
            }}
          >
            {sections[activeSection].label}
          </Typography>
          <Typography sx={{ color: '#4B6076', fontSize: '0.93rem', maxWidth: 840 }}>
            {activeSection === 1
              ? 'Your journey stays centered around one hero: you. Each step below shows what happens as you move from intake to campaign momentum.'
              : activeSection === 0
                ? 'Core product principles that ensure your reflection feels accurate, practical, and personally relevant.'
                : 'What you walk away with after completing your Compass experience.'}
          </Typography>

          <Grid container spacing={1.4}>
            {panel.map((item) => (
              <Grid item xs={12} md={activeSection === 1 ? 6 : 4} key={item.title}>
                <Box
                  data-hover="lift"
                  sx={{
                    height: '100%',
                    borderRadius: 2.2,
                    border: '1px solid rgba(15,23,42,0.10)',
                    bgcolor: '#FFFFFF',
                    p: { xs: 1.6, md: 1.9 },
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  }}
                >
                  <Box sx={{ mb: 0.9 }}>{item.icon}</Box>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontWeight: 700,
                      fontSize: '1.08rem',
                      color: '#0F1F32',
                      mb: 0.55,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: '#44566C', fontSize: '0.93rem', lineHeight: 1.55 }}>
                    {item.text}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, mt: 0.75, pl: 2 }}>
                    {item.bullets.map((bullet) => (
                      <Typography
                        key={bullet}
                        component="li"
                        sx={{ color: '#526579', fontSize: '0.84rem', lineHeight: 1.5, mb: 0.16 }}
                      >
                        {bullet}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {showDevTools && (
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" justifyContent="flex-end">
              <Button variant="outlined" size="small" onClick={handleDevSummary}>
                Dev Summary
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(allowDevBypass ? '/dashboard?dev=1' : '/dashboard')}
              >
                Dev Dashboard
              </Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/dev-skip-1')}>
                Dev Skip
              </Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/dev-assessments')}>
                Dev Assessments
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default Home;