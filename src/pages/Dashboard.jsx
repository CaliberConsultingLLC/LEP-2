import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
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
import { useNavigate } from 'react-router-dom';
import fakeCampaign from '../data/fakeCampaign.js';
import fakeData from '../data/fakeData.js';

function Dashboard() {
  const navigate = useNavigate();
  const [traitData, setTraitData] = useState({});
  const [intakeData, setIntakeData] = useState(null);
  const [criticalGaps, setCriticalGaps] = useState([]);
  const [primaryOpportunity, setPrimaryOpportunity] = useState(null);
  const [expandedTraits, setExpandedTraits] = useState({});

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
            ? 'High effort but low impact—consider refining approach'
            : 'High impact but low effort—opportunity to scale this strength',
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
    const highGapCount = traits.filter(t => t.delta > 30).length;

    return { avgLEP, avgDelta, highGapCount, totalTraits: traits.length };
  }, [traitData]);

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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.6)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        py: 4,
        color: 'text.primary',
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          {/* Header */}
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
              Leadership Analysis Dashboard
            </Typography>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', color: 'text.secondary' }}>
              Insights from your team feedback and self-assessment
            </Typography>
          </Box>

          {/* Executive Summary Cards */}
          {overallMetrics && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  boxShadow: 4,
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <TrendingUp sx={{ color: '#38A169', fontSize: 28 }} />
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary' }}>
                        Overall LEP Score
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'text.primary' }}>
                      {overallMetrics.avgLEP.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  boxShadow: 4,
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Warning sx={{ color: '#ECC94B', fontSize: 28 }} />
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary' }}>
                        Critical Gaps
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'text.primary' }}>
                      {overallMetrics.highGapCount}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.8rem', color: 'text.secondary' }}>
                      of {overallMetrics.totalTraits} traits
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  boxShadow: 4,
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Psychology sx={{ color: '#6393AA', fontSize: 28 }} />
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary' }}>
                        Avg Effort/Efficacy Gap
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'text.primary' }}>
                      {overallMetrics.avgDelta.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  boxShadow: 4,
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Insights sx={{ color: '#E07A3F', fontSize: 28 }} />
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary' }}>
                        Team Responses
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'text.primary' }}>
                      {fakeData.responses.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
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
                  🎯 Primary Growth Opportunity
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

          {/* Detailed Trait Breakdown */}
          <Card sx={{ 
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            boxShadow: 4,
          }}>
            <CardContent>
              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.8rem', fontWeight: 700, mb: 3, color: 'text.primary' }}>
                Detailed Trait Analysis
              </Typography>
              <Stack spacing={3}>
                {Object.entries(traitData).map(([trait, data]) => (
                  <Box key={trait} sx={{ 
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                    p: 3, 
                    borderRadius: 2, 
                    border: '1px solid rgba(224,122,63,0.3)',
                    boxShadow: 2,
                  }}>
                    {/* Trait Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}>
                        {trait}
                      </Typography>
                      <IconButton
                        onClick={() => toggleTrait(trait)}
                        sx={{ color: 'text.primary' }}
                      >
                        {expandedTraits[trait] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Stack>

                    {/* Circular Gauge Visualization */}
                    <Box sx={{ position: 'relative', width: '100%', height: 450, mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Box sx={{ position: 'relative', width: 450, height: 450 }}>
                        <svg width="450" height="450" viewBox="0 0 450 450" style={{ position: 'absolute', top: 0, left: 0 }}>
                          {(() => {
                            const centerX = 225;
                            const centerY = 225;
                            const radius1 = 90;  // Inner track
                            const radius2 = 130; // Middle track
                            const radius3 = 170; // Outer track
                            
                            // Coordinate system: 12 o'clock = 0°, 6 o'clock = 180°, 3 o'clock = 90°, 9 o'clock = 270°
                            // SVG coordinates: 0° = right (3 o'clock), 90° = down (6 o'clock), 180° = left (9 o'clock), 270° = up (12 o'clock)
                            // Conversion: SVG_angle = (user_angle - 90) % 360, but we need to handle negative angles
                            const toSVGAngle = (userAngle) => {
                              // Convert user angle (0° = 12 o'clock) to SVG angle (0° = 3 o'clock)
                              let svgAngle = (userAngle - 90) % 360;
                              if (svgAngle < 0) svgAngle += 360;
                              return (svgAngle * Math.PI) / 180;
                            };
                            
                            // Helper to create arc path
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
                              
                              // For 180-degree arcs, we always use largeArcFlag = 1
                              const largeArcFlag = 1;
                              return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
                            };

                            // Calculate arc length for 180-degree arc (π * radius)
                            const getArcLength = (radius) => Math.PI * radius;

                            // Efficacy: from 6 o'clock (180°) going left (counterclockwise) to 12 o'clock (0°)
                            // This is a full 180-degree arc on the left side
                            const efficacyStartAngle = 180; // 6 o'clock
                            const efficacyEndAngle = 0; // 12 o'clock (or 360°, but we use 0°)
                            
                            // Effort: from 6 o'clock (180°) going right (clockwise) to 12 o'clock (0°)
                            // This is a full 180-degree arc on the right side
                            const effortStartAngle = 180; // 6 o'clock
                            const effortEndAngle = 0; // 12 o'clock

                            return (
                              <>
                                {/* Left side: Efficacy arcs (3 concentric tracks) - Full 180° from 6 to 12, counterclockwise */}
                                {[radius1, radius2, radius3].map((radius, idx) => {
                                  const arcLength = getArcLength(radius); // Full 180° = π * radius
                                  
                                  return (
                                    <g key={`efficacy-${idx}`}>
                                      {/* Background track - full 180° */}
                                      <path
                                        d={createArcPath(radius, efficacyStartAngle, efficacyEndAngle, 1)}
                                        fill="none"
                                        stroke="rgba(0,0,0,0.1)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                      />
                                      {/* Filled arc based on efficacy value - 100-point scale stretched to 180° */}
                                      <path
                                        d={createArcPath(radius, efficacyStartAngle, efficacyEndAngle, 1)}
                                        fill="none"
                                        stroke="#6393AA"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(data.efficacy / 100) * arcLength} ${arcLength}`}
                                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                      />
                                    </g>
                                  );
                                })}

                                {/* Right side: Effort arcs (3 concentric tracks) - Full 180° from 6 to 12, clockwise */}
                                {[radius1, radius2, radius3].map((radius, idx) => {
                                  const arcLength = getArcLength(radius); // Full 180° = π * radius
                                  
                                  return (
                                    <g key={`effort-${idx}`}>
                                      {/* Background track - full 180° */}
                                      <path
                                        d={createArcPath(radius, effortStartAngle, effortEndAngle, 0)}
                                        fill="none"
                                        stroke="rgba(0,0,0,0.1)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                      />
                                      {/* Filled arc based on effort value - 100-point scale stretched to 180° */}
                                      <path
                                        d={createArcPath(radius, effortStartAngle, effortEndAngle, 0)}
                                        fill="none"
                                        stroke="#E07A3F"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(data.effort / 100) * arcLength} ${arcLength}`}
                                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                      />
                                    </g>
                                  );
                                })}

                                {/* Scale markers on outer track (left side - Efficacy) */}
                                {[0, 25, 50, 75, 100].map((mark) => {
                                  // Map 0-100 scale to 180° arc (from 180° to 0° going counterclockwise)
                                  const userAngle = 180 - (mark / 100) * 180;
                                  const svgAngle = toSVGAngle(userAngle);
                                  const x = centerX + radius3 * Math.cos(svgAngle);
                                  const y = centerY + radius3 * Math.sin(svgAngle);
                                  return (
                                    <circle
                                      key={`left-${mark}`}
                                      cx={x}
                                      cy={y}
                                      r={mark === 0 || mark === 100 ? 4 : 2.5}
                                      fill={mark === 0 || mark === 100 ? '#6393AA' : 'rgba(99, 147, 170, 0.4)'}
                                    />
                                  );
                                })}

                                {/* Scale markers on outer track (right side - Effort) */}
                                {[0, 25, 50, 75, 100].map((mark) => {
                                  // Map 0-100 scale to 180° arc (from 180° to 0° going clockwise)
                                  const userAngle = 180 + (mark / 100) * 180;
                                  const svgAngle = toSVGAngle(userAngle);
                                  const x = centerX + radius3 * Math.cos(svgAngle);
                                  const y = centerY + radius3 * Math.sin(svgAngle);
                                  return (
                                    <circle
                                      key={`right-${mark}`}
                                      cx={x}
                                      cy={y}
                                      r={mark === 0 || mark === 100 ? 4 : 2.5}
                                      fill={mark === 0 || mark === 100 ? '#E07A3F' : 'rgba(224, 122, 63, 0.4)'}
                                    />
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>

                        {/* Center: Compass Score with colored circle background */}
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                          <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                            border: '2px solid',
                            borderColor: 'primary.main',
                            zIndex: -1,
                          }} />
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                            Compass
                          </Typography>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '3.2rem', fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                            {data.lepScore.toFixed(1)}
                          </Typography>
                        </Box>

                        {/* Left: Efficacy Score (vertically centered, outside the circle) */}
                        <Box sx={{ position: 'absolute', top: '50%', left: '2%', transform: 'translateY(-50%)', textAlign: 'center', zIndex: 10 }}>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: '#6393AA', mb: 0.5 }}>
                            {data.efficacy.toFixed(1)}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>
                            EFFICACY
                          </Typography>
                        </Box>

                        {/* Right: Effort Score (vertically centered, outside the circle) */}
                        <Box sx={{ position: 'absolute', top: '50%', right: '2%', transform: 'translateY(-50%)', textAlign: 'center', zIndex: 10 }}>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: '#E07A3F', mb: 0.5 }}>
                            {data.effort.toFixed(1)}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>
                            EFFORT
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Statement Details */}
                    <Collapse in={expandedTraits[trait]}>
                      <Divider sx={{ my: 2, borderColor: 'rgba(224,122,63,0.3)' }} />
                      <Stack spacing={2}>
                        {data.statements.map((stmt, idx) => (
                          <Paper key={idx} sx={{ 
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))',
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid rgba(224,122,63,0.2)',
                            boxShadow: 1,
                          }}>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 2, fontWeight: 500, color: 'text.primary' }}>
                              {stmt.text}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
                                  Efficacy
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={stmt.efficacy}
                                  sx={{ height: 8, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#6393AA' } }}
                                />
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', mt: 0.5, color: 'text.primary' }}>
                                  {stmt.efficacy.toFixed(1)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
                                  Effort
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={stmt.effort}
                                  sx={{ height: 8, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#E07A3F' } }}
                                />
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', mt: 0.5, color: 'text.primary' }}>
                                  {stmt.effort.toFixed(1)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
                                  Gap
                                </Typography>
                                <Chip
                                  label={stmt.delta.toFixed(1)}
                                  size="small"
                                  sx={{
                                    bgcolor: getDeltaColor(stmt.delta),
                                    color: 'white',
                                    fontFamily: 'Gemunu Libre, sans-serif',
                                    fontWeight: 600,
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Stack>
                    </Collapse>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

export default Dashboard;
