import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import {
  Container, Box, Typography, TextField, Slider, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardActions, Grid, Paper, Divider, Alert
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { questionBank } from '../data/questionBank';
import { SOCIETAL_NORM_DISPLAY_TEMPLATES } from '../data/intakeContext';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import { useStepNav } from '../context/StepNavContext';
import { auth, db } from '../firebase';

// ---------- Memo wrappers ----------
const MemoTextField = memo(TextField);
const MemoSlider = memo(Slider);
const MemoButton = memo(Button);
const MemoBox = memo(Box);
const MemoCard = memo(Card);

const parseJson = (raw, fallback = null) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// ---------- Message Dialog (reusable for pop-ups) ----------
const MessageDialog = ({ open, onClose, title, content }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: useCairnTheme
        ? {
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(15,28,46,0.18)',
          }
        : {},
    }}
  >
    <DialogTitle sx={{
      fontWeight: useCairnTheme ? 700 : 800,
      textAlign: 'center',
      fontFamily: useCairnTheme ? '"Inter", sans-serif' : 'inherit',
      fontStyle: 'normal',
      fontSize: useCairnTheme ? '1.4rem' : 'inherit',
      color: useCairnTheme ? 'var(--ink, #0f1c2e)' : 'inherit',
      pt: useCairnTheme ? 3 : 2,
    }}>{title}</DialogTitle>
    <DialogContent sx={{ textAlign: 'center', py: 2 }}>
      <Typography sx={{
        lineHeight: 1.6,
        opacity: 0.9,
        fontFamily: useCairnTheme ? '"Inter", sans-serif' : 'inherit',
        color: useCairnTheme ? 'var(--ink-soft, #44566C)' : 'inherit',
      }}>{content}</Typography>
    </DialogContent>
    <DialogActions sx={{ justifyContent: 'center', pb: useCairnTheme ? 3 : 1 }}>
      <MemoButton variant="contained" onClick={onClose}>Continue</MemoButton>
    </DialogActions>
  </Dialog>
);

// A centered page container — in cairn mode removes the vw-width and centering
// since CompassLayout's 60% center column handles that.
const PageContainer = ({ children }) => (
  <Container
    maxWidth={false}
    sx={{
      py: { xs: 2, sm: 3 },
      px: useCairnTheme ? 0 : { xs: 2, sm: 4 },
      display: 'flex',
      justifyContent: 'center',
      width: useCairnTheme ? '100%' : '100vw',
    }}
  >
    <Box sx={{ width: '100%', maxWidth: useCairnTheme ? 'none' : 880 }}>{children}</Box>
  </Container>
);

// Centered card with natural width (never full-bleed).
// In cairn mode renders without card chrome so content floats on the background.
const SectionCard = ({ children, narrow = false }) => {
  if (useCairnTheme) {
    return (
      <MemoBox sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Box sx={{ width: '100%', maxWidth: narrow ? 748 : 880, py: 4 }}>
          {children}
        </Box>
      </MemoBox>
    );
  }
  return (
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
};

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
      minHeight: compact ? 48 : useCairnTheme ? 54 : 68,
      userSelect: 'none',
      p: compact ? 1 : useCairnTheme ? '12px 20px' : 1.6,
      borderRadius: useCairnTheme ? '10px' : 2,
      border: selected
        ? useCairnTheme ? '2px solid var(--orange-deep, #C0612A)' : '2px solid #E07A3F'
        : useCairnTheme
          ? '1.5px solid var(--sand-300, #C8B89A)'
          : '1px solid rgba(0,0,0,0.12)',
      bgcolor: selected
        ? useCairnTheme ? 'var(--orange, #E07A3F)' : 'rgba(224,122,63,0.09)'
        : useCairnTheme
          ? 'var(--cairn-option-bg, #FFFFFF)'
          : 'background.paper',
      boxShadow: useCairnTheme
        ? selected ? '0 0 0 3px rgba(224,122,63,0.28), 0 8px 28px rgba(196,87,30,0.28)' : 'none'
        : selected ? '0 6px 22px rgba(224,122,63,0.28)' : '0 2px 10px rgba(0,0,0,0.06)',
      transform: useCairnTheme && selected ? 'scale(1.016)' : undefined,
      animation: selected && useCairnTheme ? 'cairnOptionSelect 320ms cubic-bezier(0.2,0.8,0.2,1) forwards' : undefined,
      transition: 'border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease, transform 200ms cubic-bezier(0.2,0.8,0.2,1)',
      cursor: disabled ? 'default' : 'pointer',
      textAlign: showWarningIcon ? 'left' : 'center',
      '&:hover': useCairnTheme
        ? selected
          ? {}
          : { borderColor: 'var(--orange, #E07A3F)', bgcolor: 'rgba(224,122,63,0.05)' }
        : { boxShadow: '0 10px 28px rgba(0,0,0,0.16)', transform: 'translateY(-2px)' },
    }}
  >
    {showWarningIcon && (
      <Box sx={{ width: '33%', display: 'flex', alignItems: 'center', justifyContent: 'center', pr: 1.5 }}>
        <WarningLabelIcon type={warningType} />
      </Box>
    )}
    <Box sx={{ flex: showWarningIcon ? 2 : 1, display: 'flex', alignItems: 'center', justifyContent: showWarningIcon ? 'flex-start' : 'center' }}>
      <Typography sx={{
        fontSize: compact ? '0.9rem' : useCairnTheme ? '0.875rem' : '1.05rem',
        fontWeight: useCairnTheme ? (selected ? 600 : 400) : 500,
        fontFamily: useCairnTheme ? '"Inter", sans-serif' : 'inherit',
        color: useCairnTheme ? (selected ? '#ffffff' : 'var(--ink, #0f1c2e)') : 'inherit',
        letterSpacing: useCairnTheme ? '0.01em' : 'inherit',
        transition: 'color 200ms ease, font-weight 200ms ease',
      }}>{children}</Typography>
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
  const [societalQuestionIndex, setSocietalQuestionIndex] = useState(0);
  const [resumeNotice, setResumeNotice] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState({ state: 'idle', updatedAt: '' });
  const [postSignupNotice, setPostSignupNotice] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerStepNav, unregister: unregisterStepNav } = useStepNav();
  const autosaveTimeoutRef = useRef(null);
  const autosaveReadyRef = useRef(false);
  const authUidRef = useRef('');
  const lastDraftJsonRef = useRef('');
  const stagingHost = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
  const isStagingRuntime =
    stagingHost.includes('staging.northstarpartners.org') ||
    stagingHost.includes('compass-staging');

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

  // Load profile context immediately, then hydrate any local/remote intake draft.
  useEffect(() => {
    const rawNotice = localStorage.getItem('postSignupNotice');
    if (!rawNotice) return;
    try {
      const parsed = JSON.parse(rawNotice);
      if (parsed?.message) {
        setPostSignupNotice({
          severity: parsed?.severity || 'info',
          message: parsed.message,
        });
      }
    } catch {
      // ignore malformed transient notice
    }
    localStorage.removeItem('postSignupNotice');
  }, []);

  useEffect(() => {
    let active = true;

    const applyDraft = (draft) => {
      if (!active || !draft || typeof draft !== 'object') return;
      try {
        lastDraftJsonRef.current = JSON.stringify(draft);
      } catch {
        lastDraftJsonRef.current = '';
      }
      if (draft?.formData && typeof draft.formData === 'object') {
        setFormData((prev) => ({ ...prev, ...draft.formData }));
      }
      if (Array.isArray(draft?.societalResponses)) {
        setSocietalResponses((prev) => {
          const next = Array(10).fill(null);
          prev.forEach((value, index) => { next[index] = value; });
          draft.societalResponses.forEach((value, index) => { next[index] = value ?? null; });
          return next;
        });
      }
      if (Number.isInteger(draft?.currentStep)) {
        setCurrentStep(draft.currentStep);
      }
      if (Number.isInteger(draft?.reflectionNumber)) {
        setReflectionNumber(draft.reflectionNumber);
      }
      if (typeof draft?.reflectionText === 'string') {
        setReflectionText(draft.reflectionText);
      }
      if (Number.isInteger(draft?.societalQuestionIndex)) {
        setSocietalQuestionIndex(draft.societalQuestionIndex);
      }
    };

    const bootstrapDraft = async (user) => {
      let localDraft = null;
      try {
        const userInfo = parseJson(localStorage.getItem('userInfo'), {});
        if (active) {
          setFormData((prev) => ({
            ...prev,
            name: userInfo?.name || '',
            email: userInfo?.email || '',
          }));
        }

        localDraft = parseJson(localStorage.getItem('intakeDraft'), null);
        const localStatus = parseJson(localStorage.getItem('intakeStatus'), null);
        if (localDraft) {
          applyDraft(localDraft);
          if (active) {
            setResumeNotice({
              source: 'local',
              currentStep: localDraft?.currentStep ?? 0,
              totalSteps: localStatus?.totalSteps || totalSteps,
              updatedAt: localStatus?.updatedAt || '',
            });
          }
        }

        if (user?.uid) {
          authUidRef.current = user.uid;
          try {
            const docSnap = await getDoc(doc(db, 'responses', user.uid));
            if (active && docSnap.exists()) {
              const remote = docSnap.data() || {};
              applyDraft(remote?.intakeDraft || null);
              if (remote?.latestFormData && remote?.intakeStatus?.complete) {
                localStorage.setItem('latestFormData', JSON.stringify(remote.latestFormData));
              }
              if (remote?.intakeDraft) {
                localStorage.setItem('intakeDraft', JSON.stringify(remote.intakeDraft));
              }
              if (remote?.intakeStatus) {
                localStorage.setItem('intakeStatus', JSON.stringify(remote.intakeStatus));
                if (active && remote?.intakeDraft && !remote?.intakeStatus?.complete) {
                  setResumeNotice({
                    source: 'cloud',
                    currentStep: remote?.intakeDraft?.currentStep ?? 0,
                    totalSteps: remote?.intakeStatus?.totalSteps || totalSteps,
                    updatedAt: remote?.intakeStatus?.updatedAt || '',
                  });
                }
              }
            }
          } catch (remoteDraftErr) {
            const code = String(remoteDraftErr?.code || '').toLowerCase();
            const message = String(remoteDraftErr?.message || '').toLowerCase();
            const isPermissionErr = code.includes('permission-denied') || message.includes('insufficient permissions');
            if (!isPermissionErr) {
              throw remoteDraftErr;
            }
            console.warn('[IntakeForm] No readable remote intake draft yet.');
          }
        } else {
          authUidRef.current = '';
        }
      } catch (err) {
        console.warn('Could not hydrate intake draft:', err);
      } finally {
        if (active) {
          autosaveReadyRef.current = true;
          if (new URLSearchParams(location.search || '').get('resume') === '1' && !localDraft) {
            const remoteStatus = parseJson(localStorage.getItem('intakeStatus'), null);
            if (!remoteStatus?.started || remoteStatus?.complete) {
              setResumeNotice({
                source: 'missing',
                currentStep: 0,
                totalSteps,
                updatedAt: '',
              });
            }
          }
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      bootstrapDraft(user);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [location.search]);

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
  const societalNormsQuestions = SOCIETAL_NORM_DISPLAY_TEMPLATES;

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
  const societalScaleLabels = {
    1: 'Never',
    2: 'Rarely',
    3: 'Seldom',
    4: 'Occasionally',
    5: 'Sometimes',
    6: 'Often',
    7: 'Usually',
    8: 'Frequently',
    9: 'Almost Always',
    10: 'Always',
  };
  const stepVars = useMemo(() => {
    const behaviorStart = 3; // after profile (step 1) and behaviors intro popup (step 2)
    const behaviorEnd = behaviorStart + behaviorSet.length - 1; // 3..14 (12 qs)
    const reflectionStep = behaviorEnd + 1; // 15
    const mindsetIntroStep = reflectionStep + 1; // 16 (popup)
    const societalStart = mindsetIntroStep + 1; // 17
    const societalEnd = societalStart; // single page with progressive questions
    const agentStep = societalEnd + 1; // 24
    const totalSteps = agentStep + 1;
    return {
      behaviorStart, behaviorEnd, reflectionStep, mindsetIntroStep,
      societalStart, societalEnd, agentStep, totalSteps
    };
  }, [behaviorSet.length]);

  const {
    behaviorStart, behaviorEnd, reflectionStep, mindsetIntroStep,
    societalStart, societalEnd, agentStep, totalSteps
  } = stepVars;

  const buildDraftPayload = () => ({
    formData,
    societalResponses,
    currentStep,
    reflectionNumber,
    reflectionText,
    societalQuestionIndex,
  });

  const syncLocalIntakeState = (draft, options = {}) => {
    const nowIso = new Date().toISOString();
    const complete = Boolean(options.complete);
    const normalizedDraft = draft || buildDraftPayload();
    localStorage.setItem('intakeDraft', JSON.stringify(normalizedDraft));
    localStorage.setItem(
      'intakeStatus',
      JSON.stringify({
        started: true,
        complete,
        currentStep: normalizedDraft?.currentStep ?? currentStep,
        totalSteps,
        updatedAt: nowIso,
      })
    );
    if (complete && options.latestFormData) {
      localStorage.setItem('latestFormData', JSON.stringify(options.latestFormData));
    }
  };

  const persistDraftToFirestore = async (draft, options = {}) => {
    const localUserInfo = parseJson(localStorage.getItem('userInfo'), {});
    const uid = String(authUidRef.current || auth.currentUser?.uid || localUserInfo?.uid || '').trim();
    if (!uid) return;

    const nowIso = new Date().toISOString();
    const complete = Boolean(options.complete);
    const latestFormData = options.latestFormData || null;

    await setDoc(
      doc(db, 'responses', uid),
      {
        ownerUid: uid,
        ownerEmail: String(formData?.email || localUserInfo?.email || '').trim(),
        ownerName: String(formData?.name || localUserInfo?.name || '').trim(),
        intakeDraft: draft,
        intakeStatus: {
          started: true,
          complete,
          currentStep: draft?.currentStep ?? currentStep,
          totalSteps,
          updatedAt: nowIso,
        },
        ...(latestFormData ? { latestFormData } : {}),
      },
      { merge: true }
    );
  };

  // ---- dialogs and reflection text ----
  useEffect(() => {
    const messageSteps = [0, 2, mindsetIntroStep]; // Profile intro, Behaviors intro, Insights intro
    const reflectionIntro = currentStep === reflectionStep && reflectionNumber === 1 && !reflectionGeneratedRef.current;
    setDialogOpen(messageSteps.includes(currentStep) || reflectionIntro);
  }, [currentStep, mindsetIntroStep]);

  const clampReflectionText = (text, max = 250) => {
    const clean = String(text || '').trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max).trimEnd()}...`;
  };

  const requestReflection = (payload, isSecond = false) => {
    const guardRef = isSecond ? secondReflectionGeneratedRef : reflectionGeneratedRef;
    if (guardRef.current) return;

    guardRef.current = true;
    setIsLoadingReflection(true);
    setReflectionText('');

    fetch('/api/get-ai-reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.reflection) {
          setReflectionText(clampReflectionText(data.reflection, 250));
        } else {
          setReflectionText("We couldn't generate a reflection right now. Try again or continue.");
        }
      })
      .catch(() => setReflectionText("Reflection generation failed. Please continue."))
      .finally(() => setIsLoadingReflection(false));
  };

  // Generate reflection only once when reaching the step
  useEffect(() => {
    if (currentStep !== reflectionStep) return;

    if (reflectionNumber === 1) {
      requestReflection({
        energyDrains: formData.energyDrains,
        leaderFuel: formData.leaderFuel,
        selectedAgent: 'bluntPracticalFriend',
        reflectionNumber: 1,
      });
    }

    if (reflectionNumber === 2) {
      requestReflection({
        warningLabel: formData.warningLabel,
        proudMoment: formData.proudMoment,
        reflectionNumber: 2,
        selectedAgent: 'bluntPracticalFriend',
      }, true);
    }
  }, [currentStep, reflectionStep, reflectionNumber]);

  useEffect(() => {
    if (currentStep === societalStart) {
      setSocietalQuestionIndex(0);
    }
  }, [currentStep, societalStart]);

  useEffect(() => {
    if (!autosaveReadyRef.current) return undefined;

    const draft = buildDraftPayload();
    let draftJson = '';
    try {
      draftJson = JSON.stringify(draft);
    } catch {
      draftJson = '';
    }

    if (draftJson && draftJson === lastDraftJsonRef.current) {
      return undefined;
    }

    if (draftJson) {
      lastDraftJsonRef.current = draftJson;
    }

    setAutosaveStatus((prev) => ({
      state: 'saving',
      updatedAt: prev?.updatedAt || '',
    }));
    syncLocalIntakeState(draft);

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await persistDraftToFirestore(draft);
        setAutosaveStatus({
          state: 'saved',
          updatedAt: new Date().toISOString(),
        });
      } catch (persistErr) {
        const code = String(persistErr?.code || '').toLowerCase();
        const message = String(persistErr?.message || '').toLowerCase();
        const isPermissionErr = code.includes('permission-denied') || message.includes('insufficient permissions');
        if (isStagingRuntime && isPermissionErr) {
          console.warn('[IntakeForm] Draft autosave bypassed Firestore permission error.');
          setAutosaveStatus({
            state: 'saved',
            updatedAt: new Date().toISOString(),
          });
          return;
        }
        console.warn('[IntakeForm] Draft autosave failed:', persistErr);
        setAutosaveStatus((prev) => ({
          state: 'error',
          updatedAt: prev?.updatedAt || '',
        }));
      }
    }, 1600);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [
    currentStep,
    formData,
    societalResponses,
    reflectionNumber,
    reflectionText,
    societalQuestionIndex,
    totalSteps,
    isStagingRuntime,
  ]);


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

  const isNumeric = (value) => /^\d+$/.test(String(value ?? '').trim());
  const isProfileValid = () => {
    const industry = String(formData.industry || '').trim();
    const department = String(formData.department || '').trim();
    const role = String(formData.role || '').trim();
    const responsibilities = String(formData.responsibilities || '').trim();
    const birthYear = Number(formData.birthYear);
    const teamSize = Number(formData.teamSize);
    const leadershipExperience = Number(formData.leadershipExperience);
    const careerExperience = Number(formData.careerExperience);

    const currentYear = new Date().getFullYear();
    return (
      industry &&
      department &&
      role &&
      responsibilities &&
      isNumeric(formData.birthYear) &&
      birthYear >= 1900 &&
      birthYear <= currentYear &&
      isNumeric(formData.teamSize) &&
      teamSize >= 0 &&
      isNumeric(formData.leadershipExperience) &&
      leadershipExperience >= 0 &&
      isNumeric(formData.careerExperience) &&
      careerExperience >= 0
    );
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
        if (!isProfileValid()) return;

      // Behaviors validation (steps 5..16)
      } else if (currentStep >= behaviorStart && currentStep <= behaviorEnd) {
        const qIndex = currentStep - behaviorStart;
        const q = behaviorSet[qIndex];
        const v = formData[q.id];
        if (q.type === 'text' && !v) return;
        if (q.type === 'multi-select' && (!v || v.length === 0)) return;
        if (q.type === 'ranking') {
          // null means user hasn't dragged yet — treat as default order and persist it
          if (!v) {
            handleChange(q.id, q.options);
          } else if (v.length !== q.options.length) {
            return;
          }
        }
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
    setCurrentStep(behaviorStart);
  };

  // Register step-level back/forward with the topbar arrows.
  useEffect(() => {
    const isMessageStep = [0, 2, mindsetIntroStep].includes(currentStep) ||
      (currentStep === reflectionStep && reflectionNumber === 1);

    let canFwd = true;
    if (!isMessageStep) {
      if (currentStep === 1) {
        canFwd = isProfileValid();
      } else if (currentStep >= behaviorStart && currentStep <= behaviorEnd) {
        const q = behaviorSet[currentStep - behaviorStart];
        const v = formData[q?.id];
        canFwd = !(
          (q?.type === 'text' && !v) ||
          (q?.type === 'multi-select' && (!v || v.length === 0)) ||
          (q?.type === 'ranking' && v != null && v.length !== q.options.length) ||
          (q?.type === 'radio' && !v) ||
          (q?.id === 'roleModelTrait' && !formData.roleModelTraitElaboration && q.options.includes(v))
        );
      } else if (currentStep === agentStep) {
        canFwd = !!formData.selectedAgent;
      }
    }

    registerStepNav({
      canGoBack: currentStep > 0,
      canGoForward: canFwd,
      goBack: () => setCurrentStep((s) => Math.max(0, s - 1)),
      goForward: handleNext,
    });
    return unregisterStepNav;
  }, [currentStep, formData, reflectionNumber, mindsetIntroStep, reflectionStep,
      behaviorStart, behaviorEnd, behaviorSet, agentStep]);

  const formatAutosaveTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };


  const handleSubmit = async () => {
    try {
      const selectedAgentId = formData.selectedAgent || 'balancedMentor';
      const updated = {
        ...formData,
        selectedAgent: selectedAgentId,
        societalResponses
      };
      const finalDraft = {
        ...buildDraftPayload(),
        formData: updated,
        currentStep: totalSteps - 1,
      };
      try {
        await persistDraftToFirestore(finalDraft, {
          complete: true,
          latestFormData: updated,
        });
      } catch (persistErr) {
        const code = String(persistErr?.code || '').toLowerCase();
        const message = String(persistErr?.message || '').toLowerCase();
        const isPermissionErr = code.includes('permission-denied') || message.includes('insufficient permissions');
        if (!(isStagingRuntime && isPermissionErr)) {
          throw persistErr;
        }
        console.warn('[IntakeForm] Staging submit bypassed Firestore permission error.');
      }
      syncLocalIntakeState(finalDraft, {
        complete: true,
        latestFormData: updated,
      });
      navigate('/summary', { state: { formData: updated } });
    } catch (e) {
      console.error('Submit failed', e);
      alert('Failed to submit form. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ---------- UI ----------
  const intakePct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100svh',
        width: '100%',
        overflowX: 'hidden',
        // cairn: light sand background; production: dark photo bg
        ...(useCairnTheme
          ? { bgcolor: 'var(--sand-50, #FBF7F0)' }
          : {
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
            }),
      }}
    >
      <ProcessTopRail titleOverride={currentStep === 1 ? 'Leader Profile' : ''} />

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

      <CompassLayout progress={intakePct}>
      <PageContainer>
        {postSignupNotice && (
          <Alert severity={postSignupNotice.severity} sx={{ mb: 2, fontFamily: 'Montserrat, sans-serif' }}>
            {postSignupNotice.message}
          </Alert>
        )}
        {resumeNotice && !useCairnTheme && (
          <Alert
            severity={resumeNotice.source === 'missing' ? 'warning' : 'success'}
            sx={{ mb: 2, fontFamily: 'Montserrat, sans-serif' }}
          >
            {resumeNotice.source === 'missing'
              ? 'No saved intake draft was found for this account. You can continue from the beginning.'
              : `Draft restored. You are back at step ${Math.min((resumeNotice.currentStep || 0) + 1, resumeNotice.totalSteps || totalSteps)} of ${resumeNotice.totalSteps || totalSteps}${resumeNotice.updatedAt ? `, last saved ${formatAutosaveTime(resumeNotice.updatedAt)}` : ''}.`}
          </Alert>
        )}
        {!useCairnTheme && (
          <Alert
            severity={autosaveStatus.state === 'error' ? 'warning' : 'info'}
            sx={{ mb: 2, fontFamily: 'Montserrat, sans-serif' }}
          >
            {autosaveStatus.state === 'saving'
              ? 'Saving your progress...'
              : autosaveStatus.state === 'saved'
                ? `Progress saved automatically${autosaveStatus.updatedAt ? ` at ${formatAutosaveTime(autosaveStatus.updatedAt)}` : ''}.`
                : autosaveStatus.state === 'error'
                  ? 'Autosave hit a problem. Your local draft is still retained in this browser.'
                  : 'Your intake progress saves automatically as you move through the experience.'}
          </Alert>
        )}
        {/* Profile Page (Step 1) - Combined */}
        {currentStep === 1 && (
          <SectionCard narrow={true}>
            <Stack spacing={1.8} alignItems="stretch" textAlign="center" sx={{ width: '100%' }}>
              <Typography sx={{
                fontFamily: useCairnTheme ? '"Inter", sans-serif' : 'inherit',
                fontStyle: 'normal',
                fontWeight: useCairnTheme ? 800 : 800,
                fontSize: useCairnTheme ? { xs: '1.75rem', md: '2rem' } : { xs: '1.5rem', md: '1.5rem' },
                lineHeight: useCairnTheme ? 1.2 : 1.35,
                mb: 0.2,
                textAlign: 'center',
                color: useCairnTheme ? 'var(--ink, #0f1c2e)' : 'inherit',
              }}>
                Leader Profile
              </Typography>

              <Box
                sx={{
                  p: { xs: 1.1, md: 1.3 },
                  borderRadius: 2,
                  border: useCairnTheme ? 'none' : '1px solid rgba(0,0,0,0.14)',
                  bgcolor: useCairnTheme ? 'transparent' : 'rgba(0,0,0,0.03)',
                }}
              >
                <Grid container spacing={1.3} alignItems="stretch">
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.55, display: 'block', textAlign: 'left', minHeight: 38 }}>
                        Year Born
                      </Typography>
                      <MemoTextField
                        value={formData.birthYear || ''}
                        onChange={(e) => {
                          const raw = String(e.target.value || '').replace(/[^\d]/g, '').slice(0, 4);
                          handleChange('birthYear', raw);
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 1985"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.55, display: 'block', textAlign: 'left', minHeight: 38 }}>
                        Industry
                      </Typography>
                      <MemoTextField
                        value={formData.industry || ''}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Industry"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.55, display: 'block', textAlign: 'left', minHeight: 38 }}>
                        Department
                      </Typography>
                      <MemoTextField
                        value={formData.department || ''}
                        onChange={(e) => handleChange('department', e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Department"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <MemoBox sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.6, textAlign: 'left' }}>
                  Job Title
                </Typography>
                <MemoTextField
                  value={formData.role || ''}
                  onChange={(e) => handleChange('role', e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="Current role"
                />
              </MemoBox>

              <MemoBox sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.6, textAlign: 'left' }}>
                  Briefly describe what your team is responsible for.
                </Typography>
                <MemoTextField
                  value={formData.responsibilities || ''}
                  onChange={(e) => handleChange('responsibilities', e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                  placeholder="Team scope and primary responsibilities"
                />
              </MemoBox>

              <Box
                sx={{
                  p: { xs: 1.1, md: 1.3 },
                  borderRadius: 2,
                  border: useCairnTheme ? 'none' : '1px solid rgba(0,0,0,0.14)',
                  bgcolor: useCairnTheme ? 'transparent' : 'rgba(0,0,0,0.03)',
                }}
              >
                <Grid container spacing={1.3} alignItems="stretch">
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.55, display: 'block', textAlign: 'left', minHeight: 38 }}>
                        Team Size
                      </Typography>
                      <MemoTextField
                        value={formData.teamSize ?? ''}
                        onChange={(e) => {
                          const raw = String(e.target.value || '').replace(/[^\d]/g, '');
                          handleChange('teamSize', raw);
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.55, display: 'block', textAlign: 'left', minHeight: 38 }}>
                        Years in Current Role
                      </Typography>
                      <MemoTextField
                        value={formData.leadershipExperience ?? ''}
                        onChange={(e) => {
                          const raw = String(e.target.value || '').replace(/[^\d]/g, '');
                          handleChange('leadershipExperience', raw);
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.55, display: 'block', textAlign: 'left', minHeight: 38 }}>
                        Years in Leadership
                      </Typography>
                      <MemoTextField
                        value={formData.careerExperience ?? ''}
                        onChange={(e) => {
                          const raw = String(e.target.value || '').replace(/[^\d]/g, '');
                          handleChange('careerExperience', raw);
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="flex-start" sx={{ pt: 0.4 }}>
                <MemoButton variant="outlined" onClick={() => setCurrentStep(0)} sx={{ minWidth: 86 }}>Back</MemoButton>
                <MemoButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isProfileValid()}
                  sx={{
                    minWidth: 120,
                    py: 1,
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
                <Stack spacing={useCairnTheme ? 2.5 : 3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
                  <Typography sx={{
                    fontFamily: useCairnTheme ? '"Inter", sans-serif' : 'inherit',
                    fontStyle: 'normal',
                    fontSize: useCairnTheme ? 16 : 'inherit',
                    fontWeight: useCairnTheme ? 700 : 700,
                    letterSpacing: useCairnTheme ? '0.06em' : 1.2,
                    textAlign: 'center',
                    color: useCairnTheme ? 'var(--orange-deep, #C0612A)' : 'inherit',
                    textTransform: useCairnTheme ? 'none' : 'uppercase',
                  }}>
                    {q.theme}
                  </Typography>
                  <Typography sx={{
                    fontFamily: useCairnTheme ? '"Inter", sans-serif' : 'inherit',
                    fontStyle: 'normal',
                    fontWeight: useCairnTheme ? 700 : 800,
                    fontSize: useCairnTheme ? { xs: '1.75rem', md: '2rem' } : { xs: '1.25rem', md: '1.5rem' },
                    lineHeight: useCairnTheme ? 1.2 : 1.35,
                    textAlign: 'center',
                    color: useCairnTheme ? 'var(--ink, #0f1c2e)' : 'inherit',
                  }}>
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
                                    {q.id !== 'crisisResponse' && (
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
                                    )}
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
                        (q.type === 'ranking' && (formData[q.id] != null && formData[q.id].length !== q.options.length)) ||
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
    <Stack spacing={3} alignItems="center" textAlign="center">
      <Typography
        sx={{
          fontFamily: 'Gemunu Libre, sans-serif',
          fontSize: { xs: '2.05rem', md: '2.35rem' },
          fontWeight: 800,
          lineHeight: 1.1,
          color: 'text.primary',
          textShadow: '0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        Reflection Moment
      </Typography>
      <Typography
        sx={{
          fontFamily: 'Gemunu Libre, sans-serif',
          fontSize: '1.03rem',
          color: 'text.secondary',
          lineHeight: 1.45,
          mt: -0.75,
          mb: 0.5,
        }}
      >
        Insights from your reflection and leadership assessment
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
          <strong>Agent Observation:</strong>{' '}
          {reflectionText || 'Generating observation...'}
        </Typography>
      </Paper>

      {/* User Input Box */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '1.05rem',
          color: 'text.primary',
          maxWidth: 720,
          textAlign: 'left',
          width: '100%',
        }}
      >
        How have these traits/behaviors negatively impacted your ability to lead in the past?
      </Typography>
      <MemoTextField
        value={formData.userReflection || ''}
        onChange={(e) => handleChange('userReflection', e.target.value)}
        fullWidth
        multiline
        minRows={3}
        placeholder="Write your reflection here..."
        sx={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: 2,
          maxWidth: 720,
        }}
      />

      {/* Action Button */}
      <Stack direction="row" justifyContent="center" sx={{ pt: 2 }}>
        <MemoButton
          variant="contained"
          color="primary"
          onClick={() => setCurrentStep(mindsetIntroStep)}
          disabled={isLoadingReflection || !formData.userReflection?.trim()}
        >
          Next
        </MemoButton>
      </Stack>
    </Stack>
  </SectionCard>
)}




        {/* Leader Instincts (Societal Norms) – single page, one question at a time */}
{currentStep >= societalStart && currentStep <= societalEnd && (
  <SectionCard narrow={false}>
    {(() => {
      const activeIdx = societalQuestionIndex;
      const q = societalNormsQuestions[activeIdx] || '';
      const val = societalResponses[activeIdx];
      const displayVal = val ? (societalScaleLabels[val] || val) : '';
      const [beforeBlank, afterBlank] = q.split('____');
      const marks = Array.from({ length: 10 }, (_, i) => ({ value: i + 1 }));
      const lastQuestion = activeIdx === societalNormsQuestions.length - 1;

      return (
        <Stack spacing={2.4} alignItems="center" textAlign="center">
          {!useCairnTheme && (
            <Typography
              variant="overline"
              sx={{ letterSpacing: 1.2, opacity: 0.75, textAlign: 'center', fontWeight: 700 }}
            >
              Question {activeIdx + 1} of {societalNormsQuestions.length}
            </Typography>
          )}
          {useCairnTheme && (
            <Typography sx={{
              fontFamily: '"Inter", sans-serif',
              fontStyle: 'normal',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textAlign: 'center',
              color: 'var(--orange-deep, #C0612A)',
            }}>
              Leader Instincts
            </Typography>
          )}

          <Box sx={{ width: '100%', maxWidth: 760, mx: 'auto', textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: useCairnTheme ? '"Inter", sans-serif' : 'inherit',
                fontStyle: 'normal',
                fontWeight: useCairnTheme ? 700 : 800,
                lineHeight: useCairnTheme ? 1.2 : 1.35,
                fontSize: useCairnTheme ? { xs: '1.75rem', md: '2rem' } : { xs: '1.42rem', md: '1.58rem' },
                textAlign: 'center',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                color: useCairnTheme ? 'var(--ink, #0f1c2e)' : 'inherit',
              }}
            >
              {beforeBlank}
              <Box
                component="span"
                sx={{
                  display: 'inline',
                  minWidth: 80,
                fontWeight: 900,
                  px: 0.25,
                  mx: 0.35,
                  color: (val ?? 5) <= 5 ? '#2f4f5f' : '#9a4a1c',
                  fontStyle: 'italic',
                }}
              >
                {displayVal ? displayVal.toLowerCase() : '____'}
              </Box>
              {afterBlank}
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', width: '100%', maxWidth: 600, mx: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Never</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Always</Typography>
            </Stack>
            <Box sx={{ position: 'relative', px: 1 }}>
              {/* Match Balance Line slider visuals exactly */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 8,
                  transform: 'translateY(-50%)',
                  borderRadius: 1,
                  background: 'linear-gradient(to right, #6393AA 0%, #ffffff 50%, #ffffff 50%, #E07A3F 100%)',
                  zIndex: 0,
                }}
              />
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
                value={val ?? 5}
                onChange={(_, v) => setSocietalValue(activeIdx, v)}
                step={1}
                min={1}
                max={10}
                marks={marks}
                valueLabelDisplay="off"
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  height: 8,
                  width: '100%',
                  '& .MuiSlider-track': {
                    display: 'none',
                  },
                  '& .MuiSlider-rail': {
                    display: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                    bgcolor: '#fff',
                    border: '2px solid',
                    borderColor: (val ?? 5) <= 5 ? '#6393AA' : '#E07A3F',
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
                      bgcolor: (val ?? 5) <= 5 ? '#6393AA' : '#E07A3F',
                    },
                  },
                }}
              />
            </Box>
          </Box>

          <Stack direction="row" spacing={2} sx={{ pt: 2, justifyContent: 'center' }}>
            <MemoButton
              variant="outlined"
              onClick={() => {
                if (activeIdx > 0) {
                  setSocietalQuestionIndex((i) => i - 1);
                } else {
                  setCurrentStep(reflectionStep);
                }
              }}
            >
              Back
            </MemoButton>
            <MemoButton
              variant="contained"
              color="primary"
              onClick={() => {
                if (!lastQuestion) {
                  setSocietalQuestionIndex((i) => i + 1);
                } else if (useCairnTheme) {
                  // In cairn mode the guide was already chosen on /guide-select — submit directly.
                  if (!formData.selectedAgent) handleChange('selectedAgent', 'balancedMentor');
                  setIsSubmitting(true);
                  handleSubmit();
                } else {
                  setCurrentStep(agentStep);
                }
              }}
            >
              Next
            </MemoButton>
          </Stack>
        </Stack>
      );
    })()}
  </SectionCard>
)}

{/* Agent Select — production only; cairn mode submits directly from societal norms */}
{currentStep === agentStep && !useCairnTheme && (
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

      </PageContainer>
      </CompassLayout>

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