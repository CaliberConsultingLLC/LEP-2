import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import { isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';
import {
  TrendingUp,
  ContentCopy,
  Link as LinkIcon,
  Lock,
} from '@mui/icons-material';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

function CampaignVerify() {
  const navigate = useNavigate();
  const stagingHost = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
  const isStagingRuntime =
    stagingHost.includes('staging.northstarpartners.org') ||
    stagingHost.includes('compass-staging');
  const [selfCampaignLink, setSelfCampaignLink] = useState('');
  const [selfCampaignPassword, setSelfCampaignPassword] = useState('');
  const [teamCampaignLink, setTeamCampaignLink] = useState('');
  const [teamCampaignPassword, setTeamCampaignPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [selfCampaignId, setSelfCampaignId] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({ selfLink: false, selfPassword: false, teamLink: false, teamPassword: false });
  const [selfCompleted, setSelfCompleted] = useState(false);

  const parseJson = (raw, fallback) => {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

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

  const buildCampaignSignature = (campaign) => {
    const normalized = Array.isArray(campaign)
      ? campaign.map((traitItem) => ({
          traitId: traitItem?.traitId || '',
          traitName: traitItem?.traitName || '',
          title: traitItem?.title || '',
          statements: Array.isArray(traitItem?.statements)
            ? traitItem.statements.map((stmt) => String(stmt || '').trim())
            : [],
        }))
      : [];
    return JSON.stringify(normalized);
  };

  const buildCampaignLinks = (origin, records) => ({
    selfLink: `${origin}/campaign/${records.selfCampaignId}`,
    teamLink: `${origin}/campaign/${records.teamCampaignId}`,
  });

  const persistCampaignBundle = async ({ userInfo, campaignData, records }) => {
    const uid = String(auth?.currentUser?.uid || userInfo?.uid || '').trim();
    if (!uid) return;

    const normalizedRecords = {
      ...records,
      selfCompleted: Boolean(
        records?.selfCompleted
        || localStorage.getItem(`selfCampaignCompleted_${records?.selfCampaignId}`) === 'true'
      ),
      savedAt: new Date().toISOString(),
    };

    await setDoc(
      doc(db, 'responses', uid),
      {
        ownerUid: uid,
        ownerEmail: String(userInfo?.email || '').trim(),
        ownerName: String(userInfo?.name || '').trim(),
        campaignBundle: {
          campaignRecords: normalizedRecords,
          currentCampaign: Array.isArray(campaignData) ? campaignData : [],
          savedAt: normalizedRecords.savedAt,
        },
      },
      { merge: true }
    );
  };

  const applyCampaignRecords = (records, campaignData = null) => {
    const { selfLink, teamLink } = buildCampaignLinks(window.location.origin, records);
    setSelfCampaignId(records.selfCampaignId || '');
    setSelfCampaignLink(records.selfCampaignLink || selfLink);
    setSelfCampaignPassword(records.selfCampaignPassword || '');
    setTeamCampaignLink(records.teamCampaignLink || teamLink);
    setTeamCampaignPassword(records.teamCampaignPassword || '');
    const completed = Boolean(
      records?.selfCompleted
      || localStorage.getItem(`selfCampaignCompleted_${records.selfCampaignId}`) === 'true'
    );
    setSelfCompleted(completed);
    localStorage.setItem('selfCampaignCompleted', completed ? 'true' : 'false');
    if (records?.selfCampaignId) {
      localStorage.setItem(`selfCampaignCompleted_${records.selfCampaignId}`, completed ? 'true' : 'false');
    }
    if (Array.isArray(campaignData) && campaignData.length) {
      localStorage.setItem('currentCampaign', JSON.stringify(campaignData));
    }
    localStorage.setItem(
      'campaignRecords',
      JSON.stringify({
        ...records,
        selfCompleted: completed,
        selfCampaignLink: records.selfCampaignLink || selfLink,
        teamCampaignLink: records.teamCampaignLink || teamLink,
      })
    );
  };

  useEffect(() => {
    const generateCampaigns = async () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : { name: '', email: '' };
        const ownerId = String(userInfo?.email || userInfo?.name || 'anonymous').trim().toLowerCase();
        setUserEmail(userInfo.email || '');

        const campaignData = normalizeCampaignItems(parseJson(localStorage.getItem('currentCampaign'), []));

        if (!isCampaignReady(campaignData)) {
          setError('No campaign data found. Please return to the campaign builder.');
          setIsGenerating(false);
          return;
        }

        const selfCampaign = campaignData.map((traitItem) => ({
          ...traitItem,
          statements: (traitItem?.statements || []).map((stmt) => toSelfStatement(stmt)),
        }));
        const campaignSignature = buildCampaignSignature(campaignData);

        const existingRecords = parseJson(localStorage.getItem('campaignRecords'), null);
        const matchesExistingCampaign =
          existingRecords
          && existingRecords.ownerId === ownerId
          && existingRecords.campaignSignature === campaignSignature
          && existingRecords.selfCampaignId
          && existingRecords.teamCampaignId
          && existingRecords.selfCampaignPassword
          && existingRecords.teamCampaignPassword;

        if (matchesExistingCampaign) {
          applyCampaignRecords(existingRecords, campaignData);
          persistCampaignBundle({ userInfo, campaignData, records: existingRecords }).catch((persistErr) => {
            console.warn('Failed to persist existing campaign bundle:', persistErr);
          });
          setError(null);
          setIsGenerating(false);
          return;
        }

        const bundleId = `bundle_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const selfPasswordGenerated = generatePassword(8);
        const teamPasswordGenerated = generatePassword(8);

        let selfCampaignId = '';
        let teamCampaignId = '';

        try {
          const selfDocRef = await addDoc(collection(db, 'campaigns'), {
            userInfo,
            ownerId,
            ownerUid: userInfo?.uid || null,
            bundleId,
            campaignType: 'self',
            campaign: selfCampaign,
            password: selfPasswordGenerated,
            createdAt: new Date(),
          });

          const teamDocRef = await addDoc(collection(db, 'campaigns'), {
            userInfo,
            ownerId,
            ownerUid: userInfo?.uid || null,
            bundleId,
            campaignType: 'team',
            campaign: campaignData,
            password: teamPasswordGenerated,
            createdAt: new Date(),
            selfCampaignId: selfDocRef.id,
          });
          selfCampaignId = selfDocRef.id;
          teamCampaignId = teamDocRef.id;
        } catch (persistErr) {
          const code = String(persistErr?.code || '').toLowerCase();
          const message = String(persistErr?.message || '').toLowerCase();
          const isPermissionErr = code.includes('permission-denied') || message.includes('insufficient permissions');
          if (!(isStagingRuntime && isPermissionErr)) throw persistErr;

          // Staging-only fallback: keep flow moving without Firestore auth.
          selfCampaignId = `stg-self-${bundleId}`;
          teamCampaignId = `stg-team-${bundleId}`;
          const localCampaignDocs = JSON.parse(localStorage.getItem('localCampaignDocs') || '{}');
          localCampaignDocs[selfCampaignId] = {
            userInfo,
            ownerId,
            ownerUid: userInfo?.uid || null,
            bundleId,
            campaignType: 'self',
            campaign: selfCampaign,
            password: selfPasswordGenerated,
            createdAt: new Date().toISOString(),
          };
          localCampaignDocs[teamCampaignId] = {
            userInfo,
            ownerId,
            ownerUid: userInfo?.uid || null,
            bundleId,
            campaignType: 'team',
            campaign: campaignData,
            password: teamPasswordGenerated,
            createdAt: new Date().toISOString(),
            selfCampaignId,
          };
          localStorage.setItem('localCampaignDocs', JSON.stringify(localCampaignDocs));
          console.warn('[CampaignVerify] Staging fallback activated: campaign docs stored locally.');
        }

        const selfLink = `${window.location.origin}/campaign/${selfCampaignId}`;
        const teamLink = `${window.location.origin}/campaign/${teamCampaignId}`;

        setSelfCampaignId(selfCampaignId);
        setSelfCampaignLink(selfLink);
        setSelfCampaignPassword(selfPasswordGenerated);
        setTeamCampaignLink(teamLink);
        setTeamCampaignPassword(teamPasswordGenerated);
        const completed = localStorage.getItem(`selfCampaignCompleted_${selfCampaignId}`) === 'true';
        setSelfCompleted(completed);
        localStorage.setItem('selfCampaignCompleted', completed ? 'true' : 'false');

        const records = {
          bundleId,
          ownerId,
          ownerUid: userInfo?.uid || null,
          campaignSignature,
          selfCampaignId,
          teamCampaignId,
          selfCampaignLink: selfLink,
          selfCampaignPassword: selfPasswordGenerated,
          teamCampaignLink: teamLink,
          teamCampaignPassword: teamPasswordGenerated,
          selfCompleted: completed,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('currentCampaign', JSON.stringify(campaignData));
        localStorage.setItem('campaignRecords', JSON.stringify(records));
        persistCampaignBundle({ userInfo, campaignData, records }).catch((persistErr) => {
          console.warn('Failed to persist campaign bundle:', persistErr);
        });
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

  if (isGenerating) {
    return (
      <LoadingScreen
        title="Building your campaign transition..."
        subtitle="Creating your personal benchmark campaign and team campaign access."
      />
    );
  }

  // ── Cairn theme render ──────────────────────────────────────────────────────
  if (useCairnTheme) {
    const CopyButton = ({ text, type, label }) => (
      <Box
        component="button" type="button"
        onClick={() => copyToClipboard(text, type)}
        sx={{
          all: 'unset', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          px: '14px', py: '8px', borderRadius: 999,
          border: '1px solid var(--sand-200, #E8DBC3)',
          bgcolor: copied[type] ? 'var(--navy-900, #10223C)' : 'white',
          color: copied[type] ? 'var(--amber-soft, #F4CEA1)' : 'var(--ink-soft, #44566C)',
          fontFamily: '"Manrope", sans-serif', fontWeight: 600, fontSize: '0.8rem',
          transition: '200ms ease',
          '&:hover': { bgcolor: 'var(--sand-50, #FBF7F0)' },
          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.4)', outlineOffset: 2 },
        }}
      >
        {copied[type] ? '✓ Copied' : label}
      </Box>
    );

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail />
        <CompassLayout progress={86}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Heading */}
            <Box>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--orange, #E07A3F)', mb: 0.75 }}>
                Your Next Move
              </Typography>
              <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.1rem' }, lineHeight: 1.1, color: 'var(--navy-900, #10223C)', mb: 0.5 }}>
                Campaign is Ready
              </Typography>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.95rem', color: 'var(--ink-soft, #44566C)', lineHeight: 1.6 }}>
                Complete your personal benchmark first, then share the team campaign link with your team.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ fontFamily: '"Manrope", sans-serif' }}>{error}</Alert>}

            {/* Self campaign card */}
            <Box sx={{ bgcolor: 'white', borderRadius: '16px', border: '1px solid var(--sand-200, #E8DBC3)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'var(--orange, #E07A3F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>1</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy-900, #10223C)', lineHeight: 1.2 }}>
                    Your Personal Benchmark
                  </Typography>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.82rem', color: 'var(--ink-soft, #44566C)' }}>
                    Rate yourself on the same statements your team will see.
                  </Typography>
                </Box>
              </Box>

              <Box
                component="button" type="button"
                onClick={() => navigate(`/campaign/${selfCampaignId}`)}
                sx={{
                  all: 'unset', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  px: '24px', py: '13px', borderRadius: 999, mb: 2.5,
                  bgcolor: 'var(--navy-900, #10223C)', color: 'var(--amber-soft, #F4CEA1)',
                  fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: '0.95rem',
                  boxShadow: '0 6px 20px rgba(16,34,60,0.22)',
                  transition: '180ms ease',
                  '&:hover': { bgcolor: 'var(--navy-800, #162A44)', transform: 'translateY(-1px)' },
                  '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.4)', outlineOffset: 3 },
                }}
              >
                <TrendingUp sx={{ fontSize: 18 }} />
                Start My Growth Campaign
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '10px', bgcolor: 'var(--sand-50, #FBF7F0)', border: '1px solid var(--sand-200, #E8DBC3)' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-soft, #44566C)', mb: 0.3 }}>
                    Self-Assessment Link
                  </Typography>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.82rem', color: 'var(--navy-900, #10223C)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selfCampaignLink || 'Generating…'}
                  </Typography>
                </Box>
                <CopyButton text={selfCampaignLink} type="selfLink" label="Copy Link" />
              </Box>

              {selfCompleted && (
                <Box sx={{ mt: 1.5 }}>
                  <Box
                    component="button" type="button"
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      all: 'unset', cursor: 'pointer', fontFamily: '"Manrope", sans-serif', fontWeight: 600, fontSize: '0.88rem', color: 'var(--orange, #E07A3F)', display: 'inline-flex', alignItems: 'center', gap: '6px',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Continue to Dashboard →
                  </Box>
                </Box>
              )}
            </Box>

            {/* Team campaign card */}
            <Box sx={{
              bgcolor: 'white', borderRadius: '16px',
              border: `1px solid ${selfCompleted ? 'var(--sand-200, #E8DBC3)' : 'var(--sand-100, #F3EAD8)'}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              p: { xs: 2.5, md: 3 },
              opacity: selfCompleted ? 1 : 0.65,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: selfCompleted ? 'var(--navy-500, #3F647B)' : 'var(--sand-200, #E8DBC3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: selfCompleted ? '#fff' : 'var(--ink-soft, #44566C)', fontWeight: 700, fontSize: '1rem' }}>2</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy-900, #10223C)', lineHeight: 1.2 }}>
                    Team Campaign {selfCompleted ? '(Unlocked)' : '(Complete benchmark first)'}
                  </Typography>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.82rem', color: 'var(--ink-soft, #44566C)' }}>
                    Share this link with your team once your benchmark is done.
                  </Typography>
                </Box>
              </Box>

              {selfCompleted ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '10px', bgcolor: 'var(--sand-50, #FBF7F0)', border: '1px solid var(--sand-200, #E8DBC3)' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-soft, #44566C)', mb: 0.3 }}>Team Link</Typography>
                      <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.82rem', color: 'var(--navy-900, #10223C)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamCampaignLink}</Typography>
                    </Box>
                    <CopyButton text={teamCampaignLink} type="teamLink" label="Copy Link" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '10px', bgcolor: 'var(--sand-50, #FBF7F0)', border: '1px solid var(--sand-200, #E8DBC3)' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-soft, #44566C)', mb: 0.3 }}>Team Password</Typography>
                      <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.82rem', color: 'var(--navy-900, #10223C)' }}>{teamCampaignPassword}</Typography>
                    </Box>
                    <CopyButton text={teamCampaignPassword} type="teamPassword" label="Copy" />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'var(--sand-100, #F3EAD8)', border: '1px solid var(--sand-200, #E8DBC3)' }}>
                  <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.88rem', color: 'var(--ink-soft, #44566C)', fontStyle: 'italic' }}>
                    Complete your personal benchmark to unlock the team campaign link.
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Dashboard credentials */}
            <Box sx={{ px: 1 }}>
              <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontSize: '0.82rem', color: 'var(--ink-soft, #44566C)' }}>
                Dashboard sign-in: <strong>{userEmail || '—'}</strong> · Use your account password.
              </Typography>
            </Box>
          </Box>
        </CompassLayout>
      </Box>
    );
  }
  // ── End cairn theme render ──────────────────────────────────────────────────

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        ...(useCairnTheme
          ? { bgcolor: 'var(--sand-50, #FBF7F0)' }
          : {
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
              '&:after': {
                content: '""',
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
              },
            }),
      }}
    >
      <ProcessTopRail />
      <CompassLayout progress={71}>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 3, sm: 4 },
          px: useCairnTheme ? 0 : { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: useCairnTheme ? '100%' : '100vw',
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
              Your Next Move
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
              Your campaign is built. Complete your personal benchmark first, then share the team campaign.
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
                <Paper sx={{ p: 2.2, borderRadius: 2, border: '1px solid rgba(224,122,63,0.28)', background: 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(255,248,238,0.9))' }}>
                  <Stack spacing={1.3}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: 'text.primary' }}>
                      Complete your personal benchmark campaign
                    </Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', color: 'text.secondary', lineHeight: 1.6 }}>
                      This is the same campaign structure your team will see, but rewritten in first person so you can score yourself directly.
                      We store your benchmark responses separately from team responses and use that comparison in Perception Gap metrics.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3}>
                      <Button
                        variant="contained"
                        startIcon={<TrendingUp />}
                        onClick={() => navigate(`/campaign/${selfCampaignId}`)}
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

                <Stack spacing={0.6}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'text.primary' }}>Dashboard credentials</Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: 'text.secondary' }}>
                    Email: {userEmail || '—'} | Password: Use the password you created during sign up.
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Box>
      </Container>
      </CompassLayout>
    </Box>
  );
}

export default CampaignVerify;
