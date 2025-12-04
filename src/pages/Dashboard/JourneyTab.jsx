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
  const [traitData, setTraitData] = useState({});
  const [expandedNode, setExpandedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
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

  // Calculate trait data
  useEffect(() => {
    const calculatedData = {};
    const traits = fakeCampaign["campaign_123"].campaign;

    traits.forEach((traitObj, traitIndex) => {
      const traitRatings = { efficacy: [], effort: [] };
      
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

      calculatedData[traitObj.trait] = { 
        efficacy: avgEfficacy, 
        effort: avgEffort, 
        delta,
        lepScore,
      };
    });

    setTraitData(calculatedData);
  }, []);

  // Calculate overall Compass score
  const overallCompassScore = Object.values(traitData).length > 0
    ? Object.values(traitData).reduce((sum, t) => sum + t.lepScore, 0) / Object.values(traitData).length
    : 0;

  // Generate nodes for verified action items
  useEffect(() => {
    const newNodes = [];
    let nodeIndex = 0;

    // Starting node (bottom of map)
    newNodes.push({
      id: 'start',
      x: 50, // percentage
      y: 85, // near bottom
      type: 'start',
      compassScore: overallCompassScore,
      expanded: expandedNode === 'start',
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
  }, [actionPlans, overallCompassScore, expandedNode]);

  const toggleNode = (nodeId) => {
    setExpandedNode(expandedNode === nodeId ? null : nodeId);
    setSelectedNode(expandedNode === nodeId ? null : nodeId);
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
              {/* Draw paths between nodes */}
              {nodes.map((node, idx) => {
                if (node.type === 'start') return null;
                
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
                      fill={node.type === 'start' ? '#6393AA' : node.type === 'survey' ? 'transparent' : '#2F855A'}
                      stroke="#333"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleNode(node.id)}
                    />
                    {node.type === 'start' && (
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

            {/* Node details overlay */}
            {expandedNode && (() => {
              const node = nodes.find(n => n.id === expandedNode);
              if (!node) return null;

              if (node.type === 'start') {
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
                const data = traitData[trait?.name || ''];

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
                          <Chip label={`C: ${data.lepScore.toFixed(1)}`} size="small" />
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

