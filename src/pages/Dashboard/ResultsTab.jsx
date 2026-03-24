import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  TrendingUp,
  Warning,
  Lightbulb,
  Psychology,
  Insights,
  ArrowForward,
} from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';
import { auth, db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFakeDashboardData } from '../../config/runtimeFlags';
import {
  calculateCampaignTraitMetrics,
  getDashboardCampaignRows,
  normalizeDashboardScore,
  parseDashboardJson,
} from '../../utils/dashboardData.js';

const { CORE_TRAITS } = traitSystem;

function ResultsTab({ view = 'compass', selectedAgent: selectedAgentProp = '' }) {
  const [traitData, setTraitData] = useState({});
  const [intakeData, setIntakeData] = useState(null);
  const [criticalGaps, setCriticalGaps] = useState([]);
  const [primaryOpportunity, setPrimaryOpportunity] = useState(null);
  const [expandedTraits, setExpandedTraits] = useState({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCircle, setHoveredCircle] = useState(null); // { type: 'efficacy' | 'effort', traitIdx: number, value: number }
  const [hoveredGap, setHoveredGap] = useState(null); // { x: number, y: number, text: string, statement: object }
  const [selectedTraitKey, setSelectedTraitKey] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('trait'); // trait | efficacy | effort
  const [selectedDetailTraitKey, setSelectedDetailTraitKey] = useState(null);
  const [selectedDetailRingIdx, setSelectedDetailRingIdx] = useState(0);
  const [benchmarkGapData, setBenchmarkGapData] = useState(null);
  const [campaignRows, setCampaignRows] = useState(() => getDashboardCampaignRows());
  const [compassAgentInsight, setCompassAgentInsight] = useState('');
  const [detailAgentInsight, setDetailAgentInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState({ compass: false, detailed: false });
  const [insightError, setInsightError] = useState({ compass: '', detailed: '' });
  const insightCacheRef = useRef(new Map());
  const insightTimersRef = useRef({ compass: null, detailed: null });
  const insightAbortRef = useRef({ compass: null, detailed: null });
  const insightsPreloadedRef = useRef(false);
  const resolvedCampaignRows = useMemo(
    () => (campaignRows.length ? campaignRows : (fakeCampaign['campaign_123']?.campaign || [])),
    [campaignRows]
  );
  const primaryResponses = useMemo(() => {
    if (benchmarkGapData?.teamResponses?.length) return benchmarkGapData.teamResponses;
    return useFakeDashboardData ? fakeData.responses : [];
  }, [benchmarkGapData]);
  const confidenceContext = useMemo(() => {
    if (benchmarkGapData?.teamResponses?.length) {
      return `Team responses: ${benchmarkGapData.teamResponses.length}; Self responses: ${benchmarkGapData?.selfResponses?.length || 0}`;
    }
    return useFakeDashboardData
      ? `Synthetic response context: ${fakeData.responses.length} team responses.`
      : 'Team response data is not available yet.';
  }, [benchmarkGapData]);
  const teamCampaignClosed = useMemo(() => {
    const records = parseDashboardJson(localStorage.getItem('campaignRecords'), {});
    return useFakeDashboardData || String(records?.teamCampaignClosed || '').toLowerCase() === 'true';
  }, [useFakeDashboardData]);

  // Efficacy statement bank (3-5 words, no periods)
  const getEfficacyStatement = (efficacy) => {
    const scoreRange = Math.floor(efficacy / 5) * 5;
    const statements = {
      0: ["Minimal impact here", "Essentially no results", "Critically low effectiveness", "Negligible outcomes shown", "Virtually nonexistent impact", "Severely limited results", "Baseline effectiveness only", "No meaningful impact", "Critically insufficient impact", "Minimal effectiveness demonstrated", "Fundamentally lacking effectiveness", "Essentially ineffective outcomes", "Lowest threshold impact", "Critical ineffectiveness shown", "Severely compromised effectiveness", "Significantly below expectations", "Critically underdeveloped impact", "Fundamental gaps demonstrated", "Crisis level effectiveness", "Essentially non-functional outcomes"],
      5: ["Extremely limited impact", "Critically low results", "Severely constrained effectiveness", "Minimal impact shown", "Fundamentally insufficient impact", "Critical level results", "Severely underdeveloped effectiveness", "Critical gaps demonstrated", "Essentially ineffective impact", "Severe limitations shown", "Critically compromised effectiveness", "Fundamentally lacking outcomes", "Emergency level impact", "Critical ineffectiveness demonstrated", "Severely limited effectiveness", "Minimal meaningful impact", "Critically underperforming impact", "Crisis threshold results", "Fundamentally insufficient effectiveness", "Severe gaps demonstrated"],
      10: ["Very limited impact", "Significantly low results", "Substantially constrained effectiveness", "Minimal effectiveness shown", "Critically underdeveloped impact", "Substantial gaps demonstrated", "Severely limited effectiveness", "Fundamentally insufficient outcomes", "Critical limitations shown", "Concerning level results", "Substantially compromised effectiveness", "Significant gaps demonstrated", "Critically insufficient impact", "Severe underperformance shown", "Fundamentally lacking effectiveness", "Substantially below expectations", "Critical threshold impact", "Fundamental limitations demonstrated", "Severely underdeveloped effectiveness", "Critical ineffectiveness shown"],
      15: ["Quite limited impact", "Noticeably low results", "Substantially constrained effectiveness", "Significant gaps demonstrated", "Critically underdeveloped impact", "Substantial limitations shown", "Fundamentally insufficient effectiveness", "Concerning level outcomes", "Critical gaps demonstrated", "Substantially below expectations", "Severely limited effectiveness", "Significant ineffectiveness shown", "Critically insufficient impact", "Fundamental gaps demonstrated", "Substantially compromised effectiveness", "Critical threshold outcomes", "Severe limitations shown", "Fundamentally lacking results", "Critically underdeveloped effectiveness", "Substantial gaps demonstrated"],
      20: ["Limited impact shown", "Below expectations results", "Constrained effectiveness demonstrated", "Gaps in outcomes", "Underdeveloped impact shown", "Limitations demonstrated clearly", "Insufficient effectiveness shown", "Below par outcomes", "Constraints visible", "Substantially low results", "Gaps demonstrated clearly", "Limited outcomes shown", "Below threshold impact", "Underperformance demonstrated", "Constrained effectiveness shown", "Limitations clearly visible", "Insufficient impact shown", "Below expectations outcomes", "Gaps clearly demonstrated", "Constrained outcomes shown"],
      25: ["Modest impact shown", "Developing results emerging", "Emerging effectiveness visible", "Early signs appearing", "Early stage impact", "Potential demonstrated clearly", "Beginning to show", "Developing outcomes visible", "Promise shown clearly", "Emerging results visible", "Early progress demonstrated", "Development in progress", "Foundational level impact", "Initial signs appearing", "Modest effectiveness shown", "Early potential visible", "Developing impact shown", "Beginning to emerge", "Early signs visible", "Foundational stage outcomes"],
      30: ["Developing impact shown", "Progress clearly visible", "Emerging effectiveness demonstrated", "Growth demonstrated clearly", "Building impact visible", "Improving results shown", "Development in progress", "Progressing outcomes visible", "Advancement demonstrated clearly", "Emerging strength shown", "Developing effectiveness visible", "Progress clearly demonstrated", "Growing impact shown", "Building results visible", "Improvement demonstrated clearly", "Advancing outcomes shown", "Development clearly visible", "Growth shown clearly", "Progressing effectiveness visible", "Improving outcomes demonstrated"],
      35: ["Moderate impact shown", "Adequate results demonstrated", "Acceptable effectiveness visible", "Basic standards met", "Satisfactory impact shown", "Competency demonstrated clearly", "Adequacy shown clearly", "Acceptable outcomes visible", "Expectations met clearly", "Competent results shown", "Adequacy demonstrated clearly", "Satisfactory performance visible", "Acceptable level impact", "Basic requirements met", "Moderate effectiveness shown", "Competency clearly demonstrated", "Adequacy visible clearly", "Satisfactory results shown", "Standards met clearly", "Adequate outcomes visible"],
      40: ["Solid impact demonstrated", "Good results shown", "Reliable effectiveness visible", "Quality outcomes demonstrated", "Consistent impact shown", "Dependable results visible", "Reliability demonstrated clearly", "Solid outcomes shown", "Reliable impact visible", "Quality results demonstrated", "Consistent effectiveness shown", "Dependability clearly visible", "Standards met clearly", "Reliable results shown", "Quality effectiveness visible", "Consistent outcomes demonstrated", "Reliability shown clearly", "Solid results visible", "Expectations met clearly", "Dependability demonstrated clearly"],
      45: ["Strong impact demonstrated", "Commendable results shown", "Notable effectiveness visible", "Merit clearly demonstrated", "Quality impact shown", "Impressive results visible", "Strength demonstrated clearly", "Commendable outcomes shown", "Notable impact visible", "Merit shown clearly", "Impressive effectiveness demonstrated", "Quality outcomes visible", "High standards met", "Strong results shown", "Merit clearly visible", "Notable outcomes demonstrated", "Quality impact visible", "Commendable results shown", "Strong effectiveness demonstrated", "Impressive results visible"],
      50: ["Good impact demonstrated", "Solid results shown", "Reliable effectiveness visible", "Competence clearly demonstrated", "Proficient impact shown", "Dependable results visible", "Capability demonstrated clearly", "Solid outcomes shown", "Competent impact visible", "Reliability shown clearly", "Proficient effectiveness demonstrated", "Dependability clearly visible", "Good standards met", "Capable results shown", "Competence clearly visible", "Reliable outcomes demonstrated", "Proficiency shown clearly", "Solid results visible", "Dependable effectiveness shown", "Capability clearly demonstrated"],
      55: ["Above average impact", "Strong results shown", "Notable effectiveness visible", "Quality clearly demonstrated", "Excellent impact shown", "Impressive results visible", "Strength demonstrated clearly", "Above average outcomes", "Notable impact visible", "Quality shown clearly", "Strong effectiveness demonstrated", "Excellence clearly visible", "Standards exceeded clearly", "Impressive results shown", "Quality effectiveness visible", "Strong outcomes demonstrated", "Excellence shown clearly", "Notable results visible", "Above average effectiveness", "Strength clearly demonstrated"],
      60: ["Strong impact demonstrated", "Excellent results shown", "Impressive effectiveness visible", "Quality clearly demonstrated", "Proficient impact shown", "Outstanding results visible", "Excellence demonstrated clearly", "Strong outcomes shown", "Impressive impact visible", "Excellence shown clearly", "Outstanding effectiveness demonstrated", "Proficiency clearly visible", "Expectations exceeded clearly", "Excellent results shown", "Quality effectiveness visible", "Impressive outcomes demonstrated", "Excellence clearly visible", "Strong results shown", "Proficient effectiveness visible", "Outstanding results demonstrated"],
      65: ["Very strong impact", "Highly effective results", "Notable effectiveness shown", "Excellence clearly demonstrated", "High quality impact", "Impressive results visible", "Strength demonstrated clearly", "Very strong outcomes", "Highly effective impact", "Excellence shown clearly", "Impressive effectiveness demonstrated", "High quality visible", "Good standards exceeded", "Notable results shown", "Excellence clearly visible", "Highly effective outcomes", "Strength shown clearly", "Impressive results visible", "Very strong effectiveness", "Notable outcomes demonstrated"],
      70: ["Excellent impact demonstrated", "Highly effective results", "Outstanding effectiveness shown", "Quality clearly visible", "Proficient impact shown", "Impressive results visible", "Excellence demonstrated clearly", "Excellent outcomes shown", "Highly effective impact", "Quality shown clearly", "Impressive effectiveness demonstrated", "Proficiency clearly visible", "Standards exceeded clearly", "Outstanding results shown", "Excellence clearly visible", "Highly effective outcomes", "Quality impact visible", "Impressive results shown", "Excellent effectiveness demonstrated", "Outstanding results visible"],
      75: ["Outstanding impact demonstrated", "Exceptional results shown", "Excellent effectiveness visible", "Mastery clearly demonstrated", "High quality impact", "Impressive results visible", "Excellence demonstrated clearly", "Outstanding outcomes shown", "Exceptional impact visible", "Mastery shown clearly", "Impressive effectiveness demonstrated", "High quality visible", "Expectations exceeded clearly", "Excellent results shown", "Mastery clearly visible", "Exceptional outcomes demonstrated", "Excellence shown clearly", "Outstanding results visible", "Exceptional effectiveness shown", "Impressive results demonstrated"],
      80: ["Exceptional impact demonstrated", "Outstanding results shown", "Excellent effectiveness visible", "Mastery clearly demonstrated", "High proficiency impact", "Impressive results visible", "Excellence demonstrated clearly", "Exceptional outcomes shown", "Outstanding impact visible", "Mastery shown clearly", "Impressive effectiveness demonstrated", "High proficiency visible", "High standards exceeded", "Excellent results shown", "Mastery clearly visible", "Outstanding outcomes demonstrated", "Excellence shown clearly", "Exceptional results visible", "Outstanding effectiveness shown", "Impressive mastery demonstrated"],
      85: ["Exemplary impact demonstrated", "Outstanding results shown", "Exceptional effectiveness visible", "Excellence clearly demonstrated", "Mastery impact shown", "Impressive results visible", "High quality demonstrated", "Exemplary outcomes shown", "Outstanding impact visible", "Excellence shown clearly", "Impressive effectiveness demonstrated", "Mastery clearly visible", "Expectations exceeded clearly", "Exceptional results shown", "Excellence clearly visible", "Outstanding outcomes demonstrated", "Mastery shown clearly", "Exemplary results visible", "Outstanding effectiveness shown", "Exceptional results demonstrated"],
      90: ["Exceptional impact demonstrated", "Exemplary results shown", "Outstanding effectiveness visible", "Mastery clearly demonstrated", "Excellent impact shown", "Impressive results visible", "High proficiency demonstrated", "Exceptional outcomes shown", "Exemplary impact visible", "Mastery shown clearly", "Impressive effectiveness demonstrated", "Excellence clearly visible", "High standards exceeded", "Outstanding results shown", "Mastery clearly visible", "Exemplary outcomes demonstrated", "Excellence shown clearly", "Exceptional results visible", "Exemplary effectiveness shown", "Outstanding mastery demonstrated"],
      95: ["Extraordinary impact demonstrated", "Exceptional results shown", "Exemplary effectiveness visible", "Mastery clearly demonstrated", "Excellent impact shown", "Impressive results visible", "Outstanding quality demonstrated", "Extraordinary outcomes shown", "Exceptional impact visible", "Mastery shown clearly", "Impressive effectiveness demonstrated", "Excellence clearly visible", "All standards exceeded", "Exemplary results shown", "Mastery clearly visible", "Exceptional outcomes demonstrated", "Excellence shown clearly", "Extraordinary results visible", "Exceptional effectiveness shown", "Exemplary mastery demonstrated"],
      100: ["Highest level impact", "Exceptional results shown", "Exemplary effectiveness visible", "Complete mastery demonstrated", "Maximum quality impact", "Impressive results visible", "Outstanding excellence demonstrated", "Peak performance outcomes", "Exceptional impact visible", "Complete mastery shown", "Impressive effectiveness demonstrated", "Maximum excellence visible", "All expectations exceeded", "Exemplary results shown", "Complete mastery visible", "Exceptional outcomes demonstrated", "Maximum excellence shown", "Peak level results", "Exceptional effectiveness visible", "Exemplary mastery demonstrated"]
    };
    const range = Math.min(scoreRange, 100);
    const idx = Math.floor(efficacy % 5) + Math.floor((efficacy / 5) % 4) * 5;
    return statements[range]?.[idx % 20] || statements[range]?.[0] || "Developing impact shown";
  };

  // Effort statement bank (3-5 words, no periods)
  const getEffortStatement = (effort) => {
    const scoreRange = Math.floor(effort / 5) * 5;
    const statements = {
      0: ["Minimal commitment shown", "Essentially absent engagement", "Critically low dedication", "Negligible focus demonstrated", "Virtually nonexistent attention", "Severely limited investment", "Baseline commitment only", "No meaningful presence", "Critically insufficient dedication", "Minimal effort demonstrated", "Fundamentally lacking attention", "Essentially ineffective investment", "Lowest threshold commitment", "Critical absence shown", "Severely compromised dedication", "Significantly below expectations", "Critically underdeveloped attention", "Fundamental gaps demonstrated", "Crisis level commitment", "Essentially non-functional engagement"],
      5: ["Extremely limited commitment", "Critically low engagement", "Severely constrained dedication", "Minimal presence shown", "Fundamentally insufficient attention", "Critical level investment", "Severely underdeveloped commitment", "Critical gaps demonstrated", "Essentially ineffective engagement", "Severe limitations shown", "Critically compromised dedication", "Fundamentally lacking focus", "Emergency level commitment", "Critical ineffectiveness demonstrated", "Severely limited engagement", "Minimal meaningful presence", "Critically underperforming dedication", "Crisis threshold investment", "Fundamentally insufficient commitment", "Severe gaps demonstrated"],
      10: ["Very limited commitment", "Significantly low engagement", "Substantially constrained dedication", "Minimal engagement shown", "Critically underdeveloped attention", "Substantial gaps demonstrated", "Severely limited commitment", "Fundamentally insufficient engagement", "Critical limitations shown", "Concerning level dedication", "Substantially compromised focus", "Significant gaps demonstrated", "Critically insufficient commitment", "Severe underperformance shown", "Fundamentally lacking engagement", "Substantially below expectations", "Critical threshold dedication", "Fundamental limitations demonstrated", "Severely underdeveloped commitment", "Critical ineffectiveness shown"],
      15: ["Quite limited commitment", "Noticeably low engagement", "Substantially constrained dedication", "Significant gaps demonstrated", "Critically underdeveloped commitment", "Substantial limitations shown", "Fundamentally insufficient engagement", "Concerning level dedication", "Critical gaps demonstrated", "Substantially below expectations", "Severely limited commitment", "Significant ineffectiveness shown", "Critically insufficient engagement", "Fundamental gaps demonstrated", "Substantially compromised dedication", "Critical threshold focus", "Severe limitations shown", "Fundamentally lacking commitment", "Critically underdeveloped engagement", "Substantial gaps demonstrated"],
      20: ["Limited commitment shown", "Below expectations engagement", "Constrained dedication demonstrated", "Gaps in focus", "Underdeveloped commitment shown", "Limitations demonstrated clearly", "Insufficient engagement shown", "Below par dedication", "Constraints visible", "Substantially low commitment", "Gaps demonstrated clearly", "Limited engagement shown", "Below threshold dedication", "Underperformance demonstrated", "Constrained commitment shown", "Limitations clearly visible", "Insufficient engagement shown", "Below expectations dedication", "Gaps clearly demonstrated", "Constrained focus shown"],
      25: ["Modest commitment shown", "Developing engagement emerging", "Emerging dedication visible", "Early signs appearing", "Early stage commitment", "Potential demonstrated clearly", "Beginning to show", "Developing focus visible", "Promise shown clearly", "Emerging engagement visible", "Early progress demonstrated", "Development in progress", "Foundational level commitment", "Initial signs appearing", "Modest engagement shown", "Early potential visible", "Developing dedication shown", "Beginning to emerge", "Early signs visible", "Foundational stage focus"],
      30: ["Developing commitment shown", "Progress clearly visible", "Emerging dedication demonstrated", "Growth demonstrated clearly", "Building engagement visible", "Improving commitment shown", "Development in progress", "Progressing dedication visible", "Advancement demonstrated clearly", "Emerging strength shown", "Developing engagement visible", "Progress clearly demonstrated", "Growing commitment shown", "Building dedication visible", "Improvement demonstrated clearly", "Advancing focus shown", "Development clearly visible", "Growth shown clearly", "Progressing engagement visible", "Improving dedication demonstrated"],
      35: ["Moderate commitment shown", "Adequate engagement demonstrated", "Acceptable dedication visible", "Basic standards met", "Satisfactory commitment shown", "Competency demonstrated clearly", "Adequacy shown clearly", "Acceptable focus visible", "Expectations met clearly", "Competent engagement shown", "Adequacy demonstrated clearly", "Satisfactory performance visible", "Acceptable level commitment", "Basic requirements met", "Moderate engagement shown", "Competency clearly demonstrated", "Adequacy visible clearly", "Satisfactory dedication shown", "Standards met clearly", "Adequate focus visible"],
      40: ["Solid commitment demonstrated", "Good engagement shown", "Reliable dedication visible", "Quality focus demonstrated", "Consistent commitment shown", "Dependable engagement visible", "Reliability demonstrated clearly", "Solid dedication shown", "Reliable commitment visible", "Quality engagement demonstrated", "Consistent dedication shown", "Dependability clearly visible", "Standards met clearly", "Reliable engagement shown", "Quality dedication visible", "Consistent focus demonstrated", "Reliability shown clearly", "Solid engagement visible", "Expectations met clearly", "Dependability demonstrated clearly"],
      45: ["Strong commitment demonstrated", "Commendable engagement shown", "Notable dedication visible", "Merit clearly demonstrated", "Quality commitment shown", "Impressive engagement visible", "Strength demonstrated clearly", "Commendable dedication shown", "Notable commitment visible", "Merit shown clearly", "Impressive dedication demonstrated", "Quality focus visible", "High standards met", "Strong engagement shown", "Merit clearly visible", "Notable dedication demonstrated", "Quality commitment visible", "Commendable engagement shown", "Strong dedication demonstrated", "Impressive focus visible"],
      50: ["Good commitment demonstrated", "Solid engagement shown", "Reliable dedication visible", "Competence clearly demonstrated", "Proficient commitment shown", "Dependable engagement visible", "Capability demonstrated clearly", "Solid dedication shown", "Competent commitment visible", "Reliability shown clearly", "Proficient dedication demonstrated", "Dependability clearly visible", "Good standards met", "Capable engagement shown", "Competence clearly visible", "Reliable dedication demonstrated", "Proficiency shown clearly", "Solid engagement visible", "Dependable commitment shown", "Capability clearly demonstrated"],
      55: ["Above average commitment", "Strong engagement shown", "Notable dedication visible", "Quality clearly demonstrated", "Excellent commitment shown", "Impressive engagement visible", "Strength demonstrated clearly", "Above average dedication", "Notable commitment visible", "Quality shown clearly", "Strong dedication demonstrated", "Excellence clearly visible", "Standards exceeded clearly", "Impressive engagement shown", "Quality dedication visible", "Strong focus demonstrated", "Excellence shown clearly", "Notable engagement visible", "Above average commitment", "Strength clearly demonstrated"],
      60: ["Strong commitment demonstrated", "Excellent engagement shown", "Impressive dedication visible", "Quality clearly demonstrated", "Proficient commitment shown", "Outstanding engagement visible", "Excellence demonstrated clearly", "Strong dedication shown", "Impressive commitment visible", "Excellence shown clearly", "Outstanding dedication demonstrated", "Proficiency clearly visible", "Expectations exceeded clearly", "Excellent engagement shown", "Quality dedication visible", "Impressive focus demonstrated", "Excellence clearly visible", "Strong engagement shown", "Proficient dedication visible", "Outstanding commitment demonstrated"],
      65: ["Very strong commitment", "Highly effective engagement", "Notable dedication shown", "Excellence clearly demonstrated", "High quality commitment", "Impressive engagement visible", "Strength demonstrated clearly", "Very strong dedication", "Highly effective commitment", "Excellence shown clearly", "Impressive dedication demonstrated", "High quality visible", "Good standards exceeded", "Notable engagement shown", "Excellence clearly visible", "Highly effective dedication", "Strength shown clearly", "Impressive engagement visible", "Very strong commitment", "Notable dedication demonstrated"],
      70: ["Excellent commitment demonstrated", "Highly effective engagement", "Outstanding dedication shown", "Quality clearly visible", "Proficient commitment shown", "Impressive engagement visible", "Excellence demonstrated clearly", "Excellent dedication shown", "Highly effective commitment", "Quality shown clearly", "Impressive dedication demonstrated", "Proficiency clearly visible", "Standards exceeded clearly", "Outstanding engagement shown", "Excellence clearly visible", "Highly effective dedication", "Quality commitment visible", "Impressive engagement shown", "Excellent dedication demonstrated", "Outstanding commitment visible"],
      75: ["Outstanding commitment demonstrated", "Exceptional engagement shown", "Excellent dedication visible", "Mastery clearly demonstrated", "High quality commitment", "Impressive engagement visible", "Excellence demonstrated clearly", "Outstanding dedication shown", "Exceptional commitment visible", "Mastery shown clearly", "Impressive dedication demonstrated", "High quality visible", "Expectations exceeded clearly", "Excellent engagement shown", "Mastery clearly visible", "Exceptional dedication demonstrated", "Excellence shown clearly", "Outstanding engagement visible", "Exceptional commitment shown", "Impressive dedication demonstrated"],
      80: ["Exceptional commitment demonstrated", "Outstanding engagement shown", "Excellent dedication visible", "Mastery clearly demonstrated", "High proficiency commitment", "Impressive engagement visible", "Excellence demonstrated clearly", "Exceptional dedication shown", "Outstanding commitment visible", "Mastery shown clearly", "Impressive dedication demonstrated", "High proficiency visible", "High standards exceeded", "Excellent engagement shown", "Mastery clearly visible", "Outstanding dedication demonstrated", "Excellence shown clearly", "Exceptional engagement visible", "Outstanding commitment shown", "Impressive mastery demonstrated"],
      85: ["Exemplary commitment demonstrated", "Outstanding engagement shown", "Exceptional dedication visible", "Excellence clearly demonstrated", "Mastery commitment shown", "Impressive engagement visible", "High quality demonstrated", "Exemplary dedication shown", "Outstanding commitment visible", "Excellence shown clearly", "Impressive dedication demonstrated", "Mastery clearly visible", "Expectations exceeded clearly", "Exceptional engagement shown", "Excellence clearly visible", "Outstanding dedication demonstrated", "Mastery shown clearly", "Exemplary engagement visible", "Outstanding commitment shown", "Exceptional dedication demonstrated"],
      90: ["Exceptional commitment demonstrated", "Exemplary engagement shown", "Outstanding dedication visible", "Mastery clearly demonstrated", "Excellent commitment shown", "Impressive engagement visible", "High proficiency demonstrated", "Exceptional dedication shown", "Exemplary commitment visible", "Mastery shown clearly", "Impressive dedication demonstrated", "Excellence clearly visible", "High standards exceeded", "Outstanding engagement shown", "Mastery clearly visible", "Exemplary dedication demonstrated", "Excellence shown clearly", "Exceptional engagement visible", "Exemplary commitment shown", "Outstanding mastery demonstrated"],
      95: ["Extraordinary commitment demonstrated", "Exceptional engagement shown", "Exemplary dedication visible", "Mastery clearly demonstrated", "Excellent commitment shown", "Impressive engagement visible", "Outstanding quality demonstrated", "Extraordinary dedication shown", "Exceptional commitment visible", "Mastery shown clearly", "Impressive dedication demonstrated", "Excellence clearly visible", "All standards exceeded", "Exemplary engagement shown", "Mastery clearly visible", "Exceptional dedication demonstrated", "Excellence shown clearly", "Extraordinary engagement visible", "Exceptional commitment shown", "Exemplary mastery demonstrated"],
      100: ["Highest level commitment", "Exceptional engagement shown", "Exemplary dedication visible", "Complete mastery demonstrated", "Maximum quality commitment", "Impressive engagement visible", "Outstanding excellence demonstrated", "Peak performance dedication", "Exceptional commitment visible", "Complete mastery shown", "Impressive dedication demonstrated", "Maximum excellence visible", "All expectations exceeded", "Exemplary engagement shown", "Complete mastery visible", "Exceptional dedication demonstrated", "Maximum excellence shown", "Peak level engagement", "Exceptional commitment visible", "Exemplary mastery demonstrated"]
    };
    const range = Math.min(scoreRange, 100);
    const idx = Math.floor(effort % 5) + Math.floor((effort / 5) % 4) * 5;
    return statements[range]?.[idx % 20] || statements[range]?.[0] || "Developing commitment shown";
  };

  // Relationship statement bank (20 statements based on gap and total score)
  const getRelationshipStatement = (efficacy, effort, delta, avg) => {
    const statements = [];
    
    // Very high scores (80+) with small gap
    if (avg >= 80 && delta < 10) {
      statements.push("The team's needs are mostly met here. Recognize this win and stay the course.");
      statements.push("You've achieved excellence with balanced performance. Maintain this standard and consider scaling.");
      statements.push("Outstanding results with consistent approach. This is a strength to leverage and build upon.");
      statements.push("Exceptional performance with good balance. Continue this trajectory and share your methods.");
      statements.push("Mastery achieved with steady commitment. This area demonstrates your leadership capability.");
    }
    
    // High scores (65-79) with small gap
    if (avg >= 65 && avg < 80 && delta < 10) {
      statements.push("Strong performance with good balance. Focused refinement will elevate you to the next level.");
      statements.push("Solid results with consistent approach. Strategic improvements will push you into excellence.");
      statements.push("Good balance with room for growth. Targeted development will accelerate your advancement.");
      statements.push("Well-aligned performance in a strong range. Continued focus will enhance your results.");
      statements.push("Steady progress with balanced effort. Strategic enhancements will maximize your potential.");
    }
    
    // Medium-high scores (50-64) with small gap
    if (avg >= 50 && avg < 65 && delta < 10) {
      statements.push("Balanced performance with room for growth. Focused development in both areas will elevate overall results.");
      statements.push("Steady progress with good alignment. Strategic improvements will accelerate your growth.");
      statements.push("Consistent approach with development opportunity. Targeted enhancements will improve outcomes.");
      statements.push("Good balance with growth potential. Focused effort will strengthen your foundation.");
      statements.push("Solid foundation with balanced approach. Continued development will build your capability.");
    }
    
    // Medium scores (35-49) with small gap
    if (avg >= 35 && avg < 50 && delta < 10) {
      statements.push("Attention and steady improvement here will prove beneficial.");
      statements.push("Consistent development in both areas will build a stronger foundation.");
      statements.push("Balanced growth opportunity. Focused training will accelerate your progress.");
      statements.push("Steady progress with room for advancement. Strategic development will enhance results.");
      statements.push("Developing competency with consistent effort. Continued focus will build proficiency.");
    }
    
    // Low scores (<35) with small gap
    if (avg < 35 && delta < 10) {
      statements.push("Significant development needed. Comprehensive training and consistent practice will build foundational skills.");
      statements.push("Substantial growth required. Structured learning and dedicated effort will establish core competencies.");
      statements.push("Major improvement opportunity. Systematic training and regular application will develop essential capabilities.");
      statements.push("Foundation building needed. Comprehensive education and consistent practice will create a strong base.");
      statements.push("Core development required. Structured programs and dedicated focus will build essential skills.");
    }
    
    // Large gap (30+) with efficacy higher
    if (delta >= 30 && efficacy > effort) {
      statements.push("Large gap favoring natural ability. Strategic effort increases will maximize your strong foundation.");
      statements.push("Significant effectiveness advantage. More consistent engagement will unlock your full potential.");
      statements.push("Major gap with strong natural skill. Increased focus will close the gap and amplify your results.");
      statements.push("Exceptional ability with engagement opportunity. More structured commitment will maximize outcomes.");
      statements.push("Outstanding effectiveness with effort potential. Enhanced dedication will balance and amplify performance.");
    }
    
    // Large gap (30+) with effort higher
    if (delta >= 30 && effort > efficacy) {
      statements.push("Large gap with high effort but low results. Fundamental approach change and training are critical.");
      statements.push("Significant commitment without matching effectiveness. Comprehensive strategy revision and skill development are essential.");
      statements.push("Major effort gap with low outcomes. Fundamental method changes and educational support will improve results.");
      statements.push("High dedication with limited impact. Strategy overhaul and comprehensive training will align results with effort.");
      statements.push("Intense commitment producing minimal results. Fundamental approach revision and skill-building are necessary.");
    }
    
    // Medium gap (15-29) with efficacy higher
    if (delta >= 15 && delta < 30 && efficacy > effort) {
      statements.push("Moderate gap with effectiveness advantage. Increased consistency and attention will balance performance.");
      statements.push("Noticeable gap favoring natural ability. More structured engagement will close the gap and enhance results.");
      statements.push("Significant effectiveness lead. Enhanced focus will balance performance and maximize your outcomes.");
      statements.push("Good results with efficiency opportunity. More intentional practice will enhance outcomes.");
      statements.push("Natural proficiency with engagement potential. Increased commitment will maximize your effectiveness.");
    }
    
    // Medium gap (15-29) with effort higher
    if (delta >= 15 && delta < 30 && effort > efficacy) {
      statements.push("Moderate gap with effort advantage. Skill development and technique improvement will improve effectiveness.");
      statements.push("Noticeable gap with high commitment. Training and method refinement will align results with your effort.");
      statements.push("Significant effort lead. Focused skill-building will close the gap and improve your effectiveness.");
      statements.push("Dedicated work with effectiveness opportunity. Skill development and training will improve outcomes.");
      statements.push("High commitment with skill development needed. Focused training will align results with your dedication.");
    }
    
    // High efficacy, low effort (natural strength)
    if (efficacy >= 70 && effort < 50) {
      statements.push("Strong natural proficiency. Slight increase in attention will maximize your effectiveness here.");
      statements.push("Good natural ability with low engagement. More consistent focus will significantly boost results.");
      statements.push("Innate talent present. Increased attention and commitment will amplify your natural effectiveness.");
      statements.push("Exceptional natural ability. Minimal additional effort will produce outstanding results.");
      statements.push("Outstanding innate skill. Small increases in engagement will yield exceptional outcomes.");
    }
    
    // Low efficacy, high effort (working hard but not effective)
    if (efficacy < 50 && effort >= 70) {
      statements.push("Intentionality is propping up this score. Education, training, and behavioral adjustments are necessary to close the gap.");
      statements.push("High commitment but low effectiveness. A different approach, training, or methodology is needed to see results.");
      statements.push("Significant effort without proportional results. Reassess your approach and consider alternative strategies or training.");
      statements.push("Dedication compensating for skill gaps. Fundamental education and approach refinement will align results with effort.");
      statements.push("Maximum effort with minimal results. Fundamental strategy change and skill development are essential.");
    }
    
    // Default fallbacks
    if (statements.length === 0) {
      if (efficacy > effort) {
        statements.push("Effectiveness exceeds effort. More consistent engagement will enhance results.");
        statements.push("Natural ability outpacing commitment. Increased focus will maximize your effectiveness.");
        statements.push("Results ahead of effort. Enhanced engagement will amplify your outcomes.");
      } else {
        statements.push("Effort exceeds effectiveness. Skill development and training will improve outcomes.");
        statements.push("Commitment ahead of results. Training and method improvements will enhance effectiveness.");
        statements.push("Dedication outpacing impact. Skill-building and approach refinement will improve outcomes.");
      }
    }
    
    // Select variation based on combination of scores
    const variationIdx = (Math.floor(efficacy / 5) + Math.floor(effort / 5) + Math.floor(delta / 5)) % statements.length;
    return statements[variationIdx] || statements[0] || "Focus on balanced development in both areas.";
  };

  // Generate gap analysis text based on efficacy and effort scores
  // Returns natural, flowing sentences that inform users about efficacy, effort, and their relationship
  const getGapAnalysis = (efficacy, effort, statementIdx = 0) => {
    const delta = Math.abs(efficacy - effort);
    const avg = (efficacy + effort) / 2;
    
    // Create natural, flowing statements based on score combinations
    const statements = [];
    
    // Very high scores (80+) with small gap
    if (avg >= 80 && delta < 10) {
      statements.push("Your impact and commitment are both exceptional here, creating a strong foundation for sustained leadership excellence.");
      statements.push("You're achieving outstanding results with consistent effort, demonstrating mastery in this area that your team can rely on.");
      statements.push("Both your effectiveness and dedication are at peak levels, showing balanced excellence that sets a strong example.");
      statements.push("Your high impact matches your strong commitment, creating a powerful combination that drives consistent results.");
      statements.push("Exceptional effectiveness paired with exceptional effort demonstrates leadership capability that others can learn from.");
    }
    
    // High scores (65-79) with small gap
    if (avg >= 65 && avg < 80 && delta < 10) {
      statements.push("Your impact and commitment are well-aligned, showing strong performance with room to push into excellence.");
      statements.push("You're producing solid results with consistent effort, indicating a balanced approach that's working well.");
      statements.push("Your effectiveness and dedication are in sync, creating a foundation for continued growth and development.");
      statements.push("Strong impact combined with strong commitment shows you're on the right track toward mastery.");
      statements.push("Your balanced performance demonstrates good alignment between what you achieve and how much you invest.");
    }
    
    // Medium-high scores (50-64) with small gap
    if (avg >= 50 && avg < 65 && delta < 10) {
      statements.push("Your impact and commitment are developing together, showing steady progress with consistent effort on both fronts.");
      statements.push("You're building capability with balanced attention to both effectiveness and engagement, creating a solid foundation.");
      statements.push("Your results and effort are aligned at a developing level, indicating healthy growth in this area.");
      statements.push("Moderate impact with moderate commitment shows you're building skills that will strengthen over time.");
      statements.push("Your balanced approach demonstrates awareness of both what you achieve and how consistently you apply yourself.");
    }
    
    // Medium scores (35-49) with small gap
    if (avg >= 35 && avg < 50 && delta < 10) {
      statements.push("Your impact and commitment are both in early development, suggesting this is an area where focused attention will yield growth.");
      statements.push("You're showing modest results with modest effort, indicating an opportunity to elevate both your effectiveness and engagement.");
      statements.push("Your developing capability suggests that increased focus and intentional practice will accelerate your progress here.");
      statements.push("Moderate performance in both areas means there's clear potential for improvement with targeted development.");
      statements.push("Your balanced but developing scores show this area needs consistent attention to build stronger capability.");
    }
    
    // Low scores (<35) with small gap
    if (avg < 35 && delta < 10) {
      statements.push("Your impact and commitment are both at foundational levels, indicating this area requires comprehensive skill-building and consistent practice.");
      statements.push("You're showing limited results with limited effort, suggesting this is a clear development opportunity that needs structured learning.");
      statements.push("Your low scores in both areas mean this is a priority for building core competencies through training and application.");
      statements.push("Limited effectiveness paired with limited commitment indicates a need for fundamental development and increased engagement.");
      statements.push("Your scores show this area needs significant attention, with both skill-building and consistent effort required for improvement.");
    }
    
    // Large gap (30+) with efficacy higher
    if (delta >= 30 && efficacy > effort) {
      statements.push("Your impact is significantly stronger than your commitment, suggesting that even small increases in consistent effort could unlock exceptional results.");
      statements.push("You're achieving strong results with relatively low effort, indicating natural ability that would benefit from more structured engagement.");
      statements.push("Your high effectiveness with lower commitment shows you have strong capability that isn't being fully leveraged yet.");
      statements.push("Exceptional impact paired with moderate effort means you're naturally strong here, but more consistent attention would maximize your potential.");
      statements.push("Your strong results suggest you have the skills, but increased commitment would help you reach even higher levels of performance.");
    }
    
    // Large gap (30+) with effort higher
    if (delta >= 30 && effort > efficacy) {
      statements.push("Your commitment is significantly higher than your impact, indicating that your current approach isn't translating effort into desired results.");
      statements.push("You're investing substantial effort but seeing limited results, suggesting a need to reassess your methods or seek additional training.");
      statements.push("High dedication with lower effectiveness means you're working hard, but your strategy may need fundamental adjustment to improve outcomes.");
      statements.push("Your strong effort isn't matching your results, which points to a need for skill development or a different approach to this area.");
      statements.push("Intense commitment with limited impact suggests that while your dedication is clear, your methods may need revision to achieve better results.");
    }
    
    // Medium gap (15-29) with efficacy higher
    if (delta >= 15 && delta < 30 && efficacy > effort) {
      statements.push("Your impact is noticeably stronger than your commitment, indicating that more consistent engagement would help you reach your full potential.");
      statements.push("You're achieving good results with moderate effort, suggesting that increased focus and attention would elevate your performance further.");
      statements.push("Your effectiveness outpaces your engagement, meaning that more structured commitment could unlock even better outcomes.");
      statements.push("Strong impact with developing commitment shows you have the capability, but more consistent effort would maximize your results.");
      statements.push("Your results are good, but your natural ability suggests that increased dedication would help you achieve excellence.");
    }
    
    // Medium gap (15-29) with effort higher
    if (delta >= 15 && delta < 30 && effort > efficacy) {
      statements.push("Your commitment is stronger than your impact, suggesting that skill development or method refinement would help your effort translate into better results.");
      statements.push("You're investing good effort but seeing moderate results, indicating that training or technique improvement could close this gap.");
      statements.push("Your dedication exceeds your effectiveness, meaning focused skill-building would help align your results with your commitment.");
      statements.push("Strong effort with developing results shows you're engaged, but targeted learning would improve your impact.");
      statements.push("Your commitment is clear, but your results suggest that additional training or a refined approach would enhance your effectiveness.");
    }
    
    // High efficacy, low effort (natural strength)
    if (efficacy >= 70 && effort < 50) {
      statements.push("You're achieving strong results with relatively low effort, indicating this is a natural strength that would benefit from more consistent attention.");
      statements.push("Your high impact with moderate commitment suggests you have innate ability here, but increased engagement would amplify your results.");
      statements.push("Exceptional effectiveness paired with developing effort shows you're naturally capable, and more structured commitment would maximize this strength.");
      statements.push("Your strong results demonstrate natural proficiency, and even small increases in consistent effort would produce outstanding outcomes.");
      statements.push("You have clear talent in this area, and more intentional engagement would help you leverage this strength more fully.");
    }
    
    // Low efficacy, high effort (working hard but not effective)
    if (efficacy < 50 && effort >= 70) {
      statements.push("You're investing significant effort but seeing limited results, indicating that your current approach needs fundamental adjustment or additional training.");
      statements.push("High commitment with lower effectiveness suggests that while your dedication is strong, your methods may not be the right fit for this challenge.");
      statements.push("Your strong effort isn't translating into desired outcomes, pointing to a need for skill development or a different strategy.");
      statements.push("Intense dedication with limited impact means you're working hard, but education and approach refinement are necessary to improve results.");
      statements.push("Your commitment is evident, but your results indicate that comprehensive training or method changes would help close this gap.");
    }
    
    // High efficacy, medium effort
    if (efficacy >= 70 && effort >= 50 && effort < 65) {
      statements.push("You're achieving excellent results with solid commitment, showing strong performance that would reach mastery with increased consistency.");
      statements.push("Your high impact combined with good effort demonstrates capability, and more structured engagement would elevate you to excellence.");
      statements.push("Strong effectiveness with developing commitment shows you're performing well, and increased focus would maximize your potential.");
      statements.push("Your results are impressive, and more consistent effort would help you achieve the mastery level your capability suggests.");
      statements.push("Excellent impact with moderate engagement indicates strong ability, and enhanced dedication would unlock even better outcomes.");
    }
    
    // Medium efficacy, high effort
    if (efficacy >= 50 && efficacy < 70 && effort >= 70) {
      statements.push("You're investing strong effort and seeing good results, suggesting that technique refinement or skill enhancement would improve your effectiveness.");
      statements.push("Your commitment is high and your results are solid, indicating that method improvement or additional training would elevate your impact.");
      statements.push("Good effort producing moderate results shows dedication, and focused skill-building would help align your outcomes with your investment.");
      statements.push("Your strong engagement demonstrates commitment, but targeted learning would help your effort translate into even better results.");
      statements.push("Solid results with high effort indicate you're on the right track, and skill development would maximize your effectiveness.");
    }
    
    // Default fallbacks
    if (statements.length === 0) {
      if (efficacy > effort) {
        statements.push("Your impact exceeds your commitment, suggesting that more consistent engagement would enhance your already strong results.");
        statements.push("You're achieving good results with moderate effort, indicating that increased focus would help you reach your full potential.");
        statements.push("Your effectiveness is ahead of your engagement, meaning more structured commitment would maximize your natural ability.");
      } else {
        statements.push("Your commitment exceeds your impact, indicating that skill development or method refinement would help your effort translate into better results.");
        statements.push("You're investing good effort but seeing moderate results, suggesting that training or technique improvement could enhance your effectiveness.");
        statements.push("Your dedication is clear, but your results suggest that additional learning or a refined approach would improve your outcomes.");
      }
    }
    
    // Select variation based on combination of scores
    const variationIdx = (Math.floor(efficacy / 5) + Math.floor(effort / 5) + Math.floor(delta / 5) + statementIdx) % statements.length;
    return statements[variationIdx] || statements[0] || "Your performance shows balanced development with room for growth in both effectiveness and commitment.";
  };
  
  // Helper function to get gradient color for gap
  // Range: 10 (green) to 50 (red), with white at 30 (middle)
  // Muted colors to match page theme
  const getGapColor = (gap) => {
    // Clamp gap to range 10-50
    const clampedGap = Math.max(10, Math.min(50, gap));
    
    if (clampedGap <= 30) {
      // Green (10) to White (30)
      // Muted green: rgb(100, 150, 100)
      // White: rgb(255, 255, 255)
      const normalized = (clampedGap - 10) / 20; // 0 to 1 from 10 to 30
      const r = Math.round(100 + normalized * 155);
      const g = Math.round(150 + normalized * 105);
      const b = Math.round(100 + normalized * 155);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // White (30) to Red (50)
      // White: rgb(255, 255, 255)
      // Muted red: rgb(200, 120, 120)
      const normalized = (clampedGap - 30) / 20; // 0 to 1 from 30 to 50
      const r = Math.round(255 - normalized * 55);
      const g = Math.round(255 - normalized * 135);
      const b = Math.round(255 - normalized * 135);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // Load intake data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('latestFormData');
    if (stored) {
      try {
        setIntakeData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse intake data:', e);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadBenchmarkData = async () => {
      try {
        const nextCampaignRows = getDashboardCampaignRows();
        if (active && nextCampaignRows.length) {
          setCampaignRows(nextCampaignRows);
        }

        const records = parseDashboardJson(localStorage.getItem('campaignRecords'), {});
        const teamCampaignId = records?.teamCampaignId;
        const selfCampaignId = records?.selfCampaignId;
        const ownerUid = auth?.currentUser?.uid || null;
        if (!teamCampaignId || !ownerUid) {
          if (active) {
            setBenchmarkGapData({
              teamResponses: useFakeDashboardData ? fakeData.responses : [],
              selfResponses: [],
            });
          }
          return;
        }

        const [teamSnap, selfSnap] = await Promise.all([
          getDocs(query(collection(db, 'surveyResponses'), where('campaignId', '==', teamCampaignId), where('ownerUid', '==', ownerUid))),
          selfCampaignId
            ? getDocs(query(collection(db, 'surveyResponses'), where('campaignId', '==', selfCampaignId), where('ownerUid', '==', ownerUid)))
            : Promise.resolve({ docs: [] }),
        ]);

        const teamResponses = teamSnap.docs.map((d) => d.data()).filter((d) => d?.ratings);
        const selfResponses = selfSnap.docs.map((d) => d.data()).filter((d) => d?.ratings);

        if (active) {
          setBenchmarkGapData({
            teamResponses: teamResponses.length ? teamResponses : (useFakeDashboardData ? fakeData.responses : []),
            selfResponses,
          });
        }
      } catch (err) {
        console.error('Failed to load benchmark gap data:', err);
        if (active) {
          setBenchmarkGapData({
            teamResponses: useFakeDashboardData ? fakeData.responses : [],
            selfResponses: [],
          });
        }
      }
    };

    loadBenchmarkData();
    return () => {
      active = false;
    };
  }, []);

  // Calculate all metrics
  useEffect(() => {
    if (!resolvedCampaignRows.length || !primaryResponses.length) {
      setTraitData({});
      setCriticalGaps([]);
      setPrimaryOpportunity(null);
      return;
    }

    const calculated = calculateCampaignTraitMetrics(resolvedCampaignRows, primaryResponses);
    setTraitData(calculated.traitData);
    setCriticalGaps(calculated.criticalGaps);
    setPrimaryOpportunity(calculated.criticalGaps[0] || null);
  }, [resolvedCampaignRows, primaryResponses]);

  const toggleTrait = (trait) => {
    setExpandedTraits(prev => ({
      ...prev,
      [trait]: !prev[trait]
    }));
  };

  const getLEPColor = (score) => {
    if (score > 80) return '#2F855A';
    if (score > 60) return '#38A169';
    if (score > 50) return '#ECC94B';
    if (score > 40) return '#F56565';
    return '#C53030';
  };

  const getDeltaColor = (delta) => {
    if (delta > 40) return '#F56565';
    if (delta > 30) return '#ECC94B';
    if (delta > 20) return '#ED8936';
    return '#38A169';
  };

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const traits = Object.values(traitData);
    if (traits.length === 0) return null;

    const avgLEP = traits.reduce((sum, t) => sum + t.lepScore, 0) / traits.length;
    const avgDelta = traits.reduce((sum, t) => sum + t.delta, 0) / traits.length;
    const avgEfficacy = traits.reduce((sum, t) => sum + t.efficacy, 0) / traits.length;
    const avgEffort = traits.reduce((sum, t) => sum + t.effort, 0) / traits.length;
    const highGapCount = traits.filter(t => t.delta > 30).length;

    return { avgLEP, avgDelta, avgEfficacy, avgEffort, highGapCount, totalTraits: traits.length };
  }, [traitData]);

  useEffect(() => {
    if (!selectedTraitKey && Object.keys(traitData).length > 0) {
      setSelectedTraitKey(Object.keys(traitData)[0]);
    }
  }, [traitData, selectedTraitKey]);

  useEffect(() => {
    if (!selectedDetailTraitKey && Object.keys(traitData).length > 0) {
      setSelectedDetailTraitKey(Object.keys(traitData)[0]);
    }
  }, [traitData, selectedDetailTraitKey]);

  useEffect(() => {
    setSelectedDetailRingIdx(0);
  }, [selectedDetailTraitKey]);

  const selectedTraitMetrics = useMemo(() => {
    if (!selectedTraitKey) return null;
    return traitData[selectedTraitKey] || null;
  }, [traitData, selectedTraitKey]);

  const selectedSubtraitLabel = useMemo(() => {
    if (!selectedTraitKey) return '';
    const match = resolvedCampaignRows.find((item) => item.trait === selectedTraitKey);
    return match?.subTrait || selectedTraitKey;
  }, [resolvedCampaignRows, selectedTraitKey]);

  const selectedTraitLibraryContext = useMemo(() => {
    const traitDef = CORE_TRAITS.find((trait) => String(trait?.name || '').toLowerCase() === String(selectedTraitKey || '').toLowerCase());
    const subTraitDef = traitDef?.subTraits?.find((subTrait) => String(subTrait?.name || '').toLowerCase() === String(selectedSubtraitLabel || '').toLowerCase());
    return summarizeTraitLibraryContext(traitDef, subTraitDef);
  }, [selectedSubtraitLabel, selectedTraitKey]);

  const intakeContextSummary = useMemo(() => summarizeIntakeContext(intakeData), [intakeData]);

  const getStatementIndexesForTrait = (traitKey) => {
    const idx = resolvedCampaignRows.findIndex((item) => item.trait === traitKey);
    if (idx === -1 || idx == null) return [];
    return Array.from({ length: 5 }, (_, i) => idx * 5 + i);
  };

  const toPercent = (value) => normalizeDashboardScore(value);
  const averageMetricForIndexes = (responses, statementIndexes, metric) => {
    if (!Array.isArray(responses) || responses.length === 0 || statementIndexes.length === 0) return null;
    const values = [];
    responses.forEach((response) => {
      statementIndexes.forEach((stmtIdx) => {
        const raw = response?.ratings?.[String(stmtIdx)]?.[metric];
        if (typeof raw === 'number') values.push(toPercent(raw));
      });
    });
    if (!values.length) return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const detailTraitOptions = useMemo(() => Object.keys(traitData).slice(0, 3), [traitData]);
  const detailTraitMetrics = useMemo(() => {
    if (!selectedDetailTraitKey) return null;
    return traitData[selectedDetailTraitKey] || null;
  }, [traitData, selectedDetailTraitKey]);
  const detailSubtraitLabel = useMemo(() => {
    if (!selectedDetailTraitKey) return '';
    const match = resolvedCampaignRows.find((item) => item.trait === selectedDetailTraitKey);
    return match?.subTrait || selectedDetailTraitKey;
  }, [resolvedCampaignRows, selectedDetailTraitKey]);
  const detailStatements = useMemo(() => (detailTraitMetrics?.statements || []).slice(0, 5), [detailTraitMetrics]);
  const selectedDetailStatement = useMemo(
    () => detailStatements[selectedDetailRingIdx] || detailStatements[0] || null,
    [detailStatements, selectedDetailRingIdx]
  );
  const detailQuestionTitle = useMemo(
    () => selectedDetailStatement?.text || detailSubtraitLabel,
    [selectedDetailStatement, detailSubtraitLabel]
  );

  const selectedTraitStatementIndexes = useMemo(
    () => getStatementIndexesForTrait(selectedTraitKey),
    [selectedTraitKey]
  );

  const selectedDetailStatementIndex = useMemo(() => {
    const idx = resolvedCampaignRows.findIndex((item) => item.trait === selectedDetailTraitKey);
    if (idx === -1 || idx == null) return null;
    return idx * 5 + selectedDetailRingIdx;
  }, [resolvedCampaignRows, selectedDetailTraitKey, selectedDetailRingIdx]);

  const detailEfficacyPerceptionGap = useMemo(() => {
    const fallback = (selectedDetailStatement?.efficacy ?? detailTraitMetrics?.efficacy ?? 0)
      - (selectedDetailStatement?.lepScore ?? detailTraitMetrics?.lepScore ?? 0);
    if (selectedDetailStatementIndex == null) return fallback;
    const indexes = [selectedDetailStatementIndex];
    const teamValue = averageMetricForIndexes(benchmarkGapData?.teamResponses, indexes, 'efficacy');
    const selfValue = averageMetricForIndexes(benchmarkGapData?.selfResponses, indexes, 'efficacy');
    if (teamValue == null || selfValue == null) return fallback;
    return teamValue - selfValue;
  }, [benchmarkGapData, selectedDetailStatementIndex, selectedDetailStatement, detailTraitMetrics]);

  const detailEffortPerceptionGap = useMemo(() => {
    const fallback = (selectedDetailStatement?.effort ?? detailTraitMetrics?.effort ?? 0)
      - (selectedDetailStatement?.lepScore ?? detailTraitMetrics?.lepScore ?? 0);
    if (selectedDetailStatementIndex == null) return fallback;
    const indexes = [selectedDetailStatementIndex];
    const teamValue = averageMetricForIndexes(benchmarkGapData?.teamResponses, indexes, 'effort');
    const selfValue = averageMetricForIndexes(benchmarkGapData?.selfResponses, indexes, 'effort');
    if (teamValue == null || selfValue == null) return fallback;
    return teamValue - selfValue;
  }, [benchmarkGapData, selectedDetailStatementIndex, selectedDetailStatement, detailTraitMetrics]);

  function trimToChars(text, max = 360) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= max) return normalized;
    const sliced = normalized.slice(0, max - 1);
    const lastSpace = sliced.lastIndexOf(' ');
    return `${(lastSpace > 180 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
  }

  function trimToWords(text, maxWords = 50) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    const words = normalized.split(' ');
    if (words.length <= maxWords) return normalized;
    return `${words.slice(0, maxWords).join(' ').trim()}…`;
  }

  const getCrossTraitPatterns = () => {
    if (!criticalGaps?.length) return 'No major cross-trait divergence detected.';
    return criticalGaps
      .slice(0, 2)
      .map((g) => `${g.trait} delta ${Number(g.delta || 0).toFixed(1)}`)
      .join('; ');
  };

  const getDeltaBand = (delta) => {
    const value = Math.abs(Number(delta || 0));
    if (value < 5) return 'small';
    if (value < 12) return 'moderate';
    return 'large';
  };

  const getScoreBand = (score) => {
    const value = Number(score || 0);
    if (value < 35) return 'early range';
    if (value < 55) return 'developing range';
    if (value < 75) return 'solid range';
    return 'strong range';
  };

  const getGapDirection = (gap) => {
    const value = Number(gap || 0);
    if (value > 1) return 'team_sees_more';
    if (value < -1) return 'team_sees_less';
    return 'aligned';
  };

  function summarizeTraitLibraryContext(traitDef, subTraitDef) {
    const details = [
      traitDef?.name,
      traitDef?.description,
      subTraitDef?.name,
      subTraitDef?.description,
      subTraitDef?.default,
      subTraitDef?.summary,
      subTraitDef?.impact?.default,
      subTraitDef?.peopleImpact?.default,
      subTraitDef?.formalEmpatheticCoach,
      subTraitDef?.balancedMentor,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    if (!details.length) return 'Trait library context unavailable.';
    return trimToChars(details.join(' | '), 700);
  }

  function summarizeIntakeContext(data) {
    if (!data || typeof data !== 'object') return 'Intake context unavailable.';
    const keys = [
      'warningLabel',
      'selfReflection',
      'whyNow',
      'leadershipVision',
      'biggestChallenge',
      'teamSize',
      'role',
      'industry',
    ];
    const pairs = keys
      .map((key) => {
        const value = data?.[key];
        const normalized = Array.isArray(value) ? value.join(', ') : String(value || '').trim();
        return normalized ? `${key}: ${normalized}` : '';
      })
      .filter(Boolean);

    if (!pairs.length) return 'Intake context unavailable.';
    return trimToChars(pairs.join(' | '), 700);
  }

  const getPerceptionGapMessage = (metric, gapValue) => {
    const gap = Number(gapValue || 0);
    const absGap = Math.abs(gap);
    const band =
      absGap < 5 ? 0
        : absGap < 10 ? 1
          : absGap < 20 ? 2
            : absGap < 30 ? 3
              : absGap < 40 ? 4
                : 5;

    const messages = {
      efficacy: {
        aligned: [
          'Your view of impact is closely aligned with your team. They are reading this trait in about the same way you are.',
          'There is very little daylight in efficacy here. The impact you believe you are having is largely the impact your team is reporting.',
          'Your self-view and team view of efficacy are mostly in sync, which suggests the signal around impact is fairly clear.',
          'The efficacy gap is small, so this trait appears to be landing about as expected from both sides.',
          'This is a relatively aligned efficacy picture. Your team is not reporting a materially different level of impact than you are.',
          'There is not much separation in efficacy here, so perception and team experience are tracking fairly closely.',
        ],
        positive: [
          'Your team sees slightly more impact here than you do, which suggests this trait may be landing a bit more clearly than you realize.',
          'The team is rating efficacy a little higher, so your influence in this area may be stronger than your own read suggests.',
          'This positive efficacy gap indicates your team is experiencing this trait more favorably than you are giving yourself credit for.',
          'Your team sees noticeably stronger impact here, which suggests the trait is landing better than your self-assessment implies.',
          'A gap this size suggests your team is receiving more value from this trait than you may currently recognize.',
          'Your team is reading efficacy much higher, which points to a materially stronger impact than your own self-view.',
        ],
        negative: [
          'Your team sees slightly less impact here than you do, which suggests the trait is not landing quite as strongly as intended.',
          'The team is rating efficacy lower, so there may be a mild disconnect between your intent and their actual experience.',
          'This negative efficacy gap suggests your impact is being felt as weaker than your self-view would imply.',
          'Your team is seeing meaningfully less efficacy here, which points to a clearer disconnect in how this trait is landing.',
          'A gap this size suggests your approach is not translating into the level of impact you believe it is.',
          'Your team is reading efficacy much lower, which demonstrates a major disconnect between intended impact and received experience.',
        ],
      },
      effort: {
        aligned: [
          'Your view of effort is closely aligned with your team. They are seeing about the same level of attention and energy that you believe you are giving.',
          'There is very little daylight in effort here, so the amount of visible energy in this trait is reading consistently.',
          'Your self-view and team view of effort are mostly in sync, which suggests your level of attention is coming through clearly.',
          'The effort gap is small, so your team is reading your consistency here about the same way you are.',
          'This is a relatively aligned effort picture. The amount of visible focus in this trait is not being interpreted very differently.',
          'There is not much separation in effort here, so your team perception of follow-through is fairly close to your own read.',
        ],
        positive: [
          'Your team sees slightly more effort here than you do, which suggests your attention to this trait is more visible than you may realize.',
          'The team is rating effort a little higher, so your consistency in this area may be showing up more clearly than you think.',
          'This positive effort gap indicates your team is noticing more energy and follow-through than your self-view suggests.',
          'Your team sees noticeably stronger effort here, which suggests your attention to this trait is more evident than expected.',
          'A gap this size suggests your team is clearly noticing the work you are putting into this area.',
          'Your team is reading effort much higher, which points to a very visible level of consistency and energy in this trait.',
        ],
        negative: [
          'Your team sees slightly less effort here than you do, which suggests some of your attention is not fully visible to them.',
          'The team is rating effort lower, so the consistency you feel may not be coming through as clearly as intended.',
          'This negative effort gap suggests your level of attention is being experienced as lighter than your self-view implies.',
          'Your team is seeing meaningfully less effort here, which points to a clearer disconnect in how visible your follow-through is.',
          'A gap this size suggests the work you believe you are putting in is not being fully felt by the team.',
          'Your team is reading effort much lower, which demonstrates a major disconnect in the visibility of your consistency and attention.',
        ],
      },
    };

    if (gap >= 5) return messages[metric]?.positive?.[band] || '';
    if (gap <= -5) return messages[metric]?.negative?.[band] || '';
    return messages[metric]?.aligned?.[band] || '';
  };

  const buildInsightPayload = (mode) => {
    const base = {
      view_type: mode === 'detailed' ? 'detailed_results' : 'campaign_results',
      selectedAgent: selectedAgentProp || intakeData?.selectedAgent || 'balancedMentor',
      overall_summary: overallMetrics
        ? `avgLEP ${overallMetrics.avgLEP.toFixed(1)}, avgDelta ${overallMetrics.avgDelta.toFixed(1)}, highGapCount ${overallMetrics.highGapCount}`
        : 'Overall metrics unavailable.',
      cross_trait_patterns: getCrossTraitPatterns(),
      confidence_context: confidenceContext,
    };

    if (mode === 'detailed') {
      const efficacy = selectedDetailStatement?.efficacy ?? detailTraitMetrics?.efficacy ?? 0;
      const effort = selectedDetailStatement?.effort ?? detailTraitMetrics?.effort ?? 0;
      const delta = selectedDetailStatement?.delta ?? detailTraitMetrics?.delta ?? 0;
      const significantGap = Math.abs(Number(delta || 0)) > 10;
      return {
        ...base,
        selected_subtrait: detailQuestionTitle || detailSubtraitLabel || selectedDetailTraitKey || 'Selected statement',
        trait_score: selectedDetailStatement?.lepScore ?? detailTraitMetrics?.lepScore ?? 0,
        score_band: getScoreBand(selectedDetailStatement?.lepScore ?? detailTraitMetrics?.lepScore ?? 0),
        efficacy_score: efficacy,
        effort_score: effort,
        significant_gap: significantGap,
        ...(significantGap
          ? {
              delta,
              delta_band: getDeltaBand(delta),
              perception_gap: `efficacy ${detailEfficacyPerceptionGap.toFixed(1)}, effort ${detailEffortPerceptionGap.toFixed(1)}`,
              efficacy_perception_gap: Number(detailEfficacyPerceptionGap || 0).toFixed(1),
              effort_perception_gap: Number(detailEffortPerceptionGap || 0).toFixed(1),
              effort_gap_direction: getGapDirection(detailEffortPerceptionGap),
              efficacy_gap_direction: getGapDirection(detailEfficacyPerceptionGap),
            }
          : {}),
        overall_baseline_comparison: overallMetrics
          ? `Selected LEP ${(selectedDetailStatement?.lepScore ?? detailTraitMetrics?.lepScore ?? 0).toFixed(1)} vs overall avg LEP ${overallMetrics.avgLEP.toFixed(1)}`
          : 'Overall baseline unavailable.',
      };
    }

    const efficacy = activeMetrics?.efficacy ?? 0;
    const effort = activeMetrics?.effort ?? 0;
    const delta = activeMetrics?.delta ?? 0;
    const significantGap = Math.abs(Number(delta || 0)) > 10;
    return {
      ...base,
      selected_subtrait: selectedSubtraitLabel || selectedTraitKey || 'Selected trait',
      trait_score: activeMetrics?.lepScore ?? 0,
      score_band: getScoreBand(activeMetrics?.lepScore ?? 0),
      efficacy_score: efficacy,
      effort_score: effort,
      trait_library_context: selectedTraitLibraryContext,
      intake_context_summary: intakeContextSummary,
      significant_gap: significantGap,
      ...(significantGap
        ? {
            delta,
            delta_band: getDeltaBand(delta),
            perception_gap: `efficacy ${efficacyPerceptionGap.toFixed(1)}, effort ${effortPerceptionGap.toFixed(1)}`,
            efficacy_perception_gap: Number(efficacyPerceptionGap || 0).toFixed(1),
            effort_perception_gap: Number(effortPerceptionGap || 0).toFixed(1),
            effort_gap_direction: getGapDirection(effortPerceptionGap),
            efficacy_gap_direction: getGapDirection(efficacyPerceptionGap),
          }
        : {}),
      overall_baseline_comparison: overallMetrics
        ? `Selected LEP ${(activeMetrics?.lepScore ?? 0).toFixed(1)} vs overall avg LEP ${overallMetrics.avgLEP.toFixed(1)}`
        : 'Overall baseline unavailable.',
    };
  };

  const buildInsightCacheKey = (mode, payload) => {
    const toFixed = (value) => Number(value || 0).toFixed(1);
    return [
      mode,
      payload?.selectedAgent || '',
      payload?.selected_subtrait || '',
      toFixed(payload?.trait_score),
      toFixed(payload?.efficacy_score),
      toFixed(payload?.effort_score),
      String(Boolean(payload?.significant_gap)),
      toFixed(payload?.delta),
      payload?.delta_band || '',
      toFixed(payload?.effort_perception_gap),
      toFixed(payload?.efficacy_perception_gap),
    ].join('|');
  };

  const requestAgentInsight = async (mode, opts = {}) => {
    const stateKey = mode === 'detailed' ? 'detailed' : 'compass';
    const payload = opts.payloadOverride || buildInsightPayload(mode);
    const cacheKey = buildInsightCacheKey(mode, payload);
    const cached = insightCacheRef.current.get(cacheKey);

    if (cached) {
      if (!opts.silent) {
        setInsightError((prev) => ({ ...prev, [stateKey]: '' }));
      }
      if (!opts.cacheOnly) {
        if (stateKey === 'detailed') setDetailAgentInsight(cached);
        else setCompassAgentInsight(cached);
      }
      return;
    }

    if (insightTimersRef.current[stateKey]) {
      window.clearTimeout(insightTimersRef.current[stateKey]);
      insightTimersRef.current[stateKey] = null;
    }

    if (insightAbortRef.current[stateKey]) {
      insightAbortRef.current[stateKey].abort();
      insightAbortRef.current[stateKey] = null;
    }

    const runFetch = async () => {
      const abortController = new AbortController();
      insightAbortRef.current[stateKey] = abortController;
      if (!opts.silent) {
        setInsightLoading((prev) => ({ ...prev, [stateKey]: true }));
        setInsightError((prev) => ({ ...prev, [stateKey]: '' }));
      }

      try {
      const res = await fetch('/api/get-agent-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error(`Insight request failed (${res.status})`);
      }

      const data = await res.json();
      const insightText = trimToChars(data?.insight || 'No insight available yet.');
      insightCacheRef.current.set(cacheKey, insightText);
      if (!opts.cacheOnly) {
        if (stateKey === 'detailed') {
          setDetailAgentInsight(insightText);
        } else {
          setCompassAgentInsight(insightText);
        }
      }
      } catch (err) {
        if (err?.name === 'AbortError') return;
      if (!opts.silent) {
        const message = 'Unable to generate interpretation right now.';
        setInsightError((prev) => ({ ...prev, [stateKey]: message }));
      }
      if (!opts.cacheOnly) console.error('Agent insight error:', err);
      } finally {
      if (!opts.silent) {
        setInsightLoading((prev) => ({ ...prev, [stateKey]: false }));
      }
      }
    };

    if (opts.immediate) {
      runFetch();
      return;
    }

    insightTimersRef.current[stateKey] = window.setTimeout(() => {
      runFetch();
      insightTimersRef.current[stateKey] = null;
    }, 320);
  };

  useEffect(() => () => {
    if (insightTimersRef.current.compass) window.clearTimeout(insightTimersRef.current.compass);
    if (insightTimersRef.current.detailed) window.clearTimeout(insightTimersRef.current.detailed);
    if (insightAbortRef.current.compass) insightAbortRef.current.compass.abort();
    if (insightAbortRef.current.detailed) insightAbortRef.current.detailed.abort();
  }, []);

  useEffect(() => {
    const traitKeys = Object.keys(traitData || {});
    if (!traitKeys.length || insightsPreloadedRef.current) return;
    insightsPreloadedRef.current = true;
    let cancelled = false;

    const prewarmAllInsights = async () => {
      const liveCampaignRows = resolvedCampaignRows;

      const buildCompassPayloadForTrait = (traitKey) => {
        const traitMetrics = traitData?.[traitKey];
        if (!traitMetrics) return null;
        const traitIdx = liveCampaignRows.findIndex((row) => row.trait === traitKey);
        const selectedSubtrait = liveCampaignRows?.[traitIdx]?.subTrait || traitKey;
        const statementIndexes = traitIdx >= 0 ? Array.from({ length: 5 }, (_, i) => traitIdx * 5 + i) : [];
        const teamEff = averageMetricForIndexes(benchmarkGapData?.teamResponses, statementIndexes, 'efficacy');
        const selfEff = averageMetricForIndexes(benchmarkGapData?.selfResponses, statementIndexes, 'efficacy');
        const teamEffort = averageMetricForIndexes(benchmarkGapData?.teamResponses, statementIndexes, 'effort');
        const selfEffort = averageMetricForIndexes(benchmarkGapData?.selfResponses, statementIndexes, 'effort');
        const effGap = teamEff == null || selfEff == null ? traitMetrics.efficacy - traitMetrics.lepScore : teamEff - selfEff;
        const effortGap = teamEffort == null || selfEffort == null ? traitMetrics.effort - traitMetrics.lepScore : teamEffort - selfEffort;

        const significantGap = Math.abs(Number(traitMetrics.delta || 0)) > 10;
        const traitDef = CORE_TRAITS.find((trait) => String(trait?.name || '').toLowerCase() === String(traitKey || '').toLowerCase());
        const subTraitDef = traitDef?.subTraits?.find((subTrait) => String(subTrait?.name || '').toLowerCase() === String(selectedSubtrait || '').toLowerCase());
        return {
          view_type: 'campaign_results',
          selectedAgent: selectedAgentProp || intakeData?.selectedAgent || 'balancedMentor',
          overall_summary: overallMetrics
            ? `avgLEP ${overallMetrics.avgLEP.toFixed(1)}, avgDelta ${overallMetrics.avgDelta.toFixed(1)}, highGapCount ${overallMetrics.highGapCount}`
            : 'Overall metrics unavailable.',
          cross_trait_patterns: getCrossTraitPatterns(),
          confidence_context: confidenceContext,
          selected_subtrait: selectedSubtrait,
          trait_score: traitMetrics.lepScore,
          score_band: getScoreBand(traitMetrics.lepScore),
          efficacy_score: traitMetrics.efficacy,
          effort_score: traitMetrics.effort,
          trait_library_context: summarizeTraitLibraryContext(traitDef, subTraitDef),
          intake_context_summary: summarizeIntakeContext(intakeData),
          significant_gap: significantGap,
          ...(significantGap
            ? {
                delta: traitMetrics.delta,
                delta_band: getDeltaBand(traitMetrics.delta),
                perception_gap: `efficacy ${Number(effGap).toFixed(1)}, effort ${Number(effortGap).toFixed(1)}`,
                efficacy_perception_gap: Number(effGap).toFixed(1),
                effort_perception_gap: Number(effortGap).toFixed(1),
                effort_gap_direction: getGapDirection(effortGap),
                efficacy_gap_direction: getGapDirection(effGap),
              }
            : {}),
          overall_baseline_comparison: overallMetrics
            ? `Selected LEP ${Number(traitMetrics.lepScore || 0).toFixed(1)} vs overall avg LEP ${overallMetrics.avgLEP.toFixed(1)}`
            : 'Overall baseline unavailable.',
        };
      };

      const buildDetailedPayload = (traitKey, ringIdx) => {
        const traitMetrics = traitData?.[traitKey];
        if (!traitMetrics) return null;
        const traitIdx = liveCampaignRows.findIndex((row) => row.trait === traitKey);
        if (traitIdx < 0) return null;
        const statement = traitMetrics?.statements?.[ringIdx];
        if (!statement) return null;
        const statementIndex = traitIdx * 5 + ringIdx;
        const teamEff = averageMetricForIndexes(benchmarkGapData?.teamResponses, [statementIndex], 'efficacy');
        const selfEff = averageMetricForIndexes(benchmarkGapData?.selfResponses, [statementIndex], 'efficacy');
        const teamEffort = averageMetricForIndexes(benchmarkGapData?.teamResponses, [statementIndex], 'effort');
        const selfEffort = averageMetricForIndexes(benchmarkGapData?.selfResponses, [statementIndex], 'effort');
        const effGap = teamEff == null || selfEff == null ? statement.efficacy - statement.lepScore : teamEff - selfEff;
        const effortGap = teamEffort == null || selfEffort == null ? statement.effort - statement.lepScore : teamEffort - selfEffort;
        const subLabel = liveCampaignRows?.[traitIdx]?.subTrait || traitKey;

        const significantGap = Math.abs(Number(statement.delta || 0)) > 10;
        return {
          view_type: 'detailed_results',
          selectedAgent: selectedAgentProp || intakeData?.selectedAgent || 'balancedMentor',
          overall_summary: overallMetrics
            ? `avgLEP ${overallMetrics.avgLEP.toFixed(1)}, avgDelta ${overallMetrics.avgDelta.toFixed(1)}, highGapCount ${overallMetrics.highGapCount}`
            : 'Overall metrics unavailable.',
          cross_trait_patterns: getCrossTraitPatterns(),
          confidence_context: confidenceContext,
          selected_subtrait: statement?.text || subLabel,
          trait_score: statement.lepScore,
          score_band: getScoreBand(statement.lepScore),
          efficacy_score: statement.efficacy,
          effort_score: statement.effort,
          significant_gap: significantGap,
          ...(significantGap
            ? {
                delta: statement.delta,
                delta_band: getDeltaBand(statement.delta),
                perception_gap: `efficacy ${Number(effGap).toFixed(1)}, effort ${Number(effortGap).toFixed(1)}`,
                efficacy_perception_gap: Number(effGap).toFixed(1),
                effort_perception_gap: Number(effortGap).toFixed(1),
                effort_gap_direction: getGapDirection(effortGap),
                efficacy_gap_direction: getGapDirection(effGap),
              }
            : {}),
          overall_baseline_comparison: overallMetrics
            ? `Selected LEP ${Number(statement?.lepScore || 0).toFixed(1)} vs overall avg LEP ${overallMetrics.avgLEP.toFixed(1)}`
            : 'Overall baseline unavailable.',
        };
      };

      for (const traitKey of traitKeys) {
        if (cancelled) return;
        const payload = buildCompassPayloadForTrait(traitKey);
        if (payload) {
          await requestAgentInsight('compass', { immediate: true, cacheOnly: true, silent: true, payloadOverride: payload });
        }
      }

      for (const traitKey of traitKeys) {
        for (let i = 0; i < 5; i += 1) {
          if (cancelled) return;
          const payload = buildDetailedPayload(traitKey, i);
          if (payload) {
            await requestAgentInsight('detailed', { immediate: true, cacheOnly: true, silent: true, payloadOverride: payload });
          }
        }
      }

      if (!cancelled) {
        requestAgentInsight(view === 'detailed' ? 'detailed' : 'compass', { immediate: true });
      }
    };

    prewarmAllInsights();
    return () => {
      cancelled = true;
    };
  }, [traitData, benchmarkGapData, selectedAgentProp, intakeData?.selectedAgent, intakeContextSummary, view, overallMetrics, resolvedCampaignRows, confidenceContext]);

  const activeMetrics = useMemo(() => {
    if (!overallMetrics) return null;
    return selectedTraitMetrics || {
      lepScore: overallMetrics.avgLEP,
      efficacy: overallMetrics.avgEfficacy,
      effort: overallMetrics.avgEffort,
      delta: overallMetrics.avgDelta,
    };
  }, [selectedTraitMetrics, overallMetrics]);

  const activeScore = useMemo(() => {
    if (!activeMetrics) return 0;
    if (selectedMetric === 'efficacy') return activeMetrics.efficacy;
    if (selectedMetric === 'effort') return activeMetrics.effort;
    return activeMetrics.lepScore;
  }, [activeMetrics, selectedMetric]);

  const efficacyPerceptionGap = useMemo(() => {
    if (!activeMetrics) return 0;
    const teamValue = averageMetricForIndexes(benchmarkGapData?.teamResponses, selectedTraitStatementIndexes, 'efficacy');
    const selfValue = averageMetricForIndexes(benchmarkGapData?.selfResponses, selectedTraitStatementIndexes, 'efficacy');
    if (teamValue == null || selfValue == null) return activeMetrics.efficacy - activeMetrics.lepScore;
    return teamValue - selfValue;
  }, [activeMetrics, benchmarkGapData, selectedTraitStatementIndexes]);

  const effortPerceptionGap = useMemo(() => {
    if (!activeMetrics) return 0;
    const teamValue = averageMetricForIndexes(benchmarkGapData?.teamResponses, selectedTraitStatementIndexes, 'effort');
    const selfValue = averageMetricForIndexes(benchmarkGapData?.selfResponses, selectedTraitStatementIndexes, 'effort');
    if (teamValue == null || selfValue == null) return activeMetrics.effort - activeMetrics.lepScore;
    return teamValue - selfValue;
  }, [activeMetrics, benchmarkGapData, selectedTraitStatementIndexes]);

  const buildGapNarrative = (deltaValue, efficacyGapValue, effortGapValue) => {
    const delta = Math.abs(Number(deltaValue || 0));
    const efficacyGap = Number(efficacyGapValue || 0);
    const effortGap = Number(effortGapValue || 0);

    const directionLine = (label, gap) => {
      if (gap <= -10) {
        return `Your team rates ${label} lower than your self-view, so the current experience is landing weaker than intended.`;
      }
      if (gap >= 10) {
        return `Your team rates ${label} higher than your self-view, which suggests you may be underestimating your leadership impact.`;
      }
      return `${label[0].toUpperCase()}${label.slice(1)} perception is broadly aligned between self and team.`;
    };

    if (Math.abs(efficacyGap) < 10 && Math.abs(effortGap) < 10) {
      return 'Self and team perception are mostly aligned across efficacy and effort. Differences are minor and likely reflect normal communication noise rather than a major leadership disconnect.';
    }

    const significance = delta >= 10
      ? 'The efficacy-effort spread is significant, so this perception context deserves attention.'
      : 'The efficacy-effort spread is not significant, so this is more about perception calibration than performance risk.';

    return `${significance} ${directionLine('efficacy', efficacyGap)} ${directionLine('effort', effortGap)}`;
  };

  const efficacyPerceptionNarrative = useMemo(
    () => getPerceptionGapMessage('efficacy', efficacyPerceptionGap),
    [efficacyPerceptionGap]
  );

  const effortPerceptionNarrative = useMemo(
    () => getPerceptionGapMessage('effort', effortPerceptionGap),
    [effortPerceptionGap]
  );

  const detailEfficacyPerceptionNarrative = useMemo(
    () => getPerceptionGapMessage('efficacy', detailEfficacyPerceptionGap),
    [detailEfficacyPerceptionGap]
  );

  const detailEffortPerceptionNarrative = useMemo(
    () => getPerceptionGapMessage('effort', detailEffortPerceptionGap),
    [detailEffortPerceptionGap]
  );

  const detailStatementComparisonRows = useMemo(() => {
    return detailStatements.map((stmt, idx) => {
      const scoreGap = Math.abs(Number(stmt?.effort || 0) - Number(stmt?.efficacy || 0));

      return {
        id: `statement-row-${idx}`,
        idx,
        text: stmt?.text || `Statement ${idx + 1}`,
        overall: Number(stmt?.lepScore || 0),
        efficacy: Number(stmt?.efficacy || 0),
        effort: Number(stmt?.effort || 0),
        scoreGap,
      };
    });
  }, [
    detailStatements,
  ]);

  useEffect(() => {
    if (view !== 'compass') return;
    if (!activeMetrics || !selectedTraitKey) return;
    requestAgentInsight('compass');
  }, [
    view,
    selectedTraitKey,
    selectedSubtraitLabel,
    selectedAgentProp,
    selectedTraitLibraryContext,
    intakeContextSummary,
    activeMetrics?.lepScore,
    activeMetrics?.efficacy,
    activeMetrics?.effort,
    activeMetrics?.delta,
    efficacyPerceptionGap,
    effortPerceptionGap,
    benchmarkGapData?.teamResponses?.length,
    benchmarkGapData?.selfResponses?.length,
  ]);

  useEffect(() => {
    if (view !== 'detailed') return;
    if (!selectedDetailTraitKey || !detailTraitMetrics) return;
    requestAgentInsight('detailed');
  }, [
    view,
    selectedDetailTraitKey,
    selectedDetailRingIdx,
    selectedAgentProp,
    selectedDetailStatement?.lepScore,
    selectedDetailStatement?.efficacy,
    selectedDetailStatement?.effort,
    selectedDetailStatement?.delta,
    detailTraitMetrics?.lepScore,
    detailTraitMetrics?.efficacy,
    detailTraitMetrics?.effort,
    detailTraitMetrics?.delta,
    detailEfficacyPerceptionGap,
    detailEffortPerceptionGap,
    benchmarkGapData?.teamResponses?.length,
    benchmarkGapData?.selfResponses?.length,
  ]);

  // Map intake responses to insights
  const selfPerceptionInsights = useMemo(() => {
    if (!intakeData) return null;

    const insights = [];
    
    // Check for self-awareness indicators
    if (intakeData.selfReflection) {
      insights.push({
        type: 'self-awareness',
        text: 'You identified areas for growth in your intake',
        relevance: 'high',
      });
    }

    // Check warning label (self-perception)
    if (intakeData.warningLabel) {
      insights.push({
        type: 'self-perception',
        text: `Your self-perception: "${intakeData.warningLabel}"`,
        relevance: 'medium',
      });
    }

    return insights;
  }, [intakeData]);

  return (
    !teamCampaignClosed ? (
      <Paper
        sx={{
          p: 3,
          borderRadius: 2.2,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(241,246,255,0.86))',
          boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.35rem', fontWeight: 700, mb: 0.9, color: 'text.primary' }}>
          Results unlock after you close the survey
        </Typography>
        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', color: 'text.secondary', lineHeight: 1.65, maxWidth: 760, mx: 'auto' }}>
          Keep collecting responses from your team. The Growth Campaign dashboard will show submitted responses and anonymous opt outs while the survey is open. Once you close the survey, Compass will unlock the analytics and interpretation views.
        </Typography>
      </Paper>
    ) : (
    <Stack spacing={4}>
          {/* Combined Trait Circular Graph */}
          {view === 'compass' && Object.keys(traitData).length > 0 && (
            <Card sx={{ 
              background: 'transparent',
              border: 'none',
              borderRadius: 3,
              boxShadow: 'none',
            }}>
              <CardContent sx={{ px: { xs: 0.8, md: 1.2 }, pt: 0.6, pb: '8px !important' }}>
                <Grid container spacing={1.4} alignItems="stretch" sx={{ minHeight: { lg: 560 } }}>
                  <Grid item xs={12} lg={6} sx={{ display: 'flex' }}>
                    <Paper
                      sx={{
                        width: '100%',
                        p: { xs: 1.2, md: 1.5 },
                        borderRadius: 2.6,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(241,246,255,0.86))',
                        boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
                      }}
                    >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        minHeight: { xs: 420, md: 500, lg: 'auto' },
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 2.2,
                        border: '1px solid rgba(67,95,123,0.32)',
                        background:
                          'radial-gradient(620px 380px at 50% 44%, rgba(220,230,241,0.92), rgba(204,218,233,0.88))',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.32)',
                        overflow: 'hidden',
                      }}
                    >
                      <Box sx={{ position: 'relative', width: '100%', maxWidth: { xs: 430, md: 520, lg: 560 }, aspectRatio: '1 / 1', mx: 'auto' }}>
                        <svg width="100%" height="100%" viewBox="0 0 600 600" style={{ position: 'absolute', top: 0, left: 0 }}>
                          {(() => {
                            const centerX = 300;
                            const centerY = 300;
                            const traits = Object.entries(traitData);
                            const ringScale = 1.2;
                            const radii = [120, 160, 200].map((r) => r * ringScale);

                            const toSVGAngle = (userAngle) => {
                              let svgAngle = (userAngle - 90) % 360;
                              if (svgAngle < 0) svgAngle += 360;
                              return (svgAngle * Math.PI) / 180;
                            };

                            const createArcPath = (radius, startAngleUser, endAngleUser, sweepFlag = 1) => {
                              const startAngleSVG = toSVGAngle(startAngleUser);
                              const endAngleSVG = toSVGAngle(endAngleUser);
                              const start = { x: centerX + radius * Math.cos(startAngleSVG), y: centerY + radius * Math.sin(startAngleSVG) };
                              const end = { x: centerX + radius * Math.cos(endAngleSVG), y: centerY + radius * Math.sin(endAngleSVG) };
                              return `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 ${sweepFlag} ${end.x} ${end.y}`;
                            };

                            const getArcLength = (radius) => Math.PI * radius;
                            const allOverallScores = traits.flatMap(([, d]) => [d.efficacy, d.effort]).filter((v) => typeof v === 'number');
                            const lowestOverallScore = allOverallScores.length ? Math.min(...allOverallScores) : 0;
                            const minScaleScore = Math.max(0, lowestOverallScore - 20);
                            const scaleSpan = Math.max(1, 100 - minScaleScore);
                            const normalizeScore = (score) => {
                              const n = (score - minScaleScore) / scaleSpan;
                              return Math.min(1, Math.max(0, n));
                            };

                            return (
                              <>
                                {traits.map(([trait, data], traitIdx) => {
                                  const radius = radii[traitIdx];
                                  const arcLength = getArcLength(radius);
                                  const normalizedEfficacy = normalizeScore(data.efficacy);
                                  const filledLength = normalizedEfficacy * arcLength;
                                  const endAngleSVG = toSVGAngle(180 + normalizedEfficacy * 180);
                                  const endX = centerX + radius * Math.cos(endAngleSVG);
                                  const endY = centerY + radius * Math.sin(endAngleSVG);
                                  return (
                                    <g key={`efficacy-trait-${traitIdx}`}>
                                      <path d={createArcPath(radius, 180, 0, 1)} fill="none" stroke="rgba(180,201,223,0.68)" strokeWidth="30" />
                                      <path d={createArcPath(radius - 15, 180, 0, 1)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.2" />
                                      <path d={createArcPath(radius + 15, 180, 0, 1)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.2" />
                                      <path
                                        d={createArcPath(radius, 180, 0, 1)}
                                        fill="none"
                                        stroke={trait === selectedTraitKey ? '#6393AA' : 'rgba(101,118,137,0.68)'}
                                        strokeWidth={trait === selectedTraitKey ? '33' : '24'}
                                        strokeDasharray={`${filledLength} ${arcLength}`}
                                        style={{ transition: 'stroke 0.25s ease, stroke-dasharray 0.5s ease' }}
                                      />
                                      <circle
                                        cx={endX}
                                        cy={endY}
                                        r={trait === selectedTraitKey ? '16' : '12'}
                                        fill={trait === selectedTraitKey ? '#5D9DC2' : 'rgba(96,112,131,0.72)'}
                                        stroke={trait === selectedTraitKey ? 'rgba(224,243,255,0.82)' : 'rgba(17,24,39,0.5)'}
                                        strokeWidth={trait === selectedTraitKey ? '2.4' : '1.6'}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => {
                                          const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                          if (svgRect) {
                                            setHoveredCircle({ type: 'efficacy', traitIdx, value: data.efficacy, trait });
                                            setMousePosition({ x: e.clientX - svgRect.left, y: e.clientY - svgRect.top });
                                          }
                                        }}
                                        onMouseMove={(e) => {
                                          const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                          if (svgRect) setMousePosition({ x: e.clientX - svgRect.left, y: e.clientY - svgRect.top });
                                        }}
                                        onMouseLeave={() => setHoveredCircle(null)}
                                      />
                                    </g>
                                  );
                                })}

                                {traits.map(([trait, data], traitIdx) => {
                                  const radius = radii[traitIdx];
                                  const arcLength = getArcLength(radius);
                                  const normalizedEffort = normalizeScore(data.effort);
                                  const filledLength = normalizedEffort * arcLength;
                                  const endAngleSVG = toSVGAngle(180 - normalizedEffort * 180);
                                  const endX = centerX + radius * Math.cos(endAngleSVG);
                                  const endY = centerY + radius * Math.sin(endAngleSVG);
                                  return (
                                    <g key={`effort-trait-${traitIdx}`}>
                                      <path d={createArcPath(radius, 180, 0, 0)} fill="none" stroke="rgba(180,201,223,0.68)" strokeWidth="30" />
                                      <path d={createArcPath(radius - 15, 180, 0, 0)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.2" />
                                      <path d={createArcPath(radius + 15, 180, 0, 0)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.2" />
                                      <path
                                        d={createArcPath(radius, 180, 0, 0)}
                                        fill="none"
                                        stroke={trait === selectedTraitKey ? '#E07A3F' : 'rgba(101,118,137,0.68)'}
                                        strokeWidth={trait === selectedTraitKey ? '33' : '24'}
                                        strokeDasharray={`${filledLength} ${arcLength}`}
                                        style={{ transition: 'stroke 0.25s ease, stroke-dasharray 0.5s ease' }}
                                      />
                                      <circle
                                        cx={endX}
                                        cy={endY}
                                        r={trait === selectedTraitKey ? '16' : '12'}
                                        fill={trait === selectedTraitKey ? '#E88A4D' : 'rgba(96,112,131,0.72)'}
                                        stroke={trait === selectedTraitKey ? 'rgba(255,234,220,0.82)' : 'rgba(17,24,39,0.5)'}
                                        strokeWidth={trait === selectedTraitKey ? '2.4' : '1.6'}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => {
                                          const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                          if (svgRect) {
                                            setHoveredCircle({ type: 'effort', traitIdx, value: data.effort, trait });
                                            setMousePosition({ x: e.clientX - svgRect.left, y: e.clientY - svgRect.top });
                                          }
                                        }}
                                        onMouseMove={(e) => {
                                          const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                          if (svgRect) setMousePosition({ x: e.clientX - svgRect.left, y: e.clientY - svgRect.top });
                                        }}
                                        onMouseLeave={() => setHoveredCircle(null)}
                                      />
                                    </g>
                                  );
                                })}

                                {traits.map(([trait], traitIdx) => {
                                  const radius = radii[traitIdx];
                                  const svgAngle = toSVGAngle(180);
                                  const labelX = centerX + radius * Math.cos(svgAngle);
                                  const labelY = centerY + radius * Math.sin(svgAngle) + 2;
                                  const active = trait === selectedTraitKey;
                                  const labelSubtrait = resolvedCampaignRows.find((item) => item.trait === trait)?.subTrait || trait;
                                  return (
                                    <g
                                      key={`label-${traitIdx}`}
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => setSelectedTraitKey(trait)}
                                    >
                                      <rect
                                        x={labelX - 116}
                                        y={labelY - 15}
                                        width={232}
                                        height={30}
                                        rx={15}
                                        fill={active ? 'rgba(255,246,236,0.98)' : 'rgba(255,255,255,0.92)'}
                                        stroke={active ? '#E07A3F' : 'rgba(15,23,42,0.82)'}
                                        strokeWidth={active ? '2.5' : '2'}
                                      />
                                      <text
                                        x={labelX}
                                        y={labelY + 5}
                                        textAnchor="middle"
                                        fontSize="17"
                                        fontFamily="Gemunu Libre, sans-serif"
                                        fontWeight="700"
                                        fill={active ? '#111' : '#3F4752'}
                                      >
                                        {labelSubtrait}
                                      </text>
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>

                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                          <Box sx={{
                            width: 178,
                            height: 178,
                            position: 'relative',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.24)',
                            border: '3px solid',
                            borderColor: selectedMetric === 'efficacy' ? '#6393AA' : selectedMetric === 'effort' ? '#E07A3F' : 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '94%',
                                height: '94%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                zIndex: 0,
                                boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.22)',
                              }}
                            >
                              <Box
                                component="img"
                                src="/CompassLogo.png"
                                alt=""
                                sx={{
                                  width: '158%',
                                  height: '158%',
                                  position: 'absolute',
                                  top: '-29%',
                                  left: '-29%',
                                  objectFit: 'cover',
                                  filter: 'brightness(0.66)',
                                  display: 'block',
                                }}
                              />
                            </Box>
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '3.1rem', fontWeight: 700, color: 'white', lineHeight: 1, transform: 'translateY(1px)' }}>
                              {activeScore.toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>

                        {hoveredCircle && (
                          <Box sx={{
                            position: 'absolute',
                            top: `${mousePosition.y}px`,
                            left: `${mousePosition.x + 40}px`,
                            zIndex: 20,
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.95))',
                            border: '2px solid',
                            borderColor: hoveredCircle.type === 'efficacy' ? 'secondary.main' : 'primary.main',
                            borderRadius: 3,
                            boxShadow: 8,
                            p: 1.5,
                            minWidth: '120px',
                            pointerEvents: 'none',
                          }}>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.78rem', color: 'text.primary', mb: 0.4, textAlign: 'center', fontWeight: 700 }}>
                              {hoveredCircle.trait}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.7rem', fontStyle: 'italic', color: 'text.secondary', mb: 0.4, textAlign: 'center' }}>
                              {hoveredCircle.type.toUpperCase()}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: hoveredCircle.type === 'efficacy' ? '#6393AA' : '#E07A3F', textAlign: 'center' }}>
                              {hoveredCircle.value.toFixed(1)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} lg={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Paper
                      sx={{
                        width: '100%',
                        p: { xs: 1.35, md: 1.6 },
                        borderRadius: 2.6,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(241,246,255,0.86))',
                        boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
                      }}
                    >
                    <Box sx={{ width: '100%', maxWidth: { xs: 760, lg: 760 }, mx: 'auto' }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '0.92fr 1.08fr' },
                          gap: 1.1,
                          mb: 0.65,
                        }}
                      >
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#385772', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                          Scores
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#385772', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                          Interpretations & Insights
                        </Typography>
                      </Box>
                      {!!insightError.compass && (
                        <Alert severity="warning" sx={{ mb: 1.1 }}>
                          {insightError.compass}
                        </Alert>
                      )}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '0.92fr 1.08fr' },
                          gridTemplateRows: { xs: 'repeat(7, minmax(92px, auto))', md: 'repeat(5, minmax(92px, auto))' },
                          gap: 1.1,
                        }}
                      >
                        {[
                          { key: 'overall', label: 'Overall Score', value: activeMetrics?.lepScore || 0, color: '#1F3347' },
                          { key: 'efficacy', label: 'Efficacy Score', value: activeMetrics?.efficacy || 0, color: '#6393AA' },
                          { key: 'effort', label: 'Effort Score', value: activeMetrics?.effort || 0, color: '#E07A3F' },
                          { key: 'gap-efficacy', label: 'Perception Gap (Efficacy)', value: efficacyPerceptionGap, color: '#6393AA', signed: true },
                          { key: 'gap-effort', label: 'Perception Gap (Effort)', value: effortPerceptionGap, color: '#E07A3F', signed: true },
                        ].map((item, idx) => (
                          <Paper
                            key={item.key}
                            sx={{
                              gridColumn: { xs: '1 / -1', md: '1 / 2' },
                              gridRow: { xs: 'auto', md: `${idx + 1} / ${idx + 2}` },
                              p: 1.05,
                              borderRadius: 2,
                              border: '1px solid rgba(22,66,103,0.26)',
                              background: 'rgba(255,255,255,0.92)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#45586A', lineHeight: 1.1, mb: 0.55 }}>
                              {item.label}
                            </Typography>
                            <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: item.color, lineHeight: 1 }}>
                              {item.signed
                                ? `${Number(item.value || 0) >= 0 ? '+' : ''}${Number(item.value || 0).toFixed(1)}`
                                : Number(item.value || 0).toFixed(1)}
                            </Typography>
                          </Paper>
                        ))}

                        <Paper
                          sx={{
                            gridColumn: { xs: '1 / -1', md: '2 / 3' },
                            gridRow: { xs: 'auto', md: '1 / 4' },
                            p: 1.35,
                            borderRadius: 2,
                            border: '1px solid rgba(69,112,137,0.35)',
                            bgcolor: 'rgba(255,255,255,0.96)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                          }}
                        >
                          <Typography sx={{ fontSize: '0.94rem', color: '#1F3347', lineHeight: 1.55 }}>
                            {insightLoading.compass && !compassAgentInsight
                              ? 'Generating interpretation...'
                              : (compassAgentInsight || 'Interpretation will load automatically for the selected view.')}
                          </Typography>
                        </Paper>

                        {[
                          {
                            key: 'efficacy-gap-context',
                            title: 'Efficacy Interpretation',
                            text: efficacyPerceptionNarrative,
                            row: '4 / 5',
                          },
                          {
                            key: 'effort-gap-context',
                            title: 'Effort Interpretation',
                            text: effortPerceptionNarrative,
                            row: '5 / 6',
                          },
                        ].map((item) => (
                          <Paper
                            key={item.key}
                            sx={{
                              gridColumn: { xs: '1 / -1', md: '2 / 3' },
                              gridRow: { xs: 'auto', md: item.row },
                              p: 1.25,
                              borderRadius: 2,
                              border: '1px solid rgba(69,112,137,0.35)',
                              bgcolor: 'rgba(255,255,255,0.96)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              gap: 0.45,
                            }}
                          >
                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 800, color: '#4B6278', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {item.title}
                            </Typography>
                            <Typography sx={{ fontSize: '0.88rem', color: '#2E465B', lineHeight: 1.5 }}>
                              {item.text}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {view === 'detailed' && Object.keys(traitData).length > 0 && detailTraitMetrics && (
            <Card
              sx={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ px: { xs: 0.8, md: 1.2 }, pt: 0.6 }}>
                <Stack direction="row" spacing={1.2} justifyContent="center" sx={{ mb: 1.4 }}>
                  {detailTraitOptions.map((traitKey) => {
                    const subLabel = resolvedCampaignRows.find((item) => item.trait === traitKey)?.subTrait || traitKey;
                    const active = selectedDetailTraitKey === traitKey;
                    return (
                      <Button
                        key={traitKey}
                        variant={active ? 'contained' : 'outlined'}
                        onClick={() => setSelectedDetailTraitKey(traitKey)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 2,
                          bgcolor: active ? undefined : 'white',
                          color: active ? undefined : 'text.primary',
                          borderColor: active ? undefined : 'rgba(0,0,0,0.24)',
                          '&:hover': {
                            bgcolor: active ? undefined : 'rgba(255,255,255,0.92)',
                          },
                        }}
                      >
                        {subLabel}
                      </Button>
                    );
                  })}
                </Stack>
                <Paper
                  sx={{
                    width: '100%',
                    maxWidth: 1120,
                    mx: 'auto',
                    mb: 1.5,
                    p: { xs: 1.7, md: 2.2 },
                    borderRadius: 2.4,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.94), rgba(241,246,255,0.88))',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
                  }}
                >
                  <Box sx={{ overflowX: 'auto', pb: 0.2 }}>
                    <Box sx={{ minWidth: 920 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3.1fr) repeat(4, minmax(94px, 0.9fr))', gap: 0, px: 0.1, pb: 0.8 }}>
                        {[
                          'Statement',
                          'Overall',
                          'Efficacy',
                          'Effort',
                          'Gap',
                        ].map((header) => (
                          <Box
                            key={header}
                            sx={{
                              position: 'relative',
                              minHeight: 56,
                              px: 1.2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              '&:after': header !== 'Gap' ? {
                                content: '""',
                                position: 'absolute',
                                right: 0,
                                top: '12.5%',
                                height: '75%',
                                width: '1px',
                                bgcolor: 'rgba(76,101,124,0.16)',
                              } : {},
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.86rem',
                                fontWeight: 800,
                                color: '#4B6278',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                textAlign: 'center',
                              }}
                            >
                              {header}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      <Stack spacing={0.85}>
                        {detailStatementComparisonRows.map((row) => {
                          const isSelected = row.idx === selectedDetailRingIdx;
                          return (
                            <Box
                              key={row.id}
                              onClick={() => setSelectedDetailRingIdx(row.idx)}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 3.1fr) repeat(4, minmax(94px, 0.9fr))',
                                gap: 0,
                                alignItems: 'center',
                                p: 0,
                                borderRadius: 1.9,
                                border: isSelected ? '1px solid rgba(69,112,137,0.48)' : '1px solid rgba(67,95,123,0.16)',
                                background: isSelected
                                  ? 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(232,241,249,0.92))'
                                  : 'rgba(255,255,255,0.82)',
                                boxShadow: isSelected ? '0 8px 18px rgba(15,23,42,0.08)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                                '&:hover': {
                                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(236,243,250,0.94))',
                                  borderColor: 'rgba(69,112,137,0.32)',
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'relative',
                                  minWidth: 0,
                                  minHeight: 92,
                                  px: 1.4,
                                  py: 1.25,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  '&:after': {
                                    content: '""',
                                    position: 'absolute',
                                    right: 0,
                                    top: '12.5%',
                                    height: '75%',
                                    width: '1px',
                                    bgcolor: 'rgba(76,101,124,0.16)',
                                  },
                                }}
                              >
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1F3347', lineHeight: 1.4, textAlign: 'center' }}>
                                  {row.text}
                                </Typography>
                              </Box>

                              {[
                                { value: row.overall.toFixed(1), color: '#1F3347' },
                                { value: row.efficacy.toFixed(1), color: '#6393AA' },
                                { value: row.effort.toFixed(1), color: '#E07A3F' },
                                { value: row.scoreGap.toFixed(1), color: row.scoreGap >= 20 ? '#C85A2A' : row.scoreGap >= 10 ? '#A05B35' : '#2E5B77', isLast: true },
                              ].map((cell, cellIdx) => (
                                <Box
                                  key={`${row.id}-cell-${cellIdx}`}
                                  sx={{
                                    position: 'relative',
                                    minHeight: 92,
                                    px: 1.2,
                                    py: 1.2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    '&:after': !cell.isLast ? {
                                      content: '""',
                                      position: 'absolute',
                                      right: 0,
                                      top: '12.5%',
                                      height: '75%',
                                      width: '1px',
                                      bgcolor: 'rgba(76,101,124,0.16)',
                                    } : {},
                                  }}
                                >
                                  <Typography sx={{ fontSize: '1.42rem', fontWeight: 800, color: cell.color, textAlign: 'center', lineHeight: 1 }}>
                                    {cell.value}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Box>
                </Paper>

                <Divider
                  sx={{
                    width: '100%',
                    maxWidth: 1120,
                    mx: 'auto',
                    my: 0.55,
                    borderColor: 'rgba(95,119,142,0.28)',
                  }}
                />

                <Paper
                  sx={{
                    width: '100%',
                    maxWidth: 1120,
                    mx: 'auto',
                    mb: 1.35,
                    px: { xs: 1.45, md: 1.95 },
                    py: { xs: 1.1, md: 1.2 },
                    borderRadius: 2.2,
                    border: '1px solid rgba(220,232,245,0.28)',
                    bgcolor: 'rgba(58,82,108,0.62)',
                    boxShadow: '0 8px 20px rgba(8,16,28,0.2), inset 0 0 0 1px rgba(255,255,255,0.08)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 700,
                      color: 'rgba(250,253,255,0.97)',
                      lineHeight: 1.4,
                      textWrap: 'balance',
                      maxWidth: 920,
                      mx: 'auto',
                    }}
                  >
                    {detailQuestionTitle}
                  </Typography>
                </Paper>

                <Grid container spacing={1.5} alignItems="stretch" sx={{ minHeight: { lg: 560 } }}>
                  <Grid item xs={12} lg={5.4} sx={{ display: 'flex' }}>
                    <Paper
                      sx={{
                        width: '100%',
                        p: { xs: 1.2, md: 1.5 },
                        borderRadius: 2.6,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(241,246,255,0.86))',
                        boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
                      }}
                    >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        minHeight: { xs: 420, md: 500, lg: 'auto' },
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 2.2,
                        border: '1px solid rgba(67,95,123,0.32)',
                        background:
                          'radial-gradient(620px 380px at 50% 44%, rgba(220,230,241,0.92), rgba(204,218,233,0.88))',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.32)',
                        overflow: 'hidden',
                      }}
                    >
                      <Box sx={{ position: 'relative', width: '100%', maxWidth: { xs: 430, md: 520, lg: 560 }, aspectRatio: '1 / 1', mx: 'auto' }}>
                        <svg width="100%" height="100%" viewBox="0 0 600 600" style={{ position: 'absolute', top: 0, left: 0 }}>
                          {(() => {
                            const centerX = 300;
                            const centerY = 300;
                            const statements = detailStatements;
                            const radii = [110, 149, 188, 227, 264];
                            const toSVGAngle = (userAngle) => {
                              let svgAngle = (userAngle - 90) % 360;
                              if (svgAngle < 0) svgAngle += 360;
                              return (svgAngle * Math.PI) / 180;
                            };
                            const createArcPath = (radius, startAngleUser, endAngleUser, sweepFlag = 1) => {
                              const startAngleSVG = toSVGAngle(startAngleUser);
                              const endAngleSVG = toSVGAngle(endAngleUser);
                              const start = { x: centerX + radius * Math.cos(startAngleSVG), y: centerY + radius * Math.sin(startAngleSVG) };
                              const end = { x: centerX + radius * Math.cos(endAngleSVG), y: centerY + radius * Math.sin(endAngleSVG) };
                              return `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 ${sweepFlag} ${end.x} ${end.y}`;
                            };
                            const allScores = statements.flatMap((s) => [s?.efficacy || 0, s?.effort || 0]);
                            const minScale = Math.max(0, (allScores.length ? Math.min(...allScores) : 0) - 20);
                            const span = Math.max(1, 100 - minScale);
                            const norm = (v) => Math.max(0, Math.min(1, ((v || 0) - minScale) / span));
                            const getArcLength = (r) => Math.PI * r;
                            return (
                              <>
                                {statements.map((stmt, idx) => {
                                  const radius = radii[idx];
                                  if (!radius) return null;
                                  const arcLength = getArcLength(radius);
                                  const eNorm = norm(stmt.efficacy);
                                  const eLen = eNorm * arcLength;
                                  const eAngle = toSVGAngle(180 + eNorm * 180);
                                  const ex = centerX + radius * Math.cos(eAngle);
                                  const ey = centerY + radius * Math.sin(eAngle);
                                  return (
                                    <g key={`detail-e-${idx}`}>
                                      <path d={createArcPath(radius, 180, 0, 1)} fill="none" stroke="rgba(180,201,223,0.68)" strokeWidth="21" />
                                      <path d={createArcPath(radius - 10.5, 180, 0, 1)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.1" />
                                      <path d={createArcPath(radius + 10.5, 180, 0, 1)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.1" />
                                      <path
                                        d={createArcPath(radius, 180, 0, 1)}
                                        fill="none"
                                        stroke={idx === selectedDetailRingIdx ? '#6393AA' : 'rgba(101,118,137,0.7)'}
                                        strokeWidth={idx === selectedDetailRingIdx ? '24' : '17'}
                                        strokeDasharray={`${eLen} ${arcLength}`}
                                      />
                                      <circle
                                        cx={ex}
                                        cy={ey}
                                        r={idx === selectedDetailRingIdx ? '10' : '7'}
                                        fill={idx === selectedDetailRingIdx ? '#5D9DC2' : 'rgba(96,112,131,0.74)'}
                                        stroke={idx === selectedDetailRingIdx ? 'rgba(224,243,255,0.82)' : 'rgba(17,24,39,0.5)'}
                                        strokeWidth={idx === selectedDetailRingIdx ? '2.1' : '1.4'}
                                      />
                                    </g>
                                  );
                                })}
                                {statements.map((stmt, idx) => {
                                  const radius = radii[idx];
                                  if (!radius) return null;
                                  const arcLength = getArcLength(radius);
                                  const fNorm = norm(stmt.effort);
                                  const fLen = fNorm * arcLength;
                                  const fAngle = toSVGAngle(180 - fNorm * 180);
                                  const fx = centerX + radius * Math.cos(fAngle);
                                  const fy = centerY + radius * Math.sin(fAngle);
                                  return (
                                    <g key={`detail-f-${idx}`}>
                                      <path d={createArcPath(radius, 180, 0, 0)} fill="none" stroke="rgba(180,201,223,0.68)" strokeWidth="21" />
                                      <path d={createArcPath(radius - 10.5, 180, 0, 0)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.1" />
                                      <path d={createArcPath(radius + 10.5, 180, 0, 0)} fill="none" stroke="rgba(19,61,97,0.58)" strokeWidth="1.1" />
                                      <path
                                        d={createArcPath(radius, 180, 0, 0)}
                                        fill="none"
                                        stroke={idx === selectedDetailRingIdx ? '#E07A3F' : 'rgba(101,118,137,0.7)'}
                                        strokeWidth={idx === selectedDetailRingIdx ? '24' : '17'}
                                        strokeDasharray={`${fLen} ${arcLength}`}
                                      />
                                      <circle
                                        cx={fx}
                                        cy={fy}
                                        r={idx === selectedDetailRingIdx ? '10' : '7'}
                                        fill={idx === selectedDetailRingIdx ? '#E88A4D' : 'rgba(96,112,131,0.74)'}
                                        stroke={idx === selectedDetailRingIdx ? 'rgba(255,234,220,0.82)' : 'rgba(17,24,39,0.5)'}
                                        strokeWidth={idx === selectedDetailRingIdx ? '2.1' : '1.4'}
                                      />
                                    </g>
                                  );
                                })}
                                {radii.map((radius, idx) => {
                                  const labelX = centerX + radius * Math.cos(toSVGAngle(180));
                                  const labelY = centerY + radius * Math.sin(toSVGAngle(180)) + 2;
                                  return (
                                    <g
                                      key={`detail-label-${idx}`}
                                      onClick={() => setSelectedDetailRingIdx(idx)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <rect
                                        x={labelX - 22}
                                        y={labelY - 11}
                                        width={44}
                                        height={22}
                                        rx={11}
                                        fill={idx === selectedDetailRingIdx ? 'rgba(255,244,235,0.98)' : 'rgba(255,255,255,0.95)'}
                                        stroke={idx === selectedDetailRingIdx ? '#E07A3F' : '#000'}
                                        strokeWidth={idx === selectedDetailRingIdx ? '2.4' : '1.8'}
                                      />
                                      <text x={labelX} y={labelY + 4} textAnchor="middle" fontSize="12" fontFamily="Montserrat, sans-serif" fontWeight="700" fill="#000">
                                        {idx + 1}
                                      </text>
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                          <Box sx={{ width: 156, height: 156, borderRadius: '50%', background: 'rgba(255,255,255,0.24)', border: '3px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '2.8rem', fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                              {((selectedDetailStatement?.lepScore ?? detailTraitMetrics.lepScore) || 0).toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} lg={6.6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                    <Paper
                      sx={{
                        width: '100%',
                        p: { xs: 1.35, md: 1.6 },
                        borderRadius: 2.6,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(241,246,255,0.86))',
                        boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
                      }}
                    >
                    <Box sx={{ width: '100%', maxWidth: { xs: 760, lg: 760 }, mx: 'auto' }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '0.92fr 1.08fr' },
                          gap: 1.1,
                          mb: 0.65,
                        }}
                      >
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#385772', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                          Scores
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#385772', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                          Interpretations & Insights
                        </Typography>
                      </Box>
                      {!!insightError.detailed && (
                        <Alert severity="warning" sx={{ mb: 1.1 }}>
                          {insightError.detailed}
                        </Alert>
                      )}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '0.92fr 1.08fr' },
                          gridTemplateRows: { xs: 'repeat(7, minmax(92px, auto))', md: 'repeat(5, minmax(92px, auto))' },
                          gap: 1.1,
                        }}
                      >
                        {[
                          { key: 'overall', label: 'Overall Score', value: selectedDetailStatement?.lepScore ?? detailTraitMetrics.lepScore, color: '#1F3347' },
                          { key: 'efficacy', label: 'Efficacy Score', value: selectedDetailStatement?.efficacy ?? detailTraitMetrics.efficacy, color: '#6393AA' },
                          { key: 'effort', label: 'Effort Score', value: selectedDetailStatement?.effort ?? detailTraitMetrics.effort, color: '#E07A3F' },
                          { key: 'gap-efficacy', label: 'Perception Gap (Efficacy)', value: detailEfficacyPerceptionGap, color: '#6393AA', signed: true },
                          { key: 'gap-effort', label: 'Perception Gap (Effort)', value: detailEffortPerceptionGap, color: '#E07A3F', signed: true },
                        ].map((item, idx) => (
                          <Paper
                            key={item.key}
                            sx={{
                              gridColumn: { xs: '1 / -1', md: '1 / 2' },
                              gridRow: { xs: 'auto', md: `${idx + 1} / ${idx + 2}` },
                              p: 1.05,
                              borderRadius: 2,
                              border: '1px solid rgba(22,66,103,0.26)',
                              background: 'rgba(255,255,255,0.92)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#45586A', lineHeight: 1.1, mb: 0.55 }}>
                              {item.label}
                            </Typography>
                            <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: item.color, lineHeight: 1 }}>
                              {item.signed
                                ? `${Number(item.value || 0) >= 0 ? '+' : ''}${Number(item.value || 0).toFixed(1)}`
                                : Number(item.value || 0).toFixed(1)}
                            </Typography>
                          </Paper>
                        ))}

                        <Paper
                          sx={{
                            gridColumn: { xs: '1 / -1', md: '2 / 3' },
                            gridRow: { xs: 'auto', md: '1 / 4' },
                            p: 1.35,
                            borderRadius: 2,
                            border: '1px solid rgba(69,112,137,0.35)',
                            bgcolor: 'rgba(255,255,255,0.96)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                          }}
                        >
                          <Typography sx={{ fontSize: '0.94rem', color: '#1F3347', lineHeight: 1.55 }}>
                            {insightLoading.detailed && !detailAgentInsight
                              ? 'Generating interpretation...'
                              : (detailAgentInsight || 'Interpretation will load automatically for the selected view.')}
                          </Typography>
                        </Paper>

                        {[
                          {
                            key: 'detail-efficacy-gap-context',
                            title: 'Efficacy Interpretation',
                            text: detailEfficacyPerceptionNarrative,
                            row: '4 / 5',
                          },
                          {
                            key: 'detail-effort-gap-context',
                            title: 'Effort Interpretation',
                            text: detailEffortPerceptionNarrative,
                            row: '5 / 6',
                          },
                        ].map((item) => (
                          <Paper
                            key={item.key}
                            sx={{
                              gridColumn: { xs: '1 / -1', md: '2 / 3' },
                              gridRow: { xs: 'auto', md: item.row },
                              p: 1.25,
                              borderRadius: 2,
                              border: '1px solid rgba(69,112,137,0.35)',
                              bgcolor: 'rgba(255,255,255,0.96)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              gap: 0.45,
                            }}
                          >
                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 800, color: '#4B6278', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {item.title}
                            </Typography>
                            <Typography sx={{ fontSize: '0.88rem', color: '#2E465B', lineHeight: 1.5 }}>
                              {item.text}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Detailed Trait Breakdown - Individual Circular Graphs */}
          {false && Object.keys(traitData).length > 0 && (
            <Card sx={{ 
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 3,
              boxShadow: 4,
            }}>
              <CardContent sx={{ position: 'relative' }}>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.8rem', fontWeight: 700, mb: 4, color: 'text.primary', textAlign: 'center' }}>
                  Detailed Trait Analysis
                </Typography>
                <Stack spacing={6}>
                  {Object.entries(traitData).map(([trait, data], traitIndex) => {
                    const displaySubTrait = resolvedCampaignRows.find((item) => item.trait === trait)?.subTrait || trait;
                    return (
                    <Box key={trait}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    {displaySubTrait}
                  </Typography>
                      <Grid container spacing={3}>
                        {/* Left Half: Circular Graph */}
                        <Grid item xs={12} md={5}>
                          <Box sx={{ position: 'relative', width: '100%', height: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Box sx={{ position: 'relative', width: '100%', maxWidth: 600, height: 600 }}>
                              <svg width="100%" height="100%" viewBox="0 0 600 600" style={{ position: 'absolute', top: 0, left: 0 }}>
                                {(() => {
                                  const centerX = 300;
                                  const centerY = 300;
                                  const statements = data.statements || [];
                                  // 5 concentric rings, tighter together - larger size
                                  const baseRadius = 90;
                                  const radiusSpacing = 30;
                                  const radii = Array.from({ length: 5 }, (_, i) => baseRadius + i * radiusSpacing);
                                  
                                  const toSVGAngle = (userAngle) => {
                                    let svgAngle = (userAngle - 90) % 360;
                                    if (svgAngle < 0) svgAngle += 360;
                                    return (svgAngle * Math.PI) / 180;
                                  };
                                  
                                  const createArcPath = (radius, startAngleUser, endAngleUser, sweepFlag = 1) => {
                                    const startAngleSVG = toSVGAngle(startAngleUser);
                                    const endAngleSVG = toSVGAngle(endAngleUser);
                                    
                                    const start = {
                                      x: centerX + radius * Math.cos(startAngleSVG),
                                      y: centerY + radius * Math.sin(startAngleSVG)
                                    };
                                    const end = {
                                      x: centerX + radius * Math.cos(endAngleSVG),
                                      y: centerY + radius * Math.sin(endAngleSVG)
                                    };
                                    
                                    const largeArcFlag = 1;
                                    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
                                  };
                                  
                                  const getArcLength = (radius) => Math.PI * radius;
                                  
                                  const efficacyStartAngle = 180;
                                  const efficacyEndAngle = 0;
                                  const effortStartAngle = 180;
                                  const effortEndAngle = 0;
                                  
                                  return (
                                    <>
                                      {/* Left side: Efficacy arcs for each statement */}
                                      {statements.map((stmt, stmtIdx) => {
                                        if (!stmt || stmtIdx >= radii.length) return null;
                                        const radius = radii[stmtIdx];
                                        if (!radius) return null;
                                        const arcLength = getArcLength(radius);
                                        const efficacy = Number(stmt.efficacy) || 0;
                                        const filledLength = (efficacy / 100) * arcLength;
                                        
                                        const endAngleUser = 180 + (efficacy / 100) * 180;
                                        const endAngleSVG = toSVGAngle(endAngleUser);
                                        const endX = centerX + radius * Math.cos(endAngleSVG);
                                        const endY = centerY + radius * Math.sin(endAngleSVG);
                                        
                                        return (
                                          <g key={`efficacy-stmt-${stmtIdx}`}>
                                            <path
                                              d={createArcPath(radius, efficacyStartAngle, efficacyEndAngle, 1)}
                                              fill="none"
                                              stroke="rgba(0,0,0,0.1)"
                                              strokeWidth="15"
                                              strokeLinecap="butt"
                                            />
                                            <path
                                              d={createArcPath(radius, efficacyStartAngle, efficacyEndAngle, 1)}
                                              fill="none"
                                              stroke="rgba(0,0,0,0.4)"
                                              strokeWidth="17"
                                              strokeLinecap="butt"
                                              strokeDasharray={`${filledLength} ${arcLength}`}
                                            />
                                            <path
                                              d={createArcPath(radius, efficacyStartAngle, efficacyEndAngle, 1)}
                                              fill="none"
                                              stroke="#6393AA"
                                              strokeWidth="15"
                                              strokeLinecap="butt"
                                              strokeDasharray={`${filledLength} ${arcLength}`}
                                            />
                                            <circle
                                              cx={endX}
                                              cy={endY}
                                              r="7.5"
                                              fill="#457089"
                                              stroke="#000"
                                              strokeWidth="2"
                                            />
                                          </g>
                                        );
                                      })}
                                      
                                      {/* Right side: Effort arcs for each statement */}
                                      {statements.map((stmt, stmtIdx) => {
                                        if (!stmt || stmtIdx >= radii.length) return null;
                                        const radius = radii[stmtIdx];
                                        if (!radius) return null;
                                        const arcLength = getArcLength(radius);
                                        const effort = Number(stmt.effort) || 0;
                                        const filledLength = (effort / 100) * arcLength;
                                        
                                        const endAngleUser = 180 - (effort / 100) * 180;
                                        const endAngleSVG = toSVGAngle(endAngleUser);
                                        const endX = centerX + radius * Math.cos(endAngleSVG);
                                        const endY = centerY + radius * Math.sin(endAngleSVG);
                                        
                                        return (
                                          <g key={`effort-stmt-${stmtIdx}`}>
                                            <path
                                              d={createArcPath(radius, effortStartAngle, effortEndAngle, 0)}
                                              fill="none"
                                              stroke="rgba(0,0,0,0.1)"
                                              strokeWidth="15"
                                              strokeLinecap="butt"
                                            />
                                            <path
                                              d={createArcPath(radius, effortStartAngle, effortEndAngle, 0)}
                                              fill="none"
                                              stroke="rgba(0,0,0,0.4)"
                                              strokeWidth="17"
                                              strokeLinecap="butt"
                                              strokeDasharray={`${filledLength} ${arcLength}`}
                                            />
                                            <path
                                              d={createArcPath(radius, effortStartAngle, effortEndAngle, 0)}
                                              fill="none"
                                              stroke="#E07A3F"
                                              strokeWidth="15"
                                              strokeLinecap="butt"
                                              strokeDasharray={`${filledLength} ${arcLength}`}
                                            />
                                            <circle
                                              cx={endX}
                                              cy={endY}
                                              r="7.5"
                                              fill="#C85A2A"
                                              stroke="#000"
                                              strokeWidth="2"
                                            />
                                          </g>
                                        );
                                      })}
                                      
                                      {/* Vertical divider at top for each ring */}
                                      {radii.map((radius, idx) => {
                                        const topAngle = 0;
                                        const topAngleSVG = toSVGAngle(topAngle);
                                        const topY = centerY + radius * Math.sin(topAngleSVG);
                                        const strokeWidth = 15;
                                        const halfWidth = strokeWidth / 2;
                                        
                                        return (
                                          <line
                                            key={`divider-${idx}`}
                                            x1={centerX}
                                            y1={topY - halfWidth}
                                            x2={centerX}
                                            y2={topY + halfWidth}
                                            stroke="#000"
                                            strokeWidth="2"
                                            opacity="0.4"
                                          />
                                        );
                                      })}
                                    </>
                                  );
                                })()}
                              </svg>
                              
                              {/* Center: Trait LEP Score */}
                              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                                <Box sx={{
                        position: 'absolute',
                        top: '50%',
                                  left: '50%',
                        transform: 'translate(-50%, -50%)',
                                  width: 125,
                                  height: 125,
                        borderRadius: '50%',
                                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.9))',
                                  border: '2px solid',
                                  borderColor: 'primary.main',
                                  boxShadow: '0 2px 8px rgba(224,122,63,0.2)',
                                  zIndex: -1,
                                }} />
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '3.6rem', fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                                  {data.lepScore.toFixed(1)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        
                        {/* Right Half: Question Metrics - Compact Table Layout */}
                        <Grid item xs={12} md={7}>
                          <Box sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 600, color: 'text.secondary', mb: 2 }}>
                              Statement Breakdown
                            </Typography>
                            <Paper sx={{ 
                              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
                              p: 2.5,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              boxShadow: 2,
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                              {/* Table Header */}
                              <Grid container spacing={1.5} sx={{ mb: 1.5, pb: 1.5, borderBottom: '2px solid', borderColor: 'divider' }}>
                                <Grid item xs={4.5}>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'text.secondary' }}>
                                    Statement
                                  </Typography>
                                </Grid>
                                <Grid item xs={1.2}>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
                                    Total
                                  </Typography>
                                </Grid>
                                <Grid item xs={1.2}>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#6393AA', textAlign: 'center' }}>
                                    Efficacy
                                  </Typography>
                                </Grid>
                                <Grid item xs={1.2}>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#E07A3F', textAlign: 'center' }}>
                                    Effort
                                  </Typography>
                                </Grid>
                                <Grid item xs={1.5}>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
                                    Gap
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              {/* Table Rows */}
                              <Stack spacing={1.5} sx={{ flex: 1, overflow: 'hidden' }}>
                                {(data.statements || []).map((stmt, idx) => (
                                  <Box 
                                    key={idx}
                      sx={{
                                      p: 1.5,
                                      borderRadius: 1,
                                      background: idx % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.02)',
                                      '&:hover': {
                                        background: 'rgba(224,122,63,0.08)',
                                      },
                                      transition: 'background 0.2s',
                                    }}
                                  >
                                    <Grid container spacing={1.5} alignItems="center">
                                      {/* Statement Text */}
                                      <Grid item xs={4.5}>
                                        <Typography sx={{ 
                                          fontFamily: 'Gemunu Libre, sans-serif', 
                                          fontSize: '0.8rem', 
                                          fontWeight: 500, 
                                          color: 'text.primary',
                                          lineHeight: 1.3,
                                        }}>
                                          <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
                                            {idx + 1}.
                                          </Box>
                                          {stmt.text}
                                        </Typography>
                                      </Grid>
                                      
                                      {/* Total Score */}
                                      <Grid item xs={1.2}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: 'text.primary' }}>
                                            {stmt.lepScore.toFixed(1)}
                    </Typography>
                  </Box>
                                      </Grid>
                                      
                                      {/* Efficacy Score */}
                                      <Grid item xs={1.2}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#6393AA' }}>
                                            {stmt.efficacy.toFixed(1)}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      
                                      {/* Effort Score */}
                                      <Grid item xs={1.2}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#E07A3F' }}>
                                            {stmt.effort.toFixed(1)}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      
                                      {/* Gap Score with Hover */}
                                      <Grid item xs={1.5}>
                                        <Box 
                    sx={{
                                            textAlign: 'center',
                                            position: 'relative',
                                            cursor: 'pointer',
                                          }}
                                          onMouseEnter={(e) => {
                                            e.stopPropagation();
                                            const text = getGapAnalysis(stmt.efficacy, stmt.effort, idx);
                                            setHoveredGap({ 
                                              x: e.clientX, 
                                              y: e.clientY, 
                                              text: text, 
                                              statement: stmt, 
                                              efficacy: Number(stmt.efficacy) || 0, 
                                              effort: Number(stmt.effort) || 0 
                                            });
                                          }}
                                          onMouseLeave={(e) => {
                                            e.stopPropagation();
                                            setHoveredGap(null);
                                          }}
                                        >
                                          {(() => {
                                            const gap = Math.abs(stmt.efficacy - stmt.effort);
                                            const gapColor = getGapColor(gap);
                                            return (
                                              <Box sx={{
                                                display: 'inline-block',
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 1,
                                                bgcolor: gapColor,
                                                color: '#000',
                      fontFamily: 'Gemunu Libre, sans-serif',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                border: '1px solid rgba(0, 0, 0, 0.2)',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                              }}>
                                                {gap.toFixed(0)}
                                              </Box>
                                            );
                                          })()}
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                ))}
                              </Stack>
                            </Paper>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                  })}
                </Stack>
              </CardContent>
              
              {/* Hover Box for Team Insight (Gap Analysis) - Individual Trait Section */}
              {hoveredGap && hoveredGap.x && hoveredGap.y && (
                <Box sx={{
                  position: 'fixed',
                  top: `${hoveredGap.y - 10}px`,
                  left: `${hoveredGap.x + 20}px`,
                  zIndex: 25,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.95))',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  boxShadow: 8,
                  p: 2,
                  maxWidth: '400px',
                  pointerEvents: 'none',
                }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'text.primary', mb: 1, textAlign: 'center' }}>
                    Team Insight
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'Gemunu Libre, sans-serif', 
                    fontSize: '0.85rem', 
                    color: 'text.primary',
                    lineHeight: 1.5,
                    textAlign: 'center',
                  }}>
                    {hoveredGap.text || ''}
                  </Typography>
                </Box>
              )}

              {/* Hover Box for Circle Indicators (Efficacy/Effort) - Individual Trait Section */}
              {hoveredCircle && hoveredCircle.x && hoveredCircle.y && (
                <Box sx={{
                  position: 'fixed',
                  top: `${hoveredCircle.y - 10}px`,
                  left: `${hoveredCircle.x + 20}px`,
                  zIndex: 25,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.95))',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  boxShadow: 8,
                  p: 2,
                  maxWidth: '400px',
                  pointerEvents: 'none',
                }}>
                  <Typography sx={{ 
                    fontFamily: 'Gemunu Libre, sans-serif', 
                    fontSize: '0.85rem', 
                    color: 'text.primary',
                    lineHeight: 1.5,
                    mb: 1.5,
                  }}>
                    {hoveredCircle.text || ''}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography sx={{ 
                    fontFamily: 'Gemunu Libre, sans-serif', 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: hoveredCircle.type === 'Efficacy' ? '#6393AA' : '#E07A3F',
                    mb: 0.5,
                  }}>
                    {hoveredCircle.type || ''}
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'Gemunu Libre, sans-serif', 
                    fontSize: '1.1rem', 
                    fontWeight: 700,
                    color: hoveredCircle.type === 'Efficacy' ? '#6393AA' : '#E07A3F',
                  }}>
                    {typeof hoveredCircle.score === 'number' ? hoveredCircle.score.toFixed(1) : '0.0'}
                  </Typography>
                </Box>
              )}
            </Card>
          )}

          {/* Primary Opportunity Spotlight */}
          {false && primaryOpportunity && (
            <Alert
              severity="warning"
              icon={<Lightbulb sx={{ fontSize: 32 }} />}
                      sx={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,248,220,0.8))',
                border: '2px solid #E07A3F',
                borderRadius: 3,
                boxShadow: 4,
                '& .MuiAlert-message': { width: '100%' },
                color: 'text.primary',
              }}
            >
              <Stack spacing={2}>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>
                  ≡ƒÄ» Primary Growth Opportunity
                </Typography>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 600 }}>
                  {primaryOpportunity.trait}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.6)', p: 2, borderRadius: 2, border: '1px solid rgba(224,122,63,0.3)' }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', mb: 1, color: 'text.secondary' }}>
                        Effort: {primaryOpportunity.effort.toFixed(1)} | Efficacy: {primaryOpportunity.efficacy.toFixed(1)}
                      </Typography>
                    <LinearProgress
                      variant="determinate"
                        value={primaryOpportunity.effort}
                        sx={{ height: 8, borderRadius: 1, mb: 1, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#E07A3F' } }}
                        />
                    <LinearProgress
                      variant="determinate"
                        value={primaryOpportunity.efficacy}
                        sx={{ height: 8, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#6393AA' } }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.6)', p: 2, borderRadius: 2, border: '1px solid rgba(224,122,63,0.3)' }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontWeight: 600, mb: 1, color: 'text.primary' }}>
                        Insight
                        </Typography>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', lineHeight: 1.6, color: 'text.primary' }}>
                        {primaryOpportunity.insight}
                    </Typography>
                  </Box>
                  </Grid>
                </Grid>
                      </Stack>
            </Alert>
          )}

          {/* Critical Gaps Section */}
          {false && criticalGaps.length > 0 && (
            <Card sx={{ 
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 3,
              boxShadow: 4,
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Warning sx={{ color: '#E07A3F', fontSize: 32 }} />
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: 'text.primary' }}>
                    Critical Effort/Efficacy Gaps
                  </Typography>
                    </Stack>
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 3, color: 'text.secondary' }}>
                  These areas show significant misalignment between effort and impact. Focus here for maximum improvement.
                        </Typography>
                <Grid container spacing={2}>
                  {criticalGaps.slice(0, 3).map((gap, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <Paper sx={{ 
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                        p: 2, 
                        borderRadius: 2,
                        border: `2px solid ${getDeltaColor(gap.delta)}`,
                        boxShadow: 2,
                      }}>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 600, mb: 1, color: 'text.primary' }}>
                          {gap.trait}
                          </Typography>
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          <Box>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', color: 'text.secondary', mb: 0.5 }}>
                              Effort: {gap.effort.toFixed(1)}
                          </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={gap.effort}
                              sx={{ height: 6, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#E07A3F' } }}
                            />
                      </Box>
                          <Box>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', color: 'text.secondary', mb: 0.5 }}>
                              Efficacy: {gap.efficacy.toFixed(1)}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={gap.efficacy}
                              sx={{ height: 6, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#6393AA' } }}
                            />
                </Box>
                        </Stack>
                        <Chip
                          label={`Gap: ${gap.delta.toFixed(1)}`}
                          size="small"
                        sx={{
                            bgcolor: getDeltaColor(gap.delta),
                            color: 'white',
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontWeight: 600,
                          }}
                        />
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', mt: 1.5, color: 'text.primary' }}>
                          {gap.insight}
                        </Typography>
                      </Paper>
              </Grid>
            ))}
          </Grid>
              </CardContent>
            </Card>
          )}

          {/* Self-Perception vs Team Feedback */}
          {false && intakeData && (
            <Card sx={{ 
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 3,
              boxShadow: 4,
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Psychology sx={{ color: '#6393AA', fontSize: 32 }} />
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: 'text.primary' }}>
                    Self-Perception Insights
            </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid rgba(224,122,63,0.3)',
                      boxShadow: 2,
                    }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', fontWeight: 600, mb: 1, color: 'text.primary' }}>
                        Your Self-Assessment
                      </Typography>
                      {intakeData.warningLabel && (
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', mb: 1, color: 'text.primary' }}>
                          <strong>Warning Label:</strong> {intakeData.warningLabel}
                        </Typography>
                      )}
                      {intakeData.selfReflection && (
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'text.primary' }}>
                          <strong>Self-Reflection:</strong> {intakeData.selfReflection}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid rgba(224,122,63,0.3)',
                      boxShadow: 2,
                    }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', fontWeight: 600, mb: 1, color: 'text.primary' }}>
                        Team Feedback Alignment
                      </Typography>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'text.primary' }}>
                        Your team's feedback reveals areas where your self-perception aligns with or differs from their experience. 
                        Use this comparison to identify blind spots and validate strengths.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          </Stack>
    )
  );
}

export default ResultsTab;
