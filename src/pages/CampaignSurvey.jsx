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
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'secondary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1rem',
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
          backgroundImage: 'url(/LEP1.jpg)',
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
      <ProcessTopRail />
      <Container
        maxWidth="md"
        sx={{
          textAlign: 'center',
          py: { xs: 2, md: 3 },
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
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            boxShadow: 4,
            width: '100%',
            maxWidth: 900,
            mx: 'auto',
          }}
        >
          <Box
            sx={{
              p: 3,
              bgcolor: 'secondary.main',
              background: 'linear-gradient(180deg, #1976d2, #1565c0)',
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }}
          >
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', mb: 1, color: 'white' }}>
              {currentTrait}
            </Typography>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontStyle: 'italic', color: 'white' }}>
              {questions[currentQuestion]}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 3,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
            }}
          >
            <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ width: '100%' }}>
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
                  sx={{ color: 'secondary.main' }}
                  slotProps={{
                    thumb: {
                      component: CustomThumb
                    }
                  }}
                />
              </Box>
              <Box sx={{ width: '100%' }}>
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
                  sx={{ color: 'secondary.main' }}
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
                  minHeight: '50px',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  border: '2px solid #BC5C2B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary', whiteSpace: 'normal', textAlign: 'center' }}>
                  {sentiment}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
        <Stack spacing={2} alignItems="center" sx={{ mt: 3 }}>
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary', mb: 1 }}>
              {currentQuestion + 1}/{questions.length || 15}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((currentQuestion + 1) / (questions.length || 15)) * 100}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={nextQuestion}
            disabled={!ratings[`${currentQuestion}`]?.effort || !ratings[`${currentQuestion}`]?.efficacy}
            sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 4, py: 1 }}
          >
            {currentQuestion < (questions.length - 1) ? 'Next Question' : 'Complete Survey'}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

export default CampaignSurvey;