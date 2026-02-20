import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Collapse,
  IconButton,
  Stack,
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

function ResultsTab() {
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

  // Calculate all metrics
  useEffect(() => {
    const calculatedData = {};
    const gaps = [];
    const traits = fakeCampaign["campaign_123"].campaign;

    traits.forEach((traitObj, traitIndex) => {
      const traitRatings = { efficacy: [], effort: [] };
      const statementData = [];
      
      fakeData.responses.forEach(response => {
        for (let i = 0; i < 5; i++) {
          const statementIndex = traitIndex * 5 + i;
          if (response.ratings[statementIndex]) {
            traitRatings.efficacy.push(response.ratings[statementIndex].efficacy);
            traitRatings.effort.push(response.ratings[statementIndex].effort);
          }
        }
      });

      const avgEfficacy = traitRatings.efficacy.reduce((sum, val) => sum + val, 0) / traitRatings.efficacy.length;
      const avgEffort = traitRatings.effort.reduce((sum, val) => sum + val, 0) / traitRatings.effort.length;
      const delta = Math.abs(avgEffort - avgEfficacy);
      const lepScore = (avgEfficacy * 2 + avgEffort) / 3;

      // Calculate statement-level data
      const statements = traitObj.statements.map((statement, idx) => {
        const stmtIdx = traitIndex * 5 + idx;
        const stmtEfficacy = fakeData.responses.map(r => r.ratings[stmtIdx]?.efficacy || 0);
        const stmtEffort = fakeData.responses.map(r => r.ratings[stmtIdx]?.effort || 0);
        const avgStmtEfficacy = stmtEfficacy.reduce((a, b) => a + b, 0) / stmtEfficacy.length;
        const avgStmtEffort = stmtEffort.reduce((a, b) => a + b, 0) / stmtEffort.length;
        const stmtDelta = Math.abs(avgStmtEffort - avgStmtEfficacy);

        return {
          text: statement,
          efficacy: avgStmtEfficacy,
          effort: avgStmtEffort,
          delta: stmtDelta,
          lepScore: (avgStmtEfficacy * 2 + avgStmtEffort) / 3,
        };
      });

      calculatedData[traitObj.trait] = { 
        efficacy: avgEfficacy, 
        effort: avgEffort, 
        delta,
        lepScore,
        statements,
      };

      // Identify critical gaps (delta > 30 or high effort/low efficacy)
      if (delta > 30 || (avgEffort > 70 && avgEfficacy < 50)) {
        gaps.push({
          trait: traitObj.trait,
          effort: avgEffort,
          efficacy: avgEfficacy,
          delta,
          insight: avgEffort > avgEfficacy
            ? 'High effort but low impactΓÇöconsider refining approach'
            : 'High impact but low effortΓÇöopportunity to scale this strength',
        });
      }
    });

    setTraitData(calculatedData);

    // Sort gaps by severity and set primary opportunity
    const sortedGaps = gaps.sort((a, b) => b.delta - a.delta);
    setCriticalGaps(sortedGaps);
    setPrimaryOpportunity(sortedGaps[0] || null);
  }, []);

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

  const selectedTraitMetrics = useMemo(() => {
    if (!selectedTraitKey) return null;
    return traitData[selectedTraitKey] || null;
  }, [traitData, selectedTraitKey]);

  const selectedSubtraitLabel = useMemo(() => {
    if (!selectedTraitKey) return '';
    const match = fakeCampaign["campaign_123"]?.campaign?.find((item) => item.trait === selectedTraitKey);
    return match?.subTrait || selectedTraitKey;
  }, [selectedTraitKey]);

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
    return activeMetrics.efficacy - activeMetrics.lepScore;
  }, [activeMetrics]);

  const effortPerceptionGap = useMemo(() => {
    if (!activeMetrics) return 0;
    return activeMetrics.effort - activeMetrics.lepScore;
  }, [activeMetrics]);

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
    <Stack spacing={4}>

          {/* Combined Trait Circular Graph */}
          {Object.keys(traitData).length > 0 && (
            <Card sx={{ 
              background: 'transparent',
              border: 'none',
              borderRadius: 3,
              boxShadow: 'none',
            }}>
              <CardContent sx={{ px: { xs: 0.8, md: 1.2 }, pt: 0.6, pb: '8px !important' }}>
                <Grid container spacing={1.4} alignItems="stretch" sx={{ minHeight: { lg: 560 } }}>
                  <Grid item xs={12} lg={6} sx={{ display: 'flex' }}>
                    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: { xs: 420, md: 500, lg: 'auto' }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                                {radii.map((radius, idx) => {
                                  const strokeWidth = 30;
                                  const halfWidth = strokeWidth / 2;
                                  const topAngleSVG = toSVGAngle(0);
                                  const topY = centerY + radius * Math.sin(topAngleSVG);
                                  return (
                                    <line
                                      key={`top-divider-${idx}`}
                                      x1={centerX}
                                      y1={topY - halfWidth}
                                      x2={centerX}
                                      y2={topY + halfWidth}
                                      stroke="rgba(255,255,255,0.9)"
                                      strokeWidth="2"
                                      opacity="0.4"
                                    />
                                  );
                                })}

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
                                      <path d={createArcPath(radius, 180, 0, 1)} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="30" />
                                      <path d={createArcPath(radius, 180, 0, 1)} fill="none" stroke="rgba(255,255,255,0.86)" strokeWidth="33" />
                                      <path
                                        d={createArcPath(radius, 180, 0, 1)}
                                        fill="none"
                                        stroke={trait === selectedTraitKey ? '#6393AA' : 'rgba(99,147,170,0.5)'}
                                        strokeWidth="30"
                                        strokeDasharray={`${filledLength} ${arcLength}`}
                                        style={{ transition: 'stroke 0.25s ease, stroke-dasharray 0.5s ease' }}
                                      />
                                      <circle
                                        cx={endX}
                                        cy={endY}
                                        r="15"
                                        fill={trait === selectedTraitKey ? '#457089' : 'rgba(69,112,137,0.62)'}
                                        stroke="#000"
                                        strokeWidth="2"
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
                                      <path d={createArcPath(radius, 180, 0, 0)} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="30" />
                                      <path d={createArcPath(radius, 180, 0, 0)} fill="none" stroke="rgba(255,255,255,0.86)" strokeWidth="33" />
                                      <path
                                        d={createArcPath(radius, 180, 0, 0)}
                                        fill="none"
                                        stroke={trait === selectedTraitKey ? '#E07A3F' : 'rgba(224,122,63,0.5)'}
                                        strokeWidth="30"
                                        strokeDasharray={`${filledLength} ${arcLength}`}
                                        style={{ transition: 'stroke 0.25s ease, stroke-dasharray 0.5s ease' }}
                                      />
                                      <circle
                                        cx={endX}
                                        cy={endY}
                                        r="15"
                                        fill={trait === selectedTraitKey ? '#C85A2A' : 'rgba(200,90,42,0.62)'}
                                        stroke="#000"
                                        strokeWidth="2"
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
                                  const labelSubtrait = fakeCampaign["campaign_123"]?.campaign?.find((item) => item.trait === trait)?.subTrait || trait;
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
                                        fill={active ? 'rgba(255,244,235,0.98)' : 'rgba(255,255,255,0.95)'}
                                        stroke={active ? '#E07A3F' : '#000'}
                                        strokeWidth={active ? '2.5' : '2'}
                                      />
                                      <text
                                        x={labelX}
                                        y={labelY + 5}
                                        textAnchor="middle"
                                        fontSize="14"
                                        fontFamily="Gemunu Libre, sans-serif"
                                        fontWeight="700"
                                        fill="#000"
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
                            backgroundColor: 'rgba(255,255,255,0.14)',
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
                                  filter: 'brightness(0.5)',
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
                  </Grid>

                  <Grid item xs={12} lg={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: { xs: 560, lg: 520 }, mx: 'auto' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: { xs: '1.4rem', md: '1.65rem' },
                          fontWeight: 800,
                          color: 'rgba(255,255,255,0.9)',
                          textAlign: 'center',
                          mb: 1.2,
                        }}
                      >
                        {selectedSubtraitLabel}
                      </Typography>
                      <Grid container spacing={1.4}>
                        {[
                          { side: 'left', key: 'trait', label: 'Trait Score', value: activeMetrics?.lepScore || 0, color: 'text.primary' },
                          { side: 'right', key: 'delta', label: 'Average Delta', value: activeMetrics?.delta || 0, color: getDeltaColor(activeMetrics?.delta || 0) },
                          { side: 'left', key: 'efficacy', label: 'Efficacy Score', value: activeMetrics?.efficacy || 0, color: '#6393AA' },
                          { side: 'right', key: 'gap-eff', label: 'Perception Gap (Efficacy)', value: efficacyPerceptionGap, color: '#6393AA', signed: true },
                          { side: 'left', key: 'effort', label: 'Effort Score', value: activeMetrics?.effort || 0, color: '#E07A3F' },
                          { side: 'right', key: 'gap-effort', label: 'Perception Gap (Effort)', value: effortPerceptionGap, color: '#E07A3F', signed: true },
                        ].map((item) => {
                          const clickable = item.side === 'left' && item.key === 'trait';
                          const active = selectedMetric === item.key;
                          const displayValue = item.signed
                            ? `${item.value >= 0 ? '+' : ''}${item.value.toFixed(1)}`
                            : item.value.toFixed(1);
                          return (
                            <Grid item xs={6} key={item.key}>
                              <Paper
                                onClick={clickable ? () => setSelectedMetric(item.key) : undefined}
                                sx={{
                                  p: 1.1,
                                  borderRadius: 2.2,
                                  border: '1px solid',
                                  borderColor: clickable && active ? 'rgba(224,122,63,0.9)' : 'rgba(0,0,0,0.18)',
                                  background: 'rgba(255,255,255,0.9)',
                                  boxShadow: clickable && active
                                    ? '0 4px 8px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(224,122,63,0.55)'
                                    : '0 4px 8px rgba(0,0,0,0.08)',
                                  minHeight: 106,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  cursor: clickable ? 'pointer' : 'default',
                                }}
                              >
                                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'text.secondary', lineHeight: 1.1, mb: 0.9 }}>
                                  {item.label}
                                </Typography>
                                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '2rem', fontWeight: 700, color: item.color, lineHeight: 1 }}>
                                  {displayValue}
                                </Typography>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Detailed Trait Breakdown - Individual Circular Graphs */}
          {Object.keys(traitData).length > 0 && (
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
                    const displaySubTrait = fakeCampaign["campaign_123"]?.campaign?.find((item) => item.trait === trait)?.subTrait || trait;
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
          {primaryOpportunity && (
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
          {criticalGaps.length > 0 && (
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
          {intakeData && (
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
  );
}

export default ResultsTab;
