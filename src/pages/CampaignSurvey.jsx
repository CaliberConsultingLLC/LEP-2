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
import { collection, addDoc } from 'firebase/firestore';
import ProcessTopRail from '../components/ProcessTopRail';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

function CampaignSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [ratings, setRatings] = useState({});
  const [savedActionItems, setSavedActionItems] = useState([]);
  const [campaignMeta, setCampaignMeta] = useState({});
  const [traitRecapOpen, setTraitRecapOpen] = useState(false);

  const TRAIT_QUESTION_COUNT = 5;

  useEffect(() => {
    const campaignData = JSON.parse(localStorage.getItem(`campaign_${id}`) || '{}');
    if (campaignData?.campaign) {
      setCampaign(campaignData.campaign);
      setCampaignMeta(campaignData);
    } else {
      navigate('/');
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const userKey = userInfo?.email || userInfo?.name || 'anonymous';
      const byCampaign = JSON.parse(localStorage.getItem('actionPlansByCampaign') || '{}');
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
    const campaignType = campaignMeta?.campaignType || 'team';
    const ratingsData = {
      id,
      campaignId: id,
      campaignType,
      ownerId: campaignMeta?.ownerId || null,
      bundleId: campaignMeta?.bundleId || null,
      submittedAt: new Date(),
      ratings,
    };
    await addDoc(collection(db, 'surveyResponses'), ratingsData);
    localStorage.setItem(`latestSurveyRatings_${id}`, JSON.stringify(ratings));
    console.log('Survey responses saved to Firestore:', ratingsData);
  };

  const getTraitRecapMetrics = (questionIdx) => {
    const traitIndex = Math.floor(questionIdx / TRAIT_QUESTION_COUNT);
    const start = traitIndex * TRAIT_QUESTION_COUNT;
    const values = [];
    for (let i = start; i < start + TRAIT_QUESTION_COUNT; i += 1) {
      const row = i === currentQuestion ? currentRating : ratings[String(i)];
      if (row?.effort && row?.efficacy) {
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
      await saveResponses();
      navigate(`/campaign/${id}/complete`);
    }
  };

  const handleProceedNextTrait = async () => {
    setTraitRecapOpen(false);
    const lastQuestionIdx = questions.length - 1;
    if (currentQuestion < lastQuestionIdx) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }
    await saveResponses();
    navigate(`/campaign/${id}/complete`);
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
      return 'Execution is consistently strong, with effort and outcomes aligned at a high level.';
    } else if (effortRange === 'High' && efficacyRange === 'Medium') {
      return 'Effort is high, but outcomes need more consistency to fully match the demands of this area.';
    } else if (effortRange === 'High' && efficacyRange === 'Low') {
      return 'Effort is strong, but outcomes are still falling short and indicate a capability gap in this area.';
    } else if (effortRange === 'Medium' && efficacyRange === 'High') {
      return 'Outcomes are strong with moderate effort, indicating efficient execution in this area.';
    } else if (effortRange === 'Medium' && efficacyRange === 'Medium') {
      return 'Effort and outcomes are steady, with clear room to elevate both.';
    } else if (effortRange === 'Medium' && efficacyRange === 'Low') {
      return 'Moderate effort is not producing the needed outcomes, suggesting this area needs stronger follow-through.';
    } else if (effortRange === 'Low' && efficacyRange === 'High') {
      return 'Outcomes are currently strong despite low effort, but this level may be hard to sustain over time.';
    } else if (effortRange === 'Low' && efficacyRange === 'Medium') {
      return 'Outcomes are mixed and effort is low, leaving avoidable inconsistency in this area.';
    } else {
      return 'Both effort and outcomes are low here, signaling a high-priority development area.';
    }
  };

  const handleSliderChange = (id, value) => {
    const key = `${currentQuestion}`;
    setRatings(prev => ({
      ...prev,
      [key]: { ...prev[key], [id]: value }
    }));
  };

  const questions = campaign.reduce((acc, trait) => [...acc, ...trait.statements], []).slice(0, 15);
  const isSelfCampaign = campaignMeta?.campaignType === 'self';
  const traitIndex = Math.floor(currentQuestion / TRAIT_QUESTION_COUNT);
  const currentTrait = campaign[traitIndex]?.trait || '';
  const currentRating = ratings[`${currentQuestion}`] || { effort: 1, efficacy: 1 };
  const traitRecap = getTraitRecapMetrics(currentQuestion);
  const sentiment = getSentiment(currentRating.effort, currentRating.efficacy, isSelfCampaign);
  const progressValue = ((currentQuestion + 1) / (questions.length || 15)) * 100;
  const nextCtaLabel = currentQuestion < (questions.length - 1) ? 'Next Question' : 'Complete Survey';
  const EFFICACY_PRIMARY = '#6393AA';
  const EFFICACY_ACCENT = '#457089';
  const EFFORT_PRIMARY = '#E07A3F';
  const EFFORT_ACCENT = '#C85A2A';

  const sliderSx = (trackColor) => ({
    color: trackColor,
    mx: 0,
    '& .MuiSlider-rail': {
      opacity: 1,
      bgcolor: 'transparent',
      background: 'linear-gradient(90deg, #dbe4ee 0%, #ccd8e6 100%)',
      height: 8,
      borderRadius: 999,
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
    if (row?.effort && row?.efficacy) answeredRows.push(row);
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
    Math.max(1, traitRecap.effortAvg || 1),
    Math.max(1, traitRecap.efficacyAvg || 1),
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

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        // full bleed bg
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
        // dark overlay
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
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, md: 3.2 },
          px: { xs: 2, md: 4 },
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
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.32rem', md: '1.48rem' }, fontWeight: 700, mb: 0.35, color: '#FFFFFF', letterSpacing: '0.01em' }}>
              {currentTrait}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '0.92rem', md: '1rem' },
                fontStyle: 'italic',
                color: 'rgba(247, 250, 255, 0.95)',
                lineHeight: 1.35,
                minHeight: 30,
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
              gridTemplateColumns: { xs: '1fr', md: '1.95fr 1fr' },
              gap: { xs: 1.2, md: 1.4 },
              alignItems: 'stretch',
            }}
          >
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
              <Stack spacing={1.3} alignItems="stretch" sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 715,
                    mx: 'auto',
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
                      : 'How intentional and attentive Brian behaves in this area'}
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
                        borderRadius: 999,
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                    />
                    <Slider
                      value={currentRating.effort}
                      onChange={(e, value) => handleSliderChange('effort', value)}
                      min={1}
                      max={10}
                      step={1}
                      marks={false}
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
                  maxWidth: 715,
                  mx: 'auto',
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
                      : 'Is Brian meeting my needs in this area'}
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
                      borderRadius: 999,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  />
                    <Slider
                      value={currentRating.efficacy}
                      onChange={(e, value) => handleSliderChange('efficacy', value)}
                      min={1}
                      max={10}
                      step={1}
                      marks={false}
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
                    maxWidth: 715,
                    mx: 'auto',
                    minHeight: 56,
                    bgcolor: 'rgba(255,255,255,0.84)',
                    border: '1px solid',
                    borderColor: 'rgba(76,111,132,0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.8,
                    px: 1.6,
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
                    {currentTrait} Results
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
                      alignItems: 'center',
                      columnGap: 0.5,
                    }}
                  >
                    <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.8rem', color: EFFICACY_PRIMARY, fontWeight: 700 }}>
                        Efficacy
                      </Typography>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: '#162336', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {avgEfficacy.toFixed(1)}
                      </Typography>
                    </Box>

                    <svg width="228" height="228" viewBox="0 0 148 148" role="img" aria-label="Live effort and efficacy ring">
                      <path d={leftArcBg} fill="none" stroke="rgba(99,147,170,0.24)" strokeWidth="11" strokeLinecap="butt" />
                      <path d={rightArcBg} fill="none" stroke="rgba(224,122,63,0.24)" strokeWidth="11" strokeLinecap="butt" />
                      <path d={leftArcProgress} fill="none" stroke={EFFICACY_PRIMARY} strokeWidth="11" strokeLinecap="butt" />
                      <path d={rightArcProgress} fill="none" stroke={EFFORT_PRIMARY} strokeWidth="11" strokeLinecap="butt" />
                      <circle cx={ringCx} cy={ringCy} r="35" fill="rgba(255,255,255,0.98)" stroke="rgba(15,30,58,0.12)" strokeWidth="1.5" />
                      <text x={ringCx} y={ringCy + 4} textAnchor="middle" style={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '21px', fill: '#162336', fontWeight: 700 }}>
                        {((avgEffort + avgEfficacy) / 2).toFixed(1)}
                      </text>
                    </svg>

                    <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.8rem', color: EFFORT_PRIMARY, fontWeight: 700 }}>
                        Effort
                      </Typography>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: '#162336', fontWeight: 700, whiteSpace: 'nowrap' }}>
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
            borderRadius: 999,
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
              borderRadius: 999,
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
                borderRadius: 999,
                bgcolor: 'rgba(15,30,58,0.14)',
                '& .MuiLinearProgress-bar': { bgcolor: '#3F647B' },
              }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={nextQuestion}
            disabled={!ratings[`${currentQuestion}`]?.effort || !ratings[`${currentQuestion}`]?.efficacy}
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1rem',
              px: 2.6,
              py: 1.05,
              minWidth: 198,
              minHeight: 44,
              borderRadius: 999,
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
            {currentTrait} Recap
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
    </Box>
  );
}

export default CampaignSurvey;