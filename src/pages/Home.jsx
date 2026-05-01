import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';
import { allowDevBypass, showDevTools, useCairnTheme } from '../config/runtimeFlags';

const sections = [
  { key: 'process', label: 'How It Works' },
  { key: 'method', label: 'Methodology' },
  { key: 'deliverables', label: 'Deliverables' },
];

function Home() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0); // 0=How It Works, 1=Methodology, 2=Deliverables
  const [transitionDir, setTransitionDir] = useState('left');
  const [flippedCards, setFlippedCards] = useState({});
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
    navigate('/user-info');
  };

  const handleResumeJourney = () => {
    navigate('/sign-in');
  };

  const handleDevSummary = () => {
    localStorage.setItem('latestFormData', JSON.stringify(boldVisionaryPreset));
    navigate('/summary', { state: { formData: boldVisionaryPreset } });
  };

  const processCards = [
    {
      title: 'Capture',
      hero: '/herothink.png',
      frameY: 94,
      frameScale: 1.25,
      text: 'Complete a focused intake that establishes your current leadership state with speed and precision.',
      points: [
        'Role-calibrated scenarios surface how you lead under pressure and in routine moments.',
        'Outputs are converted into measurable signals you can revisit as growth unfolds.',
      ],
    },
    {
      title: 'Reflect',
      hero: '/heroreflect.png',
      frameY: 42,
      frameScale: 1.2,
      text: 'Review a plain-language summary that turns raw responses into meaningful leadership perspective.',
      points: [
        'See trade-offs by effort, efficacy, and near-term impact.',
        'Prioritize the few shifts that will move outcomes the most.',
      ],
    },
    {
      title: 'Calibrate',
      hero: '/herocalibrate.png',
      frameY: 75,
      frameX: 50,
      text: 'Calibrate self-perception against team input to expose alignment, blind spots, and leverage points.',
      points: [
        'Side-by-side views clarify perception versus reality in concrete terms.',
        'Gaps become practical behavior targets, not abstract ideas.',
      ],
    },
    {
      title: 'Embark',
      hero: '/heroembark.png',
      frameY: 94,
      frameScale: 1.25,
      text: 'Launch a year-long growth campaign that converts insight into accountable, measurable progress.',
      points: [
        'Set milestones and shared focus around the traits that matter most.',
        'Maintain momentum with structured check-ins and course correction.',
      ],
    },
  ];

  const handleHeroSectionSelect = (sectionIdx) => {
    if (activeSection === sectionIdx) return;
    setTransitionDir(sectionIdx > activeSection ? 'left' : 'right');
    setActiveSection(sectionIdx);
    setFlippedCards({});
  };

  const methodologyCards = [
    {
      title: 'One-to-One',
      hero: '/onetoone.png',
      frameY: 57,
      frameX: 50,
      text: 'Every leader gets a personalized experience shaped by real context. We go narrow and deep where most tools stay broad and shallow.',
      points: [],
    },
    {
      title: 'Ownership',
      hero: '/heroreflect.png',
      frameY: 42,
      frameScale: 1.2,
      text: 'Compass is AI-powered but human-led. No HR infrastructure required; leaders own the work and the outcomes.',
      points: [],
    },
    {
      title: 'Directional Guidance',
      hero: '/compassicon.png',
      frameY: 58,
      frameX: 50,
      text: "We aren't here to label you. We aim to provide you with clarity and context, so that you can act with freedom and confidence.",
      points: [],
    },
    {
      title: 'Bias Towards Action',
      hero: '/heroembark.png',
      frameY: 58,
      text: 'Awareness without action is noise. We will not hold your hand, but we will hold your feet to the fire on execution.',
      points: [],
    },
  ];

  const deliverablesCards = [
    {
      title: 'Snapshot',
      hero: '/heroreflect.png',
      frameY: 42,
      frameScale: 1.2,
      text: 'Your summary page is a clear current-state snapshot: where you stand, where opportunities sit, and what outcomes are possible.',
      points: [],
    },
    {
      title: 'Growth Campaign',
      hero: '/herocalibrate.png',
      frameY: 58,
      text: 'Select three of the five traits we provide, then build a campaign your team can run all year with a defined leadership focus.',
      points: [],
    },
    {
      title: 'Insights',
      hero: '/heroembark.png',
      frameY: 58,
      text: 'Your agent turns data into specific opportunities, including effort-versus-efficacy views and perception-versus-reality splits.',
      points: [],
    },
    {
      title: 'Journey',
      hero: '/herothink.png',
      frameY: 57,
      text: 'We do not tell you what to do; we give you the data to decide with confidence, measure impact, and keep adjusting your course heading.',
      points: [],
    },
  ];

  const currentCards =
    activeSection === 0 ? processCards
    : activeSection === 1 ? methodologyCards
    : deliverablesCards;

  if (useCairnTheme) {
    const journeySteps = [
      {
        num: '01',
        title: 'Uncover',
        icon: <SearchRoundedIcon sx={{ fontSize: 26 }} />,
        body: 'Surface the hidden truths about how your leadership shows up under real pressure.',
      },
      {
        num: '02',
        title: 'Embrace',
        icon: <SelfImprovementRoundedIcon sx={{ fontSize: 26 }} />,
        body: 'Name the gaps without shame and choose the traits most worth building right now.',
      },
      {
        num: '03',
        title: 'Understand',
        icon: <Diversity3RoundedIcon sx={{ fontSize: 26 }} />,
        body: 'Hear how your team actually experiences your leadership, not how you assume they do.',
      },
      {
        num: '04',
        title: 'Embark',
        icon: <ExploreRoundedIcon sx={{ fontSize: 26 }} />,
        body: 'Turn insight into a year-long rhythm of action, feedback, and steady development.',
      },
    ];

    const principles = [
      { eyebrow: 'AI-powered. Human-led.', body: 'A live agent translates your responses into perspective, but you remain the leader of every decision.' },
      { eyebrow: 'No HR scaffolding.', body: 'Designed for individual leaders. No vendor onboarding, no rollout cycles, no org politics required.' },
      { eyebrow: 'A year, not a workshop.', body: 'Compass replaces one-off training with a year-long campaign your team can actually feel.' },
    ];

    const scrollToJourney = () => {
      const el = document.getElementById('journey');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const navLinks = [
      { label: 'How It Works', target: 'journey' },
      { label: 'Why Compass', target: 'principles' },
    ];

    const navySerif = '"Fraunces", Georgia, "Times New Roman", serif';
    const sansBody = '"Manrope", "Inter", system-ui, sans-serif';
    const monoEyebrow = '"JetBrains Mono", ui-monospace, monospace';

    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FBF7F0',
          color: '#10223C',
          overflowX: 'hidden',
          fontFamily: sansBody,
        }}
      >
        {/* HEADER */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            bgcolor: 'rgba(251,247,240,0.86)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(15,28,46,0.06)',
            px: { xs: 2.5, md: 5 },
            py: { xs: 1.4, md: 1.6 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              component="img"
              src="/CompassLogo.png"
              alt=""
              aria-hidden
              sx={{ width: 30, height: 30, objectFit: 'contain' }}
            />
            <Typography
              sx={{
                fontFamily: '"Cinzel", Georgia, serif',
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.12rem' },
                letterSpacing: '0.04em',
                fontVariant: 'small-caps',
              }}
            >
              The Compass
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((link) => (
              <Box
                key={link.target}
                component="button"
                type="button"
                onClick={() => {
                  const el = document.getElementById(link.target);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  px: 1.4,
                  py: 0.7,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: '#10223C',
                  '&:hover': { color: '#C0612A' },
                }}
              >
                {link.label}
              </Box>
            ))}
            <Box
              component="button"
              type="button"
              onClick={handleResumeJourney}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                px: 1.6,
                py: 0.7,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.84rem',
                color: '#10223C',
                ml: 0.5,
                '&:hover': { color: '#C0612A' },
              }}
            >
              Sign In
            </Box>
            <Box
              component="button"
              type="button"
              onClick={handleBeginJourney}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                ml: 1,
                px: 2.2,
                py: 0.95,
                borderRadius: 999,
                bgcolor: '#E07A3F',
                color: '#FFF8F0',
                fontWeight: 800,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                boxShadow: '0 8px 22px rgba(224,122,63,0.28)',
                transition: '160ms ease',
                '&:hover': { bgcolor: '#C0612A', transform: 'translateY(-1px)' },
              }}
            >
              Begin Your Journey
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
          </Stack>
        </Box>

        {/* HERO */}
        <Box
          sx={{
            position: 'relative',
            pt: { xs: 6, md: 11 },
            pb: { xs: 7, md: 12 },
            background:
              'radial-gradient(900px 480px at 88% 0%, rgba(244,206,161,0.45), transparent 65%), radial-gradient(700px 480px at -10% 100%, rgba(224,122,63,0.10), transparent 60%)',
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center">
              <Grid item xs={12} md={7}>
                <Stack spacing={3} alignItems="flex-start">
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.4,
                      py: 0.55,
                      borderRadius: 999,
                      bgcolor: 'rgba(224,122,63,0.10)',
                      border: '1px solid rgba(224,122,63,0.22)',
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#E07A3F' }} />
                    <Typography
                      sx={{
                        fontFamily: monoEyebrow,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#C0612A',
                      }}
                    >
                      AI-powered. Human-led.
                    </Typography>
                  </Box>

                  <Typography
                    component="h1"
                    sx={{
                      fontFamily: navySerif,
                      fontWeight: 600,
                      fontSize: { xs: '2.85rem', sm: '3.6rem', md: '4.6rem' },
                      lineHeight: 1.0,
                      letterSpacing: '-0.035em',
                      color: '#10223C',
                    }}
                  >
                    Know where you stand.
                    <Box component="span" sx={{ display: 'block', color: '#C0612A', fontStyle: 'italic', fontWeight: 500 }}>
                      Choose where to go.
                    </Box>
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '1.05rem', md: '1.18rem' },
                      lineHeight: 1.6,
                      color: '#44566C',
                      maxWidth: 560,
                    }}
                  >
                    Compass turns a single leadership assessment into a year-long campaign of clarity, feedback, and action — guided by an agent, owned by you.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ pt: 1 }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={handleBeginJourney}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        px: 3.2,
                        py: 1.35,
                        borderRadius: 999,
                        bgcolor: '#E07A3F',
                        color: '#FFF8F0',
                        fontWeight: 800,
                        fontSize: '0.98rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.8,
                        boxShadow: '0 14px 32px rgba(224,122,63,0.30)',
                        transition: '180ms ease',
                        '&:hover': { bgcolor: '#C0612A', transform: 'translateY(-1px)' },
                      }}
                    >
                      Begin Your Journey
                      <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box
                      component="button"
                      type="button"
                      onClick={scrollToJourney}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        px: 3,
                        py: 1.3,
                        borderRadius: 999,
                        border: '1.5px solid rgba(15,28,46,0.18)',
                        color: '#10223C',
                        fontWeight: 800,
                        fontSize: '0.98rem',
                        transition: '180ms ease',
                        '&:hover': { borderColor: '#10223C', bgcolor: 'rgba(15,28,46,0.04)' },
                      }}
                    >
                      How It Works
                    </Box>
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxWidth: 460,
                    mx: 'auto',
                  }}
                >
                  {/* Soft halo */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: '-10%',
                      borderRadius: '50%',
                      background:
                        'radial-gradient(circle at 50% 50%, rgba(244,206,161,0.55), rgba(244,206,161,0) 60%)',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Medallion */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background:
                        'radial-gradient(circle at 38% 32%, #213B5C 0%, #10223C 55%, #0A1830 100%)',
                      border: '1px solid rgba(244,206,161,0.35)',
                      boxShadow:
                        '0 30px 70px rgba(15,28,46,0.25), inset 0 0 60px rgba(244,206,161,0.10)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      component="img"
                      src="/CompassLogo.png"
                      alt=""
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        inset: '14%',
                        width: '72%',
                        height: '72%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.45))',
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* JOURNEY */}
        <Box
          id="journey"
          sx={{
            position: 'relative',
            bgcolor: '#FFFFFF',
            borderTop: '1px solid rgba(15,28,46,0.06)',
            borderBottom: '1px solid rgba(15,28,46,0.06)',
            py: { xs: 7, md: 10 },
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={1.4} alignItems="center" sx={{ textAlign: 'center', mb: { xs: 5, md: 6.5 } }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#C0612A',
                }}
              >
                The Journey
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 600,
                  fontSize: { xs: '2rem', md: '2.85rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.025em',
                  color: '#10223C',
                  maxWidth: 760,
                }}
              >
                Four steps. One year. Real movement.
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '0.98rem', md: '1.05rem' },
                  color: '#44566C',
                  maxWidth: 620,
                  lineHeight: 1.6,
                }}
              >
                Compass replaces one-day workshops and static assessments with a guided, agent-supported rhythm built for leaders who want to move forward, not just learn about themselves.
              </Typography>
            </Stack>

            {/* Step rail with connector */}
            <Box sx={{ position: 'relative' }}>
              {/* Connector line behind the numbers */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 32,
                  left: '8%',
                  right: '8%',
                  height: 2,
                  borderTop: '2px dashed rgba(224,122,63,0.35)',
                  display: { xs: 'none', md: 'block' },
                  zIndex: 0,
                }}
              />
              <Grid container spacing={{ xs: 3, md: 3 }} sx={{ position: 'relative', zIndex: 1 }}>
                {journeySteps.map((step, idx) => (
                  <Grid key={step.num} item xs={12} sm={6} md={3}>
                    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', px: { md: 1 } }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: idx === 0 ? '#E07A3F' : '#FFFFFF',
                          color: idx === 0 ? '#FFF8F0' : '#10223C',
                          border: idx === 0 ? '1px solid #E07A3F' : '1.5px solid rgba(15,28,46,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: idx === 0
                            ? '0 12px 28px rgba(224,122,63,0.30)'
                            : '0 6px 18px rgba(15,28,46,0.08)',
                        }}
                      >
                        {step.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: monoEyebrow,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          letterSpacing: '0.22em',
                          color: '#C0612A',
                        }}
                      >
                        Step {step.num}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: navySerif,
                          fontWeight: 600,
                          fontSize: '1.5rem',
                          letterSpacing: '-0.02em',
                          color: '#10223C',
                          lineHeight: 1.1,
                        }}
                      >
                        {step.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          lineHeight: 1.55,
                          color: '#44566C',
                          maxWidth: 240,
                        }}
                      >
                        {step.body}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Container>
        </Box>

        {/* PRINCIPLES */}
        <Box id="principles" sx={{ py: { xs: 6, md: 9 } }}>
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 3, md: 5 }}>
              {principles.map((p) => (
                <Grid key={p.eyebrow} item xs={12} md={4}>
                  <Stack
                    spacing={1.4}
                    sx={{
                      borderLeft: '2px solid #E07A3F',
                      pl: 2.2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: navySerif,
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        color: '#10223C',
                        letterSpacing: '-0.015em',
                      }}
                    >
                      {p.eyebrow}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.98rem',
                        lineHeight: 1.6,
                        color: '#44566C',
                      }}
                    >
                      {p.body}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* CLOSING CTA */}
        <Box
          sx={{
            position: 'relative',
            py: { xs: 7, md: 9 },
            bgcolor: '#10223C',
            color: '#FFF8F0',
            background:
              'radial-gradient(800px 360px at 50% 0%, rgba(224,122,63,0.18), transparent 60%), linear-gradient(180deg, #10223C 0%, #0A1830 100%)',
          }}
        >
          <Container maxWidth="md">
            <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#F4CEA1',
                }}
              >
                Ready to begin?
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 500,
                  fontSize: { xs: '2.1rem', md: '3rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.025em',
                  color: '#FFF8F0',
                  maxWidth: 720,
                }}
              >
                Find your direction.
                <Box component="span" sx={{ display: 'block', color: '#F4CEA1', fontStyle: 'italic' }}>
                  Then move with intent.
                </Box>
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '0.98rem', md: '1.05rem' },
                  lineHeight: 1.6,
                  color: 'rgba(255,248,240,0.78)',
                  maxWidth: 540,
                }}
              >
                Begin a single, focused assessment. Walk out with a year-long growth campaign your team can actually feel.
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={handleBeginJourney}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  mt: 0.8,
                  px: 3.6,
                  py: 1.45,
                  borderRadius: 999,
                  bgcolor: '#E07A3F',
                  color: '#FFF8F0',
                  fontWeight: 800,
                  fontSize: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  boxShadow: '0 16px 38px rgba(224,122,63,0.40)',
                  transition: '180ms ease',
                  '&:hover': { bgcolor: '#C0612A', transform: 'translateY(-1px)' },
                }}
              >
                Begin Your Journey
                <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Container>
        </Box>

        {showDevTools && (
          <Box sx={{ px: { xs: 2, md: 4 }, py: 2, borderTop: '1px solid rgba(15,28,46,0.06)' }}>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" justifyContent="flex-end">
              <Button variant="outlined" size="small" onClick={handleDevSummary}>Dev Summary</Button>
              <Button variant="outlined" size="small" onClick={() => navigate(allowDevBypass ? '/dashboard?dev=1' : '/dashboard')}>Dev Dashboard</Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/dev-skip-1')}>Dev Skip</Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/dev-assessments')}>Dev Assessments</Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/dev-repository')}>Dev Repository</Button>
            </Stack>
          </Box>
        )}

        {/* FOOTER */}
        <Box
          component="footer"
          sx={{
            mt: 'auto',
            px: { xs: 2.5, md: 5 },
            py: 2.4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            borderTop: '1px solid rgba(15,28,46,0.06)',
            bgcolor: '#FBF7F0',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box component="img" src="/CompassLogo.png" alt="" aria-hidden sx={{ width: 18, height: 18, opacity: 0.7 }} />
            <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#44566C' }}>
              © {new Date().getFullYear()} North Star Partners
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#44566C' }}>
            Privacy &nbsp;·&nbsp; Terms &nbsp;·&nbsp; Contact
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
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
        {/* Logo as large background treatment in right hero area */}
        <Box
          component="img"
          src="/CompassLogo.png"
          alt=""
          aria-hidden
          sx={{
            position: 'absolute',
            right: { xs: '8%', md: '12%', lg: '14%' },
            top: '50%',
            transform: 'translateY(-50%)',
            width: { xs: 384, md: 576, lg: 672 },
            maxWidth: '66vw',
            height: 'auto',
            opacity: 0.58,
            filter: 'drop-shadow(0 14px 36px rgba(3,10,22,0.35))',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: { xs: 1.76, md: 2.64 } }}>
          <Stack spacing={{ xs: 2, md: 2.4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1.2 }}>
              <Typography
                sx={{
                  fontSize: { xs: '1.35rem', md: '1.65rem' },
                  fontWeight: 800,
                  letterSpacing: '0.06em',
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

            <Grid container spacing={{ xs: 2.4, md: 3.3 }} alignItems="stretch">
              <Grid item xs={12} md={7}>
                <Stack spacing={1.65}>
                  <Typography
                    sx={{
                      color: '#FFFFFF',
                      fontSize: { xs: '2rem', md: '2.85rem' },
                      lineHeight: 1.06,
                      fontWeight: 800,
                      letterSpacing: '-0.015em',
                      maxWidth: 760,
                    }}
                  >
                    <Box component="span" sx={{ display: 'block' }}>
                      <Box component="span" sx={{ color: 'secondary.light', mr: 0.8, fontWeight: 900 }}>
                        Know
                      </Box>
                      where you stand.
                    </Box>
                    <Box component="span" sx={{ display: 'block', mt: 0.35 }}>
                      <Box component="span" sx={{ color: 'secondary.light', mr: 0.8, fontWeight: 900 }}>
                        Choose
                      </Box>
                      where to go.
                    </Box>
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(233,242,255,0.96)',
                      fontSize: { xs: '0.98rem', md: '1.04rem' },
                      lineHeight: 1.65,
                      fontStyle: 'italic',
                      maxWidth: 690,
                    }}
                  >
                    We translate your assessment into a clear map of strengths, tradeoffs, and priorities. It is AI-powered, but human-led, so your outcomes stay grounded in real leadership context.
                  </Typography>

                  <Stack direction="row" spacing={1.2} flexWrap="wrap" sx={{ pt: 0.6 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleBeginJourney}
                      sx={{
                        px: 3.4,
                        py: 1.1,
                        boxShadow: '0 8px 20px rgba(25,50,72,0.30)',
                        fontSize: '0.95rem',
                      }}
                    >
                      Begin Your Journey
                    </Button>
                  </Stack>

                  <Box
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.4)',
                      py: 1.8,
                    }}
                  />
                  <Typography
                    sx={{
                      color: 'rgba(233,242,255,0.92)',
                      fontSize: { xs: '0.86rem', md: '0.92rem' },
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      pt: 0.65,
                    }}
                  >
                    Learn more about The Compass below:
                  </Typography>

                  <Stack direction="row" spacing={1.25} flexWrap="wrap" sx={{ pt: 0.6, pb: 0.6 }}>
                    {sections.map((section, idx) => (
                      <Button
                        key={section.key}
                        variant={activeSection === idx ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleHeroSectionSelect(idx)}
                        sx={{
                          px: 2.25,
                          py: 0.9,
                          borderRadius: 10,
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          color:
                            activeSection === idx ? '#2A1A10' : '#FFF7EF',
                          bgcolor:
                            activeSection === idx
                              ? 'secondary.light'
                              : 'rgba(224,122,63,0.32)',
                          borderColor:
                            activeSection === idx
                              ? 'secondary.light'
                              : 'rgba(244,206,161,0.65)',
                          boxShadow:
                            activeSection === idx
                              ? '0 10px 22px rgba(12,25,44,0.36)'
                              : 'none',
                          '&:hover': {
                            bgcolor:
                              activeSection === idx
                                ? 'secondary.main'
                                : 'rgba(224,122,63,0.44)',
                            borderColor: 'rgba(244,206,161,0.75)',
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
                    minHeight: { xs: 110, md: 154 },
                    position: 'relative',
                  }}
                />
              </Grid>
            </Grid>
          </Stack>
        </Container>
        <Stack
          direction="row"
          spacing={0}
          sx={{
            position: 'absolute',
            right: { xs: '-2%', md: '2%', lg: '3%' },
            bottom: { xs: -72, md: -160 },
            zIndex: 2,
            pointerEvents: 'none',
            alignItems: 'flex-end',
          }}
        >
          <Box
            component="img"
            src="/herofemale.png"
            alt="Compass guide model female"
            sx={{
              width: { xs: 160, md: 268, lg: 296 },
              height: 'auto',
              display: 'block',
              mr: { xs: -28, md: -48 },
              transform: 'translateX(-17vw)',
              filter:
                'drop-shadow(0 0 2px rgba(255,255,255,0.88)) drop-shadow(1.5px 0 0 rgba(255,255,255,0.80)) drop-shadow(-1.5px 0 0 rgba(255,255,255,0.80)) drop-shadow(0 1.5px 0 rgba(255,255,255,0.80)) drop-shadow(0 -1.5px 0 rgba(255,255,255,0.80)) drop-shadow(0 14px 26px rgba(4,10,20,0.36))',
            }}
          />
          <Box
            component="img"
            src="/heromale.png"
            alt="Compass guide model male"
            sx={{
              width: { xs: 160, md: 268, lg: 296 },
              height: 'auto',
              display: 'block',
              transform: 'translateX(-18vw)',
              filter:
                'drop-shadow(0 0 2px rgba(255,255,255,0.88)) drop-shadow(1.5px 0 0 rgba(255,255,255,0.80)) drop-shadow(-1.5px 0 0 rgba(255,255,255,0.80)) drop-shadow(0 1.5px 0 rgba(255,255,255,0.80)) drop-shadow(0 -1.5px 0 rgba(255,255,255,0.80)) drop-shadow(0 14px 26px rgba(4,10,20,0.36))',
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          width: '100%',
          minWidth: '100%',
          background:
            'radial-gradient(720px 260px at 12% 18%, rgba(111,154,131,0.12), transparent 70%), radial-gradient(720px 260px at 90% 82%, rgba(99,147,170,0.12), transparent 70%)',
          py: { xs: 2, md: 2 },
          borderTop: '1px solid rgba(13,27,48,0.10)',
          borderBottom: '1px solid rgba(13,27,48,0.10)',
        }}
      >
      <Container maxWidth="xl">
        <Stack spacing={1.4}>
          <Box
            key={activeSection}
            sx={{
              animation: `${transitionDir === 'left' ? 'cardsSwipeLeft' : 'cardsSwipeRight'} 280ms cubic-bezier(.2,.8,.2,1)`,
              '@keyframes cardsSwipeLeft': {
                from: { opacity: 0.3, transform: 'translateX(16px)' },
                to: { opacity: 1, transform: 'translateX(0)' },
              },
              '@keyframes cardsSwipeRight': {
                from: { opacity: 0.3, transform: 'translateX(-16px)' },
                to: { opacity: 1, transform: 'translateX(0)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0,
                flexWrap: 'wrap',
              }}
            >
              {currentCards.map((item, idx) => (
                <React.Fragment key={`${sections[activeSection].key}-${item.title}`}>
                  {idx > 0 && (
                    <Box
                      sx={{
                        width: { xs: '60%', md: 24 },
                        height: { xs: 0, md: 'auto' },
                        minWidth: { xs: 0, md: 24 },
                        alignSelf: 'center',
                        borderTop: { xs: '2px dashed rgba(63,100,123,0.45)', md: 'none' },
                        borderLeft: { xs: 'none', md: '2px dashed rgba(63,100,123,0.45)' },
                        flexShrink: 0,
                        mx: { xs: 0, md: 0.5 },
                        my: { xs: 1, md: 0 },
                      }}
                    />
                  )}
                  <Box
                    onClick={() => setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    sx={{
                      perspective: '1000px',
                      cursor: 'pointer',
                      flex: { xs: '1 1 100%', md: '1 1 0' },
                      minWidth: { xs: '100%', md: 280 },
                      maxWidth: { xs: '100%', md: 385 },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: { xs: 175, md: 192 },
                        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transformStyle: 'preserve-3d',
                        transform: flippedCards[idx] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        '@media (prefers-reduced-motion: reduce)': {
                          transition: 'none',
                        },
                      }}
                    >
                      {/* Front: hero + label overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          borderRadius: 2,
                          border: '1px solid rgba(15, 61, 112, 0.82)',
                          bgcolor:
                            activeSection === 0
                              ? '#FFFFFF'
                              : 'primary.main',
                          boxShadow:
                            'inset 0 0 0 2px rgba(255,255,255,0.72), 0 6px 20px rgba(15,23,42,0.06)',
                          overflow: 'hidden',
                        }}
                      >
                        {activeSection === 0 && item.hero && (
                          <Box
                            component="img"
                            src={item.hero}
                            alt=""
                            aria-hidden
                            sx={{
                              position: 'absolute',
                              left: `${item.frameX || 66}%`,
                              top: `${item.frameY || 50}%`,
                              transform: 'translate(-50%, -50%)',
                              width: {
                                xs: 264 * (item.frameScale || 1),
                                md: 324 * (item.frameScale || 1),
                              },
                              height: 'auto',
                              objectFit: 'contain',
                              opacity: 0.6,
                            }}
                          />
                        )}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '84%',
                            px: 2.75,
                            py: 0.85,
                            borderRadius: 10,
                            bgcolor: 'rgba(236, 232, 224, 0.95)',
                            border: '1.5px solid rgba(15,31,50,0.55)',
                            boxShadow:
                              '0 0 0 3px rgba(255,255,255,0.78), 0 0 14px rgba(255,255,255,0.45), 0 2px 10px rgba(15,31,50,0.10)',
                            zIndex: 1,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 900,
                              fontSize:
                                activeSection === 1
                                  ? { xs: '1.09rem', md: '1.24rem' }
                                  : { xs: '1.45rem', md: '1.65rem' },
                              letterSpacing: '0.12em',
                              color: activeSection === 0 ? '#0F2B45' : 'primary.main',
                              textTransform: 'uppercase',
                              whiteSpace: 'normal',
                              textAlign: 'center',
                              lineHeight: activeSection === 1 ? 1.1 : 1,
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {item.title}
                          </Typography>
                        </Box>
                      </Box>
                      {/* Back: content */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          borderRadius: 2,
                          border: '1px solid rgba(15, 61, 112, 0.82)',
                          bgcolor: '#FFFFFF',
                          boxShadow:
                            'inset 0 0 0 2px rgba(255,255,255,0.72), 0 6px 20px rgba(15,23,42,0.06)',
                          overflow: 'hidden',
                          p: { xs: 1.5, md: 1.75 },
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          sx={{
                            color: activeSection === 0 ? '#44566C' : 'primary.main',
                            fontSize: { xs: '0.88rem', md: '0.93rem' },
                            lineHeight: 1.6,
                            fontWeight: 500,
                            textAlign: 'center',
                          }}
                        >
                          {item.text}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          </Box>

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
              <Button variant="outlined" size="small" onClick={() => navigate('/dev-repository')}>
                Dev Repository
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
      </Box>
      <Box
        component="footer"
        sx={{
          position: 'relative',
          mt: 'auto',
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(120deg, rgba(9,16,31,0.92), rgba(16,34,60,0.88)), url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(700px 280px at 84% 18%, rgba(94,145,176,0.22), transparent 65%), radial-gradient(520px 240px at 8% 70%, rgba(91,132,167,0.18), transparent 72%)',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: { xs: 1.35, md: 1.6 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 0.75, md: 2 }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Typography
              sx={{
                color: 'rgba(233,242,255,0.92)',
                fontSize: { xs: '0.78rem', md: '0.84rem' },
                letterSpacing: '0.02em',
              }}
            >
              {`Copyright ${new Date().getFullYear()} North Star Partners. All rights reserved.`}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(233,242,255,0.88)',
                fontSize: { xs: '0.74rem', md: '0.82rem' },
                letterSpacing: '0.015em',
              }}
            >
              Privacy Policy  |  Terms of Use  |  Contact
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;