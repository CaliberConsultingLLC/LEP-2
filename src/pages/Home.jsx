import React, { useEffect, useState } from 'react';
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
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
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
  const [heroPassed, setHeroPassed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = Math.max(window.innerHeight * 0.55, 360);
      setHeroPassed(window.scrollY > threshold);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
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

    const frictionTells = [
      'You finish the book and still don\u2019t know what to change on Monday.',
      'You sit through the workshop and forget the framework by Friday.',
      'You wait a year for the 360 \u2014 read it twice, then nothing changes.',
    ];

    const outcomes = [
      {
        when: 'By next week',
        body: 'A reflection that names what you have felt about your leadership but never quite found the words for.',
      },
      {
        when: 'By next month',
        body: 'Three growth focuses you have chosen yourself, on a survey your team can rate honestly.',
      },
      {
        when: 'By next year',
        body: 'A measurable shift in how your team experiences your leadership \u2014 not a story you tell, a difference they feel.',
      },
    ];

    const scrollToTarget = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const scrollToJourney = () => scrollToTarget('journey');

    const navLinks = [
      { label: 'How It Works', target: 'journey' },
      { label: 'Inside Compass', target: 'inside' },
      { label: 'What Changes', target: 'outcomes' },
    ];

    const navySerif = '"Fraunces", Georgia, "Times New Roman", serif';
    const sansBody = '"Manrope", "Inter", system-ui, sans-serif';
    const monoEyebrow = '"JetBrains Mono", ui-monospace, monospace';

    const headerOnDark = !heroPassed;

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
        {/* SCROLL-AWARE HEADER */}
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            px: { xs: 2.5, md: 5 },
            py: { xs: 1.4, md: 1.7 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            transition: 'background-color 320ms ease, color 320ms ease, border-color 320ms ease, backdrop-filter 320ms ease',
            bgcolor: headerOnDark ? 'rgba(10,24,48,0.35)' : 'rgba(251,247,240,0.90)',
            backdropFilter: 'blur(14px)',
            borderBottom: headerOnDark
              ? '1px solid rgba(244,206,161,0.10)'
              : '1px solid rgba(15,28,46,0.08)',
            color: headerOnDark ? '#FFF8F0' : '#10223C',
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              component="img"
              src="/CompassLogo.png"
              alt=""
              aria-hidden
              sx={{
                width: 30,
                height: 30,
                objectFit: 'contain',
                filter: headerOnDark ? 'brightness(1.15)' : 'none',
                transition: 'filter 320ms ease',
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Cinzel", Georgia, serif',
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.12rem' },
                letterSpacing: '0.04em',
                fontVariant: 'small-caps',
                color: 'inherit',
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
                onClick={() => scrollToTarget(link.target)}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  px: 1.4,
                  py: 0.7,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: 'inherit',
                  opacity: headerOnDark ? 0.85 : 1,
                  transition: 'color 200ms ease, opacity 200ms ease',
                  '&:hover': {
                    color: headerOnDark ? '#F4CEA1' : '#C0612A',
                    opacity: 1,
                  },
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
                color: 'inherit',
                opacity: headerOnDark ? 0.85 : 1,
                ml: 0.5,
                '&:hover': {
                  color: headerOnDark ? '#F4CEA1' : '#C0612A',
                  opacity: 1,
                },
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
                boxShadow: headerOnDark
                  ? '0 10px 26px rgba(224,122,63,0.42)'
                  : '0 8px 22px rgba(224,122,63,0.28)',
                transition: '160ms ease',
                '&:hover': { bgcolor: '#C0612A', transform: 'translateY(-1px)' },
              }}
            >
              Begin Your Journey
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
          </Stack>
        </Box>

        {/* HERO + FADE TRANSITION (single tall band) */}
        <Box
          sx={{
            position: 'relative',
            minHeight: { xs: '92vh', md: '108vh' },
            pt: { xs: 13, md: 17 },
            pb: { xs: 10, md: 16 },
            color: '#FFF8F0',
            background:
              'linear-gradient(180deg, #060F22 0%, #0A1830 28%, #10223C 56%, rgba(34,52,80,0.72) 78%, #FBF7F0 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Starfield (top half only, fades down) */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: [
                'radial-gradient(1.4px 1.4px at 12% 14%, rgba(255,255,255,0.55), transparent 60%)',
                'radial-gradient(1px 1px at 22% 32%, rgba(255,255,255,0.35), transparent 60%)',
                'radial-gradient(1.6px 1.6px at 38% 8%, rgba(244,206,161,0.55), transparent 60%)',
                'radial-gradient(1px 1px at 51% 26%, rgba(255,255,255,0.35), transparent 60%)',
                'radial-gradient(1.4px 1.4px at 62% 12%, rgba(255,255,255,0.5), transparent 60%)',
                'radial-gradient(1px 1px at 70% 30%, rgba(244,206,161,0.4), transparent 60%)',
                'radial-gradient(1.2px 1.2px at 82% 18%, rgba(255,255,255,0.45), transparent 60%)',
                'radial-gradient(1px 1px at 90% 36%, rgba(255,255,255,0.32), transparent 60%)',
                'radial-gradient(1px 1px at 16% 44%, rgba(255,255,255,0.28), transparent 60%)',
                'radial-gradient(1px 1px at 76% 50%, rgba(255,255,255,0.22), transparent 60%)',
              ].join(', '),
              maskImage: 'linear-gradient(180deg, #000 0%, #000 38%, transparent 70%)',
              WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 38%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Subtle aurora glow behind the dial */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: { xs: '6%', md: '4%' },
              right: { xs: '-15%', md: '-6%' },
              width: { xs: 540, md: 760 },
              height: { xs: 540, md: 760 },
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 50% 50%, rgba(244,206,161,0.18) 0%, rgba(224,122,63,0.06) 35%, rgba(15,28,46,0) 65%)',
              filter: 'blur(8px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Static compass watermark — atmospheric, not a feature */}
          <Box
            aria-hidden
            component="img"
            src="/CompassLogo.png"
            sx={{
              position: 'absolute',
              top: { xs: '5%', md: '8%' },
              right: { xs: '-22%', md: '-8%' },
              width: { xs: 460, md: 640 },
              height: 'auto',
              opacity: { xs: 0.10, md: 0.13 },
              filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.35))',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack spacing={3.4} alignItems="flex-start" sx={{ maxWidth: 880 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.6,
                  py: 0.65,
                  borderRadius: 999,
                  bgcolor: 'rgba(244,206,161,0.10)',
                  border: '1px solid rgba(244,206,161,0.28)',
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F4CEA1', boxShadow: '0 0 10px rgba(244,206,161,0.7)' }} />
                <Typography
                  sx={{
                    fontFamily: monoEyebrow,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: '#F4CEA1',
                  }}
                >
                  For leaders who refuse to ride along
                </Typography>
              </Box>

              <Typography
                component="h1"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 500,
                  fontSize: { xs: '3rem', sm: '4rem', md: '5.4rem' },
                  lineHeight: 0.96,
                  letterSpacing: '-0.04em',
                  color: '#FFF8F0',
                  textShadow: '0 2px 30px rgba(0,0,0,0.35)',
                }}
              >
                You don't follow paths.
                <Box component="span" sx={{ display: 'block' }}>
                  You{' '}
                  <Box component="span" sx={{ color: '#F4CEA1', fontStyle: 'italic', fontWeight: 400 }}>
                    set
                  </Box>{' '}
                  them.
                </Box>
              </Typography>

              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '1.05rem', md: '1.22rem' },
                  lineHeight: 1.55,
                  color: 'rgba(255,248,240,0.84)',
                  maxWidth: 620,
                }}
              >
                Compass is the leadership tool for people who'd rather drive their own growth than follow someone else's framework. Curious. Hungry. Already trying. Just missing the signal.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ pt: 1.2 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={handleBeginJourney}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    px: 3.4,
                    py: 1.45,
                    borderRadius: 999,
                    bgcolor: '#E07A3F',
                    color: '#FFF8F0',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.9,
                    boxShadow: '0 18px 40px rgba(224,122,63,0.42), 0 0 0 1px rgba(244,206,161,0.18) inset',
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
                    py: 1.4,
                    borderRadius: 999,
                    border: '1.5px solid rgba(244,206,161,0.45)',
                    color: '#FFF8F0',
                    fontWeight: 800,
                    fontSize: '1rem',
                    transition: '180ms ease',
                    '&:hover': {
                      borderColor: '#F4CEA1',
                      bgcolor: 'rgba(244,206,161,0.06)',
                    },
                  }}
                >
                  How It Works
                </Box>
              </Stack>
            </Stack>
          </Container>

          {/* TENSION HOOK — single quiet line in the gradient fade */}
          <Container
            maxWidth="md"
            sx={{
              position: 'relative',
              zIndex: 1,
              mt: { xs: 9, md: 14 },
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: navySerif,
                fontWeight: 500,
                fontSize: { xs: '1.55rem', md: '2.25rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'rgba(255,248,240,0.92)',
                maxWidth: 760,
                mx: 'auto',
              }}
            >
              Most leadership content was written
              <Box component="span" sx={{ display: 'block', color: '#F4CEA1', fontStyle: 'italic', fontWeight: 400 }}>
                for someone else's leader.
              </Box>
            </Typography>
          </Container>
        </Box>

        {/* FRICTION — name what isn't landing */}
        <Box
          id="friction"
          sx={{
            position: 'relative',
            py: { xs: 8, md: 11 },
            bgcolor: '#FBF7F0',
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={1.4} alignItems="center" sx={{ textAlign: 'center', mb: { xs: 5, md: 7 }, maxWidth: 720, mx: 'auto' }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#C0612A',
                }}
              >
                Sound familiar?
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 600,
                  fontSize: { xs: '1.95rem', md: '2.65rem' },
                  lineHeight: 1.12,
                  letterSpacing: '-0.025em',
                  color: '#10223C',
                }}
              >
                You've done the reading.
                <Box component="span" sx={{ display: 'block', color: '#C0612A', fontStyle: 'italic', fontWeight: 500 }}>
                  None of it told you what your Monday actually felt like.
                </Box>
              </Typography>
            </Stack>

            <Stack spacing={{ xs: 1.6, md: 2 }} sx={{ maxWidth: 760, mx: 'auto' }}>
              {frictionTells.map((tell, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{
                    py: { xs: 1.6, md: 2 },
                    borderTop: '1px solid rgba(15,28,46,0.10)',
                    ...(idx === frictionTells.length - 1 && { borderBottom: '1px solid rgba(15,28,46,0.10)' }),
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: monoEyebrow,
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      letterSpacing: '0.24em',
                      color: '#C0612A',
                      pt: 0.5,
                      flexShrink: 0,
                      width: { xs: 32, md: 44 },
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: navySerif,
                      fontWeight: 500,
                      fontSize: { xs: '1.1rem', md: '1.35rem' },
                      lineHeight: 1.4,
                      color: '#10223C',
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {tell}
                  </Typography>
                </Stack>
              ))}
            </Stack>
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
            py: { xs: 8, md: 11 },
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={1.6} alignItems="center" sx={{ textAlign: 'center', mb: { xs: 5.5, md: 7 } }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#C0612A',
                }}
              >
                The Path Forward
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 600,
                  fontSize: { xs: '2.05rem', md: '2.95rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                  color: '#10223C',
                  maxWidth: 760,
                }}
              >
                Compass starts where
                <Box component="span" sx={{ color: '#C0612A', fontStyle: 'italic', fontWeight: 500 }}> you actually are.</Box>
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '0.98rem', md: '1.08rem' },
                  color: '#44566C',
                  maxWidth: 640,
                  lineHeight: 1.6,
                }}
              >
                Four steps. One year. The rhythm leaders take when they would rather drive their own growth than wait for someone to schedule it.
              </Typography>
            </Stack>

            <Box
              sx={{
                position: 'relative',
                '@keyframes journeyHaloPulse': {
                  '0%, 100%': { boxShadow: '0 12px 28px rgba(224,122,63,0.30), 0 0 0 0 rgba(224,122,63,0.45)' },
                  '50%': { boxShadow: '0 12px 28px rgba(224,122,63,0.30), 0 0 0 14px rgba(224,122,63,0)' },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  '& [data-active-step]': { animation: 'none' },
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 32,
                  left: '8%',
                  right: '8%',
                  height: 2,
                  borderTop: '2px dashed rgba(224,122,63,0.45)',
                  display: { xs: 'none', md: 'block' },
                  zIndex: 0,
                }}
              />
              <Grid container spacing={{ xs: 3, md: 3 }} sx={{ position: 'relative', zIndex: 1 }}>
                {journeySteps.map((step, idx) => (
                  <Grid key={step.num} item xs={12} sm={6} md={3}>
                    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', px: { md: 1 } }}>
                      <Box
                        data-active-step={idx === 0 ? true : undefined}
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
                          animation: idx === 0 ? 'journeyHaloPulse 3.4s ease-in-out infinite' : 'none',
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

        {/* INSIDE COMPASS — show, don't tell */}
        <Box
          id="inside"
          sx={{
            py: { xs: 8, md: 11 },
            background:
              'radial-gradient(900px 460px at 80% 0%, rgba(244,206,161,0.32), transparent 65%), radial-gradient(700px 460px at -10% 100%, rgba(224,122,63,0.10), transparent 60%), #FBF7F0',
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={1.6} alignItems="center" sx={{ textAlign: 'center', mb: { xs: 5, md: 6.5 } }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#C0612A',
                }}
              >
                Inside Compass
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 600,
                  fontSize: { xs: '2rem', md: '2.85rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                  color: '#10223C',
                  maxWidth: 760,
                }}
              >
                Three artifacts.
                <Box component="span" sx={{ color: '#C0612A', fontStyle: 'italic', fontWeight: 500 }}> One leader.</Box>
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
                A reflection that reads like it was written for you. A focus you actually choose. A campaign your team can feel.
              </Typography>
            </Stack>

            <Grid container spacing={{ xs: 3, md: 3.5 }}>
              {/* CARD 1: Reflection */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: '20px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid rgba(15,28,46,0.08)',
                    boxShadow: '0 18px 44px rgba(15,28,46,0.08)',
                    p: { xs: 2.6, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: 'rgba(224,122,63,0.10)',
                        color: '#C0612A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FormatQuoteRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: monoEyebrow,
                        fontWeight: 700,
                        fontSize: '0.66rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: '#C0612A',
                      }}
                    >
                      Your Reflection
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontFamily: navySerif,
                      fontStyle: 'italic',
                      fontWeight: 500,
                      fontSize: { xs: '1.02rem', md: '1.1rem' },
                      lineHeight: 1.55,
                      color: '#10223C',
                    }}
                  >
                    "You move fastest under pressure, but your team often reads that as urgency, not direction. The signal you intend to send is rarely the one they receive."
                  </Typography>
                  <Box sx={{ mt: 'auto', pt: 1.4, borderTop: '1px solid rgba(15,28,46,0.08)' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#44566C' }}>
                      From your Trailhead summary
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* CARD 2: Focus */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: '20px',
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid rgba(46,128,84,0.42)',
                    boxShadow: '0 18px 44px rgba(15,28,46,0.08)',
                    p: { xs: 2.6, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    position: 'relative',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: 'rgba(46,128,84,0.12)',
                        color: '#2E8054',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: monoEyebrow,
                        fontWeight: 700,
                        fontSize: '0.66rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: '#2E8054',
                      }}
                    >
                      Your Focus
                    </Typography>
                  </Stack>
                  <Stack spacing={0.6} sx={{ mt: 0.4 }}>
                    <Typography
                      sx={{
                        fontFamily: monoEyebrow,
                        fontWeight: 700,
                        fontSize: '0.62rem',
                        letterSpacing: '0.20em',
                        textTransform: 'uppercase',
                        color: '#44566C',
                      }}
                    >
                      Sub-trait
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: navySerif,
                        fontWeight: 600,
                        fontSize: { xs: '1.55rem', md: '1.75rem' },
                        letterSpacing: '-0.02em',
                        color: '#10223C',
                        lineHeight: 1.05,
                      }}
                    >
                      Decisive Listening
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#44566C' }}>
                      under <Box component="span" sx={{ color: '#10223C', fontWeight: 700 }}>Coachable Communicator</Box>
                    </Typography>
                  </Stack>
                  <Box sx={{ mt: 'auto', pt: 1.4, borderTop: '1px solid rgba(15,28,46,0.08)' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#44566C' }}>
                      One of three campaign focuses
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* CARD 3: Campaign */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: '20px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid rgba(15,28,46,0.08)',
                    boxShadow: '0 18px 44px rgba(15,28,46,0.08)',
                    p: { xs: 2.6, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: 'rgba(63,100,123,0.12)',
                        color: '#3F647B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Diversity3RoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: monoEyebrow,
                        fontWeight: 700,
                        fontSize: '0.66rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: '#3F647B',
                      }}
                    >
                      Your Campaign
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontFamily: navySerif,
                      fontWeight: 500,
                      fontSize: { xs: '1.02rem', md: '1.08rem' },
                      lineHeight: 1.5,
                      color: '#10223C',
                    }}
                  >
                    "Their leader consistently invites pushback before making the final call."
                  </Typography>
                  <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.5 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <Box
                        key={n}
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: '1.5px solid',
                          borderColor: n === 6 ? '#E07A3F' : 'rgba(15,28,46,0.18)',
                          bgcolor: n === 6 ? '#E07A3F' : 'transparent',
                          color: n === 6 ? '#FFF8F0' : '#44566C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          boxShadow: n === 6 ? '0 8px 18px rgba(224,122,63,0.30)' : 'none',
                        }}
                      >
                        {n}
                      </Box>
                    ))}
                  </Stack>
                  <Box sx={{ mt: 'auto', pt: 1.4, borderTop: '1px solid rgba(15,28,46,0.08)' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#44566C' }}>
                      Sample team-survey statement
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* WHAT CHANGES — outcomes by next week / month / year */}
        <Box id="outcomes" sx={{ py: { xs: 8, md: 11 }, bgcolor: '#FFFFFF', borderTop: '1px solid rgba(15,28,46,0.06)' }}>
          <Container maxWidth="lg">
            <Stack spacing={1.6} alignItems="center" sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#C0612A',
                }}
              >
                What changes
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 600,
                  fontSize: { xs: '2rem', md: '2.85rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                  color: '#10223C',
                  maxWidth: 760,
                }}
              >
                Not a story you tell.
                <Box component="span" sx={{ display: 'block', color: '#C0612A', fontStyle: 'italic', fontWeight: 500 }}>
                  A difference your team feels.
                </Box>
              </Typography>
            </Stack>

            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 24,
                  left: '8%',
                  right: '8%',
                  height: 2,
                  borderTop: '2px dashed rgba(224,122,63,0.30)',
                  display: { xs: 'none', md: 'block' },
                  zIndex: 0,
                }}
              />
              <Grid container spacing={{ xs: 3.5, md: 4 }} sx={{ position: 'relative', zIndex: 1 }}>
                {outcomes.map((o, idx) => (
                  <Grid key={o.when} item xs={12} md={4}>
                    <Stack spacing={1.8} alignItems="center" sx={{ textAlign: 'center', px: { md: 1 } }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: '#FFFFFF',
                          color: '#C0612A',
                          border: '1.5px solid rgba(224,122,63,0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: monoEyebrow,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          letterSpacing: '0.06em',
                          boxShadow: '0 6px 18px rgba(15,28,46,0.06)',
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: monoEyebrow,
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: '#C0612A',
                        }}
                      >
                        {o.when}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: navySerif,
                          fontWeight: 500,
                          fontSize: { xs: '1.1rem', md: '1.2rem' },
                          lineHeight: 1.45,
                          letterSpacing: '-0.015em',
                          color: '#10223C',
                          maxWidth: 280,
                        }}
                      >
                        {o.body}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Container>
        </Box>

        {/* CLOSING CTA — bookend back to dark */}
        <Box
          sx={{
            position: 'relative',
            py: { xs: 8, md: 11 },
            color: '#FFF8F0',
            background:
              'radial-gradient(900px 380px at 50% 0%, rgba(224,122,63,0.22), transparent 60%), linear-gradient(180deg, #10223C 0%, #0A1830 100%)',
            overflow: 'hidden',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: [
                'radial-gradient(1px 1px at 18% 28%, rgba(255,255,255,0.30), transparent 60%)',
                'radial-gradient(1.4px 1.4px at 76% 22%, rgba(244,206,161,0.40), transparent 60%)',
                'radial-gradient(1px 1px at 50% 60%, rgba(255,255,255,0.20), transparent 60%)',
                'radial-gradient(1.2px 1.2px at 86% 70%, rgba(255,255,255,0.22), transparent 60%)',
              ].join(', '),
              maskImage: 'linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)',
              pointerEvents: 'none',
              opacity: 0.85,
            }}
          />
          <Container maxWidth="md" sx={{ position: 'relative' }}>
            <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#F4CEA1',
                }}
              >
                One last thing
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 500,
                  fontSize: { xs: '2rem', md: '2.95rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: '#FFF8F0',
                  maxWidth: 760,
                }}
              >
                If you've read this far,
                <Box component="span" sx={{ display: 'block', color: '#F4CEA1', fontStyle: 'italic', fontWeight: 400 }}>
                  you're already this kind of leader.
                </Box>
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '1rem', md: '1.08rem' },
                  lineHeight: 1.6,
                  color: 'rgba(255,248,240,0.78)',
                  maxWidth: 560,
                }}
              >
                Compass is built for the leader who'd rather know than guess. Thirty minutes in. A year of clarity out.
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={handleBeginJourney}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  mt: 0.8,
                  px: 3.8,
                  py: 1.5,
                  borderRadius: 999,
                  bgcolor: '#E07A3F',
                  color: '#FFF8F0',
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.9,
                  boxShadow: '0 18px 42px rgba(224,122,63,0.42), 0 0 0 1px rgba(244,206,161,0.18) inset',
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