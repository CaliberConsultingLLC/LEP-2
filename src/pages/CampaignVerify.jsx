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
import { useCairnTheme } from '../config/runtimeFlags';
import { isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';
import { finishDemoCampaign, isDemoSession } from '../utils/demoMode';
import { buttons, colors, fonts, radii, surfaces } from '../styles/tokens';
import CampaignStageHeader, { stageType } from '../components/CampaignStageCopy';
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
  const allowStagingPersistenceBypass = useCairnTheme || isStagingRuntime;
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
      .replace(/\bmy leader\b/gi, 'I')
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
          if (isDemoSession()) {
            finishDemoCampaign();
          } else {
            persistCampaignBundle({ userInfo, campaignData, records: existingRecords }).catch((persistErr) => {
              console.warn('Failed to persist existing campaign bundle:', persistErr);
            });
          }
          setError(null);
          setIsGenerating(false);
          return;
        }

        const bundleId = `bundle_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const selfPasswordGenerated = generatePassword(8);
        const teamPasswordGenerated = generatePassword(8);

        let selfCampaignId = '';
        let teamCampaignId = '';

        if (isDemoSession()) {
          selfCampaignId = `demo-self-${bundleId}`;
          teamCampaignId = `demo-team-${bundleId}`;
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
        } else {
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
          if (!(allowStagingPersistenceBypass && isPermissionErr)) throw persistErr;

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
        }

        const selfLink = `${window.location.origin}/campaign/${selfCampaignId}`;
        const teamLink = `${window.location.origin}/campaign/${teamCampaignId}`;
        localStorage.setItem(`campaign_${selfCampaignId}`, JSON.stringify({
          userInfo,
          ownerId,
          ownerUid: userInfo?.uid || null,
          bundleId,
          campaignType: 'self',
          campaign: selfCampaign,
          password: selfPasswordGenerated,
          selfCampaignId,
          teamCampaignId,
          surveyClosed: false,
          createdAt: new Date().toISOString(),
        }));
        localStorage.setItem(`campaign_${teamCampaignId}`, JSON.stringify({
          userInfo,
          ownerId,
          ownerUid: userInfo?.uid || null,
          bundleId,
          campaignType: 'team',
          campaign: campaignData,
          password: teamPasswordGenerated,
          accessToken: allowStagingPersistenceBypass ? 'stage-team-token' : '',
          selfCampaignId,
          teamCampaignId,
          surveyClosed: false,
          createdAt: new Date().toISOString(),
        }));
        if (allowStagingPersistenceBypass) {
          localStorage.setItem(`teamCampaignAccess_${teamCampaignId}`, 'granted');
        }

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
        if (isDemoSession()) {
          finishDemoCampaign();
        } else {
          persistCampaignBundle({ userInfo, campaignData, records }).catch((persistErr) => {
            console.warn('Failed to persist campaign bundle:', persistErr);
          });
        }
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

  // Re-sync unlock state when returning from the self-assessment.
  useEffect(() => {
    const syncSelfCompleted = () => {
      try {
        const records = parseJson(localStorage.getItem('campaignRecords'), null);
        const id = String(records?.selfCampaignId || selfCampaignId || '').trim();
        if (!id) return;
        const completed = Boolean(
          records?.selfCompleted
          || localStorage.getItem(`selfCampaignCompleted_${id}`) === 'true'
          || localStorage.getItem('selfCampaignCompleted') === 'true'
        );
        setSelfCompleted(completed);
        if (completed && records && !records.selfCompleted) {
          const next = { ...records, selfCompleted: true };
          localStorage.setItem('campaignRecords', JSON.stringify(next));
        }
      } catch {
        // Ignore sync failures; unlock state will retry on next focus.
      }
    };

    syncSelfCompleted();
    window.addEventListener('focus', syncSelfCompleted);
    document.addEventListener('visibilitychange', syncSelfCompleted);
    return () => {
      window.removeEventListener('focus', syncSelfCompleted);
      document.removeEventListener('visibilitychange', syncSelfCompleted);
    };
  }, [selfCampaignId]);

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
          px: '14px', py: '8px',           borderRadius: radii.pill,
          border: `1px solid ${colors.sand200}`,
          bgcolor: copied[type] ? colors.navy900 : colors.surface1,
          color: copied[type] ? colors.amberSoft : colors.inkSoft,
          fontFamily: fonts.sans, fontWeight: 600, fontSize: '0.8rem',
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
        <ProcessTopRail
          chapterId={selfCompleted ? 'assessments' : 'campaign'}
          activeStepId={selfCompleted ? 'team' : 'verify'}
          chip={{ variant: 'sequence', label: 'Statements', current: 0, total: 0 }}
        />
        <CompassLayout afterTopbar>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 2,
              width: '100%',
              maxWidth: 640,
              mx: 'auto',
            }}
          >
            <Box sx={{ width: '100%' }}>
              <CampaignStageHeader
                eyebrow="Review & Send"
                title={isDemoSession() ? 'Your campaign is ready' : 'Self-assessment'}
                subtitle={isDemoSession()
                  ? 'Sample team answers are in so Signal, Evidence, Practice, and Journey are open. Nothing here is a live team survey.'
                  : 'Rate yourself on the same statements your team will see, then invite them. Do not share the self-assessment link with your team.'}
              />
            </Box>

            {error && <Alert severity="error" sx={{ fontFamily: fonts.sans, width: '100%', textAlign: 'left' }}>{error}</Alert>}

            {isDemoSession() ? (
              <Box sx={{ ...surfaces.card, p: { xs: 2.5, md: 3 }, width: '100%', textAlign: 'left' }}>
                <Typography sx={{ ...stageType.cardLabel }}>Demo dashboard</Typography>
                <Typography sx={{ ...stageType.body, mb: 2.5 }}>
                  Open the rooms and walk the prompting output on this campaign. Exit from the banner whenever you are done.
                </Typography>
                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    finishDemoCampaign();
                    navigate('/dashboard');
                  }}
                  sx={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    ...buttons.primary,
                    borderRadius: radii.pill,
                  }}
                >
                  Open the dashboard
                </Box>
              </Box>
            ) : (
              <>
            {/* Self campaign card */}
            <Box sx={{ ...surfaces.card, p: { xs: 2.25, md: 2.75 }, width: '100%', textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: radii.circle, bgcolor: colors.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: colors.surface1, fontWeight: 700, fontSize: '0.9rem' }}>1</Typography>
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography sx={{ ...stageType.statement, fontSize: 18, lineHeight: 1.2 }}>
                    Self-assessment
                  </Typography>
                  <Typography sx={stageType.cardBody}>
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
                  ...buttons.primary,
                  mb: 1.75,
                }}
              >
                <TrendingUp sx={{ fontSize: 17 }} />
                Start self-assessment
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1.5, ...surfaces.cardInner, bgcolor: colors.sand50, textAlign: 'left' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...stageType.cardLabel, mb: 0.3, color: colors.inkSoft }}>
                    For you, not for your team
                  </Typography>
                  <Typography sx={{ ...stageType.cardBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selfCampaignLink || 'Generating…'}
                  </Typography>
                </Box>
                <CopyButton text={selfCampaignLink} type="selfLink" label="Copy Link" />
              </Box>

              {selfCompleted && (
                <Box sx={{ mt: 1.35 }}>
                  <Box
                    component="button" type="button"
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      all: 'unset', cursor: 'pointer', fontFamily: '"Manrope", sans-serif', fontWeight: 600, fontSize: '0.84rem', color: 'var(--orange, #E07A3F)', display: 'inline-flex', alignItems: 'center', gap: '6px',
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
              ...surfaces.card,
              p: { xs: 2.25, md: 2.75 },
              width: '100%',
              textAlign: 'left',
              opacity: selfCompleted ? 1 : 0.65,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: radii.circle, bgcolor: selfCompleted ? colors.green : colors.sand200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: selfCompleted ? colors.surface1 : colors.inkSoft, fontWeight: 700, fontSize: '0.9rem' }}>2</Typography>
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography sx={{ ...stageType.statement, fontSize: 18, lineHeight: 1.2 }}>
                    Team invite {selfCompleted ? '(Unlocked)' : '(Locked)'}
                  </Typography>
                  <Typography sx={stageType.cardBody}>
                    {selfCompleted
                      ? 'Share this link with your team. It is a different link than the one above.'
                      : 'This unlocks after you finish your self-assessment.'}
                  </Typography>
                </Box>
              </Box>

              {selfCompleted ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.15 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1.5, ...surfaces.cardInner, bgcolor: colors.sand50, textAlign: 'left' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ ...stageType.cardLabel, mb: 0.3, color: colors.inkSoft }}>Team Link</Typography>
                      <Typography sx={{ ...stageType.cardBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamCampaignLink}</Typography>
                    </Box>
                    <CopyButton text={teamCampaignLink} type="teamLink" label="Copy Link" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1.5, ...surfaces.cardInner, bgcolor: colors.sand50, textAlign: 'left' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ ...stageType.cardLabel, mb: 0.3, color: colors.inkSoft }}>Team Password</Typography>
                      <Typography sx={stageType.cardBody}>{teamCampaignPassword}</Typography>
                    </Box>
                    <CopyButton text={teamCampaignPassword} type="teamPassword" label="Copy" />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 1.5, ...surfaces.cardInner, bgcolor: colors.sand100 }}>
                  <Typography sx={{ ...stageType.subtitle, textAlign: 'left', mx: 0 }}>
                    Finish your self-assessment first. The team link stays locked until then.
                  </Typography>
                </Box>
              )}
            </Box>
              </>
            )}

            {!isDemoSession() && (
            <Box sx={{ px: 1 }}>
              <Typography sx={stageType.cardBody}>
                Dashboard sign-in: <strong>{userEmail || '—'}</strong> · Use your account password.
              </Typography>
            </Box>
            )}
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
      <ProcessTopRail
        chapterId={selfCompleted ? 'assessments' : 'campaign'}
        activeStepId={selfCompleted ? 'team' : 'verify'}
        chip={{ variant: 'sequence', label: 'Statements', current: 0, total: 0 }}
      />
      <CompassLayout>
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
        <Box sx={{ width: '100%', maxWidth: 1180 }}>
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
              Self-assessment
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
              Rate yourself on the same statements your team will see, then invite them. Do not share the self-assessment link with your team.
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
                      Start your self-assessment
                    </Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', color: 'text.secondary', lineHeight: 1.6 }}>
                      This is the same campaign structure your team will see, rewritten so you can score yourself. Team responses stay separate.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3}>
                      <Button
                        variant="contained"
                        startIcon={<TrendingUp />}
                        onClick={() => navigate(`/campaign/${selfCampaignId}`)}
                        sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', fontWeight: 700, px: 2.2, py: 1 }}
                      >
                        Start self-assessment
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
                    Team invite {selfCompleted ? '(Unlocked)' : '(Locked until self-assessment is done)'}
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
