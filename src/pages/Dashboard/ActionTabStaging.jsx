import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  AutoAwesome,
  FlagOutlined,
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

const trimText = (value) => String(value || '').trim();

const safeAverage = (values) => {
  if (!Array.isArray(values) || !values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
};

const buildSeedPlan = (traitId, subTraitId) => ({
  commitment: '',
  teamSignal: '',
  proof: '',
  cadence: '',
  support: '',
  items: [],
  updatedAt: '',
  planVersion: 'staging-v3',
  seedKey: `${traitId}-${subTraitId}`,
});

const getTraitFromName = (traitName) => (
  CORE_TRAITS.find((trait) => String(trait?.name || '').toLowerCase() === String(traitName || '').toLowerCase())
);

const getPersonaVoice = (selectedAgent) => {
  const voices = {
    bluntPracticalFriend: 'Straight read',
    formalEmpatheticCoach: 'Leadership lens',
    comedyRoaster: 'Friendly nudge',
    pragmaticProblemSolver: 'Execution read',
    highSchoolCoach: 'Coach challenge',
    balancedMentor: 'Agent reflection',
  };
  return voices[selectedAgent] || voices.balancedMentor;
};

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

const getSupportModel = ({ selectedAgent, focusName, signal }) => {
  const voice = getPersonaVoice(selectedAgent);
  const reflections = {
    'Heavy effort, weak landing': `${focusName} looks like a translation problem, not a caring problem.`,
    'Strength to protect': `${focusName} is already helping you. The goal is to keep it deliberate.`,
    'Perception tension': `${focusName} may be sending mixed signals even when your intent is good.`,
    'Low traction zone': `${focusName} is likely one of the places your team feels most quickly.`,
    'Buildable opportunity': `${focusName} is close enough to improve without needing a full reset.`,
  };
  const questions = {
    'Heavy effort, weak landing': `Where does ${focusName} break down between what you mean and what others experience?`,
    'Strength to protect': `What would your team lose first if ${focusName} slipped quietly over the next quarter?`,
    'Perception tension': `What are you doing here that matters to you, but may not be obvious to others?`,
    'Low traction zone': `If ${focusName} stayed unchanged for six months, what would your team start normalizing?`,
    'Buildable opportunity': `What repeated move would make ${focusName} feel more dependable to your team?`,
  };
  const outcomes = {
    'Heavy effort, weak landing': 'Your plan should make impact more visible, not just effort more sincere.',
    'Strength to protect': 'Your plan should keep this from becoming assumed or invisible.',
    'Perception tension': 'Your plan should make the behavior easier for other people to notice.',
    'Low traction zone': 'Your plan should create a visible shift your team can feel early.',
    'Buildable opportunity': 'Your plan should turn a decent pattern into a trustworthy one.',
  };

  return {
    voice,
    reflection: reflections[signal.label],
    question: questions[signal.label],
    outcome: outcomes[signal.label],
  };
};

const buildJourneyItems = (plan) => {
  const items = [];
  const pushIfPresent = (value) => {
    const text = trimText(value);
    if (text) {
      items.push({
        id: `item-${items.length + 1}-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
      });
    }
  };

  pushIfPresent(plan.commitment);
  pushIfPresent(plan.teamSignal ? `Team-visible signal: ${plan.teamSignal}` : '');
  pushIfPresent(plan.proof ? `Proof marker: ${plan.proof}` : '');
  pushIfPresent(plan.support ? `Supporting move: ${plan.support}` : '');
  pushIfPresent(plan.cadence ? `Check-in rhythm: ${plan.cadence}` : '');

  return items.slice(0, 5);
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
      const supportModel = getSupportModel({
        selectedAgent,
        focusName: subTrait.name,
        signal,
      });

      return {
        key: `${trait.id}:${subTrait.id}`,
        trait,
        subTrait,
        efficacy,
        effort,
        compassScore,
        delta,
        signal,
        plan,
        supportModel,
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
      Object.entries(legacy || {}).forEach(([traitId, subTraits]) => {
        migrated[traitId] = {};
        Object.entries(subTraits || {}).forEach(([subTraitId, payload]) => {
          const seeded = buildSeedPlan(traitId, subTraitId);
          seeded.commitment = trimText(payload?.text);
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
          proof: trimText(rawPlan?.proof),
          cadence: trimText(rawPlan?.cadence),
          support: trimText(rawPlan?.support),
          updatedAt: new Date().toISOString(),
          planVersion: 'staging-v3',
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
      planVersion: 'staging-v3',
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

  const activePlan = activeFocus.plan || buildSeedPlan(activeFocus.trait.id, activeFocus.subTrait.id);
  const activeJourneyItems = buildJourneyItems(activePlan);

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.4, md: 3.2 },
          borderRadius: 3.2,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(241,246,252,0.92))',
          boxShadow: '0 14px 30px rgba(15,23,42,0.12)',
        }}
      >
        <Stack spacing={1}>
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.38rem', md: '1.68rem' }, fontWeight: 800, color: '#13263A' }}>
            Turn Insight Into a Clear Next Move
          </Typography>
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.97rem', color: 'rgba(19,38,58,0.72)', maxWidth: 760, lineHeight: 1.6 }}>
            Choose one focus area, get just enough perspective to steady yourself, and build a simple plan your team could actually feel.
          </Typography>
        </Stack>
      </Paper>

      <Grid container spacing={2.4} alignItems="flex-start">
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3.2,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.97), rgba(244,248,253,0.9))',
              boxShadow: '0 14px 30px rgba(15,23,42,0.12)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Stack spacing={2.2}>
                <Stack spacing={1.1}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: { xs: '1.24rem', md: '1.5rem' }, fontWeight: 800, color: '#13263A' }}>
                    {activeFocus.subTrait.name}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', color: 'rgba(19,38,58,0.68)' }}>
                    {activeFocus.trait.name}
                  </Typography>
                  <Stack direction="row" spacing={0.9} flexWrap="wrap">
                    <Chip icon={<FlagOutlined />} label={`Compass ${activeFocus.compassScore.toFixed(1)}`} sx={{ bgcolor: 'rgba(69,112,137,0.12)' }} />
                    <Chip icon={<VisibilityOutlined />} label={`Gap ${activeFocus.delta.toFixed(1)}`} sx={{ bgcolor: 'rgba(224,122,63,0.12)' }} />
                    <Chip label={activeFocus.signal.label} sx={{ bgcolor: `${activeFocus.signal.tone}14`, color: activeFocus.signal.tone, border: `1px solid ${activeFocus.signal.tone}33` }} />
                  </Stack>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', color: '#20384F', lineHeight: 1.6 }}>
                    {activeFocus.signal.description}
                  </Typography>
                </Stack>

                <Grid container spacing={1.3}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid rgba(69,112,137,0.18)', background: 'linear-gradient(145deg, rgba(239,246,252,0.95), rgba(230,239,248,0.9))', height: '100%' }}>
                      <Stack spacing={0.6}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#457089', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {activeFocus.supportModel.voice}
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                          {activeFocus.supportModel.reflection}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid rgba(224,122,63,0.18)', background: 'linear-gradient(145deg, rgba(255,249,244,0.96), rgba(250,241,233,0.92))', height: '100%' }}>
                      <Stack spacing={0.6}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#E07A3F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Pressure Test
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                          {activeFocus.supportModel.question}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid rgba(19,38,58,0.12)', background: 'rgba(255,255,255,0.78)', height: '100%' }}>
                      <Stack spacing={0.6}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#13263A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Aim Of The Plan
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#20384F', lineHeight: 1.55 }}>
                          {activeFocus.supportModel.outcome}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Grid container spacing={1.4}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: { xs: 1.5, md: 1.8 }, borderRadius: 2.7, border: '1px solid rgba(19,38,58,0.1)', background: 'rgba(255,255,255,0.76)' }}>
                      <Stack spacing={1}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#457089', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Step 1
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A' }}>
                          Name the move
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'rgba(19,38,58,0.66)', lineHeight: 1.55 }}>
                          Keep it specific and behavioral. What are you actually going to do differently?
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          placeholder="Example: I will close every weekly staff meeting by clarifying the one decision, owner, and deadline."
                          value={activePlan.commitment || ''}
                          onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { commitment: event.target.value })}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                        />
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: { xs: 1.5, md: 1.8 }, borderRadius: 2.7, border: '1px solid rgba(19,38,58,0.1)', background: 'rgba(255,255,255,0.76)' }}>
                      <Stack spacing={1}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#457089', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Step 2
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A' }}>
                          Make it visible
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'rgba(19,38,58,0.66)', lineHeight: 1.55 }}>
                          If this improved, what would your team notice first without needing you to explain it?
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          placeholder="Example: My team would leave meetings with less ambiguity and fewer repeated follow-up questions."
                          value={activePlan.teamSignal || ''}
                          onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { teamSignal: event.target.value })}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                        />
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: { xs: 1.5, md: 1.8 }, borderRadius: 2.7, border: '1px solid rgba(19,38,58,0.1)', background: 'rgba(255,255,255,0.76)' }}>
                      <Stack spacing={1.1}>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#457089', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Step 3
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A' }}>
                          Keep it honest
                        </Typography>
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'rgba(19,38,58,0.66)', lineHeight: 1.55 }}>
                          What proof would tell you this is really happening in the flow of work?
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          placeholder="Example: I can point to three meetings this month where ownership and next steps were clearly understood."
                          value={activePlan.proof || ''}
                          onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { proof: event.target.value })}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                        />

                        <Stack spacing={0.8} sx={{ pt: 0.4 }}>
                          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#13263A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Optional Check-In Rhythm
                          </Typography>
                          <Stack direction="row" spacing={0.8} flexWrap="wrap">
                            {CADENCE_OPTIONS.map((option) => {
                              const active = activePlan.cadence === option;
                              return (
                                <Chip
                                  key={option}
                                  clickable
                                  label={option}
                                  onClick={() => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { cadence: active ? '' : option })}
                                  sx={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontWeight: 700,
                                    bgcolor: active ? '#457089' : 'rgba(69,112,137,0.08)',
                                    color: active ? '#FFFFFF' : '#20384F',
                                    border: `1px solid ${active ? '#457089' : 'rgba(69,112,137,0.2)'}`,
                                  }}
                                />
                              );
                            })}
                          </Stack>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Paper sx={{ p: { xs: 1.5, md: 1.8 }, borderRadius: 2.7, border: '1px solid rgba(224,122,63,0.18)', background: 'linear-gradient(145deg, rgba(255,249,244,0.96), rgba(250,241,233,0.92))' }}>
                  <Stack spacing={1}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#E07A3F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Optional Support Move
                    </Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: 'rgba(19,38,58,0.68)', lineHeight: 1.55 }}>
                      Add one smaller behavior only if it helps support the main plan. This should not become a second full plan.
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="Example: I will block ten minutes after each team meeting to write and send the follow-through summary."
                      value={activePlan.support || ''}
                      onChange={(event) => updatePlan(activeFocus.trait.id, activeFocus.subTrait.id, { support: event.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                    />
                  </Stack>
                </Paper>

                <Paper sx={{ p: { xs: 1.5, md: 1.8 }, borderRadius: 2.7, border: '1px solid rgba(69,112,137,0.16)', background: 'rgba(255,255,255,0.76)' }}>
                  <Stack spacing={0.9}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AutoAwesome sx={{ color: '#457089', fontSize: 18 }} />
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.96rem', fontWeight: 800, color: '#13263A' }}>
                        What carries into My Journey
                      </Typography>
                    </Stack>
                    {activeJourneyItems.length ? (
                      <Stack spacing={0.65}>
                        {activeJourneyItems.map((item) => (
                          <Typography key={item.id} sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: '#20384F', lineHeight: 1.5 }}>
                            • {item.text}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', color: 'rgba(19,38,58,0.62)' }}>
                        Build the plan above and this section will show the exact trail commitments that move forward.
                      </Typography>
                    )}
                  </Stack>
                </Paper>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: saveMessage ? '#2F855A' : 'rgba(19,38,58,0.64)', fontWeight: saveMessage ? 700 : 500 }}>
                    {saveMessage || 'The goal here is clarity and momentum, not a perfect plan on the first pass.'}
                  </Typography>
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

        <Grid item xs={12} lg={4}>
          <Stack spacing={1.15}>
            {focusCards.map((focus) => {
              const active = focus.key === activeKey;
              return (
                <Paper
                  key={focus.key}
                  onClick={() => setActiveKey(focus.key)}
                  sx={{
                    p: 1.45,
                    borderRadius: 2.6,
                    cursor: 'pointer',
                    border: active ? '1px solid rgba(224,122,63,0.55)' : '1px solid rgba(255,255,255,0.18)',
                    background: active
                      ? 'linear-gradient(145deg, rgba(255,250,245,0.98), rgba(246,239,230,0.92))'
                      : 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(242,246,251,0.9))',
                    boxShadow: active ? '0 10px 24px rgba(15,23,42,0.14)' : '0 8px 18px rgba(15,23,42,0.08)',
                    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 12px 24px rgba(15,23,42,0.12)',
                    },
                  }}
                >
                  <Stack spacing={0.85}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#13263A', lineHeight: 1.3 }}>
                      {focus.subTrait.name}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: 'rgba(19,38,58,0.66)' }}>
                      {focus.trait.name}
                    </Typography>
                    <Stack direction="row" spacing={0.7} flexWrap="wrap">
                      <Chip label={`Compass ${focus.compassScore.toFixed(1)}`} sx={{ bgcolor: 'rgba(69,112,137,0.1)', fontWeight: 700 }} />
                      <Chip label={`Gap ${focus.delta.toFixed(1)}`} sx={{ bgcolor: 'rgba(224,122,63,0.1)', fontWeight: 700 }} />
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default ActionTabStaging;
