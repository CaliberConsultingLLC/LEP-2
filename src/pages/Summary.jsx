// src/pages/Summary.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Stack,
  Button,
  MenuItem,
  Checkbox,
  Paper,
  Divider,
  Tooltip,
  Chip,
  Menu,
} from '@mui/material';
import { Warning, Lightbulb, CheckCircle, TrendingUp, AutoAwesome, PersonSearch } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import traitSystem from '../data/traitSystem';
import { intakeContext } from '../data/intakeContext';


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
  const showInlineTraitSelection = false;
  const [agentMenuAnchor, setAgentMenuAnchor] = useState(null);

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

      if (Array.isArray(payload?.focusAreas) && payload.focusAreas.length === 5) {
        setFocusAreas(payload.focusAreas);
        localStorage.setItem('focusAreas', JSON.stringify(payload.focusAreas));
      }

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

  const openAgentMenu = (event) => {
    setAgentMenuAnchor(event.currentTarget);
  };

  const closeAgentMenu = () => {
    setAgentMenuAnchor(null);
  };

  const handleAgentMenuSelect = async (agentId) => {
    closeAgentMenu();
    if (!agentId) return;
    setSelectedAgent(agentId);
    await runSummary(agentId);
  };

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

  const summaryParagraphs = (aiSummary || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3);

  const subTraitMap = useMemo(() => {
    const map = new Map();
    (focusAreas || []).forEach((area) => {
      if (area?.subTraitName) {
        map.set(area.subTraitName.toLowerCase(), area);
      }
    });
    return map;
  }, [focusAreas]);

  const renderParagraphWithTooltips = (text) => {
    const parts = String(text).split(/\*\*(.+?)\*\*/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        const key = part.toLowerCase();
        const area = subTraitMap.get(key);
        if (!area) {
          return (
            <span key={`plain-${idx}`} style={{ fontWeight: 700 }}>
              {part}
            </span>
          );
        }
        return (
          <Tooltip
            key={`tt-${idx}`}
            arrow
            placement="top"
            title={(
              <Box sx={{ p: 1, maxWidth: 260 }}>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{area.subTraitName}</Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                  Parent: {area.traitName}
                </Typography>
                {area.subTraitDefinition && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {area.subTraitDefinition}
                  </Typography>
                )}
                {area.impact && (
                  <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.9 }}>
                    {area.impact}
                  </Typography>
                )}
              </Box>
            )}
          >
            <Chip
              label={area.subTraitName}
              size="small"
              sx={{
                mx: 0.5,
                fontWeight: 700,
                bgcolor: 'rgba(99,147,170,0.15)',
                border: '1px solid rgba(99,147,170,0.45)',
                cursor: 'help',
              }}
            />
          </Tooltip>
        );
      }
      return <span key={`text-${idx}`}>{part}</span>;
    });
  };

  const renderNarrativeWithBullets = (text) => {
    const lines = String(text || '').split('\n');
    const bulletLines = lines.filter((line) => line.trim().startsWith('- '));
    if (!bulletLines.length) {
      return (
        <Typography
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            fontSize: '1.05rem',
            lineHeight: 1.9,
            color: 'text.primary',
          }}
        >
          {renderParagraphWithTooltips(text)}
        </Typography>
      );
    }

    const narrative = lines.filter((line) => !line.trim().startsWith('- ')).join(' ').trim();
    return (
      <Stack spacing={1.5}>
        {narrative && (
          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1.05rem',
              lineHeight: 1.9,
              color: 'text.primary',
            }}
          >
            {renderParagraphWithTooltips(narrative)}
          </Typography>
        )}
        <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
          {bulletLines.map((line, idx) => {
            const content = line.replace(/^\s*-\s*/, '');
            const parts = content.split('—');
            const head = parts[0]?.trim();
            const tail = parts.slice(1).join('—').trim();
            return (
              <Box key={`bullet-${idx}`} component="li" sx={{ mb: 0.75 }}>
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '0.98rem',
                    lineHeight: 1.7,
                    color: 'text.primary',
                  }}
                >
                  {head ? (
                    <>
                      <strong>{head}</strong>
                      {tail ? ` — ${tail}` : ''}
                    </>
                  ) : (
                    renderParagraphWithTooltips(content)
                  )}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Stack>
    );
  };

  if (isLoading) {
    return (
      <LoadingScreen
        title="Generating your leadership summary..."
        subtitle="We are synthesizing insights and aligning your focus traits."
      />
    );
  }

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
        <Box sx={{ width: '100%', maxWidth: 1400 }}>
        {error ? (
          <Alert severity="error" sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mt: 4 }}>
            {error}
          </Alert>
        ) : (
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Title - Reflection Results */}
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
                Reflection Results
              </Typography>
              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
                Insights from your reflection and leadership assessment
              </Typography>
            </Box>

            {/* Summary Output */}
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'primary.main',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(220,230,255,0.85))',
                boxShadow: 4,
                mb: 3,
              }}
            >
              {summaryParagraphs.length ? (
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 2,
                      alignItems: 'stretch',
                    }}
                  >
                    {[0, 1].map((idx) => {
                      const para = summaryParagraphs[idx] || '';
                      const accent =
                        idx === 0 ? 'rgba(99,147,170,0.35)' : 'rgba(224,122,63,0.35)';
                      const label = idx === 0 ? 'Snapshot' : 'Trajectory';
                      const Icon = idx === 0 ? PersonSearch : TrendingUp;
                      return (
                        <Paper
                          key={`para-${idx}`}
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: accent,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,250,255,0.9))',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                            height: '100%',
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.25 }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(69,112,137,0.12)',
                                border: '1px solid rgba(69,112,137,0.35)',
                              }}
                            >
                              <Icon sx={{ fontSize: 26, color: 'primary.main' }} />
                            </Box>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                color: 'text.primary',
                              }}
                            >
                              {label}
                            </Typography>
                          </Stack>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.96rem',
                              lineHeight: 1.7,
                              color: 'text.primary',
                            }}
                          >
                            {renderParagraphWithTooltips(para)}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'rgba(47,133,90,0.35)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,250,255,0.9))',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.25 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(69,112,137,0.12)',
                          border: '1px solid rgba(69,112,137,0.35)',
                        }}
                      >
                        <AutoAwesome sx={{ fontSize: 26, color: 'primary.main' }} />
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          fontSize: '0.9rem',
                          color: 'text.primary',
                        }}
                      >
                        A New Way Forward
                      </Typography>
                    </Stack>
                    {renderNarrativeWithBullets(summaryParagraphs[2] || '')}
                  </Paper>
                </Stack>
              ) : (
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>
                  {isLoading ? 'Summary is being generated...' : 'No summary available.'}
                </Typography>
              )}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/trait-selection')}
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', px: 4 }}
                >
                  I'm Ready for Growth
                </Button>
              </Box>
            </Paper>

            {showInlineTraitSelection && (
            <Box sx={{ mt: 6, mb: 4 }}>
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
            )}

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
                onClick={openAgentMenu}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 5, py: 1.5, bgcolor: '#457089', color: 'white', '&:hover': { bgcolor: '#375d78' } }}
              >
                Rerun with Different Agent
              </Button>
              <Menu
                anchorEl={agentMenuAnchor}
                open={Boolean(agentMenuAnchor)}
                onClose={closeAgentMenu}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} onClick={() => handleAgentMenuSelect(agent.id)}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Menu>
            </Stack>
          </Stack>
        )}
        </Box>
      </Container>
    </Box>
  );
}

export default Summary;
