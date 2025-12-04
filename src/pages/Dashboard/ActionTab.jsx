import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Grid,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Paper,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  RadioButtonUnchecked,
  Save,
  Lightbulb,
} from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';
const { CORE_TRAITS } = traitSystem;

function ActionTab() {
  const [actionPlans, setActionPlans] = useState({});
  const [expandedTraits, setExpandedTraits] = useState({});
  const [traitData, setTraitData] = useState({});

  // Load saved action plans from localStorage
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

  // Calculate trait data (same as ResultsTab)
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

  const toggleTrait = (trait) => {
    setExpandedTraits(prev => ({
      ...prev,
      [trait]: !prev[trait]
    }));
  };

  const updateActionPlan = (traitId, subtraitId, actionText) => {
    setActionPlans(prev => {
      const updated = {
        ...prev,
        [traitId]: {
          ...prev[traitId],
          [subtraitId]: {
            text: actionText,
            verified: prev[traitId]?.[subtraitId]?.verified || false,
            createdAt: prev[traitId]?.[subtraitId]?.createdAt || new Date().toISOString(),
          }
        }
      };
      // Save to localStorage
      localStorage.setItem('actionPlans', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleVerification = (traitId, subtraitId) => {
    setActionPlans(prev => {
      const updated = {
        ...prev,
        [traitId]: {
          ...prev[traitId],
          [subtraitId]: {
            ...prev[traitId]?.[subtraitId],
            verified: !prev[traitId]?.[subtraitId]?.verified,
            verifiedAt: !prev[traitId]?.[subtraitId]?.verified ? new Date().toISOString() : null,
          }
        }
      };
      localStorage.setItem('actionPlans', JSON.stringify(updated));
      return updated;
    });
  };

  const getTraitFromName = (traitName) => {
    return CORE_TRAITS.find(t => t.name === traitName);
  };

  const getStatusColor = (verified) => {
    if (verified) return '#2F855A'; // green
    return '#E07A3F'; // orange (not verified)
  };

  const traits = fakeCampaign["campaign_123"].campaign;

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
          Your Action Plan
        </Typography>
        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.secondary', maxWidth: '800px', mx: 'auto' }}>
          Build specific, actionable plans for each trait and subtrait. These are your "stakes in the ground" that will guide your development journey.
        </Typography>
      </Box>

      {traits.map((traitObj) => {
        const trait = getTraitFromName(traitObj.trait);
        const data = traitData[traitObj.trait];
        if (!trait || !data) return null;

        return (
          <Card
            key={traitObj.trait}
            sx={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 3,
              boxShadow: 4,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}>
                    {traitObj.trait}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip
                      label={`Compass: ${data.lepScore.toFixed(1)}`}
                      size="small"
                      sx={{
                        bgcolor: '#6393AA',
                        color: 'white',
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={`Efficacy: ${data.efficacy.toFixed(1)}`}
                      size="small"
                      sx={{
                        bgcolor: '#6393AA',
                        color: 'white',
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={`Effort: ${data.effort.toFixed(1)}`}
                      size="small"
                      sx={{
                        bgcolor: '#E07A3F',
                        color: 'white',
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Box>
                <IconButton onClick={() => toggleTrait(traitObj.trait)}>
                  {expandedTraits[traitObj.trait] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Stack>

              <Collapse in={expandedTraits[traitObj.trait]}>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={3}>
                  {trait.subTraits.map((subTrait) => {
                    const actionKey = `${trait.id}_${subTrait.id}`;
                    const actionPlan = actionPlans[trait.id]?.[subTrait.id];
                    const hasAction = actionPlan?.text?.trim().length > 0;
                    const isVerified = actionPlan?.verified || false;

                    return (
                      <Paper
                        key={subTrait.id}
                        sx={{
                          p: 3,
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                          border: '1px solid',
                          borderColor: isVerified ? '#2F855A' : 'rgba(224,122,63,0.3)',
                          borderRadius: 2,
                          boxShadow: 2,
                        }}
                      >
                        <Stack spacing={2}>
                          <Box>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                              {subTrait.name}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary' }}>
                              {subTrait.shortDescription || subTrait.definition}
                            </Typography>
                          </Box>

                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="What specific action will you take to develop this subtrait? Be concrete and actionable..."
                            value={actionPlan?.text || ''}
                            onChange={(e) => updateActionPlan(trait.id, subTrait.id, e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontFamily: 'Gemunu Libre, sans-serif',
                                bgcolor: 'rgba(255,255,255,0.8)',
                              },
                            }}
                          />

                          {hasAction && (
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Button
                                variant={isVerified ? "contained" : "outlined"}
                                startIcon={isVerified ? <CheckCircle /> : <RadioButtonUnchecked />}
                                onClick={() => toggleVerification(trait.id, subTrait.id)}
                                sx={{
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  bgcolor: isVerified ? getStatusColor(true) : 'transparent',
                                  borderColor: getStatusColor(isVerified),
                                  color: isVerified ? 'white' : getStatusColor(false),
                                  '&:hover': {
                                    bgcolor: isVerified ? getStatusColor(true) : getStatusColor(false),
                                    color: 'white',
                                  },
                                }}
                              >
                                {isVerified ? 'Verified' : 'Mark as Verified'}
                              </Button>
                              {isVerified && actionPlan?.verifiedAt && (
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', color: 'text.secondary' }}>
                                  Verified on {new Date(actionPlan.verifiedAt).toLocaleDateString()}
                                </Typography>
                              )}
                            </Stack>
                          )}

                          {subTrait.actions && (
                            <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(99,147,170,0.1)', borderRadius: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <Lightbulb sx={{ color: '#6393AA', fontSize: 20 }} />
                                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: 'text.primary' }}>
                                  Suggested Actions
                                </Typography>
                              </Stack>
                              <Stack spacing={0.5}>
                                {subTrait.actions.dailyHabits?.slice(0, 2).map((action, idx) => (
                                  <Typography key={idx} sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.85rem', color: 'text.secondary', pl: 3 }}>
                                    • {action}
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

export default ActionTab;

