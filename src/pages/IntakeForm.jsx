// src/pages/IntakeForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ---------- util ----------
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

// ---------- design tokens (light wrapper so pages feel consistent) ----------
const Page = ({ children }) => (
  <Box sx={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
    {/* static full-viewport background */}
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.62),rgba(255,255,255,.62)), url(/LEP1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
    <Box sx={{ py: { xs: 3, md: 5 } }}>{children}</Box>
  </Box>
);

const ContentSheet = ({ children }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92))',
      backdropFilter: 'blur(2px)',
      p: { xs: 2, md: 3 },
    }}
  >
    {children}
  </Paper>
);

const Section = ({ title, subtitle, children, dense = false }) => (
  <Paper
    elevation={0}
    sx={{
      p: dense ? 2 : 3,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      background: 'rgba(255,255,255,0.98)',
    }}
  >
    <Typography
      variant="h6"
      sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 700, mb: 0.5 }}
    >
      {title}
    </Typography>
    {subtitle ? (
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {subtitle}
      </Typography>
    ) : null}
    <Divider sx={{ mb: 2 }} />
    <Stack spacing={1.5}>{children}</Stack>
  </Paper>
);

const FieldCard = ({ children }) => (
  <Card variant="outlined" sx={{ borderRadius: 2 }}>
    <CardContent sx={{ py: 1.5 }}>{children}</CardContent>
  </Card>
);

// ---------- domain pools (mirrors DevSkipOne so Summary behavior stays consistent) ----------
const INDUSTRY_POOL = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Government',
  'Nonprofit',
  'Energy',
  'Media',
  'Logistics',
  'Hospitality',
  'Professional Services',
  'Telecommunications',
  'Consumer Goods',
];

const ROLE_TITLE_POOL = [
  'Team Lead',
  'Engineering Manager',
  'Product Manager',
  'Operations Manager',
  'Program Manager',
  'Director of Engineering',
  'Technical Lead',
  'Head of Operations',
  'Customer Success Lead',
  'Data Team Lead',
  'Project Manager',
  'Sales Manager',
  'People Manager',
  'Strategy Lead',
  'Innovation Lead',
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

// ---------- main ----------
export default function IntakeForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // free-text toggles for open-choice fields
  const [freeTextToggles, setFreeTextToggles] = useState({
    industry: false,
    role: false,
    responsibilities: false,
    pushbackFeeling: false,
    proudMoment: false,
    selfReflection: false,
  });

  // number ranges as selects (snappier on mobile)
  const numberOptions = useMemo(() => {
    const make = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return {
      teamSize: make(1, 10),
      leadershipExperience: make(0, 10),
      careerExperience: make(0, 20),
    };
  }, []);

  // --- bootstrap: session + hydrate existing form (if present) or seed defaults
  useEffect(() => {
    (async () => {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `sess-${Date.now()}`;
        localStorage.setItem('sessionId', sessionId);
      }

      try {
        const ref = doc(db, 'responses', sessionId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setFormData({ ...snap.data(), sessionId });
        } else {
          const payload = {
            sessionId,
            name: '',
            industry: pick(INDUSTRY_POOL),
            role: pick(ROLE_TITLE_POOL),
            responsibilities: "Ensure on-time, high-quality delivery.",
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
            selectedAgent: 'balancedMentor',
            timestamp: new Date().toISOString(),
          };
          setFormData(payload);
          await setDoc(ref, payload, { merge: true });
        }
      } catch (e) {
        console.error('[IntakeForm] init error', e);
        setError('Failed to initialize form. Please refresh.');
      }
    })();
  }, []);

  // --- debounced autosave on change
  const saveTimer = useRef(null);
  const scheduleSave = (nextData) => {
    if (!nextData?.sessionId) return;
    setSaveState('saving');
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'responses', nextData.sessionId), {
          ...nextData,
          timestamp: new Date().toISOString(),
        }, { merge: true });
        setSaveState('saved');
      } catch (e) {
        console.error('[IntakeForm] autosave error', e);
        setSaveState('error');
      } finally {
        setSaving(false);
      }
    }, 450);
  };

  // --- handlers
  const setField = (key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      scheduleSave(next);
      return next;
    });
  };

  const toggleFreeText = (key) => (e) => {
    const checked = e.target.checked;
    setFreeTextToggles((prev) => ({ ...prev, [key]: checked }));
  };

  const handleRankChange = (key, idx) => (e) => {
    const selection = e.target.value;
    setFormData((prev) => {
      const current = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const options = key === 'crisisResponse' ? CRISIS_RESPONSE : LEADER_FUEL;
      const existingIndex = current.findIndex((v) => v === selection);
      const next = [...current];
      if (existingIndex !== -1) {
        const tmp = next[idx];
        next[idx] = selection;
        next[existingIndex] = tmp;
      } else {
        next[idx] = selection;
      }
      // backfill empties
      const chosen = new Set(next.filter(Boolean));
      for (const opt of options) {
        if (!chosen.has(opt)) {
          const empty = next.findIndex((v) => !v);
          if (empty !== -1) next[empty] = opt;
        }
      }
      scheduleSave({ ...prev, [key]: next });
      return { ...prev, [key]: next };
    });
  };

  const handleSubmit = async () => {
    if (!formData) return;
    // lightweight validation
    if (!formData.name?.trim() || !formData.industry || !formData.role) {
      setError('Please complete Name, Industry, and Role before continuing.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await setDoc(
        doc(db, 'responses', formData.sessionId),
        { ...formData, timestamp: new Date().toISOString() },
        { merge: true }
      );

      // hit your summary API
      const res = await fetch('/get-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const aiSummary = data.aiSummary || '';

      if (aiSummary.trim()) {
        localStorage.setItem('aiSummary', aiSummary);
      }
      navigate('/summary', { replace: true, state: { aiSummary } });
    } catch (e) {
      console.error('[IntakeForm] submit error', e);
      setError('Failed to generate your summary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- field render helpers
  const OpenChoice = ({ label, keyName, options, placeholder }) => {
    const isFree = !!freeTextToggles[keyName];
    return (
      <FieldCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          <FormControlLabel control={<Checkbox checked={isFree} onChange={toggleFreeText(keyName)} />} label="Free Text" />
        </Stack>
        {!isFree ? (
          <FormControl fullWidth size="small">
            <InputLabel>{label}</InputLabel>
            <Select
              label={label}
              value={formData?.[keyName] ?? ''}
              onChange={(e) => setField(keyName, e.target.value)}
              input={<OutlinedInput label={label} />}
            >
              {options.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Choose or switch to free text.</FormHelperText>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            size="small"
            placeholder={placeholder || 'Enter text…'}
            value={formData?.[keyName] ?? ''}
            onChange={(e) => setField(keyName, e.target.value)}
          />
        )}
      </FieldCard>
    );
  };

  const NumberSelect = ({ label, keyName, range }) => (
    <FieldCard>
      <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={Number(formData?.[keyName] ?? range[0])}
          onChange={(e) => setField(keyName, Number(e.target.value))}
          input={<OutlinedInput label={label} />}
        >
          {range.map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldCard>
  );

  const SelectOne = ({ label, keyName, options }) => (
    <FieldCard>
      <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={formData?.[keyName] ?? ''}
          onChange={(e) => setField(keyName, e.target.value)}
          input={<OutlinedInput label={label} />}
        >
          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldCard>
  );

  const MultiSelect = ({ label, keyName, options, max }) => {
    const selected = Array.isArray(formData?.[keyName]) ? formData[keyName] : [];
    const onChange = (e) => {
      let value = e.target.value;
      if (Array.isArray(value) && max && value.length > max) value = value.slice(0, max);
      setField(keyName, value);
    };
    return (
      <FieldCard>
        <FormControl fullWidth size="small">
          <InputLabel>{label}</InputLabel>
          <Select
            multiple
            value={selected}
            onChange={onChange}
            input={<OutlinedInput label={label} />}
            renderValue={(sel) => (sel || []).join(', ')}
          >
            {options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                <Checkbox checked={selected.indexOf(opt) > -1} />
                <ListItemText primary={opt} />
              </MenuItem>
            ))}
          </Select>
          {max ? (
            <FormHelperText>{(selected || []).length}/{max} selected</FormHelperText>
          ) : null}
        </FormControl>
      </FieldCard>
    );
  };

  const RankList = ({ label, keyName, options }) => {
    const arr = Array.isArray(formData?.[keyName]) ? formData[keyName] : [];
    return (
      <FieldCard>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{label}</Typography>
        <Grid container spacing={1}>
          {options.map((_, idx) => (
            <Grid item xs={12} sm={6} key={`${keyName}-${idx}`}>
              <FormControl fullWidth size="small">
                <InputLabel>{`Rank ${idx + 1}`}</InputLabel>
                <Select
                  label={`Rank ${idx + 1}`}
                  value={arr[idx] ?? ''}
                  onChange={handleRankChange(keyName, idx)}
                  input={<OutlinedInput label={`Rank ${idx + 1}`} />}
                >
                  {options.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </FieldCard>
    );
  };

  if (!formData) {
    return (
      <Page>
        <Container maxWidth="lg">
          <ContentSheet>
            <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
              <CircularProgress />
              <Typography>Loading intake…</Typography>
            </Stack>
          </ContentSheet>
        </Container>
      </Page>
    );
  }

  return (
    <Page>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          {/* Header + Save status */}
          <ContentSheet>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Typography variant="h4" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 700 }}>
                Leadership Intake
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                {saveState === 'saving' && <Chip size="small" color="info" label="Saving…" icon={<SaveIcon />} />}
                {saveState === 'saved' && <Chip size="small" color="success" label="Saved" icon={<SaveIcon />} />}
                {saveState === 'error' && <Chip size="small" color="error" label="Save error" icon={<SaveIcon />} />}
                <Button
                  variant="contained"
                  startIcon={<PlayCircleOutlineIcon />}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Generating…' : 'Generate Summary'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={() => window.location.reload()}
                >
                  Reset Page
                </Button>
              </Stack>
            </Stack>
            {error ? (
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            ) : null}
          </ContentSheet>

          {/* Form sections */}
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Section title="Profile" subtitle="A few basics about you and your context.">
                  <FieldCard>
                    <TextField
                      fullWidth
                      size="small"
                      label="Your Name"
                      value={formData.name}
                      onChange={(e) => setField('name', e.target.value)}
                      inputProps={{ maxLength: 80 }}
                      helperText={`${(formData.name || '').length}/80`}
                    />
                  </FieldCard>

                  <OpenChoice
                    label="Your Industry"
                    keyName="industry"
                    options={INDUSTRY_POOL}
                    placeholder="Enter industry…"
                  />
                  <OpenChoice
                    label="Your Role/Title"
                    keyName="role"
                    options={ROLE_TITLE_POOL}
                    placeholder="Enter role/title…"
                  />
                  <OpenChoice
                    label="Your Primary Responsibilities"
                    keyName="responsibilities"
                    options={[
                      "Set strategy and translate it into quarterly goals.",
                      "Align cross-functional teams and clear roadblocks.",
                      "Coach and develop team members.",
                      "Prioritize roadmap with stakeholders.",
                      "Ensure on-time, high-quality delivery.",
                      "Communicate progress and risks.",
                      "Improve processes and team health.",
                      "Manage budgets and resource plans.",
                      "Drive customer-centric decisions.",
                    ]}
                    placeholder="Describe your primary responsibilities…"
                  />
                </Section>

                <Section title="Experience & Team">
                  <NumberSelect label="Team Size" keyName="teamSize" range={numberOptions.teamSize} />
                  <NumberSelect label="Leadership Experience (years)" keyName="leadershipExperience" range={numberOptions.leadershipExperience} />
                  <NumberSelect label="Career Experience (years)" keyName="careerExperience" range={numberOptions.careerExperience} />
                </Section>

                <Section title="Styles & Preferences">
                  <SelectOne label="If you could add one resource right now…" keyName="resourcePick" options={RESOURCE_PICK} />
                  <SelectOne label="If your team chatted about you over coffee…" keyName="coffeeImpression" options={COFFEE_IMPRESSION} />
                  <SelectOne label="Faced with a new critical project…" keyName="projectApproach" options={PROJECT_APPROACH} />
                  <MultiSelect label="Which of these drain your energy most? (up to 3)" keyName="energyDrains" options={ENERGY_DRAINS} max={3} />
                  <RankList label="Crisis Response — rank from 1 (most like you)" keyName="crisisResponse" options={CRISIS_RESPONSE} />
                  <OpenChoice label="When someone pushes back on your plan…" keyName="pushbackFeeling" options={PUSHBACK_FEELING_POOL} placeholder="Describe your response…" />
                  <MultiSelect label="What do people admire about you? (up to 2)" keyName="roleModelTrait" options={ROLE_MODEL_TRAIT} max={2} />
                  <SelectOne label="How do you know a week went really well?" keyName="successMetric" options={SUCCESS_METRIC} />
                  <SelectOne label="If you had a tongue-in-cheek warning label…" keyName="warningLabel" options={WARNING_LABEL} />
                  <RankList label="What fuels you as a leader? — rank from 1 (most)" keyName="leaderFuel" options={LEADER_FUEL} />
                  <OpenChoice label="Share a recent moment you’re proud of" keyName="proudMoment" options={PROUD_MOMENT_POOL} placeholder="Describe a recent proud moment…" />
                  <OpenChoice label="A self-reflection that would improve your leadership" keyName="selfReflection" options={SELF_REFLECTION_POOL} placeholder="Share a self-reflection…" />
                </Section>
              </Stack>
            </Grid>

            {/* Right column: Persona + Actions */}
            <Grid item xs={12} md={5}>
              <Stack spacing={2}>
                <Section title="Agent Persona" dense>
                  <FieldCard>
                    <FormControl fullWidth size="small">
                      <InputLabel>Agent Persona</InputLabel>
                      <Select
                        label="Agent Persona"
                        value={formData.selectedAgent ?? 'balancedMentor'}
                        onChange={(e) => setField('selectedAgent', e.target.value)}
                        input={<OutlinedInput label="Agent Persona" />}
                      >
                        {AGENTS.map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </FieldCard>

                  <Alert severity="info" sx={{ mt: 1 }}>
                    The persona shapes <strong>voice & tone</strong> only. Guidance stays aligned to LEP’s identity.
                  </Alert>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayCircleOutlineIcon />}
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Generating…' : 'Generate Summary'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      onClick={() => scheduleSave(formData)}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save Now'}
                    </Button>
                    <Button variant="text" onClick={() => navigate('/')}>Return Home</Button>
                  </Stack>
                </Section>

                <Section title="Tips" dense>
                  <Typography variant="body2" color="text.secondary">
                    • You can change answers and re-generate your summary anytime.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Keep responses concise; the Agent synthesizes patterns rather than length.
                  </Typography>
                </Section>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Page>
  );
}
