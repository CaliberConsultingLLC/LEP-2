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
  Checkbox,
  Paper,
  Divider,
} from '@mui/material';
import { Person, Warning, Lightbulb, ExpandMore, CheckCircle } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Curated list of 5 traits with examples and risks - these should be personalized based on user responses
// For now, we'll use a static list, but this should ideally be generated based on the user's intake data
const TRAITS = [
  {
    id: 'communication',
    name: 'Communication',
    example: 'During team meetings, you may find yourself explaining concepts multiple times or noticing that team members seem confused about priorities.',
    risk: 'Without improvement, you risk misalignment, repeated work, and decreased team confidence in your direction.',
  },
  {
    id: 'delegation',
    name: 'Delegation & Empowerment',
    example: 'You might find yourself taking on tasks that could be handled by others, or team members frequently ask for approval on decisions they should make.',
    risk: 'This can lead to burnout, bottlenecked workflows, and missed opportunities for team growth and development.',
  },
  {
    id: 'feedback',
    name: 'Giving & Receiving Feedback',
    example: 'Difficult conversations get postponed, or feedback is delivered in ways that don\'t lead to change. You may also avoid seeking feedback yourself.',
    risk: 'Performance issues persist, team members don\'t grow, and you miss opportunities to improve your own leadership approach.',
  },
  {
    id: 'conflict',
    name: 'Conflict Resolution',
    example: 'When disagreements arise, you might avoid addressing them directly, or conflicts escalate because they\'re not handled constructively.',
    risk: 'Team dynamics suffer, resentment builds, and productivity decreases as unresolved issues fester.',
  },
  {
    id: 'vision',
    name: 'Vision & Strategic Thinking',
    example: 'Your team may struggle to see how their daily work connects to bigger goals, or you find it challenging to articulate a clear direction.',
    risk: 'Without a clear vision, teams lack motivation, make misaligned decisions, and miss opportunities for strategic impact.',
  },
];

function Summary() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const formDataFromRoute = state?.formData || {};

  const [summaryData, setSummaryData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiCampaign, setAiCampaign] = useState(null); // AI-generated campaign traits
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [userName, setUserName] = useState('');

  // Load user name and AI campaign from localStorage
  useEffect(() => {
    try {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const userInfo = JSON.parse(savedUserInfo);
        setUserName(userInfo.name || '');
      }
      
      // Load AI campaign if available
      const savedCampaign = localStorage.getItem('aiCampaign');
      if (savedCampaign) {
        try {
          const campaign = JSON.parse(savedCampaign);
          setAiCampaign(campaign);
        } catch (err) {
          console.warn('Could not parse saved campaign:', err);
        }
      }
    } catch (err) {
      console.warn('Could not load user info:', err);
    }
  }, []);

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

      // 3) request the 4-paragraph summary (canonical format)
      const summaryResp = await fetch('/api/get-ai-summary', {
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
      if (text) {
        localStorage.setItem('aiSummary', text);
        
        // 4) Generate campaign immediately after summary is received
        try {
          const campaignResp = await fetch('/api/get-campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ aiSummary: text, sessionId: data?.sessionId || null }),
          });
          
          if (campaignResp.ok) {
            const campaignData = await campaignResp.json();
            if (campaignData?.campaign) {
              setAiCampaign(campaignData.campaign);
              localStorage.setItem('aiCampaign', JSON.stringify(campaignData.campaign));
            }
          }
        } catch (campaignErr) {
          // Non-fatal: campaign generation failed, but summary is available
          console.warn('Campaign generation failed:', campaignErr);
        }
      }
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

  /**
   * Parse summary sections according to canonical 4-paragraph contract:
   * [0] Your Leadership Foundation
   * [1] Areas for Growth (Part 1)
   * [2] Areas for Growth (Part 2)
   * [3] Trajectory
   * 
   * Backward compatibility: If only 3 paragraphs exist (old format):
   * [0] = Foundation
   * [1] = Growth (combined)
   * [2] = Trajectory
   */
  const summarySections = aiSummary ? aiSummary.split(/\n\s*\n/).filter(s => s.trim().length > 0) : [];
  
  // Canonical format: 4 paragraphs
  const isCanonicalFormat = summarySections.length >= 4;
  
  const strengthsText = summarySections[0] || ''; // Foundation (always paragraph 0)
  
  // Growth: combine parts 1 and 2 in canonical format, or use single paragraph in old format
  const blindSpotsPart1 = summarySections[1] || '';
  const blindSpotsPart2 = summarySections[2] || '';
  const blindSpotsText = isCanonicalFormat && blindSpotsPart1 && blindSpotsPart2
    ? `${blindSpotsPart1}\n\n${blindSpotsPart2}`.trim()
    : (blindSpotsPart1 || blindSpotsPart2 || '');
  
  // Trajectory: paragraph 3 in canonical format, paragraph 2 in old format
  const trajectoryText = isCanonicalFormat
    ? (summarySections[3] || '')
    : (summarySections.length === 3 ? summarySections[2] || '' : '');

  /**
   * Bold important words and concepts in summary text
   * Identifies key leadership terms, action words, and important concepts
   */
  const boldImportantWords = (text) => {
    if (!text) return '';
    
    // Key leadership and development terms to bold
    const importantTerms = [
      // Leadership concepts
      /\b(leadership|leader|leading)\b/gi,
      /\b(team|teams|teamwork|collaboration)\b/gi,
      /\b(trust|trustworthy|credibility)\b/gi,
      /\b(communication|communicate|communicating)\b/gi,
      /\b(vision|visionary|strategic|strategy)\b/gi,
      /\b(delegation|delegate|empowerment|empower)\b/gi,
      /\b(feedback|coaching|mentoring|development)\b/gi,
      /\b(conflict|resolution|disagreement)\b/gi,
      /\b(accountability|responsible|responsibility)\b/gi,
      /\b(decision|decisions|judgment)\b/gi,
      // Human experience anchors
      /\b(belonging|inclusion|inclusive)\b/gi,
      /\b(vulnerability|vulnerable|openness)\b/gi,
      /\b(purpose|shared purpose|meaningful)\b/gi,
      // Action/impact words
      /\b(impact|influence|effect|outcome|outcomes)\b/gi,
      /\b(growth|improve|improvement|develop|development)\b/gi,
      /\b(opportunity|opportunities|potential)\b/gi,
      /\b(challenge|challenges|obstacle|barrier)\b/gi,
      /\b(strength|strengths|capability|capabilities)\b/gi,
      /\b(blind spot|blind spots|gap|gaps)\b/gi,
      // Important qualifiers
      /\b(critical|crucial|essential|vital|important)\b/gi,
      /\b(significant|substantial|meaningful)\b/gi,
    ];
    
    // Collect all matches from all patterns, then process in order
    const allMatches = [];
    importantTerms.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
        });
      }
    });
    
    // Sort by start position, then by length (longer first) to prioritize longer matches
    allMatches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - a.end; // Longer matches first at same position
    });
    
    // Build result by processing matches in order, avoiding overlaps
    let result = '';
    let lastIndex = 0;
    const processedRanges = [];
    
    allMatches.forEach(({ start, end, text: matchText }) => {
      // Check for overlap with already processed ranges
      const overlaps = processedRanges.some(
        (range) => !(end <= range.start || start >= range.end)
      );
      
      if (!overlaps && start >= lastIndex) {
        // Add text before this match
        result += text.substring(lastIndex, start);
        // Add bolded match
        result += `<strong>${matchText}</strong>`;
        // Update tracking
        lastIndex = end;
        processedRanges.push({ start, end });
      }
    });
    
    // Add remaining text
    result += text.substring(lastIndex);
    
    return result;
  };

  return (
    <Box sx={{
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
        backgroundImage: 'url(/LEP2.jpg)',
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
    }}>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: '100vw',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 880 }}>
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
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Title - Leader Snapshot */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  mb: 1,
                  color: 'text.primary',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                Leader Snapshot
              </Typography>
              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', color: 'text.secondary' }}>
                Insights from your reflection and leadership assessment
              </Typography>
            </Box>

            {/* Your Leadership Foundation - Strengths & Patterns */}
            <Accordion
              defaultExpanded={true}
              sx={{
                borderRadius: 4,
                border: '2px solid',
                borderColor: 'primary.main',
                background: 'linear-gradient(135deg, rgba(224,122,63,0.08) 0%, rgba(255,255,255,0.95) 50%, rgba(99,147,170,0.08) 100%)',
                boxShadow: '0 8px 32px rgba(224,122,63,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(224,122,63,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: 'primary.main', fontSize: 32 }} />}
                sx={{
                  background: 'linear-gradient(90deg, rgba(224,122,63,0.05) 0%, transparent 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, rgba(224,122,63,0.1) 0%, transparent 100%)',
                  },
                }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(224,122,63,0.15), rgba(224,122,63,0.05))',
                      border: '1px solid rgba(224,122,63,0.2)',
                    }}
                  >
                    <Person sx={{ color: 'primary.main', fontSize: 36 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontWeight: 700,
                        fontSize: '1.3rem',
                        color: 'primary.main',
                        mb: 0.5,
                      }}
                    >
                      Your Leadership Foundation
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        color: 'text.secondary', 
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                      }}
                    >
                      The strengths and patterns that define your leadership approach
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3.5, background: 'rgba(255,255,255,0.4)' }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(250,250,255,0.8))',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1.05rem',
                      lineHeight: 1.9,
                      whiteSpace: 'pre-wrap',
                      textAlign: 'left',
                      color: 'text.primary',
                      fontWeight: 400,
                      '& strong': {
                        fontWeight: 700,
                        color: 'primary.main',
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: boldImportantWords(strengthsText || 'No insights available.') }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Areas for Growth - Blind Spots & Challenges */}
            <Accordion
              defaultExpanded={false}
              sx={{
                borderRadius: 4,
                border: '2px solid',
                borderColor: 'warning.main',
                background: 'linear-gradient(135deg, rgba(237,108,2,0.08) 0%, rgba(255,255,255,0.95) 50%, rgba(237,108,2,0.05) 100%)',
                boxShadow: '0 8px 32px rgba(237,108,2,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(237,108,2,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: 'warning.main', fontSize: 32 }} />}
                sx={{
                  background: 'linear-gradient(90deg, rgba(237,108,2,0.05) 0%, transparent 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, rgba(237,108,2,0.1) 0%, transparent 100%)',
                  },
                }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(237,108,2,0.15), rgba(237,108,2,0.05))',
                      border: '1px solid rgba(237,108,2,0.2)',
                    }}
                  >
                    <Warning sx={{ color: 'warning.main', fontSize: 36 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontWeight: 700,
                        fontSize: '1.3rem',
                        color: 'warning.main',
                        mb: 0.5,
                      }}
                    >
                      Areas for Growth
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        color: 'text.secondary', 
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                      }}
                    >
                      Opportunities to expand your leadership impact
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3.5, background: 'rgba(255,255,255,0.4)' }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,250,245,0.8))',
                    borderLeft: '4px solid',
                    borderColor: 'warning.main',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1.05rem',
                      lineHeight: 1.9,
                      whiteSpace: 'pre-wrap',
                      textAlign: 'left',
                      color: 'text.primary',
                      fontWeight: 400,
                      '& strong': {
                        fontWeight: 700,
                        color: 'warning.main',
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: boldImportantWords(blindSpotsText || 'No growth areas identified.') }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Trajectory - Future Impact */}
            <Accordion
              defaultExpanded={false}
              sx={{
                borderRadius: 4,
                border: '2px solid',
                borderColor: 'error.main',
                background: 'linear-gradient(135deg, rgba(211,47,47,0.08) 0%, rgba(255,255,255,0.95) 50%, rgba(211,47,47,0.05) 100%)',
                boxShadow: '0 8px 32px rgba(211,47,47,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(211,47,47,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: 'error.main', fontSize: 32 }} />}
                sx={{
                  background: 'linear-gradient(90deg, rgba(211,47,47,0.05) 0%, transparent 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, rgba(211,47,47,0.1) 0%, transparent 100%)',
                  },
                }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(211,47,47,0.15), rgba(211,47,47,0.05))',
                      border: '1px solid rgba(211,47,47,0.2)',
                    }}
                  >
                    <Warning sx={{ color: 'error.main', fontSize: 36 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        fontWeight: 700,
                        fontSize: '1.3rem',
                        color: 'error.main',
                        mb: 0.5,
                      }}
                    >
                      Trajectory
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'Gemunu Libre, sans-serif', 
                        color: 'text.secondary', 
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                      }}
                    >
                      The potential impact of unaddressed leadership gaps
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3.5, background: 'rgba(255,255,255,0.4)' }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,245,245,0.8))',
                    borderLeft: '4px solid',
                    borderColor: 'error.main',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '1.05rem',
                      lineHeight: 1.9,
                      whiteSpace: 'pre-wrap',
                      textAlign: 'left',
                      color: 'text.primary',
                      fontWeight: 400,
                      '& strong': {
                        fontWeight: 700,
                        color: 'error.main',
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: boldImportantWords(trajectoryText || (aiSummary ? 'Trajectory analysis is being generated. Please refresh if this message persists.' : 'No trajectory analysis available.')) }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Trait Selection Section */}
            <Box sx={{ mt: 6, mb: 4 }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 2,
                  textAlign: 'center',
                }}
              >
                Choose Your Focus Areas
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1rem',
                  color: 'text.secondary',
                  mb: 3,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  maxWidth: '700px',
                  mx: 'auto',
                }}
              >
                Based on your assessment, we've identified specific leadership areas where focused development could have the greatest impact. 
                Below are three targeted focus areas, each with concrete examples of how they show up in leadership and the risks of not addressing them. 
                Select all 3 traits to build your personalized growth campaign.
              </Typography>

              <Stack spacing={1.5}>
                {/* Use AI-generated traits if available, otherwise fall back to static traits */}
                {(() => {
                  // Convert AI campaign to trait selection format
                  const availableTraits = aiCampaign && aiCampaign.length > 0
                    ? aiCampaign.map((item, idx) => ({
                        id: `trait-${idx}`,
                        name: item.trait || `Trait ${idx + 1}`,
                        example: item.statements?.[0] || 'This trait addresses key growth opportunities identified in your assessment.',
                        risk: item.statements?.[1] || 'Without addressing this area, you may miss critical opportunities for leadership development.',
                      }))
                    : TRAITS;
                  
                  return availableTraits.slice(0, 3).map((trait) => {
                    const isSelected = selectedTraits.includes(trait.id);
                    const isDisabled = !isSelected && selectedTraits.length >= 3;

                  return (
                    <Paper
                      key={trait.id}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedTraits((prev) => {
                            if (prev.includes(trait.id)) {
                              return prev.filter((id) => id !== trait.id);
                            } else if (prev.length < 3) {
                              return [...prev, trait.id];
                            }
                            return prev;
                          });
                        }
                      }}
                      sx={{
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        border: isSelected ? '2px solid #E07A3F' : '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 3,
                        boxShadow: isSelected ? '0 6px 22px rgba(224,122,63,0.28)' : '0 2px 10px rgba(0,0,0,0.06)',
                        bgcolor: isSelected ? 'rgba(224, 122, 63, 0.09)' : 'rgba(255,255,255,0.92)',
                        background: isSelected 
                          ? 'linear-gradient(180deg, rgba(240,245,255,0.95), rgba(255,255,255,0.9))'
                          : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))',
                        opacity: isDisabled ? 0.5 : 1,
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          transform: isDisabled ? 'none' : 'translateY(-2px)',
                          boxShadow: isDisabled ? '0 2px 10px rgba(0,0,0,0.06)' : '0 10px 28px rgba(0,0,0,0.16)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'stretch', minHeight: '100px' }}>
                        {/* Left Half: Name with Checkbox */}
                        <Box
                          sx={{
                            width: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            sx={{
                              color: 'primary.main',
                              mr: 1.5,
                              '&.Mui-checked': {
                                color: 'primary.main',
                              },
                            }}
                          />
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              color: 'text.primary',
                            }}
                          >
                            {trait.name}
                          </Typography>
                        </Box>

                        {/* Right Half: Example and Risk */}
                        <Box sx={{ width: '50%', display: 'flex' }}>
                          {/* Example - First Quarter */}
                          <Box
                            sx={{
                              width: '50%',
                              p: 2,
                              borderRight: '1px solid',
                              borderColor: 'divider',
                              display: 'flex',
                              flexDirection: 'column',
                              bgcolor: 'primary.main',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Lightbulb sx={{ color: 'white', fontSize: 18 }} />
                              <Typography
                                sx={{
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  color: 'white',
                                }}
                              >
                                Example:
                              </Typography>
                            </Stack>
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.8rem',
                                color: 'white',
                                lineHeight: 1.4,
                              }}
                            >
                              {trait.example}
                            </Typography>
                          </Box>

                          {/* Risk - Second Quarter */}
                          <Box
                            sx={{
                              width: '50%',
                              p: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              bgcolor: 'warning.main',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Warning sx={{ color: 'white', fontSize: 18 }} />
                              <Typography
                                sx={{
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  color: 'white',
                                }}
                              >
                                Risk:
                              </Typography>
                            </Stack>
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.8rem',
                                color: 'white',
                                lineHeight: 1.4,
                              }}
                            >
                              {trait.risk}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  );
                  });
                })()}
              </Stack>

              {/* Selection Counter and Continue Button */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: selectedTraits.length === 3 ? 'success.main' : 'text.primary',
                    mb: 2,
                  }}
                >
                  {selectedTraits.length} of 3 selected
                </Typography>

                {selectedTraits.length !== 3 && (
                  <Alert
                    severity="info"
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      mb: 2,
                      maxWidth: '600px',
                      mx: 'auto',
                    }}
                  >
                    Please select exactly 3 traits to continue.
                  </Alert>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => {
                    if (selectedTraits.length === 3) {
                      localStorage.setItem('selectedTraits', JSON.stringify(selectedTraits));
                      navigate('/campaign-builder');
                    }
                  }}
                  disabled={selectedTraits.length !== 3}
                  startIcon={selectedTraits.length === 3 ? <CheckCircle /> : null}
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.1rem',
                    px: 6,
                    py: 1.5,
                    minWidth: '250px',
                    '&:disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  {selectedTraits.length === 3 ? 'Build My Growth Campaign' : `Select ${3 - selectedTraits.length} more`}
                </Button>
              </Box>
            </Box>

            <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 5, py: 1.5 }}
              >
                Return to Home
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
        </Box>
      </Container>
    </Box>
  );
}

export default Summary;
