// src/pages/Summary.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Stack,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
} from '@mui/material';
import { Person, Warning, Lightbulb, ExpandMore } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

function Summary() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const formDataFromRoute = state?.formData || {};

  const [summaryData, setSummaryData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // quotes + simple animation rotation (kept from prior UX)
  const quotes = [
    "The best leaders don’t create followers; they inspire others to become leaders. — John C. Maxwell",
    "Growth begins when we start to accept our own weaknesses. — Jean Vanier",
    "Leadership is not about being in charge. It’s about taking care of those in your charge. — Simon Sinek",
    "The only way to grow is to step outside your comfort zone. — Unknown",
    "The function of leadership is to produce more leaders, not more followers. — Ralph Nader",
    "Leadership is about making others better as a result of your presence and making sure that impact lasts in your absence. — Sheryl Sandberg",
  ];
  const [shuffledQuotes, setShuffledQuotes] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    // shuffle quotes once
    const arr = [...quotes];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledQuotes(arr);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentQuoteIndex((i) => (i + 1) % (shuffledQuotes.length || 1));
    }, 3000);
    return () => clearInterval(id);
  }, [shuffledQuotes.length]);

  // agent selection
  const agents = [
    { id: 'bluntPracticalFriend', name: 'Blunt Practical Friend' },
    { id: 'formalEmpatheticCoach', name: 'Formal Empathetic Coach' },
    { id: 'balancedMentor', name: 'Balanced Mentor' },
    { id: 'comedyRoaster', name: 'Comedy Roaster' },
    { id: 'pragmaticProblemSolver', name: 'Pragmatic Problem Solver' },
    { id: 'highSchoolCoach', name: 'High School Coach' },
  ];
  const [selectedAgent, setSelectedAgent] = useState('');

  // get most recent intake (or fall back to route formData), then call /get-ai-summary
  const runSummary = async (overrideAgentId) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1) Fetch latest intake (or use formData from route)
      let data;
      try {
        const resp = await fetch('/get-latest-response', {
          headers: { Accept: 'application/json' },
        });
        if (!resp.ok) {
  data = formDataFromRoute;
} else {
  const latest = await resp.json();
  data = latest?.societalResponses?.length ? latest : formDataFromRoute;
}

      } catch {
        data = formDataFromRoute;
      }

      setSummaryData(data);

      // 2) choose agent
      const validAgentIds = agents.map((a) => a.id);
      const baseAgent =
        (overrideAgentId && validAgentIds.includes(overrideAgentId) && overrideAgentId) ||
        (data?.selectedAgent && validAgentIds.includes(data.selectedAgent) && data.selectedAgent) ||
        'balancedMentor';

      // 3) request the 3-paragraph summary
      const summaryResp = await fetch('/get-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, selectedAgent: baseAgent }),
      });

      if (!summaryResp.ok) {
        let details = '';
        try {
          const errJson = await summaryResp.json();
          details = ` (${JSON.stringify(errJson)})`;
        } catch {
          // ignore
        }
        throw new Error(`Summary HTTP ${summaryResp.status}${details}`);
      }

      const payload = await summaryResp.json();
      const text = payload?.aiSummary || '';
      setAiSummary(text);
      if (text) localStorage.setItem('aiSummary', text);
    } catch (e) {
      setError('Failed to generate summary: ' + (e?.message || e));
      setAiSummary('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAgentChange = async (e) => {
    const newAgent = e.target.value;
    setSelectedAgent(newAgent);
    await runSummary(newAgent);
  };

  // parse EXACTLY 3 paragraphs (Momentum, Blind Spots, Growth Spark)
  const summarySections = aiSummary ? aiSummary.split(/\n\s*\n/) : [];
  while (summarySections.length < 3) summarySections.push('Section not available.');
  const momentumText = summarySections[0] || '';
  const blindSpotsText = summarySections[1] || '';
  const growthSparkText = summarySections[2] || '';

  return (
    <Box sx={{
  p:5,
  minHeight:'100vh',
  width:'100%',
  overflowX:'hidden',
  backgroundImage:'linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.6)), url(/LEP2.jpg)',
  backgroundSize:'cover',
  backgroundPosition:'center',
  backgroundRepeat:'no-repeat',
  backgroundAttachment:'fixed',
}}>

      <Container maxWidth="lg">
        {isLoading ? (
          <Stack alignItems="center" spacing={2} sx={{ mt: 6 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <Box
                sx={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.3s',
                }}
              />
              <Box
                sx={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.6s',
                }}
              />
            </Stack>

            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.125rem', mt: 2 }}>
              Generating your leadership summary...
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.25rem',
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
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                color: 'text.primary',
                mb: 4,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              Leadership Summary
            </Typography>

            {/* Momentum */}
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
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />} sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Person sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold' }}>
                    Momentum
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
                  }}
                >
                  {momentumText || 'No momentum available.'}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Blind Spots */}
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
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />} sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Warning sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold' }}>
                    Blind Spots
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
                  {blindSpotsText || 'No blind spots available.'}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Growth Spark */}
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
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />} sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Lightbulb sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 'bold' }}>
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
                  }}
                >
                  {growthSparkText || 'No growth spark available.'}
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

              {/* Go to Trait Selection */}
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/trait-selection')}
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
                {agents.map((agent) => (
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
