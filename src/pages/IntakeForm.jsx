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
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 26, height: 26 }}>
              <img
                src="/lep-logo.svg"
                alt="The Compass"
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
                The Compass
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepJustValidated, setStepJustValidated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const navigate = useNavigate();

  // Reset dialog for message steps
  useEffect(() => {
    const messageSteps = [1, 3, 16]; // Profile Msg, Behaviors Msg, Mindset Msg
    setDialogOpen(messageSteps.includes(currentStep));
  }, [currentStep]);

  // Generate reflection on entering Reflection Moment step
  useEffect(() => {
    if (currentStep === 15) { // reflectionStep
      setReflectionText('');
      setIsLoadingReflection(true);
      const timer = setTimeout(() => {
        const behaviorIds = questionBank.behaviors.map(q => q.id);
        const sampleResponse = behaviorIds.map(id => formData[id] || 'not answered').join(', ');
        setReflectionText(`Based on your behaviors (e.g., responses like "${sampleResponse.substring(0, 50)}..."), reflect on how these patterns influence your team. Pause and consider adjustments.`);
        setIsLoadingReflection(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, formData]);

  // ---------- derived values ----------
  const MINDSET_GROUP_SIZE = 5;
  const mindsetGroups = useMemo(() => {
    const groups = [];
    for (let i = 0; i < questionBank.mindset.length; i += MINDSET_GROUP_SIZE) {
      groups.push(questionBank.mindset.slice(i, i + MINDSET_GROUP_SIZE));
    }
    return groups; // 7 groups (6x5 + 1x2)
  }, []);

  const stepVars = useMemo(() => {
    const introStep = 0;
    const profileMsgStep = 1;
    const profileStep = 2;
    const behaviorsMsgStep = 3;
    const behaviorsStart = 4;
    const behaviorsEnd = behaviorsStart + questionBank.behaviors.length - 1; // 4..15 (12 questions)
    const reflectionStep = behaviorsEnd + 1; // 16
    const mindsetMsgStep = reflectionStep + 1; // 17
    const mindsetStart = mindsetMsgStep + 1; // 18
    const mindsetEnd = mindsetStart + mindsetGroups.length - 1; // 18..24 (7 groups)
    const agentStep = mindsetEnd + 1; // 25
    // Count only main steps: Profile (1), Behaviors (12), Reflection (1), Mindset (7), Agent (1)
    const totalSteps = 1 + questionBank.behaviors.length + 1 + mindsetGroups.length + 1; // 22
    return {
      introStep, profileMsgStep, profileStep, behaviorsMsgStep, behaviorsStart, behaviorsEnd,
      reflectionStep, mindsetMsgStep, mindsetStart, mindsetEnd, agentStep, totalSteps
    };
  }, [mindsetGroups.length]);

  const {
    introStep, profileMsgStep, profileStep, behaviorsMsgStep, behaviorsStart, behaviorsEnd,
    reflectionStep, mindsetMsgStep, mindsetStart, mindsetEnd, agentStep, totalSteps
  } = stepVars;

  const headerLabel = useMemo(() => {
    if (currentStep === introStep) return 'Welcome';
    if (currentStep === profileMsgStep || currentStep === profileStep) return 'Profile';
    if (currentStep === behaviorsMsgStep || (currentStep >= behaviorsStart && currentStep <= behaviorsEnd)) return 'Behaviors';
    if (currentStep === reflectionStep) return 'Reflection Moment';
    if (currentStep === mindsetMsgStep || (currentStep >= mindsetStart && currentStep <= mindsetEnd)) return 'Mindset';
    if (currentStep === agentStep) return 'Choose Your Agent';
    return 'The Compass';
  }, [currentStep, introStep, profileMsgStep, profileStep, behaviorsMsgStep, behaviorsStart, behaviorsEnd, reflectionStep, mindsetMsgStep, mindsetStart, mindsetEnd, agentStep]);

  // Calculate displayed step number (exclude message steps)
  const displayedStep = useMemo(() => {
    if (currentStep === introStep) return 1;
    if (currentStep === profileMsgStep || currentStep === profileStep) return 1;
    if (currentStep === behaviorsMsgStep || (currentStep >= behaviorsStart && currentStep <= behaviorsEnd)) {
      return 2 + (currentStep >= behaviorsStart ? currentStep - behaviorsStart : 0);
    }
    if (currentStep === reflectionStep) return 14;
    if (currentStep === mindsetMsgStep || (currentStep >= mindsetStart && currentStep <= mindsetEnd)) {
      return 15 + (currentStep >= mindsetStart ? currentStep - mindsetStart : 0);
    }
    if (currentStep === agentStep) return 22;
    return 1;
  }, [currentStep, introStep, profileMsgStep, profileStep, behaviorsMsgStep, behaviorsStart, behaviorsEnd, reflectionStep, mindsetMsgStep, mindsetStart, mindsetEnd, agentStep]);

  // ---------- state helpers ----------
  const handleChange = (id, value) => setFormData(prev => ({ ...prev, [id]: value }));

  const setMindsetValue = (index, value) => {
    const next = [...(formData.mindsetResponses || Array(questionBank.mindset.length).fill(null))];
    next[index] = value;
    handleChange('mindsetResponses', next);
  };

  const nextPulse = () => {
    setStepJustValidated(true);
    setTimeout(() => setStepJustValidated(false), 420);
  };

  const handleNext = async () => {
    const isMessageStep = [profileMsgStep, behaviorsMsgStep, mindsetMsgStep].includes(currentStep);
    if (isMessageStep) {
      setDialogOpen(false);
      setCurrentStep(s => s + 1);
      return;
    }

    if (currentStep < totalSteps - 1) {
      // Profile validation
      if (currentStep === profileStep) {
        if (
          !formData.name ||
          !formData.industry ||
          !formData.role ||
          !formData.responsibilities ||
          formData.teamSize === undefined ||
          formData.leadershipExperience === undefined ||
          formData.careerExperience === undefined
        ) return;
      // Behaviors validation (one question per step)
      } else if (currentStep >= behaviorsStart && currentStep <= behaviorsEnd) {
        const qIndex = currentStep - behaviorsStart;
        const q = questionBank.behaviors[qIndex];
        const v = formData[q.id];
        if (q.type === 'text' && !v) return;
        if (q.type === 'multi-select' && (!v || v.length === 0)) return;
        if (q.type === 'ranking' && (!v || v.length !== q.options.length)) return;
        if (q.type === 'radio' && !v) return;
      // Reflection step - no validation
      } else if (currentStep === reflectionStep) {
        return; // Buttons handle progression
      // Mindset validation (5 questions per page)
      } else if (currentStep >= mindsetStart && currentStep <= mindsetEnd) {
        const groupIdx = currentStep - mindsetStart;
        const start = groupIdx * MINDSET_GROUP_SIZE;
        const end = Math.min(start + MINDSET_GROUP_SIZE, questionBank.mindset.length);
        const groupResponses = (formData.mindsetResponses || []).slice(start, end);
        if (groupResponses.some(r => r === null)) return;
      // Agent step
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
    setFormData({});
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    try {
      const selectedAgentId = formData.selectedAgent || 'balancedMentor';
      const updated = { ...formData, selectedAgent: selectedAgentId };
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
      <HeaderBar step={displayedStep} total={22} sectionLabel={headerLabel} />

      {/* Message Pop-ups */}
      {(currentStep === profileMsgStep || currentStep === behaviorsMsgStep || currentStep === mindsetMsgStep) && (
        <MessageDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          title={
            currentStep === profileMsgStep ? 'Why Profile Matters' :
            currentStep === behaviorsMsgStep ? 'Why Behaviors Matter' : 'Mindset & Norms'
          }
          content={
            currentStep === profileMsgStep ? 'Understanding your background helps tailor insights to your unique context.' :
            currentStep === behaviorsMsgStep ? "Behaviors reveal how you show up daily—let's uncover patterns." :
            'Mindset shapes decisions; societal norms often influence them unconsciously.'
          }
        />
      )}

      <PageContainer>
        {/* Intro */}
        {currentStep === introStep && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Welcome to The Compass</Typography>
              <Typography sx={{ width: '100%', lineHeight: 1.7 }}>
                This journey is reflective and practical. Answer honestly, and we'll turn it into a focused leadership summary and growth plan.
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

        {/* Profile Step */}
        {currentStep === profileStep && (
          <SectionCard narrow={true}>
            <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Your Profile</Typography>
              {questionBank.profile.map((q) => (
                <MemoBox key={q.id} sx={{ width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25, lineHeight: 1.35, textAlign: 'center' }}>
                    {q.prompt}
                  </Typography>
                  {q.type === 'text' && (
                    <MemoTextField
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      fullWidth
                      variant="outlined"
                    />
                  )}
                  {q.type === 'slider' && (
                    <>
                      <MemoSlider
                        value={formData[q.id] ?? q.min}
                        onChange={(e, value) => handleChange(q.id, value)}
                        min={q.min}
                        max={q.max}
                        sx={{ width: '100%' }}
                      />
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {formData[q.id] ?? (q.min === 0 ? q.labels[0] : q.labels[q.min])}
                      </Typography>
                    </>
                  )}
                </MemoBox>
              ))}
              <Stack direction="row" spacing={2}>
                <MemoButton variant="outlined" onClick={() => setCurrentStep(profileMsgStep)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    !formData.name ||
                    !formData.industry ||
                    !formData.role ||
                    !formData.responsibilities ||
                    formData.teamSize === undefined ||
                    formData.leadershipExperience === undefined ||
                    formData.careerExperience === undefined
                  }
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

        {/* Behaviors Steps (one question per step) */}
        {currentStep >= behaviorsStart && currentStep <= behaviorsEnd && (
          <SectionCard narrow={false}>
            {(() => {
              const qIndex = currentStep - behaviorsStart;
              const q = questionBank.behaviors[qIndex];

              return (
                <Stack spacing={3} alignItems="stretch" textAlign="left" sx={{ width: '100%' }}>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.8, textAlign: 'center' }}>
                    {q.theme.toUpperCase()}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35, textAlign: 'center' }}>
                    {q.prompt}
                  </Typography>
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
                      <Droppable droppableId={`ranking-${q.id}`}>
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
                      sx={{
                        ...(stepJustValidated && { animation: 'pulse 420ms ease' }),
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.04)' },
                          '100%': { transform: 'scale(1)' },
                        },
                      }}
                    >
                      {currentStep === behaviorsEnd ? 'Reflection Moment' : 'Next'}
                    </MemoButton>
                  </Stack>
                </Stack>
              );
            })()}
          </SectionCard>
        )}

        {/* Reflection Step */}
        {currentStep === reflectionStep && (
          <SectionCard narrow={false}>
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>
                Reflection Moment
              </Typography>
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
                    {isLoadingReflection ? 'Generating reflection...' : (reflectionText || 'No reflection generated.')}
                  </Typography>
                </Stack>
              </Paper>
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
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <MemoButton variant="outlined" onClick={handleStartOver}>Start Over</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={() => setCurrentStep(mindsetMsgStep)}
                >
                  Proceed to Mindset
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Mindset Steps (5 questions per step) */}
        {currentStep >= mindsetStart && currentStep <= mindsetEnd && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Mindset Check</Typography>
              <Typography sx={{ mb: 3, opacity: 0.85, maxWidth: 600 }}>
                Rate how often each statement reflects your typical leadership behavior. Use the slider: 1 = Never, 10 = Always.
              </Typography>
              <Stack spacing={2} sx={{ width: '100%' }}>
                {mindsetGroups[currentStep - mindsetStart].map((q, index) => {
                  const absoluteIndex = (currentStep - mindsetStart) * MINDSET_GROUP_SIZE + index;
                  return (
                    <Paper
                      key={q.id}
                      elevation={4}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        textAlign: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          lineHeight: 1.4,
                          fontSize: '0.95rem',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {q.prompt}
                      </Typography>
                      <MemoSlider
                        value={formData.mindsetResponses?.[absoluteIndex] ?? 5}
                        onChange={(_, v) => setMindsetValue(absoluteIndex, v)}
                        step={1}
                        min={q.min}
                        max={q.max}
                        marks={q.marks}
                        valueLabelDisplay={q.valueLabelDisplay}
                        sx={{
                          mx: 1,
                          '& .MuiSlider-root': { height: 4 },
                          '& .MuiSlider-markLabel': {
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            transform: 'translateY(6px)',
                          },
                          '& .MuiSlider-valueLabel': {
                            fontSize: '0.75rem',
                            top: -28,
                          },
                        }}
                      />
                    </Paper>
                  );
                })}
              </Stack>
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <MemoButton
                  variant="outlined"
                  onClick={() => setCurrentStep(s => Math.max(s - 1, mindsetMsgStep))}
                >
                  Back
                </MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={(formData.mindsetResponses || []).slice(
                    (currentStep - mindsetStart) * MINDSET_GROUP_SIZE,
                    Math.min((currentStep - mindsetStart + 1) * MINDSET_GROUP_SIZE, questionBank.mindset.length)
                  ).some(r => r === null)}
                  sx={{
                    ...(stepJustValidated && { animation: 'pulse 420ms ease' }),
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.04)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                  {currentStep === mindsetEnd ? 'Choose my AI Agent' : 'Next'}
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Agent Step */}
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
                {questionBank.agents.map((agent) => (
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