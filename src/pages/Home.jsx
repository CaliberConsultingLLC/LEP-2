import React, { useEffect, useRef, useState } from 'react';
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
  const parallaxLep3Ref    = useRef(null);
  const parallaxJourneyRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const threshold = Math.max(window.innerHeight * 0.55, 360);
      setHeroPassed(window.scrollY > threshold);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Attach / detach scroll-snap class so only the landing page snaps
  useEffect(() => {
    if (!useCairnTheme) return;
    document.documentElement.classList.add('cairn-landing-page');
    return () => document.documentElement.classList.remove('cairn-landing-page');
  }, []);

  // Parallax: night-sky fades out, mountains fade in as user scrolls
  useEffect(() => {
    if (!useCairnTheme) return;
    let rafId;
    const onParallax = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const sy = window.scrollY;
        const vh = window.innerHeight;
        // Night-sky layer: slow upward drift + fade out over 1.7 viewports
        if (parallaxLep3Ref.current) {
          parallaxLep3Ref.current.style.transform = `translateY(${sy * 0.38}px)`;
          parallaxLep3Ref.current.style.opacity   = String(Math.max(0, 1 - sy / (vh * 1.7)));
        }
        // Mountain layer: starts appearing after 45% of first viewport, drifts at 26%
        if (parallaxJourneyRef.current) {
          const progress = Math.max(0, Math.min(1, (sy - vh * 0.45) / (vh * 1.3)));
          parallaxJourneyRef.current.style.opacity   = String(progress);
          parallaxJourneyRef.current.style.transform = `translateY(${Math.max(-50, (sy - vh * 0.5) * 0.26)}px)`;
        }
      });
    };
    window.addEventListener('scroll', onParallax, { passive: true });
    onParallax();
    return () => {
      window.removeEventListener('scroll', onParallax);
      if (rafId) cancelAnimationFrame(rafId);
    };
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
    const navySerif   = '"Fraunces", Georgia, "Times New Roman", serif';
    const sansBody    = '"Manrope", "Inter", system-ui, sans-serif';
    const monoEyebrow = '"JetBrains Mono", ui-monospace, monospace';

    const navLinks = [
      { label: 'How It Works', target: 'journey' },
      { label: 'Pricing', href: '/pricing' },
    ];

    const journeySteps = [
      {
        num: 'I',
        title: 'Uncover',
        body: 'A 15-minute intake reveals how you lead under real conditions — pressure, decisions, team dynamics.',
        tag: '~15 min',
      },
      {
        num: 'II',
        title: 'Reflect',
        body: 'Your personalized summary arrives instantly. Plain language. No labels. Just signal.',
        tag: 'Instant',
      },
      {
        num: 'III',
        title: 'Calibrate',
        body: 'An anonymous team survey shows how your leadership lands in the room versus how you perceive it.',
        tag: '~5 min survey',
      },
      {
        num: 'IV',
        title: 'Embark',
        body: 'A year-long growth campaign turns insight into measurable change your team can feel.',
        tag: 'Year-long',
      },
    ];

    const scrollToTarget = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const headerOnDark = !heroPassed;

    const starsBg = [
      /* ── Bright white anchors (large) ── */
      'radial-gradient(2.4px 2.4px at 7% 18%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(1.8px 1.8px at 19% 8%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(2px 2px at 34% 22%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(1.6px 1.6px at 47% 12%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(2.2px 2.2px at 58% 26%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(1.8px 1.8px at 73% 8%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(2px 2px at 87% 20%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(2.6px 2.6px at 95% 6%, rgba(255,255,255,0.95), transparent 55%)',
      /* ── New bright anchors ── */
      'radial-gradient(2px 2px at 30% 10%, rgba(255,255,255,0.95), transparent 55%)',
      'radial-gradient(2.2px 2.2px at 79% 16%, rgba(255,255,255,0.95), transparent 55%)',
      /* ── Medium white ── */
      'radial-gradient(1.2px 1.2px at 14% 32%, rgba(255,255,255,0.80), transparent 60%)',
      'radial-gradient(1.4px 1.4px at 27% 14%, rgba(255,255,255,0.94), transparent 60%)',
      'radial-gradient(1px 1px at 41% 36%, rgba(255,255,255,0.65), transparent 60%)',
      'radial-gradient(1.3px 1.3px at 52% 4%, rgba(255,255,255,0.84), transparent 60%)',
      'radial-gradient(1.1px 1.1px at 64% 18%, rgba(255,255,255,0.73), transparent 60%)',
      'radial-gradient(1.5px 1.5px at 78% 30%, rgba(255,255,255,0.87), transparent 60%)',
      'radial-gradient(1px 1px at 91% 14%, rgba(255,255,255,0.61), transparent 60%)',
      'radial-gradient(1.6px 1.6px at 45% 28%, rgba(255,255,255,0.75), transparent 60%)',
      'radial-gradient(1.4px 1.4px at 62% 5%, rgba(255,255,255,0.86), transparent 55%)',
      'radial-gradient(1px 1px at 6% 26%, rgba(255,255,255,0.68), transparent 60%)',
      /* ── Dim white (depth) ── */
      'radial-gradient(0.8px 0.8px at 22% 24%, rgba(255,255,255,0.44), transparent 60%)',
      'radial-gradient(0.8px 0.8px at 39% 6%, rgba(255,255,255,0.41), transparent 60%)',
      'radial-gradient(0.8px 0.8px at 67% 36%, rgba(255,255,255,0.44), transparent 60%)',
      'radial-gradient(0.8px 0.8px at 82% 4%, rgba(255,255,255,0.41), transparent 60%)',
      'radial-gradient(0.8px 0.8px at 12% 38%, rgba(255,255,255,0.38), transparent 60%)',
      /* ── Amber warm stars ── */
      'radial-gradient(2.2px 2.2px at 24% 16%, rgba(244,206,161,0.95), transparent 55%)',
      'radial-gradient(1.8px 1.8px at 56% 30%, rgba(244,206,161,0.95), transparent 55%)',
      'radial-gradient(1.5px 1.5px at 88% 32%, rgba(244,206,161,0.94), transparent 55%)',
      'radial-gradient(1.2px 1.2px at 70% 14%, rgba(244,206,161,0.80), transparent 60%)',
      'radial-gradient(2px 2px at 92% 30%, rgba(244,206,161,0.92), transparent 55%)',
      'radial-gradient(1.4px 1.4px at 15% 10%, rgba(244,206,161,0.78), transparent 60%)',
    ].join(', ');

    return (
      <>
        {/* ── PARALLAX BACKGROUND STAGE (fixed, behind all sections) ── */}
        <Box
          aria-hidden
          sx={{
            position: 'fixed', top: 0, left: 0,
            width: '100%', height: '100%',
            zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
          }}
        >
          {/* Night-sky layer — LEP3.jpg, drifts up slowly, fades out */}
          <Box
            ref={parallaxLep3Ref}
            sx={{
              position: 'absolute', top: '-20%', left: 0,
              width: '100%', height: '140%',
              backgroundImage: 'url(/LEP3.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center center',
              willChange: 'transform, opacity',
            }}
          />
          {/* Mountain layer — journey-base.png, fades in and drifts up slowly */}
          <Box
            ref={parallaxJourneyRef}
            sx={{
              position: 'absolute', top: '-10%', left: 0,
              width: '100%', height: '140%',
              backgroundImage: 'url(/journey-base.png)',
              backgroundSize: 'cover', backgroundPosition: 'center center',
              opacity: 0, willChange: 'transform, opacity',
            }}
          />
        </Box>

        <Box
          data-cairn-landing
          sx={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            color: '#10223C',
            overflowX: 'hidden',
            fontFamily: sansBody,
          }}
        >
        {/* ── HEADER ── */}
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 50,
            height: 80,
            px: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            transition: 'background-color 280ms ease, border-color 280ms ease',
            bgcolor: headerOnDark ? 'rgba(6,15,34,0.90)' : 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: headerOnDark
              ? '1px solid rgba(244,206,161,0.10)'
              : '1px solid rgba(15,28,46,0.08)',
          }}
        >
          <Box
            sx={{
              fontFamily: '"Cinzel", "Times New Roman", Georgia, serif',
              fontWeight: 600,
              fontSize: { xs: 22, sm: 25 },
              letterSpacing: '-0.045em',
              fontVariant: 'small-caps',
              color: headerOnDark ? '#F4CEA1' : '#10223C',
              lineHeight: 0.95,
              userSelect: 'none',
              transition: 'color 280ms ease',
            }}
          >
            The Compass
          </Box>

          <Stack direction="row" spacing={0.4} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((link) => (
              <Box
                key={link.href || link.target}
                component="button"
                type="button"
                onClick={() => link.href ? navigate(link.href) : scrollToTarget(link.target)}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  px: 1.6, py: 0.85,
                  borderRadius: 999,
                  fontFamily: sansBody,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: headerOnDark ? 'rgba(244,206,161,0.78)' : '#10223C',
                  transition: 'color 200ms ease',
                  '&:hover': { color: headerOnDark ? '#F4CEA1' : '#C0612A' },
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
                ml: 0.5, px: 1.6, py: 0.85,
                borderRadius: 999,
                fontFamily: sansBody,
                fontWeight: 700,
                fontSize: '0.88rem',
                color: headerOnDark ? 'rgba(244,206,161,0.78)' : '#10223C',
                '&:hover': { color: headerOnDark ? '#F4CEA1' : '#C0612A' },
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
                ml: 1.2, px: 2.2, py: 1,
                borderRadius: 999,
                bgcolor: '#E07A3F',
                color: '#FFF8F0',
                fontFamily: sansBody,
                fontWeight: 800,
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                boxShadow: '0 10px 24px rgba(224,122,63,0.32)',
                transition: '160ms ease',
                '&:hover': { bgcolor: '#C0612A', transform: 'translateY(-1px)' },
              }}
            >
              Begin Your Journey
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
          </Stack>
        </Box>

        {/* ============================================= */}
        {/* MOMENT 1: HERO -- deep space, ethereal        */}
        {/* ============================================= */}
        <Box
          sx={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pt: { xs: 13, md: 0 },
            pb: { xs: 8, md: 0 },
            overflow: 'hidden',
            color: '#FFF8F0',
            scrollSnapAlign: 'start',
          }}
        >
          {/* Dark atmospheric gradient overlay over parallax bg */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute', inset: 0, zIndex: 0,
              background: 'linear-gradient(180deg, rgba(6,15,34,0.52) 0%, rgba(6,15,34,0.44) 30%, rgba(13,27,48,0.40) 70%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* Stars */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute', inset: 0,
              backgroundImage: starsBg,
              maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.2) 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.2) 85%, transparent 100%)',
              pointerEvents: 'none', zIndex: 0,
            }}
          />

          {/* CompassLogo.png — independently positioned right of headline */}
          <Box
            component="img"
            src="/CompassLogo.png"
            alt="The Compass"
            sx={{
              position: 'absolute',
              right: { xs: '-4%', md: '4%' },
              top: '50%',
              transform: 'translateY(-50%)',
              width: { xs: '34vw', md: '21vw' },
              maxWidth: 360,
              opacity: 0.82,
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 1,
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack spacing={4} alignItems="flex-start" sx={{ maxWidth: 860 }}>
              {/* Eyebrow */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.6, py: 0.65,
                  borderRadius: 999,
                  bgcolor: 'rgba(244,206,161,0.08)',
                  border: '1px solid rgba(244,206,161,0.22)',
                }}
              >
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#F4CEA1', boxShadow: '0 0 8px rgba(244,206,161,0.7)' }} />
                <Typography
                  sx={{
                    fontFamily: monoEyebrow,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: '#F4CEA1',
                  }}
                >
                  Self-directed leadership development
                </Typography>
              </Box>

              {/* Headline */}
              <Typography
                component="h1"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 500,
                  fontSize: { xs: '3.2rem', sm: '4.2rem', md: '5.8rem' },
                  lineHeight: 0.94,
                  letterSpacing: '-0.04em',
                  color: '#FFF8F0',
                }}
              >
                <Box component="span" sx={{ display: 'block', whiteSpace: 'nowrap' }}>
                  Leaders don&apos;t{' '}
                  <Box component="span" sx={{ color: '#F4CEA1', fontStyle: 'italic', fontWeight: 400 }}>
                    follow
                  </Box>{' '}
                  paths,
                </Box>
                <Box component="span" sx={{ display: 'block' }}>
                  Leaders{' '}
                  <Box component="span" sx={{ color: '#F4CEA1', fontStyle: 'italic', fontWeight: 400 }}>
                    set
                  </Box>{' '}
                  them.
                </Box>
              </Typography>

              {/* Subhead */}
              <Typography
                sx={{
                  fontFamily: sansBody,
                  fontWeight: 400,
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                  lineHeight: 1.65,
                  color: 'rgba(255,248,240,0.72)',
                  maxWidth: 560,
                }}
              >
                A personalized reflection of how you lead, growth priorities you choose yourself, and a year-long campaign your team can feel.
              </Typography>

              {/* CTAs */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6} sx={{ pt: 0.5 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={handleBeginJourney}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    px: 3.4, py: 1.5,
                    borderRadius: 999,
                    bgcolor: '#E07A3F',
                    color: '#FFF8F0',
                    fontFamily: sansBody,
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.9,
                    boxShadow: '0 16px 36px rgba(224,122,63,0.40)',
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
                  onClick={() => scrollToTarget('journey')}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    px: 3, py: 1.45,
                    borderRadius: 999,
                    border: '1.5px solid rgba(255,248,240,0.22)',
                    color: 'rgba(255,248,240,0.88)',
                    fontFamily: sansBody,
                    fontWeight: 700,
                    fontSize: '1rem',
                    transition: '180ms ease',
                    '&:hover': { borderColor: 'rgba(244,206,161,0.5)', color: '#F4CEA1' },
                  }}
                >
                  How It Works
                </Box>
              </Stack>

              {/* Micro-trust */}
              <Typography
                sx={{
                  fontFamily: sansBody,
                  fontWeight: 500,
                  fontSize: '0.76rem',
                  color: 'rgba(255,248,240,0.36)',
                  letterSpacing: '0.02em',
                }}
              >
                Free to start &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; ~15 minutes
              </Typography>
            </Stack>
          </Container>

          {/* Scroll indicator */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.6,
              opacity: 0.28,
              zIndex: 1,
            }}
          >
            <Box sx={{ width: '1.5px', height: 36, bgcolor: '#F4CEA1' }} />
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#F4CEA1' }} />
          </Box>
        </Box>

        {/* ============================================= */}
        {/* MOMENT 2: THE MIRROR -- editorial, dark       */}
        {/* Navy with amber warmth entering from below    */}
        {/* ============================================= */}
        <Box
          sx={{
            position: 'relative',
            background: 'transparent',
            py: { xs: 10, md: 15 },
            overflow: 'hidden',
            color: '#FFF8F0',
            scrollSnapAlign: 'start',
          }}
        >
          {/* Amber glow rising */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              bottom: '-20%', right: '-15%',
              width: 900, height: 900,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(224,122,63,0.09) 0%, rgba(244,206,161,0.04) 45%, transparent 65%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={{ xs: 6, md: 12 }} alignItems="flex-start">
              {/* Left: editorial pull */}
              <Grid item xs={12} md={6}>
                <Stack spacing={4}>
                  <Typography
                    sx={{
                      fontFamily: monoEyebrow,
                      fontWeight: 700,
                      fontSize: '0.66rem',
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: '#C0612A',
                    }}
                  >
                    What Compass is
                  </Typography>
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: navySerif,
                      fontWeight: 500,
                      fontSize: { xs: '2rem', md: '2.9rem' },
                      lineHeight: 1.08,
                      letterSpacing: '-0.03em',
                      color: '#10223C',
                    }}
                  >
                    Most leadership development was built for someone{' '}
                    <Box component="span" sx={{ color: '#C0612A', fontStyle: 'italic', fontWeight: 400 }}>
                      else&apos;s
                    </Box>{' '}
                    problems.
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: sansBody,
                      fontWeight: 400,
                      fontSize: { xs: '1rem', md: '1.08rem' },
                      lineHeight: 1.72,
                      color: '#44566C',
                      maxWidth: 460,
                    }}
                  >
                    Compass was built for the specific leader you are right now &mdash; your context, your team, your blind spots, your leverage. Everything is calibrated to your actual situation, not a template.
                  </Typography>
                </Stack>
              </Grid>

              {/* Right: three differentiators */}
              <Grid item xs={12} md={6}>
                <Stack
                  spacing={0}
                  divider={<Box sx={{ height: '1px', bgcolor: 'rgba(16,34,60,0.12)' }} />}
                >
                  {[
                    {
                      label: 'Reflection',
                      body: 'A 15-min intake surfaces how you actually lead under pressure. Your summary reads like it was written for you — because it was.',
                    },
                    {
                      label: 'Growth Priorities',
                      body: 'You pick three traits to develop from five personalized options. No coach required. No HR assignment. You own the direction.',
                    },
                    {
                      label: 'Team Campaign',
                      body: 'Your team rates your progress anonymously, once a year. The data shows whether your development is landing in the room.',
                    },
                  ].map((item) => (
                    <Stack key={item.label} spacing={1.2} sx={{ py: { xs: 3.5, md: 4.5 } }}>
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
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: sansBody,
                          fontWeight: 400,
                          fontSize: { xs: '0.96rem', md: '1rem' },
                          lineHeight: 1.68,
                          color: '#2C3E52',
                        }}
                      >
                        {item.body}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ============================================= */}
        {/* MOMENT 3: THE JOURNEY -- grounded, sand       */}
        {/* ============================================= */}
        <Box
          id="journey"
          sx={{
            position: 'relative',
            background: 'transparent',
            py: { xs: 11, md: 15 },
            overflow: 'hidden',
            color: '#10223C',
            scrollSnapAlign: 'start',
          }}
        >
          {/* Horizon glow */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 180,
              background: 'linear-gradient(180deg, rgba(224,122,63,0.07) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack spacing={1.4} sx={{ mb: { xs: 8, md: 11 }, maxWidth: 600 }}>
              <Typography
                sx={{
                  fontFamily: monoEyebrow,
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#C0612A',
                }}
              >
                The Compass Experience
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: navySerif,
                  fontWeight: 500,
                  fontSize: { xs: '2rem', md: '2.85rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  color: '#10223C',
                }}
              >
                Four steps.{' '}
                <Box component="span" sx={{ color: '#C0612A', fontStyle: 'italic', fontWeight: 400 }}>
                  One year. Real change.
                </Box>
              </Typography>
            </Stack>

            <Grid container spacing={{ xs: 5, md: 4 }}>
              {journeySteps.map((step) => (
                <Grid key={step.num} item xs={12} sm={6} md={3}>
                  <Stack spacing={2.4}>
                    <Typography
                      aria-hidden
                      sx={{
                        fontFamily: navySerif,
                        fontWeight: 600,
                        fontSize: '3.6rem',
                        lineHeight: 1,
                        letterSpacing: '-0.05em',
                        color: '#C0612A',
                        userSelect: 'none',
                      }}
                    >
                      {step.num}
                    </Typography>
                    <Typography
                      component="h3"
                      sx={{
                        fontFamily: navySerif,
                        fontWeight: 500,
                        fontSize: '1.5rem',
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        color: '#10223C',
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: sansBody,
                        fontWeight: 400,
                        fontSize: '0.95rem',
                        lineHeight: 1.68,
                        color: '#2C3E52',
                      }}
                    >
                      {step.body}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignSelf: 'flex-start',
                        px: 1.3, py: 0.45,
                        borderRadius: 999,
                        border: '1px solid rgba(15,28,46,0.28)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: monoEyebrow,
                          fontWeight: 700,
                          fontSize: '0.6rem',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'rgba(16,34,60,0.68)',
                        }}
                      >
                        {step.tag}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ============================================= */}
        {/* MOMENT 4: THE INVITATION -- closing gravitas  */}
        {/* ============================================= */}
        <Box
          sx={{
            position: 'relative',
            background: 'transparent',
            py: { xs: 13, md: 18 },
            textAlign: 'center',
            overflow: 'hidden',
            color: '#FFF8F0',
            scrollSnapAlign: 'start',
          }}
        >
          {/* Faint stars echo */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute', inset: 0,
              backgroundImage: starsBg,
              opacity: 0.12,
              pointerEvents: 'none',
            }}
          />
          {/* Warm glow center */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: '20%', left: '50%',
              transform: 'translateX(-50%)',
              width: 800, height: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(224,122,63,0.11) 0%, rgba(244,206,161,0.05) 45%, transparent 65%)',
              filter: 'blur(48px)',
              pointerEvents: 'none',
            }}
          />

          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack spacing={4} alignItems="center">
              <Stack spacing={1.4} alignItems="center" sx={{ pt: 1 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={handleBeginJourney}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    px: 4, py: 1.6,
                    borderRadius: 999,
                    bgcolor: '#E07A3F',
                    color: '#FFF8F0',
                    fontFamily: sansBody,
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.9,
                    boxShadow: '0 20px 48px rgba(224,122,63,0.36)',
                    transition: '180ms ease',
                    '&:hover': { bgcolor: '#C0612A', transform: 'translateY(-1px)' },
                  }}
                >
                  Begin Your Journey
                  <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: sansBody,
                    fontWeight: 500,
                    fontSize: '0.74rem',
                    color: 'rgba(255,248,240,0.32)',
                    letterSpacing: '0.02em',
                  }}
                >
                  Free to start &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; ~15 minutes
                </Typography>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* ── FOOTER ── */}
        <Box
          component="footer"
          sx={{
            bgcolor: '#060F22',
            borderTop: '1px solid rgba(244,206,161,0.08)',
            color: 'rgba(255,248,240,0.4)',
          }}
        >
          <Container maxWidth="xl" sx={{ py: { xs: 1.5, md: 1.8 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 0.75, md: 2 }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Typography
                sx={{
                  color: 'rgba(255,248,240,0.4)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.02em',
                }}
              >
                {`Copyright ${new Date().getFullYear()} North Star Partners. All rights reserved.`}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,248,240,0.36)',
                  fontSize: '0.76rem',
                  letterSpacing: '0.015em',
                }}
              >
                Privacy Policy &nbsp;|&nbsp; Terms of Use &nbsp;|&nbsp; Contact
              </Typography>
            </Stack>
          </Container>
        </Box>
      </Box>
      </>
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
              Privacy Policy &nbsp;|&nbsp; Terms of Use &nbsp;|&nbsp; Contact
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
