import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import {
  Container, Box, Typography, TextField, Slider, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardActions, Grid, LinearProgress, Paper
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { questionBank } from '../data/questionBank';

// ---------- Memo wrappers ----------
const MemoTextField = memo(TextField);
const MemoSlider = memo(Slider);
const MemoButton = memo(Button);
const MemoBox = memo(Box);
const MemoCard = memo(Card);

// ---------- Message Dialog (reusable for pop-ups) ----------
const MessageDialog = ({ open, onClose, title, content }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>{title}</DialogTitle>
    <DialogContent sx={{ textAlign: 'center', py: 2 }}>
      <Typography sx={{ lineHeight: 1.6, opacity: 0.9 }}>{content}</Typography>
    </DialogContent>
    <DialogActions sx={{ justifyContent: 'center' }}>
      <MemoButton variant="contained" onClick={onClose}>Continue</MemoButton>
    </DialogActions>
  </Dialog>
);

// ---------- Styled helpers ----------
const HeaderBar = ({ step = 0, total = 1, sectionLabel = 'Styles & Scenarios' }) => {
  const progress = Math.min(100, Math.max(0, Math.round((step / total) * 100)));

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        width: '100vw',
        backdropFilter: 'saturate(120%) blur(6px)',
        background: 'linear-gradient(180deg, rgba(18,18,18,0.75), rgba(18,18,18,0.55))',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Container maxWidth={false} sx={{ py: 1.25, width: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: 56 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 26, height: 26, flexShrink: 0 }}>
              <img
                src="/lep-logo.svg"
                alt="LEP"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{ width: 26, height: 26 }}
              />
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 700,
                letterSpacing: 0.4,
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
              }}
            >
              The Compass
            </Typography>
          </Stack>

          <Typography
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.92)',
              fontWeight: 600,
              letterSpacing: 0.3,
              flex: 1
            }}
          >
            {sectionLabel}
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, minWidth: 88, textAlign: 'right' }}
          >
            Step {step} / {total}
          </Typography>
        </Stack>
      </Container>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          bgcolor: 'rgba(255,255,255,0.06)',
          '& .MuiLinearProgress-bar': { backgroundColor: '#E07A3F' },
        }}
      />
    </Box>
  );
};

// A centered page container that keeps everything naturally sized
const PageContainer = ({ children }) => (
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
    <Box sx={{ width: '100%', maxWidth: 880 }}>{children}</Box>
  </Container>
);

// Centered card with natural width (never full-bleed)
const SectionCard = ({ children, narrow = false }) => (
  <MemoBox sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
    <MemoCard
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: narrow ? 748 : 880,
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))',
        boxShadow: '0 10px 30px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.4)',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>{children}</CardContent>
    </MemoCard>
  </MemoBox>
);

// "Card button" for radio / multi-select
const OptionCard = ({ selected, children, onClick, disabled }) => (
  <Box
    onClick={disabled ? undefined : onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === 'Enter' ? onClick?.() : null)}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: 68,
      userSelect: 'none',
      p: 1.6,
      borderRadius: 2,
      border: selected ? '2px solid #E07A3F' : '1px solid rgba(0,0,0,0.12)',
      bgcolor: selected ? 'rgba(224, 122, 63, 0.09)' : 'background.paper',
      boxShadow: selected ? '0 6px 22px rgba(224,122,63,0.28)' : '0 2px 10px rgba(0,0,0,0.06)',
      transform: 'perspective(600px) rotateY(0deg)',
      transition: 'box-shadow .25s ease, transform .25s ease, border-color .2s ease, background-color .2s ease',
      cursor: disabled ? 'default' : 'pointer',
      textAlign: 'center',
      '&:hover': {
        boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Typography sx={{ fontSize: '1.05rem', fontWeight: 500 }}>{children}</Typography>
  </Box>
);

// ---------- Component ----------
function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [societalResponses, setSocietalResponses] = useState(Array(10).fill(null)); // null = unanswered
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepJustValidated, setStepJustValidated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const reflectionGeneratedRef = useRef(false); // Track if reflection has been generated
  const navigate = useNavigate();

  // Load user info (name, email) from localStorage if available
  useEffect(() => {
    try {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const userInfo = JSON.parse(savedUserInfo);
        setFormData((prev) => ({
          ...prev,
          name: userInfo.name || '',
          email: userInfo.email || '',
        }));
      }
    } catch (err) {
      console.warn('Could not load user info from localStorage:', err);
    }
  }, []);

  // ---------- Questions ----------
  // Note: Name is now collected in UserInfo page, so we get it from localStorage
  const initialQuestionsPart1 = [
    { id: 'industry', prompt: 'What industry do you work in?', type: 'text' },
    { id: 'role', prompt: 'What is your current job title?', type: 'text' },
    { id: 'responsibilities', prompt: 'Briefly describe what your team is responsible for within the organization.', type: 'text' },
  ];

  const initialQuestionsPart2 = [
    { id: 'teamSize', prompt: 'How many people do you directly manage?', type: 'slider', min: 1, max: 10, labels: { 1: '1', 10: '10+' } },
    { id: 'leadershipExperience', prompt: 'How many years have you been in your current role?', type: 'slider', min: 0, max: 10, labels: { 0: '<1', 10: '10+' } },
    { id: 'careerExperience', prompt: 'How many years have you been in a leadership role?', type: 'slider', min: 0, max: 20, labels: { 0: '<1', 20: '20+' } },
  ];

  // Behavior Questions
  const behaviorSet = [
    {
      id: 'resourcePick',
      theme: 'The Quick Pick',
      prompt: 'When resources are tight, which do you usually adjust first?',
      type: 'radio',
      options: ['Time', 'Budget', 'Expectations', 'Scope'],
    },
    {
      id: 'projectApproach',
      theme: 'The Team Puzzle',
      prompt: "You're given a complex project with a tight deadline. Choose the action you'd most likely take first.",
      type: 'radio',
      options: [
        'Create a detailed plan to guide the team.',
        'Dive into the most challenging aspect to lead by example.',
        'Gather the team for a collaborative brainstorming session.',
        'Focus on identifying and mitigating the biggest risks.',
        'Distribute tasks to the team and set clear check-in points.',
      ],
    },
    {
      id: 'energyDrains',
      theme: 'The Energy Drain',
      prompt: 'Which three situations would you most prefer to minimize throughout the day?',
      type: 'multi-select',
      options: [
        'Repeating myself to ensure understanding',
        "Addressing a team member's inconsistent contributions",
        'Decoding unspoken concerns from the team',
        'Navigating frequent changes in priorities',
        'Meetings with limited or no outcomes',
        'Mediating conflicts within the team',
        'Pursuing goals that lack clear direction',
        'Balancing expectations from high-pressure stakeholders',
      ],
      limit: 3,
    },
    {
      id: 'crisisResponse',
      theme: 'The Fire Drill',
      prompt: 'A crisis hits your team unexpectedly. Rank these responses based on how they reflect your approach:',
      type: 'ranking',
      options: [
        'I stay calm and provide clear direction.',
        'I rally everyone to brainstorm solutions.',
        'I focus on verifying details to ensure accuracy.',
        'I empower the team to take the lead while I support.',
        'I take a hands-on role to address the issue quickly.',
      ],
      scale: { top: 'like me', bottom: 'like me' },
    },
    {
      id: 'pushbackFeeling',
      theme: 'The Pushback Moment',
      prompt:
        'When someone challenges your authority, questions your judgment, or pushes back on your plan — what emotions do you feel most often? (Select all that apply.)',
      type: 'multi-select',
      options: [
        'Defensive', 'Frustrated', 'Curious', 'Dismissive', 'Apprehensive',
        'Motivated', 'Insecure', 'Irritated', 'Open', 'Doubtful',
        'Calm', 'Competitive', 'Humbled', 'Surprised', 'Relieved'
      ],
    },
    {
      id: 'roleModelTrait',
      theme: 'The Role Model',
      prompt:
        'Think of a fictional leader that you admire. If you were to emulate their approach, which part would feel most natural to you?',
      type: 'radio',
      options: [
        'Connecting with people effortlessly',
        'Making tough decisions without hesitation',
        'Staying calm under pressure',
        'Painting a clear vision for the future',
        'Getting the best out of everyone',
        'Explaining complex ideas simply',
        'Knowing when to step back and listen',
        'Earning trust quickly'
      ],
    },
    {
      id: 'warningLabel',
      theme: 'The Warning Label',
      prompt: 'If your leadership style had a "warning label," what would it be?',
      type: 'radio',
      options: [
        'Caution: May overthink the details.',
        'Warning: Moves fast—keep up!',
        'Buckle up, we change directions quickly here.',
        'Flammable: Sparks fly under pressure.',
        'Fragile: Avoid too much pushback.',
        'High voltage: Big ideas ahead.',
      ],
    },
    {
      id: 'leaderFuel',
      theme: "The Leader's Fuel",
      prompt: 'Rank the following outcomes that energize you most.',
      type: 'ranking',
      options: [
        'Seeing the team gel and succeed together',
        'Nailing a tough project on time',
        'Solving a problem no one else could',
        'Hearing the team say they learned something',
        'My team getting the recognition it deserves',
        'Turning chaos into order',
      ],
    },
    {
      id: 'proudMoment',
      theme: 'The Highlight Reel',
      prompt: 'Consider one of your proudest moments in leadership and describe how your leadership made that moment possible.',
      type: 'text',
    },
    {
      id: 'behaviorDichotomies',
      theme: 'The Balance Line',
      prompt:
        'Consider the following behaviors and select where you most naturally fit on the scale.',
      type: 'sliders',
      sliders: [
        { left: 'Prone to listen', right: 'Prone to speak', min: 1, max: 10, step: 1 },
        { left: 'Critical', right: 'Affirming', min: 1, max: 10, step: 1 },
        { left: 'Detail-focused', right: 'Big-picture-oriented', min: 1, max: 10, step: 1 },
        { left: 'Directive', right: 'Empowering', min: 1, max: 10, step: 1 },
        { left: 'Risk-averse', right: 'Risk-tolerant', min: 1, max: 10, step: 1 },
      ],
    },
    {
      id: 'visibilityComfort',
      theme: 'The Spotlight',
      prompt:
        'How comfortable are you leading in high-visibility situations (presentations, crises, or leadership reviews)?',
      type: 'radio',
      options: [
        'Very comfortable — I thrive in the spotlight.',
        'Somewhat comfortable — I can handle it but prefer smaller settings.',
        'Neutral — I don’t think much about it either way.',
        'Uncomfortable — I prefer to lead behind the scenes.',
      ],
    },
    {
      id: 'decisionPace',
      theme: 'The Clock',
      prompt: 'When faced with incomplete information, how do you usually move forward?',
      type: 'radio',
      options: [
        'Act quickly and adjust later.',
        'Gather enough input before deciding.',
        'Wait until I’m confident in the data.',
        'Defer to the team’s consensus before acting.',
      ],
    },
    {
      id: 'teamPerception',
      theme: 'The Read',
      prompt: 'When your team seems disengaged, what do you notice first?',
      type: 'radio',
      options: [
        'Body language or tone changes.',
        'Drop in performance or follow-through.',
        'Reduced participation or initiative.',
        'Tension or silence in meetings.',
        'Side conversations or subtle pushback.',
        'I usually don’t notice until someone mentions it.',
      ],
    },
    {
      id: 'coreDrive',
      theme: 'The Inner Engine',
      prompt: 'What most often drives your leadership actions day-to-day?',
      type: 'radio',
      options: [
        'Achieving results and meeting goals.',
        'Creating harmony and collaboration.',
        'Building others’ confidence and growth.',
        'Challenging the status quo and innovating.',
        'Fulfilling a larger purpose or mission.',
      ],
    },
  ];

  const behaviorClusters = {
    emotional_regulation: ['pushbackFeeling', 'energyDrains'],
    decision_cadence: ['decisionPace', 'crisisResponse', 'projectApproach'],
    team_awareness: ['teamPerception', 'visibilityComfort', 'roleModelTrait'],
    motivational_drive: ['coreDrive', 'leaderFuel', 'resourcePick'],
    self_reflection: ['warningLabel', 'proudMoment', 'behaviorDichotomies'],
  };

  // 10 societal norms (now the "Mindset" section, 5 per page)
  const societalNormsQuestions = [
    "When challenges arise, I share the answer from my experience and expertise.",
    "I visibly react before I respond to difficult or bad news that is shared with me about the company",
    "When the correction/learning from a team member's mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.",
    "I am intentional about hiring employees that equally fit the need and the company culture and values.",
    "My response to dissenting viewpoints shows the team that challenging one another is good thing that leads to growth and innovation",
    "I am known among employees for one-line phrases like \"do what's right,\" \"challenges mean learning,\" or \"We're in this together.\" Perhaps, jokes about it exist among employees.",
    "I have more answers than I do questions in our team discussions.",
    "It is important that our employee performance metrics are are directly connected to their work AND in their control.",
    "I communicate processes, vision, and expectations so much that I am tired of hearing it.",
    "I hand projects over to others and trust them to have equal or more success than I would doing it myself."
  ];

  const agentSelect = [
    {
      prompt: 'Choose the AI agent that will provide your feedback (select one):',
      options: [
        { id: 'bluntPracticalFriend', name: 'Blunt Practical Friend', description: 'A straightforward friend who gives no-nonsense, practical advice with a critical edge.' },
        { id: 'formalEmpatheticCoach', name: 'Formal Empathetic Coach', description: 'A professional coach who delivers polished, supportive feedback with visionary ideas.' },
        { id: 'balancedMentor', name: 'Balanced Mentor', description: 'A mentor who blends practical and inspirational advice.' },
        { id: 'comedyRoaster', name: 'Comedy Roaster', description: 'Humorous but sharp, with actionable advice.' },
        { id: 'pragmaticProblemSolver', name: 'Pragmatic Problem Solver', description: 'Solution-first, simple steps. No fluff.' },
        { id: 'highSchoolCoach', name: 'High School Coach', description: 'Encouraging with practical actions.' },
      ],
    },
  ];

  // ---------- derived values ----------
  const SOCIETAL_GROUP_SIZE = 5;
  const societalGroups = useMemo(() => {
    const groups = [];
    for (let i = 0; i < societalNormsQuestions.length; i += SOCIETAL_GROUP_SIZE) {
      groups.push(societalNormsQuestions.slice(i, i + SOCIETAL_GROUP_SIZE));
    }
    return groups; // 2 groups of 5 (10 total)
  }, [societalNormsQuestions]);

  const stepVars = useMemo(() => {
    const behaviorStart = 4; // after behaviors intro popup (step 3)
    const behaviorEnd = behaviorStart + behaviorSet.length - 1; // 4..15 (12 qs)
    const reflectionStep = behaviorEnd + 1; // 16
    const mindsetIntroStep = reflectionStep + 1; // 17 (popup)
    const societalStart = mindsetIntroStep + 1; // 18
    const societalEnd = societalStart + societalGroups.length - 1; // 18..24 (7 pages)
    const agentStep = societalEnd + 1; // 25
    const totalSteps = agentStep + 1; // 26 total steps (0..25 displayed as 1..26)
    return {
      behaviorStart, behaviorEnd, reflectionStep, mindsetIntroStep,
      societalStart, societalEnd, agentStep, totalSteps
    };
  }, [behaviorSet.length, societalGroups.length]);

  const {
    behaviorStart, behaviorEnd, reflectionStep, mindsetIntroStep,
    societalStart, societalEnd, agentStep, totalSteps
  } = stepVars;

  const headerLabel = useMemo(() => {
    if (currentStep === 0 || currentStep === 1 || currentStep === 2) return 'Profile';
    if (currentStep === 3 || (currentStep >= behaviorStart && currentStep <= behaviorEnd)) return 'Behaviors';
    if (currentStep === reflectionStep) return 'Reflection Moment';
    if (currentStep === mindsetIntroStep || (currentStep >= societalStart && currentStep <= societalEnd)) return 'Mindset';
    if (currentStep === agentStep) return 'Choose Your Agent';
    return 'LEP';
  }, [currentStep, behaviorStart, behaviorEnd, reflectionStep, mindsetIntroStep, societalStart, societalEnd, agentStep]);

  // ---- dialogs and reflection text ----
  useEffect(() => {
    const messageSteps = [0, 3, mindsetIntroStep]; // Profile intro, Behaviors intro, Mindset intro
    setDialogOpen(messageSteps.includes(currentStep));
  }, [currentStep, mindsetIntroStep]);

  // Generate reflection only once when reaching the step, not when formData changes
  useEffect(() => {
    if (currentStep === reflectionStep && !reflectionGeneratedRef.current) {
      reflectionGeneratedRef.current = true; // Mark as generated
      setIsLoadingReflection(true);

      const timer = setTimeout(() => {
        // Exclude userReflection from the data sent to API to prevent regeneration
        const { userReflection, ...dataForReflection } = formData;
        fetch('/api/get-ai-reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dataForReflection, selectedAgent: 'bluntPracticalFriend' }),
        })
          .then(r => r.json())
          .then(data => {
            if (data?.reflection) {
              setReflectionText(data.reflection);
            } else {
              setReflectionText("We couldn't generate a reflection right now. Try again or continue.");
            }
          })
          .catch(() => setReflectionText("Reflection generation failed. Please continue."))
          .finally(() => setIsLoadingReflection(false));
      }, 500); // wait half a second

      return () => clearTimeout(timer);
    }
  }, [currentStep, reflectionStep, formData]); // formData needed for initial generation, but ref prevents re-generation


  // ---------- state helpers ----------
  const handleChange = (id, value) => setFormData(prev => ({ ...prev, [id]: value }));

  const setSocietalValue = (index, value) => {
    const next = [...societalResponses];
    next[index] = value;
    setSocietalResponses(next);
  };

  const nextPulse = () => {
    setStepJustValidated(true);
    setTimeout(() => setStepJustValidated(false), 420);
  };

  const handleNext = async () => {
    const isMessageStep = [0, 3, mindsetIntroStep].includes(currentStep); // auto-advance popups

    if (isMessageStep) {
      setDialogOpen(false);
      setCurrentStep(s => s + 1);
      return;
    }

    if (currentStep < totalSteps - 1) {
      // Profile validation (steps 1-2)
      if (currentStep === 1) {
        if (!formData.name || !formData.industry || !formData.role || !formData.responsibilities) return;
      } else if (currentStep === 2) {
        if (formData.teamSize === undefined || formData.leadershipExperience === undefined || formData.careerExperience === undefined) return;

      // Behaviors validation (steps 5..16)
      } else if (currentStep >= behaviorStart && currentStep <= behaviorEnd) {
        const qIndex = currentStep - behaviorStart;
        const q = behaviorSet[qIndex];
        const v = formData[q.id];
        if (q.type === 'text' && !v) return;
        if (q.type === 'multi-select' && (!v || v.length === 0)) return;
        if (q.type === 'ranking' && (!v || v.length !== q.options.length)) return;
        if (q.type === 'radio' && !v) return;

      // Reflection step - no validation; buttons control navigation
      } else if (currentStep === reflectionStep) {
        return;

      // Societal (Mindset) validation: only current 5 in the shown group must be answered
      // Societal (Mindset): no validation required
} else if (currentStep >= societalStart && currentStep <= societalEnd) {
  // allow skipping unanswered


      // Agent
      } else if (currentStep === agentStep) {
        if (!formData.selectedAgent) return;
        setIsSubmitting(true);
        await handleSubmit();
        return;
      }

      nextPulse();
      setCurrentStep(s => s + 1);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    handleNext();
  };

  const handleDragEnd = (result, questionId, options) => {
    if (!result.destination) return;
    const items = formData[questionId] ? [...formData[questionId]] : [...options];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    handleChange(questionId, items);
  };

  const handleSingleSelect = (questionId, option) => handleChange(questionId, option);

  const handleStartOver = () => {
  // keep profile answers, just restart behaviors
  setCurrentStep(behaviorStart);
};


  const handleSubmit = async () => {
    try {
      const selectedAgentId = formData.selectedAgent || 'balancedMentor';
      const updated = {
        ...formData,
        selectedAgent: selectedAgentId,
        societalResponses
      };
      await addDoc(collection(db, 'responses'), { ...updated, timestamp: new Date() });
      localStorage.setItem('latestFormData', JSON.stringify(updated));
      navigate('/summary', { state: { formData: updated } });
    } catch (e) {
      console.error('Submit failed', e);
      alert('Failed to submit form. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ---------- UI ----------
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100svh',
        width: '100%',
        overflowX: 'hidden',
        // full bleed bg
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
        // dark overlay
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
        },
      }}
    >
      <HeaderBar step={Math.min(currentStep + 1, totalSteps)} total={totalSteps} sectionLabel={headerLabel} />

      {/* Message Pop-ups */}
      {(currentStep === 0 || currentStep === 3 || currentStep === mindsetIntroStep) && (
        <MessageDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          title={
            currentStep === 0
              ? 'Leader Profile'
              : currentStep === 3
              ? 'Leader Behaviors'
              : 'Leader Mindset & Instincts'
          }
          content={
            currentStep === 0
              ? 'The Compass is considerate of your specific leadership environment! Think of the leader profile as context that helps both the insights and growth plan you receive be more pertinent.'
              : currentStep === 3
              ? 'The Compass also takes into account the actions that are most natural to you as a leader, so that your insights and growth plan are considerate of your natural flow state.'
              : 'The Compass is committed to facilitating awareness of a person\'s mindset and leader instincts, which are the most influential and challenging elements to recognize and change.'
          }
        />
      )}

      <PageContainer>
        {/* Profile Page 1 (Step 1) */}
        {currentStep === 1 && (
          <SectionCard narrow={true}>
            <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
              {initialQuestionsPart1.map((q) => (
                <MemoBox key={q.id} sx={{ width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25, lineHeight: 1.35, textAlign: 'center' }}>{q.prompt}</Typography>
                  <MemoTextField
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </MemoBox>
              ))}
              <Stack direction="row" spacing={2}>
                <MemoButton variant="outlined" onClick={() => setCurrentStep(0)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={!formData.name || !formData.industry || !formData.role || !formData.responsibilities}
                  sx={{
                    px: 5,
                    py: 1.4,
                    ...(stepJustValidated && { animation: 'pulse 420ms ease' }),
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.04)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                  Next
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Profile Page 2 (Step 2) */}
        {currentStep === 2 && (
          <SectionCard narrow={true}>
            <Stack spacing={4} alignItems="stretch" textAlign="center" sx={{ width: '100%' }}>
              {initialQuestionsPart2.map((q) => (
                <MemoBox key={q.id} sx={{ width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25, lineHeight: 1.35, textAlign: 'center' }}>{q.prompt}</Typography>
                  <MemoSlider
                    value={formData[q.id] ?? q.min}
                    onChange={(e, value) => handleChange(q.id, value)}
                    min={q.min}
                    max={q.max}
                    sx={{ width: '100%' }}
                  />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {formData[q.id] ?? (q.min === 0 ? '<1' : q.min)}
                  </Typography>
                </MemoBox>
              ))}
              <Stack direction="row" spacing={2}>
                <MemoButton variant="outlined" onClick={() => setCurrentStep(1)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    formData.teamSize === undefined ||
                    formData.leadershipExperience === undefined ||
                    formData.careerExperience === undefined
                  }
                >
                  Next
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}


        {/* Behaviors Questions (Steps 5..16) */}
        {currentStep >= behaviorStart && currentStep <= behaviorEnd && (
          <SectionCard narrow={false}>
            {(() => {
              const qIndex = currentStep - behaviorStart;
              const q = behaviorSet[qIndex];

              return (
                <Stack spacing={3} alignItems="stretch" textAlign="left" sx={{ width: '100%' }}>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.8, textAlign: 'center' }}>
                    {q.theme.toUpperCase()}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35, textAlign: 'center' }}>
                    {q.prompt}
                  </Typography>

                  {(q.type === 'radio' || q.type === 'multi-select') && (
                    <Grid
                      container
                      spacing={2}
                      alignItems="stretch"
                    >
                      {q.options.map((opt) => {
                        const selected = q.type === 'radio' ? formData[q.id] === opt : (formData[q.id] || []).includes(opt);
                        const disabled = q.type === 'multi-select' && q.limit != null && (formData[q.id]?.length >= q.limit) && !selected;
                        return (
                          <Grid
                            item
                            xs={12}
                            sm={q.id === 'pushbackFeeling' ? 6 : 6}
                            md={q.id === 'pushbackFeeling' ? 4 : 6}
                            key={opt}
                            sx={{ display: 'flex' }}
                          >
                            <OptionCard
                              selected={!!selected}
                              disabled={disabled}
                              onClick={() => {
                                if (q.type === 'radio') {
                                  handleSingleSelect(q.id, opt);
                                } else {
                                  const current = formData[q.id] || [];
                                  if (selected) {
                                    handleChange(q.id, current.filter((v) => v !== opt));
                                  } else if (current.length < (q.limit ?? Infinity)) {
                                    handleChange(q.id, [...current, opt]);
                                  }
                                }
                              }}
                            >
                              {opt}
                            </OptionCard>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}

                  {q.type === 'text' && (
                    <MemoTextField
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  )}

                  {q.type === 'ranking' && (
                    <DragDropContext onDragEnd={(result) => handleDragEnd(result, q.id, q.options)}>
                      <Droppable droppableId="ranking">
                        {(provided) => (
                          <Stack
                            spacing={1.3}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            sx={{ width: '100%' }}
                          >
                            <Typography variant="body2" sx={{ opacity: 0.7, textAlign: 'center' }}>
                              Most {q.scale?.top || 'like me'}
                            </Typography>
                            {(formData[q.id] || q.options).map((opt, index) => (
                              <Draggable draggableId={opt} index={index} key={opt}>
                                {(p) => (
                                  <Box
                                    ref={p.innerRef}
                                    {...p.draggableProps}
                                    {...p.dragHandleProps}
                                    sx={{
                                      p: 1.6,
                                      borderRadius: 1.5,
                                      bgcolor: 'rgba(0,0,0,0.04)',
                                      border: '1px solid rgba(0,0,0,0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        mr: 1.5,
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(224,122,63,0.15)',
                                        color: '#E07A3F',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {index + 1}
                                    </Box>
                                    {opt}
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            <Typography variant="body2" sx={{ opacity: 0.7, textAlign: 'center' }}>
                              Least {q.scale?.bottom || 'like me'}
                            </Typography>
                          </Stack>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}

                  {q.type === 'sliders' && Array.isArray(q.sliders) && (
                    <Stack spacing={3} sx={{ width: '100%' }}>
                      {q.sliders.map((s, idx) => {
                        const currentValues = Array.isArray(formData[q.id]) ? formData[q.id] : [];
                        const currentValue = currentValues[idx] ?? Math.round(((s.min ?? 1) + (s.max ?? 10)) / 2);
                        const marks = Array.from({ length: 10 }, (_, i) => ({ value: i + 1 }));
                        return (
                          <Box key={`${q.id}_${idx}`} sx={{ position: 'relative' }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.left}</Typography>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.right}</Typography>
                            </Stack>
                            <Box sx={{ position: 'relative', px: 1 }}>
                              {/* Gradient background track */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: 0,
                                  right: 0,
                                  height: 8,
                                  transform: 'translateY(-50%)',
                                  borderRadius: 1,
                                  // Left section: blue to white (blue at 0%, white at 50%)
                                  // Right section: white to orange (white at 50%, orange at 100%)
                                  background: 'linear-gradient(to right, #6393AA 0%, #ffffff 50%, #ffffff 50%, #E07A3F 100%)',
                                  zIndex: 0,
                                }}
                              />
                              {/* Middle divider line */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  width: 2,
                                  height: 20,
                                  transform: 'translate(-50%, -50%)',
                                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                                  zIndex: 1,
                                  borderRadius: 1,
                                }}
                              />
                              <MemoSlider
                                value={currentValue}
                                onChange={(_, v) => {
                                  const next = [...currentValues];
                                  next[idx] = v;
                                  handleChange(q.id, next);
                                }}
                                min={s.min ?? 1}
                                max={s.max ?? 10}
                                step={s.step ?? 1}
                                marks={marks}
                                valueLabelDisplay="off"
                                sx={{
                                  position: 'relative',
                                  zIndex: 2,
                                  height: 8,
                                  '& .MuiSlider-track': {
                                    display: 'none', // Hide default track, using gradient background instead
                                  },
                                  '& .MuiSlider-rail': {
                                    display: 'none', // Hide default rail
                                  },
                                  '& .MuiSlider-thumb': {
                                    width: 20,
                                    height: 20,
                                    bgcolor: '#fff',
                                    border: '2px solid',
                                    borderColor: currentValue <= 5 ? '#6393AA' : '#E07A3F',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    '&:hover': {
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                                    },
                                    '&.Mui-focusVisible': {
                                      boxShadow: '0 0 0 4px rgba(0,0,0,0.1)',
                                    },
                                  },
                                  '& .MuiSlider-mark': {
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(0, 0, 0, 0.4)',
                                    '&.MuiSlider-markActive': {
                                      bgcolor: currentValue <= 5 ? '#6393AA' : '#E07A3F',
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}

                  <Stack direction="row" spacing={2} sx={{ pt: 1, justifyContent: 'center' }}>
                    <MemoButton variant="outlined" onClick={() => setCurrentStep(s => s - 1)}>
                      Back
                    </MemoButton>
                    <MemoButton
                      variant="contained"
                      onClick={handleNext}
                      disabled={
                        (q.type === 'text' && !formData[q.id]) ||
                        (q.type === 'multi-select' && (!formData[q.id] || formData[q.id].length === 0)) ||
                        (q.type === 'ranking' && (!formData[q.id] || formData[q.id].length !== q.options.length)) ||
                          (q.type === 'radio' && !formData[q.id])
                      }
                      sx={{ ...(stepJustValidated && { animation: 'pulse 420ms ease' }) }}
                    >
                      Next
                    </MemoButton>
                  </Stack>
                </Stack>
              );
            })()}
          </SectionCard>
        )}

       {/* Reflection Moment (Step 17) */}
{currentStep === reflectionStep && (
  <SectionCard narrow={false}>
    <Stack spacing={4} alignItems="center" textAlign="center">
      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>
        Reflection Moment
      </Typography>

      {/* AI Reflection Text */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(145deg, #f9f9f9, #eef2f7)',
          border: '1px solid rgba(0,0,0,0.08)',
          maxWidth: 720,
          mx: 'auto',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{ color: 'primary.main', fontSize: 36, lineHeight: 1 }}>
            ❝
          </Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              color: 'text.primary',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }}
          >
            <strong>Agent Insight:</strong>{' '}
            {reflectionText || 'Generating reflection...'}
          </Typography>
        </Stack>
      </Paper>

      {/* User Input Box */}
      <MemoTextField
        value={formData.userReflection || ''}
        onChange={(e) => handleChange('userReflection', e.target.value)}
        fullWidth
        multiline
        minRows={3}
        placeholder="What are your thoughts on this reflection?"
        sx={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: 2,
          maxWidth: 720,
        }}
      />

      {/* Action Buttons */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        sx={{ pt: 2 }}
      >
        <MemoButton
          variant="outlined"
          onClick={() => setCurrentStep(behaviorStart)} // jump back to first behavior question
        >
          Start Fresh
        </MemoButton>
        <MemoButton
          variant="contained"
          color="primary"
          onClick={() => setCurrentStep(mindsetIntroStep)} // proceed to Mindset intro popup
        >
          Let's Dig Deeper
        </MemoButton>
      </Stack>
    </Stack>
  </SectionCard>
)}




        {/* Mindset (Societal Norms) – 7 pages, 5 sliders each (Steps 19..25) */}
{currentStep >= societalStart && currentStep <= societalEnd && (
  <SectionCard narrow={false}>
    {(() => {
      const groupIdx = currentStep - societalStart; // 0..6
      const start = groupIdx * SOCIETAL_GROUP_SIZE;
      const end = start + SOCIETAL_GROUP_SIZE;

      return (
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Mindset Check</Typography>
          <Typography sx={{ mb: 3, opacity: 0.85, maxWidth: 600 }}>
            Rate how often each statement reflects your typical leadership behavior. Use the slider: 1 = Never, 10 = Always.
          </Typography>

          <Stack spacing={2} sx={{ width: '100%' }}>
            {societalNormsQuestions.slice(start, end).map((q, idx) => {
              const absoluteIdx = start + idx;
              const val = societalResponses[absoluteIdx];
              return (
                <Paper
                  key={absoluteIdx}
                  elevation={4}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                    border: '1px solid',
                    borderColor: 'primary.main',
                    textAlign: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <Typography
  variant="body1" // smaller than h6
  sx={{
    fontWeight: 600,
    mb: 1.5,
    lineHeight: 1.4,
    fontSize: '0.95rem',  // explicitly smaller
    wordBreak: 'break-word',
    overflowWrap: 'anywhere'
  }}
>
  {q}
</Typography>
<MemoSlider
  value={val ?? 5}
  onChange={(_, v) => setSocietalValue(absoluteIdx, v)}
  step={1}
  min={1}
  max={10}
  marks={[
    { value: 1, label: "Never" },
    { value: 10, label: "Always" }
  ]}
  valueLabelDisplay="on"
  sx={{
    mx: 1,
    '& .MuiSlider-root': {
      height: 4,
    },
    '& .MuiSlider-markLabel': {
      fontSize: '0.75rem',   // smaller text for Never/Always
      whiteSpace: 'nowrap',
      transform: 'translateY(6px)', // moves labels down so they fit
    },
    '& .MuiSlider-valueLabel': {
      fontSize: '0.75rem',
      top: -28, // pull the bubble closer
    }
  }}
/>

                </Paper>
              );
            })}
          </Stack>

          {/* If NOT the last group → show Back/Next */}
          {currentStep < societalEnd && (
            <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
              <MemoButton
                variant="outlined"
                onClick={() => setCurrentStep(s => Math.max(s - 1, societalStart))}
              >
                Back
              </MemoButton>
              <MemoButton
  variant="contained"
  onClick={handleNext}
>
  Next
</MemoButton>

            </Stack>
          )}

          {/* If it IS the last group → show "Choose my AI Agent" */}
          {currentStep === societalEnd && (
            <Stack alignItems="center" sx={{ pt: 3 }}>
              <MemoButton
  variant="contained"
  color="primary"
  onClick={() => setCurrentStep(agentStep)}
>
  Choose my AI Agent
</MemoButton>
            </Stack>
          )}
        </Stack>
      );
    })()}
  </SectionCard>
)}

{/* Agent Select (Step 26) */}
{currentStep === agentStep && (
  <SectionCard narrow={false}>
    <Stack spacing={3} alignItems="stretch" textAlign="center" sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>
        Select Your AI Agent
      </Typography>
      <Typography sx={{ width: '100%', opacity: 0.85 }}>
        You'll get honest feedback either way; choose the voice that fits your preference.
      </Typography>

      <Grid container spacing={2}>
        {agentSelect[0].options.map((agent) => (
          <Grid item xs={12} sm={6} md={4} key={agent.id}>
            <MemoCard
              onClick={() => handleChange('selectedAgent', agent.id)}
              sx={{
                height: '100%',
                borderRadius: 2,
                cursor: 'pointer',
                border: formData.selectedAgent === agent.id ? '2px solid #E07A3F' : '1px solid rgba(0,0,0,0.12)',
                transition: 'transform .2s ease, box-shadow .2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {agent.name}
                </Typography>
                <Typography sx={{ opacity: 0.9 }}>{agent.description}</Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <MemoButton
                  variant={formData.selectedAgent === agent.id ? 'contained' : 'outlined'}
                  onClick={() => handleChange('selectedAgent', agent.id)}
                >
                  Choose
                </MemoButton>
              </CardActions>
            </MemoCard>
          </Grid>
        ))}
      </Grid>

      <Stack alignItems="center" sx={{ pt: 3 }}>
        <MemoButton
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.selectedAgent}
        >
          {isSubmitting ? 'Submitting...' : 'Leadership Insights'}
        </MemoButton>
      </Stack>
    </Stack>
  </SectionCard>
)}
</PageContainer>
</Box>
);
}

export default IntakeForm;