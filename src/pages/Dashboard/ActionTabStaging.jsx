import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Add, ArrowForward, AutoAwesome, Remove } from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';
import { getActionPlanGuide } from '../../data/actionPlanGuides.js';
import { auth, db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFakeDashboardData } from '../../config/runtimeFlags';
import {
  getDashboardCampaignRows,
  normalizeDashboardScore,
  parseDashboardJson,
} from '../../utils/dashboardData.js';

const { CORE_TRAITS } = traitSystem;

const parseJson = (raw, fallback = null) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const trimText = (value) => String(value || '').trim();
const clampGoalScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const toPercent = (value) => normalizeDashboardScore(value);

const safeAverage = (values) => {
  if (!Array.isArray(values) || !values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
};

const buildSeedPlan = (traitId, subTraitId) => ({
  commitment: '',
  guidedAnswers: {},
  items: [],
  updatedAt: '',
  planVersion: 'staging-v5',
  seedKey: `${traitId}-${subTraitId}`,
});

const getTraitFromName = (traitName) =>
  CORE_TRAITS.find((trait) => String(trait?.name || '').toLowerCase() === String(traitName || '').toLowerCase());

const summarizeSignal = ({ efficacy, effort, delta, compassScore }) => {
  if (efficacy < 6 && effort >= 6.5) {
    return {
      label: 'Heavy effort, weak landing',
      tone: '#C85A2A',
      description: 'The effort is there, but the team may not be feeling the lift yet.',
    };
  }
  if (efficacy >= 7.4 && effort < 5.8) {
    return {
      label: 'Strength to protect',
      tone: '#2F855A',
      description: 'This is already landing well. The move here is protecting the standard.',
    };
  }
  if (delta >= 1.3) {
    return {
      label: 'Perception tension',
      tone: '#E07A3F',
      description: 'Intent and visible impact may be drifting apart in this area.',
    };
  }
  if (compassScore < 6.2) {
    return {
      label: 'Low traction zone',
      tone: '#9B2C2C',
      description: 'This is one of the clearest places to create a felt change for your team.',
    };
  }
  return {
    label: 'Buildable opportunity',
    tone: '#457089',
    description: 'There is traction here, but a sharper move could make it more dependable.',
  };
};

function buildJourneyItems(plan, guidedSteps) {
  const items = [];
  const g = plan.guidedAnswers && typeof plan.guidedAnswers === 'object' ? plan.guidedAnswers : {};
  const pushIfPresent = (text) => {
    const t = trimText(text);
    if (t) {
      items.push({
        id: `item-${items.length + 1}-${Date.now()}`,
        text: t,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const commitment = trimText(g.behaviorCommitment || g.commitment || plan.commitment);
  pushIfPresent(commitment);

  if (g.goalEffort || g.goalEfficacy) {
    const effortText = g.goalEffort ? `Effort ${g.goalEffort}` : null;
    const efficacyText = g.goalEfficacy ? `Efficacy ${g.goalEfficacy}` : null;
    pushIfPresent(`Score goals: ${[effortText, efficacyText].filter(Boolean).join(' / ')}`);
  }

  pushIfPresent(g.visibleSignal ? `Visible team signal: ${g.visibleSignal}` : '');
  pushIfPresent(g.learningTraining ? `Learning / training: ${g.learningTraining}` : '');

  (guidedSteps || []).forEach((step) => {
    if (step.id === 'commitment' || step.id === 'behaviorCommitment' || step.id === 'goalEffort' || step.id === 'goalEfficacy' || step.id === 'visibleSignal') return;
    const a = trimText(g[step.id]);
    if (a) pushIfPresent(a);
  });

  return items.slice(0, 8);
}

function ActionTabStaging({ selectedAgent = 'balancedMentor', onOpenJourney }) {
  const [plans, setPlans] = useState({});
  const [selectedTraitKey, setSelectedTraitKey] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [campaignRows, setCampaignRows] = useState(() => getDashboardCampaignRows());
  const [teamResponses, setTeamResponses] = useState(() => (useFakeDashboardData ? fakeData.responses : []));

  const userInfo = useMemo(() => parseJson(localStorage.getItem('userInfo'), {}), []);
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  const teamCampaignClosed = useMemo(() => {
    const records = parseJson(localStorage.getItem('campaignRecords'), {});
    return useFakeDashboardData || String(records?.teamCampaignClosed || '').toLowerCase() === 'true';
  }, []);
  const currentCampaignId = useMemo(() => {
    const records = parseDashboardJson(localStorage.getItem('campaignRecords'), {});
    return String(records?.teamCampaignId || '123').trim() || '123';
  }, []);

  const traitRows = useMemo(() => {
    const campaign = campaignRows.length ? campaignRows : (fakeCampaign?.campaign_123?.campaign || []);
    return campaign
      .map((campaignTrait, traitIndex) => {
        const trait = getTraitFromName(campaignTrait?.trait);
        if (!trait) return null;
        const subTrait =
          trait?.subTraits?.find(
            (item) => String(item?.name || '').toLowerCase() === String(campaignTrait?.subTrait || '').toLowerCase()
          ) || trait?.subTraits?.[0];
        if (!subTrait) return null;

        const efficacyValues = [];
        const effortValues = [];
        teamResponses.forEach((response) => {
          for (let i = 0; i < 5; i += 1) {
            const statementIndex = traitIndex * 5 + i;
            const rating = response?.ratings?.[statementIndex] || response?.ratings?.[String(statementIndex)];
            if (rating) {
              efficacyValues.push(normalizeDashboardScore(rating?.efficacy));
              effortValues.push(normalizeDashboardScore(rating?.effort));
            }
          }
        });

        const efficacy = safeAverage(efficacyValues);
        const effort = safeAverage(effortValues);
        const compassScore = (efficacy * 2 + effort) / 3;
        const delta = Math.abs(effort - efficacy);
        const signal = summarizeSignal({ efficacy, effort, delta, compassScore });
        const plan = plans?.[trait.id]?.[subTrait.id] || buildSeedPlan(trait.id, subTrait.id);

        return {
          traitKey: campaignTrait.trait,
          subTraitLabel: campaignTrait.subTrait || subTrait.name,
          trait,
          subTrait,
          efficacy,
          effort,
          compassScore,
          delta,
          signal,
          plan,
        };
      })
      .filter(Boolean);
  }, [campaignRows, plans, teamResponses]);

  useEffect(() => {
    let active = true;

    const loadDashboardContext = async () => {
      try {
        const nextCampaignRows = getDashboardCampaignRows();
        if (active && nextCampaignRows.length) {
          setCampaignRows(nextCampaignRows);
        }

        const records = parseDashboardJson(localStorage.getItem('campaignRecords'), {});
        const teamCampaignId = String(records?.teamCampaignId || '').trim();
        const ownerUid = auth?.currentUser?.uid || null;
        if (!teamCampaignId || !ownerUid) {
          if (active) setTeamResponses(useFakeDashboardData ? fakeData.responses : []);
          return;
        }

        const teamSnap = await getDocs(
          query(collection(db, 'surveyResponses'), where('campaignId', '==', teamCampaignId), where('ownerUid', '==', ownerUid))
        );
        const nextResponses = teamSnap.docs.map((docSnap) => docSnap.data()).filter((entry) => entry?.ratings);
        if (active) {
          setTeamResponses(nextResponses.length ? nextResponses : (useFakeDashboardData ? fakeData.responses : []));
        }
      } catch (error) {
        console.error('Failed to load action-plan campaign context:', error);
        if (active) setTeamResponses(useFakeDashboardData ? fakeData.responses : []);
      }
    };

    loadDashboardContext();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const byCampaign = parseJson(localStorage.getItem('actionPlansByCampaign'), {});
      const savedForUser = byCampaign?.[currentCampaignId]?.[userKey]?.plans;
      if (savedForUser && typeof savedForUser === 'object') {
        setPlans(savedForUser);
        return;
      }

      const legacy = parseJson(localStorage.getItem('actionPlans'), {});
      const migrated = {};
      Object.entries(legacy || {}).forEach(([traitId, subTraits]) => {
        migrated[traitId] = {};
        Object.entries(subTraits || {}).forEach(([subTraitId, payload]) => {
          const seeded = buildSeedPlan(traitId, subTraitId);
          seeded.commitment = trimText(payload?.text);
          if (seeded.commitment) {
            seeded.guidedAnswers = { ...seeded.guidedAnswers, commitment: seeded.commitment };
          }
          seeded.updatedAt = payload?.createdAt || '';
          migrated[traitId][subTraitId] = seeded;
        });
      });
      setPlans(migrated);
    } catch (error) {
      console.error('Failed to load action plans:', error);
    }
  }, [currentCampaignId, userKey]);

  useEffect(() => {
    if (!selectedTraitKey && traitRows.length) {
      setSelectedTraitKey(traitRows[0].traitKey);
    }
  }, [selectedTraitKey, traitRows]);

  const activeRow = traitRows.find((row) => row.traitKey === selectedTraitKey) || traitRows[0] || null;
  const guide = activeRow ? getActionPlanGuide(activeRow.subTraitLabel) : getActionPlanGuide('');
  const activePlan = activeRow
    ? plans?.[activeRow.trait.id]?.[activeRow.subTrait.id] || buildSeedPlan(activeRow.trait.id, activeRow.subTrait.id)
    : buildSeedPlan('_', '_');

  const guidedAnswers = activePlan.guidedAnswers && typeof activePlan.guidedAnswers === 'object' ? activePlan.guidedAnswers : {};
  const currentEfficacyScore = activeRow ? clampGoalScore(toPercent(activeRow.efficacy)) : 0;
  const currentEffortScore = activeRow ? clampGoalScore(toPercent(activeRow.effort)) : 0;
  const currentOverallScore = activeRow ? clampGoalScore(toPercent(activeRow.compassScore)) : 0;
  const targetEfficacyScore = clampGoalScore(
    guidedAnswers.goalEfficacy == null || guidedAnswers.goalEfficacy === ''
      ? currentEfficacyScore
      : guidedAnswers.goalEfficacy
  );
  const targetEffortScore = clampGoalScore(
    guidedAnswers.goalEffort == null || guidedAnswers.goalEffort === ''
      ? currentEffortScore
      : guidedAnswers.goalEffort
  );
  const targetOverallScore = clampGoalScore(((targetEfficacyScore * 2) + targetEffortScore) / 3);
  const traitDescription = `${activeRow?.signal?.description || ''} ${guide?.friendlyNudge || ''}`.trim();

  const updatePlan = (traitId, subTraitId, updates) => {
    setPlans((prev) => ({
      ...prev,
      [traitId]: {
        ...prev?.[traitId],
        [subTraitId]: {
          ...buildSeedPlan(traitId, subTraitId),
          ...prev?.[traitId]?.[subTraitId],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const setGuidedAnswer = (stepId, value) => {
    if (!activeRow) return;
    const normalizedValue = ['goalEffort', 'goalEfficacy'].includes(stepId) ? clampGoalScore(value) : value;
    const next = { ...guidedAnswers, [stepId]: normalizedValue };
    const updates = { guidedAnswers: next };
    if (stepId === 'commitment' || stepId === 'behaviorCommitment') {
      updates.commitment = trimText(normalizedValue);
    }
    updatePlan(activeRow.trait.id, activeRow.subTrait.id, updates);
  };

  const savePlans = (openJourney = false) => {
    const sanitized = {};
    Object.entries(plans || {}).forEach(([traitId, subTraits]) => {
      const nextTrait = {};
      Object.entries(subTraits || {}).forEach(([subTraitId, rawPlan]) => {
        const merged = {
          ...buildSeedPlan(traitId, subTraitId),
          ...rawPlan,
          guidedAnswers: { ...(rawPlan?.guidedAnswers || {}) },
          updatedAt: new Date().toISOString(),
          planVersion: 'staging-v5',
        };
        const ga = {};
        Object.entries(merged.guidedAnswers || {}).forEach(([k, v]) => {
          const t = ['goalEffort', 'goalEfficacy'].includes(k) ? Number(v || 0) : trimText(v);
          if (['goalEffort', 'goalEfficacy'].includes(k)) {
            if (Number.isFinite(t) && t >= 0 && t <= 100) ga[k] = Math.round(t);
            return;
          }
          if (t) ga[k] = t;
        });
        merged.guidedAnswers = ga;
        merged.commitment = trimText(ga.behaviorCommitment || ga.commitment || merged.commitment);

        const traitMeta = CORE_TRAITS.find((t) => t.id === traitId);
        const subTraitMeta = traitMeta?.subTraits?.find((s) => s.id === subTraitId);
        const subName = subTraitMeta?.name || '';
        const g = getActionPlanGuide(subName);
        const journeyItems = buildJourneyItems(merged, g.guidedSteps);

        if (merged.commitment || journeyItems.length) {
          nextTrait[subTraitId] = { ...merged, items: journeyItems };
        }
      });
      if (Object.keys(nextTrait).length) sanitized[traitId] = nextTrait;
    });

    const all = parseJson(localStorage.getItem('actionPlansByCampaign'), {});
    if (!all[currentCampaignId]) all[currentCampaignId] = {};
    all[currentCampaignId][userKey] = {
      user: { name: userInfo?.name || '', email: userInfo?.email || '' },
      selectedAgent,
      planVersion: 'staging-v5',
      savedAt: new Date().toISOString(),
      plans: sanitized,
    };
    localStorage.setItem('actionPlansByCampaign', JSON.stringify(all));

    const legacyMirror = {};
    Object.entries(sanitized).forEach(([traitId, subTraits]) => {
      legacyMirror[traitId] = {};
      Object.entries(subTraits).forEach(([subTraitId, payload]) => {
        legacyMirror[traitId][subTraitId] = {
          text: payload?.commitment || payload?.items?.[0]?.text || '',
          verified: false,
          createdAt: payload?.updatedAt || new Date().toISOString(),
        };
      });
    });
    localStorage.setItem('actionPlans', JSON.stringify(legacyMirror));

    setSaveMessage(openJourney ? 'Plan saved and carried into My Journey.' : 'Plan saved for this user and campaign.');
    window.setTimeout(() => setSaveMessage(''), 1800);
    if (openJourney && typeof onOpenJourney === 'function') onOpenJourney();
  };

  if (!activeRow) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,253,0.9))',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', color: 'text.secondary' }}>
          No focus areas are ready for action planning yet.
        </Typography>
      </Paper>
    );
  }

  if (!teamCampaignClosed) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,253,0.9))',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.08rem', fontWeight: 700, color: 'text.primary', mb: 0.8 }}>
          Planning opens after survey close
        </Typography>
        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', color: 'text.secondary', lineHeight: 1.6 }}>
          Keep the Trailhead survey open while responses come in. Once you close it from the Growth Campaign dashboard, Compass will unlock the action-planning flow.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1080, mx: 'auto' }}>
      <Stack spacing={2}>
        <Paper
          sx={{
            p: { xs: 1.7, md: 2.1 },
            borderRadius: 1,
            border: '1px solid rgba(15,23,42,0.12)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,253,0.94))',
            boxShadow: '0 8px 22px rgba(15,23,42,0.08)',
          }}
        >
          <Stack spacing={1.3}>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 800, color: '#457089', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Plan of Attack
            </Typography>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', color: '#20384F', lineHeight: 1.58, maxWidth: 920 }}>
              Use this page to convert your campaign data into one focused growth plan. Select a trait tab, review what your team is experiencing, reflect on impact, define your root and branch shifts, then lock in measurable score targets you can carry into your journey.
            </Typography>
            <Tabs
              value={selectedTraitKey || false}
              onChange={(_, value) => setSelectedTraitKey(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 40,
                '& .MuiTabs-flexContainer': { gap: 0.8 },
                '& .MuiTabs-indicator': { display: 'none' },
              }}
            >
              {traitRows.map((row) => (
                <Tab
                  key={row.traitKey}
                  value={row.traitKey}
                  label={row.subTraitLabel}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    minHeight: 38,
                    borderRadius: 1,
                    border: '1px solid rgba(15,23,42,0.2)',
                    bgcolor: selectedTraitKey === row.traitKey ? '#457089' : 'rgba(255,255,255,0.96)',
                    color: selectedTraitKey === row.traitKey ? '#fff' : '#13263A',
                    '&.Mui-selected': { color: '#fff' },
                  }}
                />
              ))}
            </Tabs>
          </Stack>
        </Paper>

        <Divider sx={{ borderColor: 'rgba(95,119,142,0.2)' }} />

        <Paper
          sx={{
            p: { xs: 1.7, md: 2.1 },
            borderRadius: 1,
            border: '1px solid rgba(15,23,42,0.12)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,253,0.94))',
            boxShadow: '0 8px 22px rgba(15,23,42,0.08)',
          }}
        >
          <Stack spacing={1.2}>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.2rem', md: '1.45rem' }, fontWeight: 800, color: '#13263A' }}>
              {activeRow.subTraitLabel}
            </Typography>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: 'rgba(19,38,58,0.62)' }}>
              {activeRow.trait.name}
            </Typography>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: '#20384F', lineHeight: 1.58 }}>
              {traitDescription}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                gap: 1,
                pt: 0.35,
              }}
            >
              {[
                { label: 'Overall Score', value: currentOverallScore, color: '#243A53' },
                { label: 'Efficacy Score', value: currentEfficacyScore, color: '#5B8FA8' },
                { label: 'Effort Score', value: currentEffortScore, color: '#DE763A' },
              ].map((card) => (
                <Paper
                  key={card.label}
                  sx={{
                    p: 1.4,
                    borderRadius: 1,
                    border: '1px solid rgba(15,23,42,0.14)',
                    bgcolor: '#F2F5F8',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#364E64', mb: 0.4 }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                    {Number(card.value || 0).toFixed(1)}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Paper>

        <Divider sx={{ borderColor: 'rgba(95,119,142,0.2)' }} />

        <Card
          sx={{
            borderRadius: 1,
            border: '1px solid rgba(15,23,42,0.12)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,253,0.94))',
            boxShadow: '0 8px 22px rgba(15,23,42,0.08)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>
            <Stack spacing={1.65}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A' }}>
                Action Planning Process
              </Typography>

              <Paper sx={{ p: 1.5, borderRadius: 1, border: '1px solid rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.88)' }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #457089', color: '#457089', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
                      1
                    </Box>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.97rem', fontWeight: 800, color: '#13263A' }}>
                      Review & Reflect
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                    {`Envision you are a member of this team. What is one challenge that you might experience under a leader who struggles with ${activeRow.subTraitLabel}?`}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Describe the challenge from the team member perspective..."
                    value={guidedAnswers.reviewReflect ?? ''}
                    onChange={(e) => setGuidedAnswer('reviewReflect', e.target.value)}
                  />
                </Stack>
              </Paper>

              <Paper sx={{ p: 1.5, borderRadius: 1, border: '1px solid rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.88)' }}>
                <Stack spacing={1.1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #457089', color: '#457089', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
                      2
                    </Box>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.97rem', fontWeight: 800, color: '#13263A' }}>
                      Roots & Branches
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                    Root question: What education or training will you pursue to increase your understanding of this leadership concept?
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Name the education, training, or feedback source you will use..."
                    value={guidedAnswers.learningTraining ?? ''}
                    onChange={(e) => setGuidedAnswer('learningTraining', e.target.value)}
                  />
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                    Branch question: What is one behavior shift you will commit to in your effort to meet your team's needs?
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Describe one behavior shift you commit to..."
                    value={guidedAnswers.behaviorCommitment ?? ''}
                    onChange={(e) => setGuidedAnswer('behaviorCommitment', e.target.value)}
                  />
                </Stack>
              </Paper>

              <Paper sx={{ p: 1.5, borderRadius: 1, border: '1px solid rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.88)' }}>
                <Stack spacing={1.1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #457089', color: '#457089', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
                      3
                    </Box>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.97rem', fontWeight: 800, color: '#13263A' }}>
                      Lock In
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                    We measure what matters. Set your efficacy and effort targets, and your overall trait goal will update automatically.
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' },
                      gap: 1,
                    }}
                  >
                    <Paper sx={{ p: 1.35, borderRadius: 1, border: '1px solid rgba(15,23,42,0.14)', bgcolor: '#F2F5F8' }}>
                      <Stack spacing={0.8}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 800, color: '#243A53', letterSpacing: '0.04em' }}>
                          OVERALL TRAIT GOAL
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#243A53', lineHeight: 1 }}>
                          {targetOverallScore}
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: 'rgba(36,58,83,0.62)' }}>
                          Auto-adjusted from efficacy and effort
                        </Typography>
                      </Stack>
                    </Paper>

                    <Paper sx={{ p: 1.25, borderRadius: 1, border: '1px solid rgba(69,112,137,0.2)', bgcolor: '#F2F5F8' }}>
                      <Stack spacing={0.75}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 800, color: '#5B8FA8', letterSpacing: '0.04em' }}>
                          EFFICACY
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <IconButton onClick={() => setGuidedAnswer('goalEfficacy', targetEfficacyScore - 1)} sx={{ border: '1px solid rgba(69,112,137,0.2)', p: 0.75 }}>
                            <Remove fontSize="small" />
                          </IconButton>
                          <TextField
                            value={targetEfficacyScore}
                            onChange={(event) => setGuidedAnswer('goalEfficacy', event.target.value)}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, max: 100, style: { textAlign: 'center' } }}
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.96)' },
                              '& input': { fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#243A53', textAlign: 'center', py: 0.8 },
                            }}
                          />
                          <IconButton onClick={() => setGuidedAnswer('goalEfficacy', targetEfficacyScore + 1)} sx={{ border: '1px solid rgba(69,112,137,0.2)', p: 0.75 }}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>

                    <Paper sx={{ p: 1.25, borderRadius: 1, border: '1px solid rgba(224,122,63,0.2)', bgcolor: '#F2F5F8' }}>
                      <Stack spacing={0.75}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 800, color: '#DE763A', letterSpacing: '0.04em' }}>
                          EFFORT
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <IconButton onClick={() => setGuidedAnswer('goalEffort', targetEffortScore - 1)} sx={{ border: '1px solid rgba(224,122,63,0.2)', p: 0.75 }}>
                            <Remove fontSize="small" />
                          </IconButton>
                          <TextField
                            value={targetEffortScore}
                            onChange={(event) => setGuidedAnswer('goalEffort', event.target.value)}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, max: 100, style: { textAlign: 'center' } }}
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.96)' },
                              '& input': { fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#243A53', textAlign: 'center', py: 0.8 },
                            }}
                          />
                          <IconButton onClick={() => setGuidedAnswer('goalEffort', targetEffortScore + 1)} sx={{ border: '1px solid rgba(224,122,63,0.2)', p: 0.75 }}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </CardContent>
        </Card>

        <Paper
          sx={{
            p: { xs: 1.5, md: 1.7 },
            borderRadius: 1,
            border: '1px solid rgba(15,23,42,0.12)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,253,0.94))',
            boxShadow: '0 8px 22px rgba(15,23,42,0.08)',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', color: saveMessage ? '#2F855A' : 'rgba(19,38,58,0.62)', fontWeight: saveMessage ? 700 : 500 }}>
              {saveMessage || 'Save when you are ready; you can refine this plan later.'}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={() => savePlans(false)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1 }}>
                Save plan draft
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={() => savePlans(true)}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1, bgcolor: '#457089', '&:hover': { bgcolor: '#375d78' } }}
              >
                Save plan and open My Journey
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

export default ActionTabStaging;
