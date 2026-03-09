import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { allowDevBypass, showDevTools } from '../config/runtimeFlags';

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
      text: 'Focused intake that captures your leadership baseline.',
      points: [
        'Complete a guided intake in under ten minutes.',
        'Answer scenario prompts calibrated to your role.',
        'Map current habits to measurable leadership signals.',
        'Generate a clean baseline before any interpretation.',
        'Tag pressure patterns so trends are visible early.',
        'Lock your starting profile for side-by-side progress checks.',
      ],
    },
    {
      title: 'Reflect',
      hero: '/heroreflect.png',
      text: 'Review your summary and trait priorities to clarify what matters.',
      points: [
        'Open a plain-language summary of your current pattern.',
        'Compare trade-offs across your highest-impact traits.',
        'Sort traits by urgency, lift potential, and effort.',
        'Translate findings into language you can use with your team.',
        'Pin two to three priorities for the next growth cycle.',
        'Set a reflection checkpoint cadence before moving forward.',
      ],
    },
    {
      title: 'Calibrate',
      hero: '/herocalibrate.png',
      text: 'Self and team assessments calibrate perspective against lived reality.',
      points: [
        'Run self and team views on the same trait framework.',
        'Surface agreement and gap areas with side-by-side scoring.',
        'Highlight blind spots where perception diverges most.',
        'Weight repeated feedback patterns above one-off noise.',
        'Convert calibration findings into focused behavior targets.',
        'Create alignment language for more productive conversations.',
      ],
    },
    {
      title: 'Embark',
      hero: '/heroembark.png',
      text: 'Launch a focused growth journey with action planning and momentum.',
      points: [
        'Build a campaign with milestones tied to selected traits.',
        'Assign actions with owners, timing, and clear outcomes.',
        'Track completion and signal movement in one dashboard view.',
        'Use structured check-ins to adjust based on live feedback.',
        'Capture wins and friction points after each sprint.',
        'Roll insights forward into the next development cycle.',
      ],
    },
  ];

  const methodologyCards = [
    {
      title: 'Mirror-Accurate',
      hero: '/herothink.png',
      text: 'Objective reflection of your current leadership approach.',
      points: [
        'Compares your responses across scenario clusters.',
        'Flags trait patterns that appear consistently under pressure.',
        'Shows strengths and tradeoffs in clear language.',
        'Builds a grounded baseline before campaign planning.',
      ],
    },
    {
      title: 'Signal Over Noise',
      hero: '/heroreflect.png',
      text: 'Focuses your attention on the highest-impact shifts.',
      points: [
        'Sorts signals by impact and urgency, not volume.',
        'Removes low-value noise from decision making.',
        'Keeps your focus on the few moves that change outcomes.',
        'Connects each priority to practical behavior targets.',
      ],
    },
    {
      title: 'Built for Action',
      hero: '/heroembark.png',
      text: 'You leave with priorities you can apply immediately.',
      points: [
        'Turns reflection into specific next-step actions.',
        'Links each action to measurable progress markers.',
        'Defines cadence for check-ins and recalibration.',
        'Prepares a campaign path you can execute right away.',
      ],
    },
  ];

  const deliverablesCards = [
    {
      title: 'Reflection Summary',
      hero: '/heroreflect.png',
      text: 'A clear portrait of your leadership with practical context.',
      points: [
        'Snapshot of strengths, risks, and growth pressure points.',
        'Readable summary you can use in team conversations.',
        'Prioritized insights tied to real work conditions.',
        'Baseline ready for follow-up comparison.',
      ],
    },
    {
      title: 'Focus Traits',
      hero: '/herocalibrate.png',
      text: 'Five personalized growth traits tailored to your needs.',
      points: [
        'Trait stack ranked by lift potential and urgency.',
        'Each trait includes behavior-level guidance.',
        'Highlights where calibration with team input is needed.',
        'Creates focus for the next growth sprint.',
      ],
    },
    {
      title: 'Action Dashboard',
      hero: '/heroembark.png',
      text: 'Campaign details, milestones, and resources in one place.',
      points: [
        'Campaign plan with milestones and owners.',
        'Progress tracking against selected trait goals.',
        'Check-in rhythm with visible movement over time.',
        'Resources connected directly to current priorities.',
      ],
    },
  ];

  const currentCards =
    activeSection === 0
      ? processCards
      : activeSection === 1
        ? methodologyCards
        : deliverablesCards;

  const handleHeroSectionSelect = (sectionIdx) => {
    if (sectionIdx === activeSection) return;
    setTransitionDir(sectionIdx >= activeSection ? 'left' : 'right');
    setActiveSection(sectionIdx);
    setFlippedCards({});
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
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
                          borderRadius: 999,
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
                    minHeight: { xs: 118, md: 170 },
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
          py: { xs: 1.76, md: 2.64 },
          minHeight: { xs: 0, md: 430 },
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
                        height: { xs: 315, md: 347 },
                        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transformStyle: 'preserve-3d',
                        transform: flippedCards[idx] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        '@media (prefers-reduced-motion: reduce)': {
                          transition: 'none',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          borderRadius: 2,
                          border: '1px solid rgba(15,23,42,0.08)',
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 6px 20px rgba(15,23,42,0.06)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 1.5,
                        }}
                      >
                        {item.hero && (
                          <Box
                            component="img"
                            src={item.hero}
                            alt=""
                            aria-hidden
                            sx={{
                              width: { xs: 220, md: 270 },
                              height: 'auto',
                              objectFit: 'contain',
                              mx: 'auto',
                              display: 'block',
                            }}
                          />
                        )}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              top: '75%',
                              transform: 'translate(-50%, -50%)',
                              width: { xs: '66%', md: '72%' },
                              minHeight: { xs: 48, md: 54 },
                              borderRadius: 999,
                              bgcolor: 'rgba(236, 232, 224, 0.95)',
                              border: '1px solid rgba(15,31,50,0.08)',
                              boxShadow: '0 4px 12px rgba(15,31,50,0.08)',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              px: 1.25,
                              py: 0.6,
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 900,
                                fontSize: { xs: '1.45rem', md: '1.65rem' },
                                letterSpacing: '0.12em',
                                color: '#0F2B45',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                              }}
                            >
                              {item.title}
                            </Typography>
                          </Box>
                      </Box>
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          borderRadius: 2,
                          border: '1px solid rgba(15,23,42,0.08)',
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 6px 20px rgba(15,23,42,0.06)',
                          overflow: 'auto',
                          p: { xs: 1.5, md: 1.75 },
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box
                          sx={{
                            py: 1.1,
                            mb: 0.35,
                            minHeight: { xs: 62, md: 66 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: '1.3rem',
                              letterSpacing: '-0.015em',
                              color: '#0F1F32',
                              textAlign: 'center',
                            }}
                          >
                            {item.title}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            color: '#44566C',
                            fontSize: '1.02rem',
                            lineHeight: 1.5,
                            fontWeight: 500,
                            textAlign: 'center',
                            fontStyle: 'italic',
                          }}
                        >
                          {item.text}
                        </Typography>
                        <Stack spacing={0.42} sx={{ mt: 1.05 }}>
                          {item.points.map((point) => (
                            <Typography
                              key={point}
                              sx={{
                                color: '#526579',
                                fontSize: '0.93rem',
                                lineHeight: 1.42,
                                fontWeight: 500,
                                textAlign: 'center',
                              }}
                            >
                              {point}
                            </Typography>
                          ))}
                        </Stack>
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
            </Stack>
          )}
        </Stack>
      </Container>
      </Box>
    </Box>
  );
}

export default Home;