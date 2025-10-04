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

// 35 societal/mindset items
const SOCIETAL_QUESTIONS = [
  "When challenges arise, I determine the solution from my experience and expertise.",
  "I am careful to acknowledge and admit my mistakes to my team.",
  "I communicate the long-term vision to the company often and in different ways.",
  "I have a visible reaction to difficult or bad news that is shared with me about the company/team/project (i.e., non-verbal, emotional, or sounds)",
  "I consistently ask for honest feedback from my employees in different ways.",
  "I consistently dialogue with employees about their lives to demonstrate that I care about them.",
  "When speaking with individual employees, I make sure to connect what they do to the company's continued success.",
  "I empower my immediate team to do their jobs without handholding.",
  "I talk about the vision and purpose of the company at every team and company gathering.",
  "I consistently expresses detailed gratitude for both high AND low performing employees.",
  "When the learning from a team member's mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.",
  "I vocally encourage employees to reserve time for creativity or process improvement within their role.",
  "I am intentional about hiring employees that equally fit the need and the company culture and values.",
  "My response to dissenting viewpoints shows the team that challenging one another is good thing that leads to growth and innovation.",
  "I am known among employees for one-line phrases like \"do what's right,\" \"challenges mean learning,\" or \"we're in this together.\"  (Perhaps, even jokes about it exist among employees.)",
  "I have more answers than I do questions in our team discussions or meetings.",
  "It is important that our employee performance metrics are directly connected to their work AND in their full control.",
  "I consistently seek interactions with employees “organically” to hear their thoughts about a project, idea, or recent decision.",
  "I make time to review both the good and bad of a project or experience so that we can improve for next time.",
  "I consistently communicate what matters for our work.",
  "Affirming a team too much can lead to complacency and entitlement.",
  "I solicit employee opinions, concerns, and ideas in a genuine and diversified way.",
  "I openly share with my team when I am struggling professionally.",
  "I communicate processes, vision, and expectations so much that I am tired of hearing it.",
  "It is important to me that we celebrate our employees' big moments like the first day, work anniversaries, personal-milestones, etc.",
  "I am confident we have a shared language at work that goes beyond product codes, acronyms, and job related shorthand.",
  "I communicate that failure is inevitable and celebrate the associated learning.",
  "I regularly meet with my immediate team members to discuss their professional goals and the adjustments I see they could make that can help them reach those goals.",
  "I regularly and intentionally seek to learn from our employees, especially the newer ones.",
  "Our company metrics are clearly and directly aimed at the mission and NOT just the bottom line",
  "I hand projects over to others and trust them to have equal or greater success than I would doing it myself.",
  "I know the limits of my natural strengths and that I need others to successfully achieve the height of the company's mission and vision.",
  // Added 3 to reach 35
  "I block time weekly to think, not just react.",
  "I make tradeoffs explicit to my team.",
  "I close the loop on decisions and share why."
];

const QUESTION_META = {
  name: { label: 'Your Name', type: 'text' },

  industry: {
    label: 'Your Industry',
    type: 'open-choice',
    options: INDUSTRY_POOL,
    placeholder: 'Enter industry…',
  },

  role: {
    label: 'Your Role/Title',
    type: 'open-choice',
    options: ROLE_TITLE_POOL,
    placeholder: 'Enter role/title…',
  },

  responsibilities: {
    label: 'Your Primary Responsibilities',
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

  teamSize: { label: 'Team Size', type: 'number', min: 1, max: 10 },
  leadershipExperience: { label: 'Leadership Experience (years)', type: 'number', min: 0, max: 10 },
  careerExperience: { label: 'Career Experience (years)', type: 'number', min: 0, max: 20 },

  resourcePick: { label: 'If you could add one resource right now, what would help most?', type: 'select', options: RESOURCE_PICK },
  coffeeImpression: { label: 'If your team chatted about you over coffee, what would they say?', type: 'select', options: COFFEE_IMPRESSION },
  projectApproach: { label: 'Faced with a new critical project, which approach resonates most?', type: 'select', options: PROJECT_APPROACH },

  energyDrains: { label: 'Which of these drain your energy most? (choose up to 3)', type: 'multi', options: ENERGY_DRAINS, max: 3 },

  crisisResponse: { label: 'Crisis Response — rank from 1 (most like you) to N', type: 'rank', options: CRISIS_RESPONSE },

  pushbackFeeling: {
    label: 'When someone pushes back on your plan, how do you feel/respond?',
    type: 'open-choice',
    options: PUSHBACK_FEELING_POOL,
    placeholder: 'Describe how you feel/respond to pushback…',
  },

  roleModelTrait: { label: 'What do people admire about you as a role model? (choose up to 2)', type: 'multi', options: ROLE_MODEL_TRAIT, max: 2 },

  successMetric: { label: 'How do you know a week went really well?', type: 'select', options: SUCCESS_METRIC },

  warningLabel: { label: 'If you had a tongue-in-cheek warning label, what would it say?', type: 'select', options: WARNING_LABEL },

  leaderFuel: { label: 'What fuels you as a leader? — rank from 1 (most) to N', type: 'rank', options: LEADER_FUEL },

  proudMoment: { label: 'Share a recent moment you’re proud of', type: 'open-choice', options: PROUD_MOMENT_POOL, placeholder: 'Describe a recent proud moment…' },

  selfReflection: { label: 'A self-reflection that would improve your leadership', type: 'open-choice', options: SELF_REFLECTION_POOL, placeholder: 'Share a self-reflection…' },

  selectedAgent: { label: 'Agent Persona', type: 'select', options: AGENTS },
};

// ---------- generator ----------
const generateRandomPayload = (sessionId) => ({
  sessionId,
  name: "Dev User",
  industry: pick(INDUSTRY_POOL),
  role: pick(ROLE_TITLE_POOL),
  responsibilities: pick(QUESTION_META.responsibilities.options),

  teamSize: rnd(1, 10),
  leadershipExperience: rnd(0, 10),
  careerExperience: rnd(0, 20),

  resourcePick: pick(RESOURCE_PICK),
  coffeeImpression: pick(COFFEE_IMPRESSION),
  projectApproach: pick(PROJECT_APPROACH),
  energyDrains: shuffle(ENERGY_DRAINS).slice(0, 3),
  crisisResponse: shuffle(CRISIS_RESPONSE),
  pushbackFeeling: pick(PUSHBACK_FEELING_POOL),
  roleModelTrait: shuffle(ROLE_MODEL_TRAIT).slice(0, 2),
  successMetric: pick(SUCCESS_METRIC),
  warningLabel: pick(WARNING_LABEL),
  leaderFuel: shuffle(LEADER_FUEL),
  proudMoment: pick(PROUD_MOMENT_POOL),
  selfReflection: pick(SELF_REFLECTION_POOL),
  selectedAgent: pick(AGENTS),

  userReflection: '',
  timestamp: new Date().toISOString(),
});

// ---------- component ----------
export default function DevSkipOne() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [societalResponses, setSocietalResponses] = useState(Array(35).fill(5));
  const [aiSummary, setAiSummary] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);

  const [freeTextToggles, setFreeTextToggles] = useState({
    industry: false,
    role: false,
    responsibilities: false,
    pushbackFeeling: false,
    proudMoment: false,
    selfReflection: false,
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

      const refRes = await fetch('/get-ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, societalResponses: norms }),
      }).catch(() => null);

      const refJson = await refRes?.json().catch(() => ({}));
      setReflection(refJson?.reflection || '(no reflection returned)');

      const sumRes = await fetch('/get-ai-summary', {
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
    const freshNorms = Array.from({ length: 35 }, () => rnd(1, 10));
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
              {renderText('name', QUESTION_META.name)}
              {renderOpenChoice('industry', QUESTION_META.industry)}
              {renderOpenChoice('role', QUESTION_META.role)}
              {renderOpenChoice('responsibilities', QUESTION_META.responsibilities)}
              {renderNumber('teamSize', QUESTION_META.teamSize)}
              {renderNumber('leadershipExperience', QUESTION_META.leadershipExperience)}
              {renderNumber('careerExperience', QUESTION_META.careerExperience)}
            </Section>

            <Section title="Behaviors" dense>
              {renderSelect('resourcePick', QUESTION_META.resourcePick)}
              {renderSelect('coffeeImpression', QUESTION_META.coffeeImpression)}
              {renderSelect('projectApproach', QUESTION_META.projectApproach)}

              {renderMulti('energyDrains', QUESTION_META.energyDrains)}
              {renderRank('crisisResponse', QUESTION_META.crisisResponse)}
              {renderOpenChoice('pushbackFeeling', QUESTION_META.pushbackFeeling)}

              {renderMulti('roleModelTrait', QUESTION_META.roleModelTrait)}
              {renderSelect('successMetric', QUESTION_META.successMetric)}
              {renderSelect('warningLabel', QUESTION_META.warningLabel)}
              {renderRank('leaderFuel', QUESTION_META.leaderFuel)}

              {renderOpenChoice('proudMoment', QUESTION_META.proudMoment)}
              {renderOpenChoice('selfReflection', QUESTION_META.selfReflection)}

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
