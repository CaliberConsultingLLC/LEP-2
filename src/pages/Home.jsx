import React, { useMemo, useState } from 'react';
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
          icon: <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Reflection Results',
          text: 'A grounded view of strengths, tensions, and trajectory.',
          bullets: [
            'Shows where you are now and what comes next.',
            'Delivered in practical, clear language.',
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundImage:
          'linear-gradient(rgba(8, 14, 26, 0.56), rgba(8, 14, 26, 0.56)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        py: { xs: 1.2, md: 1.8 },
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 1.5, md: 2.2 } }}>
        <Box
          data-surface="glass"
          sx={{
            width: '100%',
            maxWidth: 1260,
            mx: 'auto',
            px: { xs: 2.2, md: 4.4 },
            py: { xs: 2.2, md: 3 },
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
              right: { xs: -90, md: -120 },
              top: { xs: -120, md: -180 },
              width: { xs: 310, md: 520 },
              opacity: 0.13,
              pointerEvents: 'none',
            }}
          />

          <Stack spacing={2.2} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ gap: 1.2 }}
            >
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: { xs: '1.6rem', md: '2rem' },
                  color: '#FFFFFF',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                The Compass
              </Typography>
              <Button
                variant="outlined"
                onClick={handleResumeJourney}
                sx={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.55)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.88)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>

            <Stack spacing={1.25} sx={{ maxWidth: 960 }}>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  color: '#FFFFFF',
                  fontSize: { xs: '2rem', md: '2.65rem' },
                  lineHeight: 1.1,
                  fontWeight: 700,
                }}
              >
                A growth guide built for your exact leadership reality.
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(243,248,255,0.96)',
                  fontSize: { xs: '0.98rem', md: '1.06rem' },
                  maxWidth: 860,
                  lineHeight: 1.6,
                }}
              >
                Move from broad feedback to focused growth. The Compass helps you see
                where to improve, what to prioritize, and how to sustain momentum.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.2} flexWrap="wrap">
              <Button
                variant="contained"
                color="primary"
                onClick={handleBeginJourney}
                sx={{ px: 3.2, py: 1.05, boxShadow: 'none' }}
              >
                Begin Your Journey
              </Button>
              <Button
                variant="outlined"
                onClick={handleResumeJourney}
                sx={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.55)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.88)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                Resume and Access Dashboard
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              sx={{ pt: 0.2 }}
            >
              {sections.map((section, idx) => (
                <Button
                  key={section.key}
                  variant={idx === activeSection ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => setActiveSection(idx)}
                  sx={{
                    px: 2.2,
                    py: 0.72,
                    color: idx === activeSection ? '#FFFFFF' : 'rgba(255,255,255,0.95)',
                    borderColor:
                      idx === activeSection
                        ? 'primary.main'
                        : 'rgba(255,255,255,0.45)',
                    bgcolor:
                      idx === activeSection ? 'primary.main' : 'rgba(255,255,255,0.06)',
                    '&:hover': {
                      borderColor: idx === activeSection ? 'primary.dark' : '#FFFFFF',
                      bgcolor:
                        idx === activeSection
                          ? 'primary.dark'
                          : 'rgba(255,255,255,0.10)',
                    },
                  }}
                >
                  {section.label}
                </Button>
              ))}
            </Stack>

            <Box
              sx={{
                borderRadius: 2.6,
                border: '1px solid rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.12)',
                p: { xs: 1.2, md: 1.45 },
              }}
            >
              <Grid container spacing={1.2}>
                {panel.map((item) => (
                  <Grid item xs={12} md={4} key={item.title}>
                    <Box
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.26)',
                        bgcolor: 'rgba(255,255,255,0.92)',
                        p: 2,
                      }}
                    >
                      <Box sx={{ mb: 1 }}>{item.icon}</Box>
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontWeight: 700,
                          fontSize: '1.02rem',
                          color: 'text.primary',
                          mb: 0.55,
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.55 }}
                      >
                        {item.text}
                      </Typography>
                      <Box component="ul" sx={{ m: 0, mt: 0.8, pl: 2 }}>
                        {item.bullets.map((bullet) => (
                          <Typography
                            key={bullet}
                            component="li"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.83rem',
                              lineHeight: 1.5,
                              mb: 0.2,
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
          </Stack>

          {showDevTools && (
            <Stack
              direction="row"
              spacing={0.8}
              useFlexGap
              flexWrap="wrap"
              justifyContent="flex-end"
              sx={{ mt: 1.4, position: 'relative', zIndex: 1 }}
            >
              <Button variant="outlined" size="small" onClick={handleDevSummary}>
                Dev Summary
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() =>
                  navigate(allowDevBypass ? '/dashboard?dev=1' : '/dashboard')
                }
              >
                Dev Dashboard
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/dev-skip-1')}
              >
                Dev Skip
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/dev-assessments')}
              >
                Dev Assessments
              </Button>
            </Stack>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Home;