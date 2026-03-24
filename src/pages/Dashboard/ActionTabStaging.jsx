import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Stack,
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
  const promptSet = [
    {
      id: 'behaviorCommitment',
      step: '01',
      title: 'What is the one behavior shift you want your team to feel more consistently?',
      helper: 'Name a visible move, not a general intention. If someone watched you lead for a week, what would be different?',
      placeholder: 'Example: I will close each weekly check-in by naming the decision, owner, and next step out loud.',
    },
    {
      id: 'visibleSignal',
      step: '02',
      title: 'If this plan works, what would your team notice first?',
      helper: 'Describe the first signal of progress they could observe without you having to explain it.',
      placeholder: 'Example: Meetings end with fewer clarifying questions and clearer ownership on next steps.',
    },
    {
      id: 'learningTraining',
      step: '03',
      title: 'What support will help you improve this more intelligently this quarter?',
      helper: 'Choose support that sharpens the behavior: coaching, observation, training, feedback, practice, or a resource you will actually use.',
      placeholder: 'Example: I will review one meeting recording each week and get direct feedback on how clearly I frame next steps.',
    },
    {
      id: 'goals',
      step: '04',
      title: 'Where do you want these scores to move?',
      helper: 'Use the numeric goals to calibrate the level of shift you are trying to create, not to replace the behavior itself.',
    },
  ];

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
  const contextPanels = [
    {
      title: 'Why This Matters',
      tone: '#457089',
      background: 'linear-gradient(145deg, rgba(239,246,252,0.95), rgba(230,239,248,0.88))',
      border: '1px solid rgba(69,112,137,0.2)',
      text: guide.friendlyNudge,
    },
    {
      title: 'Where It Can Break',
      tone: '#E07A3F',
      background: 'linear-gradient(145deg, rgba(255,249,244,0.96), rgba(250,241,233,0.9))',
      border: '1px solid rgba(224,122,63,0.22)',
      text: guide.pressureLens,
    },
    {
      title: 'What Success Should Look Like',
      tone: '#13263A',
      background: 'rgba(255,255,255,0.85)',
      border: '1px solid rgba(19,38,58,0.12)',
      text: guide.aimOfPlan,
    },
  ];
  const planSnapshotSections = [
    {
      title: 'Growth Move',
      empty: 'Define the one behavior shift you want your team to feel more consistently.',
      value: trimText(guidedAnswers.behaviorCommitment),
    },
    {
      title: 'What Your Team Should Notice',
      empty: 'Name the first visible signal of progress your team would notice.',
      value: trimText(guidedAnswers.visibleSignal),
    },
    {
      title: 'Support You Will Use',
      empty: 'Capture the support, training, or feedback loop that will help this stick.',
      value: trimText(guidedAnswers.learningTraining),
    },
    {
      title: 'Target Scores',
      empty: '',
      value: `Efficacy ${targetEfficacyScore} | Effort ${targetEffortScore} | Overall ${targetOverallScore}`,
      alwaysShow: true,
    },
  ];
  const planIsReady = Boolean(trimText(guidedAnswers.behaviorCommitment) && trimText(guidedAnswers.visibleSignal));

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
    <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
      <Stack spacing={2.15}>
        <Paper
          sx={{
            p: { xs: 1.7, md: 2.2 },
            borderRadius: 1,
            border: '1px solid rgba(15,23,42,0.12)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,253,0.94))',
            boxShadow: '0 8px 22px rgba(15,23,42,0.08)',
          }}
        >
          <Stack spacing={1.5}>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 800, color: '#457089', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Plan of Attack
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'stretch' }}>
              <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.3rem', md: '1.55rem' }, fontWeight: 800, color: '#13263A' }}>
                  {activeRow.subTraitLabel}
                </Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: 'rgba(19,38,58,0.62)' }}>
                  {activeRow.trait.name}
                </Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', color: '#20384F', lineHeight: 1.6, maxWidth: 760 }}>
                  {activeRow.signal.description}
                </Typography>
                <Paper
                  sx={{
                    p: 1.1,
                    borderRadius: 1,
                    border: '1px solid rgba(69,112,137,0.18)',
                    bgcolor: 'rgba(69,112,137,0.05)',
                    maxWidth: 760,
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', fontWeight: 800, color: '#457089', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.45 }}>
                    Your Role On This Page
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.89rem', color: '#20384F', lineHeight: 1.55 }}>
                    Choose one growth move your team could actually feel this quarter. Keep it concrete, visible, and realistic enough to lead on purpose.
                  </Typography>
                </Paper>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' }, minWidth: { xs: '100%', md: 560 } }}>
                <Paper
                  sx={{
                    p: 1.35,
                    borderRadius: 1,
                    border: '1px solid rgba(69,112,137,0.22)',
                    bgcolor: 'rgba(69,112,137,0.06)',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#457089', letterSpacing: '0.08em' }}>
                    TEAM EFFICACY
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontFamily: 'Montserrat, sans-serif', fontSize: '1.42rem', fontWeight: 800, color: '#13263A' }}>
                    {currentEfficacyScore}
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    p: 1.35,
                    borderRadius: 1,
                    border: '1px solid rgba(224,122,63,0.24)',
                    bgcolor: 'rgba(224,122,63,0.06)',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#E07A3F', letterSpacing: '0.08em' }}>
                    TEAM EFFORT
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontFamily: 'Montserrat, sans-serif', fontSize: '1.42rem', fontWeight: 800, color: '#13263A' }}>
                    {currentEffortScore}
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    p: 1.35,
                    borderRadius: 1,
                    border: '1px solid rgba(19,38,58,0.18)',
                    bgcolor: 'rgba(19,38,58,0.04)',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#13263A', letterSpacing: '0.08em' }}>
                    OVERALL SCORE
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontFamily: 'Montserrat, sans-serif', fontSize: '1.42rem', fontWeight: 800, color: '#13263A' }}>
                    {currentOverallScore}
                  </Typography>
                </Paper>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: { xs: '0.94rem', md: '1rem' },
            color: 'rgba(19,38,58,0.78)',
            lineHeight: 1.65,
            maxWidth: 900,
          }}
        >
          Choose one growth move for this leadership area. You do not need to solve everything here. Your job is to define
          one clear shift, why it matters, and what progress should look like for your team.
        </Typography>

        <Stack direction="row" spacing={1.2} justifyContent="center" flexWrap="wrap" sx={{ mb: 0.25 }}>
          {traitRows.map((row) => {
            const active = selectedTraitKey === row.traitKey;
            return (
              <Button
                key={row.traitKey}
                variant={active ? 'contained' : 'outlined'}
                onClick={() => setSelectedTraitKey(row.traitKey)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 1,
                  bgcolor: active ? undefined : 'white',
                  color: active ? undefined : 'text.primary',
                  borderColor: active ? undefined : 'rgba(0,0,0,0.24)',
                  '&:hover': { bgcolor: active ? undefined : 'rgba(255,255,255,0.92)' },
                }}
              >
                {row.subTraitLabel}
              </Button>
            );
          })}
        </Stack>

        <Card
          sx={{
            borderRadius: 1,
            border: '1px solid rgba(15,23,42,0.12)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,253,0.94))',
            boxShadow: '0 8px 22px rgba(15,23,42,0.08)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
            <Stack spacing={2}>
              <Paper
                sx={{
                  p: { xs: 1.5, md: 1.75 },
                  borderRadius: 1,
                  border: '1px solid rgba(15,23,42,0.1)',
                  bgcolor: 'rgba(255,255,255,0.88)',
                }}
              >
                <Stack spacing={1.15}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.98rem', fontWeight: 800, color: '#13263A' }}>
                    Understand the Moment
                  </Typography>
                  <Stack spacing={1}>
                    {contextPanels.map((panel) => (
                      <Paper
                        key={panel.title}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          border: panel.border,
                          background: panel.background,
                        }}
                      >
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: panel.tone, letterSpacing: '0.08em', mb: 0.6, textTransform: 'uppercase' }}>
                          {panel.title}
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: '#20384F', lineHeight: 1.58 }}>
                          {panel.text}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Paper>

              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A' }}>
                Build Your Growth Move
              </Typography>

              {promptSet.map((prompt) => (
                <Paper
                  key={prompt.id}
                  sx={{
                    p: { xs: 1.5, md: 1.75 },
                    borderRadius: 1,
                    border: '1px solid rgba(15,23,42,0.1)',
                    bgcolor: 'rgba(255,255,255,0.88)',
                  }}
                >
                  <Stack spacing={1.2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Paper
                        sx={{
                          minWidth: 38,
                          px: 1,
                          py: 0.55,
                          borderRadius: 999,
                          border: '1px solid rgba(69,112,137,0.18)',
                          bgcolor: 'rgba(69,112,137,0.06)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#457089', letterSpacing: '0.04em' }}>
                          {prompt.step}
                        </Typography>
                      </Paper>
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#13263A', lineHeight: 1.45 }}>
                        {prompt.title}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', color: 'rgba(19,38,58,0.67)', lineHeight: 1.6 }}>
                      {prompt.helper}
                    </Typography>

                    {prompt.id === 'goals' ? (
                      <Stack spacing={1.2}>
                        <Paper sx={{ p: 1.35, borderRadius: 1, border: '1px solid rgba(69,112,137,0.16)', bgcolor: 'rgba(69,112,137,0.04)' }}>
                          <Stack spacing={0.9}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#457089', letterSpacing: '0.06em' }}>
                                TARGET EFFICACY
                              </Typography>
                              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(19,38,58,0.62)' }}>
                                current {currentEfficacyScore}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconButton onClick={() => setGuidedAnswer('goalEfficacy', targetEfficacyScore - 1)} sx={{ border: '1px solid rgba(69,112,137,0.18)' }}>
                                <Remove fontSize="small" />
                              </IconButton>
                              <TextField
                                value={targetEfficacyScore}
                                onChange={(event) => setGuidedAnswer('goalEfficacy', event.target.value)}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, max: 100, style: { textAlign: 'center' } }}
                                sx={{
                                  width: 92,
                                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.96)' },
                                  '& input': {
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '1.08rem',
                                    fontWeight: 800,
                                    color: '#13263A',
                                    textAlign: 'center',
                                  },
                                }}
                              />
                              <IconButton onClick={() => setGuidedAnswer('goalEfficacy', targetEfficacyScore + 1)} sx={{ border: '1px solid rgba(69,112,137,0.18)' }}>
                                <Add fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Paper>

                        <Paper sx={{ p: 1.35, borderRadius: 1, border: '1px solid rgba(224,122,63,0.18)', bgcolor: 'rgba(224,122,63,0.04)' }}>
                          <Stack spacing={0.9}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#E07A3F', letterSpacing: '0.06em' }}>
                                TARGET EFFORT
                              </Typography>
                              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(19,38,58,0.62)' }}>
                                current {currentEffortScore}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconButton onClick={() => setGuidedAnswer('goalEffort', targetEffortScore - 1)} sx={{ border: '1px solid rgba(224,122,63,0.18)' }}>
                                <Remove fontSize="small" />
                              </IconButton>
                              <TextField
                                value={targetEffortScore}
                                onChange={(event) => setGuidedAnswer('goalEffort', event.target.value)}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, max: 100, style: { textAlign: 'center' } }}
                                sx={{
                                  width: 92,
                                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.96)' },
                                  '& input': {
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '1.08rem',
                                    fontWeight: 800,
                                    color: '#13263A',
                                    textAlign: 'center',
                                  },
                                }}
                              />
                              <IconButton onClick={() => setGuidedAnswer('goalEffort', targetEffortScore + 1)} sx={{ border: '1px solid rgba(224,122,63,0.18)' }}>
                                <Add fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Paper>

                        <Paper sx={{ p: 1.35, borderRadius: 1, border: '1px solid rgba(19,38,58,0.14)', bgcolor: 'rgba(19,38,58,0.04)' }}>
                          <Stack spacing={0.9}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#13263A', letterSpacing: '0.06em' }}>
                                OVERALL TRAIT GOAL
                              </Typography>
                              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(19,38,58,0.62)' }}>
                                auto
                              </Typography>
                            </Stack>
                            <Paper
                              variant="outlined"
                              sx={{
                                px: 1.2,
                                py: 1.15,
                                borderRadius: 1,
                                bgcolor: 'rgba(255,255,255,0.96)',
                                borderColor: 'rgba(19,38,58,0.14)',
                                textAlign: 'center',
                              }}
                            >
                              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.12rem', fontWeight: 800, color: '#13263A' }}>
                                {targetOverallScore}
                              </Typography>
                            </Paper>
                          </Stack>
                        </Paper>
                      </Stack>
                    ) : (
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder={prompt.placeholder}
                        value={guidedAnswers[prompt.id] ?? ''}
                        onChange={(e) => setGuidedAnswer(prompt.id, e.target.value)}
                      />
                    )}
                  </Stack>
                </Paper>
              ))}

              <Paper
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid rgba(69,112,137,0.18)',
                  bgcolor: 'rgba(255,255,255,0.88)',
                  boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <AutoAwesome sx={{ color: '#457089', fontSize: 18 }} />
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', fontWeight: 800, color: '#13263A' }}>
                    Your Plan Snapshot
                  </Typography>
                </Stack>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', color: 'rgba(19,38,58,0.64)', lineHeight: 1.55, mb: 1.15 }}>
                  This is the version of your plan that will carry forward into My Journey.
                </Typography>
                <Stack spacing={1}>
                  {planSnapshotSections.map((section) => (
                    <Paper
                      key={section.title}
                      sx={{
                        p: 1.1,
                        borderRadius: 1,
                        border: '1px solid rgba(15,23,42,0.08)',
                        bgcolor: 'rgba(255,255,255,0.84)',
                      }}
                    >
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#457089', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.45 }}>
                        {section.title}
                      </Typography>
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: section.value ? '#20384F' : 'rgba(19,38,58,0.52)', lineHeight: 1.55 }}>
                        {section.value || section.empty}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>

              <Paper
                sx={{
                  p: 1.4,
                  borderRadius: 1,
                  border: '1px solid rgba(19,38,58,0.1)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
                }}
              >
                <Stack spacing={0.8}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', fontWeight: 800, color: '#13263A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Completion Check
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: '#20384F', lineHeight: 1.55 }}>
                    {planIsReady
                      ? 'You have the core of a strong plan: one visible growth move and one team-facing signal of progress.'
                      : 'A strong plan starts with two things: the specific behavior you will change and what your team should notice if it is working.'}
                  </Typography>
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
              {saveMessage || 'Save when you are ready. You can refine the plan later, but the strongest next step is to carry a clear move into My Journey.'}
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
