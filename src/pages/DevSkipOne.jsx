// src/pages/DevSkipOne.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  TextField,
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
  Slider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SOCIETAL_NORM_STATEMENTS } from '../data/intakeContext';

// ---------- helpers ----------
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

// ---------- data pools ----------
const INDUSTRY_POOL = [
  'Technology','Healthcare','Finance','Education','Manufacturing','Retail','Government','Nonprofit',
  'Energy','Media','Logistics','Hospitality','Professional Services','Telecommunications','Consumer Goods',
];
const ROLE_TITLE_POOL = [
  'Team Lead','Engineering Manager','Product Manager','Operations Manager','Program Manager',
  'Director of Engineering','Technical Lead','Head of Operations','Customer Success Lead','Data Team Lead',
  'Project Manager','Sales Manager','People Manager','Strategy Lead','Innovation Lead',
];
const RESOURCE_PICK = ['Time', 'Budget', 'Expectations', 'Scope'];
const PROJECT_APPROACH = [
  'Create a detailed plan to guide the team.',
  'Dive into the most challenging aspect to lead by example.',
  'Gather the team for a collaborative brainstorming session.',
  'Focus on identifying and mitigating the biggest risks.',
  'Distribute tasks to the team and set clear check-in points.',
  'Ask clarifying questions before diving in.',
];
const ENERGY_DRAINS = [
  'Repeating myself to ensure understanding',
  "Addressing a team member's inconsistent contributions",
  'Decoding unspoken concerns from the team',
  'Navigating frequent changes in priorities',
  'Meetings with limited or no outcomes',
  'Mediating conflicts within the team',
  'Pursuing goals that lack clear direction',
  'Balancing differing expectations from stakeholders',
];
const CRISIS_RESPONSE = [
  'Maintain composure and provide clear, decisive direction to the team.',
  'Immediately gather the team to collaborate on potential solutions.',
  'First verify all facts and details before taking any action.',
  'Delegate ownership to team members while providing support from the sidelines.',
  'Jump in directly to handle the most critical aspects myself.',
];
const ROLE_MODEL_TRAIT = [
  'communicated',
  'made decisions',
  'thought strategically',
  'executed & followed through',
  'developed their team',
  'shaped culture',
  'built relationships',
  'handled challenges',
  'inspired others',
  'balanced priorities',
];
const WARNING_LABEL = [
  'Caution: May overthink the details',
  'Warning: Moves fast—keep up!',
  'Winding Road: we change directions quickly',
  'Flammable: Sparks fly under pressure',
  'Fragile: Avoid too much pushback',
  'Falling Rocks: Tendency to over-delegate',
  'Deer Crossing: May jump into your lane',
  'Wrong Way: My way or the highway',
];
const LEADER_FUEL = [
  "Seeing the team gel and succeed together",
  "Nailing a tough project on time",
  "Solving a problem no one else could",
  "Hearing the team say they learned something",
  "My team getting the recognition it deserves",
  "Turning chaos into order",
];
const AGENTS = [
  "bluntPracticalFriend",
  "formalEmpatheticCoach",
  "balancedMentor",
  "comedyRoaster",
  "pragmaticProblemSolver",
  "highSchoolCoach",
];

const PUSHBACK_FEELING_POOL = [
  'Defensive', 'Frustrated', 'Curious', 'Dismissive', 'Apprehensive',
  'Motivated', 'Insecure', 'Irritated', 'Open', 'Doubtful',
  'Calm', 'Competitive', 'Humbled', 'Surprised', 'Relieved',
  'Proud', 'Confused', 'Nothing'
];

const VISIBILITY_COMFORT = [
  'I thrive in the spotlight.',
  'I can handle it but prefer smaller settings.',
  "I don't think much about it either way.",
  'I prefer to lead behind the scenes.',
];

const DECISION_PACE = [
  'The Fix — Get things back on track',
  'The Feedback — Learn where things went wrong',
];

const TEAM_PERCEPTION = [
  'Address it directly and immediately in a private conversation.',
  'Observe for patterns and gather context before taking action.',
  'Provide additional support and resources to help them improve.',
  'Reassign tasks or adjust their responsibilities to better fit their strengths.',
  'Set clear expectations and create a performance improvement plan.',
  'Involve HR or escalate to higher management for guidance.',
];

const BEHAVIOR_DICHOTOMIES = [
  { left: 'Prone to listen', right: 'Prone to speak' },
  { left: 'Critical', right: 'Encouraging' },
  { left: 'Detail-Oriented', right: 'Big-picture-oriented' },
  { left: 'Directive', right: 'Empowering' },
  { left: 'Risk-averse', right: 'Risk-tolerant' },
];

// 10 societal/insights items
const SOCIETAL_QUESTIONS = SOCIETAL_NORM_STATEMENTS;

const QUESTION_META = {
  industry: {
    label: 'What industry do you work in?',
    type: 'open-choice',
    options: INDUSTRY_POOL,
    placeholder: 'Enter industry…',
  },

  role: {
    label: 'What is your current job title?',
    type: 'open-choice',
    options: ROLE_TITLE_POOL,
    placeholder: 'Enter role/title…',
  },

  responsibilities: {
    label: 'Briefly describe what your team is responsible for within the organization.',
    type: 'open-choice',
    options: [
      "Set strategy and translate it into quarterly goals.",
      "Align cross-functional teams and clear roadblocks.",
      "Coach and develop team members.",
      "Prioritize roadmap with stakeholders.",
      "Ensure on-time, high-quality delivery.",
      "Communicate progress and risks.",
      "Improve processes and team health.",
      "Manage budgets and resource plans.",
      "Drive customer-centric decisions.",
      "Facilitate postmortems and learning.",
      "Hire and onboard effectively.",
      "Maintain standards and accountability.",
      "Champion experimentation and learning loops.",
      "Balance short-term wins with long-term bets.",
      "Represent the team’s work to executives.",
    ],
    placeholder: 'Describe your primary responsibilities…',
  },

  birthYear: { label: 'What year were you born?', type: 'text' },
  teamSize: { label: 'How many people do you directly manage?', type: 'number', min: 1, max: 10 },
  leadershipExperience: { label: 'How many years have you been in your current role?', type: 'number', min: 1, max: 20 },
  careerExperience: { label: 'How many years have you been in a leadership role?', type: 'number', min: 1, max: 20 },

  resourcePick: { label: 'When resources are tight, which do you usually adjust first?', type: 'select', options: RESOURCE_PICK },
  projectApproach: { label: "You're given a complex project with a tight deadline. Choose the action you'd most likely take first.", type: 'select', options: PROJECT_APPROACH },

  energyDrains: { label: 'Which three situations would you most prefer to minimize throughout the day?', type: 'multi', options: ENERGY_DRAINS, max: 3 },

  crisisResponse: { label: 'A crisis hits your team unexpectedly. Rank the following responses:', type: 'rank', options: CRISIS_RESPONSE },

  pushbackFeeling: {
    label: 'When someone challenges your authority, questions your judgment, or pushes back on your plan — what emotions do you feel in the moment?',
    type: 'multi',
    options: PUSHBACK_FEELING_POOL,
  },

  roleModelTrait: { label: 'Think of a leader you admire and choose the verb that fits best.', type: 'select', options: ROLE_MODEL_TRAIT },

  warningLabel: { label: 'If your leadership style had a "warning label," what would it be?', type: 'select', options: WARNING_LABEL },

  leaderFuel: { label: 'Rank the following outcomes that energize you most.', type: 'rank', options: LEADER_FUEL },

  proudMoment: { label: 'Consider a significant team accomplishment and describe how your contribution made it possible.', type: 'text' },

  behaviorDichotomies: { label: 'Consider the following behaviors and select where you most naturally fit on the scale.', type: 'sliders', sliders: BEHAVIOR_DICHOTOMIES },

  visibilityComfort: { label: 'How comfortable are you leading in high-visibility situations?', type: 'select', options: VISIBILITY_COMFORT },

  decisionPace: { label: 'When something goes wrong, what do you prioritize?', type: 'select', options: DECISION_PACE },

  teamPerception: { label: 'How do you handle a team member that is underperforming?', type: 'select', options: TEAM_PERCEPTION },

  selectedAgent: { label: 'Agent Persona', type: 'select', options: AGENTS },
};

// ---------- generator ----------
const generateRandomPayload = (sessionId) => ({
  sessionId,
  industry: pick(INDUSTRY_POOL),
  role: pick(ROLE_TITLE_POOL),
  responsibilities: pick(QUESTION_META.responsibilities.options),
  birthYear: String(rnd(1965, 2002)),

  teamSize: rnd(1, 10),
  leadershipExperience: rnd(1, 20),
  careerExperience: rnd(1, 20),

  resourcePick: pick(RESOURCE_PICK),
  projectApproach: pick(PROJECT_APPROACH),
  energyDrains: shuffle(ENERGY_DRAINS).slice(0, 3),
  crisisResponse: shuffle(CRISIS_RESPONSE),
  pushbackFeeling: shuffle(PUSHBACK_FEELING_POOL).slice(0, 3),
  roleModelTrait: pick(ROLE_MODEL_TRAIT),
  warningLabel: pick(WARNING_LABEL),
  leaderFuel: shuffle(LEADER_FUEL),
  proudMoment: 'Led a cross-team delivery under a tight deadline.',
  behaviorDichotomies: BEHAVIOR_DICHOTOMIES.map(() => rnd(1, 10)),
  visibilityComfort: pick(VISIBILITY_COMFORT),
  decisionPace: pick(DECISION_PACE),
  teamPerception: pick(TEAM_PERCEPTION),
  selectedAgent: pick(AGENTS),

  userReflection: '',
  timestamp: new Date().toISOString(),
});

// ---------- component ----------
export default function DevSkipOne() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [societalResponses, setSocietalResponses] = useState(
    Array.from({ length: 10 }, () => rnd(1, 10))
  );
  const [aiSummary, setAiSummary] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);

  const [freeTextToggles, setFreeTextToggles] = useState({
    industry: false,
    role: false,
    responsibilities: false,
  });

  const numberOptions = useMemo(() => {
    const make = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return {
      teamSize: make(QUESTION_META.teamSize.min, QUESTION_META.teamSize.max),
      leadershipExperience: make(QUESTION_META.leadershipExperience.min, QUESTION_META.leadershipExperience.max),
      careerExperience: make(QUESTION_META.careerExperience.min, QUESTION_META.careerExperience.max),
    };
  }, []);

  // init
  useEffect(() => {
    (async () => {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `sess-${Date.now()}`;
        localStorage.setItem('sessionId', sessionId);
      }
      const payload = generateRandomPayload(sessionId);

      try {
        await setDoc(doc(db, 'responses', sessionId), { ...payload }, { merge: true });
        localStorage.setItem('societalResponses', JSON.stringify(societalResponses));
        await rerunBoth(payload, societalResponses, false);
      } catch (e) {
        console.error('[DevSkipOne] init error:', e);
      } finally {
        setFormData(payload);
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  // ---------- actions ----------
  const rerunBoth = async (payload, norms, setBusy = true) => {
    if (setBusy) setLoading(true);
    try {
      const sessionId = payload?.sessionId || localStorage.getItem('sessionId') || `sess-${Date.now()}`;
      await setDoc(
        doc(db, 'responses', sessionId),
        { ...payload, societalResponses: norms, timestamp: new Date().toISOString() },
        { merge: true }
      );

      const refRes = await fetch('/api/get-ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, societalResponses: norms }),
      }).catch(() => null);

      const refJson = await refRes?.json().catch(() => ({}));
      setReflection(refJson?.reflection || '(no reflection returned)');

      const sumRes = await fetch('/api/get-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, societalResponses: norms }),
      }).catch(() => null);

      const sumJson = await sumRes?.json().catch(() => ({}));
      setAiSummary(sumJson?.aiSummary || '(no summary returned)');
      if (sumJson?.aiSummary?.trim()) localStorage.setItem('aiSummary', sumJson.aiSummary);
    } catch (e) {
      console.error('[DevSkipOne] rerunBoth error:', e);
    } finally {
      if (setBusy) setLoading(false);
    }
  };

  const handleRandomize = async () => {
    if (!formData) return;
    const sessionId = formData.sessionId || localStorage.getItem('sessionId') || `sess-${Date.now()}`;
    const fresh = generateRandomPayload(sessionId);
    const freshNorms = Array.from({ length: 10 }, () => rnd(1, 10));
    setFormData(fresh);
    setSocietalResponses(freshNorms);
    await rerunBoth(fresh, freshNorms);
  };

  const openReflectionPage = () => {
    if (!formData) return;
    navigate('/', { state: { formData, societalResponses, jumpTo: 'reflection' } });
  };

  const openSummaryPage = () => {
    if (!formData) return;
    navigate('/summary', { state: { formData: { ...formData, societalResponses } } });
  };

  // ---------- field handlers ----------
  const handleSingleChange = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const handleNumberChange = (key) => (e) => {
    const value = Number(e.target.value);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const handleMultiChange = (key, max) => (e) => {
    let value = e.target.value;
    if (Array.isArray(value) && max && value.length > max) value = value.slice(0, max);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const handleRankChange = (key, idx) => (e) => {
    const selection = e.target.value;
    setFormData((prev) => {
      const current = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const options = QUESTION_META[key].options;
      const existingIndex = current.findIndex((v) => v === selection);
      const newArr = [...current];
      if (existingIndex !== -1) {
        const tmp = newArr[idx];
        newArr[idx] = selection;
        newArr[existingIndex] = tmp;
      } else {
        newArr[idx] = selection;
      }
      const chosen = new Set(newArr.filter(Boolean));
      for (const opt of options) {
        if (chosen.size >= options.length) break;
        if (!chosen.has(opt)) {
          const emptyIndex = newArr.findIndex((v) => !v);
          if (emptyIndex !== -1) {
            newArr[emptyIndex] = opt;
            chosen.add(opt);
          }
        }
      }
      return { ...prev, [key]: newArr };
    });
  };
  const toggleFreeText = (key) => (e) => {
    const checked = e.target.checked;
    setFreeTextToggles((prev) => ({ ...prev, [key]: checked }));
  };
  const handleOpenChoiceText = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const setNorm = (index, value) => {
    setSocietalResponses((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // ---------- small UI helpers ----------
  const Section = ({ title, children, dense = false }) => (
    <Paper
      elevation={0}
      sx={{
        p: dense ? 1.5 : 2,
        mb: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.85))',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: dense ? 1.25 : 2 }} />
      <Stack spacing={dense ? 1 : 1.5}>{children}</Stack>
    </Paper>
  );

  const FieldCard = ({ children, dense = false }) => (
    <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { borderColor: 'primary.light' } }}>
      <CardContent sx={{ py: dense ? 1 : 1.5 }}>{children}</CardContent>
    </Card>
  );

  // ---------- renderers ----------
  const renderNumber = (key, meta) => (
    <FieldCard dense>
      <FormControl fullWidth size="small">
        <InputLabel>{meta.label}</InputLabel>
        <Select
          label={meta.label}
          value={Number(formData[key] ?? meta.min)}
          onChange={handleNumberChange(key)}
          input={<OutlinedInput label={meta.label} />}
        >
          {Array.from({ length: meta.max - meta.min + 1 }, (_, i) => meta.min + i).map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldCard>
  );

  const renderSelect = (key, meta) => (
    <FieldCard dense>
      <FormControl fullWidth size="small">
        <InputLabel>{meta.label}</InputLabel>
        <Select
          label={meta.label}
          value={formData[key] ?? ''}
          onChange={handleSingleChange(key)}
          input={<OutlinedInput label={meta.label} />}
        >
          {meta.options.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldCard>
  );

  const renderMulti = (key, meta) => {
    const selected = Array.isArray(formData[key]) ? formData[key] : [];
    return (
      <FieldCard dense>
        <FormControl fullWidth size="small">
          <InputLabel>{meta.label}</InputLabel>
          <Select
            multiple
            value={selected}
            onChange={handleMultiChange(key, meta.max)}
            input={<OutlinedInput label={meta.label} />}
            renderValue={(sel) => (sel || []).join(', ')}
          >
            {meta.options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                <Checkbox checked={selected.indexOf(opt) > -1} />
                <ListItemText primary={opt} />
              </MenuItem>
            ))}
          </Select>
          {meta.max && (
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {(selected || []).length}/{meta.max} selected
            </Typography>
          )}
        </FormControl>
      </FieldCard>
    );
  };

  const renderRank = (key, meta) => {
    const arr = Array.isArray(formData[key]) ? formData[key] : [];
    const options = meta.options;
    return (
      <FieldCard dense>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {meta.label}
        </Typography>
        <Stack spacing={1}>
          {options.map((_, idx) => (
            <FormControl key={`${key}-${idx}`} size="small" fullWidth>
              <InputLabel>{`Rank ${idx + 1}`}</InputLabel>
              <Select
                label={`Rank ${idx + 1}`}
                value={arr[idx] ?? ''}
                onChange={handleRankChange(key, idx)}
                input={<OutlinedInput label={`Rank ${idx + 1}`} />}
              >
                {options.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Stack>
      </FieldCard>
    );
  };

  const renderSliders = (key, meta) => {
    const values = Array.isArray(formData[key]) ? formData[key] : [];
    return (
      <FieldCard dense>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {meta.label}
        </Typography>
        <Stack spacing={2}>
          {meta.sliders.map((pair, idx) => {
            const currentValue = values[idx] ?? 5.5;
            return (
              <Box key={`${key}-${idx}`}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{pair.left}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{pair.right}</Typography>
                </Stack>
                <Slider
                  value={currentValue}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(_, v) => {
                    const next = [...values];
                    next[idx] = v;
                    setFormData((prev) => ({ ...prev, [key]: next }));
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </FieldCard>
    );
  };

  const renderOpenChoice = (key, meta) => {
    const isFree = !!freeTextToggles[key];
    return (
      <FieldCard dense>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{meta.label}</Typography>
          <FormControlLabel control={<Checkbox checked={isFree} onChange={toggleFreeText(key)} />} label="Free Text" />
        </Stack>

        {!isFree ? (
          <FormControl fullWidth size="small">
            <InputLabel>{meta.label}</InputLabel>
            <Select
              label={meta.label}
              value={formData[key] ?? ''}
              onChange={handleSingleChange(key)}
              input={<OutlinedInput label={meta.label} />}
            >
              {meta.options.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
              Random value pre-selected; change to test scenarios.
            </Typography>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            size="small"
            placeholder={meta.placeholder || 'Enter text…'}
            value={formData[key] ?? ''}
            onChange={handleOpenChoiceText(key)}
          />
        )}
      </FieldCard>
    );
  };

  const renderText = (key, meta) => (
    <FieldCard dense>
      <TextField fullWidth size="small" label={meta.label} value={formData[key] ?? ''} onChange={handleSingleChange(key)} />
    </FieldCard>
  );

  if (loading || !formData) {
    return (
      <Box p={6}>
        <Typography>Setting up Dev Skip One…</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100svh',
        width: '100%',
        overflowX: 'hidden',
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
      }}
    >
      {/* Sticky Header OUTSIDE container */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          textAlign: 'center',
          py: 2,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            fontWeight: 700,
            color: 'white',
            textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          Dev Skip — Profile • Behaviors • Mindset
        </Typography>
      </Box>

      {/* Main content below */}
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
        <Grid container spacing={2} alignItems="flex-start">
          {/* Column 1: Actions + Reflection + Summary */}
          <Grid item xs={12} md={4}>
            <Section title="Actions" dense>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={() => rerunBoth({ ...formData }, [...societalResponses])}
                >
                  Re-Run Reflection & Summary
                </Button>
                <Button variant="outlined" onClick={openReflectionPage}>Open Reflection Page</Button>
                <Button variant="outlined" onClick={openSummaryPage}>Open Summary Page</Button>
                <Button variant="outlined" color="secondary" onClick={handleRandomize}>
                  Randomize Answers
                </Button>
              </Stack>
            </Section>

            <Section title="AI Reflection" dense>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'linear-gradient(145deg, #f9f9f9, #eef2f7)',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ color: 'primary.main', fontSize: 28, lineHeight: 1 }}>❝</Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: 'text.primary',
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Agent Insight:</strong> {reflection || '—'}
                  </Typography>
                </Stack>
              </Paper>

              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="Your response to the reflection…"
                value={formData.userReflection || ''}
                onChange={(e) => setFormData((p) => ({ ...p, userReflection: e.target.value }))}
                sx={{ mt: 1 }}
              />
              <CardActions sx={{ justifyContent: 'flex-end', p: 0, pt: 1 }}>
                <Button
                  size="small"
                  onClick={() => rerunBoth({ ...formData }, [...societalResponses])}
                >
                  Save & Re-Run
                </Button>
              </CardActions>
            </Section>

            <Section title="AI Summary (plain text)" dense>
              <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '.98rem', lineHeight: 1.5 }}>
                {aiSummary || '(no summary yet)'}
              </Typography>
            </Section>
          </Grid>

          {/* Column 2: Profile (6) + Behaviors (12) */}
          <Grid item xs={12} md={4}>
            <Section title="Profile" dense>
              {renderOpenChoice('industry', QUESTION_META.industry)}
              {renderOpenChoice('role', QUESTION_META.role)}
              {renderOpenChoice('responsibilities', QUESTION_META.responsibilities)}
              {renderText('birthYear', QUESTION_META.birthYear)}
              {renderNumber('teamSize', QUESTION_META.teamSize)}
              {renderNumber('leadershipExperience', QUESTION_META.leadershipExperience)}
              {renderNumber('careerExperience', QUESTION_META.careerExperience)}
            </Section>

            <Section title="Behaviors" dense>
              {renderSelect('resourcePick', QUESTION_META.resourcePick)}
              {renderSelect('projectApproach', QUESTION_META.projectApproach)}

              {renderMulti('energyDrains', QUESTION_META.energyDrains)}
              {renderRank('crisisResponse', QUESTION_META.crisisResponse)}
              {renderMulti('pushbackFeeling', QUESTION_META.pushbackFeeling)}

              {renderSelect('roleModelTrait', QUESTION_META.roleModelTrait)}
              {renderSelect('warningLabel', QUESTION_META.warningLabel)}
              {renderRank('leaderFuel', QUESTION_META.leaderFuel)}

              {renderText('proudMoment', QUESTION_META.proudMoment)}
              {renderSliders('behaviorDichotomies', QUESTION_META.behaviorDichotomies)}
              {renderSelect('visibilityComfort', QUESTION_META.visibilityComfort)}
              {renderSelect('decisionPace', QUESTION_META.decisionPace)}
              {renderSelect('teamPerception', QUESTION_META.teamPerception)}

              <FieldCard dense>
                <FormControl fullWidth size="small">
                  <InputLabel>{QUESTION_META.selectedAgent.label}</InputLabel>
                  <Select
                    label={QUESTION_META.selectedAgent.label}
                    value={formData.selectedAgent ?? ''}
                    onChange={handleSingleChange('selectedAgent')}
                    input={<OutlinedInput label={QUESTION_META.selectedAgent.label} />}
                  >
                    {QUESTION_META.selectedAgent.options.map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FieldCard>
            </Section>
          </Grid>

          {/* Column 3: Mindset (35 sliders) */}
          <Grid item xs={12} md={4}>
            <Section title="Mindset (Societal Norms)" dense>
              <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.8 }}>
                Rate each 1–10 (tight layout).
              </Typography>

              <Stack spacing={1.25}>
                {SOCIETAL_QUESTIONS.map((q, idx) => (
                  <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: 1.25 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.75,
                          lineHeight: 1.3,
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {q}
                      </Typography>
                      <Slider
                        value={societalResponses[idx] ?? 5}
                        onChange={(_, v) => setNorm(idx, Number(v))}
                        step={1}
                        min={1}
                        max={10}
                        valueLabelDisplay="on"
                        marks={[
                          { value: 1, label: '1' },
                          { value: 10, label: '10' },
                        ]}
                        sx={{
                          mx: 0.5,
                          '& .MuiSlider-markLabel': { fontSize: '0.7rem' },
                          '& .MuiSlider-valueLabel': { fontSize: '0.7rem', top: -26 },
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              <CardActions sx={{ justifyContent: 'flex-end', p: 0, pt: 1.5 }}>
                <Button
                  size="small"
                  onClick={() => rerunBoth({ ...formData }, [...societalResponses])}
                >
                  Save & Re-Run Summary
                </Button>
              </CardActions>
            </Section>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
