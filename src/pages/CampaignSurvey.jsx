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

  const CustomThumb = (props) => {
    const { children, ...other } = props;
    return (
      <Box
        {...other}
        sx={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '2px solid #3F647B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'transparent',
          fontSize: 0,
          cursor: 'pointer',
        }}
      >
        {children}
      </Box>
    );
  };

  const questions = campaign.reduce((acc, trait) => [...acc, ...trait.statements], []).slice(0, 15);
  const isSelfCampaign = campaignMeta?.campaignType === 'self';
  const currentTrait = campaign[Math.floor(currentQuestion / 3)]?.trait || '';
  const currentRating = ratings[`${currentQuestion}`] || { effort: 1, efficacy: 1 };
  const sentiment = getSentiment(currentRating.effort, currentRating.efficacy, isSelfCampaign);
  const progressValue = ((currentQuestion + 1) / (questions.length || 15)) * 100;
  const nextCtaLabel = currentQuestion < (questions.length - 1) ? 'Next Question' : 'Complete Survey';
  const sliderSx = {
    color: '#3F647B',
    px: { xs: 2.2, md: 2.6 },
    py: 0.5,
    '& .MuiSlider-rail': {
      opacity: 1,
      bgcolor: 'transparent',
      background: 'linear-gradient(90deg, #dfe7ef 0%, #cfdbe8 100%)',
      height: 8,
      borderRadius: 999,
    },
    '& .MuiSlider-track': {
      bgcolor: '#3F647B',
      border: 'none',
      height: 8,
      boxShadow: '0 0 0 1px rgba(63,100,123,0.08)',
    },
    '& .MuiSlider-thumb': {
      boxShadow: '0 4px 12px rgba(22,35,54,0.18)',
      '&:hover, &.Mui-focusVisible': {
        boxShadow: '0 6px 16px rgba(22,35,54,0.28)',
      },
    },
  };

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
        maxWidth="md"
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
            maxWidth: 860,
            mx: 'auto',
            minHeight: { xs: 620, md: 640 },
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 1.3, md: 1.8 },
            gap: 1.6,
          }}
        >
          <Box
            sx={{
              p: { xs: 2.1, md: 2.5 },
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.22)',
              bgcolor: 'rgba(13, 26, 48, 0.62)',
              minHeight: { xs: 132, md: 146 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.38rem', md: '1.55rem' }, fontWeight: 700, mb: 0.6, color: '#FFFFFF', letterSpacing: '0.01em' }}>
              {currentTrait}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '1.04rem', md: '1.12rem' },
                fontStyle: 'italic',
                color: 'rgba(247, 250, 255, 0.95)',
                lineHeight: 1.45,
                minHeight: { xs: 52, md: 56 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 1.6, md: 2.6 },
                maxWidth: 700,
              }}
            >
              {questions[currentQuestion]}
            </Typography>
          </Box>
          <Box
            sx={{
              p: { xs: 2, md: 2.3 },
              bgcolor: 'rgba(255, 255, 255, 0.92)',
              borderRadius: 2.5,
              border: '1px solid rgba(15,30,58,0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexGrow: 1,
            }}
          >
            <Stack spacing={2} alignItems="stretch" sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  minHeight: 178,
                  maxWidth: 700,
                  mx: 'auto',
                  borderRadius: 2,
                  border: '1px solid rgba(15,30,58,0.08)',
                  bgcolor: 'rgba(255,255,255,0.88)',
                  boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                  px: { xs: 1.2, md: 1.6 },
                  py: { xs: 1.6, md: 1.8 },
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.32rem', md: '1.45rem' }, fontWeight: 600, color: '#162336', mb: 0.4, textAlign: 'center' }}>
                  Effort
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.96rem', fontStyle: 'italic', color: 'rgba(22,35,54,0.84)', mb: 1.2, textAlign: 'center' }}>
                  {isSelfCampaign
                    ? 'How intentional and attentive I am in this area'
                    : 'How intentional and attentive Brian behaves in this area'}
                </Typography>
                <Box sx={{ position: 'relative' }}>
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
                    sx={sliderSx}
                    slotProps={{
                      thumb: {
                        component: CustomThumb
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2.8, md: 3.4 }, mt: 0.2 }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'rgba(22,35,54,0.75)' }}>Low</Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'rgba(22,35,54,0.75)' }}>High</Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  minHeight: 178,
                  maxWidth: 700,
                  mx: 'auto',
                  borderRadius: 2,
                  border: '1px solid rgba(15,30,58,0.08)',
                  bgcolor: 'rgba(255,255,255,0.88)',
                  boxShadow: '0 8px 24px rgba(16,24,40,0.08)',
                  px: { xs: 1.2, md: 1.6 },
                  py: { xs: 1.6, md: 1.8 },
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: { xs: '1.32rem', md: '1.45rem' }, fontWeight: 600, color: '#162336', mb: 0.4, textAlign: 'center' }}>
                  Efficacy
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.96rem', fontStyle: 'italic', color: 'rgba(22,35,54,0.84)', mb: 1.2, textAlign: 'center' }}>
                  {isSelfCampaign
                    ? 'How effectively I meet the demands of this area'
                    : 'Is Brian meeting my needs in this area'}
                </Typography>
                <Box sx={{ position: 'relative' }}>
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
                    sx={sliderSx}
                    slotProps={{
                      thumb: {
                        component: CustomThumb
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2.8, md: 3.4 }, mt: 0.2 }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'rgba(22,35,54,0.75)' }}>Low</Typography>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'rgba(22,35,54,0.75)' }}>High</Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  minHeight: 78,
                  bgcolor: 'rgba(255,255,255,0.82)',
                  border: '1px solid',
                  borderColor: 'rgba(76,111,132,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  px: 2,
                  maxWidth: 700,
                  mx: 'auto',
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: '#162336', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.42 }}>
                  {sentiment}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
        <Box
          sx={{
            mt: 1.6,
            width: '100%',
            maxWidth: 860,
            mx: 'auto',
            borderRadius: 999,
            border: '1px solid rgba(15,30,58,0.12)',
            bgcolor: 'rgba(255,255,255,0.84)',
            px: { xs: 1.2, md: 1.6 },
            py: { xs: 1.1, md: 1.2 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '120px 1fr 210px' },
            gap: { xs: 1, md: 1.2 },
            alignItems: 'center',
            minHeight: 70,
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