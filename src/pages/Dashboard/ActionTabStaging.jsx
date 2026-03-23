import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowForward,
  AutoAwesome,
  CheckCircle,
  DeleteOutline,
  FlagOutlined,
  ShieldOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';

const { CORE_TRAITS } = traitSystem;
const CURRENT_CAMPAIGN_ID = '123';
const CADENCE_OPTIONS = ['This week', 'Weekly', 'Biweekly', 'Monthly'];

const parseJson = (raw, fallback = null) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const safeAverage = (values) => {
  if (!Array.isArray(values) || !values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
};

const buildSeedPlan = (traitId, subTraitId) => ({
  commitment: '',
  teamSignal: '',
  cadence: 'Weekly',
  proof: '',
  friction: '',
  support: '',
  note: '',
  items: [],
  updatedAt: '',
  planVersion: 'staging-v2',
  seedKey: `${traitId}-${subTraitId}`,
});

const trimText = (value) => String(value || '').trim();

const getTraitFromName = (traitName) => (
  CORE_TRAITS.find((trait) => String(trait?.name || '').toLowerCase() === String(traitName || '').toLowerCase())
);

const getPersonaVoice = (selectedAgent) => {
  const voices = {
    bluntPracticalFriend: {
      kicker: 'Straight read',
      close: 'Keep the move simple enough to survive a real week.',
    },
    formalEmpatheticCoach: {
      kicker: 'Leadership lens',
      close: 'Choose a commitment your team can feel without needing an explanation.',
    },
    comedyRoaster: {
      kicker: 'Friendly nudge',
      close: 'If the plan only works on your best day, it is not a plan yet.',
    },
    pragmaticProblemSolver: {
      kicker: 'Execution read',
      close: 'Build the smallest repeatable move that changes team experience quickly.',
    },
    highSchoolCoach: {
      kicker: 'Coach’s challenge',
      close: 'Pick something you can repeat until it becomes part of your default rhythm.',
    },
    balancedMentor: {
      kicker: 'Agent reflection',
      close: 'Aim for a move that is specific, visible, and sustainable under pressure.',
    },
  };
  return voices[selectedAgent] || voices.balancedMentor;
};

const summarizeSignal = ({ efficacy, effort, delta, compassScore }) => {
  if (efficacy < 6 && effort >= 6.5) {
    return {
      label: 'Heavy effort, weak landing',
      tone: '#C85A2A',
      description: 'You may be investing energy here without creating consistent team lift.',
    };
  }
  if (efficacy >= 7.4 && effort < 5.8) {
    return {
      label: 'Strength to protect',
      tone: '#2F855A',
      description: 'This area is landing well. The risk is assuming it will stay strong without intention.',
    };
  }
  if (delta >= 1.3) {
    return {
      label: 'Perception tension',
      tone: '#E07A3F',
      description: 'Effort and impact are drifting apart enough to deserve a sharper operating move.',
    };
  }
  if (compassScore < 6.2) {
    return {
      label: 'Low traction zone',
      tone: '#9B2C2C',
      description: 'This is one of the clearest opportunities to change team experience through deliberate action.',
    };
  }
  return {
    label: 'Buildable opportunity',
    tone: '#457089',
    description: 'There is solid footing here, but the next level will likely require more visible consistency.',
  };
};

const getAgentLens = ({ selectedAgent, focusName, traitName, signal }) => {
  const persona = getPersonaVoice(selectedAgent);
  const questionBySignal = {
    'Heavy effort, weak landing': `Where does ${focusName} break down between your intent and what your team actually feels?`,
    'Strength to protect': `What would cause ${focusName} to quietly slip if your attention moved elsewhere?`,
    'Perception tension': `What are you doing in ${focusName} that feels meaningful to you, but may not be registering clearly to others?`,
    'Low traction zone': `If ${focusName} stayed unchanged for six more months, what would your team start normalizing that you do not want normalized?`,
    'Buildable opportunity': `What one repeated behavior would make ${focusName} feel more dependable to your team?`,
  };
  const reflectionBySignal = {
    'Heavy effort, weak landing': `${focusName} does not look like a motivation problem. It looks more like your energy is not yet translating into a repeatable team experience.`,
    'Strength to protect': `${focusName} is already giving you leverage. The goal here is not reinvention, but protecting what already lands well.`,
    'Perception tension': `${focusName} may be producing mixed signals. The next move should make your intent easier for other people to recognize.`,
    'Low traction zone': `${focusName} is likely one of the clearest places where a disciplined action could change how your leadership is felt day to day.`,
    'Buildable opportunity': `${focusName} is close enough to working that a sharper operating habit could create visible gains without needing a full reset.`,
  };

  return {
    title: persona.kicker,
    reflection: reflectionBySignal[signal.label] || `${focusName} is a live development area inside ${traitName}.`,
    question: questionBySignal[signal.label] || `What would better ${focusName} look like in observable behavior this month?`,
    close: persona.close,
  };
};

const buildJourneyItems = (plan) => {
  const items = [];
  const pushIfPresent = (value) => {
    const text = trimText(value);
    if (text) items.push({ id: `item-${items.length + 1}-${Date.now()}`, text, createdAt: new Date().toISOString() });
  };

  pushIfPresent(plan.commitment);
  pushIfPresent(plan.teamSignal ? `Team-visible signal: ${plan.teamSignal}` : '');
  pushIfPresent(plan.cadence ? `Cadence: ${plan.cadence}` : '');
  pushIfPresent(plan.proof ? `Proof of follow-through: ${plan.proof}` : '');
  (plan.items || []).forEach((item) => pushIfPresent(item?.text || ''));
  pushIfPresent(plan.support ? `Support / guardrail: ${plan.support}` : '');

  return items.slice(0, 6);
};

const getPlanReadiness = (plan) => {
  const fields = [
    trimText(plan?.commitment),
    trimText(plan?.teamSignal),
    trimText(plan?.cadence),
    trimText(plan?.proof),
    trimText(plan?.friction),
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
};

function ActionTabStaging({ selectedAgent = 'balancedMentor', onOpenJourney }) {
  const [plans, setPlans] = useState({});
  const [activeKey, setActiveKey] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const userInfo = useMemo(() => parseJson(localStorage.getItem('userInfo'), {}), []);
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';

  const focusCards = useMemo(() => {
    const campaign = fakeCampaign?.campaign_123?.campaign || [];
    return campaign.map((campaignTrait, traitIndex) => {
      const trait = getTraitFromName(campaignTrait?.trait);
      if (!trait) return null;
      const subTrait = trait?.subTraits?.find(
        (item) => String(item?.name || '').toLowerCase() === String(campaignTrait?.subTrait || '').toLowerCase()
      ) || trait?.subTraits?.[0];
      if (!subTrait) return null;

      const efficacyValues = [];
      const effortValues = [];
      fakeData.responses.forEach((response) => {
        for (let i = 0; i < 5; i += 1) {
          const statementIndex = (traitIndex * 5) + i;
          const rating = response?.ratings?.[statementIndex];
          if (rating) {
            efficacyValues.push(Number(rating?.efficacy || 0));
            effortValues.push(Number(rating?.effort || 0));
          }
        }
      });

      const efficacy = safeAverage(efficacyValues);
      const effort = safeAverage(effortValues);
      const compassScore = ((efficacy * 2) + effort) / 3;
      const delta = Math.abs(effort - efficacy);
      const signal = summarizeSignal({ efficacy, effort, delta, compassScore });
      const plan = plans?.[trait.id]?.[subTrait.id] || buildSeedPlan(trait.id, subTrait.id);
      const readiness = getPlanReadiness(plan);
      const agentLens = getAgentLens({
        selectedAgent,
        focusName: subTrait.name,
        traitName: trait.name,
        signal,
      });

      return {
        key: `${trait.id}:${subTrait.id}`,
        trait,
        subTrait,
        campaignTrait,
        efficacy,
        effort,
        compassScore,
        delta,
        signal,
        plan,
        readiness,
        agentLens,
      };
    }).filter(Boolean);
  }, [plans, selectedAgent]);

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
      Object.entries(legacy || {}).forEach(([traitId, subtraits]) => {
        migrated[traitId] = {};
        Object.entries(subtraits || {}).forEach(([subTraitId, payload]) => {
          const seeded = buildSeedPlan(traitId, subTraitId);
          seeded.commitment = trimText(payload?.text);
          seeded.items = seeded.commitment
            ? [{ id: `${traitId}-${subTraitId}-legacy`, text: seeded.commitment, createdAt: payload?.createdAt || new Date().toISOString() }]
            : [];
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
    if (!activeKey && focusCards.length) {
      setActiveKey(focusCards[0].key);
    }
  }, [activeKey, focusCards]);

  const activeFocus = focusCards.find((item) => item.key === activeKey) || focusCards[0] || null;

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

  const updateMicroAction = (traitId, subTraitId, itemId, text) => {
    const currentItems = plans?.[traitId]?.[subTraitId]?.items || [];
    updatePlan(traitId, subTraitId, {
      items: currentItems.map((item) => (item.id === itemId ? { ...item, text } : item)),
    });
  };

  const addMicroAction = (traitId, subTraitId) => {
    const currentItems = plans?.[traitId]?.[subTraitId]?.items || [];
    updatePlan(traitId, subTraitId, {
      items: [
        ...currentItems,
        {
          id: `${traitId}-${subTraitId}-${Date.now()}`,
          text: '',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  };

  const removeMicroAction = (traitId, subTraitId, itemId) => {
    const currentItems = plans?.[traitId]?.[subTraitId]?.items || [];
    updatePlan(traitId, subTraitId, {
      items: currentItems.filter((item) => item.id !== itemId),
    });
  };

  const savePlans = (openJourney = false) => {
    const sanitized = {};
    Object.entries(plans || {}).forEach(([traitId, subTraits]) => {
      const nextTrait = {};
      Object.entries(subTraits || {}).forEach(([subTraitId, rawPlan]) => {
        const plan = {
          ...buildSeedPlan(traitId, subTraitId),
          ...rawPlan,
          commitment: trimText(rawPlan?.commitment),
          teamSignal: trimText(rawPlan?.teamSignal),
          cadence: trimText(rawPlan?.cadence) || 'Weekly',
          proof: trimText(rawPlan?.proof),
          friction: trimText(rawPlan?.friction),
          support: trimText(rawPlan?.support),
          note: trimText(rawPlan?.note),
          items: (rawPlan?.items || [])
            .map((item) => ({ ...item, text: trimText(item?.text) }))
            .filter((item) => item.text),
          updatedAt: new Date().toISOString(),
          planVersion: 'staging-v2',
        };

        const journeyItems = buildJourneyItems(plan);
        if (plan.commitment || journeyItems.length) {
          nextTrait[subTraitId] = {
            ...plan,
            items: journeyItems,
          };
        }
      });
      if (Object.keys(nextTrait).length) {
        sanitized[traitId] = nextTrait;
      }
    });

    const all = parseJson(localStorage.getItem('actionPlansByCampaign'), {});
    if (!all[CURRENT_CAMPAIGN_ID]) all[CURRENT_CAMPAIGN_ID] = {};
    all[CURRENT_CAMPAIGN_ID][userKey] = {
      user: { name: userInfo?.name || '', email: userInfo?.email || '' },
      selectedAgent,
      planVersion: 'staging-v2',
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
    if (openJourney && typeof onOpenJourney === 'function') {
      onOpenJourney();
    }
  };

  if (!activeFocus) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
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

  const completedCount = focusCards.filter((item) => item.readiness >= 80).length;
  const activePlan = activeFocus.plan || buildSeedPlan(activeFocus.trait.id, activeFocus.subTrait.id);
  const activeJourneyItems = buildJourneyItems(activePlan);

  return (
    <Stack spacing={2.2}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 2.8 },
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(241,246,252,0.9))',
          boxShadow: '0 14px 30px rgba(15,23,42,0.14)',
        }}
      >
        <Stack spacing={1.4}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 800, color: '#13263A' }}>
                Build Your Next Moves
              </Typography>
              <Typography sx={{ mt: 0.55, fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', color: 'rgba(19,38,58,0.72)', maxWidth: 760 }}>
                This staging redesign turns action planning into a guided build process: clarify the move, make it visible to your team, pressure-test it, and send it forward into your journey.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${focusCards.length} focus areas`} sx={{ bgcolor: 'rgba(69,112,137,0.12)', border: '1px solid rgba(69,112,137,0.24)' }} />
              <Chip label={`${completedCount} ready for journey`} sx={{ bgcolor: 'rgba(47,133,90,0.12)', border: '1px solid rgba(47,133,90,0.24)' }} />
            </Stack>
          </Stack>
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#20384F' }}>
                Action readiness
              </Typography>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#20384F' }}>
                {Math.round((completedCount / Math.max(focusCards.length, 1)) * 100)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.round((completedCount / Math.max(focusCards.length, 1)) * 100)}
              sx={{
                height: 10,
                borderRadius: 999,
                bgcolor: 'rgba(69,112,137,0.12)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #E07A3F, #457089)',
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2.2} alignItems="stretch">
        <Grid item xs={12} lg={4}>
          <Stack spacing={1.4}>
            {focusCards.map((focus) => (
              <Paper
                key={focus.key}
                onClick={() => setActiveKey(focus.key)}
                sx={{
                  p: 1.8,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: focus.key === activeKey ? '1px solid rgba(224,122,63,0.6)' : '1px solid rgba(255,255,255,0.18)',
                  background: focus.key === activeKey
                    ? 'linear-gradient(145deg, rgba(255,250,245,0.98), rgba(246,239,230,0.92))'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(242,246,251,0.88))',
                  boxShadow: focus.key === activeKey ? '0 12px 26px rgba(15,23,42,0.16)' : '0 10px 22px rgba(15,23,42,0.10)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 14px 28px rgba(15,23,42,0.16)',
                  },
                }}
              >
                <Stack spacing={1.1}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.02rem', fontWeight: 800, color: '#13263A' }}>
                        {focus.subTrait.name}
                      </Typography>
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', color: 'rgba(19,38,58,0.68)' }}>
                        {focus.trait.name}
                      </Typography>
                    </Box>
                    {focus.readiness >= 80 ? (
                      <CheckCircle sx={{ color: '#2F855A', fontSize: 22 }} />
                    ) : (
                      <ArrowForward sx={{ color: '#457089', fontSize: 22 }} />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={0.8} flexWrap="wrap">
                    <Chip label={`Compass ${focus.compassScore.toFixed(1)}`} sx={{ bgcolor: 'rgba(69,112,137,0.12)' }} />
                    <Chip label={`Gap ${focus.delta.toFixed(1)}`} sx={{ bgcolor: 'rgba(224,122,63,0.12)' }} />
                    <Chip label={focus.signal.label} sx={{ bgcolor: `${focus.signal.tone}16`, color: focus.signal.tone, border: `1px solid ${focus.signal.tone}44` }} />
                  </Stack>

                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'rgba(19,38,58,0.78)', lineHeight: 1.55 }}>
                    {focus.agentLens.question}
                  </Typography>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.45 }}>
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: '#20384F' }}>
                        Plan readiness
                      </Typography>
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: '#20384F' }}>
                        {focus.readiness}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={focus.readiness}
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: 'rgba(69,112,137,0.12)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 999,
                          background: focus.readiness >= 80 ? 'linear-gradient(90deg, #2F855A, #6F9A83)' : 'linear-gradient(90deg, #E07A3F, #457089)',
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3.2,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(244,248,253,0.9))',
              boxShadow: '0 14px 30px rgba(15,23,42,0.14)',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.6 } }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.4}>
                  <Box>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.3rem', md: '1.55rem' }, fontWeight: 800, color: '#13263A' }}>
                      {activeFocus.subTrait.name}
                    </Typography>
                    <Typography sx={{ mt: 0.35, fontFamily: 'Montserrat, sans-serif', fontSize: '0.93rem', color: 'rgba(19,38,58,0.7)', maxWidth: 700 }}>
                      {activeFocus.signal.description}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip icon={<FlagOutlined />} label={`Efficacy ${activeFocus.efficacy.toFixed(1)}`} sx={{ bgcolor: 'rgba(99,147,170,0.14)' }} />
                    <Chip icon={<AutoAwesome />} label={`Effort ${activeFocus.effort.toFixed(1)}`} sx={{ bgcolor: 'rgba(224,122,63,0.14)' }} />
                    <Chip label={`Compass ${activeFocus.compassScore.toFixed(1)}`} sx={{ bgcolor: 'rgba(69,112,137,0.10)' }} />
                  </Stack>
                </Stack>

                <Grid container spacing={1.4}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 1.6, borderRadius: 2.6, border: '1px solid rgba(69,112,137,0.2)', background: 'linear-gradient(145deg, rgba(239,246,252,0.95), rgba(229,239,248,0.9))', height: '100%' }}>
                      <Stack spacing={0.9}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AutoAwesome sx={{ color: '#457089', fontSize: 20 }} />
                          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.94rem', fontWeight: 800, color: '#13263A' }}>
                            {activeFocus.agentLens.title}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: '#20384F', lineHeight: 1.6 }}>
                          {activeFocus.agentLens.reflection}
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: '#13263A', fontWeight: 700, lineHeight: 1.55 }}>
                          {activeFocus.agentLens.question}
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.84rem', color: 'rgba(19,38,58,0.72)', lineHeight: 1.5 }}>
                          {activeFocus.agentLens.close}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 1.6, borderRadius: 2.6, border: '1px solid rgba(224,122,63,0.22)', background: 'linear-gradient(145deg, rgba(255,248,243,0.96), rgba(250,241,233,0.92))', height: '100%' }}>
                      <Stack spacing={0.9}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <VisibilityOutlined sx={{ color: '#E07A3F', fontSize: 20 }} />
                          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.94rem', fontWeight: 800, color: '#13263A' }}>
                            Build Standard
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                          Strong plans are specific, visible to other people, protected against pressure, and easy to recognize later in the Journey map.
                        </Typography>
                        <Stack direction="row" spacing={0.8} flexWrap="wrap">
                          <Chip label="Specific" sx={{ bgcolor: 'rgba(255,255,255,0.72)' }} />
                          <Chip label="Team-visible" sx={{ bgcolor: 'rgba(255,255,255,0.72)' }} />
                          <Chip label="Repeatable" sx={{ bgcolor: 'rgba(255,255,255,0.72)' }} />
                          <Chip label="Provable" sx={{ bgcolor: 'rgba(255,255,255,0.72)' }} />
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ borderColor: 'rgba(69,112,137,0.2)' }} />

                <Grid container spacing={1.4}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Primary commitment"
                      placeholder="What is the one move you are committing to here?"
                      value={activePlan.commitment || ''}
                      onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { commitment: event.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.86)' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Team-visible signal"
                      placeholder="What would your team notice first if this improved?"
                      value={activePlan.teamSignal || ''}
                      onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { teamSignal: event.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.86)' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack spacing={0.8}>
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: '#20384F' }}>
                        Cadence
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap">
                        {CADENCE_OPTIONS.map((option) => {
                          const active = String(activePlan.cadence || 'Weekly') === option;
                          return (
                            <Chip
                              key={option}
                              clickable
                              label={option}
                              onClick={() => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { cadence: option })}
                              sx={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 700,
                                bgcolor: active ? '#457089' : 'rgba(69,112,137,0.08)',
                                color: active ? '#fff' : '#20384F',
                                border: `1px solid ${active ? '#457089' : 'rgba(69,112,137,0.2)'}`,
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Pressure plan"
                      placeholder="When pressure rises, what are you likely to avoid and how will you guard against that?"
                      value={activePlan.friction || ''}
                      onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { friction: event.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.86)' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Proof of follow-through"
                      placeholder="How will you know this actually happened in the real flow of work?"
                      value={activePlan.proof || ''}
                      onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { proof: event.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.86)' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Support / guardrail"
                      placeholder="What support, reminder, or constraint would make this easier to sustain?"
                      value={activePlan.support || ''}
                      onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { support: event.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.86)' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Private note"
                      placeholder="Anything else you want to remember about this focus area?"
                      value={activePlan.note || ''}
                      onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { note: event.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.86)' } }}
                    />
                  </Grid>
                </Grid>

                <Paper sx={{ p: 1.6, borderRadius: 2.6, border: '1px solid rgba(69,112,137,0.18)', background: 'rgba(255,255,255,0.74)' }}>
                  <Stack spacing={1.1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', fontWeight: 800, color: '#13263A' }}>
                        Supporting moves
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => addMicroAction(activeFocus.trait.id, activeFocus.subTrait.id)}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Add move
                      </Button>
                    </Stack>
                    {(activePlan.items || []).length ? (
                      <Stack spacing={1}>
                        {(activePlan.items || []).map((item, index) => (
                          <Box key={item.id || `${activeFocus.key}-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              label={`Supporting move ${index + 1}`}
                              placeholder="Add a smaller move that reinforces the primary commitment."
                              value={item?.text || ''}
                              onChange={(event) => updateMicroAction(activeFocus.trait.id, activeFocus.subTrait.id, item.id, event.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.86)' } }}
                            />
                            <IconButton
                              onClick={() => removeMicroAction(activeFocus.trait.id, activeFocus.subTrait.id, item.id)}
                              sx={{ mt: 1, border: '1px solid rgba(19,38,58,0.15)' }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: 'rgba(19,38,58,0.68)' }}>
                        Add supporting moves if you want a few concrete behaviors under the main commitment. This replaces the old unlimited blank-action approach with a cleaner stack.
                      </Typography>
                    )}
                  </Stack>
                </Paper>

                <Paper sx={{ p: 1.7, borderRadius: 2.8, border: '1px solid rgba(224,122,63,0.24)', background: 'linear-gradient(145deg, rgba(255,250,245,0.98), rgba(250,241,233,0.92))' }}>
                  <Stack spacing={1.1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ShieldOutlined sx={{ color: '#E07A3F', fontSize: 20 }} />
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', fontWeight: 800, color: '#13263A' }}>
                        Journey handoff preview
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'rgba(19,38,58,0.76)', lineHeight: 1.55 }}>
                      When you save this focus area, these commitments are what the Journey map will carry forward as your visible trail markers.
                    </Typography>
                    {activeJourneyItems.length ? (
                      <Stack spacing={0.65}>
                        {activeJourneyItems.map((item) => (
                          <Typography key={item.id} sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: '#20384F', lineHeight: 1.45 }}>
                            • {item.text}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: 'rgba(19,38,58,0.62)' }}>
                        Nothing is being handed forward yet. Build at least the primary commitment and one visible proof marker.
                      </Typography>
                    )}
                  </Stack>
                </Paper>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Box>
                    {saveMessage ? (
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#2F855A', fontWeight: 700 }}>
                        {saveMessage}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: 'rgba(19,38,58,0.64)' }}>
                        Saved actions remain backward-compatible with the current Journey page while this redesign iterates on staging.
                      </Typography>
                    )}
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => savePlans(false)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderColor: 'rgba(69,112,137,0.32)', color: '#457089' }}
                    >
                      Save draft
                    </Button>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={() => savePlans(true)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 800,
                        bgcolor: '#457089',
                        '&:hover': { bgcolor: '#375d78' },
                      }}
                    >
                      Save and open My Journey
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default ActionTabStaging;
