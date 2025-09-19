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
  FormHelperText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore'; // REQUIRED
import { db } from '../firebase';                 // REQUIRED

// ---------------------------------------------------------
// Random helpers
// ---------------------------------------------------------
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

// ---------------------------------------------------------
// Existing fixed option pools
// ---------------------------------------------------------
const RESOURCE_PICK = [
  "More time in the day to focus on priorities",
  "A larger budget to work with",
  "A mentor to guide your decision-making",
  "A team that just 'gets it'",
  "A dedicated time/space for reflection and planning",
  "A high performer to share the load",
];

const COFFEE_IMPRESSION = [
  "They really listen to us.",
  "They’ve got everything under control.",
  "They make us want to step up.",
  "They make our team better.",
  "They’re always thinking ahead.",
  "They hold a high bar for us.",
  "They trust us to deliver.",
];

const PROJECT_APPROACH = [
  "Create a detailed plan to guide the team.",
  "Dive into the most challenging aspect to lead by example.",
  "Gather the team for a collaborative brainstorming session.",
  "Focus on identifying and mitigating the biggest risks.",
  "Distribute tasks to the team and set clear check-in points.",
];

const ENERGY_DRAINS = [
  "Repeating myself to ensure understanding",
  "Addressing a team member’s inconsistent contributions",
  "Decoding unspoken concerns from the team",
  "Navigating frequent changes in priorities",
  "Meetings with limited or no outcomes",
  "Mediating conflicts within the team",
  "Pursuing goals that lack clear direction",
  "Balancing expectations from high-pressure stakeholders",
];

const CRISIS_RESPONSE = [
  "I stay calm and provide clear direction.",
  "I rally everyone to brainstorm solutions.",
  "I focus on verifying details to ensure accuracy.",
  "I empower the team to take the lead while I support.",
  "I take a hands-on role to address the issue quickly.",
];

const ROLE_MODEL_TRAIT = [
  "Connecting with people effortlessly",
  "Making tough decisions without hesitation",
  "Staying calm under pressure",
  "Painting a clear vision for the future",
  "Getting the best out of everyone",
  "Explaining complex ideas simply",
  "Knowing when to step back and listen",
];

const SUCCESS_METRIC = [
  "The team’s buzzing with energy and momentum.",
  "We hit our big goals or deadlines.",
  "Team members stepped up with their own ideas.",
  "I cleared roadblocks that were holding us back.",
  "Collaboration was smooth and drama-free.",
  "Someone acknowledged the progress we made.",
];

const WARNING_LABEL = [
  "Caution: May overthink the details.",
  "Warning: Moves fast—keep up!",
  "Buckle up, we change directions quickly here.",
  "Flammable: Sparks fly under pressure.",
  "Fragile: Avoid too much pushback.",
  "High voltage: Big ideas ahead.",
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

// ---------------------------------------------------------
// New: Open-ended statement pools (12–15 each)
// ---------------------------------------------------------
const PUSHBACK_FEELING_POOL = [
  "I feel energized by challenge and curious about the reasoning.",
  "A bit anxious but open to feedback and iteration.",
  "Defensive at first, then I regroup and listen.",
  "Confident if the data supports my call.",
  "I slow down and ask clarifying questions.",
  "I look for the shared goal before debating details.",
  "I get terse—working on staying open.",
  "I welcome dissent if it improves the plan.",
  "I pause decisions to gather more context.",
  "I try to separate ego from outcome.",
  "I ask for a concrete alternative to compare.",
  "I reframe it as a learning opportunity.",
  "I ask what success would look like to them.",
  "I propose a time-boxed experiment.",
  "I escalate only if we’re blocked on delivery.",
];

const PROUD_MOMENT_POOL = [
  "Led a cross-team delivery under a tight deadline.",
  "Turned a failing project into a stable release.",
  "Mentored a junior into a lead role.",
  "Reduced cycle time with a simple process change.",
  "Aligned stakeholders around a clear metric.",
  "Recovered trust after a production incident.",
  "Launched an MVP that unlocked executive buy-in.",
  "Built a culture of blameless postmortems.",
  "Negotiated scope to protect quality.",
  "Grew a strong peer feedback habit.",
  "Shipped a customer-loved feature from idea to launch.",
  "Facilitated a conflict into a durable agreement.",
  "Drove an initiative that improved customer satisfaction.",
  "Established a feedback ritual the team actually uses.",
  "Unlocked a stuck negotiation with a simple reframing.",
];

const SELF_REFLECTION_POOL = [
  "I need to delegate earlier and more clearly.",
  "I over-optimize details when speed matters.",
  "I can improve how I incorporate dissenting views.",
  "I need to state priorities and tradeoffs explicitly.",
  "I should ask for help before I’m overloaded.",
  "I could celebrate wins more consistently.",
  "I should schedule deeper work blocks.",
  "I need to close the loop on decisions publicly.",
  "I can listen longer before proposing solutions.",
  "I should define success criteria up front.",
  "I can be clearer with expectations and timelines.",
  "I should revisit decisions as new data arrives.",
  "I need to make space for quieter voices.",
  "I should narrate my decision process explicitly.",
  "I can separate urgency from importance better.",
];

const RESPONSIBILITIES_POOL = [
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
];

// ---------------------------------------------------------
// UI metadata describing how each field should render
// ---------------------------------------------------------
/**
 * type:
 *  - 'text'             -> single-line text field
 *  - 'number'           -> numeric dropdown
 *  - 'select'           -> single-select dropdown
 *  - 'multi'            -> multi-select with max
 *  - 'rank'             -> multiple rank dropdowns
 *  - 'open-choice'      -> dropdown of canned statements with a Free Text toggle
 */
const QUESTION_META_ORDER = [
  'name',
  'industry',
  'role',
  'responsibilities',
  'teamSize',
  'leadershipExperience',
  'careerExperience',
  'resourcePick',
  'coffeeImpression',
  'projectApproach',
  'energyDrains',
  'crisisResponse',
  'pushbackFeeling',
  'roleModelTrait',
  'successMetric',
  'warningLabel',
  'leaderFuel',
  'proudMoment',
  'selfReflection',
  'selectedAgent',
];

const QUESTION_META = {
  name: { label: 'Your Name', type: 'text' },
  industry: { label: 'Your Industry', type: 'text' },
  role: { label: 'Your Role/Title', type: 'text' },

  responsibilities: {
    label: 'Your Primary Responsibilities',
    type: 'open-choice',
    options: RESPONSIBILITIES_POOL,
    placeholder: 'Describe your primary responsibilities…',
  },

  teamSize: {
    label: 'Team Size',
    type: 'number',
    min: 1,
    max: 10,
  },
  leadershipExperience: {
    label: 'Leadership Experience (years)',
    type: 'number',
    min: 0,
    max: 10,
  },
  careerExperience: {
    label: 'Career Experience (years)',
    type: 'number',
    min: 0,
    max: 20,
  },

  resourcePick: {
    label: 'If you could add one resource right now, what would help most?',
    type: 'select',
    options: RESOURCE_PICK,
  },
  coffeeImpression: {
    label: 'If your team chatted about you over coffee, what would they say?',
    type: 'select',
    options: COFFEE_IMPRESSION,
  },
  projectApproach: {
    label: 'Faced with a new critical project, which approach resonates most?',
    type: 'select',
    options: PROJECT_APPROACH,
  },

  energyDrains: {
    label: 'Which of these drain your energy most? (choose up to 3)',
    type: 'multi',
    options: ENERGY_DRAINS,
    max: 3,
  },

  crisisResponse: {
    label: 'Crisis Response — rank from 1 (most like you) to N',
    type: 'rank',
    options: CRISIS_RESPONSE,
  },

  pushbackFeeling: {
    label: 'When someone pushes back on your plan, how do you feel/respond?',
    type: 'open-choice',
    options: PUSHBACK_FEELING_POOL,
    placeholder: 'Describe how you feel/respond to pushback…',
  },

  roleModelTrait: {
    label: 'What do people admire about you as a role model? (choose up to 2)',
    type: 'multi',
    options: ROLE_MODEL_TRAIT,
    max: 2,
  },

  successMetric: {
    label: 'How do you know a week went really well?',
    type: 'select',
    options: SUCCESS_METRIC,
  },

  warningLabel: {
    label: 'If you had a tongue-in-cheek warning label, what would it say?',
    type: 'select',
    options: WARNING_LABEL,
  },

  leaderFuel: {
    label: 'What fuels you as a leader? — rank from 1 (most) to N',
    type: 'rank',
    options: LEADER_FUEL,
  },

  proudMoment: {
    label: 'Share a recent moment you’re proud of',
    type: 'open-choice',
    options: PROUD_MOMENT_POOL,
    placeholder: 'Describe a recent proud moment…',
  },

  selfReflection: {
    label: 'A self-reflection that would improve your leadership',
    type: 'open-choice',
    options: SELF_REFLECTION_POOL,
    placeholder: 'Share a self-reflection…',
  },

  selectedAgent: {
    label: 'Agent Persona',
    type: 'select',
    options: AGENTS,
  },
};

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------
export default function DevSkipOne() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);

  // Track free-text toggles for open-choice questions
  const [freeTextToggles, setFreeTextToggles] = useState({
    responsibilities: false,
    pushbackFeeling: false,
    proudMoment: false,
    selfReflection: false,
  });

  // Build numeric options for number fields
  const numberOptions = useMemo(() => {
    const make = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return {
      teamSize: make(QUESTION_META.teamSize.min, QUESTION_META.teamSize.max),
      leadershipExperience: make(QUESTION_META.leadershipExperience.min, QUESTION_META.leadershipExperience.max),
      careerExperience: make(QUESTION_META.careerExperience.min, QUESTION_META.careerExperience.max),
    };
  }, []);

  // Initialize session + random intake, write to Firestore, fetch summary
  useEffect(() => {
    (async () => {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `sess-${Date.now()}`;
        localStorage.setItem('sessionId', sessionId);
      }

      const payload = {
        sessionId,
        name: "Dev User",
        industry: "Technology",
        role: "Team Lead",
        responsibilities: pick(RESPONSIBILITIES_POOL),

        // sliders (match ranges in Intake)
        teamSize: rnd(1, 10),
        leadershipExperience: rnd(0, 10),
        careerExperience: rnd(0, 20),

        // radios / multi / ranking / text
        resourcePick: pick(RESOURCE_PICK),
        coffeeImpression: pick(COFFEE_IMPRESSION),
        projectApproach: pick(PROJECT_APPROACH),
        energyDrains: shuffle(ENERGY_DRAINS).slice(0, 3),               // multi (limit 3)
        crisisResponse: shuffle(CRISIS_RESPONSE),                        // ranking (preserve order)
        pushbackFeeling: pick(PUSHBACK_FEELING_POOL),                    // open-choice
        roleModelTrait: shuffle(ROLE_MODEL_TRAIT).slice(0, 2),           // multi (limit 2)
        successMetric: pick(SUCCESS_METRIC),
        warningLabel: pick(WARNING_LABEL),
        leaderFuel: shuffle(LEADER_FUEL),                                // ranking (order)
        proudMoment: pick(PROUD_MOMENT_POOL),                            // open-choice
        selfReflection: pick(SELF_REFLECTION_POOL),                      // open-choice
        selectedAgent: pick(AGENTS),

        timestamp: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'responses', sessionId), payload, { merge: true });

        // existing summary endpoint (POST)
        const res = await fetch('/get-ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setFormData(payload);
        setAiSummary(data.aiSummary || '(no summary returned)');
      } catch (e) {
        console.error('[DevSkip1] error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    if (Array.isArray(value) && max && value.length > max) {
      value = value.slice(0, max);
    }
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Ensure ranking arrays contain each option exactly once
  const handleRankChange = (key, idx) => (e) => {
    const selection = e.target.value;
    setFormData((prev) => {
      const current = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const options = QUESTION_META[key].options;

      // If the selection exists elsewhere, swap
      const existingIndex = current.findIndex((v) => v === selection);
      const newArr = [...current];

      if (existingIndex !== -1) {
        // swap positions
        const tmp = newArr[idx];
        newArr[idx] = selection;
        newArr[existingIndex] = tmp;
      } else {
        newArr[idx] = selection;
      }

      // Ensure every position filled with a unique option (fallback fill)
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

  const rerunSummary = async () => {
    if (!formData) return;
    setLoading(true);

    try {
      // persist current formData for parity with flow
      await setDoc(doc(db, 'responses', formData.sessionId), {
        ...formData,
        timestamp: new Date().toISOString(),
      }, { merge: true });

      const res = await fetch('/get-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setAiSummary(data.aiSummary || '(no summary returned)');
    } catch (e) {
      console.error('[DevSkip1] rerun summary error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Save random societal norms and go to campaign builder (unchanged)
  const saveRandomNormsAndGo = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      console.warn('[DevSkip1] Missing sessionId; cannot write norms.');
      return;
    }

    const responses = Array.from({ length: 32 }, () => Math.floor(Math.random() * 10) + 1);

    try {
      await setDoc(
        doc(db, 'societalNorms', sessionId),
        { sessionId, responses, timestamp: new Date().toISOString() },
        { merge: true }
      );

      // persist summary for builder fallbacks
      if (aiSummary && aiSummary.trim() !== '') {
        localStorage.setItem('aiSummary', aiSummary);
      }

      console.log('[DevSkip1] Norms saved. Going to /campaign-builder');
      navigate('/campaign-builder', { replace: true, state: { aiSummary: aiSummary || null } });
    } catch (e) {
      console.error('[DevSkip1] Failed to save norms:', e);
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Typography>Building scenario…</Typography>
      </Box>
    );
  }

  if (!formData) {
    return (
      <Box p={6}>
        <Typography>Dev Skip failed to initialize.</Typography>
      </Box>
    );
  }

  // ---------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------
  const renderNumber = (key, meta) => (
    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
      <InputLabel>{meta.label}</InputLabel>
      <Select
        label={meta.label}
        value={Number(formData[key] ?? meta.min)}
        onChange={handleNumberChange(key)}
        input={<OutlinedInput label={meta.label} />}
      >
        {numberOptions[key].map((n) => (
          <MenuItem key={n} value={n}>{n}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderSelect = (key, meta) => (
    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
  );

  const renderMulti = (key, meta) => {
    const selected = Array.isArray(formData[key]) ? formData[key] : [];
    const overLimit = meta.max && selected.length > meta.max;

    return (
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>{meta.label}</InputLabel>
        <Select
          multiple
          value={selected}
          onChange={handleMultiChange(key, meta.max)}
          input={<OutlinedInput label={meta.label} />}
          renderValue={(selected) => selected.join(', ')}
        >
          {meta.options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              <Checkbox checked={selected.indexOf(opt) > -1} />
              <ListItemText primary={opt} />
            </MenuItem>
          ))}
        </Select>
        {meta.max && (
          <FormHelperText>
            {selected.length}/{meta.max} selected
            {overLimit ? ' — over the limit!' : ''}
          </FormHelperText>
        )}
      </FormControl>
    );
  };

  const renderRank = (key, meta) => {
    const arr = Array.isArray(formData[key]) ? formData[key] : [];
    const options = meta.options;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{meta.label}</Typography>
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
      </Box>
    );
  };

  const renderOpenChoice = (key, meta) => {
    const isFree = !!freeTextToggles[key];

    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">{meta.label}</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={isFree}
                onChange={toggleFreeText(key)}
              />
            }
            label="Free Text"
          />
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
            <FormHelperText>Random value pre-selected; change to test scenarios.</FormHelperText>
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
      </Box>
    );
  };

  const renderText = (key, meta) => (
    <TextField
      fullWidth
      size="small"
      label={meta.label}
      value={formData[key] ?? ''}
      onChange={handleSingleChange(key)}
      sx={{ mb: 2 }}
    />
  );

  // ---------------------------------------------------------
  // Main render
  // ---------------------------------------------------------
  return (
    <Box sx={{
      p: 5, minHeight: '100vh', width: '100vw',
      backgroundImage: 'linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,.5)), url(/LEP1.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
    }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 3, fontFamily: 'Gemunu Libre, sans-serif' }}>
          Dev Skip 1 — Random Intake + Editable Answers + Re-run Summary
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Left: Editable Questions */}
          <Paper sx={{ p: 2, flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Questions (showing question text + editable answers)</Typography>
            <Divider sx={{ mb: 2 }} />
            {QUESTION_META_ORDER.map((key) => {
              const meta = QUESTION_META[key];
              if (!meta) return null;

              switch (meta.type) {
                case 'text':
                  return renderText(key, meta);
                case 'number':
                  return renderNumber(key, meta);
                case 'select':
                  return renderSelect(key, meta);
                case 'multi':
                  return renderMulti(key, meta);
                case 'rank':
                  return renderRank(key, meta);
                case 'open-choice':
                  return renderOpenChoice(key, meta);
                default:
                  return null;
              }
            })}

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={rerunSummary}>
                Re-run Summary
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Payload (debug)</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </Paper>

          {/* Right: AI Summary */}
          <Paper sx={{ p: 2, flex: 1, minWidth: 0 }}>
            <Typography variant="h6">AI Summary</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{aiSummary}</Typography>
          </Paper>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => navigate('/summary')}>
            Open Summary Page
          </Button>
          <Button variant="outlined" onClick={saveRandomNormsAndGo}>
            Dev Skip Norms → Campaign Builder
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
