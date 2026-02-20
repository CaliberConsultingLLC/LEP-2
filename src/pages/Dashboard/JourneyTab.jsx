import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Grid,
  Chip,
  Button,
  Paper,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Download,
  Print,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';
const { CORE_TRAITS } = traitSystem;
const JOURNEY_MAP_SRC = '/map.jpg';

function JourneyTab() {
  const [actionPlans, setActionPlans] = useState({});
  const [savedActionItems, setSavedActionItems] = useState([]);
  const [subTraitData, setSubTraitData] = useState([]);
  const [subTraitData124, setSubTraitData124] = useState([]);
  const [expandedNode, setExpandedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [startNodeExpanded, setStartNodeExpanded] = useState(false);
  const [secondNodeExpanded, setSecondNodeExpanded] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Load action plans
  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const userKey = userInfo?.email || userInfo?.name || 'anonymous';
      const byCampaign = JSON.parse(localStorage.getItem('actionPlansByCampaign') || '{}');
      const campaignPlans = byCampaign?.['123']?.[userKey]?.plans || {};
      const flat = [];
      Object.entries(campaignPlans).forEach(([traitId, subtraits]) => {
        Object.entries(subtraits || {}).forEach(([subTraitId, payload]) => {
          (payload?.items || []).forEach((item) => {
            if (String(item?.text || '').trim()) {
              flat.push({ traitId, subTraitId, text: item.text });
            }
          });
        });
      });
      setSavedActionItems(flat);

      const legacy = JSON.parse(localStorage.getItem('actionPlans') || '{}');
      setActionPlans(legacy);
    } catch (e) {
      console.error('Failed to parse action plans:', e);
    }
  }, []);

  // Calculate subtrait data for campaign 123 and 124
  const calculateSubTraitData = (campaignId) => {
    const calculatedSubTraitData = [];
    const campaign = fakeCampaign[`campaign_${campaignId}`].campaign;
    const responses = fakeData.responses.filter(r => r.campaignId === String(campaignId));

    // Each subtrait has 5 questions: Clarity (0-4), Decision Quality (5-9), Prioritization (10-14)
    campaign.forEach((item, subtraitIndex) => {
      const subTraitRatings = { efficacy: [], effort: [] };
      
      // Each subtrait uses all 5 of its questions
      const startIndex = subtraitIndex * 5; // 0, 5, or 10
      
      responses.forEach(response => {
        for (let i = 0; i < 5; i++) {
          const statementIndex = startIndex + i;
          if (response.ratings[statementIndex]) {
            subTraitRatings.efficacy.push(response.ratings[statementIndex].efficacy);
            subTraitRatings.effort.push(response.ratings[statementIndex].effort);
          }
        }
      });

      if (subTraitRatings.efficacy.length > 0) {
        const avgEfficacy = subTraitRatings.efficacy.reduce((sum, val) => sum + val, 0) / subTraitRatings.efficacy.length;
        const avgEffort = subTraitRatings.effort.reduce((sum, val) => sum + val, 0) / subTraitRatings.effort.length;
        const totalScore = (avgEfficacy * 2 + avgEffort) / 3;

        calculatedSubTraitData.push({
          name: item.subTrait,
          trait: item.trait,
          efficacy: avgEfficacy,
          effort: avgEffort,
          totalScore,
        });
      }
    });

    return calculatedSubTraitData;
  };

  useEffect(() => {
    setSubTraitData(calculateSubTraitData(123));
    setSubTraitData124(calculateSubTraitData(124));
  }, []);

  // Calculate overall Compass score from subtrait scores
  const overallCompassScore = subTraitData.length > 0
    ? subTraitData.reduce((sum, st) => sum + st.totalScore, 0) / subTraitData.length
    : 0;

  // Calculate overall Compass score for campaign 124
  const overallCompassScore124 = subTraitData124.length > 0
    ? subTraitData124.reduce((sum, st) => sum + st.totalScore, 0) / subTraitData124.length
    : 0;

  // Generate nodes for verified action items
  useEffect(() => {
    const newNodes = [];

    // Campaign path anchors based on approved map marks (1,2,3)
    newNodes.push({
      id: 'start',
      x: 24,
      y: 40,
      type: 'start',
      compassScore: overallCompassScore,
      expanded: expandedNode === 'start',
    });

    // Second campaign marker
    newNodes.push({
      id: 'campaign124',
      x: 59,
      y: 70,
      type: 'campaign',
      campaignId: 124,
      compassScore: overallCompassScore124,
      expanded: secondNodeExpanded,
    });

    setNodes(newNodes);
  }, [overallCompassScore, overallCompassScore124, expandedNode, secondNodeExpanded]);

  const toggleNode = (nodeId) => {
    if (nodeId === 'start') {
      setStartNodeExpanded(!startNodeExpanded);
    } else if (nodeId === 'campaign124') {
      setSecondNodeExpanded(!secondNodeExpanded);
    } else {
      setExpandedNode(expandedNode === nodeId ? null : nodeId);
      setSelectedNode(expandedNode === nodeId ? null : nodeId);
    }
  };

  const getTraitFromId = (traitId) => {
    return CORE_TRAITS.find(t => t.id === traitId);
  };

  const getSubTraitFromId = (traitId, subTraitId) => {
    const trait = getTraitFromId(traitId);
    return trait?.subTraits.find(st => st.id === subTraitId);
  };

  const getStatusColor = (verified) => {
    if (verified) return '#2F855A'; // green
    return '#E07A3F'; // orange
  };

  const hasActionPlanForSubTrait = (subTraitName, traitName) => {
    const trait = CORE_TRAITS.find((t) => String(t.name || '').toLowerCase() === String(traitName || '').toLowerCase());
    const subTrait = trait?.subTraits?.find((st) => String(st.name || '').toLowerCase() === String(subTraitName || '').toLowerCase());
    if (!trait || !subTrait) return false;

    const hasSaved = savedActionItems.some(
      (item) =>
        item?.traitId === trait.id &&
        item?.subTraitId === subTrait.id &&
        String(item?.text || '').trim().length > 0
    );
    if (hasSaved) return true;

    const payload = actionPlans?.[trait.id]?.[subTrait.id];
    if (!payload) return false;
    if (Array.isArray(payload?.items)) {
      return payload.items.some((it) => String(it?.text || '').trim().length > 0);
    }
    return String(payload?.text || '').trim().length > 0;
  };

  const handleDownload = () => {
    // Create a canvas to render the map for download
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw vintage texture overlay
    ctx.fillStyle = 'rgba(139, 115, 85, 0.1)';
    for (let i = 0; i < 100; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 3,
        Math.random() * 3
      );
    }
    
    // Draw nodes and paths
    // ... (simplified for now)
    
    // Convert to image and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compass-journey.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Stack spacing={4}>
      {savedActionItems.length > 0 && (
        <Card
          sx={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            boxShadow: 4,
          }}
        >
          <CardContent>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Saved Action Plan
            </Typography>
            <Stack spacing={0.8}>
              {savedActionItems.slice(0, 6).map((item, idx) => (
                <Typography key={`${item.traitId}-${item.subTraitId}-${idx}`} sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.92rem', color: 'text.secondary' }}>
                  - {item.text}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card
        sx={{
          background: 'transparent',
          border: 'none',
          borderRadius: 3.2,
          boxShadow: 'none',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '760px',
        }}
        ref={containerRef}
      >
        {/* Parchment base */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(1200px 700px at 22% 18%, rgba(255,244,214,0.62), rgba(201,168,121,0.18))',
            zIndex: 0,
            display: 'none',
          }}
        />
        {/* Fine paper grain */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(86,62,39,0.055) 0, rgba(86,62,39,0.055) 1px, transparent 1px, transparent 4px)',
            opacity: 0.35,
            zIndex: 1,
            display: 'none',
          }}
        />
        {/* Edge vignette */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 55%, rgba(79,53,28,0.18) 100%)',
            zIndex: 1,
            display: 'none',
          }}
        />

        <CardContent sx={{ position: 'relative', zIndex: 2, p: { xs: 2.2, md: 3.2 } }}>
          <Box
            ref={svgRef}
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: '670px',
              borderRadius: 2.5,
              border: '1px solid rgba(58,42,27,0.46)',
              backgroundImage: `url("${JOURNEY_MAP_SRC}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
            }}
          >
            <svg
              width="100%"
              height="700"
              viewBox="0 0 1000 700"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {/* Main curved hashed journey path: 1 -> 2 */}
              <path
                d="M 290 280 C 348 268, 396 264, 414 308 C 430 350, 358 378, 376 424 C 404 470, 492 488, 590 490"
                fill="none"
                stroke="rgba(42,29,18,0.92)"
                strokeWidth="4"
                strokeLinecap="butt"
                strokeDasharray="12 10"
              />
              {/* Failure branch to southwest X */}
              <path
                d="M 260 238 C 232 282, 210 322, 186 368"
                fill="none"
                stroke="rgba(42,29,18,0.58)"
                strokeWidth="4"
                strokeLinecap="butt"
                strokeDasharray="10 12"
              />
              {/* Failure branch to north-center X */}
              <path
                d="M 260 238 C 292 202, 338 186, 392 172"
                fill="none"
                stroke="rgba(42,29,18,0.58)"
                strokeWidth="4"
                strokeLinecap="butt"
                strokeDasharray="10 12"
              />
              <text x="176" y="390" fill="rgba(30,20,12,0.62)" fontSize="32" fontWeight="800" fontFamily="Montserrat, sans-serif">X</text>
              <text x="398" y="182" fill="rgba(30,20,12,0.62)" fontSize="32" fontWeight="800" fontFamily="Montserrat, sans-serif">X</text>

              {/* Draw nodes */}
              {nodes.map((node) => {
                const x = (node.x / 100) * 1000;
                const y = (node.y / 100) * 700;
                const radius = node.type === 'start' || node.id === 'campaign124' ? 34 : 25;

                return (
                  <g key={node.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={node.type === 'start' ? '#496F86' : node.type === 'campaign' ? '#2F855A' : node.type === 'survey' ? 'transparent' : '#3F7250'}
                      stroke="rgba(61,42,25,0.88)"
                      strokeWidth="2.2"
                      style={{ cursor: node.id === 'campaignFinal' ? 'default' : 'pointer' }}
                      onClick={() => node.id !== 'campaignFinal' && toggleNode(node.id)}
                    />
                    {(node.type === 'start' || node.type === 'campaign') && (
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="16"
                        fontWeight="700"
                        fontFamily="Montserrat, sans-serif"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.compassScore.toFixed(0)}
                      </text>
                    )}
                    {node.type === 'survey' && (
                      <text
                        x={x}
                        y={y + 50}
                        textAnchor="middle"
                        fill="#333"
                        fontSize="12"
                        fontFamily="Montserrat, sans-serif"
                      >
                        Survey {node.surveyNumber}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Popup Box for Start Node */}
            {startNodeExpanded && (() => {
              const startNode = nodes.find(n => n.type === 'start');
              if (!startNode) return null;
              
              // Calculate position to the right of the node
              // Node position is in percentage, convert to viewBox coordinates
              const nodeXPercent = startNode.x; // Already in percentage
              const nodeYPercent = startNode.y; // Already in percentage
              
              return (
                <Box
                  sx={{
                    position: 'absolute',
                    top: `${nodeYPercent}%`,
                    left: `${nodeXPercent + 8}%`, // Position to the right of node
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.95))',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 3,
                    boxShadow: 8,
                    p: 2,
                    minWidth: '330px',
                    maxWidth: '390px',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontWeight: 700 }}>
                      Trailhead
                    </Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', mr: 1 }}>
                      Plan
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setStartNodeExpanded(false)}
                      sx={{ p: 0.5 }}
                    >
                      <ExpandLess />
                    </IconButton>
                  </Stack>
                  <Stack spacing={2}>
                    {subTraitData.map((subTrait, idx) => {
                      const hasPlan = hasActionPlanForSubTrait(subTrait.name, subTrait.trait);
                      return (
                        <Box key={idx}>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={5}>
                              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', fontWeight: 600 }}>
                                {subTrait.name}
                              </Typography>
                            </Grid>
                            <Grid item xs={5}>
                              <Stack direction="column" spacing={0.4} alignItems="flex-end">
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', color: 'text.secondary', fontWeight: 600 }}>
                                  {subTrait.totalScore.toFixed(1)}
                                </Typography>
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.75rem', color: '#6393AA' }}>
                                  E: {subTrait.efficacy.toFixed(1)}
                                </Typography>
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.75rem', color: '#E07A3F' }}>
                                  F: {subTrait.effort.toFixed(1)}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                              {hasPlan ? (
                                <CheckCircle sx={{ fontSize: 18, color: '#2F855A' }} />
                              ) : (
                                <Cancel sx={{ fontSize: 18, color: '#C53030' }} />
                              )}
                            </Grid>
                          </Grid>
                          {idx < subTraitData.length - 1 && <Divider sx={{ mt: 1.2, mb: 0.5 }} />}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })()}

            {/* Popup Box for Second Node (Campaign 124) */}
            {secondNodeExpanded && (() => {
              const secondNode = nodes.find(n => n.id === 'campaign124');
              if (!secondNode) return null;
              
              // Calculate position to the left of the node
              const nodeXPercent = secondNode.x;
              const nodeYPercent = secondNode.y;
              
              return (
                <Box
                  sx={{
                    position: 'absolute',
                    top: `${nodeYPercent}%`,
                    left: `${nodeXPercent - 45}%`, // Position to the left of node
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.95))',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 3,
                    boxShadow: 8,
                    p: 3,
                    minWidth: '400px',
                    maxWidth: '500px',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontWeight: 700 }}>
                      Check-in Point
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setSecondNodeExpanded(false)}
                      sx={{ p: 0.5 }}
                    >
                      <ExpandLess />
                    </IconButton>
                  </Stack>
                  <Stack spacing={2}>
                    {subTraitData124.map((subTrait, idx) => {
                      const baselineSubTrait = subTraitData.find(st => st.name === subTrait.name);
                      const totalChange = baselineSubTrait ? subTrait.totalScore - baselineSubTrait.totalScore : 0;
                      const efficacyChange = baselineSubTrait ? subTrait.efficacy - baselineSubTrait.efficacy : 0;
                      const effortChange = baselineSubTrait ? subTrait.effort - baselineSubTrait.effort : 0;
                      
                      return (
                        <Box key={idx}>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={5}>
                              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', fontWeight: 600 }}>
                                {subTrait.name}
                              </Typography>
                              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.75rem', color: 'text.secondary', fontStyle: 'italic' }}>
                                {subTrait.trait}
                              </Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Stack direction="column" spacing={0.5} alignItems="flex-end">
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', color: 'text.secondary', fontWeight: 600 }}>
                                    {subTrait.totalScore.toFixed(1)}
                                  </Typography>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.7rem', color: totalChange >= 0 ? '#2F855A' : '#E07A3F', fontWeight: 600 }}>
                                    {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(1)}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.75rem', color: '#6393AA' }}>
                                    E: {subTrait.efficacy.toFixed(1)}
                                  </Typography>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.65rem', color: efficacyChange >= 0 ? '#2F855A' : '#E07A3F' }}>
                                    {efficacyChange >= 0 ? '+' : ''}{efficacyChange.toFixed(1)}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.75rem', color: '#E07A3F' }}>
                                    F: {subTrait.effort.toFixed(1)}
                                  </Typography>
                                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.65rem', color: effortChange >= 0 ? '#2F855A' : '#E07A3F' }}>
                                    {effortChange >= 0 ? '+' : ''}{effortChange.toFixed(1)}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Grid>
                          </Grid>
                          {idx < subTraitData124.length - 1 && <Divider sx={{ mt: 1.5, mb: 0.5 }} />}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })()}

            {/* Node details overlay */}
            {expandedNode && (() => {
              const node = nodes.find(n => n.id === expandedNode);
              if (!node) return null;

              if (node.type === 'start') {
                // This should not happen anymore since we removed click for start node
                return null;
                const traits = fakeCampaign["campaign_123"].campaign;
                return (
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '90%',
                      maxWidth: '800px',
                      maxHeight: '80vh',
                      overflow: 'auto',
                      p: 3,
                      bgcolor: 'rgba(255,255,255,0.98)',
                      boxShadow: 8,
                      zIndex: 10,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>
                          Starting Point
                        </Typography>
                        <IconButton onClick={() => setExpandedNode(null)}>
                          <ExpandLess />
                        </IconButton>
                      </Stack>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 600, color: '#6393AA' }}>
                        Compass Score: {node.compassScore.toFixed(1)}
                      </Typography>
                      <Divider />
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 600 }}>Trait</TableCell>
                            <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 600 }}>Compass</TableCell>
                            <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 600 }}>Efficacy</TableCell>
                            <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 600 }}>Effort</TableCell>
                            <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {traits.map((traitObj) => {
                            const data = traitData[traitObj.trait];
                            if (!data) return null;
                            const trait = CORE_TRAITS.find(t => t.name === traitObj.trait);
                            const verifiedCount = trait ? Object.values(actionPlans[trait.id] || {}).filter(p => p.verified).length : 0;
                            const totalCount = trait ? Object.values(actionPlans[trait.id] || {}).length : 0;
                            const statusColor = verifiedCount === totalCount && totalCount > 0 ? '#2F855A' : verifiedCount > 0 ? '#ECC94B' : '#E07A3F';

                            return (
                              <TableRow key={traitObj.trait}>
                                <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>{traitObj.trait}</TableCell>
                                <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>{data.lepScore.toFixed(1)}</TableCell>
                                <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>{data.efficacy.toFixed(1)}</TableCell>
                                <TableCell sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>{data.effort.toFixed(1)}</TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: statusColor,
                                      border: '2px solid #333',
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Stack>
                  </Paper>
                );
              }

              if (node.type === 'action') {
                const subTrait = getSubTraitFromId(node.traitId, node.subTraitId);
                const trait = getTraitFromId(node.traitId);
                // Find subtrait data by matching the subtrait name
                const data = subTraitData.find(st => st.name === subTrait?.name);

                return (
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: `${node.y}%`,
                      left: `${node.x > 50 ? node.x - 30 : node.x + 30}%`,
                      transform: node.x > 50 ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
                      width: '300px',
                      p: 2,
                      bgcolor: 'rgba(255,255,255,0.98)',
                      boxShadow: 8,
                      zIndex: 10,
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontWeight: 700 }}>
                        {trait?.name} - {subTrait?.name}
                      </Typography>
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', color: 'text.secondary' }}>
                        {node.actionText}
                      </Typography>
                      {data && (
                        <Stack direction="row" spacing={1}>
                          <Chip label={`C: ${data.totalScore.toFixed(1)}`} size="small" />
                          <Chip label={`E: ${data.efficacy.toFixed(1)}`} size="small" />
                          <Chip label={`F: ${data.effort.toFixed(1)}`} size="small" />
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                );
              }

              return null;
            })()}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: -0.8 }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              borderColor: 'rgba(255,255,255,0.44)',
              color: 'rgba(255,255,255,0.95)',
              bgcolor: 'rgba(8,14,26,0.32)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.72)',
                bgcolor: 'rgba(8,14,26,0.52)',
              },
            }}
          >
            Download Map
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              borderColor: 'rgba(255,255,255,0.44)',
              color: 'rgba(255,255,255,0.95)',
              bgcolor: 'rgba(8,14,26,0.32)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.72)',
                bgcolor: 'rgba(8,14,26,0.52)',
              },
            }}
          >
            Print
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}

export default JourneyTab;

