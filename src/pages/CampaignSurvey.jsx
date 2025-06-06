import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Stack, Slider, LinearProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function CampaignSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const campaignData = JSON.parse(localStorage.getItem(`campaign_${id}`) || '{}');
    if (campaignData?.campaign) {
      setCampaign(campaignData.campaign);
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  const saveResponses = async () => {
    const ratingsData = { id, ratings };
    await addDoc(collection(db, 'surveyResponses'), ratingsData);
    console.log('Survey responses saved to Firestore:', ratingsData);
  };

  const nextQuestion = async () => {
    if (currentQuestion < 14) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      await saveResponses();
      navigate(`/campaign/${id}/complete`);
    }
  };

  const getSentiment = (effort, efficacy) => {
    const effortRange = effort <= 4 ? 'Low' : effort <= 7 ? 'Medium' : 'High';
    const efficacyRange = efficacy <= 4 ? 'Low' : efficacy <= 7 ? 'Medium' : 'High';

    if (effortRange === 'High' && efficacyRange === 'High') {
      return "Brian consistently excels with strong effort, meeting your needs exceptionally well.";
    } else if (effortRange === 'High' && efficacyRange === 'Medium') {
      return "Brian puts in strong effort, but the results could be more consistent to fully meet your needs.";
    } else if (effortRange === 'High' && efficacyRange === 'Low') {
      return "Brian tries hard, but the outcomes often fall short of your expectations.";
    } else if (effortRange === 'Medium' && efficacyRange === 'High') {
      return "Brian achieves great results with moderate effort, showing efficiency in meeting your needs.";
    } else if (effortRange === 'Medium' && efficacyRange === 'Medium') {
      return "Brian’s effort and results are steady, but there’s room to elevate both.";
    } else if (effortRange === 'Medium' && efficacyRange === 'Low') {
      return "Brian’s moderate effort isn’t yielding the results you need, leaving room for improvement.";
    } else if (effortRange === 'Low' && efficacyRange === 'High') {
      return "Brian delivers strong results with minimal effort, but more intention could make a bigger impact.";
    } else if (effortRange === 'Low' && efficacyRange === 'Medium') {
      return "Brian’s results are okay, but lack of effort leaves you wanting more consistency.";
    } else {
      return "Brian’s minimal effort and poor results are disappointing, needing significant improvement.";
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
  const currentTrait = campaign[Math.floor(currentQuestion / 3)]?.trait || '';
  const currentRating = ratings[`${currentQuestion}`] || { effort: 1, efficacy: 1 };
  const sentiment = getSentiment(currentRating.effort, currentRating.efficacy);

  if (currentQuestion >= questions.length) return null;

  return (
    <Box
      sx={{
        p: 5,
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(/LEP1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            boxShadow: 4,
            width: '100%',
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
              <Box sx={{ width: '600px' }}>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', color: 'text.primary' }}>
                  Effort
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontStyle: 'italic', color: 'text.primary', mb: 1 }}>
                  How intentional and attentive Brian behaves in this area
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
              <Box sx={{ width: '600px' }}>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', color: 'text.primary' }}>
                  Efficacy
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontStyle: 'italic', color: 'text.primary', mb: 1 }}>
                  Is Brian meeting my needs in this area
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
                  width: '600px',
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
          <Box sx={{ width: '600px', textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary', mb: 1 }}>
              {currentQuestion + 1}/15
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((currentQuestion + 1) / 15) * 100}
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
            {currentQuestion < 14 ? 'Next Question' : 'Complete Survey'}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

export default CampaignSurvey;