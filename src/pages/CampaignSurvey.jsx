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
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#4C6F84',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.9rem',
          fontFamily: 'Gemunu Libre, sans-serif',
          cursor: 'pointer',
        }}
      >
        {props['aria-valuenow']}
        {children}
      </Box>
    );
  };

  const questions = campaign.reduce((acc, trait) => [...acc, ...trait.statements], []).slice(0, 15);
  const isSelfCampaign = campaignMeta?.campaignType === 'self';
  const currentTrait = campaign[Math.floor(currentQuestion / 3)]?.trait || '';
  const currentRating = ratings[`${currentQuestion}`] || { effort: 1, efficacy: 1 };
  const sentiment = getSentiment(currentRating.effort, currentRating.efficacy, isSelfCampaign);
  const sliderSx = {
    color: '#4C6F84',
    px: { xs: 1.25, md: 2 },
    '& .MuiSlider-rail': {
      opacity: 0.32,
      bgcolor: '#9fb5c6',
      height: 6,
    },
    '& .MuiSlider-track': {
      bgcolor: '#4C6F84',
      border: 'none',
      height: 6,
    },
    '& .MuiSlider-markLabel': {
      color: 'text.secondary',
      fontFamily: 'Gemunu Libre, sans-serif',
      fontSize: '0.9rem',
      top: 30,
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
          textAlign: 'center',
          py: { xs: 2, md: 2.5 },
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
            maxWidth: 900,
            mx: 'auto',
            minHeight: { xs: 560, md: 600 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              p: { xs: 2.2, md: 2.5 },
              borderBottom: '1px solid',
              borderColor: 'rgba(255,255,255,0.25)',
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              minHeight: { xs: 140, md: 156 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 700, mb: 0.7, color: '#FFFFFF' }}>
              {currentTrait}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: { xs: '1.06rem', md: '1.14rem' },
                fontStyle: 'italic',
                color: 'rgba(247, 250, 255, 0.95)',
                lineHeight: 1.35,
                minHeight: { xs: 58, md: 62 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 0.5, md: 1.5 },
              }}
            >
              {questions[currentQuestion]}
            </Typography>
          </Box>
          <Box
            sx={{
              p: { xs: 2.2, md: 2.5 },
              bgcolor: 'rgba(255, 255, 255, 0.90)',
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexGrow: 1,
            }}
          >
            <Stack spacing={2} alignItems="center" sx={{ mb: 2.5, flexGrow: 1 }}>
              <Box sx={{ width: '100%', minHeight: 136 }}>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', color: 'text.primary' }}>
                  Effort
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontStyle: 'italic', color: 'text.primary', mb: 1 }}>
                  {isSelfCampaign
                    ? 'How intentional and attentive I am in this area'
                    : 'How intentional and attentive Brian behaves in this area'}
                </Typography>
                <Slider
                  value={currentRating.effort}
                  onChange={(e, value) => handleSliderChange('effort', value)}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Low' },
                    { value: 10, label: 'High' }
                  ]}
                  sx={sliderSx}
                  slotProps={{
                    thumb: {
                      component: CustomThumb
                    }
                  }}
                />
              </Box>
              <Box sx={{ width: '100%', minHeight: 136 }}>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', color: 'text.primary' }}>
                  Efficacy
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontStyle: 'italic', color: 'text.primary', mb: 1 }}>
                  {isSelfCampaign
                    ? 'How effectively I meet the demands of this area'
                    : 'Is Brian meeting my needs in this area'}
                </Typography>
                <Slider
                  value={currentRating.efficacy}
                  onChange={(e, value) => handleSliderChange('efficacy', value)}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Low' },
                    { value: 10, label: 'High' }
                  ]}
                  sx={sliderSx}
                  slotProps={{
                    thumb: {
                      component: CustomThumb
                    }
                  }}
                />
              </Box>
              <Box
                sx={{
                  width: '100%',
                  minHeight: 74,
                  bgcolor: 'rgba(255,255,255,0.82)',
                  border: '1px solid',
                  borderColor: 'rgba(76,111,132,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  px: 1.5,
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary', whiteSpace: 'normal', textAlign: 'center' }}>
                  {sentiment}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
        <Stack spacing={1.4} alignItems="center" sx={{ mt: 1.5, width: '100%', maxWidth: 900, mx: 'auto' }}>
          <Box sx={{ width: '100%', textAlign: 'center', minHeight: 48 }}>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'rgba(15,30,58,0.82)', mb: 0.7 }}>
              {currentQuestion + 1}/{questions.length || 15}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((currentQuestion + 1) / (questions.length || 15)) * 100}
              sx={{
                height: 8,
                borderRadius: 5,
                bgcolor: 'rgba(15,30,58,0.16)',
                '& .MuiLinearProgress-bar': { bgcolor: '#4C6F84' },
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
              fontSize: '0.98rem',
              px: 3.2,
              py: 0.95,
              minWidth: 186,
              minHeight: 42,
              borderRadius: 999,
              bgcolor: '#457089',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#375d78', boxShadow: 'none' },
            }}
          >
            {currentQuestion < (questions.length - 1) ? 'Next Question' : 'Complete Survey'}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

export default CampaignSurvey;