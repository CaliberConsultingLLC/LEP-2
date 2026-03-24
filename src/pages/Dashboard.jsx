import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Campaign,
  Assessment,
  Insights,
  Lightbulb,
  Map,
  HelpOutline,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import ResultsTab from './Dashboard/ResultsTab';
import ActionTabStaging from './Dashboard/ActionTabStaging';
import JourneyTab from './Dashboard/JourneyTab';
import GrowthCampaignTab from './Dashboard/GrowthCampaignTab';
import ProcessTopRail from '../components/ProcessTopRail';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(0);
  const [navExpanded, setNavExpanded] = useState(false);
  const DASH_FONT = '"Montserrat", "Inter", "Segoe UI", sans-serif';
  const [selectedAgent, setSelectedAgent] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('latestFormData') || '{}');
      return stored?.selectedAgent || 'balancedMentor';
    } catch {
      return 'balancedMentor';
    }
  });
  const CONTENT_MAX_WIDTH = 1180;
  const agentOptions = [
    { id: 'balancedMentor', name: 'Balanced Mentor' },
    { id: 'comedyRoaster', name: 'Comedy Roaster' },
    { id: 'bluntPracticalFriend', name: 'Blunt Practical Friend' },
    { id: 'formalEmpatheticCoach', name: 'Formal Empathetic Coach' },
    { id: 'pragmaticProblemSolver', name: 'Pragmatic Problem Solver' },
    { id: 'highSchoolCoach', name: 'High School Coach' },
  ];

  const handleAgentChange = (event) => {
    const nextAgent = event.target.value;
    setSelectedAgent(nextAgent);
    try {
      const stored = JSON.parse(localStorage.getItem('latestFormData') || '{}');
      localStorage.setItem(
        'latestFormData',
        JSON.stringify({ ...stored, selectedAgent: nextAgent })
      );
    } catch {
      localStorage.setItem(
        'latestFormData',
        JSON.stringify({ selectedAgent: nextAgent })
      );
    }
  };

  const navItems = [
    {
      label: 'Campaign Details',
      subtitle: 'Use this page to monitor your campaign rollout, track participation, and stay on pace with response goals. You can open each campaign round, confirm timing windows, and quickly see where follow-up is needed.',
      icon: Campaign,
    },
    {
      label: 'Campaign Results',
      subtitle: 'Interpret your campaign data through trait-level scoring, effort-versus-efficacy gaps, and overall performance trends. Use this page to spot where outcomes are improving, where friction persists, and which patterns require immediate attention.',
      icon: Assessment,
    },
    {
      label: 'Detailed Results',
      subtitle: 'Inspect statement-level scoring with five-ring breakdowns and question-specific efficacy and effort patterns. Use this page to drill into the precise items shaping each trait outcome.',
      icon: Insights,
    },
    {
      label: 'Building Your Growth Plan',
      subtitle: 'Translate your insight data into concrete leadership moves your team will actually feel. This page helps you define focused actions by trait, verify progress commitments, and keep your execution anchored to measurable behavior change.',
      icon: Lightbulb,
    },
    {
      label: 'My Journey',
      subtitle: 'Follow your leadership development path as campaign cycles and verified actions build over time. This view helps you visualize momentum, capture key milestones, and document how your decisions shape long-term growth.',
      icon: Map,
    },
  ];

  useEffect(() => {
    const tab = String(new URLSearchParams(location.search || '').get('tab') || '').trim().toLowerCase();
    if (!tab) return;

    const tabIndexByKey = {
      'campaign-details': 0,
      campaign: 0,
      'campaign-results': 1,
      results: 1,
      'detailed-results': 2,
      detailed: 2,
      'growth-plan': 3,
      plan: 3,
      'my-journey': 4,
      journey: 4,
    };

    if (Object.prototype.hasOwnProperty.call(tabIndexByKey, tab)) {
      setCurrentTab(tabIndexByKey[tab]);
    }
  }, [location.search]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        color: 'text.primary',
        overflowX: 'hidden',
        '& .MuiTypography-root, & .MuiButton-root, & .MuiChip-root, & .MuiInputBase-root, & .MuiTableCell-root, & .MuiMenuItem-root': {
          fontFamily: `${DASH_FONT} !important`,
          letterSpacing: '0 !important',
        },
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage:
            'linear-gradient(120deg, rgba(14,26,40,0.86), rgba(22,38,56,0.84)), url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0)',
        },
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            'radial-gradient(860px 420px at 84% 18%, rgba(61,90,120,0.22), transparent 66%), radial-gradient(620px 360px at 8% 52%, rgba(63,92,121,0.2), transparent 74%)',
        },
      }}
    >
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left Ribbon Navigation */}
        <Box
          onMouseEnter={() => setNavExpanded(true)}
          onMouseLeave={() => setNavExpanded(false)}
          sx={{
            width: navExpanded ? 258 : 86,
            transition: 'width 180ms cubic-bezier(.2,.8,.2,1)',
            borderRight: '1px solid rgba(73,101,129,0.34)',
            bgcolor: 'rgba(58,82,108,0.72)',
            backdropFilter: 'blur(14px)',
            px: 1.1,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            height: '100vh',
            zIndex: 5,
          }}
        >
          <Stack spacing={1.1} sx={{ mt: 9 }}>
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = currentTab === idx;
              return (
                <Button
                  key={item.label}
                  onClick={() => setCurrentTab(idx)}
                  sx={{
                    minHeight: 54,
                    justifyContent: navExpanded ? 'flex-start' : 'center',
                    gap: navExpanded ? 1.2 : 0,
                    px: navExpanded ? 1.25 : 0.8,
                    borderRadius: 2.1,
                    border: '1px solid',
                    borderColor: active ? 'rgba(224,122,63,0.78)' : 'rgba(230,240,250,0.26)',
                    bgcolor: active ? 'rgba(224,122,63,0.18)' : 'rgba(255,255,255,0.08)',
                    color: 'rgba(246,250,255,0.95)',
                    textTransform: 'none',
                    overflow: 'hidden',
                    '&:hover': {
                      bgcolor: active ? 'rgba(224,122,63,0.24)' : 'rgba(255,255,255,0.14)',
                      borderColor: active ? 'rgba(224,122,63,0.9)' : 'rgba(230,240,250,0.34)',
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 22, minWidth: 22 }} />
                  <Box
                    sx={{
                      opacity: navExpanded ? 1 : 0,
                      width: navExpanded ? 'auto' : 0,
                      transition: 'opacity 0.18s ease',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '1.03rem',
                        fontWeight: 700,
                        lineHeight: 1.05,
                        color: 'inherit',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Stack>
          <Divider
            sx={{
              mt: 1.5,
              mb: 1.2,
              borderColor: 'rgba(230,240,250,0.24)',
            }}
          />
          <Box sx={{ px: navExpanded ? 0.2 : 0 }}>
            {navExpanded ? (
              <FormControl size="small" fullWidth>
                <InputLabel
                  id="agent-persona-select-label"
                  sx={{ color: 'rgba(236,244,252,0.86)' }}
                >
                  Coach Persona
                </InputLabel>
                <Select
                  labelId="agent-persona-select-label"
                  label="Coach Persona"
                  value={selectedAgent}
                  onChange={handleAgentChange}
                  sx={{
                    color: 'rgba(248,252,255,0.96)',
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(230,240,250,0.28)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(230,240,250,0.45)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'secondary.main',
                    },
                    '.MuiSvgIcon-root': { color: 'rgba(235,245,253,0.82)' },
                  }}
                >
                  {agentOptions.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Button
                sx={{
                  minHeight: 40,
                  width: '100%',
                  minWidth: 0,
                  borderRadius: 2,
                  border: '1px solid rgba(230,240,250,0.24)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(248,252,255,0.92)',
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                }}
                onClick={() => setNavExpanded(true)}
              >
                Coach
              </Button>
            )}
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, minWidth: 0, ml: navExpanded ? '258px' : '86px', transition: 'margin-left 180ms cubic-bezier(.2,.8,.2,1)', position: 'relative' }}>
          {/* Top Banner */}
          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              py: 2.5,
              borderBottom: '1px solid rgba(73,101,129,0.34)',
              bgcolor: 'rgba(58,82,108,0.72)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src="/CompassLogo.png"
                alt="Compass logo"
                sx={{
                  width: { xs: 56, md: 66 },
                  height: { xs: 56, md: 66 },
                  objectFit: 'contain',
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: { xs: '1.5rem', md: '1.72rem' },
                  fontWeight: 800,
                  color: 'rgba(248,252,255,0.96)',
                  lineHeight: 1.05,
                }}
              >
                Compass Dashboard
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.4} alignItems="center">
              <ProcessTopRail embedded showBrand={false} />
              <Button
                variant="outlined"
                startIcon={<HelpOutline />}
                onClick={() => navigate('/faq')}
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: 'rgba(248,252,255,0.94)',
                  borderColor: 'rgba(230,240,250,0.38)',
                  '&:hover': {
                    borderColor: 'rgba(230,240,250,0.7)',
                    bgcolor: 'rgba(255,255,255,0.12)',
                  },
                }}
              >
                Help
              </Button>
            </Stack>
          </Box>

          {/* Content */}
          <Box sx={{ px: { xs: 2, md: 3.5 }, py: 2.4 }}>
            <Box sx={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>
              {currentTab !== 4 && currentTab !== 3 && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2.2,
                    borderRadius: 2.5,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.94), rgba(240,246,255,0.88))',
                    boxShadow: '0 8px 22px rgba(15,23,42,0.14)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: { xs: '1.28rem', md: '1.44rem' },
                      fontWeight: 800,
                      color: 'text.primary',
                    }}
                  >
                    {navItems[currentTab]?.label}
                  </Typography>
                  <Divider sx={{ my: 1.1, borderColor: 'rgba(69,112,137,0.25)' }} />
                  <Typography
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.95rem',
                      color: 'text.secondary',
                    }}
                  >
                    {navItems[currentTab]?.subtitle}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 1.8 }}>
                {currentTab === 0 && <GrowthCampaignTab />}
                {currentTab === 1 && <ResultsTab view="compass" selectedAgent={selectedAgent} />}
                {currentTab === 2 && <ResultsTab view="detailed" selectedAgent={selectedAgent} />}
                {currentTab === 3 && (
            <ActionTabStaging selectedAgent={selectedAgent} onOpenJourney={() => setCurrentTab(4)} />
                )}
                {currentTab === 4 && <JourneyTab />}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
