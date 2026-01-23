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
import { Person, Warning, Lightbulb, ExpandMore, CheckCircle, TrendingUp } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import traitSystem from '../data/traitSystem';
import { intakeContext } from '../data/intakeContext';

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
  const [focusAreas, setFocusAreas] = useState([]);

  // Generate focus areas based on intake data (instead of random)
  const generateAndSetFocusAreas = () => {
    const CORE_TRAITS = traitSystem.CORE_TRAITS || [];
    if (!CORE_TRAITS.length) return;

    const data = summaryData || formDataFromRoute || {};
    const scores = {};
    CORE_TRAITS.forEach((trait) => { scores[trait.id] = 0; });

    const traitMap = {
      Shepherd: 'teamDevelopment',
      Courage: 'emotionalIntelligence',
      Navigator: 'strategicThinking',
    };

    const addScore = (traitId, amount = 1) => {
      if (!traitId || scores[traitId] == null) return;
      scores[traitId] += amount;
    };

    // ---- norms-based scoring (societalResponses) ----
    const normItems = intakeContext?.societalNorms?.items || [];
    const norms = Array.isArray(data.societalResponses) ? data.societalResponses : [];
    if (normItems.length === 10 && norms.length === 10) {
      const scored = normItems.map((item, idx) => {
        const raw = Number(norms[idx]);
        const score = item.reverse ? (11 - raw) : raw;
        return { item, score };
      });
      let flagged = scored.filter((s) => s.score <= 3);
      if (!flagged.length) {
        flagged = scored.filter((s) => s.score >= 4 && s.score <= 5);
      }
      flagged.forEach(({ item, score }) => {
        const weight = score <= 3 ? (4 - score) : 1;
        (item.traitsUndermined || []).forEach((t) => addScore(traitMap[t], weight));
      });
    }

    // ---- behavior-based scoring ----
    const roleModelTraitMap = {
      communicated: 'communication',
      'made decisions': 'decisionMaking',
      'thought strategically': 'strategicThinking',
      'executed & followed through': 'execution',
      'developed their team': 'teamDevelopment',
      'shaped culture': 'teamDevelopment',
      'built relationships': 'emotionalIntelligence',
      'handled challenges': 'decisionMaking',
      'inspired others': 'teamDevelopment',
      'balanced priorities': 'strategicThinking',
    };
    addScore(roleModelTraitMap[data.roleModelTrait], 2);

    if (data.decisionPace?.includes('Fix')) addScore('execution', 1);
    if (data.decisionPace?.includes('Feedback')) addScore('decisionMaking', 1);

    if (Array.isArray(data.leaderFuel) && data.leaderFuel[0]) {
      const topFuel = data.leaderFuel[0];
      if (topFuel.includes('team gel') || topFuel.includes('learned') || topFuel.includes('recognition')) {
        addScore('teamDevelopment', 1);
      } else if (topFuel.includes('project') || topFuel.includes('chaos')) {
        addScore('execution', 1);
      } else if (topFuel.includes('problem')) {
        addScore('decisionMaking', 1);
      }
    }

    if (data.visibilityComfort?.includes('spotlight')) addScore('communication', 1);
    if (data.visibilityComfort?.includes('behind the scenes')) addScore('execution', 1);

    // ---- select top 5 traits ----
    const ranked = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => CORE_TRAITS.find((t) => t.id === id))
      .filter(Boolean);

    const pickSubTrait = (trait) => {
      if (!trait?.subTraits?.length) return null;
      // Deterministic pick based on data + trait id
      const key = JSON.stringify({
        role: data.role || '',
        industry: data.industry || '',
        trait: trait.id,
      });
      let hash = 0;
      for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % trait.subTraits.length;
      return trait.subTraits[hash] || trait.subTraits[0];
    };

    const generatedAreas = ranked.slice(0, 5).map((trait) => {
      const subTrait = pickSubTrait(trait);
      if (!subTrait) return null;
      const example = subTrait.riskSignals?.underuse?.[0] || `Struggling with ${subTrait.name.toLowerCase()} can show up in day-to-day execution.`;
      const risk = subTrait.riskSignals?.underuse?.[1] || example;
      const impact = subTrait.impact || `Improving ${subTrait.name.toLowerCase()} can strengthen trust, alignment, and outcomes.`;
      return {
        id: `${trait.id}-${subTrait.id}`,
        traitName: trait.name,
        traitDefinition: trait.definition || trait.description,
        subTraitName: subTrait.name,
        subTraitDefinition: subTrait.definition || subTrait.shortDescription,
        example,
        risk,
        impact,
      };
    }).filter(Boolean);

    if (!generatedAreas.length) return;
    const finalAreas = generatedAreas.slice(0, 5);
    setFocusAreas(finalAreas);
    localStorage.setItem('focusAreas', JSON.stringify(finalAreas));
  };

  // Load user name, AI campaign, and focus areas from localStorage
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
      
      // Load or generate focus areas
      const storedFocusAreas = localStorage.getItem('focusAreas');
      if (storedFocusAreas) {
        try {
          const parsed = JSON.parse(storedFocusAreas);
          if (Array.isArray(parsed) && parsed.length === 5) {
            setFocusAreas(parsed);
          } else {
            generateAndSetFocusAreas();
          }
        } catch (e) {
          console.warn('Failed to parse focusAreas from localStorage:', e);
          generateAndSetFocusAreas();
        }
      } else {
        generateAndSetFocusAreas();
      }
    } catch (err) {
      console.warn('Could not load user info:', err);
      generateAndSetFocusAreas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-generate focus areas once summary data is available
  useEffect(() => {
    if (summaryData || formDataFromRoute) {
      generateAndSetFocusAreas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryData]);

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
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                Leader Snapshot
              </Typography>
              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
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
                background: 'linear-gradient(135deg, rgba(224,122,63,0.15) 0%, rgba(255,255,255,0.98) 50%, rgba(99,147,170,0.15) 100%)',
                boxShadow: '0 8px 32px rgba(224,122,63,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(224,122,63,0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
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
              <AccordionDetails sx={{ p: 3.5, background: 'rgba(255,255,255,0.85)' }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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
                background: 'linear-gradient(135deg, rgba(237,108,2,0.15) 0%, rgba(255,255,255,0.98) 50%, rgba(237,108,2,0.15) 100%)',
                boxShadow: '0 8px 32px rgba(237,108,2,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(237,108,2,0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
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
              <AccordionDetails sx={{ p: 3.5, background: 'rgba(255,255,255,0.85)' }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
                    borderLeft: '4px solid',
                    borderColor: 'warning.main',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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
                background: 'linear-gradient(135deg, rgba(211,47,47,0.15) 0%, rgba(255,255,255,0.98) 50%, rgba(211,47,47,0.15) 100%)',
                boxShadow: '0 8px 32px rgba(211,47,47,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(211,47,47,0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
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
              <AccordionDetails sx={{ p: 3.5, background: 'rgba(255,255,255,0.85)' }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
                    borderLeft: '4px solid',
                    borderColor: 'error.main',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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
                  color: 'white',
                  mb: 2,
                  textAlign: 'center',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                Choose Your Focus Areas
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1rem',
                  color: 'rgba(255,255,255,0.9)',
                  mb: 3,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  maxWidth: '700px',
                  mx: 'auto',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                Based on your assessment, we've identified specific leadership areas where focused development could have the greatest impact. 
                Below are five targeted focus areas, each with concrete examples of how they show up in leadership and the risks of not addressing them. 
                Select exactly 3 traits that resonate most with your current leadership challenges and growth goals.
              </Typography>

              <Stack spacing={2}>
                {focusAreas.length > 0 ? focusAreas.map((focusArea) => {
                    const isSelected = selectedTraits.includes(focusArea.id);
                    const isDisabled = !isSelected && selectedTraits.length >= 3;

                    return (
                      <Paper
                        key={focusArea.id}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedTraits((prev) => {
                              if (prev.includes(focusArea.id)) {
                                return prev.filter((id) => id !== focusArea.id);
                              } else if (prev.length < 3) {
                                return [...prev, focusArea.id];
                              }
                              return prev;
                            });
                          }
                        }}
                        sx={{
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          border: isSelected ? '2px solid #2d4a5a' : '2px solid rgba(255,255,255,0.2)',
                          borderRadius: 3,
                          boxShadow: isSelected 
                            ? '0 8px 24px rgba(45,74,90,0.35)' 
                            : '0 4px 16px rgba(0,0,0,0.1)',
                          bgcolor: isSelected 
                            ? 'rgba(255,255,255,0.98)' 
                            : 'rgba(255,255,255,0.95)',
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,245,255,0.95))'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
                          opacity: isDisabled ? 0.5 : 1,
                          transition: 'all 0.3s ease',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: isDisabled ? 'none' : 'translateY(-3px)',
                            boxShadow: isDisabled 
                              ? '0 4px 16px rgba(0,0,0,0.1)' 
                              : '0 12px 32px rgba(45,74,90,0.25)',
                            borderColor: isDisabled ? 'rgba(255,255,255,0.2)' : (isSelected ? '#2d4a5a' : '#E07A3F'),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'stretch', minHeight: '140px' }}>
                          {/* Left Third: Trait Name - Centered */}
                          <Box
                            sx={{
                              width: '33.33%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              textAlign: 'center',
                              p: 2.5,
                              borderRight: '2px solid',
                              borderColor: 'divider',
                              bgcolor: isSelected ? 'rgba(224,122,63,0.05)' : 'transparent',
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'primary.main',
                                lineHeight: 1.3,
                                mb: 0.5,
                              }}
                            >
                              {focusArea.traitName}
                            </Typography>
                            {focusArea.traitDefinition && (
                              <Typography
                                sx={{
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontSize: '0.75rem',
                                  fontStyle: 'italic',
                                  color: 'text.secondary',
                                  lineHeight: 1.2,
                                }}
                              >
                                {focusArea.traitDefinition}
                              </Typography>
                            )}
                          </Box>

                          {/* Middle Third: Sub-Trait Name - Centered */}
                          <Box
                            sx={{
                              width: '33.33%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              textAlign: 'center',
                              p: 2.5,
                              borderRight: '2px solid',
                              borderColor: 'divider',
                              bgcolor: isSelected ? 'rgba(99,147,170,0.05)' : 'transparent',
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: 'secondary.main',
                                lineHeight: 1.3,
                                mb: 0.5,
                              }}
                            >
                              {focusArea.subTraitName}
                            </Typography>
                            {focusArea.subTraitDefinition && (
                              <Typography
                                sx={{
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontSize: '0.7rem',
                                  fontStyle: 'italic',
                                  color: 'text.secondary',
                                  lineHeight: 1.2,
                                }}
                              >
                                {focusArea.subTraitDefinition}
                              </Typography>
                            )}
                          </Box>

                          {/* Right Third: Conditional - Example/Risk when unselected, Impact when selected */}
                          {isSelected ? (
                            /* Impact - Full Right Third when Selected (same width as Example + Risk combined) */
                            <Box
                              sx={{
                                width: '33.33%',
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: '#457089',
                                background: 'linear-gradient(135deg, #457089, #375d78)',
                              }}
                            >
                              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                <TrendingUp sx={{ color: 'white', fontSize: 16 }} />
                                <Typography
                                  sx={{
                                    fontFamily: 'Gemunu Libre, sans-serif',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  Impact
                                </Typography>
                              </Stack>
                              <Typography
                                sx={{
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontSize: '0.75rem',
                                  color: 'white',
                                  lineHeight: 1.4,
                                }}
                              >
                                {focusArea.impact}
                              </Typography>
                            </Box>
                          ) : (
                            /* Example and Risk - Split Right Third in Half when Unselected */
                            <>
                              {/* Example - Left Half of Right Third (16.67% of total) */}
                              <Box
                                sx={{
                                  width: '16.67%',
                                  p: 2,
                                  borderRight: '1px solid',
                                  borderColor: 'rgba(0,0,0,0.1)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  bgcolor: 'primary.main',
                                  background: 'linear-gradient(135deg, #E07A3F, #C85A2A)',
                                }}
                              >
                                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                  <Lightbulb sx={{ color: 'white', fontSize: 16 }} />
                                  <Typography
                                    sx={{
                                      fontFamily: 'Gemunu Libre, sans-serif',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      color: 'white',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                    }}
                                  >
                                    Example
                                  </Typography>
                                </Stack>
                                <Typography
                                  sx={{
                                    fontFamily: 'Gemunu Libre, sans-serif',
                                    fontSize: '0.75rem',
                                    color: 'white',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {focusArea.example}
                                </Typography>
                              </Box>

                              {/* Risk - Right Half of Right Third (16.67% of total) */}
                              <Box
                                sx={{
                                  width: '16.67%',
                                  p: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  bgcolor: 'warning.main',
                                  background: 'linear-gradient(135deg, #ED6C02, #D84315)',
                                }}
                              >
                                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                  <Warning sx={{ color: 'white', fontSize: 16 }} />
                                  <Typography
                                    sx={{
                                      fontFamily: 'Gemunu Libre, sans-serif',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      color: 'white',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                    }}
                                  >
                                    Risk
                                  </Typography>
                                </Stack>
                                <Typography
                                  sx={{
                                    fontFamily: 'Gemunu Libre, sans-serif',
                                    fontSize: '0.75rem',
                                    color: 'white',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {focusArea.risk}
                                </Typography>
                              </Box>
                            </>
                          )}
                        </Box>
                      </Paper>
                    );
                  }) : (
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', color: 'text.secondary' }}>
                        Loading focus areas...
                      </Typography>
                    </Box>
                  )}
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
