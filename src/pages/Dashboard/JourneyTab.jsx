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
  const MUTED_GREEN = '#6F9A83';
  const MUTED_YELLOW = '#D7C97E';
  const MUTED_RED = '#C88D86';
  const [actionPlans, setActionPlans] = useState({});
  const [plansByCampaign, setPlansByCampaign] = useState({});
  const [savedActionItems, setSavedActionItems] = useState([]);
  const [subTraitData, setSubTraitData] = useState([]);
  const [subTraitData124, setSubTraitData124] = useState([]);
  const [subTraitData125, setSubTraitData125] = useState([]);
  const [expandedNode, setExpandedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState('trailhead');
  const [actionPanelOpen, setActionPanelOpen] = useState(false);
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
      const campaignPlansById = {
        '123': byCampaign?.['123']?.[userKey]?.plans || {},
        '124': byCampaign?.['124']?.[userKey]?.plans || {},
        '125': byCampaign?.['125']?.[userKey]?.plans || {},
      };
      const flat = [];
      Object.entries(campaignPlansById).forEach(([campaignId, campaignPlans]) => {
        Object.entries(campaignPlans || {}).forEach(([traitId, subtraits]) => {
          Object.entries(subtraits || {}).forEach(([subTraitId, payload]) => {
            (payload?.items || []).forEach((item) => {
              if (String(item?.text || '').trim()) {
                flat.push({ campaignId, traitId, subTraitId, text: item.text });
              }
            });
          });
        });
      });
      setPlansByCampaign(campaignPlansById);
      setSavedActionItems(flat);

      const legacy = JSON.parse(localStorage.getItem('actionPlans') || '{}');
      setActionPlans(legacy);
    } catch (e) {
      console.error('Failed to parse action plans:', e);
    }
  }, []);

  useEffect(() => {
    setActionPanelOpen(false);
  }, [selectedNode]);

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
    setSubTraitData125(calculateSubTraitData(125));
  }, []);

  // Calculate overall Compass score from subtrait scores
  const overallCompassScore = subTraitData.length > 0
    ? subTraitData.reduce((sum, st) => sum + st.totalScore, 0) / subTraitData.length
    : 0;

  // Calculate overall Compass score for campaign 124
  const overallCompassScore124 = subTraitData124.length > 0
    ? subTraitData124.reduce((sum, st) => sum + st.totalScore, 0) / subTraitData124.length
    : 0;
  const overallCompassScore125 = subTraitData125.length > 0
    ? subTraitData125.reduce((sum, st) => sum + st.totalScore, 0) / subTraitData125.length
    : 0;

  const getNodeFill = (status) => {
    if (status === 'complete') return MUTED_GREEN;
    if (status === 'in_progress') return MUTED_YELLOW;
    return '#FFFFFF';
  };

  const journeyProgress = (() => {
    try {
      const raw = localStorage.getItem('mockJourneyProgress');
      if (!raw) return { trailhead: 'complete', checkin: 'complete', summit: 'in_progress' };
      const parsed = JSON.parse(raw);
      return {
        trailhead: parsed?.trailhead || 'complete',
        checkin: parsed?.checkin || 'complete',
        summit: parsed?.summit || 'in_progress',
      };
    } catch {
      return { trailhead: 'complete', checkin: 'complete', summit: 'in_progress' };
    }
  })();

  // Generate journey nodes
  useEffect(() => {
    const newNodes = [];

    // Trailhead
    newNodes.push({
      id: 'trailhead',
      x: 26,
      y: 40,
      type: 'trailhead',
      status: journeyProgress.trailhead,
      compassScore: overallCompassScore,
    });

    // Check-in point
    newNodes.push({
      id: 'checkin',
      x: 59,
      y: 70,
      type: 'checkin',
      status: journeyProgress.checkin,
      campaignId: 124,
      compassScore: overallCompassScore124,
    });

    // Summit
    newNodes.push({
      id: 'summit',
      x: 78,
      y: 28,
      type: 'summit',
      status: journeyProgress.summit,
      campaignId: 125,
      compassScore: overallCompassScore125,
    });

    setNodes(newNodes);
  }, [overallCompassScore, overallCompassScore124, overallCompassScore125, journeyProgress.trailhead, journeyProgress.checkin, journeyProgress.summit]);

  const toggleNode = (nodeId) => {
    setSelectedNode(nodeId);
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

  const hasActionPlanForSubTrait = (subTraitName, traitName, campaignId = '123') => {
    const trait = CORE_TRAITS.find((t) => String(t.name || '').toLowerCase() === String(traitName || '').toLowerCase());
    const subTrait = trait?.subTraits?.find((st) => String(st.name || '').toLowerCase() === String(subTraitName || '').toLowerCase());
    if (!trait || !subTrait) return false;

    const hasSaved = savedActionItems.some(
      (item) =>
        String(item?.campaignId || '') === String(campaignId) &&
        item?.traitId === trait.id &&
        item?.subTraitId === subTrait.id &&
        String(item?.text || '').trim().length > 0
    );
    if (hasSaved) return true;

    const payload = plansByCampaign?.[String(campaignId)]?.[trait.id]?.[subTrait.id]
      || actionPlans?.[trait.id]?.[subTrait.id];
    if (!payload) return false;
    if (Array.isArray(payload?.items)) {
      return payload.items.some((it) => String(it?.text || '').trim().length > 0);
    }
    return String(payload?.text || '').trim().length > 0;
  };

  const panelModel = (() => {
    if (selectedNode === 'checkin') {
      return {
        id: 'checkin',
        title: 'Check-In Point',
        subtitle: 'Campaign 124',
        campaignId: '124',
        status: journeyProgress.checkin,
        current: subTraitData124,
        baseline: subTraitData,
      };
    }
    if (selectedNode === 'summit') {
      return {
        id: 'summit',
        title: 'Summit Campaign',
        subtitle: 'Campaign 125 (In Progress)',
        campaignId: '125',
        status: journeyProgress.summit,
        current: subTraitData125,
        baseline: subTraitData124,
      };
    }
    return {
      id: 'trailhead',
      title: 'Trailhead Campaign',
      subtitle: 'Campaign 123',
      campaignId: '123',
      status: journeyProgress.trailhead,
      current: subTraitData,
      baseline: [],
    };
  })();

  const actionPlanComplete = panelModel.current.length > 0 && panelModel.current.every((subTrait) =>
    hasActionPlanForSubTrait(subTrait.name, subTrait.trait, panelModel.campaignId)
  );

  const actionPlanRows = panelModel.current.map((subTrait) => {
    const trait = CORE_TRAITS.find((t) => String(t.name || '').toLowerCase() === String(subTrait.trait || '').toLowerCase());
    const traitId = trait?.id;
    const subTraitRef = trait?.subTraits?.find((st) => String(st.name || '').toLowerCase() === String(subTrait.name || '').toLowerCase());
    const payload = plansByCampaign?.[panelModel.campaignId]?.[traitId]?.[subTraitRef?.id]
      || actionPlans?.[traitId]?.[subTraitRef?.id]
      || {};
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return { subTrait, items };
  });

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
      <Card
        sx={{
          background: 'transparent',
          border: 'none',
          borderRadius: 3.2,
          boxShadow: 'none',
          position: 'relative',
          overflow: 'visible',
          minHeight: '880px',
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
              transform: 'scale(1.15)',
              transformOrigin: 'top center',
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
              {/* Summit route: 2 -> 3 (same style, map-following curve) */}
              <path
                d="M 590 490 C 650 506, 732 516, 748 466 C 764 412, 678 370, 706 328 C 736 282, 768 268, 790 224"
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
                const isActive = selectedNode === node.id;
                const fill = getNodeFill(node.status);

                return (
                  <g key={node.id}>
                    {node.type === 'trailhead' && (
                      <circle
                        cx={x}
                        cy={y}
                        r={30}
                        fill={fill}
                        stroke="#111"
                        strokeWidth={isActive ? 2.6 : 1.6}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleNode(node.id)}
                      />
                    )}
                    {node.type === 'checkin' && (
                      <polygon
                        points={`${x},${y - 32} ${x + 32},${y} ${x},${y + 32} ${x - 32},${y}`}
                        fill={fill}
                        stroke="#111"
                        strokeWidth={isActive ? 2.6 : 1.6}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleNode(node.id)}
                      />
                    )}
                    {node.type === 'summit' && (
                      <polygon
                        points={`${x},${y - 34} ${x + 32},${y + 28} ${x - 32},${y + 28}`}
                        fill={fill}
                        stroke="#111"
                        strokeWidth={isActive ? 2.6 : 1.6}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleNode(node.id)}
                      />
                    )}
                    {(node.type === 'trailhead' || node.type === 'checkin' || node.type === 'summit') && (
                      <text
                        x={x}
                        y={y + (node.type === 'summit' ? 9 : 1)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={node.status === 'incomplete' ? '#111' : '#fff'}
                        fontSize="15"
                        fontWeight="700"
                        fontFamily="Montserrat, sans-serif"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.compassScore.toFixed(0)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <Box
              sx={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                zIndex: 22,
                width: { xs: 'calc(100% - 32px)', md: 380 },
                borderRadius: 2,
                border: '1px solid rgba(40,26,14,0.72)',
                background: 'linear-gradient(145deg, rgba(249,241,222,0.96), rgba(236,219,185,0.94))',
                boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(1px)',
                p: 1.4,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.9 }}>
                <Box>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#20140B' }}>
                    {panelModel.title}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', color: 'rgba(32,20,11,0.76)', fontWeight: 600 }}>
                    {panelModel.subtitle}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.7} alignItems="center">
                  <Chip
                    size="small"
                    label={panelModel.status === 'complete' ? 'Complete' : panelModel.status === 'in_progress' ? 'In Progress' : 'Incomplete'}
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 700,
                      bgcolor: panelModel.status === 'complete' ? MUTED_GREEN : panelModel.status === 'in_progress' ? MUTED_YELLOW : '#FFFFFF',
                      color: panelModel.status === 'in_progress' ? '#3A2A1A' : panelModel.status === 'complete' ? '#FFFFFF' : '#3A2A1A',
                      border: '1px solid #111',
                    }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setActionPanelOpen((v) => !v)}
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 700,
                      textTransform: 'none',
                      minWidth: 96,
                      px: 1.1,
                      py: 0.25,
                      bgcolor: actionPlanComplete ? MUTED_GREEN : MUTED_RED,
                      color: '#FFFFFF',
                      border: '1px solid #111',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: actionPlanComplete ? '#628c78' : '#b97f78',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Action Plan
                  </Button>
                </Stack>
              </Stack>
              <Stack spacing={0.65}>
                {panelModel.current.map((subTrait, idx) => {
                  const baseline = panelModel.baseline.find((st) => st.name === subTrait.name);
                  const totalChange = baseline ? subTrait.totalScore - baseline.totalScore : 0;
                  return (
                    <Box
                      key={`${panelModel.id}-${subTrait.name}`}
                      sx={{
                        borderRadius: 1.1,
                        border: '1px solid rgba(35,23,12,0.28)',
                        bgcolor: 'rgba(255,255,255,0.75)',
                        px: 1,
                        py: 0.66,
                      }}
                    >
                      <Grid container spacing={0.6} alignItems="center">
                        <Grid item xs={5.6}>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: '#1B130C', lineHeight: 1.1 }}>
                            {subTrait.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={6.4}>
                          <Stack direction="row" spacing={0.85} justifyContent="flex-end" alignItems="center">
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.74rem', fontWeight: 700, color: '#1F2937' }}>
                              {subTrait.totalScore.toFixed(1)}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.69rem', fontWeight: 700, color: '#6393AA' }}>
                              E {subTrait.efficacy.toFixed(1)}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.69rem', fontWeight: 700, color: '#E07A3F' }}>
                              F {subTrait.effort.toFixed(1)}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.66rem', fontWeight: 700, color: totalChange >= 0 ? '#2F855A' : '#C53030' }}>
                              {baseline ? `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)}` : '-'}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {actionPanelOpen && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  zIndex: 22,
                  width: { xs: 'calc(100% - 32px)', md: 316 },
                  minHeight: { xs: 250, md: 405 },
                  borderRadius: 2,
                  border: '1px solid rgba(40,26,14,0.72)',
                  background: 'linear-gradient(145deg, rgba(249,241,222,0.96), rgba(236,219,185,0.94))',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(1px)',
                  p: 1.4,
                  overflow: 'hidden',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.9 }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#20140B' }}>
                    Action Plan
                  </Typography>
                  <Chip
                    size="small"
                    label={actionPlanComplete ? 'Complete' : 'Open'}
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 700,
                      bgcolor: actionPlanComplete ? MUTED_GREEN : MUTED_RED,
                      color: '#FFFFFF',
                      border: '1px solid #111',
                    }}
                  />
                </Stack>
                <Stack spacing={0.75}>
                  {actionPlanRows.map(({ subTrait, items }) => (
                    <Box
                      key={`ap-${panelModel.id}-${subTrait.name}`}
                      sx={{
                        borderRadius: 1.1,
                        border: '1px solid rgba(35,23,12,0.28)',
                        bgcolor: 'rgba(255,255,255,0.75)',
                        px: 1,
                        py: 0.72,
                      }}
                    >
                      <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.92rem', fontWeight: 700, color: '#1B130C', mb: 0.35 }}>
                        {subTrait.name}
                      </Typography>
                      {items.length ? (
                        <Stack spacing={0.3}>
                          {items.slice(0, 4).map((item, idx) => (
                            <Typography key={`api-${panelModel.id}-${subTrait.name}-${idx}`} sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: '#2B2218', lineHeight: 1.25 }}>
                              • {item.text}
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: 'rgba(43,34,24,0.75)' }}>
                          No action items logged yet.
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

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

