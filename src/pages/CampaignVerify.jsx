import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Card,
  Alert,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import {
  Person,
  ListAlt,
  Insights,
  BuildCircle,
  AssignmentTurnedIn,
  Send,
  Assessment,
  TrendingUp,
  Flag,
  CheckCircle,
  ContentCopy,
  Link as LinkIcon,
  Lock,
} from '@mui/icons-material';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function CampaignVerify() {
  const navigate = useNavigate();
  const [selfCampaignLink, setSelfCampaignLink] = useState('');
  const [selfCampaignPassword, setSelfCampaignPassword] = useState('');
  const [teamCampaignLink, setTeamCampaignLink] = useState('');
  const [teamCampaignPassword, setTeamCampaignPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [selfCampaignId, setSelfCampaignId] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({ selfLink: false, selfPassword: false, teamLink: false, teamPassword: false });
  const [selfCompleted, setSelfCompleted] = useState(false);

  const generatePassword = (length = 10) => {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
  };

  const toSelfStatement = (statement) => {
    let text = String(statement || '').trim();
    if (!text) return '';

    text = text
      .replace(/\bBrian\b/gi, 'I')
      .replace(/\bthe leader\b/gi, 'I')
      .replace(/\byour leader\b/gi, 'I')
      .replace(/\btheir\b/gi, 'my')
      .replace(/\bthem\b/gi, 'me')
      .replace(/\bthemselves\b/gi, 'myself')
      .replace(/\bthey\b/gi, 'I');

    if (!/\b(I|me|my|mine|myself)\b/i.test(text)) {
      const lowered = text.charAt(0).toLowerCase() + text.slice(1);
      text = `I ${lowered}`;
    }

    // light grammar cleanup for common third-person verbs after "I"
    text = text.replace(/\bI\s+([a-z]+)s\b/gi, (_, verb) => `I ${verb}`);
    return text;
  };

  useEffect(() => {
    const generateCampaigns = async () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : { name: '', email: '' };
        const ownerId = String(userInfo?.email || userInfo?.name || 'anonymous').trim().toLowerCase();
        const storedCredentialsStr = localStorage.getItem('dashboardCredentials');
        const storedCredentials = storedCredentialsStr ? JSON.parse(storedCredentialsStr) : null;
        const dashboardPassword = storedCredentials?.password || generatePassword(10);

        setUserEmail(userInfo.email || '');
        setUserPassword(dashboardPassword);
        localStorage.setItem('dashboardCredentials', JSON.stringify({
          email: userInfo.email || '',
          password: dashboardPassword,
        }));

        const campaignData = JSON.parse(localStorage.getItem('currentCampaign') || '[]');

        if (campaignData.length === 0) {
          setError('No campaign data found. Please return to the campaign builder.');
          setIsGenerating(false);
          return;
        }

        const selfCampaign = campaignData.map((traitItem) => ({
          ...traitItem,
          statements: (traitItem?.statements || []).map((stmt) => toSelfStatement(stmt)),
        }));

        const bundleId = `bundle_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const selfPasswordGenerated = generatePassword(8);
        const teamPasswordGenerated = generatePassword(8);

        const selfDocRef = await addDoc(collection(db, 'campaigns'), {
          userInfo,
          ownerId,
          bundleId,
          campaignType: 'self',
          campaign: selfCampaign,
          password: selfPasswordGenerated,
          createdAt: new Date(),
        });

        const teamDocRef = await addDoc(collection(db, 'campaigns'), {
          userInfo,
          ownerId,
          bundleId,
          campaignType: 'team',
          campaign: campaignData,
          password: teamPasswordGenerated,
          createdAt: new Date(),
          selfCampaignId: selfDocRef.id,
        });

        const selfLink = `${window.location.origin}/campaign/${selfDocRef.id}?mode=self`;
        const teamLink = `${window.location.origin}/campaign/${teamDocRef.id}`;

        setSelfCampaignId(selfDocRef.id);
        setSelfCampaignLink(selfLink);
        setSelfCampaignPassword(selfPasswordGenerated);
        setTeamCampaignLink(teamLink);
        setTeamCampaignPassword(teamPasswordGenerated);
        setSelfCompleted(localStorage.getItem(`selfCampaignCompleted_${selfDocRef.id}`) === 'true');

        localStorage.setItem(
          'campaignRecords',
          JSON.stringify({
            bundleId,
            ownerId,
            selfCampaignId: selfDocRef.id,
            teamCampaignId: teamDocRef.id,
            selfCampaignLink: selfLink,
            selfCampaignPassword: selfPasswordGenerated,
            teamCampaignLink: teamLink,
            teamCampaignPassword: teamPasswordGenerated,
            createdAt: new Date().toISOString(),
          })
        );
        setError(null);
      } catch (err) {
        console.error('Error generating campaigns:', err);
        setError('Failed to generate campaign transition flow. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateCampaigns();
  }, []);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const timeline = useMemo(
    () => [
      { label: 'Profile', icon: Person, state: 'complete' },
      { label: 'Intake', icon: ListAlt, state: 'complete' },
      { label: 'Insights', icon: Insights, state: 'complete' },
      { label: 'Campaign Build', icon: BuildCircle, state: 'complete' },
      { label: 'Your Growth Campaign', icon: AssignmentTurnedIn, state: selfCompleted ? 'complete' : 'current' },
      { label: 'Team Campaign Launch', icon: Send, state: selfCompleted ? 'current' : 'upcoming' },
      { label: 'Results Dashboard', icon: Assessment, state: 'upcoming' },
      { label: 'Plan + Journey', icon: Flag, state: 'upcoming' },
    ],
    [selfCompleted]
  );

  if (isGenerating) {
    return (
      <LoadingScreen
        title="Building your campaign transition..."
        subtitle="Creating your personal benchmark campaign and team campaign access."
      />
    );
  }

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
      <ProcessTopRail />
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
          <Box sx={{ textAlign: 'center', mb: 3.2 }}>
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: { xs: '1.9rem', md: '2.25rem' },
                fontWeight: 800,
                mb: 1.2,
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Campaign Built. Your Benchmark Comes First.
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: { xs: '1rem', md: '1.08rem' },
                color: 'rgba(255,255,255,0.9)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              You completed reflection and campaign build. Next, you take your own growth campaign first, so Compass can compare your self-ratings against your team later.
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
            {error ? (
              <Alert severity="error" sx={{ fontFamily: 'Gemunu Libre, sans-serif', mb: 3 }}>
                {error}
              </Alert>
            ) : (
              <Stack spacing={2.4}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(69,112,137,0.22)',
                    bgcolor: 'rgba(255,255,255,0.75)',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 1.2 }}>
                    <CheckCircle sx={{ color: 'primary.main', fontSize: 24 }} />
                    <Typography
                      sx={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: 'text.primary',
                      }}
                    >
                      Progress Path
                    </Typography>
                  </Stack>
                  <Box sx={{ overflowX: 'auto', py: 0.4 }}>
                    <Stack direction="row" alignItems="center" spacing={0.9} sx={{ minWidth: 950, px: 0.4 }}>
                      {timeline.map((step, idx) => {
                        const Icon = step.icon;
                        const isComplete = step.state === 'complete';
                        const isCurrent = step.state === 'current';
                        return (
                          <React.Fragment key={step.label}>
                            <Card
                              sx={{
                                width: 156,
                                minHeight: 122,
                                p: 1.2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: isCurrent
                                  ? 'rgba(224,122,63,0.8)'
                                  : isComplete
                                    ? 'rgba(47,133,90,0.5)'
                                    : 'rgba(69,112,137,0.3)',
                                background: isCurrent
                                  ? 'linear-gradient(180deg, rgba(255,241,226,0.95), rgba(255,230,206,0.88))'
                                  : isComplete
                                    ? 'linear-gradient(180deg, rgba(230,249,239,0.9), rgba(220,245,233,0.82))'
                                    : 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(238,245,252,0.8))',
                                boxShadow: isCurrent ? '0 6px 14px rgba(224,122,63,0.2)' : '0 4px 10px rgba(0,0,0,0.08)',
                              }}
                            >
                              <Stack spacing={0.7} alignItems="center" textAlign="center">
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: isCurrent ? '#E07A3F' : isComplete ? '#2F855A' : '#457089',
                                    color: 'white',
                                  }}
                                >
                                  <Icon sx={{ fontSize: 18 }} />
                                </Box>
                                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.15 }}>
                                  {step.label}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={isCurrent ? 'Current' : isComplete ? 'Complete' : 'Upcoming'}
                                  sx={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    bgcolor: isCurrent ? 'rgba(224,122,63,0.18)' : isComplete ? 'rgba(47,133,90,0.16)' : 'rgba(69,112,137,0.12)',
                                  }}
                                />
                              </Stack>
                            </Card>
                            {idx < timeline.length - 1 && (
                              <Box sx={{ width: 18, height: 2, bgcolor: 'rgba(69,112,137,0.46)', flexShrink: 0 }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </Stack>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2.2, borderRadius: 2, border: '1px solid rgba(224,122,63,0.28)', background: 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(255,248,238,0.9))' }}>
                  <Stack spacing={1.3}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: 'text.primary' }}>
                      Your next move: complete your personal benchmark campaign
                    </Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', color: 'text.secondary', lineHeight: 1.6 }}>
                      This is the same campaign structure your team will see, but rewritten in first person so you can score yourself directly.
                      We store your benchmark responses separately from team responses and use that comparison in Perception Gap metrics.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3}>
                      <Button
                        variant="contained"
                        startIcon={<TrendingUp />}
                        onClick={() => navigate(`/campaign/${selfCampaignId}?mode=self`)}
                        sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700, px: 2.2, py: 1 }}
                      >
                        Start My Growth Campaign
                      </Button>
                      {selfCompleted && (
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/dashboard')}
                          sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700, px: 2.2, py: 1 }}
                        >
                          Continue to Dashboard
                        </Button>
                      )}
                    </Stack>
                    <TextField
                      fullWidth
                      value={selfCampaignLink}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => copyToClipboard(selfCampaignLink, 'selfLink')} edge="end" sx={{ color: 'primary.main' }}>
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
                      sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Montserrat, sans-serif', bgcolor: 'rgba(255,255,255,0.92)' } }}
                    />
                    <TextField
                      fullWidth
                      value={selfCampaignPassword}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => copyToClipboard(selfCampaignPassword, 'selfPassword')} edge="end" sx={{ color: 'primary.main' }}>
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
                      sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Montserrat, sans-serif', bgcolor: 'rgba(255,255,255,0.92)' } }}
                    />
                    {copied.selfLink && <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: 'primary.main' }}>Personal benchmark link copied.</Typography>}
                    {copied.selfPassword && <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: 'primary.main' }}>Personal benchmark password copied.</Typography>}
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2.1, borderRadius: 2, border: '1px solid rgba(69,112,137,0.24)', bgcolor: 'rgba(255,255,255,0.84)' }}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.06rem', color: 'text.primary', mb: 1 }}>
                    Team Campaign Access {selfCompleted ? '(Unlocked)' : '(Locked until your benchmark is complete)'}
                  </Typography>
                  <Stack spacing={1.2}>
                    <TextField
                      fullWidth
                      value={selfCompleted ? teamCampaignLink : 'Complete your personal campaign to unlock this link'}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton disabled={!selfCompleted} onClick={() => copyToClipboard(teamCampaignLink, 'teamLink')} edge="end" sx={{ color: 'primary.main' }}>
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
                      sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Montserrat, sans-serif', bgcolor: 'rgba(255,255,255,0.92)' } }}
                    />
                    <TextField
                      fullWidth
                      value={selfCompleted ? teamCampaignPassword : 'Locked'}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton disabled={!selfCompleted} onClick={() => copyToClipboard(teamCampaignPassword, 'teamPassword')} edge="end" sx={{ color: 'primary.main' }}>
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
                      sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Montserrat, sans-serif', bgcolor: 'rgba(255,255,255,0.92)' } }}
                    />
                    {copied.teamLink && <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: 'primary.main' }}>Team link copied.</Typography>}
                    {copied.teamPassword && <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: 'primary.main' }}>Team password copied.</Typography>}
                  </Stack>
                </Paper>

                <Divider />

                <Stack spacing={0.6}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'text.primary' }}>Dashboard credentials</Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: 'text.secondary' }}>
                    Email: {userEmail || '—'} | Password: {userPassword || '—'}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default CampaignVerify;
