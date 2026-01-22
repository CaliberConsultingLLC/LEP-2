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
} from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';
const { CORE_TRAITS } = traitSystem;

function JourneyTab() {
  const [actionPlans, setActionPlans] = useState({});
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
    const saved = localStorage.getItem('actionPlans');
    if (saved) {
      try {
        setActionPlans(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse action plans:', e);
      }
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
    let nodeIndex = 0;

    // Starting node (Trailhead) - further left, near bottom
    newNodes.push({
      id: 'start',
      x: 12, // further left
      y: 85, // near bottom
      type: 'start',
      compassScore: overallCompassScore,
      expanded: expandedNode === 'start',
    });

    // Second node (campaign 124) - even further right and up from start
    newNodes.push({
      id: 'campaign124',
      x: 82, // even further right
      y: 55, // up from start
      type: 'campaign',
      campaignId: 124,
      compassScore: overallCompassScore124,
      expanded: secondNodeExpanded,
    });

    // Add nodes for verified action items
    Object.entries(actionPlans).forEach(([traitId, subtraits]) => {
      Object.entries(subtraits).forEach(([subTraitId, plan]) => {
        if (plan.verified) {
          // Randomize position slightly above starting node
          const angle = (nodeIndex * 137.5) % 360; // Golden angle for distribution
          const distance = 15 + (nodeIndex % 3) * 5; // Vary distance
          const x = 50 + (distance * Math.cos(angle * Math.PI / 180));
          const y = 85 - (distance * Math.sin(angle * Math.PI / 180));
          
          newNodes.push({
            id: `${traitId}_${subTraitId}`,
            x: Math.max(10, Math.min(90, x)),
            y: Math.max(10, Math.min(80, y)),
            type: 'action',
            traitId,
            subTraitId,
            actionText: plan.text,
            verifiedAt: plan.verifiedAt,
            expanded: expandedNode === `${traitId}_${subTraitId}`,
          });
          nodeIndex++;
        }
      });
    });

    // Add future survey nodes
    const verifiedCount = Object.values(actionPlans).reduce((sum, subtraits) => 
      sum + Object.values(subtraits).filter(p => p.verified).length, 0
    );
    const totalSubtraits = Object.values(actionPlans).reduce((sum, subtraits) => 
      sum + Object.values(subtraits).length, 0
    );

    if (verifiedCount > 0 && verifiedCount === totalSubtraits) {
      // All actions verified - show path to Survey 2
      newNodes.push({
        id: 'survey2',
        x: 50,
        y: 40,
        type: 'survey',
        surveyNumber: 2,
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });
    }

    setNodes(newNodes);
  }, [actionPlans, overallCompassScore, overallCompassScore124, expandedNode, secondNodeExpanded]);

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
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            fontSize: '2rem',
            fontWeight: 700,
            mb: 1,
            color: 'text.primary',
          }}
        >
          Your Leadership Journey
        </Typography>
        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.secondary', maxWidth: '800px', mx: 'auto' }}>
          Visualize your path forward. Each verified action becomes a milestone on your journey toward true north.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
            sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}
          >
            Download Map
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}
          >
            Print
          </Button>
        </Stack>
      </Box>

      <Card
        sx={{
          background: 'linear-gradient(145deg, rgba(245,245,220,0.95), rgba(250,235,215,0.8))',
          border: '2px solid',
          borderColor: 'rgba(139,115,85,0.5)',
          borderRadius: 3,
          boxShadow: 6,
          position: 'relative',
          overflow: 'hidden',
          minHeight: '800px',
        }}
        ref={containerRef}
      >
        {/* Vintage map background overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/LEP2.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 30%, rgba(139,115,85,0.1), transparent 50%)',
            zIndex: 1,
          }}
        />

        <CardContent sx={{ position: 'relative', zIndex: 2, p: 4 }}>
          <Box
            ref={svgRef}
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: '700px',
              background: 'transparent',
            }}
          >
            <svg
              width="100%"
              height="700"
              viewBox="0 0 1000 700"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {/* Draw Indiana Jones-style trail from start to campaign124 */}
              {(() => {
                const startNode = nodes.find(n => n.type === 'start');
                const campaign124Node = nodes.find(n => n.id === 'campaign124');
                if (!startNode || !campaign124Node) return null;

                const x1 = (startNode.x / 100) * 1000;
                const y1 = (startNode.y / 100) * 700;
                const x2 = (campaign124Node.x / 100) * 1000;
                const y2 = (campaign124Node.y / 100) * 700;

                // Create a more complex, winding path with multiple curves
                // This creates a longer, more challenging journey appearance
                const dx = x2 - x1;
                const dy = y2 - y1;
                
                // Multiple control points for a winding path with more curves
                const cp1x = x1 + dx * 0.1;
                const cp1y = y1 - 50;
                const cp2x = x1 + dx * 0.2;
                const cp2y = y1 - 70;
                const cp3x = x1 + dx * 0.3;
                const cp3y = y1 - 85;
                const cp4x = x1 + dx * 0.4;
                const cp4y = y1 - 75;
                const cp5x = x1 + dx * 0.5;
                const cp5y = y1 - 60;
                const cp6x = x1 + dx * 0.6;
                const cp6y = y1 - 40;
                const cp7x = x1 + dx * 0.7;
                const cp7y = y2 + 25;
                const cp8x = x1 + dx * 0.8;
                const cp8y = y2 + 15;
                const cp9x = x1 + dx * 0.9;
                const cp9y = y2 + 5;
                
                // Create a path with multiple curves using cubic bezier segments
                // More segments = more curves = more challenging journey
                const path = `M ${x1} ${y1} 
                  C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1 + dx * 0.25} ${y1 - 80}
                  C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${x1 + dx * 0.45} ${y1 - 70}
                  C ${cp5x} ${cp5y}, ${cp6x} ${cp6y}, ${x1 + dx * 0.65} ${y1 - 30}
                  C ${cp7x} ${cp7y}, ${cp8x} ${cp8y}, ${x1 + dx * 0.85} ${y2 + 10}
                  C ${cp9x} ${cp9y}, ${x2 - 15} ${y2 + 3}, ${x2} ${y2}`;

                return (
                  <path
                    key="trail-start-to-124"
                    d={path}
                    fill="none"
                    stroke="#C41E3A"
                    strokeWidth="5"
                    strokeDasharray="15, 8"
                    opacity={0.9}
                  />
                );
              })()}

              {/* Draw paths between other nodes */}
              {nodes.map((node, idx) => {
                if (node.type === 'start' || node.id === 'campaign124') return null;
                
                const startNode = nodes.find(n => n.type === 'start');
                if (!startNode) return null;

                const x1 = (startNode.x / 100) * 1000;
                const y1 = (startNode.y / 100) * 700;
                const x2 = (node.x / 100) * 1000;
                const y2 = (node.y / 100) * 700;

                // Create curved path
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2 - 30;
                const path = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

                return (
                  <path
                    key={`path-${node.id}`}
                    d={path}
                    fill="none"
                    stroke={node.type === 'survey' ? '#666' : '#2F855A'}
                    strokeWidth="2"
                    strokeDasharray={node.type === 'survey' ? '5,5' : '3,3'}
                    opacity={0.6}
                  />
                );
              })}

              {/* Draw nodes */}
              {nodes.map((node) => {
                const x = (node.x / 100) * 1000;
                const y = (node.y / 100) * 700;
                const radius = node.type === 'start' ? 40 : 25;

                return (
                  <g key={node.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={node.type === 'start' ? '#6393AA' : node.type === 'campaign' ? '#2F855A' : node.type === 'survey' ? 'transparent' : '#2F855A'}
                      stroke="#333"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleNode(node.id)}
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
                        fontFamily="Gemunu Libre, sans-serif"
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
                        fontFamily="Gemunu Libre, sans-serif"
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
                    p: 3,
                    minWidth: '400px',
                    maxWidth: '500px',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', fontWeight: 700 }}>
                      Trailhead
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
                    {subTraitData.map((subTrait, idx) => (
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
                            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
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
                        </Grid>
                        {idx < subTraitData.length - 1 && <Divider sx={{ mt: 1.5, mb: 0.5 }} />}
                      </Box>
                    ))}
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
    </Stack>
  );
}

export default JourneyTab;

