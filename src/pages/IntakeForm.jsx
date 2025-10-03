// src/pages/IntakeForm.jsx
import React, { useState, useEffect, memo, useMemo } from 'react';
import {
  Container, Box, Typography, TextField, Slider, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardActions, Grid, LinearProgress, Paper
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Optional: Add Gemunu Libre font for Societal Norms match (uncomment if using CDN in index.html)
// import '@fontsource/gemunu-libre';


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
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 26, height: 26 }}>
              <img
                src="/lep-logo.svg"
                alt="LEP"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{ width: 26, height: 26 }}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  display: { xs: 'inline', sm: 'inline' },
                  ml: 0.5,
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                LEP
              </Typography>
            </Box>
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
      userSelect: 'none',
      p: 2.2,
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
  const [societalResponses, setSocietalResponses] = useState(Array(35).fill(5)); // For 35 questions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepJustValidated, setStepJustValidated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Reset dialog for message steps
  useEffect(() => {
    const messageSteps = [1, 4, 12]; // Profile Msg, Beh Msg, Mindset Msg
    if (messageSteps.includes(currentStep)) {
      setDialogOpen(true);
    }
  }, [currentStep]);

  // fixed, immersive bg setup
  useEffect(() => {
    // nothing to do here now
  }, []);

  // ---------- Questions (split and new) ----------
  const initialQuestionsPart1 = [
    { id: 'name', prompt: 'What is your name?', type: 'text' },
    { id: 'industry', prompt: 'What industry do you work in?', type: 'text' },
    { id: 'role', prompt: 'What is your current job title?', type: 'text' },
    { id: 'responsibilities', prompt: 'Briefly describe what your team is responsible for within the organization.', type: 'text' },
  ];

  const initialQuestionsPart2 = [
    { id: 'teamSize', prompt: 'How many people do you directly manage?', type: 'slider', min: 1, max: 10, labels: { 1: '1', 10: '10+' } },
    { id: 'leadershipExperience', prompt: 'How many years have you been in your current role?', type: 'slider', min: 0, max: 10, labels: { 0: '<1', 10: '10+' } },
    { id: 'careerExperience', prompt: 'How many years have you been in a leadership role?', type: 'slider', min: 0, max: 20, labels: { 0: '<1', 20: '20+' } },
  ];

  const behaviorQuestions = [  // First 6 from mainQuestions (radio/multi)
    {
      id: 'resourcePick',
      theme: 'The Quick Pick',
      prompt: 'If you had to pick one resource to make your leadership life easier, what would it be?',
      type: 'radio',
      options: [
        'More time in the day to focus on priorities',
        'A larger budget to work with',
        'A mentor to guide your decision-making',
        "A team that just 'gets it'",
        'A dedicated time/space for reflection and planning',
        'A high performer to share the load',
      ],
    },
    {
      id: 'coffeeImpression',
      theme: 'The Coffee Break',
      prompt: "You're grabbing coffee with your team. What's the impression you try to leave with them?",
      type: 'radio',
      options: [
        'They really listen to us.',
        "They've got everything under control.",
        'They make us want to step up.',
        'They make our team better.',
        "They're always thinking ahead.",
        'They hold a high bar for us.',
        'They trust us to deliver.',
      ],
    },
    {
      id: 'projectApproach',
      theme: 'The Team Puzzle',
      prompt:
        "You're given a complex project with a tight deadline. Choose the action you'd most likely take first",
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
      prompt:
        'A crisis hits your team unexpectedly. Rank these responses based on how they reflect your approach:',
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
        'A team member disagrees with your plan in front of everyone. In your gut, how do you feel at that moment? Write one sentence about it.',
      type: 'text',
    },
  ];

  const mindsetQuestions = [  // Last 6 from mainQuestions (text/ranking)
    {
      id: 'roleModelTrait',
      theme: 'The Role Model',
      prompt:
        'Think of a leader you admire (real or fictional). Pick two things they do that you wish came more naturally to you.',
      type: 'multi-select',
      options: [
        'Connecting with people effortlessly',
        'Making tough decisions without hesitation',
        'Staying calm under pressure',
        'Painting a clear vision for the future',
        'Getting the best out of everyone',
        'Explaining complex ideas simply',
        'Knowing when to step back and listen',
      ],
      limit: 2,
    },
    {
      id: 'successMetric',
      theme: 'The Impact Check',
      prompt:
        "Picture yourself after the end of a long week. How do you know if you've been successful in your role?",
      type: 'radio',
      options: [
        "The team's buzzing with energy and momentum.",
        'We hit our big goals or deadlines.',
        'Team members stepped up with their own ideas.',
        'I cleared roadblocks that were holding us back.',
        'Collaboration was smooth and drama-free.',
        'Someone acknowledged the progress we made.',
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
      theme: 'The Leader\'s Fuel',
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
      prompt: 'Provide an example of one of your proudest moments as a leader:',
      type: 'text',
    },
    {
      id: 'selfReflection',
      theme: 'The Mirror',
      prompt: 'Be honest with yourself. What do you need to work on?',
      type: 'text',
    },
  ];

  // Full Societal Norms questions from provided code
  const societalNormsQuestions = [
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
    "I know the limits of my natural strengths and that I need others to successfully achieve the height of the company's mission and vision."
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
  const totalSteps = 1 + 1 + 2 + 1 + behaviorQuestions.length + 1 + 1 + mindsetQuestions.length + 1 + agentSelect.length; // Intro + Profile Msg + Profile(2p) + Beh Msg + Beh Qs + Learn + Mind Msg + Mind Qs + Soc(1p) + Agent
  const behaviorStart = 5;
  const behaviorEnd = behaviorStart + behaviorQuestions.length - 1;
  const learningStep = behaviorEnd + 1;
  const mindsetStart = learningStep + 2;
  const mindsetEnd = mindsetStart + mindsetQuestions.length - 1;
  const societalStep = mindsetEnd + 1;
  const agentStep = societalStep + 1;

  const headerLabel = useMemo(() => {
    if (currentStep === 0) return 'Welcome';
    if (currentStep === 1 || currentStep === 2 || currentStep === 3) return 'Profile';
    if (currentStep === 4 || (currentStep >= behaviorStart && currentStep <= behaviorEnd)) return 'Behaviors';
    if (currentStep === learningStep) return 'Learning Moment';
    if (currentStep === learningStep + 1 || (currentStep >= mindsetStart && currentStep <= mindsetEnd)) return 'Mindset';
    if (currentStep === societalStep) return 'Societal Norms';
    if (currentStep === agentStep) return 'Choose Your Agent';
    return 'LEP';
  }, [currentStep, behaviorStart, behaviorEnd, learningStep, mindsetStart, mindsetEnd, societalStep, agentStep]);

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
    const isMessageStep = [1, 4, learningStep + 1].includes(currentStep); // Auto-advance messages

    if (isMessageStep) {
      setDialogOpen(false);
      setCurrentStep(s => s + 1);
      return;
    }

    if (currentStep < totalSteps - 1) {
      // Profile validation (steps 2-3)
      if (currentStep === 2) {
        if (!formData.name || !formData.industry || !formData.role || !formData.responsibilities) return;
      } else if (currentStep === 3) {
        if (formData.teamSize === undefined || formData.leadershipExperience === undefined || formData.careerExperience === undefined) return;
      // Behaviors/Mindset validation (steps 5+, 13+)
      } else if ((currentStep >= behaviorStart && currentStep <= behaviorEnd) || (currentStep >= mindsetStart && currentStep <= mindsetEnd)) {
        const questions = currentStep >= behaviorStart ? behaviorQuestions : mindsetQuestions;
        const qIndex = currentStep >= behaviorStart ? currentStep - behaviorStart : currentStep - mindsetStart;
        const q = questions[qIndex];
        const v = formData[q.id];
        if (q.type === 'text' && !v) return;
        if (q.type === 'multi-select' && (!v || v.length === 0)) return;
        if (q.type === 'ranking' && (!v || v.length !== q.options.length)) return;
        if (q.type === 'radio' && !v) return;
      // Learning Moment (step 11)
      } else if (currentStep === learningStep) {
        if (!formData.learningReflection) return;
      // Societal Norms (step 18) - all answered
      } else if (currentStep === societalStep) {
        if (societalResponses.some(r => r === 5)) return; // Default 5 means unanswered
      // Agent step (step 20)
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

  const handleSubmit = async () => {
    try {
      const selectedAgentId = formData.selectedAgent || 'balancedMentor';
      const updated = { 
        ...formData, 
        selectedAgent: selectedAgentId,
        societalResponses // Add societal array to form data
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
      {(currentStep === 1 || currentStep === 4 || currentStep === learningStep + 1) && (
        <MessageDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          title={currentStep === 1 ? 'Why Profile Matters' : currentStep === 4 ? 'Why Behaviors Matter' : 'Mindset & Norms'}
          content={currentStep === 1 
            ? 'Understanding your background helps tailor insights to your unique context.' 
            : currentStep === 4 
            ? 'Behaviors reveal how you show up daily—let\'s uncover patterns.' 
            : 'Mindset shapes decisions; societal norms often influence them unconsciously.'
          }
        />
      )}

      <PageContainer>
        {/* Intro */}
        {currentStep === 0 && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Welcome to LEP</Typography>
              <Typography sx={{ width: '100%', lineHeight: 1.7 }}>
                This journey is reflective and practical. Move one card at a time, answer honestly, and we'll turn it into a focused leadership summary and growth plan.
              </Typography>
              <MemoButton
                variant="contained"
                color="primary"
                onClick={handleNext}
                sx={{ px: 5, py: 1.4, fontSize: '1.05rem' }}
              >
                I'M READY TO GROW
              </MemoButton>
            </Stack>
          </SectionCard>
        )}

        {/* Profile Page 1 (Step 2) */}
        {currentStep === 2 && (
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
                <MemoButton variant="outlined" onClick={() => setCurrentStep(1)}>Back</MemoButton>
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

        {/* Profile Page 2 (Step 3) */}
        {currentStep === 3 && (
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
                <MemoButton variant="outlined" onClick={() => setCurrentStep(2)}>Back</MemoButton>
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

        {/* Behaviors Questions (Steps 5-10) */}
        {currentStep >= behaviorStart && currentStep <= behaviorEnd && (
          <SectionCard narrow={false}>
            {(() => {
              const qIndex = currentStep - behaviorStart;
              const q = behaviorQuestions[qIndex];

              return (
                <Stack spacing={3} alignItems="stretch" textAlign="left" sx={{ width: '100%' }}>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.8, textAlign: 'center' }}>
                    {q.theme.toUpperCase()}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35, textAlign: 'center' }}>
                    {q.prompt}
                  </Typography>

                  {/* RADIO / MULTI AS CARDS */}
                  {(q.type === 'radio' || q.type === 'multi-select') && (
                    <Grid container spacing={2}>
                      {q.options.map((opt) => {
                        const selected = q.type === 'radio' ? formData[q.id] === opt : (formData[q.id] || []).includes(opt);
                        const disabled = q.type === 'multi-select' && (formData[q.id]?.length >= q.limit) && !selected;
                        return (
                          <Grid item xs={12} sm={6} key={opt}>
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
                                  } else if (current.length < q.limit) {
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

                  {/* TEXT */}
                  {q.type === 'text' && (
                    <MemoTextField
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  )}

                  {/* RANKING */}
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
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
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
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                              Least {q.scale?.bottom || 'like me'}
                            </Typography>
                          </Stack>
                        )}
                      </Droppable>
                    </DragDropContext>
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

        {/* Learning Moment (Step 11) */}
        {currentStep === learningStep && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Learning Moment</Typography>
              <Typography sx={{ mb: 2, opacity: 0.9 }}>Take a breath. What's one key insight from the Behaviors section that surprised you?</Typography>
              <MemoTextField
                value={formData.learningReflection || ''}
                onChange={(e) => handleChange('learningReflection', e.target.value)}
                fullWidth
                multiline
                minRows={3}
                placeholder="One sentence reflection..."
              />
              <Stack direction="row" spacing={2}>
                <MemoButton variant="outlined" onClick={() => setCurrentStep(behaviorEnd)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={!formData.learningReflection}
                >
                  Proceed to Mindset
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Mindset Questions (Steps 13-18) */}
        {currentStep >= mindsetStart && currentStep <= mindsetEnd && (
          <SectionCard narrow={false}>
            {(() => {
              const qIndex = currentStep - mindsetStart;
              const q = mindsetQuestions[qIndex];

              return (
                <Stack spacing={3} alignItems="stretch" textAlign="left" sx={{ width: '100%' }}>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.8, textAlign: 'center' }}>
                    {q.theme.toUpperCase()}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35, textAlign: 'center' }}>
                    {q.prompt}
                  </Typography>

                  {/* Same rendering as Behaviors (radio/multi/text/ranking) */}
                  {(q.type === 'radio' || q.type === 'multi-select') && (
                    <Grid container spacing={2}>
                      {q.options.map((opt) => {
                        const selected = q.type === 'radio' ? formData[q.id] === opt : (formData[q.id] || []).includes(opt);
                        const disabled = q.type === 'multi-select' && (formData[q.id]?.length >= q.limit) && !selected;
                        return (
                          <Grid item xs={12} sm={6} key={opt}>
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
                                  } else if (current.length < q.limit) {
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
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
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
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                              Least {q.scale?.bottom || 'like me'}
                            </Typography>
                          </Stack>
                        )}
                      </Droppable>
                    </DragDropContext>
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

        {/* Societal Norms (Single Step 18: All 35 sliders) */}
        {currentStep === societalStep && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Societal Norms Assessment</Typography>
              <Typography sx={{ mb: 3, opacity: 0.85, maxWidth: 600 }}>
                Rate how often each statement reflects your typical leadership behavior. Use the slider: 1 = Never, 10 = Always.
              </Typography>
              <Stack spacing={2} sx={{ width: '100%' }}>
                {societalNormsQuestions.map((q, idx) => (
                  <Paper
                    key={idx}
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
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {q}
                    </Typography>
                    <MemoSlider
                      value={societalResponses[idx]}
                      onChange={(_, v) => setSocietalValue(idx, v)}
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
                        '& .MuiSlider-markLabel': {
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap',
                          transform: 'translateY(4px)'
                        },
                        '& .MuiSlider-valueLabel': {
                          fontSize: '0.9rem'
                        }
                      }}
                    />
                  </Paper>
                ))}
              </Stack>
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <MemoButton variant="outlined" onClick={() => setCurrentStep(mindsetEnd)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={societalResponses.some(r => r === 5)} // Unanswered defaults
                >
                  Next
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Agent Select (Step 20) */}
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

              <Stack direction="row" spacing={2} justifyContent="center">
                <MemoButton variant="outlined" onClick={() => setCurrentStep(societalStep)}>
                  Back
                </MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSubmitting || !formData.selectedAgent}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
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