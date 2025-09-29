// src/pages/IntakeForm.jsx
import React, { useState, useEffect, memo } from 'react';
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
  Paper,
  Divider,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Memoize components
const MemoizedTextField = memo(TextField);
const MemoizedSlider = memo(Slider);
const MemoizedButton = memo(Button);
const MemoizedToggleButton = memo(ToggleButton);
const MemoizedBox = memo(Box);
const MemoizedCard = memo(Card);

function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // No logic change; visuals only
  }, []);

  const initialQuestionsPart1 = [
    { id: 'name', prompt: 'What is your name?', type: 'text' },
    { id: 'industry', prompt: 'What industry do you work in?', type: 'text' },
    { id: 'role', prompt: 'What is your current job title?', type: 'text' },
    {
      id: 'responsibilities',
      prompt:
        'Briefly describe what your team is responsible for within the organization.',
      type: 'text',
    },
  ];

  const initialQuestionsPart2 = [
    {
      id: 'teamSize',
      prompt: 'How many people do you directly manage?',
      type: 'slider',
      min: 1,
      max: 10,
      labels: { 1: '1', 10: '10+' },
    },
    {
      id: 'leadershipExperience',
      prompt: 'How many years have you been in your current role?',
      type: 'slider',
      min: 0,
      max: 10,
      labels: { 0: '<1', 10: '10+' },
    },
    {
      id: 'careerExperience',
      prompt: 'How many years have you been in a leadership role?',
      type: 'slider',
      min: 0,
      max: 20,
      labels: { 0: '<1', 20: '20+' },
    },
  ];

  const mainQuestions = [
    {
      id: 'resourcePick',
      theme: 'The Quick Pick',
      prompt:
        'If you had to pick one resource to make your leadership life easier, what would it be?',
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
      prompt:
        'You’re grabbing coffee with your team. What’s the impression you try to leave with them?',
      type: 'radio',
      options: [
        'They really listen to us.',
        'They’ve got everything under control.',
        'They make us want to step up.',
        'They make our team better.',
        'They’re always thinking ahead.',
        'They hold a high bar for us.',
        'They trust us to deliver.',
      ],
    },
    {
      id: 'projectApproach',
      theme: 'The Team Puzzle',
      prompt:
        'You’re given a complex project with a tight deadline. Choose the action you’d most likely take first',
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
      prompt:
        'Which three situations would you most prefer to minimize throughout the day?',
      type: 'multi-select',
      options: [
        'Repeating myself to ensure understanding',
        'Addressing a team member’s inconsistent contributions',
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
        'Picture yourself after the end of a long week. How do you know if you’ve been successful in your role?',
      type: 'radio',
      options: [
        'The team’s buzzing with energy and momentum.',
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
      prompt: 'If your leadership style had a ‘warning label,’ what would it be?',
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
      theme: 'The Leader’s Fuel',
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

  const agentSelect = [
    {
      prompt:
        'Choose the AI agent that will provide your feedback (select one):',
      options: [
        {
          id: 'bluntPracticalFriend',
          name: 'Blunt Practical Friend',
          description:
            'A straightforward friend who gives no-nonsense, practical advice with a critical edge.',
        },
        {
          id: 'formalEmpatheticCoach',
          name: 'Formal Empathetic Coach',
          description:
            'A professional coach who delivers polished, supportive feedback with visionary ideas.',
        },
        {
          id: 'balancedMentor',
          name: 'Balanced Mentor',
          description:
            'A mentor who provides a mix of professional and approachable feedback, blending practical and inspirational advice.',
        },
        {
          id: 'comedyRoaster',
          name: 'Comedy Roaster',
          description:
            'A highly blunt yet insightful guide who roasts your flaws with humor while offering sharp, actionable advice.',
        },
        {
          id: 'pragmaticProblemSolver',
          name: 'Pragmatic Problem Solver',
          description:
            'A solution-focused guide who breaks down challenges into actionable steps with a no-frills approach.',
        },
        {
          id: 'highSchoolCoach',
          name: 'High School Coach',
          description:
            'A coach who mixes good practical advice with simple inspiration, pushing you to grow like a seasoned mentor.',
        },
      ],
    },
  ];

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNext = async () => {
    const totalSteps =
      1 + 1 + 1 + mainQuestions.length + agentSelect.length + 1; // Welcome + Part1 + Part2 + Main + Agent + Submit
    if (currentStep < totalSteps - 1) {
      if (currentStep === 0) {
        // Welcome step, no validation
      } else if (currentStep === 1) {
        // Part 1 validation
        if (
          !formData.name ||
          !formData.industry ||
          !formData.role ||
          !formData.responsibilities
        ) {
          alert('Please fill out all fields in this section.');
          return;
        }
      } else if (currentStep === 2) {
        // Part 2 validation
        if (
          !formData.teamSize ||
          !formData.leadershipExperience ||
          !formData.careerExperience
        ) {
          alert('Please fill out all fields in this section.');
          return;
        }
      } else if (currentStep > 2 && currentStep <= 2 + mainQuestions.length) {
        // Main questions validation
        const currentQuestion = mainQuestions[currentStep - 3];
        if (currentQuestion.type === 'text' && !formData[currentQuestion.id]) {
          alert('Please fill out the text field.');
          return;
        } else if (
          currentQuestion.type === 'multi-select' &&
          (!formData[currentQuestion.id] ||
            formData[currentQuestion.id].length === 0)
        ) {
          alert('Please select at least one option.');
          return;
        } else if (
          currentQuestion.type === 'ranking' &&
          (!formData[currentQuestion.id] ||
            formData[currentQuestion.id].length !==
              currentQuestion.options.length)
        ) {
          alert('Please rank all options.');
          return;
        } else if (
          currentQuestion.type === 'radio' &&
          !formData[currentQuestion.id]
        ) {
          alert('Please select an option.');
          return;
        }
      } else if (currentStep === 3 + mainQuestions.length) {
        // Agent selection validation
        if (!formData.selectedAgent) {
          alert('Please select an AI agent.');
          return;
        }
      }
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === totalSteps - 1) {
      setIsSubmitting(true);
      await handleSubmit(); // navigation happens inside
    }
  };

  const handleDragEnd = (result, questionId, options) => {
    if (!result.destination) return;
    const items = formData[questionId] || [...options];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    handleChange(questionId, items);
  };

  const handleSingleSelect = (questionId, option) => {
    handleChange(questionId, option);
  };

  const handleMultiSelect = (questionId, option, limit) => {
    const current = formData[questionId] || [];
    if (current.includes(option)) {
      handleChange(
        questionId,
        current.filter((item) => item !== option)
      );
    } else if (current.length < limit) {
      handleChange(questionId, [...current, option]);
    }
  };

  const handleSubmit = async () => {
    try {
      const selectedAgentId = formData.selectedAgent || 'balancedMentor';
      const updatedFormData = { ...formData, selectedAgent: selectedAgentId };

      const docRef = await addDoc(collection(db, 'responses'), {
        ...updatedFormData,
        timestamp: new Date(),
      });
      console.log('Firebase submission successful! Doc ID:', docRef.id);

      localStorage.setItem('latestFormData', JSON.stringify(updatedFormData));
      navigate('/summary', { state: { formData: updatedFormData } });
    } catch (error) {
      console.error('Firebase submission failed:', error);
      alert('Failed to submit form. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ---- UI ----
  const ContentSheet = ({ children, max = 'sm' }) => (
    <Container maxWidth={max} sx={{ py: { xs: 3, md: 5 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92))',
          backdropFilter: 'blur(2px)',
        }}
      >
        {children}
      </Paper>
    </Container>
  );

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Fixed, full-bleed background */}
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.6)), url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Welcome */}
      {currentStep === 0 && (
        <ContentSheet>
          <Stack spacing={3} alignItems="center">
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              Welcome to LEP!
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.125rem',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              Welcome to the Leadership Evolution Project (LEP)! This journey
              fosters your growth as a leader through self-reflection and
              insight. Continuous improvement requires transparency and honesty,
              and the best leaders meet their team&apos;s needs by forging their
              own path. Your commitment will unlock your{' '}
              <Typography component="span" fontWeight="bold">
                potential
              </Typography>
              .
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.125rem',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              By proceeding, you agree to engage in this process with{' '}
              <Typography
                component="span"
                sx={{ textDecoration: 'underline' }}
              >
                honesty
              </Typography>{' '}
              and openness, providing authentic responses to support your
              development.
            </Typography>

            <Divider sx={{ width: '100%', my: 1 }} />

            <MemoizedButton
              variant="contained"
              color="primary"
              onClick={handleNext}
              sx={{
                mt: 1,
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.1rem',
                px: 4,
                py: 1.25,
              }}
            >
              I&apos;M READY TO GROW
            </MemoizedButton>
          </Stack>
        </ContentSheet>
      )}

      {/* Part 1 */}
      {currentStep === 1 && (
        <ContentSheet>
          <Stack spacing={3}>
            {initialQuestionsPart1.map((q) => (
              <Box key={q.id}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '1.1rem',
                    mb: 1,
                  }}
                >
                  {q.prompt}
                </Typography>
                <MemoizedTextField
                  value={formData[q.id] || ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                />
              </Box>
            ))}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <MemoizedButton
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={
                  !formData.name ||
                  !formData.industry ||
                  !formData.role ||
                  !formData.responsibilities
                }
              >
                Next
              </MemoizedButton>
            </Stack>
          </Stack>
        </ContentSheet>
      )}

      {/* Part 2 */}
      {currentStep === 2 && (
        <ContentSheet>
          <Stack spacing={3}>
            {initialQuestionsPart2.map((q) => (
              <Box key={q.id}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '1.1rem',
                    mb: 1,
                  }}
                >
                  {q.prompt}
                </Typography>
                <MemoizedSlider
                  value={formData[q.id] ?? q.min}
                  onChange={(_, value) => handleChange(q.id, value)}
                  min={q.min}
                  max={q.max}
                  sx={{ color: 'secondary.main' }}
                />
                <Typography
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    mt: 1,
                  }}
                >
                  {q.id === 'teamSize'
                    ? formData[q.id] === q.max
                      ? '10+'
                      : formData[q.id] || 1
                    : q.id === 'leadershipExperience'
                    ? formData[q.id] === q.max
                      ? '10+'
                      : formData[q.id] ?? '<1'
                    : formData[q.id] === q.max
                    ? '20+'
                    : formData[q.id] ?? '<1'}
                </Typography>
              </Box>
            ))}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <MemoizedButton
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={
                  !formData.teamSize ||
                  !formData.leadershipExperience ||
                  !formData.careerExperience
                }
              >
                Next
              </MemoizedButton>
            </Stack>
          </Stack>
        </ContentSheet>
      )}

      {/* Main Questions (one at a time) */}
      {currentStep > 2 && currentStep <= 2 + mainQuestions.length && (
        <ContentSheet>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.4rem',
              fontWeight: 'bold',
              mb: 1,
              textAlign: 'center',
            }}
          >
            {mainQuestions[currentStep - 3].theme}
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.15rem',
              mb: 3,
              textAlign: 'center',
            }}
          >
            {mainQuestions[currentStep - 3].prompt}
          </Typography>

          {/* multi-select */}
          {mainQuestions[currentStep - 3].type === 'multi-select' && (
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <ToggleButtonGroup
                value={formData[mainQuestions[currentStep - 3].id] || []}
                onChange={(_, newValue) =>
                  handleChange(mainQuestions[currentStep - 3].id, newValue)
                }
                sx={{ flexWrap: 'wrap', gap: 1.5 }}
              >
                {mainQuestions[currentStep - 3].options.map((option) => (
                  <MemoizedToggleButton
                    key={option}
                    value={option}
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      textTransform: 'none',
                      width: '100%',
                      py: 1.25,
                      bgcolor: 'transparent',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    disabled={
                      (formData[mainQuestions[currentStep - 3].id]?.length ||
                        0) >= mainQuestions[currentStep - 3].limit &&
                      !formData[mainQuestions[currentStep - 3].id]?.includes(
                        option
                      )
                    }
                  >
                    {option}
                  </MemoizedToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          )}

          {/* text */}
          {mainQuestions[currentStep - 3].type === 'text' && (
            <MemoizedTextField
              value={formData[mainQuestions[currentStep - 3].id] || ''}
              onChange={(e) =>
                handleChange(mainQuestions[currentStep - 3].id, e.target.value)
              }
              fullWidth
              required
              variant="outlined"
              sx={{ mb: 3 }}
            />
          )}

          {/* ranking */}
          {mainQuestions[currentStep - 3].type === 'ranking' && (
            <DragDropContext
              onDragEnd={(result) =>
                handleDragEnd(
                  result,
                  mainQuestions[currentStep - 3].id,
                  mainQuestions[currentStep - 3].options
                )
              }
            >
              <Droppable droppableId="ranking">
                {(provided) => (
                  <Stack
                    spacing={1.25}
                    sx={{ mb: 3 }}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.95rem',
                        textAlign: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      Most {mainQuestions[currentStep - 3].scale?.top || 'Like Me'}
                    </Typography>
                    {(
                      formData[mainQuestions[currentStep - 3].id] ||
                      mainQuestions[currentStep - 3].options
                    ).map((option, index) => (
                      <Draggable key={option} draggableId={option} index={index}>
                        {(provided) => (
                          <MemoizedBox
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              p: 1.5,
                              bgcolor: 'grey.100',
                              borderRadius: 1,
                              textAlign: 'center',
                            }}
                          >
                            {option}
                          </MemoizedBox>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <Typography
                      sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.95rem',
                        textAlign: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      Least {mainQuestions[currentStep - 3].scale?.bottom || 'Like Me'}
                    </Typography>
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* radio */}
          {mainQuestions[currentStep - 3].type === 'radio' && (
            <ToggleButtonGroup
              exclusive
              value={formData[mainQuestions[currentStep - 3].id] || ''}
              onChange={(_, newValue) =>
                handleSingleSelect(mainQuestions[currentStep - 3].id, newValue)
              }
              sx={{ flexWrap: 'wrap', gap: 1.5, mb: 3 }}
            >
              {mainQuestions[currentStep - 3].options.map((option) => (
                <MemoizedToggleButton
                  key={option}
                  value={option}
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    textTransform: 'none',
                    width: '100%',
                    py: 1.25,
                    bgcolor: 'transparent',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  {option}
                </MemoizedToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            <MemoizedButton
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={
                (mainQuestions[currentStep - 3].type === 'text' &&
                  !formData[mainQuestions[currentStep - 3].id]) ||
                (mainQuestions[currentStep - 3].type === 'multi-select' &&
                  (!formData[mainQuestions[currentStep - 3].id] ||
                    formData[mainQuestions[currentStep - 3].id].length === 0)) ||
                (mainQuestions[currentStep - 3].type === 'ranking' &&
                  (!formData[mainQuestions[currentStep - 3].id] ||
                    formData[mainQuestions[currentStep - 3].id].length !==
                      mainQuestions[currentStep - 3].options.length)) ||
                (mainQuestions[currentStep - 3].type === 'radio' &&
                  !formData[mainQuestions[currentStep - 3].id])
              }
            >
              Next
            </MemoizedButton>
          </Stack>
        </ContentSheet>
      )}

      {/* Agent selection */}
      {currentStep > 2 + mainQuestions.length &&
        currentStep <= 2 + mainQuestions.length + agentSelect.length && (
          <ContentSheet max="lg">
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.4rem',
                mb: 2,
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              Select Your AI Agent
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.1rem',
                mb: 3,
                textAlign: 'center',
              }}
            >
              An AI agent will provide you with honest feedback regardless, but
              you can choose the agent that suits your preferences.
            </Typography>

            <Grid container spacing={3} justifyContent="center">
              {agentSelect[0].options.map((agent) => (
                <Grid item key={agent.id} xs={12} sm={6} md={4}>
                  <MemoizedCard
                    sx={{
                      border:
                        formData.selectedAgent === agent.id
                          ? '2px solid'
                          : '1px solid',
                      borderColor:
                        formData.selectedAgent === agent.id
                          ? 'primary.main'
                          : 'grey.200',
                      maxWidth: '350px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'Poppins, sans-serif',
                          textAlign: 'center',
                          mb: 1,
                        }}
                      >
                        {agent.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Poppins, sans-serif',
                          textAlign: 'center',
                          lineHeight: 1.5,
                        }}
                      >
                        {agent.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      <MemoizedButton
                        variant={
                          formData.selectedAgent === agent.id
                            ? 'contained'
                            : 'outlined'
                        }
                        color="primary"
                        onClick={() => handleChange('selectedAgent', agent.id)}
                        sx={{ px: 4 }}
                      >
                        Choose
                      </MemoizedButton>
                    </CardActions>
                  </MemoizedCard>
                </Grid>
              ))}
            </Grid>

            <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}>
                Back
              </Button>
              <MemoizedButton
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={isSubmitting || !formData.selectedAgent}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </MemoizedButton>
            </Stack>
          </ContentSheet>
        )}
    </Box>
  );
}

export default IntakeForm;
