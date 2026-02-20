import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
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
  Close,
} from '@mui/icons-material';
import fakeCampaign from '../../data/fakeCampaign.js';
import fakeData from '../../data/fakeData.js';
import traitSystem from '../../data/traitSystem.js';
const { CORE_TRAITS } = traitSystem;

function ActionTab() {
  const [actionPlans, setActionPlans] = useState({});
  const [expandedTraits, setExpandedTraits] = useState({});
  const [traitData, setTraitData] = useState({});
  const [saveMessage, setSaveMessage] = useState('');
  const currentCampaignId = '123';
  const userInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch {
      return {};
    }
  })();
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';

  // Load saved action plans from localStorage
  useEffect(() => {
    try {
      const byCampaignRaw = localStorage.getItem('actionPlansByCampaign');
      if (byCampaignRaw) {
        const byCampaign = JSON.parse(byCampaignRaw);
        const savedForUser = byCampaign?.[currentCampaignId]?.[userKey]?.plans;
        if (savedForUser && typeof savedForUser === 'object') {
          setActionPlans(savedForUser);
          return;
        }
      }

      const legacyRaw = localStorage.getItem('actionPlans');
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        const migrated = {};
        Object.entries(legacy || {}).forEach(([traitId, subtraits]) => {
          migrated[traitId] = {};
          Object.entries(subtraits || {}).forEach(([subTraitId, plan]) => {
            const text = String(plan?.text || '').trim();
            migrated[traitId][subTraitId] = {
              items: text ? [{ id: `${traitId}-${subTraitId}-1`, text, createdAt: plan?.createdAt || new Date().toISOString() }] : [],
            };
          });
        });
        setActionPlans(migrated);
      }
    } catch (e) {
      console.error('Failed to parse action plans:', e);
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

  const updateActionPlan = (traitId, subtraitId, itemId, actionText) => {
    setActionPlans(prev => {
      const updated = {
        ...prev,
        [traitId]: {
          ...prev[traitId],
          [subtraitId]: {
            ...prev[traitId]?.[subtraitId],
            items: (prev[traitId]?.[subtraitId]?.items || []).map((item) => (
              item.id === itemId ? { ...item, text: actionText } : item
            )),
          }
        }
      };
      return updated;
    });
  };

  const addActionItem = (traitId, subtraitId) => {
    setActionPlans((prev) => {
      const items = prev[traitId]?.[subtraitId]?.items || [];
      const next = {
        ...prev,
        [traitId]: {
          ...prev[traitId],
          [subtraitId]: {
            ...prev[traitId]?.[subtraitId],
            items: [...items, { id: `${traitId}-${subtraitId}-${Date.now()}`, text: '', createdAt: new Date().toISOString() }],
          },
        },
      };
      return next;
    });
  };

  const removeActionItem = (traitId, subtraitId, itemId) => {
    setActionPlans((prev) => {
      const currentItems = prev[traitId]?.[subtraitId]?.items || [];
      const nextItems = currentItems.filter((item) => item.id !== itemId);
      return {
        ...prev,
        [traitId]: {
          ...prev[traitId],
          [subtraitId]: {
            ...prev[traitId]?.[subtraitId],
            items: nextItems,
          },
        },
      };
    });
  };

  const savePlan = () => {
    const sanitized = {};
    Object.entries(actionPlans || {}).forEach(([traitId, subtraits]) => {
      const perTrait = {};
      Object.entries(subtraits || {}).forEach(([subTraitId, payload]) => {
        const items = (payload?.items || [])
          .map((i) => ({ ...i, text: String(i?.text || '').trim() }))
          .filter((i) => i.text);
        if (items.length) {
          perTrait[subTraitId] = { items };
        }
      });
      if (Object.keys(perTrait).length) sanitized[traitId] = perTrait;
    });

    const all = (() => {
      try {
        return JSON.parse(localStorage.getItem('actionPlansByCampaign') || '{}');
      } catch {
        return {};
      }
    })();

    if (!all[currentCampaignId]) all[currentCampaignId] = {};
    all[currentCampaignId][userKey] = {
      user: { name: userInfo?.name || '', email: userInfo?.email || '' },
      savedAt: new Date().toISOString(),
      plans: sanitized,
    };
    localStorage.setItem('actionPlansByCampaign', JSON.stringify(all));

    // Backward-compatible mirror for Journey logic that still reads `actionPlans`
    const legacyMirror = {};
    Object.entries(sanitized).forEach(([traitId, subtraits]) => {
      legacyMirror[traitId] = {};
      Object.entries(subtraits).forEach(([subTraitId, payload]) => {
        legacyMirror[traitId][subTraitId] = {
          text: payload.items[0]?.text || '',
          verified: false,
          createdAt: payload.items[0]?.createdAt || new Date().toISOString(),
        };
      });
    });
    localStorage.setItem('actionPlans', JSON.stringify(legacyMirror));

    setSaveMessage('Plan saved for this user and campaign.');
    window.setTimeout(() => setSaveMessage(''), 1600);
  };

  const getTraitFromName = (traitName) => {
    return CORE_TRAITS.find(t => t.name === traitName);
  };

  const quickDefinition = (subTrait) => {
    const source = String(subTrait?.shortDescription || subTrait?.definition || '').replace(/\s+/g, ' ').trim();
    if (!source) return 'Building this capability improves leadership consistency';
    const words = source.split(' ').filter(Boolean);
    let line = source;
    if (line.length > 70) {
      let candidate = '';
      for (let i = 0; i < words.length; i += 1) {
        const next = candidate ? `${candidate} ${words[i]}` : words[i];
        if (next.length > 70) break;
        candidate = next;
      }
      line = candidate || line.slice(0, 70).trim();
    }
    if (line.length < 55) {
      const fillers = ['in', 'daily', 'leadership', 'contexts', 'with', 'consistency'];
      let idx = 0;
      while (line.length < 55 && idx < fillers.length) {
        line = `${line} ${fillers[idx]}`.trim();
        idx += 1;
      }
    }
    return line;
  };

  const traits = fakeCampaign["campaign_123"].campaign;

  return (
    <Grid container spacing={2.2} alignItems="flex-start">
      {traits.map((traitObj) => {
        const trait = getTraitFromName(traitObj.trait);
        const data = traitData[traitObj.trait];
        if (!trait || !data) return null;
        const measuredSubTraits = trait.subTraits.filter(
          (subTrait) => String(subTrait?.name || '').toLowerCase() === String(traitObj?.subTrait || '').toLowerCase()
        );
        const subTraitsToRender = measuredSubTraits.length ? measuredSubTraits : trait.subTraits.slice(0, 1);

        return (
          <Grid item xs={12} md={4} key={traitObj.trait}>
          <Card
            sx={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 3,
              boxShadow: 4,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.35rem', fontWeight: 700, color: 'text.primary' }}>
                    {traitObj.subTrait || traitObj.trait}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => toggleTrait(traitObj.trait)}>
                  {expandedTraits[traitObj.trait] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Stack>

              <Collapse in={expandedTraits[traitObj.trait]}>
                <Divider sx={{ my: 1.2 }} />
                <Stack spacing={3}>
                  {subTraitsToRender.map((subTrait) => {
                    const planItems = actionPlans[trait.id]?.[subTrait.id]?.items
                      || [{ id: `${trait.id}-${subTrait.id}-seed`, text: '', createdAt: new Date().toISOString() }];
                    const examplesWhenStrong = Array.isArray(subTrait?.strengthSignals)
                      ? subTrait.strengthSignals.slice(0, 2).map((x) => String(x).replace(/\.$/, '').toLowerCase())
                      : [];
                    const strengthSentence = examplesWhenStrong.length
                      ? ` When strong, ${examplesWhenStrong.join(', and ')}.`
                      : ' When strong, team trust and execution quality become more consistent.';

                    return (
                      <Paper
                        key={subTrait.id}
                        sx={{
                          p: 3,
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                          border: '1px solid',
                          borderColor: 'rgba(224,122,63,0.3)',
                          borderRadius: 2,
                          boxShadow: 2,
                        }}
                      >
                        <Stack spacing={2}>
                          <Box>
                            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.92rem', color: 'text.secondary', lineHeight: 1.55 }}>
                              {`${quickDefinition(subTrait)}.${strengthSentence}`}
                            </Typography>
                          </Box>

                          <Divider sx={{ borderColor: 'rgba(69,112,137,0.22)' }} />

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                              gap: 1.1,
                              mt: 0.2,
                            }}
                          >
                            <Stack spacing={0.55} alignItems="center">
                              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: 'text.secondary' }}>
                                Efficacy
                              </Typography>
                              <Chip
                                label={data.efficacy.toFixed(1)}
                                sx={{
                                  bgcolor: '#6393AA',
                                  color: 'rgba(0,0,0,0.84)',
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontWeight: 700,
                                  fontSize: '1.02rem',
                                  minWidth: 58,
                                  height: 30,
                                }}
                              />
                            </Stack>
                            <Stack spacing={0.55} alignItems="center">
                              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: 'text.secondary' }}>
                                Compass
                              </Typography>
                              <Chip
                                label={data.lepScore.toFixed(1)}
                                sx={{
                                  bgcolor: 'white',
                                  color: 'rgba(0,0,0,0.84)',
                                  border: '1px solid rgba(0,0,0,0.22)',
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontWeight: 700,
                                  fontSize: '1.02rem',
                                  minWidth: 58,
                                  height: 30,
                                }}
                              />
                            </Stack>
                            <Stack spacing={0.55} alignItems="center">
                              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.88rem', fontWeight: 700, color: 'text.secondary' }}>
                                Effort
                              </Typography>
                              <Chip
                                label={data.effort.toFixed(1)}
                                sx={{
                                  bgcolor: '#E07A3F',
                                  color: 'rgba(0,0,0,0.84)',
                                  fontFamily: 'Gemunu Libre, sans-serif',
                                  fontWeight: 700,
                                  fontSize: '1.02rem',
                                  minWidth: 58,
                                  height: 30,
                                }}
                              />
                            </Stack>
                          </Box>

                          <Divider sx={{ borderColor: 'rgba(69,112,137,0.22)' }} />

                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.02rem', fontWeight: 700, textAlign: 'center', color: 'text.primary' }}>
                            Action Plan
                          </Typography>

                          <Stack spacing={1.2}>
                            {planItems.map((item, idx) => (
                              <Box key={item.id || `${trait.id}-${subTrait.id}-${idx}`} sx={{ position: 'relative' }}>
                                {idx > 0 ? (
                                  <IconButton
                                    size="small"
                                    onClick={() => removeActionItem(trait.id, subTrait.id, item.id)}
                                    sx={{
                                      position: 'absolute',
                                      top: 6,
                                      right: 6,
                                      zIndex: 2,
                                      width: 20,
                                      height: 20,
                                      bgcolor: 'rgba(255,255,255,0.9)',
                                      border: '1px solid rgba(0,0,0,0.18)',
                                      '&:hover': {
                                        bgcolor: 'rgba(255,235,235,0.95)',
                                      },
                                    }}
                                  >
                                    <Close sx={{ fontSize: 13 }} />
                                  </IconButton>
                                ) : null}
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={3}
                                  placeholder="What specific action will you take in this area?"
                                  value={item?.text || ''}
                                  onChange={(e) => updateActionPlan(trait.id, subTrait.id, item.id, e.target.value)}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      fontFamily: 'Gemunu Libre, sans-serif',
                                      bgcolor: 'rgba(255,255,255,0.8)',
                                    },
                                  }}
                                />
                              </Box>
                            ))}
                          </Stack>

                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip
                              clickable
                              label="Add Action"
                              onClick={() => addActionItem(trait.id, subTrait.id)}
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(99,147,170,0.14)',
                                border: '1px solid rgba(99,147,170,0.45)',
                              }}
                            />
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>
          </Grid>
        );
      })}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 0.5 }}>
          <Chip
            clickable
            label="Save Plan"
            onClick={savePlan}
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1rem',
              fontWeight: 800,
              px: 1.6,
              py: 0.45,
              bgcolor: '#457089',
              color: 'white',
              border: '1px solid rgba(30,60,80,0.5)',
            }}
          />
          {saveMessage ? (
            <Typography sx={{ mt: 0.8, fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: '#2F855A', fontWeight: 700 }}>
              {saveMessage}
            </Typography>
          ) : null}
        </Box>
      </Grid>
    </Grid>
  );
}

export default ActionTab;

