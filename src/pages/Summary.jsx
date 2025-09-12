import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, LinearProgress, Alert, Stack, Button, Accordion, AccordionSummary, AccordionDetails, Select, MenuItem } from '@mui/material';
import { Person, Star, Warning, Lightbulb, Public, ExpandMore } from '@mui/icons-material';

import { useNavigate, useLocation } from 'react-router-dom';

function Summary() {
  const { state } = useLocation();
  const formData = state?.formData || {};
  const [summaryData, setSummaryData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [shuffledQuotes, setShuffledQuotes] = useState([]);

  const navigate = useNavigate();

  const quotes = [
    "The best leaders don’t create followers; they inspire others to become leaders. — John C. Maxwell",
    "Growth begins when we start to accept our own weaknesses. — Jean Vanier",
    "Leadership is not about being in charge. It’s about taking care of those in your charge. — Simon Sinek",
    "The only way to grow is to step outside your comfort zone. — Unknown",
    "Great leaders don’t create followers; they inspire others to become leaders. — Tom Peters",
    "The function of leadership is to produce more leaders, not more followers. — Ralph Nader",
    "A leader is one who knows the way, goes the way, and shows the way. — John Maxwell",
    "Leadership is about making others better as a result of your presence and making sure that impact lasts in your absence. — Sheryl Sandberg",
  ];

  const agents = [
    { id: "bluntPracticalFriend", name: "Blunt Practical Friend" },
    { id: "formalEmpatheticCoach", name: "Formal Empathetic Coach" },
    { id: "balancedMentor", name: "Balanced Mentor" },
    { id: "comedyRoaster", name: "Comedy Roaster" },
    { id: "pragmaticProblemSolver", name: "Pragmatic Problem Solver" },
    { id: "highSchoolCoach", name: "High School Coach" },
  ];

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    setShuffledQuotes(shuffleArray(quotes));
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      console.log('Starting fetchSummary...');
      try {
        console.log('Fetching latest response from /get-latest-response');
        const response = await fetch('/get-latest-response', { headers: { 'Accept': 'application/json' } });
        let data;
        if (!response.ok) {
          console.error('Failed to fetch latest response:', response.status, response.statusText);
          console.log('Falling back to formData from route state:', formData);
          data = formData; // Use formData as fallback
        } else {
          data = await response.json();
          console.log('Fetched summary data:', data);
        }
        setSummaryData(data);
    
        const validAgents = ["bluntPracticalFriend", "formalEmpatheticCoach", "balancedMentor"];
        const selectedAgent = validAgents.includes(data.selectedAgent) ? data.selectedAgent : "balancedMentor";
        const requestBody = { ...data, selectedAgent };
        console.log('Sending request to /get-ai-summary with body:', requestBody);
    
        const summaryResponse = await fetch('/get-ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(requestBody),
        });
    
        if (!summaryResponse.ok) {
          const errorData = await summaryResponse.json();
          console.error('Failed to fetch AI summary:', summaryResponse.status, errorData);
          throw new Error(`HTTP error! status: ${summaryResponse.status}, details: ${JSON.stringify(errorData)}`);
        }
    
        const summaryData = await summaryResponse.json();
        console.log('AI summary response:', summaryData);
        if (summaryData.error) {
          console.error('AI summary error:', summaryData.error);
          setError(summaryData.error);
          setAiSummary(null);
        } else if (summaryData.aiSummary) {
          console.log('Successfully fetched AI summary:', summaryData.aiSummary);
          setAiSummary(summaryData.aiSummary);
          localStorage.setItem('aiSummary', summaryData.aiSummary);
          setError(null);
        } else {
          console.error('No aiSummary in response:', summaryData);
          setError('Invalid AI response format');
          setAiSummary(null);
        }
      } catch (error) {
        console.error('Error in fetchSummary:', error.message, error.stack);
        setError('Failed to connect to server or invalid response: ' + error.message);
        setAiSummary(null);
      } finally {
        console.log('Fetch summary complete, isLoading set to false');
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % shuffledQuotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading, shuffledQuotes]);

  const handleAgentChange = async (event) => {
    const newAgent = event.target.value;
    setSelectedAgent(newAgent);
    setIsLoading(true);

    try {
      const response = await fetch('/get-latest-response', { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const requestBody = { ...data, selectedAgent: newAgent };
      console.log('Rerun request body:', requestBody);

      const summaryResponse = await fetch('/get-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json();
        throw new Error(`HTTP error! status: ${summaryResponse.status}, details: ${JSON.stringify(errorData)}`);
      }

      const summaryData = await summaryResponse.json();
      if (summaryData.error) {
        console.error('AI summary error:', summaryData.error);
        setError(summaryData.error);
        setAiSummary(null);
      } else if (summaryData.aiSummary) {
        console.log('Fetched new AI summary:', summaryData.aiSummary);
        setAiSummary(summaryData.aiSummary);
        localStorage.setItem('aiSummary', summaryData.aiSummary);
        setError(null);
      } else {
        console.error('No aiSummary in response:', summaryData);
        setError('Invalid AI response format');
        setAiSummary(null);
      }
    } catch (error) {
      console.error('Error rerunning summary:', error);
      setError('Failed to rerun summary: ' + error.message);
      setAiSummary(null);
    } finally {
      setIsLoading(false);
      setSelectedAgent('');
    }
  };

  const summarySections = aiSummary ? aiSummary.split(/\n\s*\n/) : [];
while (summarySections.length < 5) summarySections.push('Section not available.');
const shortSummary     = summarySections[0] || '';
const strengthsText    = summarySections[1] || '';
const blindSpotsText   = summarySections[2] || '';
const inspirationTip   = summarySections[3] || '';
const societalNormsTxt = summarySections[4] || '';


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
      <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
        {isLoading ? (
          <Stack
            direction="column"
            alignItems="center"
            sx={{
              position: 'absolute',
              top: '66%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
            }}
          >
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0s',
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.3s',
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: '20px',
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.6s',
                }}
              />
            </Stack>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.125rem', mt: 2, color: 'text.primary' }}>
              Generating your leadership summary...
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.25rem',
                color: 'text.primary',
                fontStyle: 'italic',
                animation: 'fadeInOut 3s ease-in-out infinite',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {shuffledQuotes[currentQuoteIndex]}
            </Typography>
            <style>
              {`
                @keyframes pulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.5); opacity: 0.7; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeInOut {
                  0% { opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { opacity: 0; }
                }
              `}
            </style>
          </Stack>
        ) : error ? (
          <Alert severity="error" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mt: 4 }}>
            {error}
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ width: '800px', mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontFamily: 'Gemunu Libre, sans-serif', color: 'text.primary', mb: 4, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Leadership Summary
            </Typography>
            <Accordion
              defaultExpanded={false}
              sx={{
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                boxShadow: 4,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Person sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold', color: 'text.primary' }}>
                    Leadership Snapshot
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                    color: 'text.primary',
                  }}
                >
                  {shortSummary || "No summary available."}
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion
              defaultExpanded={false}
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                boxShadow: 4,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Star sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold', color: 'text.primary' }}>
                    Superpowers
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary' }}>
                  {strengthsText || "No strengths available."}
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion
              defaultExpanded={false}
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                boxShadow: 4,
                bgcolor: 'rgba(255, 255, 237, 0.95)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Warning sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold', color: 'text.primary' }}>
                    Blind Spots
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary' }}>
                  {blindSpotsText || "No blind spots available."}
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion
              defaultExpanded={false}
              sx={{
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                boxShadow: 4,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Lightbulb sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold', color: 'text.primary' }}>
                    Growth Spark
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                    color: 'text.primary',
                  }}
                >
                  {inspirationTip || "No inspiration available."}
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion
  defaultExpanded={false}
  sx={{
    border: '1px solid',
    borderColor: 'primary.main',
    borderRadius: 2,
    boxShadow: 4,
    bgcolor: 'rgba(255, 255, 255, 0.95)',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
  }}
>
  <AccordionSummary
    expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
    sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Public sx={{ color: 'primary.main', fontSize: 40 }} />
      <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold', color: 'text.primary' }}>
        Societal Norms
      </Typography>
    </Stack>
  </AccordionSummary>
  <AccordionDetails>
    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.primary', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
      {societalNormsTxt || "No societal norms identified."}
    </Typography>
  </AccordionDetails>
</Accordion>

            <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 5, py: 1.5 }}
              >
                Return to Home
              </Button>
              <Button
  variant="contained"
  color="primary"
  onClick={() => {
    console.log('Navigating to societal-norms assessment with aiSummary:', aiSummary);
    if (aiSummary && aiSummary.trim() !== '') {
  localStorage.setItem('aiSummary', aiSummary);
}
navigate('/societal-norms');

  }}
  sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 5, py: 1.5 }}
>
  I want to dig deeper...
</Button>

              <Select
                value={selectedAgent}
                onChange={handleAgentChange}
                displayEmpty
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', height: '40px' }}
              >
                <MenuItem value="" disabled>
                  Rerun with a Different Agent
                </MenuItem>
                {agents.map(agent => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        )}
      </Container>
    </Box>
  );
}

export default Summary;