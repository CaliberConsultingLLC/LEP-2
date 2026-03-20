// src/pages/Summary.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Menu,
} from '@mui/material';
import { Warning, Lightbulb, CheckCircle, TrendingUp, AltRoute, OutlinedFlag, WrongLocationOutlined, ReportProblemOutlined } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import traitSystem from '../data/traitSystem';
import { intakeContext } from '../data/intakeContext';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';


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
  const activeRunIdRef = useRef(0);

  const persistSummaryCache = async ({ data, agentId, text, areas }) => {
    const uid = String(auth?.currentUser?.uid || '').trim();
    if (!uid || !text) return;
    const savedAt = new Date().toISOString();

    await setDoc(
      doc(db, 'responses', uid),
      {
        ownerUid: uid,
        ownerEmail: String(data?.email || '').trim(),
        ownerName: String(data?.name || '').trim(),
        latestFormData: data,
        intakeStatus: {
          started: true,
          complete: true,
          updatedAt: new Date().toISOString(),
        },
        summaryCache: {
          aiSummary: text,
          focusAreas: Array.isArray(areas) ? areas : [],
          selectedAgent: agentId || 'balancedMentor',
          savedAt,
        },
      },
      { merge: true }
    );
    localStorage.setItem('summarySavedAt', savedAt);
  };

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
      const decisionContext = [
        data?.decisionPace,
        data?.teamPerception,
        data?.projectApproach,
        data?.responsibilities,
        data?.role,
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      const impactTerms = /\b(trust|clarity|alignment|pace|ownership|engagement|morale|confidence|friction|execution)\b/g;
      const contextTerms = new Set(
        decisionContext
          .replace(/[^a-z\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3)
      );
      const normalizeMarkerText = (value) => {
        const src = String(value || '')
          .replace(/[.*_`#]/g, '')
          .replace(/\byou (may|might|tend to|often)\b/gi, '')
          .replace(/\bthis can\b/gi, '')
          .replace(/\bthis pattern\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        const words = src.split(' ').filter(Boolean).slice(0, 9);
        while (words.length < 6) words.push('over time');
        return words.join(' ').replace(/\s+over time\b/g, ' over time');
      };
      const scoreCandidate = (candidate) => {
        const c = String(candidate || '').toLowerCase();
        const words = c.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
        const overlap = words.filter((w) => contextTerms.has(w)).length;
        const impactHits = (c.match(impactTerms) || []).length;
        return (overlap * 2) + impactHits;
      };
      const underuse = Array.isArray(subTrait.riskSignals?.underuse) ? subTrait.riskSignals.underuse : [];
      const sorted = underuse
        .map((item) => ({ item, score: scoreCandidate(item) }))
        .sort((a, b) => b.score - a.score);
      const selectedMarker = sorted[0]?.item || underuse[0];
      const example = normalizeMarkerText(selectedMarker)
        || `Decision confidence drops when ${subTrait.name.toLowerCase()} is inconsistent`;
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
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 35000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const runCampaignPrefetch = async (text, data, runId) => {
    if (!text) return;
    try {
      const campaignResp = await fetchWithTimeout('/api/get-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ aiSummary: text, sessionId: data?.sessionId || null }),
      }, 20000);

      if (!campaignResp.ok) return;
      const campaignData = await campaignResp.json();
      if (activeRunIdRef.current !== runId) return;
      if (campaignData?.campaign) {
        setAiCampaign(campaignData.campaign);
        localStorage.setItem('aiCampaign', JSON.stringify(campaignData.campaign));
      }
    } catch (campaignErr) {
      // Non-blocking by design; campaign can still be generated later in flow.
      console.warn('Background campaign prefetch failed:', campaignErr?.name || campaignErr?.message || campaignErr);
    }
  };

  // get most recent intake (or fall back to route formData), then call /get-ai-summary
  const runSummary = async (overrideAgentId) => {
    const runId = Date.now();
    activeRunIdRef.current = runId;
    setIsLoading(true);
    setError(null);

    try {
      // 1) Resolve intake data from route first, then localStorage fallback
      const routeData = (formDataFromRoute && Object.keys(formDataFromRoute).length)
        ? formDataFromRoute
        : null;
      let localData = null;
      try {
        const raw = localStorage.getItem('latestFormData');
        localData = raw ? JSON.parse(raw) : null;
      } catch {
        localData = null;
      }
      const data = routeData || localData || {};

      if (!Object.keys(data).length) {
        throw new Error('No intake data found. Complete intake or use Dev Skip first.');
      }

      setSummaryData(data);

      // 2) choose agent
      const validAgentIds = agents.map((a) => a.id);
      const baseAgent =
        (overrideAgentId && validAgentIds.includes(overrideAgentId) && overrideAgentId) ||
        (data?.selectedAgent && validAgentIds.includes(data.selectedAgent) && data.selectedAgent) ||
        'balancedMentor';
      setSelectedAgent(baseAgent);

      // 3) request the 4-paragraph summary (canonical format)
      const summaryResp = await fetchWithTimeout('/api/get-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, selectedAgent: baseAgent }),
      }, 35000);

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
      if (activeRunIdRef.current !== runId) return;
      const text = payload?.aiSummary || '';
      setAiSummary(text);

      if (Array.isArray(payload?.focusAreas) && payload.focusAreas.length === 5) {
        setFocusAreas(payload.focusAreas);
        localStorage.setItem('focusAreas', JSON.stringify(payload.focusAreas));
      }

      if (text) {
        localStorage.setItem('aiSummary', text);
        try {
          await persistSummaryCache({
            data,
            agentId: baseAgent,
            text,
            areas: Array.isArray(payload?.focusAreas) ? payload.focusAreas : focusAreas,
          });
        } catch (persistErr) {
          console.warn('Failed to cache summary to Firestore:', persistErr);
        }
      }
      // Unblock UI immediately after summary returns.
      setIsLoading(false);
      // Continue campaign generation in background to improve perceived responsiveness.
      runCampaignPrefetch(text, data, runId);
    } catch (e) {
      if (activeRunIdRef.current !== runId) return;
      const isTimeout = e?.name === 'AbortError';
      setError('Failed to generate summary: ' + (e?.message || e));
      if (isTimeout) {
        setError('Summary request timed out. Please try rerunning.');
      }
      setAiSummary('');
    }
    // Finalize only if this is still the latest run.
    if (activeRunIdRef.current === runId) setIsLoading(false);
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

  const summarySections = (aiSummary || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);

  const journeyStages = useMemo(
    () => ([
      {
        id: 'trailhead',
        label: 'Trailhead',
        title: 'Mirror The Current Signal',
        subtitle: 'Your clearest current-state leadership reflection.',
        icon: WrongLocationOutlined,
        accent: 'rgba(99,147,170,0.38)',
        mode: 'paragraph',
        text: summarySections[0] || '',
      },
      {
        id: 'markers',
        label: 'Trail Markers',
        title: 'Notice The Recurring Moments',
        subtitle: 'Signals that repeatedly show up in pressure and momentum.',
        icon: OutlinedFlag,
        accent: 'rgba(224,122,63,0.42)',
        mode: 'markers',
        text: summarySections[1] || '',
      },
      {
        id: 'hazards',
        label: 'Upcoming Hazards',
        title: 'What May Break If Left Unaddressed',
        subtitle: 'The likely deficits, barriers, and performance risks if this pattern continues.',
        icon: ReportProblemOutlined,
        accent: 'rgba(99,147,170,0.4)',
        mode: 'trajectory',
        text: summarySections[2] || '',
      },
      {
        id: 'new-trail',
        label: 'A New Trail',
        title: 'Choose Where To Build Forward',
        subtitle: 'Focused growth traits that create a sharper leadership trajectory.',
        icon: AltRoute,
        accent: 'rgba(47,133,90,0.42)',
        mode: 'narrative',
        text: summarySections[3] || '',
      },
    ]),
    [summarySections]
  );

  useEffect(() => {
    setActiveJourneyStep(0);
  }, [aiSummary]);

  const renderParagraphWithTooltips = (text) => String(text || '').replace(/\*\*/g, '');

  const renderNarrativeWithBullets = (text) => {
    const lines = String(text || '').split('\n');
    const bulletLines = lines.filter((line) => line.trim().startsWith('- '));
    if (!bulletLines.length) {
      return (
        <Typography
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            fontSize: '0.96rem',
            lineHeight: 1.6,
            color: 'text.primary',
          }}
        >
          {renderParagraphWithTooltips(text)}
        </Typography>
      );
    }
    return (
      <Stack spacing={1.15} alignItems="center">
        {bulletLines.map((line, idx) => {
          const content = line.replace(/^\s*-\s*/, '');
          const parts = content.split('—');
          const head = parts[0]?.replace(/\*\*/g, '').trim();
          const tail = parts.slice(1).join('—').trim();
          return (
            <Box key={`bullet-${idx}`} sx={{ py: 0.35 }}>
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '0.96rem',
                  lineHeight: 1.62,
                  color: 'text.primary',
                  textAlign: 'center',
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
      </Stack>
    );
  };

  const renderTrailMarkers = (text) => {
    const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const bulletLines = lines.filter((line) => line.startsWith('- '));
    return (
      <Stack spacing={1.1} alignItems="center">
        {(bulletLines.length ? bulletLines : ['- No dominant trail markers detected yet.']).map((line, idx) => (
          <Box key={`marker-${idx}`} sx={{ py: 0.3 }}>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '0.96rem',
                lineHeight: 1.6,
                color: 'text.primary',
                textAlign: 'center',
              }}
            >
              {line.replace(/^\s*-\s*/, '')}
            </Typography>
          </Box>
        ))}
      </Stack>
    );
  };

  const renderTrajectory = (text) => {
    const chunks = String(text || '')
      .replace(/^\s*#+\s*/gm, '')
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const merged = chunks.join(' ').replace(/\s+/g, ' ').trim();
    const sentences = merged
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`));
    const limited = sentences.slice(0, 6).join(' ');
    return (
      <Typography
        sx={{
          fontFamily: 'Gemunu Libre, sans-serif',
          fontSize: '1rem',
          lineHeight: 1.65,
          color: 'text.primary',
          textAlign: 'center',
        }}
      >
        {renderParagraphWithTooltips(limited)}
      </Typography>
    );
  };

  const renderJourneyStageBody = (stage) => {
    if (!stage) return null;
    if (stage.mode === 'markers') return renderTrailMarkers(stage.text);
    if (stage.mode === 'trajectory') return renderTrajectory(stage.text);
    if (stage.mode === 'narrative') return renderNarrativeWithBullets(stage.text);
    return (
      <Typography
        sx={{
          fontFamily: 'Gemunu Libre, sans-serif',
          fontSize: { xs: '1rem', md: '1.08rem' },
          lineHeight: 1.72,
          color: '#1E3449',
          textAlign: 'center',
        }}
      >
        {renderParagraphWithTooltips(stage.text)}
      </Typography>
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
      overflowY: 'auto',
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
      <ProcessTopRail titleOverride="Leadership Reflection" />
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
          <Stack spacing={2.25} sx={{ width: '100%' }}>
            {/* Summary Output */}
            <Paper
              sx={{
                p: { xs: 2, md: 2.6 },
                pb: { xs: 2.2, md: 2.8 },
                borderRadius: 3.2,
                border: '1px solid rgba(69,112,137,0.45)',
                background: 'linear-gradient(158deg, rgba(252,255,255,0.95), rgba(226,237,249,0.86))',
                boxShadow: '0 18px 42px rgba(15,23,42,0.22)',
                mb: 0,
                overflow: 'visible',
              }}
            >
              {summarySections.length ? (
                <Stack spacing={2}>
                  <Paper
                    sx={{
                      p: { xs: 1.35, md: 1.7 },
                      borderRadius: 2.4,
                      border: '1px solid rgba(61,96,126,0.34)',
                      background: 'linear-gradient(145deg, rgba(64,91,118,0.86), rgba(56,82,109,0.74))',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                      <Box sx={{ width: { xs: 0, md: 170 } }} />
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: { xs: '1.16rem', md: '1.36rem' }, fontWeight: 800, color: 'rgba(251,253,255,0.98)', lineHeight: 1.25, textAlign: 'center' }}>
                          Reflecting on your Leadership Approach
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={openAgentMenu}
                        sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', px: 2.7, py: 1.05, bgcolor: '#E07A3F', color: 'white', '&:hover': { bgcolor: '#C85A2A' } }}
                      >
                        Agent Selection
                      </Button>
                    </Stack>
                  </Paper>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.34fr 0.66fr' }, gap: 1.5 }}>
                    <Paper
                      sx={{
                        p: { xs: 1.2, md: 1.45 },
                        borderRadius: 2.4,
                        border: '1px solid rgba(67,102,131,0.33)',
                        background: 'linear-gradient(168deg, rgba(255,255,255,0.94), rgba(241,248,255,0.88))',
                        boxShadow: '0 7px 16px rgba(12,21,34,0.1)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.77rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#496783', mb: 1.05, textAlign: 'center' }}>
                        Reflection Journey
                      </Typography>
                      <Stack spacing={0.95} alignItems="center">
                        {journeyStages.map((stage, idx) => {
                          const Icon = stage.icon;
                          const active = idx === activeJourneyStep;
                          return (
                            <Box
                              key={stage.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                                width: '100%',
                                maxWidth: 360,
                                justifyContent: 'center',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 55,
                                  height: 55,
                                  borderRadius: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: active ? 'rgba(224,122,63,0.24)' : 'rgba(69,112,137,0.09)',
                                  border: '1px solid rgba(69,112,137,0.32)',
                                  flexShrink: 0,
                                }}
                              >
                                <Icon sx={{ fontSize: 35, color: active ? '#2E5573' : '#496783' }} />
                              </Box>
                              <Button
                                onClick={() => setActiveJourneyStep(idx)}
                                variant="outlined"
                                sx={{
                                  flex: 1,
                                  minHeight: 56,
                                  borderRadius: 1.8,
                                  borderColor: 'rgba(85,119,145,0.32)',
                                  bgcolor: active ? 'rgba(224,122,63,0.22)' : 'rgba(255,255,255,0.62)',
                                  color: '#2B4862',
                                  justifyContent: 'center',
                                  textTransform: 'none',
                                  px: 1.25,
                                  '&:hover': {
                                    borderColor: 'rgba(85,119,145,0.46)',
                                    bgcolor: active ? 'rgba(224,122,63,0.28)' : 'rgba(255,255,255,0.95)',
                                  },
                                }}
                              >
                                <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', lineHeight: 1.1, textAlign: 'center' }}>
                                  {stage.label}
                                </Typography>
                              </Button>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Paper>

                    <Paper
                      sx={{
                        p: { xs: 1.75, md: 2.2 },
                        borderRadius: 2.4,
                        border: '1px solid rgba(69,112,137,0.36)',
                        background: 'linear-gradient(176deg, rgba(255,255,255,0.97), rgba(246,251,255,0.92))',
                        boxShadow: '0 8px 20px rgba(12,21,34,0.11)',
                        position: 'relative',
                      }}
                    >
                      {(() => {
                        const stage = journeyStages[activeJourneyStep] || journeyStages[0];
                        const StageIcon = stage.icon;
                        return (
                          <>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: { xs: 15, md: 18 },
                                left: { xs: 15, md: 18 },
                                width: 62,
                                height: 62,
                                borderRadius: 2.2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(69,112,137,0.14)',
                                border: '1px solid rgba(69,112,137,0.34)',
                              }}
                            >
                              <StageIcon sx={{ fontSize: 38, color: 'primary.main' }} />
                            </Box>
                            <Stack spacing={1} alignItems="center" sx={{ mb: 1.2, pt: { xs: 0.3, md: 0.45 } }}>
                              <Typography sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '1.12rem', color: '#2B4862', textAlign: 'center' }}>
                                {stage.label}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: stage.id === 'trailhead' ? '0.98rem' : '1rem',
                                  color: '#3B5C78',
                                  maxWidth: 540,
                                  lineHeight: 1.45,
                                  textAlign: 'center',
                                  whiteSpace: stage.id === 'trailhead' ? 'nowrap' : 'normal',
                                  overflow: stage.id === 'trailhead' ? 'hidden' : 'visible',
                                  textOverflow: stage.id === 'trailhead' ? 'ellipsis' : 'clip',
                                  px: { xs: 1.1, md: 0 },
                                }}
                              >
                                {stage.subtitle}
                              </Typography>
                            </Stack>

                            <Box sx={{ borderRadius: 2, border: '1px solid rgba(99,147,170,0.28)', bgcolor: 'rgba(255,255,255,0.88)', p: { xs: 1.5, md: 1.9 } }}>
                              {renderJourneyStageBody(stage)}
                            </Box>

                          </>
                        );
                      })()}
                    </Paper>
                  </Box>

                  <Paper
                    sx={{
                      p: { xs: 1.2, md: 1.35 },
                      borderRadius: 2.1,
                      border: '1px solid rgba(69,112,137,0.24)',
                      background: 'linear-gradient(180deg, rgba(247,252,255,0.82), rgba(236,246,255,0.7))',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.84rem', color: '#2E516E', lineHeight: 1.55, textAlign: 'center' }}>
                      This reflection is intentionally staged to keep your attention on one insight layer at a time: first truth, then recurring patterns, then hidden cost, and finally your forward trail.
                    </Typography>
                  </Paper>
                </Stack>
              ) : (
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>
                  {isLoading ? 'Summary is being generated...' : 'No summary available.'}
                </Typography>
              )}
              <Box sx={{ textAlign: 'center', mt: 2.3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/trait-selection')}
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', px: 4.6, py: 1.15, fontWeight: 700 }}
                >
                  I'm Ready to Take a New Trail
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

            <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ mt: 1.25 }}>
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
