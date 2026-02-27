import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Stack, Slider, LinearProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import ProcessTopRail from '../components/ProcessTopRail';

function CampaignSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [ratings, setRatings] = useState({});
  const [savedActionItems, setSavedActionItems] = useState([]);
  const [campaignMeta, setCampaignMeta] = useState({});

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
    console.log('Survey responses saved to Firestore:', ratingsData);
  };

  const nextQuestion = async () => {
    const lastQuestionIdx = questions.length - 1;
    if (currentQuestion < lastQuestionIdx) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      await saveResponses();
      navigate(`/campaign/${id}/complete`);
    }
  };

  const getSentiment = (effort, efficacy, selfMode = false) => {
    const subject = selfMode ? 'I' : 'Brian';
    const possessive = selfMode ? 'My' : 'Brian’s';
    const effortRange = effort <= 4 ? 'Low' : effort <= 7 ? 'Medium' : 'High';
    const efficacyRange = efficacy <= 4 ? 'Low' : efficacy <= 7 ? 'Medium' : 'High';

    if (effortRange === 'High' && efficacyRange === 'High') {
      return `${subject} consistently excel${selfMode ? '' : 's'} with strong effort, meeting ${selfMode ? 'the demands of this area' : 'your needs exceptionally well'}.`;
    } else if (effortRange === 'High' && efficacyRange === 'Medium') {
      return `${subject} put${selfMode ? '' : 's'} in strong effort, but the results could be more consistent to fully ${selfMode ? 'meet the demands of this area' : 'meet your needs'}.`;
    } else if (effortRange === 'High' && efficacyRange === 'Low') {
      return `${subject} tr${selfMode ? 'y' : 'ies'} hard, but the outcomes often fall short of ${selfMode ? 'the demands of this area' : 'your expectations'}.`;
    } else if (effortRange === 'Medium' && efficacyRange === 'High') {
      return `${subject} achieve${selfMode ? '' : 's'} great results with moderate effort, showing efficiency in ${selfMode ? 'this area' : 'meeting your needs'}.`;
    } else if (effortRange === 'Medium' && efficacyRange === 'Medium') {
      return `${subject}${selfMode ? "'m" : '’s'} effort and results are steady, but there’s room to elevate both.`;
    } else if (effortRange === 'Medium' && efficacyRange === 'Low') {
      return `${possessive} moderate effort isn’t yielding ${selfMode ? 'the needed results in this area' : 'the results you need'}, leaving room for improvement.`;
    } else if (effortRange === 'Low' && efficacyRange === 'High') {
      return `${subject} deliver${selfMode ? '' : 's'} strong results with minimal effort, but more intention could make a bigger impact.`;
    } else if (effortRange === 'Low' && efficacyRange === 'Medium') {
      return `${possessive} results are okay, but lack of effort leaves ${selfMode ? 'room for more consistency' : 'you wanting more consistency'}.`;
    } else {
      return `${possessive} minimal effort and poor results are disappointing, needing significant improvement.`;
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
  const currentTrait = campaign[Math.floor(currentQuestion / 3)]?.trait || '';
  const currentRating = ratings[`${currentQuestion}`] || { effort: 1, efficacy: 1 };
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
  for (let idx = 0; idx <= currentQuestion; idx += 1) {
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
          }}
        >
          <Box
            sx={{
              p: { xs: 1.7, md: 2.1 },
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.22)',
              bgcolor: 'rgba(13, 26, 48, 0.62)',
              minHeight: { xs: 96, md: 104 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.45rem', md: '1.65rem' }, fontWeight: 700, mb: 0.45, color: '#FFFFFF', letterSpacing: '0.01em' }}>
              {currentTrait}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '1.02rem', md: '1.1rem' },
                fontStyle: 'italic',
                color: 'rgba(247, 250, 255, 0.95)',
                lineHeight: 1.35,
                minHeight: 34,
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
              }}
            >
              <Stack spacing={1.3} alignItems="stretch" sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    width: '100%',
                    minHeight: 116,
                    borderRadius: 2,
                    border: `1px solid rgba(224,122,63,0.28)`,
                    bgcolor: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                    px: { xs: 1.2, md: 1.5 },
                    py: { xs: 1.1, md: 1.2 },
                  }}
                >
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.25rem', md: '1.32rem' }, fontWeight: 700, color: '#162336', mb: 0.2, textAlign: 'center' }}>
                    Effort
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', fontStyle: 'italic', color: 'rgba(22,35,54,0.84)', mb: 0.7, textAlign: 'center' }}>
                    {isSelfCampaign
                      ? 'How intentional and attentive I am in this area'
                      : 'How intentional and attentive Brian behaves in this area'}
                  </Typography>
                  <Box sx={{ px: { xs: 1.1, md: 1.4 }, position: 'relative' }}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2.2, md: 2.7 }, mt: 0.15 }}>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>Low</Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>High</Typography>
                  </Box>
                </Box>

              <Box
                sx={{
                  width: '100%',
                  minHeight: 116,
                  borderRadius: 2,
                    border: `1px solid rgba(99,147,170,0.28)`,
                  bgcolor: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                    px: { xs: 1.2, md: 1.5 },
                    py: { xs: 1.1, md: 1.2 },
                }}
              >
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.25rem', md: '1.32rem' }, fontWeight: 700, color: '#162336', mb: 0.2, textAlign: 'center' }}>
                    Efficacy
                  </Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', fontStyle: 'italic', color: 'rgba(22,35,54,0.84)', mb: 0.7, textAlign: 'center' }}>
                    {isSelfCampaign
                      ? 'How effectively I meet the demands of this area'
                      : 'Is Brian meeting my needs in this area'}
                  </Typography>
                  <Box sx={{ px: { xs: 1.1, md: 1.4 }, position: 'relative' }}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2.2, md: 2.7 }, mt: 0.15 }}>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>Low</Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.93rem', color: 'rgba(22,35,54,0.75)' }}>High</Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '100%',
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
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#162336', textAlign: 'center', mb: 0.6 }}>
                  Live Snapshot
                </Typography>
                <Stack direction="row" spacing={1.1} justifyContent="center" sx={{ mb: 0.8 }}>
                  {[
                    { label: 'Efficacy', value: avgEfficacy, ring: EFFICACY_PRIMARY, fill: EFFICACY_ACCENT },
                    { label: 'Effort', value: avgEffort, ring: EFFORT_PRIMARY, fill: EFFORT_ACCENT },
                  ].map((item) => {
                    const pct = Math.max(0, Math.min(100, (item.value / 10) * 100));
                    return (
                      <Box
                        key={item.label}
                        sx={{
                          width: 126,
                          borderRadius: 2,
                          border: '1px solid rgba(15,30,58,0.10)',
                          bgcolor: 'rgba(255,255,255,0.95)',
                          p: 1,
                        }}
                      >
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.84rem', color: 'text.secondary', textAlign: 'center', mb: 0.35 }}>
                          {item.label}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.35 }}>
                          <Box
                            sx={{
                              width: 62,
                              height: 62,
                              borderRadius: '50%',
                              background: `conic-gradient(${item.fill} ${pct}%, rgba(220,228,236,0.92) ${pct}% 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: 'rgba(255,255,255,0.98)',
                                border: `2px solid ${item.ring}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#162336',
                              }}
                            >
                              {item.value.toFixed(1)}
                            </Box>
                          </Box>
                        </Box>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.78rem', color: 'text.secondary', textAlign: 'center' }}>
                          / 10 scale
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
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
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.78rem', color: 'text.secondary', textAlign: 'center' }}>
                    Based on {answeredCount} response{answeredCount === 1 ? '' : 's'} so far
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
            gridTemplateColumns: { xs: '1fr', md: '120px 1fr 210px' },
            gap: { xs: 1, md: 1.2 },
            alignItems: 'center',
            minHeight: 56,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1rem',
              color: 'rgba(22,35,54,0.82)',
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            {currentQuestion + 1} / {questions.length || 15}
          </Typography>
          <Box sx={{ minWidth: 0 }}>
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
      </Container>
    </Box>
  );
}

export default CampaignSurvey;