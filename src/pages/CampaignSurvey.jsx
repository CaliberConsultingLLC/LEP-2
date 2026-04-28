import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Slider,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getLeaderDisplayName, isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';
import { useStepNav } from '../context/StepNavContext';
import { useGuide } from '../context/GuideContext';

function CampaignSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [ratings, setRatings] = useState({});
  const [savedActionItems, setSavedActionItems] = useState([]);
  const [campaignMeta, setCampaignMeta] = useState({});
  const [traitRecapOpen, setTraitRecapOpen] = useState(false);
  const [surveyClosed, setSurveyClosed] = useState(false);

  const TRAIT_QUESTION_COUNT = 5;
  const parseJson = (raw, fallback) => {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    const campaignData = parseJson(localStorage.getItem(`campaign_${id}`), {});
    const normalizedCampaign = normalizeCampaignItems(campaignData?.campaign);
    if (campaignData?.campaignType && isCampaignReady(normalizedCampaign)) {
      setCampaign(normalizedCampaign);
      setCampaignMeta({
        ...campaignData,
        campaign: normalizedCampaign,
      });
    } else {
      navigate('/');
    }

    const checkIfSurveyClosed = async () => {
      if (String(campaignData?.campaignType || '').toLowerCase() !== 'team') return;
      try {
        const response = await fetch('/api/get-team-campaign-intro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: id }),
        });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        if (Boolean(payload?.campaign?.surveyClosed)) {
          setSurveyClosed(true);
          setCampaignMeta((prev) => ({
            ...prev,
            campaignType: 'team',
            surveyClosed: true,
            ownerUid: payload?.campaign?.ownerUid || prev?.ownerUid || null,
            ownerId: payload?.campaign?.ownerId || prev?.ownerId || null,
            bundleId: payload?.campaign?.bundleId || prev?.bundleId || null,
          }));
        }
      } catch (err) {
        console.warn('Unable to verify survey closed state:', err);
      }
    };

    checkIfSurveyClosed();

    try {
      const userInfo = parseJson(localStorage.getItem('userInfo'), {});
      const userKey = userInfo?.email || userInfo?.name || 'anonymous';
      const byCampaign = parseJson(localStorage.getItem('actionPlansByCampaign'), {});
      const plans = byCampaign?.[String(id)]?.[userKey]?.plans
        || byCampaign?.['123']?.[userKey]?.plans
        || {};
      const flat = [];
      Object.entries(plans).forEach(([, subtraits]) => {
        Object.entries(subtraits || {}).forEach(([, payload]) => {
          (payload?.items || []).forEach((item) => {
            if (String(item?.text || '').trim()) flat.push(item.text);
          });
        });
      });
      setSavedActionItems(flat);
    } catch {
      setSavedActionItems([]);
    }
  }, [id, navigate]);

  const saveResponses = async () => {
    if (surveyClosed) return;
    const campaignType = campaignMeta?.campaignType || 'team';
    const ratingsData = {
      id,
      campaignId: id,
      campaignType,
      ownerId: campaignMeta?.ownerId || null,
      ownerUid: campaignMeta?.ownerUid || campaignMeta?.userInfo?.uid || null,
      bundleId: campaignMeta?.bundleId || null,
      submittedAt: new Date(),
      ratings,
    };
    try {
      if (campaignType === 'team') {
        const accessToken = String(campaignMeta?.accessToken || '').trim();
        if (!accessToken) {
          throw new Error('missing-access-token');
        }
        const submitResponse = await fetch('/api/submit-team-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: id,
            accessToken,
            ratings,
          }),
        });
        const submitPayload = await submitResponse.json().catch(() => ({}));
        if (!submitResponse.ok) {
          const normalizedError = String(submitPayload?.error || '').toLowerCase();
          if (submitResponse.status === 409 || normalizedError.includes('closed')) {
            setSurveyClosed(true);
          }
          throw new Error(submitPayload?.error || 'team-survey-submit-failed');
        }
      } else {
        await addDoc(collection(db, 'surveyResponses'), ratingsData);
      }
    } catch (persistErr) {
      const message = String(persistErr?.message || '').toLowerCase();
      if (message.includes('missing-access-token')) {
        alert('Campaign access expired. Please re-enter the campaign password.');
        navigate(`/campaign/${id}`, { replace: true });
        return;
      }
      throw persistErr;
    }
    localStorage.setItem(`latestSurveyRatings_${id}`, JSON.stringify(ratings));
    console.log('Survey responses saved to Firestore:', ratingsData);
  };

  const getTraitRecapMetrics = (questionIdx) => {
    const traitIndex = Math.floor(questionIdx / TRAIT_QUESTION_COUNT);
    const start = traitIndex * TRAIT_QUESTION_COUNT;
    const values = [];
    for (let i = start; i < start + TRAIT_QUESTION_COUNT; i += 1) {
      const row = i === currentQuestion ? currentRating : ratings[String(i)];
      if (row != null && row.effort != null && row.efficacy != null) {
        values.push({ effort: Number(row.effort), efficacy: Number(row.efficacy) });
      }
    }
    if (!values.length) return { effortAvg: 0, efficacyAvg: 0, traitScore: 0 };
    const effortAvg = values.reduce((sum, row) => sum + row.effort, 0) / values.length;
    const efficacyAvg = values.reduce((sum, row) => sum + row.efficacy, 0) / values.length;
    const traitScore = ((effortAvg + efficacyAvg) / 2) * 10;
    return { effortAvg, efficacyAvg, traitScore };
  };

  const nextQuestion = async () => {
    const lastQuestionIdx = questions.length - 1;
    const completedTraitBoundary = (currentQuestion + 1) % TRAIT_QUESTION_COUNT === 0;
    if (currentQuestion < lastQuestionIdx) {
      if (completedTraitBoundary) {
        setTraitRecapOpen(true);
        return;
      }
      setCurrentQuestion(prev => prev + 1);
    } else {
      if (!traitRecapOpen) {
        setTraitRecapOpen(true);
        return;
      }
      try {
        await saveResponses();
        navigate(`/campaign/${id}/complete`);
      } catch (error) {
        console.warn('Survey submit failed:', error);
        alert('Could not submit this survey right now. Please try again.');
      }
    }
  };

  const handleProceedNextTrait = async () => {
    setTraitRecapOpen(false);
    const lastQuestionIdx = questions.length - 1;
    if (currentQuestion < lastQuestionIdx) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }
    try {
      await saveResponses();
      navigate(`/campaign/${id}/complete`);
    } catch (error) {
      console.warn('Survey submit failed:', error);
      alert('Could not submit this survey right now. Please try again.');
    }
  };

  const handleMakeAdjustments = () => {
    const traitStart = Math.floor(currentQuestion / TRAIT_QUESTION_COUNT) * TRAIT_QUESTION_COUNT;
    setTraitRecapOpen(false);
    setCurrentQuestion(traitStart);
  };

  const prevQuestion = () => {
    if (currentQuestion <= 0) return;
    setCurrentQuestion((prev) => prev - 1);
  };

  const getSentiment = (effort, efficacy, _selfMode = false) => {
    const effortRange = effort <= 4 ? 'Low' : effort <= 7 ? 'Medium' : 'High';
    const efficacyRange = efficacy <= 4 ? 'Low' : efficacy <= 7 ? 'Medium' : 'High';

    if (effortRange === 'High' && efficacyRange === 'High') {
      return 'High effort and high results. This area is showing up strongly and consistently.';
    } else if (effortRange === 'High' && efficacyRange === 'Medium') {
      return 'High effort with middle-of-the-road results. A lot is being put in, but it is not landing as strongly as it could.';
    } else if (effortRange === 'High' && efficacyRange === 'Low') {
      return 'High effort and low results. There is a clear disconnect between how much is being put in and what people are experiencing.';
    } else if (effortRange === 'Medium' && efficacyRange === 'High') {
      return 'Moderate effort and high results. This appears to be working well without feeling overextended.';
    } else if (effortRange === 'Medium' && efficacyRange === 'Medium') {
      return 'Moderate effort and moderate results. This feels steady, but there is still room to strengthen it.';
    } else if (effortRange === 'Medium' && efficacyRange === 'Low') {
      return 'Moderate effort and low results. Some attention is there, but people are not feeling a strong outcome yet.';
    } else if (effortRange === 'Low' && efficacyRange === 'High') {
      return 'Low effort and high results. This may feel natural right now, but it could be harder to sustain over time.';
    } else if (effortRange === 'Low' && efficacyRange === 'Medium') {
      return 'Low effort and mixed results. This area likely feels inconsistent from one moment to the next.';
    } else {
      return 'Low effort and low results. This is one of the clearest areas needing more attention.';
    }
  };

  const handleSliderChange = (id, value) => {
    const key = `${currentQuestion}`;
    setRatings(prev => {
      const existing = prev[key] || {};
      const merged = { effort: 5, efficacy: 5, ...existing };
      return { ...prev, [key]: { ...merged, [id]: value } };
    });
  };

  const { register: registerStepNav, unregister: unregisterStepNav } = useStepNav();
  const { setSuppress } = useGuide();

  const questions = campaign.reduce((acc, trait) => [...acc, ...trait.statements], []).slice(0, 15);
  const isSelfCampaign = campaignMeta?.campaignType === 'self';
  const leaderName = getLeaderDisplayName(campaignMeta);

  // Register topbar back/forward arrows to navigate questions.
  useEffect(() => {
    if (!useCairnTheme) return;
    const canGoBack = currentQuestion > 0;
    const canGoForward = ratings[`${currentQuestion}`]?.effort != null && ratings[`${currentQuestion}`]?.efficacy != null;
    registerStepNav({
      canGoBack,
      canGoForward,
      goBack: prevQuestion,
      goForward: nextQuestion,
    });
    return () => unregisterStepNav();
  }, [currentQuestion, ratings, registerStepNav, unregisterStepNav]);

  // Suppress guide for team campaigns.
  useEffect(() => {
    if (!useCairnTheme) return;
    if (!isSelfCampaign) setSuppress(true);
    return () => setSuppress(false);
  }, [isSelfCampaign, setSuppress]);
  const traitIndex = Math.floor(currentQuestion / TRAIT_QUESTION_COUNT);
  const currentTrait = campaign[traitIndex]?.trait || '';
  const currentSubTrait = campaign[traitIndex]?.subTrait || campaign[traitIndex]?.title || currentTrait;
  const r = ratings[`${currentQuestion}`];
  const currentRating = (r && typeof r.effort === 'number' && typeof r.efficacy === 'number') ? r : { effort: 5, efficacy: 5 };
  const traitRecap = getTraitRecapMetrics(currentQuestion);
  const sentiment = getSentiment(currentRating.effort, currentRating.efficacy, isSelfCampaign);
  const progressValue = ((currentQuestion + 1) / (questions.length || 15)) * 100;
  const nextCtaLabel = currentQuestion < (questions.length - 1) ? 'Next Question' : 'Complete Survey';
  const EFFICACY_PRIMARY = '#6393AA';
  const EFFICACY_ACCENT = '#457089';
  const EFFORT_PRIMARY = '#E07A3F';
  const EFFORT_ACCENT = '#C85A2A';

  const sliderMarks = Array.from({ length: 11 }, (_, i) => ({ value: i }));
  const sliderSx = (trackColor) => ({
    color: trackColor,
    mx: 0,
    '& .MuiSlider-mark': {
      width: 4,
      height: 4,
      borderRadius: '50%',
      bgcolor: 'rgba(22,35,54,0.35)',
    },
    '& .MuiSlider-markLabel': { display: 'none' },
    '& .MuiSlider-rail': {
      opacity: 1,
      bgcolor: 'transparent',
      background: 'linear-gradient(90deg, #dbe4ee 0%, #ccd8e6 100%)',
      height: 8,
      borderRadius: 10,
    },
    '& .MuiSlider-track': {
      bgcolor: trackColor,
      border: 'none',
      height: 8,
      boxShadow: '0 0 0 1px rgba(63,100,123,0.12)',
    },
    '& .MuiSlider-thumb': {
      width: 20,
      height: 20,
      bgcolor: '#fff',
      border: `2px solid ${trackColor}`,
      boxShadow: '0 4px 10px rgba(20,30,50,0.22)',
      '&:hover, &.Mui-focusVisible': {
        boxShadow: '0 6px 14px rgba(20,30,50,0.30)',
      },
      '&:before': { boxShadow: 'none' },
    },
  });

  const answeredRows = [];
  const currentTraitStart = traitIndex * TRAIT_QUESTION_COUNT;
  for (let idx = currentTraitStart; idx <= currentQuestion; idx += 1) {
    if (idx === currentQuestion) {
      answeredRows.push(currentRating);
      continue;
    }
    const row = ratings[String(idx)];
    if (row != null && row.effort != null && row.efficacy != null) answeredRows.push(row);
  }
  const answeredCount = answeredRows.length;
  const avgEffort = answeredCount
    ? answeredRows.reduce((sum, row) => sum + Number(row.effort || 0), 0) / answeredCount
    : currentRating.effort;
  const avgEfficacy = answeredCount
    ? answeredRows.reduce((sum, row) => sum + Number(row.efficacy || 0), 0) / answeredCount
    : currentRating.efficacy;
  const avgDelta = avgEfficacy - avgEffort;
  const traitRecapSentiment = getSentiment(
    Math.max(0, traitRecap.effortAvg ?? 5),
    Math.max(0, traitRecap.efficacyAvg ?? 5),
    isSelfCampaign,
  );
  const clampToTen = (value) => Math.max(0, Math.min(10, Number(value || 0)));
  const efficacyPct = clampToTen(avgEfficacy) / 10;
  const effortPct = clampToTen(avgEffort) / 10;
  const ringCx = 74;
  const ringCy = 74;
  const ringRadius = 52;
  const polar = (cx, cy, radius, angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + (radius * Math.cos(angleRad)),
      y: cy + (radius * Math.sin(angleRad)),
    };
  };
  const describeArc = (cx, cy, radius, startAngle, endAngle) => {
    const start = polar(cx, cy, radius, startAngle);
    const end = polar(cx, cy, radius, endAngle);
    const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    const sweepFlag = endAngle > startAngle ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  };
  const leftArcBg = describeArc(ringCx, ringCy, ringRadius, 90, 270);
  const rightArcBg = describeArc(ringCx, ringCy, ringRadius, 90, -90);
  const leftArcProgress = describeArc(ringCx, ringCy, ringRadius, 90, 90 + (efficacyPct * 180));
  const rightArcProgress = describeArc(ringCx, ringCy, ringRadius, 90, 90 - (effortPct * 180));
  const recapEfficacyPct = clampToTen(traitRecap.efficacyAvg) / 10;
  const recapEffortPct = clampToTen(traitRecap.effortAvg) / 10;
  const recapLeftArcProgress = describeArc(ringCx, ringCy, ringRadius, 90, 90 + (recapEfficacyPct * 180));
  const recapRightArcProgress = describeArc(ringCx, ringCy, ringRadius, 90, 90 - (recapEffortPct * 180));
  const recapCenterScore = (traitRecap.effortAvg + traitRecap.efficacyAvg) / 2;

  if (currentQuestion >= questions.length) return null;
  if (surveyClosed && !isSelfCampaign) {
    return (
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
          '&:before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            zIndex: -2,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.62)), url(/LEP2.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          },
          '&:after': {
            content: '""',
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'radial-gradient(1200px 800px at 20% 20%, rgba(15,30,58,0.22), rgba(15,30,58,0.40))',
          },
        }}
      >
        <ProcessTopRail />
        <Container maxWidth="md" sx={{ py: { xs: 3.5, md: 5.2 } }}>
          <Paper
            sx={{
              p: { xs: 2.2, md: 2.8 },
              borderRadius: 2.4,
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.94), rgba(241,246,255,0.88))',
              boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#1F3347', mb: 0.9 }}>
              Survey closed
            </Typography>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.secondary', lineHeight: 1.6 }}>
              This campaign has been manually closed by the owner. New responses are no longer being accepted.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ mt: 1.8, textTransform: 'none', fontWeight: 700 }}
            >
              Return Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (useCairnTheme) {
    const ROMAN = ['I', 'II', 'III'];
    const NavSidebar = (
      <Box sx={{ position: 'sticky', top: 96 }}>
        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft, #44566C)', mb: 1.5, px: 0.5 }}>
          Assessment
        </Typography>
        {campaign.slice(0, 3).map((traitObj, idx) => {
          const isActive = traitIndex === idx;
          const traitStart = idx * TRAIT_QUESTION_COUNT;
          const answered = Object.keys(ratings).filter((k) => Number(k) >= traitStart && Number(k) < traitStart + TRAIT_QUESTION_COUNT).length;
          return (
            <Box
              key={traitObj.trait || idx}
              sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.2,
                px: 1.5, py: 1.2, borderRadius: '10px', mb: 0.5,
                bgcolor: isActive ? 'var(--navy-900, #10223C)' : 'transparent',
                transition: '120ms',
              }}
            >
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${isActive ? 'var(--amber-soft, #F4CEA1)' : 'var(--sand-300, #C9B99A)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 800, color: isActive ? 'var(--amber-soft, #F4CEA1)' : 'var(--ink-soft, #44566C)', lineHeight: 1 }}>
                  {ROMAN[idx]}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: isActive ? 'var(--amber-soft, #F4CEA1)' : 'var(--navy-900, #10223C)', lineHeight: 1.2, mb: 0.2 }}>
                  {traitObj.subTrait || traitObj.trait}
                </Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: isActive ? 'rgba(244,206,161,0.7)' : 'var(--ink-soft, #44566C)', lineHeight: 1.2 }}>
                  {answered}/{TRAIT_QUESTION_COUNT} answered
                </Typography>
              </Box>
            </Box>
          );
        })}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid var(--sand-200, #E8DBC3)', px: 1.5 }}>
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: 'var(--ink-soft, #44566C)', lineHeight: 1.4 }}>
            Question {currentQuestion + 1} of {questions.length || 15}
          </Typography>
        </Box>
      </Box>
    );

    return (
      <Box sx={{ position: 'relative', minHeight: '100vh', width: '100%', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail />
        <CompassLayout progress={71} sidebar={NavSidebar}>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange-600, #E07A3F)', mb: 0.8 }}>
              {currentTrait}{currentSubTrait !== currentTrait ? ` — ${currentSubTrait}` : ''} &nbsp;·&nbsp; Q{(currentQuestion % TRAIT_QUESTION_COUNT) + 1} of {TRAIT_QUESTION_COUNT}
            </Typography>
          </Box>

          <Typography sx={{ fontFamily: '"Manrope", sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: { xs: '1.5rem', md: '1.75rem' }, lineHeight: 1.25, color: 'var(--ink, #0f1c2e)', textAlign: 'center', mb: 3 }}>
            {questions[currentQuestion]}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mb: 2, maxWidth: '60%', mx: 'auto', width: '100%' }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid rgba(224,122,63,0.28)', p: 2.5, boxShadow: '0 2px 8px rgba(16,34,60,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--navy-900, #10223C)' }}>Effort</Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--ink-soft, #44566C)', mb: 1.5, lineHeight: 1.4 }}>
                {isSelfCampaign ? 'How intentional and attentive I am in this area' : `How intentional and attentive ${leaderName} is in this area`}
              </Typography>
              <Box sx={{ px: 0.5, position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 16, bgcolor: 'rgba(22,35,54,0.2)', borderRadius: 10, zIndex: 1, pointerEvents: 'none' }} />
                <Slider value={currentRating.effort} onChange={(e, value) => handleSliderChange('effort', value)} min={0} max={10} step={1} marks={sliderMarks} valueLabelDisplay="off" sx={sliderSx(EFFORT_PRIMARY)} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'var(--ink-soft, #44566C)' }}>Low</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', fontWeight: 800, color: '#E07A3F' }}>{currentRating.effort}</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'var(--ink-soft, #44566C)' }}>High</Typography>
              </Box>
            </Box>

            <Box sx={{ bgcolor: '#fff', borderRadius: '14px', border: '1px solid rgba(99,147,170,0.28)', p: 2.5, boxShadow: '0 2px 8px rgba(16,34,60,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--navy-900, #10223C)' }}>Efficacy</Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--ink-soft, #44566C)', mb: 1.5, lineHeight: 1.4 }}>
                {isSelfCampaign ? 'How effectively I meet the demands of this area' : `How effectively ${leaderName} meets the needs of this area`}
              </Typography>
              <Box sx={{ px: 0.5, position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 16, bgcolor: 'rgba(22,35,54,0.2)', borderRadius: 10, zIndex: 1, pointerEvents: 'none' }} />
                <Slider value={currentRating.efficacy} onChange={(e, value) => handleSliderChange('efficacy', value)} min={0} max={10} step={1} marks={sliderMarks} valueLabelDisplay="off" sx={sliderSx(EFFICACY_PRIMARY)} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'var(--ink-soft, #44566C)' }}>Low</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.92rem', fontWeight: 800, color: '#6393AA' }}>{currentRating.efficacy}</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'var(--ink-soft, #44566C)' }}>High</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ bgcolor: 'rgba(244,206,161,0.18)', border: '1px solid rgba(224,122,63,0.22)', borderRadius: '12px', p: 2, mb: 3 }}>
            <Typography sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--navy-900, #10223C)', lineHeight: 1.5, textAlign: 'center' }}>
              {sentiment}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px', borderColor: 'var(--sand-300, #C9B99A)', color: 'var(--navy-900, #10223C)', textTransform: 'none', py: 1.2, '&:hover': { borderColor: 'var(--navy-500, #3F647B)', bgcolor: 'rgba(16,34,60,0.04)' }, '&.Mui-disabled': { opacity: 0.35 } }}
            >
              ← Previous
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: 'var(--ink-soft, #44566C)', mb: 0.6 }}>
                {currentQuestion + 1} / {questions.length || 15}
              </Typography>
              <LinearProgress variant="determinate" value={progressValue} sx={{ height: 6, borderRadius: 10, bgcolor: 'var(--sand-200, #E8DBC3)', '& .MuiLinearProgress-bar': { bgcolor: 'var(--orange-600, #E07A3F)' } }} />
            </Box>
            <Button
              variant="contained"
              onClick={nextQuestion}
              disabled={ratings[`${currentQuestion}`]?.effort == null || ratings[`${currentQuestion}`]?.efficacy == null}
              sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px', bgcolor: 'var(--navy-900, #10223C)', color: 'var(--amber-soft, #F4CEA1)', textTransform: 'none', boxShadow: 'none', py: 1.2, '&:hover': { bgcolor: 'var(--navy-700, #1C3558)', boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: 'rgba(16,34,60,0.18)', color: 'rgba(244,206,161,0.4)' } }}
            >
              {nextCtaLabel} →
            </Button>
          </Box>
        </CompassLayout>

        <Dialog open={traitRecapOpen} onClose={handleMakeAdjustments} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy-900, #10223C)', textAlign: 'center' }}>
            {currentSubTrait} Checkpoint
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <Box sx={{ bgcolor: 'rgba(224,122,63,0.08)', border: '1px solid rgba(224,122,63,0.25)', borderRadius: '10px', p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E07A3F', mb: 0.5 }}>Effort</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--navy-900, #10223C)', lineHeight: 1 }}>{traitRecap.effortAvg.toFixed(1)}</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'var(--ink-soft, #44566C)', mt: 0.3 }}>out of 10</Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(99,147,170,0.08)', border: '1px solid rgba(99,147,170,0.25)', borderRadius: '10px', p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6393AA', mb: 0.5 }}>Efficacy</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--navy-900, #10223C)', lineHeight: 1 }}>{traitRecap.efficacyAvg.toFixed(1)}</Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'var(--ink-soft, #44566C)', mt: 0.3 }}>out of 10</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--navy-900, #10223C)', lineHeight: 1.55, textAlign: 'center' }}>
              {traitRecapSentiment}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2.5, gap: 1 }}>
            <Button variant="outlined" onClick={handleMakeAdjustments} sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'none', borderColor: 'var(--sand-300, #C9B99A)', color: 'var(--navy-900, #10223C)', borderRadius: '10px' }}>
              Make Adjustments
            </Button>
            <Button variant="contained" onClick={handleProceedNextTrait} sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'none', bgcolor: 'var(--navy-900, #10223C)', color: 'var(--amber-soft, #F4CEA1)', borderRadius: '10px', boxShadow: 'none', '&:hover': { bgcolor: 'var(--navy-700, #1C3558)', boxShadow: 'none' } }}>
              {currentQuestion < (questions.length - 1) ? 'Proceed to Next Trait' : 'Complete Survey'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        ...(useCairnTheme
          ? { bgcolor: 'var(--sand-50, #FBF7F0)' }
          : {
              '&:before': {
                content: '""',
                position: 'fixed',
                inset: 0,
                zIndex: -2,
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.62)), url(/LEP2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
              },
              '&:after': {
                content: '""',
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: 'radial-gradient(1200px 800px at 20% 20%, rgba(15,30,58,0.22), rgba(15,30,58,0.40))',
              },
            }),
      }}
    >
      <ProcessTopRail />
      <CompassLayout progress={71}>
      <Container
        maxWidth={useCairnTheme ? false : 'lg'}
        sx={{
          py: { xs: 2, md: 3.2 },
          px: useCairnTheme ? 0 : { xs: 2, md: 4 },
        }}
      >
        {currentQuestion === 0 && savedActionItems.length > 0 ? (
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.35)',
              bgcolor: 'rgba(255,255,255,0.9)',
              textAlign: 'left',
            }}
          >
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'text.primary', mb: 0.7 }}>
              Your Current Action Plan
            </Typography>
            <Stack spacing={0.5}>
              {savedActionItems.slice(0, 6).map((text, idx) => (
                <Typography key={`saved-action-${idx}`} sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.92rem', color: 'text.secondary' }}>
                  - {text}
                </Typography>
              ))}
            </Stack>
          </Box>
        ) : null}

        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(255,255,255,0.50)',
            bgcolor: 'rgba(15, 30, 58, 0.54)',
            boxShadow: '0 18px 36px rgba(18, 31, 56, 0.22)',
            backdropFilter: 'blur(1px)',
            width: '100%',
            maxWidth: 1120,
            mx: 'auto',
            minHeight: { xs: 420, md: 440 },
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 1.3, md: 1.8 },
            gap: 1.5,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: { xs: 1.2, md: 1.5 },
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.22)',
              bgcolor: 'rgba(13, 26, 48, 0.62)',
              minHeight: { xs: 77, md: 85 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '1.02rem', md: '1.1rem' },
                fontStyle: 'normal',
                fontWeight: 600,
                color: 'rgba(247, 250, 255, 0.95)',
                lineHeight: 1.35,
                minHeight: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 1.2, md: 2 },
                maxWidth: 980,
              }}
            >
              {questions[currentQuestion]}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
              gap: { xs: 1.2, md: 1.4 },
              alignItems: 'stretch',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: { xs: 1.2, md: 1.35 },
                minWidth: 0,
                bgcolor: 'rgba(255, 255, 255, 0.92)',
                borderRadius: 2.5,
                border: '1px solid rgba(15,30,58,0.08)',
                minHeight: { xs: 302, md: 304 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              <Stack spacing={1.3} alignItems="center" sx={{ flexGrow: 1, width: '100%', minWidth: 0, px: { xs: 0.8, md: 1.2 } }}>
                <Box
                  sx={{
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0,
                    minHeight: 116,
                    borderRadius: 2,
                    border: `1px solid rgba(224,122,63,0.28)`,
                    bgcolor: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                    px: { xs: 1.4, md: 1.7 },
                    py: { xs: 0.95, md: 1.05 },
                    overflow: 'hidden',
                  }}
                >
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.25rem', md: '1.32rem' }, fontWeight: 700, color: '#162336', mb: 0.15, textAlign: 'center' }}>
                    Effort
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', fontStyle: 'italic', color: 'rgba(22,35,54,0.84)', mb: 0.5, textAlign: 'center' }}>
                    {isSelfCampaign
                      ? 'How intentional and attentive I am in this area'
                      : `How intentional and attentive ${leaderName} is in this area`}
                  </Typography>
                  <Box sx={{ px: { xs: 1.6, md: 2.2 }, position: 'relative', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 2,
                        height: 18,
                        bgcolor: 'rgba(22,35,54,0.24)',
                        borderRadius: 10,
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                    />
                    <Slider
                      value={currentRating.effort}
                      onChange={(e, value) => handleSliderChange('effort', value)}
                      min={0}
                      max={10}
                      step={1}
                      marks={sliderMarks}
                      valueLabelDisplay="off"
                      sx={sliderSx(EFFORT_PRIMARY)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2.8, md: 3.5 }, mt: 0.15 }}>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>Low</Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>High</Typography>
                  </Box>
                </Box>

              <Box
                sx={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  minHeight: 116,
                  borderRadius: 2,
                    border: `1px solid rgba(99,147,170,0.28)`,
                  bgcolor: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                    px: { xs: 1.4, md: 1.7 },
                    py: { xs: 0.95, md: 1.05 },
                    overflow: 'hidden',
                }}
              >
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.25rem', md: '1.32rem' }, fontWeight: 700, color: '#162336', mb: 0.15, textAlign: 'center' }}>
                    Efficacy
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', fontStyle: 'italic', color: 'rgba(22,35,54,0.84)', mb: 0.5, textAlign: 'center' }}>
                    {isSelfCampaign
                      ? 'How effectively I meet the demands of this area'
                      : `How effectively ${leaderName} meets the needs of this area`}
                  </Typography>
                  <Box sx={{ px: { xs: 1.6, md: 2.2 }, position: 'relative', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 2,
                      height: 18,
                      bgcolor: 'rgba(22,35,54,0.24)',
                      borderRadius: 10,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  />
                    <Slider
                      value={currentRating.efficacy}
                      onChange={(e, value) => handleSliderChange('efficacy', value)}
                      min={0}
                      max={10}
                      step={1}
                      marks={sliderMarks}
                      valueLabelDisplay="off"
                      sx={sliderSx(EFFICACY_PRIMARY)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2.8, md: 3.5 }, mt: 0.15 }}>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>Low</Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>High</Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0,
                    minHeight: 56,
                    bgcolor: 'rgba(224,122,63,0.12)',
                    border: '1px solid',
                    borderColor: 'rgba(224,122,63,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.8,
                    px: 1.6,
                    overflow: 'hidden',
                  }}
                >
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: '#162336', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.35 }}>
                    {sentiment}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                p: { xs: 1.2, md: 1.35 },
                bgcolor: 'rgba(255, 255, 255, 0.92)',
                borderRadius: 2.5,
                border: '1px solid rgba(15,30,58,0.08)',
                minHeight: { xs: 302, md: 304 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
                <Stack direction="row" spacing={0.6} justifyContent="center" alignItems="center" sx={{ mb: 0.1 }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#162336', textAlign: 'center' }}>
                    {currentSubTrait} Results
                  </Typography>
                  <Tooltip
                    title="Preview of what your leader will see in aggregate once all feedback is combined."
                    arrow
                  >
                    <InfoOutlinedIcon sx={{ fontSize: '1rem', color: 'rgba(22,35,54,0.65)', cursor: 'help' }} />
                  </Tooltip>
                </Stack>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary', fontWeight: 400, textAlign: 'center', mb: 0.55 }}>
                  ({(currentQuestion % TRAIT_QUESTION_COUNT) + 1} out of {TRAIT_QUESTION_COUNT})
                </Typography>
                <Box
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(15,30,58,0.10)',
                    bgcolor: 'rgba(255,255,255,0.95)',
                    p: 1,
                    mb: 0.8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      minHeight: 206,
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      gridTemplateRows: '1fr auto',
                      alignItems: 'center',
                      columnGap: 0.5,
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ gridColumn: 1, gridRow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', placeSelf: 'center', pt: 1 }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: EFFICACY_PRIMARY, fontWeight: 700, textAlign: 'center' }}>
                        Efficacy
                      </Typography>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', color: '#162336', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {avgEfficacy.toFixed(1)}
                      </Typography>
                    </Box>

                    <Box sx={{ gridColumn: 2, gridRow: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="228" height="228" viewBox="0 0 148 148" role="img" aria-label="Live effort and efficacy ring">
                      <path d={leftArcBg} fill="none" stroke="rgba(99,147,170,0.24)" strokeWidth="11" strokeLinecap="butt" />
                      <path d={rightArcBg} fill="none" stroke="rgba(224,122,63,0.24)" strokeWidth="11" strokeLinecap="butt" />
                      <path d={leftArcProgress} fill="none" stroke={EFFICACY_PRIMARY} strokeWidth="11" strokeLinecap="butt" />
                      <path d={rightArcProgress} fill="none" stroke={EFFORT_PRIMARY} strokeWidth="11" strokeLinecap="butt" />
                      <circle cx={ringCx} cy={ringCy} r="35" fill="rgba(255,255,255,0.98)" stroke="rgba(15,30,58,0.12)" strokeWidth="1.5" />
                      <text x={ringCx} y={ringCy + 8} textAnchor="middle" style={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '21px', fill: '#162336', fontWeight: 700 }}>
                        {((avgEffort + avgEfficacy) / 2).toFixed(1)}
                      </text>
                    </svg>
                    </Box>

                    <Box sx={{ gridColumn: 3, gridRow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', placeSelf: 'center', pt: 1 }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: EFFORT_PRIMARY, fontWeight: 700, textAlign: 'center' }}>
                        Effort
                      </Typography>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', color: '#162336', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {avgEffort.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(15,30,58,0.14)',
                    bgcolor: 'rgba(255,255,255,0.95)',
                    p: 1,
                  }}
                >
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.84rem', color: 'text.secondary', textAlign: 'center' }}>
                    Response Balance (Efficacy - Effort)
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1.18rem',
                      fontWeight: 700,
                      color: avgDelta >= 0 ? EFFICACY_ACCENT : EFFORT_ACCENT,
                      textAlign: 'center',
                      mt: 0.15,
                    }}
                  >
                    {avgDelta >= 0 ? '+' : ''}{avgDelta.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
          </Box>
        </Box>
        <Box
          sx={{
            mt: 1.1,
            width: '100%',
            maxWidth: 1120,
            mx: 'auto',
            borderRadius: 10,
            border: '1px solid rgba(15,30,58,0.12)',
            bgcolor: 'rgba(255,255,255,0.84)',
            px: { xs: 1.2, md: 1.6 },
            py: { xs: 0.85, md: 0.95 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '210px 1fr 210px' },
            gap: { xs: 1, md: 1.2 },
            alignItems: 'center',
            minHeight: 56,
          }}
        >
          <Button
            variant="outlined"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '0.96rem',
              px: 2.2,
              py: 0.72,
              minWidth: 198,
              minHeight: 40,
              borderRadius: 10,
              borderColor: 'rgba(69,112,137,0.58)',
              color: '#375d78',
              justifySelf: { xs: 'center', md: 'start' },
              '&:hover': { borderColor: '#375d78', backgroundColor: 'rgba(69,112,137,0.08)' },
            }}
          >
            Previous Question
          </Button>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                color: 'rgba(22,35,54,0.82)',
                textAlign: 'center',
                mb: 0.45,
              }}
            >
              {currentQuestion + 1} / {questions.length || 15}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 8,
                borderRadius: 10,
                bgcolor: 'rgba(15,30,58,0.14)',
                '& .MuiLinearProgress-bar': { bgcolor: '#3F647B' },
              }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={nextQuestion}
            disabled={ratings[`${currentQuestion}`]?.effort == null || ratings[`${currentQuestion}`]?.efficacy == null}
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1rem',
              px: 2.6,
              py: 1.05,
              minWidth: 198,
              minHeight: 44,
              borderRadius: 10,
              bgcolor: '#457089',
              boxShadow: 'none',
              justifySelf: { xs: 'center', md: 'end' },
              '&:hover': { bgcolor: '#375d78', boxShadow: 'none' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(69,112,137,0.30)',
                color: 'rgba(255,255,255,0.84)',
              },
            }}
          >
            {nextCtaLabel}
          </Button>
        </Box>

        <Dialog
          open={traitRecapOpen}
          onClose={handleMakeAdjustments}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 700, textAlign: 'center' }}>
            {currentSubTrait} Recap
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={1.3} alignItems="center">
              <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', columnGap: 0.8 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.8rem', color: EFFICACY_PRIMARY, fontWeight: 700 }}>
                    Efficacy
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.98rem', color: '#162336', fontWeight: 700 }}>
                    {traitRecap.efficacyAvg.toFixed(1)}
                  </Typography>
                </Box>

                <svg width="184" height="184" viewBox="0 0 148 148" role="img" aria-label="Trait recap ring">
                  <path d={leftArcBg} fill="none" stroke="rgba(99,147,170,0.24)" strokeWidth="11" strokeLinecap="butt" />
                  <path d={rightArcBg} fill="none" stroke="rgba(224,122,63,0.24)" strokeWidth="11" strokeLinecap="butt" />
                  <path d={recapLeftArcProgress} fill="none" stroke={EFFICACY_PRIMARY} strokeWidth="11" strokeLinecap="butt" />
                  <path d={recapRightArcProgress} fill="none" stroke={EFFORT_PRIMARY} strokeWidth="11" strokeLinecap="butt" />
                  <circle cx={ringCx} cy={ringCy} r="35" fill="rgba(255,255,255,0.98)" stroke="rgba(15,30,58,0.12)" strokeWidth="1.5" />
                  <text x={ringCx} y={ringCy + 5} textAnchor="middle" style={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '21px', fill: '#162336', fontWeight: 700 }}>
                    {recapCenterScore.toFixed(1)}
                  </text>
                </svg>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.8rem', color: EFFORT_PRIMARY, fontWeight: 700 }}>
                    Effort
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.98rem', color: '#162336', fontWeight: 700 }}>
                    {traitRecap.effortAvg.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.96rem', color: 'text.secondary', textAlign: 'center', lineHeight: 1.35 }}>
                {traitRecapSentiment}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
            <Button variant="outlined" onClick={handleMakeAdjustments}>
              Make Adjustments
            </Button>
            <Button variant="contained" onClick={handleProceedNextTrait}>
              {currentQuestion < (questions.length - 1) ? 'Proceed to Next Trait' : 'Complete Survey'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      </CompassLayout>
    </Box>
  );
}

export default CampaignSurvey;