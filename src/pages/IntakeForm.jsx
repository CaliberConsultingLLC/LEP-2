import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Slider,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  Grid,
  LinearProgress
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// ---- Memoized MUI (minor perf nicety) ---------------------------------------
const MemoTextField = memo(TextField);
const MemoSlider = memo(Slider);
const MemoButton = memo(Button);
const MemoToggleButton = memo(ToggleButton);

// ---- Intake Form -------------------------------------------------------------
function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // ----------------- QUESTIONS (same content you provided) --------------------
  const initialQuestionsPart1 = [
    { id: 'name', prompt: 'What is your name?', type: 'text' },
    { id: 'industry', prompt: 'What industry do you work in?', type: 'text' },
    { id: 'role', prompt: 'What is your current job title?', type: 'text' },
    { id: 'responsibilities', prompt: 'Briefly describe what your team is responsible for within the organization.', type: 'text' }
  ];

  const initialQuestionsPart2 = [
    { id: 'teamSize', prompt: 'How many people do you directly manage?', type: 'slider', min: 1, max: 10, labels: { 1: '1', 10: '10+' } },
    { id: 'leadershipExperience', prompt: 'How many years have you been in your current role?', type: 'slider', min: 0, max: 10, labels: { 0: '<1', 10: '10+' } },
    { id: 'careerExperience', prompt: 'How many years have you been in a leadership role?', type: 'slider', min: 0, max: 20, labels: { 0: '<1', 20: '20+' } }
  ];

  const mainQuestions = [
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
        'A high performer to share the load'
      ]
    },
    {
      id: 'coffeeImpression',
      theme: 'The Coffee Break',
      prompt: 'You’re grabbing coffee with your team. What’s the impression you try to leave with them?',
      type: 'radio',
      options: [
        'They really listen to us.',
        'They’ve got everything under control.',
        'They make us want to step up.',
        'They make our team better.',
        'They’re always thinking ahead.',
        'They hold a high bar for us.',
        'They trust us to deliver.'
      ]
    },
    {
      id: 'projectApproach',
      theme: 'The Team Puzzle',
      prompt: 'You’re given a complex project with a tight deadline. Choose the action you’d most likely take first',
      type: 'radio',
      options: [
        'Create a detailed plan to guide the team.',
        'Dive into the most challenging aspect to lead by example.',
        'Gather the team for a collaborative brainstorming session.',
        'Focus on identifying and mitigating the biggest risks.',
        'Distribute tasks to the team and set clear check-in points.'
      ]
    },
    {
      id: 'energyDrains',
      theme: 'The Energy Drain',
      prompt: 'Which three situations would you most prefer to minimize throughout the day?',
      type: 'multi-select',
      options: [
        'Repeating myself to ensure understanding',
        'Addressing a team member’s inconsistent contributions',
        'Decoding unspoken concerns from the team',
        'Navigating frequent changes in priorities',
        'Meetings with limited or no outcomes',
        'Mediating conflicts within the team',
        'Pursuing goals that lack clear direction',
        'Balancing expectations from high-pressure stakeholders'
      ],
      limit: 3
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
        'I take a hands-on role to address the issue quickly.'
      ],
      scale: { top: 'like me', bottom: 'like me' }
    },
    {
      id: 'pushbackFeeling',
      theme: 'The Pushback Moment',
      prompt: 'A team member disagrees with your plan in front of everyone. In your gut, how do you feel at that moment? Write one sentence about it.',
      type: 'text'
    },
    {
      id: 'roleModelTrait',
      theme: 'The Role Model',
      prompt: 'Think of a leader you admire (real or fictional). Pick two things they do that you wish came more naturally to you.',
      type: 'multi-select',
      options: [
        'Connecting with people effortlessly',
        'Making tough decisions without hesitation',
        'Staying calm under pressure',
        'Painting a clear vision for the future',
        'Getting the best out of everyone',
        'Explaining complex ideas simply',
        'Knowing when to step back and listen'
      ],
      limit: 2
    },
    {
      id: 'successMetric',
      theme: 'The Impact Check',
      prompt: 'Picture yourself after the end of a long week. How do you know if you’ve been successful in your role?',
      type: 'radio',
      options: [
        'The team’s buzzing with energy and momentum.',
        'We hit our big goals or deadlines.',
        'Team members stepped up with their own ideas.',
        'I cleared roadblocks that were holding us back.',
        'Collaboration was smooth and drama-free.',
        'Someone acknowledged the progress we made.'
      ]
    },
    {
      id: 'warningLabel',
      theme: 'The Warning Label',
      prompt: 'If your leadership style had a ‘warning label,’ what would it be?',
      type: 'radio',
      options: [
        'Caution: May overthink the details.',
        'Warning: Moves fast—keep up!',
        'Buckle up, we change directions quickly here.',
        'Flammable: Sparks fly under pressure.',
        'Fragile: Avoid too much pushback.',
        'High voltage: Big ideas ahead.'
      ]
    },
    {
      id: 'leaderFuel',
      theme: 'The Leader’s Fuel',
      prompt: 'Rank the following outcomes that energize you most.',
      type: 'ranking',
      options: [
        'Seeing the team gel and succeed together',
        'Nailing a tough project on time',
        'Solving a problem no one else could',
        'Hearing the team say they learned something',
        'My team getting the recognition it deserves',
        'Turning chaos into order'
      ]
    },
    {
      id: 'proudMoment',
      theme: 'The Highlight Reel',
      prompt: 'Provide an example of one of your proudest moments as a leader:',
      type: 'text'
    },
    {
      id: 'selfReflection',
      theme: 'The Mirror',
      prompt: 'Be honest with yourself. What do you need to work on?',
      type: 'text'
    }
  ];

  const agentSelect = [
    {
      prompt: 'Choose the AI agent that will provide your feedback (select one):',
      options: [
        { id: 'bluntPracticalFriend', name: 'Blunt Practical Friend', description: 'A straightforward friend who gives no-nonsense, practical advice with a critical edge.' },
        { id: 'formalEmpatheticCoach', name: 'Formal Empathetic Coach', description: 'A professional coach who delivers polished, supportive feedback with visionary ideas.' },
        { id: 'balancedMentor', name: 'Balanced Mentor', description: 'A mentor who provides a mix of professional and approachable feedback, blending practical and inspirational advice.' },
        { id: 'comedyRoaster', name: 'Comedy Roaster', description: 'A highly blunt yet insightful guide who roasts your flaws with humor while offering sharp, actionable advice.' },
        { id: 'pragmaticProblemSolver', name: 'Pragmatic Problem Solver', description: 'A solution-focused guide who breaks down challenges into actionable steps with a no-frills approach.' },
        { id: 'highSchoolCoach', name: 'High School Coach', description: 'A coach who mixes good practical advice with simple inspiration, pushing you to grow like a seasoned mentor.' }
      ]
    }
  ];

  // ----------------- Section meta for header label ---------------------------
  const sections = useMemo(() => {
    // 0: Welcome, 1: Profile, 2: Experience, 3..: Main, then Agent, then Submit
    const mainStart = 3;
    const mainEnd = 2 + mainQuestions.length;
    const agentStep = mainEnd + 1;

    return [
      { range: [0, 0], label: 'Welcome' },
      { range: [1, 1], label: 'Profile' },
      { range: [2, 2], label: 'Experience' },
      { range: [3, mainEnd], label: 'Styles & Scenarios' },
      { range: [agentStep, agentStep], label: 'Agent' }
    ];
  }, [mainQuestions.length]);

  const totalSteps = 1 + 1 + 1 + mainQuestions.length + agentSelect.length + 1; // (Submit dummy end)

  const activeSectionLabel = useMemo(() => {
    for (const s of sections) {
      if (currentStep >= s.range[0] && currentStep <= s.range[1]) return s.label;
    }
    return '…';
  }, [currentStep, sections]);

  // ----------------- Handlers ------------------------------------------------
  const handleChange = (id, value) => setFormData(prev => ({ ...prev, [id]: value }));

  const validateCurrentStep = useCallback(() => {
    if (currentStep === 1) {
      return !!(formData.name && formData.industry && formData.role && formData.responsibilities);
    }
    if (currentStep === 2) {
      return !!(formData.teamSize || formData.teamSize === 0) &&
             !!(formData.leadershipExperience || formData.leadershipExperience === 0) &&
             !!(formData.careerExperience || formData.careerExperience === 0);
    }
    if (currentStep > 2 && currentStep <= 2 + mainQuestions.length) {
      const q = mainQuestions[currentStep - 3];
      if (q.type === 'text') return !!formData[q.id];
      if (q.type === 'multi-select') return (formData[q.id] && formData[q.id].length > 0);
      if (q.type === 'ranking') return (formData[q.id] && formData[q.id].length === q.options.length);
      if (q.type === 'radio') return !!formData[q.id];
    }
    if (currentStep === 3 + mainQuestions.length) {
      return !!formData.selectedAgent;
    }
    // welcome or submit screen
    return true;
  }, [currentStep, formData, mainQuestions]);

  const handleNext = async () => {
    const lastIndex = totalSteps - 1;
    if (currentStep < lastIndex) {
      if (!validateCurrentStep()) return;
      setCurrentStep(prev => Math.min(prev + 1, lastIndex));
    } else if (currentStep === lastIndex) {
      // submit
      setIsSubmitting(true);
      await handleSubmit();
    }
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleDragEnd = (result, questionId, options) => {
    if (!result.destination) return;
    const items = formData[questionId] ? [...formData[questionId]] : [...options];
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    handleChange(questionId, items);
  };

  const handleSubmit = async () => {
    try {
      const selectedAgentId = formData.selectedAgent || 'balancedMentor';
      const updatedFormData = { ...formData, selectedAgent: selectedAgentId };

      const docRef = await addDoc(collection(db, 'responses'), {
        ...updatedFormData,
        timestamp: new Date()
      });

      // local fallback
      localStorage.setItem('latestFormData', JSON.stringify(updatedFormData));

      navigate('/summary', { state: { formData: updatedFormData } });
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit form. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ----------------- Helpers -------------------------------------------------
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const cardEnterKey = (
    <style>{`
      @keyframes cardIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );

  // ----------------- Render step content (card body) -------------------------
  const renderStep = () => {
    // 0: Welcome
    if (currentStep === 0) {
      return (
        <Stack spacing={3} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            Welcome to LEP
          </Typography>
          <Typography sx={{ opacity: 0.9, maxWidth: 720 }}>
            This journey is intentionally reflective and practical. Take a breath—answer honestly.
            We’ll translate your perspective into focused, actionable coaching.
          </Typography>
        </Stack>
      );
    }

    // 1: Initial Part 1
    if (currentStep === 1) {
      return (
        <Stack spacing={3}>
          {initialQuestionsPart1.map(q => (
            <Box key={q.id}>
              <Typography sx={{ mb: 1.2, fontWeight: 600 }}>{q.prompt}</Typography>
              <MemoTextField
                value={formData[q.id] || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                fullWidth
              />
            </Box>
          ))}
        </Stack>
      );
    }

    // 2: Initial Part 2
    if (currentStep === 2) {
      return (
        <Stack spacing={4}>
          {initialQuestionsPart2.map(q => (
            <Box key={q.id}>
              <Typography sx={{ mb: 1.2, fontWeight: 600 }}>{q.prompt}</Typography>
              <MemoSlider
                value={typeof formData[q.id] === 'number' ? formData[q.id] : q.min}
                onChange={(_, v) => handleChange(q.id, v)}
                min={q.min}
                max={q.max}
              />
              <Typography variant="body2" sx={{ opacity: 0.7, textAlign: 'right' }}>
                {formData[q.id] === q.max ? `${q.max}+` : (formData[q.id] ?? q.min)}
              </Typography>
            </Box>
          ))}
        </Stack>
      );
    }

    // 3..N: main questions
    if (currentStep > 2 && currentStep <= 2 + mainQuestions.length) {
      const q = mainQuestions[currentStep - 3];

      return (
        <Stack spacing={3}>
          <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.8 }}>
            {q.theme}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{q.prompt}</Typography>

          {q.type === 'text' && (
            <MemoTextField
              fullWidth
              value={formData[q.id] || ''}
              onChange={(e) => handleChange(q.id, e.target.value)}
            />
          )}

          {q.type === 'radio' && (
            <ToggleButtonGroup
              exclusive
              value={formData[q.id] || ''}
              onChange={(_, v) => v && handleChange(q.id, v)}
              sx={{ flexWrap: 'wrap', gap: 1.2 }}
            >
              {q.options.map(opt => (
                <MemoToggleButton
                  key={opt}
                  value={opt}
                  sx={{
                    textTransform: 'none',
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: 'divider',
                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' }
                  }}
                >
                  {opt}
                </MemoToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          {q.type === 'multi-select' && (
            <>
              <ToggleButtonGroup
                value={formData[q.id] || []}
                onChange={(_, newVal) => handleChange(q.id, newVal)}
                sx={{ flexWrap: 'wrap', gap: 1.2 }}
              >
                {q.options.map(opt => {
                  const picked = formData[q.id] || [];
                  const atLimit = picked.length >= q.limit && !picked.includes(opt);
                  return (
                    <MemoToggleButton
                      key={opt}
                      value={opt}
                      disabled={atLimit}
                      sx={{
                        textTransform: 'none',
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        borderColor: 'divider',
                        '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' }
                      }}
                    >
                      {opt}
                    </MemoToggleButton>
                  );
                })}
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Choose up to {q.limit}. {Math.max(0, q.limit - (formData[q.id]?.length || 0))} remaining.
              </Typography>
            </>
          )}

          {q.type === 'ranking' && (
            <DragDropContext onDragEnd={(r) => handleDragEnd(r, q.id, q.options)}>
              <Droppable droppableId="ranking">
                {(provided) => (
                  <Stack ref={provided.innerRef} {...provided.droppableProps} spacing={1.2}>
                    <Typography variant="caption" sx={{ opacity: 0.75 }}>
                      Drag to rank — most {q.scale?.top || 'like me'} at the top.
                    </Typography>
                    {(formData[q.id] || q.options).map((opt, idx) => (
                      <Draggable key={opt} draggableId={opt} index={idx}>
                        {(prov) => (
                          <Box
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Box sx={{
                              width: 26, height: 26, borderRadius: '50%',
                              bgcolor: 'primary.main', color: 'white',
                              display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700
                            }}>{idx + 1}</Box>
                            <Typography>{opt}</Typography>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Stack>
      );
    }

    // Agent selection
    if (currentStep > 2 + mainQuestions.length && currentStep <= 2 + mainQuestions.length + agentSelect.length) {
      const set = agentSelect[0];
      return (
        <Stack spacing={3}>
          <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
            Select Your AI Agent
          </Typography>
          <Typography sx={{ opacity: 0.9, textAlign: 'center' }}>
            You’ll receive honest guidance in any voice—choose the tone that fits you.
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {set.options.map(agent => (
              <Grid item key={agent.id} xs={12} sm={6} md={4}>
                <Card
                  variant="outlined"
                  sx={{
                    borderWidth: formData.selectedAgent === agent.id ? 2 : 1,
                    borderColor: formData.selectedAgent === agent.id ? 'primary.main' : 'divider',
                    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
                      {agent.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                      variant={formData.selectedAgent === agent.id ? 'contained' : 'outlined'}
                      onClick={() => handleChange('selectedAgent', agent.id)}
                    >
                      Choose
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      );
    }

    // final submit placeholder (we route on Next)
    return (
      <Stack alignItems="center">
        <Typography>Ready to submit.</Typography>
      </Stack>
    );
  };

  // ----------------- Layout ---------------------------------------------------
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        // Framed canvas: subtle vignette + anchored gradient
        backgroundImage:
          'radial-gradient(1200px 700px at 60% 40%, rgba(255,255,255,0.70), rgba(255,255,255,0.20) 40%, rgba(255,255,255,0.05) 65%, rgba(0,0,0,0.15) 100%), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {cardEnterKey}

      {/* Persistent header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(6px)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.70))',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="md" sx={{ py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 800, letterSpacing: 0.6 }}>LEP</Typography>
            <Typography sx={{ opacity: 0.8 }}>{activeSectionLabel}</Typography>
            <Typography sx={{ fontWeight: 600 }}>Step {currentStep + 1} of {totalSteps}</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1,
              height: 4,
              borderRadius: 2,
              '& .MuiLinearProgress-bar': { borderRadius: 2 }
            }}
          />
        </Container>
      </Box>

      {/* Card journey area */}
      <Container maxWidth="md" sx={{ flex: 1, display: 'grid', placeItems: 'center', py: { xs: 3, md: 6 } }}>
        <Card
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 860,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.88))',
            boxShadow: '0 30px 80px rgba(20,20,40,0.18)',
            animation: 'cardIn 220ms ease-out'
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            {renderStep()}
          </CardContent>

          {/* Sticky card footer (actions) */}
          <CardActions
            sx={{
              px: { xs: 3, md: 5 },
              pb: { xs: 3, md: 5 },
              pt: 0,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <MemoButton variant="text" onClick={handleBack} disabled={currentStep === 0}>
              Back
            </MemoButton>
            <MemoButton
              variant="contained"
              onClick={handleNext}
              disabled={!validateCurrentStep() || isSubmitting}
            >
              {currentStep === totalSteps - 1 ? (isSubmitting ? 'Submitting…' : 'Submit') : 'Next'}
            </MemoButton>
          </CardActions>
        </Card>
      </Container>
    </Box>
  );
}

export default IntakeForm;
