import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowForward, AutoAwesome } from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';
import { getActionPlanGuide } from '../../data/actionPlanGuides.js';

const { CORE_TRAITS } = traitSystem;
const CURRENT_CAMPAIGN_ID = '123';
const SCORE_MARKS = Array.from({ length: 10 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

const parseJson = (raw, fallback = null) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const trimText = (value) => String(value || '').trim();

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

  pushIfPresent(g.learningTraining ? `Learning / training: ${g.learningTraining}` : '');

  (guidedSteps || []).forEach((step) => {
    if (step.id === 'commitment' || step.id === 'behaviorCommitment' || step.id === 'goalEffort' || step.id === 'goalEfficacy') return;
    const a = trimText(g[step.id]);
    if (a) pushIfPresent(a);
  });

  return items.slice(0, 8);
}

function ActionTabStaging({ selectedAgent = 'balancedMentor', onOpenJourney }) {
  const [plans, setPlans] = useState({});
  const [selectedTraitKey, setSelectedTraitKey] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  const userInfo = useMemo(() => parseJson(localStorage.getItem('userInfo'), {}), []);
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';

  const traitRows = useMemo(() => {
    const campaign = fakeCampaign?.campaign_123?.campaign || [];
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
        fakeData.responses.forEach((response) => {
          for (let i = 0; i < 5; i += 1) {
            const statementIndex = traitIndex * 5 + i;
            const rating = response?.ratings?.[statementIndex];
            if (rating) {
              efficacyValues.push(Number(rating?.efficacy || 0));
              effortValues.push(Number(rating?.effort || 0));
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
  }, [plans]);

  useEffect(() => {
    try {
      const byCampaign = parseJson(localStorage.getItem('actionPlansByCampaign'), {});
      const savedForUser = byCampaign?.[CURRENT_CAMPAIGN_ID]?.[userKey]?.plans;
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
  }, [userKey]);

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
      id: 'goals',
      title: 'What score goals do you have for this year of growth?',
      helper: 'Set a target for how you want this trait to improve across team effort and team efficacy.',
    },
    {
      id: 'learningTraining',
      title: 'What learning or training do you intend to pursue regarding this leadership trait and its impact on people?',
      placeholder: 'Books, podcasts, coaching conversations, training, observation, or other learning you want to pursue…',
    },
    {
      id: 'behaviorCommitment',
      title: 'What is one behavior or habit that you will commit to improve throughout this process?',
      placeholder: 'Name one concrete behavior you will work to strengthen…',
    },
  ];

  const guidedAnswers = activePlan.guidedAnswers && typeof activePlan.guidedAnswers === 'object' ? activePlan.guidedAnswers : {};
  const activeJourneyItems = activeRow ? buildJourneyItems(activePlan, guide.guidedSteps) : [];

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
    const next = { ...guidedAnswers, [stepId]: value };
    const updates = { guidedAnswers: next };
    if (stepId === 'commitment' || stepId === 'behaviorCommitment') {
      updates.commitment = trimText(value);
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
            if (Number.isFinite(t) && t >= 1 && t <= 10) ga[k] = t;
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
    if (!all[CURRENT_CAMPAIGN_ID]) all[CURRENT_CAMPAIGN_ID] = {};
    all[CURRENT_CAMPAIGN_ID][userKey] = {
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

  return (
    <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
      <Stack spacing={2.2}>
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: { xs: '0.95rem', md: '1.02rem' },
            color: 'rgba(19,38,58,0.78)',
            lineHeight: 1.65,
            maxWidth: 900,
          }}
        >
          Build a focused action for each growth area from your campaign results. Pick a subtrait below, read the short
          context for that capability, then answer the prompts — they are questions, not prescriptions. Your answers
          become the plan you carry into My Journey.
        </Typography>

        <Stack direction="row" spacing={1.2} justifyContent="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
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
            <Stack spacing={2.25}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'stretch' }}>
                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.2rem', md: '1.45rem' }, fontWeight: 800, color: '#13263A' }}>
                    {activeRow.subTraitLabel}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: 'rgba(19,38,58,0.62)' }}>
                    {activeRow.trait.name}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: '#20384F', lineHeight: 1.6, maxWidth: 760 }}>
                    {activeRow.signal.description}
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} sx={{ minWidth: { xs: '100%', md: 186 } }}>
                  <Paper
                    sx={{
                      p: 1.2,
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
                    <Typography sx={{ mt: 0.35, fontFamily: 'Montserrat, sans-serif', fontSize: '1.18rem', fontWeight: 800, color: '#13263A' }}>
                      {activeRow.efficacy.toFixed(1)}
                    </Typography>
                  </Paper>
                  <Paper
                    sx={{
                      p: 1.2,
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
                    <Typography sx={{ mt: 0.35, fontFamily: 'Montserrat, sans-serif', fontSize: '1.18rem', fontWeight: 800, color: '#13263A' }}>
                      {activeRow.effort.toFixed(1)}
                    </Typography>
                  </Paper>
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <Paper
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid rgba(69,112,137,0.2)',
                    background: 'linear-gradient(145deg, rgba(239,246,252,0.95), rgba(230,239,248,0.88))',
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#457089', letterSpacing: '0.08em', mb: 0.75 }}>
                    FRIENDLY NUDGE
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: '#20384F', lineHeight: 1.55 }}>
                    {guide.friendlyNudge}
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid rgba(224,122,63,0.22)',
                    background: 'linear-gradient(145deg, rgba(255,249,244,0.96), rgba(250,241,233,0.9))',
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#E07A3F', letterSpacing: '0.08em', mb: 0.75 }}>
                    PRESSURE TEST
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: '#20384F', lineHeight: 1.55 }}>
                    {guide.pressureLens}
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid rgba(19,38,58,0.12)',
                    bgcolor: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 800, color: '#13263A', letterSpacing: '0.08em', mb: 0.75 }}>
                    AIM OF THE PLAN
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: '#20384F', lineHeight: 1.55 }}>
                    {guide.aimOfPlan}
                  </Typography>
                </Paper>
              </Stack>

              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.98rem', fontWeight: 800, color: '#13263A', pt: 0.5 }}>
                Setting a New Path
              </Typography>

              <Stack spacing={2}>
                <Paper
                  sx={{
                    p: { xs: 1.5, md: 1.75 },
                    borderRadius: 1,
                    border: '1px solid rgba(15,23,42,0.1)',
                    bgcolor: 'rgba(255,255,255,0.88)',
                  }}
                >
                  <Stack spacing={1.4}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.93rem', fontWeight: 700, color: '#13263A', lineHeight: 1.45 }}>
                      {promptSet[0].title}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', color: 'rgba(19,38,58,0.65)', lineHeight: 1.55 }}>
                      {promptSet[0].helper}
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.6}>
                      <Paper sx={{ flex: 1, p: 1.3, borderRadius: 1, border: '1px solid rgba(69,112,137,0.16)', bgcolor: 'rgba(69,112,137,0.04)' }}>
                        <Stack spacing={0.9}>
                          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#457089', letterSpacing: '0.06em' }}>
                              TARGET EFFICACY
                            </Typography>
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A' }}>
                              {Number(guidedAnswers.goalEfficacy || Math.max(1, Math.round(activeRow.efficacy))).toFixed(0)}
                            </Typography>
                          </Stack>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            marks={SCORE_MARKS}
                            value={Number(guidedAnswers.goalEfficacy || Math.max(1, Math.round(activeRow.efficacy)))}
                            onChange={(_, value) => setGuidedAnswer('goalEfficacy', Array.isArray(value) ? value[0] : value)}
                            valueLabelDisplay="auto"
                            sx={{
                              color: '#457089',
                              '& .MuiSlider-markLabel': { fontSize: '0.68rem' },
                            }}
                          />
                        </Stack>
                      </Paper>
                      <Paper sx={{ flex: 1, p: 1.3, borderRadius: 1, border: '1px solid rgba(224,122,63,0.18)', bgcolor: 'rgba(224,122,63,0.04)' }}>
                        <Stack spacing={0.9}>
                          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#E07A3F', letterSpacing: '0.06em' }}>
                              TARGET EFFORT
                            </Typography>
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A' }}>
                              {Number(guidedAnswers.goalEffort || Math.max(1, Math.round(activeRow.effort))).toFixed(0)}
                            </Typography>
                          </Stack>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            marks={SCORE_MARKS}
                            value={Number(guidedAnswers.goalEffort || Math.max(1, Math.round(activeRow.effort)))}
                            onChange={(_, value) => setGuidedAnswer('goalEffort', Array.isArray(value) ? value[0] : value)}
                            valueLabelDisplay="auto"
                            sx={{
                              color: '#E07A3F',
                              '& .MuiSlider-markLabel': { fontSize: '0.68rem' },
                            }}
                          />
                        </Stack>
                      </Paper>
                    </Stack>
                  </Stack>
                </Paper>

                <Paper
                  sx={{
                    p: { xs: 1.5, md: 1.75 },
                    borderRadius: 1,
                    border: '1px solid rgba(15,23,42,0.1)',
                    bgcolor: 'rgba(255,255,255,0.88)',
                  }}
                >
                  <Stack spacing={1}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.93rem', fontWeight: 700, color: '#13263A', lineHeight: 1.45 }}>
                      {promptSet[1].title}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder={promptSet[1].placeholder}
                      value={guidedAnswers.learningTraining ?? ''}
                      onChange={(e) => setGuidedAnswer('learningTraining', e.target.value)}
                    />
                  </Stack>
                </Paper>

                <Paper
                  sx={{
                    p: { xs: 1.5, md: 1.75 },
                    borderRadius: 1,
                    border: '1px solid rgba(15,23,42,0.1)',
                    bgcolor: 'rgba(255,255,255,0.88)',
                  }}
                >
                  <Stack spacing={1}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.93rem', fontWeight: 700, color: '#13263A', lineHeight: 1.45 }}>
                      {promptSet[2].title}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder={promptSet[2].placeholder}
                      value={guidedAnswers.behaviorCommitment ?? ''}
                      onChange={(e) => setGuidedAnswer('behaviorCommitment', e.target.value)}
                    />
                  </Stack>
                </Paper>
              </Stack>

              <Paper sx={{ p: 1.5, borderRadius: 1, border: '1px solid rgba(69,112,137,0.18)', bgcolor: 'rgba(255,255,255,0.82)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <AutoAwesome sx={{ color: '#457089', fontSize: 18 }} />
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.94rem', fontWeight: 800, color: '#13263A' }}>
                    Carries into My Journey
                  </Typography>
                </Stack>
                {activeJourneyItems.length ? (
                  <Stack spacing={0.5}>
                    {activeJourneyItems.map((item) => (
                      <Typography key={item.id} sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: '#20384F', lineHeight: 1.5 }}>
                        • {item.text}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: 'rgba(19,38,58,0.6)' }}>
                    As you answer the prompts, this list will show what will move forward when you save.
                  </Typography>
                )}
              </Paper>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', color: saveMessage ? '#2F855A' : 'rgba(19,38,58,0.62)', fontWeight: saveMessage ? 700 : 500 }}>
                  {saveMessage || 'Save when you are ready; you can refine later.'}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button variant="outlined" onClick={() => savePlans(false)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1 }}>
                    Save draft
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={() => savePlans(true)}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1, bgcolor: '#457089', '&:hover': { bgcolor: '#375d78' } }}
                  >
                    Save and open My Journey
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default ActionTabStaging;
