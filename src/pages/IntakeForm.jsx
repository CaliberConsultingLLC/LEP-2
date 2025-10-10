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
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageJustValidated, setPageJustValidated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const navigate = useNavigate();

  // fixed, immersive bg setup
  useEffect(() => {
    // nothing to do here now
  }, []);

  // Reset dialog for message pages
  useEffect(() => {
    const messagePages = [1, 3, 6]; // Profile Msg, Behaviors Msg, Mindset Msg
    setDialogOpen(messagePages.includes(currentPage));
  }, [currentPage]);

  // Generate reflection on entering Reflection Moment page
  useEffect(() => {
    if (currentPage === 5) { // reflectionPage
      setReflectionText('');
      setIsLoadingReflection(true);
      const timer = setTimeout(() => {
        // Simulate AI reflection based on formData
        const behaviorIds = questionBank.behaviors.map(q => q.id);
        const sampleResponse = behaviorIds.map(id => formData[id] || 'not answered').join(', ');
        setReflectionText(`Based on your behaviors (e.g., responses like "${sampleResponse.substring(0, 50)}..."), reflect on how these patterns influence your team. Pause and consider adjustments.`);
        setIsLoadingReflection(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPage, formData]);

  // ---------- derived values ----------
  const pageVars = useMemo(() => {
    const introPage = 0;
    const profileMsgPage = 1;
    const profilePage = 2;
    const behaviorsMsgPage = 3;
    const behaviorsPage = 4;
    const reflectionPage = 5;
    const mindsetMsgPage = 6;
    const mindsetPage = 7;
    const agentPage = 8;
    const totalPages = 9;
    return {
      introPage, profileMsgPage, profilePage, behaviorsMsgPage, behaviorsPage,
      reflectionPage, mindsetMsgPage, mindsetPage, agentPage, totalPages
    };
  }, []);

  const {
    introPage, profileMsgPage, profilePage, behaviorsMsgPage, behaviorsPage,
    reflectionPage, mindsetMsgPage, mindsetPage, agentPage, totalPages
  } = pageVars;

  const headerLabel = useMemo(() => {
    if (currentPage === introPage) return 'Welcome';
    if (currentPage === profileMsgPage || currentPage === profilePage) return 'Profile';
    if (currentPage === behaviorsMsgPage || currentPage === behaviorsPage) return 'Behaviors';
    if (currentPage === reflectionPage) return 'Reflection Moment';
    if (currentPage === mindsetMsgPage || currentPage === mindsetPage) return 'Mindset';
    if (currentPage === agentPage) return 'Choose Your Agent';
    return 'LEP';
  }, [currentPage, introPage, profileMsgPage, profilePage, behaviorsMsgPage, behaviorsPage, reflectionPage, mindsetMsgPage, mindsetPage, agentPage]);

  // ---------- state helpers ----------
  const handleChange = (id, value) => setFormData(prev => ({ ...prev, [id]: value }));

  const setMindsetValue = (index, value) => {
    const next = [...formData.mindsetResponses || Array(questionBank.mindset.length).fill(null)];
    next[index] = value;
    handleChange('mindsetResponses', next);
  };

  const nextPulse = () => {
    setPageJustValidated(true);
    setTimeout(() => setPageJustValidated(false), 420);
  };

  const handleNext = async () => {
    const isMessagePage = [profileMsgPage, behaviorsMsgPage, mindsetMsgPage].includes(currentPage);
    if (isMessagePage) {
      setDialogOpen(false);
      setCurrentPage(s => s + 1);
      return;
    }

    if (currentPage < totalPages - 1) {
      // Profile validation
      if (currentPage === profilePage) {
        if (
          !formData.name ||
          !formData.industry ||
          !formData.role ||
          !formData.responsibilities ||
          formData.teamSize === undefined ||
          formData.leadershipExperience === undefined ||
          formData.careerExperience === undefined
        ) return;
      // Behaviors validation
      } else if (currentPage === behaviorsPage) {
        const unanswered = questionBank.behaviors.some(q => {
          const v = formData[q.id];
          if (q.type === 'text') return !v;
          if (q.type === 'multi-select') return !v || v.length === 0;
          if (q.type === 'ranking') return !v || v.length !== q.options.length;
          if (q.type === 'radio') return !v;
          return false;
        });
        if (unanswered) return;
      // Reflection page - no validation
      } else if (currentPage === reflectionPage) {
        return; // Buttons handle progression
      // Mindset validation
      } else if (currentPage === mindsetPage) {
        if (!formData.mindsetResponses || formData.mindsetResponses.some(r => r === null)) return;
      // Agent page
      } else if (currentPage === agentPage) {
        if (!formData.selectedAgent) return;
        setIsSubmitting(true);
        await handleSubmit();
        return;
      }

      nextPulse();
      setCurrentPage(s => s + 1);
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
    setCurrentPage(0);
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
      <HeaderBar step={Math.min(currentPage + 1, totalPages)} total={totalPages} sectionLabel={headerLabel} />

      {/* Message Pop-ups */}
      {(currentPage === profileMsgPage || currentPage === behaviorsMsgPage || currentPage === mindsetMsgPage) && (
        <MessageDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          title={
            currentPage === profileMsgPage ? 'Why Profile Matters' :
            currentPage === behaviorsMsgPage ? 'Why Behaviors Matter' : 'Mindset & Norms'
          }
          content={
            currentPage === profileMsgPage ? 'Understanding your background helps tailor insights to your unique context.' :
            currentPage === behaviorsMsgPage ? "Behaviors reveal how you show up daily—let's uncover patterns." :
            'Mindset shapes decisions; societal norms often influence them unconsciously.'
          }
        />
      )}

      <PageContainer>
        {/* Intro */}
        {currentPage === introPage && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Welcome to LEP</Typography>
              <Typography sx={{ width: '100%', lineHeight: 1.7 }}>
                This journey is reflective and practical. Move one page at a time, answer honestly, and we'll turn it into a focused leadership summary and growth plan.
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

        {/* Profile Page */}
        {currentPage === profilePage && (
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
                <MemoButton variant="outlined" onClick={() => setCurrentPage(profileMsgPage)}>Back</MemoButton>
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
                    ...(pageJustValidated && { animation: 'pulse 420ms ease' }),
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

        {/* Behaviors Page */}
        {currentPage === behaviorsPage && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Your Behaviors</Typography>
              {questionBank.behaviors.map((q, index) => (
                <MemoBox key={q.id} sx={{ width: '100%' }}>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.8, textAlign: 'center' }}>
                    {q.theme.toUpperCase()}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.25, lineHeight: 1.35, textAlign: 'center' }}>
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
                </MemoBox>
              ))}
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <MemoButton variant="outlined" onClick={() => setCurrentPage(behaviorsMsgPage)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={questionBank.behaviors.some(q => {
                    const v = formData[q.id];
                    if (q.type === 'text') return !v;
                    if (q.type === 'multi-select') return !v || v.length === 0;
                    if (q.type === 'ranking') return !v || v.length !== q.options.length;
                    if (q.type === 'radio') return !v;
                    return false;
                  })}
                  sx={{
                    ...(pageJustValidated && { animation: 'pulse 420ms ease' }),
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.04)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                  Reflection Moment
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Reflection Moment */}
        {currentPage === reflectionPage && (
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
                  onClick={() => setCurrentPage(mindsetMsgPage)}
                >
                  Proceed to Mindset
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Mindset Page */}
        {currentPage === mindsetPage && (
          <SectionCard narrow={false}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Mindset Check</Typography>
              <Typography sx={{ mb: 3, opacity: 0.85, maxWidth: 600 }}>
                Rate how often each statement reflects your typical leadership behavior. Use the slider: 1 = Never, 10 = Always.
              </Typography>
              <Stack spacing={2} sx={{ width: '100%' }}>
                {questionBank.mindset.map((q, index) => (
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
                      value={formData.mindsetResponses?.[index] ?? 5}
                      onChange={(_, v) => setMindsetValue(index, v)}
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
                ))}
              </Stack>
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <MemoButton variant="outlined" onClick={() => setCurrentPage(mindsetMsgPage)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={formData.mindsetResponses?.some(r => r === null)}
                  sx={{
                    ...(pageJustValidated && { animation: 'pulse 420ms ease' }),
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.04)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                  Choose my AI Agent
                </MemoButton>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        {/* Agent Select */}
        {currentPage === agentPage && (
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