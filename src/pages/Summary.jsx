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
  Tooltip,
} from '@mui/material';
import { Warning, Lightbulb, CheckCircle, TrendingUp, AltRoute, OutlinedFlag, WrongLocationOutlined, ReportProblemOutlined } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CairnGuidePanel from '../components/CairnGuidePanel';
import SummaryBriefingModal from '../components/SummaryBriefingModal';
import GuidePickerMenu from '../components/GuidePickerMenu';
import { useCairnTheme } from '../config/runtimeFlags';
import { useDarkMode } from '../hooks/useDarkMode';
import { useGuide } from '../context/GuideContext';
import traitSystem from '../data/traitSystem';
import { intakeContext } from '../data/intakeContext';
import { scoreIntakeAgainstCoverage, isEligibleForFocusRecommendation } from '../data/intakeTraitCoverage';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { buttons, colors, fonts, radii, shadows, type } from '../styles/tokens';
import { GUIDE_VOICE_IDS, getGuideVoice, resolveGuideVoiceId } from '../data/guideVoices';
import { flattenGuideSummary, pickGuideSummary } from '../utils/guideSummary';
import { demoRequestFields } from '../utils/demoMode';
import { getSummaryBriefing } from '../data/guideBriefings';


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
  const [trailheadHighlights, setTrailheadHighlights] = useState(null);
  const showInlineTraitSelection = false;
  const [summariesByGuide, setSummariesByGuide] = useState({});
  const [agentMenuAnchor, setAgentMenuAnchor] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [guideMenuAnchor, setGuideMenuAnchor] = useState(null);
  const activeRunIdRef = useRef(0);
  const [isDark] = useDarkMode();
  const { persona, personaId, hidden, toggleHidden, setHidden, setSuppress, setGuideStep } = useGuide();

  useEffect(() => {
    if (!useCairnTheme) return undefined;
    setSuppress(true);
    return () => setSuppress(false);
  }, [setSuppress, useCairnTheme]);

  const persistSummaryCache = async ({ data, guideId, text, areas, highlights, summaries }) => {
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
          summariesByGuide: summaries && typeof summaries === 'object' ? summaries : {},
          focusAreas: Array.isArray(areas) ? areas : [],
          trailheadHighlights: highlights || null,
          selectedGuideId: guideId || 'mentor',
          selectedAgent: guideId || 'mentor',
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

    const addScore = (traitId, amount = 1) => {
      if (!traitId || scores[traitId] == null) return;
      scores[traitId] += amount;
    };

    // Coverage-map behavior scoring (shared with AI path eligibility rules)
    const { scores: coverageScores, subScores } = scoreIntakeAgainstCoverage(data);
    Object.entries(coverageScores).forEach(([traitId, amount]) => addScore(traitId, amount));

    // Norms-based scoring (modern core trait IDs on traitsUndermined)
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
        (item.traitsUndermined || []).forEach((t) => addScore(t, weight));
      });
    }

    // ---- select top 5 traits ----
    const ranked = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => CORE_TRAITS.find((t) => t.id === id))
      .filter(Boolean);

    const pickSubTrait = (trait) => {
      const eligible = (trait?.subTraits || []).filter((st) => isEligibleForFocusRecommendation(st));
      if (!eligible.length) return null;
      // Prefer subtraits that received coverage-map signal for this core trait
      const rankedSubs = eligible
        .map((st) => ({ st, score: subScores[`${trait.id}:${st.id}`] || 0 }))
        .sort((a, b) => b.score - a.score);
      if (rankedSubs[0]?.score > 0) return rankedSubs[0].st;
      const key = JSON.stringify({
        role: data.role || '',
        industry: data.industry || '',
        trait: trait.id,
      });
      let hash = 0;
      for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % eligible.length;
      return eligible[hash] || eligible[0];
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
        whyYou: '',
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

  // agent selection — six Compass guides
  const agents = GUIDE_VOICE_IDS.map((id) => ({
    id,
    name: getGuideVoice(id).name,
  }));

  const applyGuideVoice = (map, guideId, fallbackText = '') => {
    const picked = pickGuideSummary(map, guideId, fallbackText);
    const flat = flattenGuideSummary(picked.summary);
    if (flat) {
      setAiSummary(flat);
      localStorage.setItem('aiSummary', flat);
    }
    setSelectedAgent(picked.id);
    localStorage.setItem('selectedGuideId', picked.id);
    return picked;
  };

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
        body: JSON.stringify({ aiSummary: text, sessionId: data?.sessionId || null, ...demoRequestFields() }),
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

      // 2) choose guide
      const baseGuide = resolveGuideVoiceId(
        overrideAgentId || personaId || data?.guideId || data?.selectedAgent || 'mentor'
      );
      setSelectedAgent(baseGuide);

      // 3) request all six guide narratives from one insight map
      const summaryResp = await fetchWithTimeout('/api/get-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, guideId: baseGuide, selectedAgent: baseGuide, ...demoRequestFields() }),
      }, 90000);

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
      const map = payload?.summariesByGuide && typeof payload.summariesByGuide === 'object'
        ? payload.summariesByGuide
        : {};
      setSummariesByGuide(map);
      if (Object.keys(map).length) {
        localStorage.setItem('summariesByGuide', JSON.stringify(map));
      }
      const picked = applyGuideVoice(map, payload?.selectedGuideId || baseGuide, payload?.aiSummary || '');
      const text = flattenGuideSummary(picked.summary) || payload?.aiSummary || '';
      setAiSummary(text);

      if (Array.isArray(payload?.focusAreas) && payload.focusAreas.length === 5) {
        setFocusAreas(payload.focusAreas);
        localStorage.setItem('focusAreas', JSON.stringify(payload.focusAreas));
      }

      const highlights = payload?.trailheadHighlights || null;
      if (highlights?.strength?.text || highlights?.focus?.text) {
        setTrailheadHighlights(highlights);
        localStorage.setItem('trailheadHighlights', JSON.stringify(highlights));
      }

      if (text) {
        localStorage.setItem('aiSummary', text);
        try {
          await persistSummaryCache({
            data,
            guideId: picked.id,
            text,
            areas: Array.isArray(payload?.focusAreas) ? payload.focusAreas : focusAreas,
            highlights,
            summaries: map,
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
    // Cairn/staging is a static review path: never regenerate the summary or
    // prefetch a live campaign unless this page is running outside Cairn.
    const liveFromIntake = Boolean(
      state?.liveIntake
      || formDataFromRoute?.intakeClarification
      || (formDataFromRoute?.societalResponses && state?.formData)
    );
    if (useCairnTheme && !liveFromIntake) {
      const cachedSummary = (localStorage.getItem('aiSummary') || '').trim();
      let focusAreasValid = false;
      try {
        const parsed = JSON.parse(localStorage.getItem('focusAreas') || '[]');
        focusAreasValid = Array.isArray(parsed) && parsed.length === 5;
      } catch { /* ignore */ }

      if (cachedSummary && focusAreasValid) {
        setAiSummary(cachedSummary);
        try {
          const cachedMap = JSON.parse(localStorage.getItem('summariesByGuide') || '{}');
          if (cachedMap && typeof cachedMap === 'object') {
            setSummariesByGuide(cachedMap);
            applyGuideVoice(cachedMap, personaId, cachedSummary);
          }
        } catch { /* ignore */ }
        try {
          const cachedHighlights = JSON.parse(localStorage.getItem('trailheadHighlights') || 'null');
          if (cachedHighlights?.strength?.text || cachedHighlights?.focus?.text) {
            setTrailheadHighlights(cachedHighlights);
          }
        } catch { /* ignore */ }
        setIsLoading(false);
        return;
      }
      setError('Static staging summary data is missing. Use the Stage Navigator reset to reseed the review flow.');
      setIsLoading(false);
      return;
    }
    runSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!summariesByGuide || !Object.keys(summariesByGuide).length) return;
    applyGuideVoice(summariesByGuide, personaId, aiSummary);
    // Swap only — do not regenerate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  const currentStageId = ['trailhead', 'markers', 'hazards', 'new-trail'][activeJourneyStep] || 'trailhead';
  const briefingFirstName = userName ? userName.split(' ')[0] : '';

  useEffect(() => {
    setGuideStep(currentStageId);
    return () => setGuideStep('default');
  }, [currentStageId, setGuideStep]);

  useEffect(() => {
    if (!useCairnTheme || isLoading) return undefined;
    const readSeen = () => {
      try { return JSON.parse(sessionStorage.getItem('summaryBriefingSeen') || '{}'); }
      catch { return {}; }
    };
    const ceremonyOpen = () => {
      try { return sessionStorage.getItem('journeyCeremonyOpen') === '1'; }
      catch { return false; }
    };
    if (readSeen()[currentStageId]) {
      setBriefingOpen(false);
      return undefined;
    }
    const show = () => {
      if (readSeen()[currentStageId]) return;
      if (ceremonyOpen()) return;
      setBriefingOpen(true);
    };
    window.addEventListener('compass:journey-ceremony-done', show);
    const timer = window.setTimeout(show, 180);
    return () => {
      window.removeEventListener('compass:journey-ceremony-done', show);
      window.clearTimeout(timer);
    };
  }, [currentStageId, isLoading]);

  const dismissBriefing = () => {
    try {
      const seen = JSON.parse(sessionStorage.getItem('summaryBriefingSeen') || '{}');
      seen[currentStageId] = true;
      sessionStorage.setItem('summaryBriefingSeen', JSON.stringify(seen));
    } catch { /* ignore */ }
    setBriefingOpen(false);
  };

  const openAgentMenu = (event) => {
    setAgentMenuAnchor(event.currentTarget);
  };

  const closeAgentMenu = () => {
    setAgentMenuAnchor(null);
  };

  const handleAgentMenuSelect = async (agentId) => {
    closeAgentMenu();
    if (!agentId) return;
    if (summariesByGuide[agentId] || Object.keys(summariesByGuide).length) {
      applyGuideVoice(summariesByGuide, agentId, aiSummary);
      return;
    }
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

  const renderParagraphWithTooltips = (text) => {
    const raw = String(text || '');
    // Support light emphasis: **bold**, *italic*, _underline_
    const parts = [];
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
    let last = 0;
    let match;
    let key = 0;
    while ((match = pattern.exec(raw)) !== null) {
      if (match.index > last) parts.push(raw.slice(last, match.index));
      const token = match[0];
      if (token.startsWith('**')) {
        parts.push(<strong key={`em-${key++}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*')) {
        parts.push(<em key={`em-${key++}`}>{token.slice(1, -1)}</em>);
      } else {
        parts.push(<u key={`em-${key++}`}>{token.slice(1, -1)}</u>);
      }
      last = match.index + token.length;
    }
    if (last < raw.length) parts.push(raw.slice(last));
    return parts.length ? parts : raw;
  };

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

  // ── Cairn theme render ──────────────────────────────────────────────────────
  if (useCairnTheme) {
    const ROMAN = ['I', 'II', 'III', 'IV'];
    const cairnJourneyStages = journeyStages.map((stage) => {
      if (stage.id === 'trailhead') {
        return { ...stage, label: 'Trailhead', title: 'Reflecting on Current Reality', subtitle: 'Mirror The Current Signal', icon: OutlinedFlag };
      }
      if (stage.id === 'markers') {
        return { ...stage, label: 'Trail Markers', title: 'Noticing Patterns', subtitle: 'Notice The Recurring Moments', icon: AltRoute };
      }
      if (stage.id === 'hazards') {
        return {
          ...stage,
          label: 'Future Hazards',
          title: 'Understanding the Cost',
          subtitle: 'What This May Cost If Left Unmanaged',
          icon: ReportProblemOutlined,
        };
      }
      if (stage.id === 'new-trail') {
        return { ...stage, label: 'A New Trail', title: 'Pivoting Towards Growth', subtitle: 'Choose Where To Build Forward', icon: TrendingUp };
      }
      return stage;
    });
    const activeStage = cairnJourneyStages[activeJourneyStep] || cairnJourneyStages[0];

    // Read guide persona for sidebar footer
    let guideName = 'Mentor';
    try {
      const g = JSON.parse(localStorage.getItem('cairnGuide') || '{}');
      if (g?.personaId) guideName = g.personaId.charAt(0).toUpperCase() + g.personaId.slice(1);
    } catch { /* ignore */ }

    const firstName = userName ? userName.split(' ')[0] : '';

    const splitSentences = (text) => String(text || '')
      .replace(/\*\*/g, '')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const stripLeadingListMarker = (value) => String(value || '')
      .replace(/^\s*(?:EXAMPLE\s*:|[-–—•●▪·‣*])\s*/i, '')
      .replace(/\*\*/g, '')
      .trim();

    const cleanSituationCopy = (raw) => {
      let content = stripLeadingListMarker(raw);
      content = content.replace(/^[^—:]{1,48}[:—]\s*/, '');
      content = content.replace(/^watch for moments when\s+/i, '');
      content = content.replace(/^if this remains unaddressed,?\s+/i, '');
      content = content.replace(/^look for\s+/i, '');
      if (!content) return '';
      return content.charAt(0).toUpperCase() + content.slice(1);
    };

    const padFramingReflection = (text, mode) => {
      const defaults = mode === 'markers'
        ? [
          'Pay attention here — a few recurring moments already show how this pattern lands with your team.',
          'These are the places worth watching in real time as you lead.',
          'Notice where the same friction shows up when pressure rises.',
          'The room already knows these tells, even if nobody names them.',
          'Sit with the ones that feel too familiar before you move on.',
        ]
        : [
          'If those markers keep running, the road ahead gets more expensive for people and performance.',
          'This is the call to take that pattern seriously before it hardens into the team’s default rhythm.',
          'The longer it stays unaddressed, the more trust and execution both pay for it.',
          'People who stay will adapt around it, and that adaptation is the cost.',
          'You still have a say in whether this becomes the year that follows.',
        ];
      const list = splitSentences(text);
      for (const s of defaults) {
        if (list.length >= 5) break;
        if (!list.includes(s)) list.push(s);
      }
      while (list.length < 5) list.push(defaults[list.length % defaults.length]);
      return list.slice(0, 7).join(' ');
    };

    const buildSituationStage = (text, mode) => {
      const defaultIntro = mode === 'markers'
        ? 'Pay attention here — a few situations may already be showing up as you lead.'
        : 'If this pattern keeps running, these are costs that can show up down the road.';
      const raw = String(text || '').trim();
      if (!raw) {
        return {
          reflection: padFramingReflection('', mode),
          prompt: defaultIntro,
          situations: [],
        };
      }

      const isExampleLine = (line) => {
        const t = String(line || '').trim();
        if (/^EXAMPLE\s*:/i.test(t)) return true;
        if (!/^[-–—•●▪·‣*]\s+/.test(t)) return false;
        const withoutBullet = t.replace(/^[-–—•●▪·‣*]\s+/, '');
        const sentenceCount = splitSentences(withoutBullet).length;
        return sentenceCount < 2;
      };
      const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
      const exampleLines = lines.filter(isExampleLine);
      const reflection = lines
        .filter((line) => !isExampleLine(line))
        .map(stripLeadingListMarker)
        .filter(Boolean)
        .join(' ')
        .trim();

      if (exampleLines.length) {
        const situations = exampleLines.map(cleanSituationCopy).filter(Boolean).slice(0, 2);
        return {
          reflection: padFramingReflection(reflection, mode),
          prompt: defaultIntro,
          situations,
        };
      }

      const sentences = splitSentences(raw);
      if (sentences.length <= 7) {
        return {
          reflection: padFramingReflection(sentences.slice(0, 5).join(' ') || sentences[0] || '', mode),
          prompt: defaultIntro,
          situations: sentences.slice(5).map(cleanSituationCopy).filter(Boolean).slice(0, 2),
        };
      }

      const framingCount = 7;
      const reflectionText = sentences.slice(0, framingCount).join(' ');
      const rest = sentences.slice(framingCount);
      const situations = [];
      if (rest.length <= 2) {
        rest.forEach((s) => {
          const cleaned = cleanSituationCopy(s);
          if (cleaned) situations.push(cleaned);
        });
      } else {
        const perCard = Math.ceil(rest.length / 2);
        for (let i = 0; i < 2; i += 1) {
          const chunk = rest.slice(i * perCard, (i + 1) * perCard).slice(0, 2).join(' ');
          const cleaned = cleanSituationCopy(chunk);
          if (cleaned) situations.push(cleaned);
        }
      }
      return {
        reflection: padFramingReflection(reflectionText, mode),
        prompt: defaultIntro,
        situations: situations.slice(0, 2),
      };
    };
    const getBackTarget = () => {
      if (activeJourneyStep === 0) return { label: 'Intake', action: () => navigate('/form?stage=intake') };
      return { label: cairnJourneyStages[activeJourneyStep - 1]?.label || 'Back', action: () => setActiveJourneyStep((s) => Math.max(0, s - 1)) };
    };
    const getNextTarget = () => {
      if (activeJourneyStep === cairnJourneyStages.length - 1) return { label: 'Traits', action: () => navigate('/trait-selection') };
      return { label: cairnJourneyStages[activeJourneyStep + 1]?.label || 'Next', action: () => setActiveJourneyStep((s) => Math.min(cairnJourneyStages.length - 1, s + 1)) };
    };
    const backTarget = getBackTarget();
    const nextTarget = getNextTarget();

    const RightRail = (
      <CairnGuidePanel
        persona={persona}
        hidden={hidden}
        setHidden={setHidden}
        toggleHidden={toggleHidden}
        isDark={isDark}
        presenceOnly
        commentary=""
        owlPose={persona.poses.read || persona.poses.idle}
      />
    );

    const STAGE_VISUAL = {
      trailhead: { wash: 'rgba(94,145,176,0.10)', accent: colors.navy400, roman: 'I' },
      markers: { wash: 'rgba(224,122,63,0.08)', accent: colors.orange, roman: 'II' },
      hazards: { wash: 'rgba(192,97,42,0.08)', accent: colors.orangeDeep, roman: 'III' },
      'new-trail': { wash: 'rgba(47,133,90,0.08)', accent: colors.green, roman: 'IV' },
    };
    const RAIL_KICKERS = {
      trailhead: 'Current-state mirror',
      markers: 'Recurring moments',
      hazards: 'Preventable costs',
      'new-trail': 'Growth leverage',
    };
    const activeVisual = STAGE_VISUAL[activeStage.id] || STAGE_VISUAL.trailhead;
    const stageBodyText = (
      activeStage.id === 'new-trail'
        ? (summarySections[3] || activeStage.text)
        : (summarySections[['trailhead', 'markers', 'hazards'].indexOf(activeStage.id)] || activeStage.text)
    );

    const situationStage = (activeStage.id === 'markers' || activeStage.id === 'hazards')
      ? buildSituationStage(stageBodyText, activeStage.id)
      : null;

    const newTrailIntro = (() => {
      if (activeStage.id !== 'new-trail') return '';
      const lines = String(stageBodyText || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const prose = lines
        .map((line) => stripLeadingListMarker(String(line || '').replace(/^\s*EXAMPLE\s*:/i, '')))
        .filter(Boolean)
        .join(' ')
        .replace(/(^|[.!?]\s*)[-–—•●▪·‣*]\s+/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      if (prose) return prose;
      return splitSentences(stageBodyText)
        .map(stripLeadingListMarker)
        .filter(Boolean)
        .slice(0, 10)
        .join(' ');
    })();
    const trailheadDisplay = String(stageBodyText || '').trim();
    const leverageCards = (focusAreas.length ? focusAreas : []).slice(0, 5);

    const bodyType = {
      fontFamily: fonts.sans,
      fontSize: 16,
      lineHeight: 1.7,
      color: colors.ink,
      textAlign: 'left',
      '& strong, & b': { fontWeight: 800, color: colors.navy900 },
      '& em, & i': { fontStyle: 'italic' },
      '& u': { textDecoration: 'underline', textUnderlineOffset: '2px' },
    };

    return (
      <Box
        sx={{
          height: '100vh',
          overflow: 'hidden',
          bgcolor: colors.sand50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <ProcessTopRail
            chapterId="insights"
            activeStepId="summary"
            chip={{ variant: 'sequence', label: 'Stage', current: (activeJourneyStep || 0) + 1, total: 4 }}
          />
        </Box>
        <CompassLayout rightRail={RightRail} viewportFit afterTopbar>
          {error ? (
            <Box sx={{ py: 4 }}>
              <Typography sx={{ fontFamily: fonts.sans, color: 'error.main', mb: 2 }}>{error}</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: '24px',
                alignItems: 'flex-start',
                height: { md: '100%' },
                maxHeight: { md: '100%' },
                overflow: { xs: 'auto', md: 'visible' },
                pr: { md: '12px' },
                '@keyframes nodePulse': {
                  '0%': { transform: 'scale(0.85)', opacity: 0.6 },
                  '70%': { transform: 'scale(1.55)', opacity: 0 },
                  '100%': { transform: 'scale(1.55)', opacity: 0 },
                },
              }}
            >
              <Box
                component="nav"
                aria-label="Your reflection trail"
                sx={{
                  width: { xs: '100%', md: 232 },
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  pt: '18px',
                  pl: '14px',
                  bgcolor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  overflow: 'visible',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fonts.mono,
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: colors.navy500,
                    mb: '22px',
                  }}
                >
                  Your reflection trail
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  {cairnJourneyStages.map((stage, idx) => {
                    const active = idx === activeJourneyStep;
                    const isLast = idx === cairnJourneyStages.length - 1;
                    return (
                      <Box
                        key={stage.id}
                        component="button"
                        type="button"
                        onClick={() => setActiveJourneyStep(idx)}
                        aria-current={active ? 'page' : undefined}
                        sx={{
                          all: 'unset',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          width: '100%',
                          '&:focus-visible': {
                            outline: `3px solid ${colors.orange}`,
                            outlineOffset: 4,
                            borderRadius: radii.sm,
                          },
                        }}
                      >
                        {!isLast && (
                          <Box
                            aria-hidden
                            sx={{
                              position: 'absolute',
                              left: 16,
                              top: 38,
                              bottom: -28,
                              borderLeft: `2px dashed ${colors.sand300}`,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        <Box
                          sx={{
                            position: 'relative',
                            width: 34,
                            height: 34,
                            flexShrink: 0,
                            borderRadius: '50%',
                            bgcolor: active ? colors.orange : colors.surface1,
                            border: active ? `2px solid ${colors.orange}` : `2px solid ${colors.sand300}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                          }}
                        >
                          {active && (
                            <Box
                              aria-hidden
                              sx={{
                                position: 'absolute',
                                inset: -7,
                                borderRadius: '50%',
                                border: `2px solid ${colors.orange}`,
                                animation: 'nodePulse 2.4s ease-out infinite',
                                '@media (prefers-reduced-motion: reduce)': {
                                  animation: 'none',
                                  opacity: 0.35,
                                },
                              }}
                            />
                          )}
                          <Typography
                            sx={{
                              fontFamily: fonts.serif,
                              fontSize: 13,
                              fontWeight: 600,
                              lineHeight: 1,
                              color: active ? colors.surface1 : colors.inkSoft,
                              position: 'relative',
                              zIndex: 1,
                            }}
                          >
                            {ROMAN[idx]}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0, pt: 0.15 }}>
                          <Typography
                            sx={{
                              fontFamily: fonts.sans,
                              fontSize: '13.5px',
                              fontWeight: active ? 800 : 650,
                              lineHeight: 1.2,
                              color: active ? colors.navy900 : colors.inkSoft,
                            }}
                          >
                            {stage.label}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: fonts.sans,
                              fontSize: '10.5px',
                              lineHeight: 1.3,
                              mt: 0.25,
                              color: colors.navy300,
                            }}
                          >
                            {RAIL_KICKERS[stage.id] || stage.subtitle}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Box sx={{ mt: '24px', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.orange, flexShrink: 0 }} />
                  <Typography sx={{ fontFamily: fonts.sans, fontSize: '11.5px', color: colors.inkSoft }}>
                    Guide: <strong>{guideName}</strong>
                  </Typography>
                </Box>

                <Box
                  component="button"
                  type="button"
                  onClick={(event) => setGuideMenuAnchor(event.currentTarget)}
                  sx={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    mt: '16px',
                    width: '100%',
                    minHeight: 36,
                    px: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radii.pill,
                    border: `1.5px solid ${colors.navy900}`,
                    bgcolor: colors.navy900,
                    color: colors.amberSoft,
                    fontFamily: fonts.sans,
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    '&:hover': { bgcolor: colors.navy800 },
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                  }}
                >
                  Hear another guide
                </Box>
                <GuidePickerMenu
                  open={Boolean(guideMenuAnchor)}
                  anchorEl={guideMenuAnchor}
                  onClose={() => setGuideMenuAnchor(null)}
                  isDark={isDark}
                />
              </Box>

              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  alignSelf: 'flex-start',
                  width: '100%',
                  maxHeight: { md: '100%' },
                  position: 'relative',
                  mb: '14px',
                  border: `1px solid ${colors.sand200}`,
                  borderRadius: radii.lg,
                  boxShadow: shadows.card,
                  overflow: 'visible',
                  bgcolor: colors.surface1,
                  background: `linear-gradient(180deg, ${activeVisual.wash} 0%, rgba(255,255,255,0) 46%), ${colors.surface1}`,
                  px: { xs: '22px', md: '36px' },
                  pt: { xs: '28px', md: '32px' },
                  pb: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    right: -9,
                    bottom: 28,
                    width: 18,
                    height: 18,
                    bgcolor: colors.surface1,
                    borderRight: `1px solid ${colors.sand200}`,
                    borderTop: `1px solid ${colors.sand200}`,
                    transform: 'rotate(45deg)',
                    zIndex: 2,
                  },
                }}
              >
                <Typography
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    right: 20,
                    top: -38,
                    fontFamily: fonts.serif,
                    fontWeight: 600,
                    fontSize: 220,
                    lineHeight: 1,
                    color: 'rgba(16,34,60,0.05)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    zIndex: 0,
                  }}
                >
                  {activeVisual.roman}
                </Typography>

                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: 720,
                    width: '100%',
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    maxHeight: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: colors.orangeDeep,
                      textAlign: 'center',
                      mb: 1.1,
                    }}
                  >
                    {`PART ${activeVisual.roman}`}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: fonts.serif,
                      fontWeight: 500,
                      fontSize: 30,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                      color: colors.navy900,
                      textAlign: 'center',
                      mb: 0.65,
                    }}
                  >
                    {activeStage.label}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: fonts.serif,
                      fontStyle: 'italic',
                      fontSize: 15,
                      fontWeight: 500,
                      color: colors.inkSoft,
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}
                  >
                    {activeStage.title}
                  </Typography>
                  <Typography
                    sx={{
                      ...type.eyebrow,
                      textAlign: 'center',
                      mt: 0.85,
                      color: colors.navy500,
                    }}
                  >
                    {`${persona.name} · ${activeStage.label}`}
                  </Typography>

                  <Box
                    aria-hidden
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.15,
                      my: '14px',
                    }}
                  >
                    <Box sx={{ width: 56, borderTop: `1px solid ${activeVisual.accent}`, opacity: 0.7 }} />
                    <Box sx={{ color: activeVisual.accent, fontSize: 8, lineHeight: 1, opacity: 0.9 }}>◆</Box>
                    <Box sx={{ width: 56, borderTop: `1px solid ${activeVisual.accent}`, opacity: 0.7 }} />
                  </Box>

                  {activeStage.id === 'trailhead' && (
                    trailheadDisplay ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'hidden' }}>
                        <Typography sx={bodyType}>
                          {renderParagraphWithTooltips(trailheadDisplay)}
                        </Typography>
                        {(trailheadHighlights?.strength?.text || trailheadHighlights?.focus?.text) && (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'row',
                              flexWrap: 'nowrap',
                              gap: '14px',
                              width: '100%',
                              alignItems: 'stretch',
                            }}
                          >
                            {[
                              trailheadHighlights?.strength?.text
                                ? { key: 'strength', eyebrow: 'Strength', text: trailheadHighlights.strength.text }
                                : null,
                              trailheadHighlights?.focus?.text
                                ? { key: 'focus', eyebrow: 'Focus', text: trailheadHighlights.focus.text }
                                : null,
                            ].filter(Boolean).map((card) => (
                              <Box
                                key={card.key}
                                sx={{
                                  flex: '1 1 0',
                                  minWidth: 0,
                                  bgcolor: colors.surface1,
                                  border: `1px solid ${colors.sand200}`,
                                  borderRadius: radii.md,
                                  px: '16px',
                                  py: '16px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  boxShadow: shadows.none,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: colors.orangeDeep,
                                    mb: 0.75,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {card.eyebrow}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: fonts.sans,
                                    fontSize: '13.5px',
                                    lineHeight: 1.55,
                                    color: colors.ink,
                                    textAlign: 'center',
                                  }}
                                >
                                  {card.text}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography sx={{ fontFamily: fonts.sans, color: colors.inkSoft, fontStyle: 'italic', textAlign: 'center' }}>
                        Generating your summary…
                      </Typography>
                    )
                  )}

                  {situationStage && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'hidden' }}>
                      {situationStage.reflection ? (
                        <Typography sx={bodyType}>
                          {renderParagraphWithTooltips(
                            splitSentences(situationStage.reflection).slice(0, 7).join(' ')
                          )}
                        </Typography>
                      ) : null}
                      {situationStage.situations.length > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'nowrap',
                            gap: '14px',
                            width: '100%',
                            alignItems: 'stretch',
                          }}
                        >
                          {situationStage.situations.slice(0, 2).map((situation, idx) => (
                            <Box
                              key={`sit-${activeStage.id}-${idx}`}
                              sx={{
                                flex: '1 1 0',
                                minWidth: 0,
                                bgcolor: colors.surface1,
                                border: `1px solid ${colors.sand200}`,
                                borderRadius: radii.md,
                                px: '16px',
                                py: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                boxShadow: shadows.none,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: fonts.mono,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: colors.orangeDeep,
                                  mb: 0.85,
                                  letterSpacing: '0.06em',
                                }}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: fonts.sans,
                                  fontSize: '14px',
                                  lineHeight: 1.55,
                                  color: colors.ink,
                                  textAlign: 'center',
                                }}
                              >
                                {splitSentences(situation).slice(0, 2).join(' ')}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  {activeStage.id === 'new-trail' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, minHeight: 0, overflow: 'hidden' }}>
                      {newTrailIntro ? (
                        <Typography sx={bodyType}>
                          {renderParagraphWithTooltips(splitSentences(newTrailIntro).slice(0, 10).join(' '))}
                        </Typography>
                      ) : null}
                      {leverageCards.length > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '14px',
                            width: '100%',
                          }}
                        >
                          {leverageCards.map((fa, idx) => (
                            <Tooltip key={fa.id || `lev-${idx}`} title={fa.subTraitDefinition || fa.traitDefinition || ''} arrow placement="top">
                              <Box
                                sx={{
                                  width: 196,
                                  boxSizing: 'border-box',
                                  flex: '0 0 196px',
                                  bgcolor: '#FFFFFF',
                                  backgroundColor: '#FFFFFF',
                                  backgroundImage: 'none',
                                  border: `1.5px solid ${colors.navy400}`,
                                  opacity: 1,
                                  borderRadius: radii.md,
                                  px: '16px',
                                  py: '16px',
                                  boxShadow: shadows.none,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  minHeight: 96,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontFamily: fonts.sans,
                                    fontWeight: 800,
                                    fontSize: '13.5px',
                                    color: colors.navy900,
                                    lineHeight: 1.3,
                                    textAlign: 'center',
                                  }}
                                >
                                  {fa.subTraitName}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: fonts.sans,
                                    fontSize: '11.5px',
                                    color: colors.inkSoft,
                                    lineHeight: 1.4,
                                    mt: 0.45,
                                    textAlign: 'center',
                                  }}
                                >
                                  {fa.traitName || fa.example || fa.subTraitDefinition || ''}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box
                    sx={{
                      mt: '18px',
                      pt: '14px',
                      borderTop: `1px solid ${colors.sand100}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      component="button"
                      type="button"
                      onClick={backTarget.action}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        fontFamily: fonts.sans,
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: colors.inkSoft,
                        whiteSpace: 'nowrap',
                        '&:hover': { color: colors.navy900 },
                        '&:focus-visible': {
                          outline: `3px solid ${colors.orange}`,
                          outlineOffset: 3,
                          borderRadius: radii.sm,
                        },
                      }}
                    >
                      {`‹ ${backTarget.label}`}
                    </Box>
                    <Box
                      component="button"
                      type="button"
                      onClick={nextTarget.action}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        bgcolor: colors.navy900,
                        color: colors.amberSoft,
                        borderRadius: radii.pill,
                        px: '22px',
                        py: '11px',
                        fontFamily: fonts.sans,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        boxShadow: shadows.buttonPrimary,
                        transition: '180ms ease',
                        '&:hover': {
                          bgcolor: colors.navy800,
                          boxShadow: shadows.buttonPrimaryHover,
                        },
                        '&:focus-visible': {
                          outline: `3px solid ${colors.orange}`,
                          outlineOffset: 3,
                        },
                      }}
                    >
                      {nextTarget.label}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </CompassLayout>
        <SummaryBriefingModal
          open={briefingOpen}
          persona={persona}
          stageLabel={activeStage.label}
          text={getSummaryBriefing(activeStage.id, personaId, firstName || briefingFirstName || 'Alex')}
          onDone={dismissBriefing}
        />
      </Box>
    );
  }

  // ── End cairn theme render ──────────────────────────────────────────────────

  return (
    <Box sx={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden',
      overflowY: 'auto',
      ...(useCairnTheme
        ? { bgcolor: 'var(--sand-50, #FBF7F0)' }
        : {
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
            '&:after': {
              content: '""',
              position: 'fixed',
              inset: 0,
              zIndex: -1,
              background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
            },
          }),
    }}>
      <ProcessTopRail
        chapterId="insights"
        activeStepId="summary"
        chip={{ variant: 'sequence', label: 'Stage', current: 1, total: 4 }}
      />
      <CompassLayout>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 3, sm: 4 },
          px: useCairnTheme ? 0 : { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: useCairnTheme ? '100%' : '100vw',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1180 }}>
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
      </CompassLayout>
    </Box>
  );
}

export default Summary;
