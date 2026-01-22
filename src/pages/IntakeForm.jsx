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

// Warning label icon component - Standardized American road signs
const WarningLabelIcon = ({ type }) => {
  const iconStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const getIcon = () => {
    switch (type) {
      case 'Caution':
        // Standard yellow diamond warning sign with exclamation mark
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="cautionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <polygon
                points="20,6 34,20 20,34 6,20"
                fill="url(#cautionGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <circle
                cx="20"
                cy="20"
                r="6"
                fill="none"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2"
              />
              <path
                d="M 20 14 L 20 20 M 20 22 L 20 24"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Box>
          </Box>
        );
      case 'Warning':
        // Standard yellow triangle warning sign with exclamation mark
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="warningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <polygon
                points="20,5 35,33 5,33"
                fill="url(#warningGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <circle
                cx="20"
                cy="24"
                r="5"
                fill="none"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2"
              />
              <path
                d="M 20 18 L 20 23 M 20 25 L 20 27"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Box>
          </Box>
        );
      case 'Winding Road':
        // Standard yellow diamond with winding road symbol (S-curve)
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="windingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <polygon
                points="20,6 34,20 20,34 6,20"
                fill="url(#windingGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <path
                d="M 10 20 Q 15 12, 20 20 T 30 20"
                fill="none"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 10 24 Q 15 16, 20 24 T 30 24"
                fill="none"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Box>
          </Box>
        );
      case 'Flammable':
        // Standard orange diamond hazmat sign with flame symbol
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="flammableGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <polygon
                points="20,6 34,20 20,34 6,20"
                fill="url(#flammableGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <path
                d="M 20 12 Q 18 14, 18 18 Q 18 20, 20 22 Q 22 20, 22 18 Q 22 16, 20 14 L 20 12 Z"
                fill="rgba(60,60,60,0.9)"
              />
              <path
                d="M 20 18 L 20 26"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 18 20 L 22 20"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </Box>
          </Box>
        );
      case 'Fragile':
        // Standard yellow diamond "Bump" or "Rough Road" sign (closest road sign equivalent)
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="fragileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <polygon
                points="20,6 34,20 20,34 6,20"
                fill="url(#fragileGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <path
                d="M 10 20 Q 15 14, 20 20 T 30 20"
                fill="none"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="15" cy="17" r="1.5" fill="rgba(60,60,60,0.9)" />
              <circle cx="20" cy="16" r="1.5" fill="rgba(60,60,60,0.9)" />
              <circle cx="25" cy="17" r="1.5" fill="rgba(60,60,60,0.9)" />
            </Box>
          </Box>
        );
      case 'Falling Rocks':
        // Standard yellow diamond with falling rocks symbol
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="rocksGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <polygon
                points="20,6 34,20 20,34 6,20"
                fill="url(#rocksGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <path
                d="M 8 28 L 12 20 L 16 24 L 20 16 L 24 20 L 28 18 L 32 24 L 32 28 Z"
                fill="rgba(80,80,80,0.5)"
                stroke="rgba(60,60,60,0.8)"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="22" r="2" fill="rgba(60,60,60,0.9)" />
              <circle cx="20" cy="18" r="2" fill="rgba(60,60,60,0.9)" />
              <circle cx="28" cy="20" r="2" fill="rgba(60,60,60,0.9)" />
              <path
                d="M 12 20 L 10 14 M 20 16 L 18 10 M 28 18 L 26 12"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Box>
          </Box>
        );
      case 'Deer Crossing':
        // Standard yellow diamond with deer silhouette
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="deerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <polygon
                points="20,6 34,20 20,34 6,20"
                fill="url(#deerGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <ellipse
                cx="20"
                cy="18"
                rx="8"
                ry="5"
                fill="rgba(60,60,60,0.9)"
              />
              <ellipse
                cx="20"
                cy="24"
                rx="6"
                ry="4"
                fill="rgba(60,60,60,0.9)"
              />
              <path
                d="M 16 14 L 14 10 M 24 14 L 26 10"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 16 26 L 14 30 M 24 26 L 26 30"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Box>
          </Box>
        );
      case 'Wrong Way':
        // Standard red square "WRONG WAY" sign
        return (
          <Box sx={iconStyle}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              sx={{ width: 40, height: 40, filter: 'grayscale(100%)' }}
            >
              <defs>
                <linearGradient id="wrongGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(220,220,220,0.4)" />
                  <stop offset="100%" stopColor="rgba(140,140,140,0.25)" />
                </linearGradient>
              </defs>
              <rect
                x="6"
                y="6"
                width="28"
                height="28"
                rx="2"
                fill="url(#wrongGrad)"
                stroke="rgba(100,100,100,0.7)"
                strokeWidth="2.5"
              />
              <path
                d="M 10 20 L 30 20 M 20 10 L 20 30"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle
                cx="20"
                cy="20"
                r="8"
                fill="none"
                stroke="rgba(60,60,60,0.9)"
                strokeWidth="2"
              />
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getIcon()}</Box>;
};

// "Card button" for radio / multi-select
const OptionCard = ({ selected, children, onClick, disabled, compact, showWarningIcon, warningType, onMouseEnter, onMouseLeave }) => (
  <Box
    onClick={disabled ? undefined : onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === 'Enter' ? onClick?.() : null)}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: showWarningIcon ? 'flex-start' : 'center',
      width: '100%',
      minHeight: compact ? 48 : 68,
      userSelect: 'none',
      p: compact ? 1 : 1.6,
      borderRadius: 2,
      border: selected ? '2px solid #E07A3F' : '1px solid rgba(0,0,0,0.12)',
      bgcolor: selected ? 'rgba(224, 122, 63, 0.09)' : 'background.paper',
      boxShadow: selected ? '0 6px 22px rgba(224,122,63,0.28)' : '0 2px 10px rgba(0,0,0,0.06)',
      transform: 'perspective(600px) rotateY(0deg)',
      transition: 'box-shadow .25s ease, transform .25s ease, border-color .2s ease, background-color .2s ease',
      cursor: disabled ? 'default' : 'pointer',
      textAlign: showWarningIcon ? 'left' : 'center',
      '&:hover': {
        boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    {showWarningIcon && (
      <Box sx={{ width: '33%', display: 'flex', alignItems: 'center', justifyContent: 'center', pr: 1.5 }}>
        <WarningLabelIcon type={warningType} />
      </Box>
    )}
    <Box sx={{ flex: showWarningIcon ? 2 : 1, display: 'flex', alignItems: 'center', justifyContent: showWarningIcon ? 'flex-start' : 'center' }}>
      <Typography sx={{ fontSize: compact ? '0.9rem' : '1.05rem', fontWeight: 500 }}>{children}</Typography>
    </Box>
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
  const [reflectionNumber, setReflectionNumber] = useState(1); // Track which reflection (1 or 2)
  const reflectionGeneratedRef = useRef(false); // Track if first reflection has been generated
  const secondReflectionGeneratedRef = useRef(false); // Track if second reflection has been generated
  const [customAnswerDialogOpen, setCustomAnswerDialogOpen] = useState(false);
  const [customAnswerText, setCustomAnswerText] = useState('');
  const [roleModelElaborationDialogOpen, setRoleModelElaborationDialogOpen] = useState(false);
  const [selectedRoleModelTrait, setSelectedRoleModelTrait] = useState(null);
  const [roleModelElaborationText, setRoleModelElaborationText] = useState('');
  const [roleModelCustomAnswerDialogOpen, setRoleModelCustomAnswerDialogOpen] = useState(false);
  const [roleModelCustomAnswerText, setRoleModelCustomAnswerText] = useState('');
  const [hoveredRoleModelOption, setHoveredRoleModelOption] = useState(null);
  const navigate = useNavigate();

  const handleCustomAnswerSubmit = () => {
    if (customAnswerText.trim()) {
      handleChange('projectApproach', customAnswerText.trim());
      setCustomAnswerDialogOpen(false);
      setCustomAnswerText('');
    }
  };

  const handleRoleModelCustomAnswerSubmit = () => {
    if (roleModelCustomAnswerText.trim()) {
      handleChange('roleModelTrait', roleModelCustomAnswerText.trim());
      setRoleModelCustomAnswerDialogOpen(false);
      setRoleModelCustomAnswerText('');
    }
  };

  const handleRoleModelTraitSelect = (traitOption) => {
    setSelectedRoleModelTrait(traitOption);
    setRoleModelElaborationText('');
    setRoleModelElaborationDialogOpen(true);
  };

  const handleRoleModelElaborationSubmit = () => {
    if (selectedRoleModelTrait && roleModelElaborationText.trim()) {
      // Store both the selected trait and the elaboration
      handleChange('roleModelTrait', selectedRoleModelTrait);
      handleChange('roleModelTraitElaboration', roleModelElaborationText.trim());
      setRoleModelElaborationDialogOpen(false);
      setSelectedRoleModelTrait(null);
      setRoleModelElaborationText('');
    }
  };

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
  const initialQuestions = [
    { id: 'industry', prompt: 'What industry do you work in?', type: 'text' },
    { id: 'role', prompt: 'What is your current job title?', type: 'text' },
    { id: 'responsibilities', prompt: 'Briefly describe what your team is responsible for within the organization.', type: 'text' },
    { id: 'birthYear', prompt: 'What year were you born?', type: 'text' },
    { id: 'teamSize', prompt: 'How many people do you directly manage?', type: 'slider', min: 1, max: 10, labels: { 1: '1', 10: '10+' } },
    { id: 'leadershipExperience', prompt: 'How many years have you been in your current role?', type: 'slider', min: 1, max: 20, labels: { 1: '1', 20: '20+' } },
    { id: 'careerExperience', prompt: 'How many years have you been in a leadership role?', type: 'slider', min: 1, max: 20, labels: { 1: '1', 20: '20+' } },
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
        'Ask clarifying questions before diving in.',
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
        'Balancing differing expectations from stakeholders',
      ],
      limit: 3,
    },
    {
      id: 'crisisResponse',
      theme: 'The Fire Drill',
      prompt: 'A crisis hits your team unexpectedly. Rank the following responses:',
      type: 'ranking',
      options: [
        'Maintain composure and provide clear, decisive direction to the team.',
        'Immediately gather the team to collaborate on potential solutions.',
        'First verify all facts and details before taking any action.',
        'Delegate ownership to team members while providing support from the sidelines.',
        'Jump in directly to handle the most critical aspects myself.',
      ],
      scale: { top: 'like me', bottom: 'like me' },
    },
    {
      id: 'pushbackFeeling',
      theme: 'The Pushback Moment',
      prompt:
        'When someone challenges your authority, questions your judgment, or pushes back on your plan — what emotions do you feel in the moment? (Select all that apply.)',
      type: 'multi-select',
      options: [
        'Defensive', 'Frustrated', 'Curious', 'Dismissive', 'Apprehensive',
        'Motivated', 'Insecure', 'Irritated', 'Open', 'Doubtful',
        'Calm', 'Competitive', 'Humbled', 'Surprised', 'Relieved',
        'Proud', 'Confused', 'Nothing'
      ],
    },
    {
      id: 'roleModelTrait',
      theme: 'The Role Model',
      prompt:
        'Think of a leader you admire (real or fictional) and complete this sentence:',
      type: 'radio',
      options: [
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
      ],
    },
    {
      id: 'warningLabel',
      theme: 'The Warning Label',
      prompt: 'If your leadership style had a "warning label," what would it be?',
      type: 'radio',
      options: [
        'Caution: May overthink the details',
        'Warning: Moves fast—keep up!',
        'Winding Road: we change directions quickly',
        'Flammable: Sparks fly under pressure',
        'Fragile: Avoid too much pushback',
        'Falling Rocks: Tendency to over-delegate',
        'Deer Crossing: May jump into your lane',
        'Wrong Way: My way or the highway',
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
      scale: { top: 'Energize Me Most', bottom: 'Energize Me Least' },
    },
    {
      id: 'proudMoment',
      theme: 'The Highlight Reel',
      prompt: 'Consider a significant team accomplishment and describe how your contribution made it possible.',
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
        { left: 'Critical', right: 'Encouraging', min: 1, max: 10, step: 1 },
        { left: 'Detail-Oriented', right: 'Big-picture-oriented', min: 1, max: 10, step: 1 },
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
        'I thrive in the spotlight.',
        'I can handle it but prefer smaller settings.',
          "I don't think much about it either way.",
        'I prefer to lead behind the scenes.',
      ],
    },
    {
      id: 'decisionPace',
      theme: 'The Lesson Loop',
      prompt: 'When something goes wrong, what do you prioritize?',
      type: 'radio',
      options: [
        { primary: 'The Fix', secondary: 'Get things back on track' },
        { primary: 'The Feedback', secondary: 'Learn where things went wrong' },
      ],
    },
    {
      id: 'teamPerception',
      theme: 'The Performance Check',
      prompt: 'How do you handle a team member that is underperforming?',
      type: 'radio',
      options: [
        'Address it directly and immediately in a private conversation.',
        'Observe for patterns and gather context before taking action.',
        'Provide additional support and resources to help them improve.',
        'Reassign tasks or adjust their responsibilities to better fit their strengths.',
        'Set clear expectations and create a performance improvement plan.',
        'Involve HR or escalate to higher management for guidance.',
      ],
    },
  ];

  const behaviorClusters = {
    emotional_regulation: ['pushbackFeeling', 'energyDrains'],
    decision_cadence: ['decisionPace', 'crisisResponse', 'projectApproach'],
    team_awareness: ['teamPerception', 'visibilityComfort', 'roleModelTrait'],
    motivational_drive: ['leaderFuel', 'resourcePick'],
    self_reflection: ['warningLabel', 'proudMoment', 'behaviorDichotomies'],
  };

  // 10 societal norms (now the "Insights" section, 5 per page)
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
    "When I am struggling professionally, I openly share that information with my team."
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
    const behaviorStart = 3; // after profile (step 1) and behaviors intro popup (step 2)
    const behaviorEnd = behaviorStart + behaviorSet.length - 1; // 3..14 (12 qs)
    const reflectionStep = behaviorEnd + 1; // 15
    const mindsetIntroStep = reflectionStep + 1; // 16 (popup)
    const societalStart = mindsetIntroStep + 1; // 17
    const societalEnd = societalStart + societalGroups.length - 1; // 17..18 (2 pages)
    const agentStep = societalEnd + 1; // 24
    const totalSteps = agentStep + 1; // 25 total steps (0..24 displayed as 1..25)
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
    if (currentStep === 0 || currentStep === 1) return 'Profile';
    if (currentStep === 2 || (currentStep >= behaviorStart && currentStep <= behaviorEnd)) return 'Behaviors';
    if (currentStep === reflectionStep) return 'Reflection Moment';
    if (currentStep === mindsetIntroStep || (currentStep >= societalStart && currentStep <= societalEnd)) return 'Insights';
    if (currentStep === agentStep) return 'Choose Your Agent';
    return 'LEP';
  }, [currentStep, behaviorStart, behaviorEnd, reflectionStep, mindsetIntroStep, societalStart, societalEnd, agentStep]);

  // ---- dialogs and reflection text ----
  useEffect(() => {
    const messageSteps = [0, 2, mindsetIntroStep]; // Profile intro, Behaviors intro, Insights intro
    const reflectionIntro = currentStep === reflectionStep && reflectionNumber === 1 && !reflectionGeneratedRef.current;
    setDialogOpen(messageSteps.includes(currentStep) || reflectionIntro);
  }, [currentStep, mindsetIntroStep]);

  // Generate reflection only once when reaching the step, not when formData changes
  useEffect(() => {
    if (currentStep === reflectionStep && !reflectionGeneratedRef.current) {
      reflectionGeneratedRef.current = true; // Mark as generated
      setIsLoadingReflection(true);

      const timer = setTimeout(() => {
        // Only include energyDrains and leaderFuel for reflection generation
        const reflectionData = {
          energyDrains: formData.energyDrains,
          leaderFuel: formData.leaderFuel,
          selectedAgent: 'bluntPracticalFriend',
        };
        fetch('/api/get-ai-reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reflectionData),
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
    const isMessageStep = [0, 3, mindsetIntroStep].includes(currentStep) || (currentStep === reflectionStep && reflectionNumber === 1 && !reflectionGeneratedRef.current); // auto-advance popups

    if (isMessageStep) {
      setDialogOpen(false);
      setCurrentStep(s => s + 1);
      return;
    }

    if (currentStep < totalSteps - 1) {
      // Profile validation (step 1)
      if (currentStep === 1) {
        if (!formData.industry || !formData.role || !formData.responsibilities || 
            formData.teamSize === undefined || 
            formData.leadershipExperience === undefined || formData.careerExperience === undefined) return;

      // Behaviors validation (steps 5..16)
      } else if (currentStep >= behaviorStart && currentStep <= behaviorEnd) {
        const qIndex = currentStep - behaviorStart;
        const q = behaviorSet[qIndex];
        const v = formData[q.id];
        if (q.type === 'text' && !v) return;
        if (q.type === 'multi-select' && (!v || v.length === 0)) return;
        if (q.type === 'ranking' && (!v || v.length !== q.options.length)) return;
        if (q.type === 'radio' && !v) return;
        // For Role Model question, also require elaboration (unless custom answer was used)
        if (q.id === 'roleModelTrait' && !formData.roleModelTraitElaboration && q.options.includes(v)) return;

      // Reflection step - no validation; buttons control navigation
      } else if (currentStep === reflectionStep) {
        return;

      // Societal (Insights) validation: only current 5 in the shown group must be answered
      // Societal (Insights): no validation required
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
      {(currentStep === 0 || currentStep === 2 || currentStep === mindsetIntroStep || (currentStep === reflectionStep && reflectionNumber === 1 && !reflectionGeneratedRef.current)) && (
        <MessageDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          title={
            currentStep === 0
              ? 'Leader Profile'
              : currentStep === 2
              ? 'Leader Behaviors'
              : 'Leader Insights'
          }
          content={
            currentStep === 0
              ? 'The Compass is considerate of your specific leadership environment! Think of the leader profile as context that helps both the insights and growth plan you receive be more pertinent.'
              : currentStep === 2
              ? 'The Compass also takes into account the actions that are most natural to you as a leader, so that your insights and growth plan are considerate of your natural flow state.'
              : 'The Compass is committed to facilitating awareness of a person\'s instincts and insights, which are the most influential and challenging elements to recognize and change.'
          }
        />
      )}

      <PageContainer>
        {/* Profile Page (Step 1) - Combined */}
        {currentStep === 1 && (
          <SectionCard narrow={true}>
            <Stack spacing={4} alignItems="stretch" textAlign="center" sx={{ width: '100%' }}>
              {initialQuestions.map((q) => (
                <MemoBox key={q.id} sx={{ width: '100%' }}>
                  <Typography variant="body1" sx={{ fontWeight: 400, mb: 1.25, lineHeight: 1.5, textAlign: 'center', fontSize: '1.1rem' }}>{q.prompt}</Typography>
                  {q.type === 'text' ? (
                    <MemoTextField
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder={q.id === 'birthYear' ? 'e.g., 1985' : ''}
                    />
                  ) : (
                    <>
                      <MemoSlider
                        value={formData[q.id] ?? q.min}
                        onChange={(e, value) => handleChange(q.id, value)}
                        min={q.min}
                        max={q.max}
                        sx={{ width: '100%' }}
                      />
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {q.id === 'leadershipExperience' || q.id === 'careerExperience'
                          ? (formData[q.id] === 20 ? '20+' : (formData[q.id] ?? q.min))
                          : (formData[q.id] ?? q.min)}
                      </Typography>
                    </>
                  )}
                </MemoBox>
              ))}
              <Stack direction="row" spacing={2}>
                <MemoButton variant="outlined" onClick={() => setCurrentStep(0)}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    !formData.industry || !formData.role || !formData.responsibilities ||
                    formData.teamSize === undefined ||
                    formData.leadershipExperience === undefined || formData.careerExperience === undefined
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


        {/* Behaviors Questions (Steps 5..16) */}
        {currentStep >= behaviorStart && currentStep <= behaviorEnd && (
          <SectionCard narrow={false}>
            {(() => {
              const qIndex = currentStep - behaviorStart;
              const q = behaviorSet[qIndex];

              return (
                <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.8, textAlign: 'center' }}>
                    {q.theme.toUpperCase()}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35, textAlign: 'center' }}>
                    {q.id === 'proudMoment' ? (
                      <>
                        Consider a significant team accomplishment and <u>describe</u> how your contribution made it possible.
                      </>
                    ) : q.id === 'roleModelTrait' ? (
                      <>
                        {q.prompt}
                        <br />
                        <Typography component="span" sx={{ fontWeight: 400, fontSize: '1rem', fontStyle: 'italic', mt: 1, display: 'block', opacity: 0.85 }}>
                          I wish how they <span style={{ textDecoration: 'underline' }}>{hoveredRoleModelOption || '__________'}</span> came more naturally to me.
                        </Typography>
                      </>
                    ) : (
                      q.prompt
                    )}
                  </Typography>

                  {(q.type === 'radio' || q.type === 'multi-select') && (
                    <Grid
                      container
                      spacing={q.id === 'pushbackFeeling' ? 1.5 : 2}
                      alignItems="stretch"
                      justifyContent="center"
                    >
                      {q.options.map((opt) => {
                        const optValue = typeof opt === 'object' && opt.primary ? opt.primary : opt;
                        const optKey = typeof opt === 'object' && opt.primary ? opt.primary : opt;
                        const selected = q.type === 'radio' ? formData[q.id] === optValue : (formData[q.id] || []).includes(optValue);
                        const disabled = q.type === 'multi-select' && q.limit != null && (formData[q.id]?.length >= q.limit) && !selected;
                        return (
                          <Grid
                            item
                            xs={12}
                            sm={q.id === 'pushbackFeeling' ? 4 : 6}
                            md={q.id === 'pushbackFeeling' ? 3 : 6}
                            key={optKey}
                            sx={{ display: 'flex' }}
                          >
                            <OptionCard
                              selected={!!selected}
                              disabled={disabled}
                              compact={q.id === 'pushbackFeeling'}
                              onMouseEnter={q.id === 'roleModelTrait' ? () => setHoveredRoleModelOption(optValue) : undefined}
                              onMouseLeave={q.id === 'roleModelTrait' ? () => setHoveredRoleModelOption(null) : undefined}
                              onClick={() => {
                                if (q.type === 'radio') {
                                  if (q.id === 'roleModelTrait') {
                                    // Open elaboration dialog for Role Model question
                                    handleRoleModelTraitSelect(optValue);
                                  } else {
                                    handleSingleSelect(q.id, optValue);
                                  }
                                } else {
                                  const current = formData[q.id] || [];
                                  if (selected) {
                                    handleChange(q.id, current.filter((v) => v !== optValue));
                                  } else if (current.length < (q.limit ?? Infinity)) {
                                    handleChange(q.id, [...current, optValue]);
                                  }
                                }
                              }}
                            >
                              {q.id === 'roleModelTrait' ? (
                                optValue
                              ) : typeof opt === 'object' && opt.primary ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{opt.primary}</Typography>
                                  <Typography sx={{ fontSize: '0.9rem', opacity: 0.8 }}>{opt.secondary}</Typography>
                                </Box>
                              ) : q.id === 'warningLabel' ? (
                                opt
                              ) : (
                                opt
                              )}
                            </OptionCard>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}

                  {q.type === 'text' && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <MemoTextField
                        value={formData[q.id] || ''}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        sx={{ maxWidth: '100%' }}
                      />
                    </Box>
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
                            <Typography variant="body1" sx={{ opacity: 0.8, textAlign: 'center', fontWeight: 700, fontSize: '1.05rem' }}>
                              {q.scale?.top && (q.scale.top.includes('Most') || q.scale.top.includes('Least')) ? q.scale.top : `Most ${q.scale?.top || 'like me'}`}
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
                                        textAlign: 'center',
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
                                        flexShrink: 0,
                                      }}
                                    >
                                      {index + 1}
                                    </Box>
                                    <Typography sx={{ textAlign: 'center', flex: 1 }}>{opt}</Typography>
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            <Typography variant="body1" sx={{ opacity: 0.8, textAlign: 'center', fontWeight: 700, fontSize: '1.05rem' }}>
                              {q.scale?.bottom && (q.scale.bottom.includes('Most') || q.scale.bottom.includes('Least')) ? q.scale.bottom : `Least ${q.scale?.bottom || 'like me'}`}
                            </Typography>
                          </Stack>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}

                  {q.type === 'sliders' && Array.isArray(q.sliders) && (
                    <Stack spacing={3} sx={{ width: '100%', alignItems: 'center' }}>
                      {q.sliders.map((s, idx) => {
                        const currentValues = Array.isArray(formData[q.id]) ? formData[q.id] : [];
                        // For Balance Line question, start at exact middle (5.5) for visual centering
                        const defaultValue = q.id === 'behaviorDichotomies' 
                          ? ((s.min ?? 1) + (s.max ?? 10)) / 2 
                          : Math.round(((s.min ?? 1) + (s.max ?? 10)) / 2);
                        const currentValue = currentValues[idx] ?? defaultValue;
                        const marks = Array.from({ length: 10 }, (_, i) => ({ value: i + 1 }));
                        return (
                          <Box key={`${q.id}_${idx}`} sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
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
                                  width: '100%',
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
                    {(q.id === 'projectApproach' || q.id === 'roleModelTrait') && (
                      <MemoButton
                        variant="outlined"
                        onClick={() => {
                          if (q.id === 'projectApproach') {
                            setCustomAnswerDialogOpen(true);
                          } else if (q.id === 'roleModelTrait') {
                            setRoleModelCustomAnswerDialogOpen(true);
                          }
                        }}
                        sx={{ borderColor: 'rgba(224,122,63,0.5)', color: '#E07A3F' }}
                      >
                        I don't see my choice above
                      </MemoButton>
                    )}
                    <MemoButton
                      variant="contained"
                      onClick={handleNext}
                      disabled={
                        (q.type === 'text' && !formData[q.id]) ||
                        (q.type === 'multi-select' && (!formData[q.id] || formData[q.id].length === 0)) ||
                        (q.type === 'ranking' && (!formData[q.id] || formData[q.id].length !== q.options.length)) ||
                        (q.type === 'radio' && !formData[q.id]) ||
                        (q.id === 'roleModelTrait' && !formData.roleModelTraitElaboration && q.options.includes(formData[q.id]))
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
        value={formData[reflectionNumber === 1 ? 'userReflection' : 'userReflection2'] || ''}
        onChange={(e) => handleChange(reflectionNumber === 1 ? 'userReflection' : 'userReflection2', e.target.value)}
        fullWidth
        multiline
        minRows={3}
        placeholder={reflectionNumber === 1 ? "How does your energy impact the team?" : "How does this attribute create both risk and advantage?"}
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
          onClick={() => {
            if (reflectionNumber === 1) {
              setCurrentStep(behaviorEnd); // go back to last behavior question
            } else {
              setReflectionNumber(1);
              setReflectionText('');
              secondReflectionGeneratedRef.current = false;
            }
          }}
        >
          Back
        </MemoButton>
        <MemoButton
          variant="contained"
          color="primary"
          onClick={() => {
            if (reflectionNumber === 1) {
              // Generate second reflection
              setReflectionNumber(2);
              setIsLoadingReflection(true);
              const reflectionData = {
                warningLabel: formData.warningLabel,
                proudMoment: formData.proudMoment,
                reflectionNumber: 2,
                selectedAgent: 'bluntPracticalFriend',
              };
              fetch('/api/get-ai-reflection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reflectionData),
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
            } else {
              // Move to Insights
              setCurrentStep(mindsetIntroStep);
            }
          }}
          disabled={isLoadingReflection}
        >
          {reflectionNumber === 1 ? 'Next' : 'Move onto Insights'}
        </MemoButton>
      </Stack>
    </Stack>
  </SectionCard>
)}




        {/* Insights (Societal Norms) – 2 pages, 5 sliders each (Steps 17..18) */}
{currentStep >= societalStart && currentStep <= societalEnd && (
  <SectionCard narrow={false}>
    {(() => {
      const groupIdx = currentStep - societalStart; // 0..1
      const start = groupIdx * SOCIETAL_GROUP_SIZE;
      const end = start + SOCIETAL_GROUP_SIZE;
      const currentGroup = societalNormsQuestions.slice(start, end);

      return (
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.35 }}>Insights</Typography>
          <Typography sx={{ mb: 3, opacity: 0.85, maxWidth: 600 }}>
            Rate how often each statement reflects your typical leadership behavior. Use the slider: 1 = Never, 10 = Always.
          </Typography>

          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 2,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <Stack spacing={2}>
              {currentGroup.map((q, idx) => {
                const absoluteIdx = start + idx;
                const val = societalResponses[absoluteIdx];
                const displayVal = val ?? '____';
                return (
                  <Box key={absoluteIdx} sx={{ width: '100%' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.5,
                            fontSize: '0.95rem',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {q}{' '}
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              minWidth: 34,
                              textAlign: 'center',
                              borderBottom: '2px solid rgba(0,0,0,0.5)',
                              fontWeight: 800,
                              px: 0.5,
                              ml: 0.5,
                            }}
                          >
                            {displayVal}
                          </Box>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ position: 'relative', width: '100%', px: { xs: 1, md: 2 } }}>
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
                            valueLabelDisplay="off"
                            slotProps={{
                              thumb: { 'data-value': val ?? 5 }
                            }}
                            sx={{
                              '& .MuiSlider-markLabel': {
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                transform: 'translateY(6px)',
                                '&:first-of-type': {
                                  textAlign: 'left',
                                  left: '0 !important',
                                },
                                '&:last-of-type': {
                                  textAlign: 'right',
                                  right: '0 !important',
                                  left: 'auto !important',
                                  transform: 'translateY(6px)',
                                  width: 'auto',
                                  maxWidth: 'none',
                                },
                              },
                              '& .MuiSlider-thumb': {
                                width: 36,
                                height: 36,
                                backgroundColor: '#457089',
                                border: '2px solid #2f4f5f',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                '&:after': {
                                  content: 'attr(data-value)',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                },
                              },
                              '& .MuiSlider-track': {
                                bgcolor: '#6393AA',
                              },
                              '& .MuiSlider-rail': {
                                bgcolor: 'rgba(0,0,0,0.12)',
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                    {idx < currentGroup.length - 1 && (
                      <Divider sx={{ my: 2 }} />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Paper>

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

          {/* If it IS the last group → show Back/Next */}
          {currentStep === societalEnd && (
            <Stack direction="row" spacing={2} sx={{ pt: 2, justifyContent: 'center' }}>
              <MemoButton
                variant="outlined"
                onClick={() => setCurrentStep(s => Math.max(s - 1, societalStart))}
              >
                Back
              </MemoButton>
              <MemoButton
                variant="contained"
                color="primary"
                onClick={() => setCurrentStep(agentStep)}
              >
                Next
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

      {/* Custom Answer Dialog for Team Puzzle */}
      <Dialog
        open={customAnswerDialogOpen}
        onClose={() => {
          setCustomAnswerDialogOpen(false);
          setCustomAnswerText('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 2, fontWeight: 600 }}>
            When I'm given a complex project with a tight deadline, I would lead with:
          </Typography>
          <TextField
            value={customAnswerText}
            onChange={(e) => setCustomAnswerText(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Describe your approach..."
            variant="outlined"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setCustomAnswerDialogOpen(false);
              setCustomAnswerText('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCustomAnswerSubmit}
            disabled={!customAnswerText.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Model Elaboration Dialog */}
      <Dialog
        open={roleModelElaborationDialogOpen}
        onClose={() => {
          setRoleModelElaborationDialogOpen(false);
          setSelectedRoleModelTrait(null);
          setRoleModelElaborationText('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 400, textAlign: 'center', fontStyle: 'italic', fontSize: '0.95rem', pb: 1 }}>
          I wish how they {selectedRoleModelTrait} came more naturally to me.
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontWeight: 600 }}>
            Tell us more about your choice:
          </Typography>
          <TextField
            value={roleModelElaborationText}
            onChange={(e) => setRoleModelElaborationText(e.target.value)}
            fullWidth
            multiline
            rows={5}
            placeholder="Describe what you admire about how they do this..."
            variant="outlined"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setRoleModelElaborationDialogOpen(false);
              setSelectedRoleModelTrait(null);
              setRoleModelElaborationText('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRoleModelElaborationSubmit}
            disabled={!roleModelElaborationText.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Answer Dialog for Role Model */}
      <Dialog
        open={roleModelCustomAnswerDialogOpen}
        onClose={() => {
          setRoleModelCustomAnswerDialogOpen(false);
          setRoleModelCustomAnswerText('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 2, fontWeight: 600 }}>
            Think of a leader you admire (real or fictional) and complete this sentence:
          </Typography>
          <Typography sx={{ mb: 2, fontWeight: 600, fontSize: '1.1em' }}>
            I wish how they <strong style={{ textDecoration: 'underline' }}>__________</strong> came more naturally to me.
          </Typography>
          <TextField
            value={roleModelCustomAnswerText}
            onChange={(e) => setRoleModelCustomAnswerText(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Enter your answer..."
            variant="outlined"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setRoleModelCustomAnswerDialogOpen(false);
              setRoleModelCustomAnswerText('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRoleModelCustomAnswerSubmit}
            disabled={!roleModelCustomAnswerText.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
</Box>
);
}

export default IntakeForm;