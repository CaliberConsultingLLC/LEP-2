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

function JourneyStoryAnimation({ stage = 0 }) {
  const metaByStage = [
    {
      title: 'Leadership Intake',
      subtitle: 'The hero responds, and those signals form a leadership map.',
    },
    {
      title: 'Reflection Results',
      subtitle: 'The hero checks the compass, then looks ahead with clarity.',
    },
    {
      title: 'Trait Selection',
      subtitle: 'At the fork, the hero selects the growth path to pursue.',
    },
    {
      title: 'Growth Campaign',
      subtitle: 'Backpack on, the hero starts the trail and builds momentum.',
    },
  ];
  const meta = metaByStage[stage] || metaByStage[0];

  const HeroGlyph = ({ x = 0, y = 0, withBackpack = false, walk = false, armOut = false }) => (
    <g transform={`translate(${x} ${y})`}>
      {withBackpack && <rect x="-15" y="-1" width="10" height="24" rx="3" fill="#31536A" />}
      <circle cx="0" cy="-16" r="7.5" fill="#F2C6A6" />
      <rect x="-7" y="-8" width="14" height="22" rx="5" fill="#1E3550" />
      <line x1="-6" y1="-2" x2="-13" y2={armOut ? '-12' : '8'} stroke="#1E3550" strokeWidth="4" strokeLinecap="round" />
      <line x1="6" y1="-2" x2="13" y2={armOut ? '-12' : '8'} stroke="#1E3550" strokeWidth="4" strokeLinecap="round" />
      <line
        x1="-4"
        y1="14"
        x2="-7"
        y2="28"
        stroke="#1E3550"
        strokeWidth="4"
        strokeLinecap="round"
        style={
          walk
            ? { animation: 'heroStepA 1s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: '50% 0%' }
            : undefined
        }
      />
      <line
        x1="4"
        y1="14"
        x2="7"
        y2="28"
        stroke="#1E3550"
        strokeWidth="4"
        strokeLinecap="round"
        style={
          walk
            ? { animation: 'heroStepB 1s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: '50% 0%' }
            : undefined
        }
      />
    </g>
  );

  return (
    <Box
      aria-hidden
      sx={{
        mt: 1.05,
        mb: 0.85,
        borderRadius: 1.6,
        border: '1px solid rgba(63,100,123,0.22)',
        background: 'linear-gradient(180deg, rgba(237,244,251,0.95), rgba(247,250,255,0.95))',
        p: 0.95,
        overflow: 'hidden',
        '@keyframes mapDraw': {
          '0%': { strokeDashoffset: 220, opacity: 0.35 },
          '22%': { strokeDashoffset: 160, opacity: 0.65 },
          '100%': { strokeDashoffset: 0, opacity: 1 },
        },
        '@keyframes flowPulse': {
          '0%, 100%': { opacity: 0.16, transform: 'scale(0.86)' },
          '50%': { opacity: 1, transform: 'scale(1.08)' },
        },
        '@keyframes compassSweep': {
          '0%, 15%': { transform: 'rotate(-24deg)' },
          '45%': { transform: 'rotate(8deg)' },
          '75%': { transform: 'rotate(-6deg)' },
          '100%': { transform: 'rotate(28deg)' },
        },
        '@keyframes horizonGlow': {
          '0%, 100%': { opacity: 0.25 },
          '50%': { opacity: 0.62 },
        },
        '@keyframes branchPulse': {
          '0%, 100%': { stroke: '#8CA6BA', strokeWidth: 3 },
          '50%': { stroke: '#E07A3F', strokeWidth: 4.2 },
        },
        '@keyframes heroMove': {
          '0%, 14%': { transform: 'translateX(0px)' },
          '40%': { transform: 'translateX(3px)' },
          '72%': { transform: 'translateX(0px)' },
          '100%': { transform: 'translateX(2px)' },
        },
        '@keyframes heroStepA': {
          '0%, 100%': { transform: 'rotate(-7deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
        '@keyframes heroStepB': {
          '0%, 100%': { transform: 'rotate(8deg)' },
          '50%': { transform: 'rotate(-7deg)' },
        },
      }}
    >
      <Box sx={{ borderRadius: 1.2, overflow: 'hidden', border: '1px solid rgba(63,100,123,0.20)', bgcolor: '#F7FAFE' }}>
        <svg viewBox="0 0 360 170" width="100%" height="100%">
          <defs>
            <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8AA8BE" />
              <stop offset="100%" stopColor="#3F647B" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="360" height="170" fill="#EFF5FC" />
          <rect x="0" y="128" width="360" height="42" fill="#E7EEF7" />

          {stage === 0 && (
            <>
              <rect x="208" y="28" width="122" height="96" rx="8" fill="#FFFFFF" stroke="#B8CCDC" />
              <path d="M220 42 L318 42 L318 56 L226 56 M226 70 L312 70 M226 82 L292 82" fill="none" stroke="#8EAAC0" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: 220, animation: 'mapDraw 10s linear infinite' }} />
              <path d="M80 98 C126 92, 156 84, 206 76" fill="none" stroke="url(#trailGrad)" strokeWidth="3.5" strokeDasharray="4 8" style={{ strokeDashoffset: 40, animation: 'mapDraw 10s linear infinite' }} />
              {[0, 1, 2, 3, 4].map((idx) => (
                <circle key={idx} cx={112 + idx * 21} cy={92 - idx * 3} r="3.4" fill="#E07A3F" style={{ animation: 'flowPulse 1.6s ease-in-out infinite', animationDelay: `${idx * 0.22}s` }} />
              ))}
              <g style={{ animation: 'heroMove 3.8s ease-in-out infinite' }}>
                <HeroGlyph x={74} y={96} armOut />
              </g>
            </>
          )}

          {stage === 1 && (
            <>
              <path d="M182 126 L236 64 L290 126 Z" fill="#D7E5F2" stroke="#A9C0D4" />
              <path d="M228 126 L272 76 L316 126 Z" fill="#C8DCEE" stroke="#A0B9CF" />
              <circle cx="274" cy="76" r="18" fill="#FFFFFF" stroke="#9CB5C9" style={{ animation: 'horizonGlow 2.8s ease-in-out infinite' }} />
              <g transform="translate(118 92)">
                <HeroGlyph x={0} y={0} armOut />
                <g transform="translate(22 -2)">
                  <circle cx="0" cy="0" r="11" fill="#FFFFFF" stroke="#7E9BB2" strokeWidth="2.4" />
                  <line x1="0" y1="0" x2="0" y2="-8" stroke="#E07A3F" strokeWidth="2.3" strokeLinecap="round" style={{ animation: 'compassSweep 2.8s ease-in-out infinite', transformOrigin: '0px 0px' }} />
                </g>
              </g>
            </>
          )}

          {stage === 2 && (
            <>
              <path d="M170 126 C182 104, 198 86, 220 68" fill="none" stroke="#A5BCD0" strokeWidth="3" />
              <path d="M170 126 C198 108, 228 106, 266 106" fill="none" stroke="#A5BCD0" strokeWidth="3" />
              <path d="M170 126 C196 102, 222 84, 248 52" fill="none" stroke="#E07A3F" strokeLinecap="round" style={{ animation: 'branchPulse 2.4s ease-in-out infinite' }} />
              <circle cx="248" cy="52" r="9" fill="#E07A3F" opacity="0.88" />
              <circle cx="266" cy="106" r="8" fill="#8CA6BA" />
              <g style={{ animation: 'heroMove 3.2s ease-in-out infinite' }}>
                <HeroGlyph x={162} y={124} armOut />
              </g>
              <path d="M166 118 L186 102" stroke="#E07A3F" strokeWidth="2.8" strokeLinecap="round" />
            </>
          )}

          {stage === 3 && (
            <>
              <path d="M34 126 C104 130, 142 108, 198 102 C236 98, 286 108, 330 132" fill="none" stroke="#98B4C9" strokeWidth="4" />
              <path d="M38 132 C106 138, 144 116, 198 110 C234 106, 281 116, 326 140" fill="none" stroke="#DDE8F3" strokeWidth="4" />
              <g style={{ animation: 'heroMove 2.6s ease-in-out infinite' }}>
                <HeroGlyph x={134} y={118} withBackpack walk />
              </g>
              <path d="M220 110 C244 98, 272 96, 304 112" fill="none" stroke="#E07A3F" strokeWidth="3.2" strokeDasharray="6 7" style={{ animation: 'mapDraw 2.6s linear infinite' }} />
            </>
          )}
        </svg>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.45, mt: 0.65 }}>
        {[0, 1, 2, 3].map((idx) => (
          <Box key={idx} sx={{ height: 5, borderRadius: 999, flex: 1, bgcolor: idx <= stage ? 'rgba(63,100,123,0.52)' : 'rgba(63,100,123,0.16)' }} />
        ))}
      </Box>

      <Typography sx={{ mt: 0.6, fontSize: '0.76rem', fontWeight: 700, color: '#304A62', letterSpacing: '0.01em' }}>
        {meta.title}
      </Typography>
      <Typography sx={{ mt: 0.1, fontSize: '0.72rem', color: '#4D647A', lineHeight: 1.45 }}>
        {meta.subtitle}
      </Typography>
    </Box>
  );
}

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
          journeyStage: 0,
          bullets: [
            'Captures meaningful patterns without overwhelming you.',
            'Balances context and day-to-day realities.',
          ],
        },
        {
          icon: <Psychology sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Reflection Results',
          text: 'A grounded view of strengths, tensions, and trajectory.',
          journeyStage: 1,
          bullets: [
            'Shows where you are now and what comes next.',
            'Delivered in practical, clear language.',
          ],
        },
        {
          icon: <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Trait Selection',
          text: 'Choose the growth traits that best fit your current team reality.',
          journeyStage: 2,
          bullets: [
            'Prioritizes practical growth over generic advice.',
            'Turns awareness into clear decisions.',
          ],
        },
        {
          icon: <Inventory2 sx={{ fontSize: 32, color: 'primary.main' }} />,
          title: 'Growth Campaign',
          text: 'Build your campaign and track progress in the dashboard.',
          journeyStage: 3,
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
                      src="/compass-how-it-works-demo.mp4"
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
                  {activeSection === 1 && (
                    <JourneyStoryAnimation stage={item.journeyStage ?? 0} />
                  )}
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