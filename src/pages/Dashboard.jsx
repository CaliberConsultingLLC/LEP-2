import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, LinearProgress, Grid, Chip, Collapse, IconButton, Stack } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import fakeCampaign from '../data/fakeCampaign.js';
import fakeData from '../data/fakeData.js';

function Dashboard() {
  const navigate = useNavigate();
  const [traitData, setTraitData] = useState({});
  const [overallLEP, setOverallLEP] = useState(0);
  const [expandedTraits, setExpandedTraits] = useState({});

  useEffect(() => {
    const calculatedData = {};
    const traits = fakeCampaign["campaign_123"].campaign;
    let totalLEP = 0;
    let traitCount = 0;

    traits.forEach((traitObj, traitIndex) => {
      const traitRatings = { efficacy: [], effort: [] };
      
      fakeData.responses.forEach(response => {
        for (let i = 0; i < 3; i++) {
          const statementIndex = traitIndex * 3 + i;
          if (response.ratings[statementIndex]) {
            traitRatings.efficacy.push(response.ratings[statementIndex].efficacy);
            traitRatings.effort.push(response.ratings[statementIndex].effort);
          }
        }
      });

      const avgEfficacy = traitRatings.efficacy.reduce((sum, val) => sum + val, 0) / traitRatings.efficacy.length;
      const avgEffort = traitRatings.effort.reduce((sum, val) => sum + val, 0) / traitRatings.effort.length;
      const lepScore = (avgEfficacy * 2 + avgEffort) / 3;

      calculatedData[traitObj.trait] = { 
        efficacy: avgEfficacy, 
        effort: avgEffort, 
        lepScore,
        statements: traitObj.statements.map((statement, idx) => {
          const stmtIdx = traitIndex * 3 + idx;
          const stmtEfficacy = fakeData.responses.map(r => r.ratings[stmtIdx].efficacy);
          const stmtEffort = fakeData.responses.map(r => r.ratings[stmtIdx].effort);
          return {
            text: statement,
            efficacy: stmtEfficacy.reduce((a, b) => a + b) / stmtEfficacy.length,
            effort: stmtEffort.reduce((a, b) => a + b) / stmtEffort.length,
            lepScore: ((stmtEfficacy.reduce((a, b) => a + b) / stmtEfficacy.length) * 2 + 
                      (stmtEffort.reduce((a, b) => a + b) / stmtEffort.length)) / 3
          };
        })
      };

      totalLEP += lepScore;
      traitCount++;
    });

    setTraitData(calculatedData);
    setOverallLEP(totalLEP / traitCount);
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

  return (
    <Box
      sx={{
        p: 5,
        minHeight: '100vh',
        width: '100vw',
        bgcolor: '#364B54',
        color: 'white',
      }}
    >
      <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
        <Stack spacing={4} sx={{ width: '100%' }}>
          {/* Overall Visualization */}
          <Box sx={{ bgcolor: '#612C17', p: 3, borderRadius: 2, width: '100%' }}>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem' }}>
              Overall Campaign LEP Score
            </Typography>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '3rem', fontWeight: 'bold' }}>
              {overallLEP.toFixed(1)}
            </Typography>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem' }}>
              Based on all trait assessments
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ width: '100%' }}>
            {Object.entries(traitData).map(([trait, data]) => (
              <Grid item xs={12} sm={6} md={4} key={trait}>
                <Box sx={{ bgcolor: 'white', color: '#364B54', p: 3, borderRadius: 2, boxShadow: 1 }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.25rem', fontWeight: 'bold', mb: 2 }}>
                    {trait}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'start' }}>
                    <Chip
                      label={data.lepScore.toFixed(1)}
                      sx={{
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontSize: '1.5rem',
                        p: 2,
                        bgcolor: data.lepScore > 50 ? '#38A169' : '#F56565',
                        color: 'white',
                      }}
                    />
                    <Stack spacing={1} sx={{ alignItems: 'start' }}>
                      <Stack direction="row" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={data.effort}
                          sx={{ width: '200px', height: '20px', borderRadius: 2, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: '#BC5C2B' } }}
                        />
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem' }}>
                          {data.effort.toFixed(1)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={data.efficacy}
                          sx={{ width: '200px', height: '20px', borderRadius: 2, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: '#6393AA' } }}
                        />
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem' }}>
                          {data.efficacy.toFixed(1)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                  <Stack spacing={1} sx={{ alignItems: 'start' }}>
                    {data.statements.map((stmt, idx) => (
                      <Box key={idx} sx={{ width: '100%' }}>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.8rem' }}>
                          {stmt.text}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.7rem' }}>
                            LEP: {stmt.lepScore.toFixed(1)}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.7rem' }}>
                            Eff: {stmt.effort.toFixed(1)} / Efc: {stmt.efficacy.toFixed(1)}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Expandable Visualization */}
          <Stack spacing={3} sx={{ width: '100%', mt: 6, p: 3, borderRadius: 2 }}>
            <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '2rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
              Trait Breakdown
            </Typography>
            {Object.entries(traitData).map(([trait, data]) => (
              <Box key={trait} sx={{ width: '100%', bgcolor: 'white', color: '#364B54', p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                    {trait}
                  </Typography>
                  <IconButton
                    onClick={() => toggleTrait(trait)}
                    size="medium"
                    sx={{ color: 'grey.600' }}
                  >
                    {expandedTraits[trait] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Stack>
                <Stack direction="row" spacing={4} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <Box sx={{ position: 'relative', width: '400px' }}>
                    <LinearProgress
                      variant="determinate"
                      value={data.efficacy}
                      sx={{ height: '30px', width: '100%', borderRadius: 2, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: '#6393AA' } }}
                    />
                    {[0, 25, 50, 75, 100].map((mark) => (
                      <Box
                        key={mark}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: `${mark}%`,
                          width: '1px',
                          height: '30px',
                          bgcolor: 'grey.400',
                          opacity: 0.5,
                        }}
                      />
                    ))}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: `${data.efficacy}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '12px',
                        height: '12px',
                        bgcolor: 'black',
                        borderRadius: '50%',
                        border: '2px solid white',
                      }}
                    />
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: '35px',
                        left: `${data.efficacy}%`,
                        transform: 'translateX(-50%)',
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontSize: '1rem',
                      }}
                    >
                      {data.efficacy.toFixed(1)}
                    </Typography>
                  </Box>
                  <Chip
                    label={data.lepScore.toFixed(1)}
                    sx={{
                      fontFamily: 'Gemunu Libre, sans-serif',
                      fontSize: '2.5rem',
                      p: 2,
                      bgcolor: getLEPColor(data.lepScore),
                      color: 'white',
                      borderRadius: 2,
                    }}
                  />
                  <Box sx={{ position: 'relative', width: '400px' }}>
                    <LinearProgress
                      variant="determinate"
                      value={data.effort}
                      sx={{
                        transform: 'scaleX(-1)',
                        height: '30px',
                        width: '100%',
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': { bgcolor: '#BC5C2B' },
                      }}
                    />
                    {[0, 25, 50, 75, 100].map((mark) => (
                      <Box
                        key={mark}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: `${mark}%`,
                          width: '1px',
                          height: '30px',
                          bgcolor: 'grey.400',
                          opacity: 0.5,
                        }}
                      />
                    ))}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: `${100 - data.effort}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '12px',
                        height: '12px',
                        bgcolor: 'black',
                        borderRadius: '50%',
                        border: '2px solid white',
                      }}
                    />
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: '35px',
                        left: `${100 - data.effort}%`,
                        transform: 'translateX(-50%)',
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontSize: '1rem',
                      }}
                    >
                      {data.effort.toFixed(1)}
                    </Typography>
                  </Box>
                </Stack>
                <Collapse in={expandedTraits[trait]} animateOpacity>
                  <Stack spacing={3} sx={{ mt: 3, alignItems: 'center' }}>
                    {data.statements.map((stmt, idx) => (
                      <Box key={idx} sx={{ width: '100%', borderTop: '1px solid #364B54', pt: 2 }}>
                        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', mb: 2, textAlign: 'center' }}>
                          {stmt.text}
                        </Typography>
                        <Stack direction="row" spacing={4} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                          <Box sx={{ position: 'relative', width: '350px' }}>
                            <LinearProgress
                              variant="determinate"
                              value={stmt.efficacy}
                              sx={{ height: '25px', width: '100%', borderRadius: 2, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: '#6393AA' } }}
                            />
                            {[0, 25, 50, 75, 100].map((mark) => (
                              <Box
                                key={mark}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: `${mark}%`,
                                  width: '1px',
                                  height: '25px',
                                  bgcolor: 'grey.400',
                                  opacity: 0.5,
                                }}
                              />
                            ))}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: `${stmt.efficacy}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '10px',
                                height: '10px',
                                bgcolor: 'black',
                                borderRadius: '50%',
                                border: '2px solid white',
                              }}
                            />
                            <Typography
                              sx={{
                                position: 'absolute',
                                top: '30px',
                                left: `${stmt.efficacy}%`,
                                transform: 'translateX(-50%)',
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.9rem',
                              }}
                            >
                              {stmt.efficacy.toFixed(1)}
                            </Typography>
                          </Box>
                          <Chip
                            label={stmt.lepScore.toFixed(1)}
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '1.5rem',
                              p: 1,
                              bgcolor: getLEPColor(stmt.lepScore),
                              color: 'white',
                              borderRadius: 2,
                            }}
                          />
                          <Box sx={{ position: 'relative', width: '350px' }}>
                            <LinearProgress
                              variant="determinate"
                              value={stmt.effort}
                              sx={{
                                transform: 'scaleX(-1)',
                                height: '25px',
                                width: '100%',
                                borderRadius: 2,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': { bgcolor: '#BC5C2B' },
                              }}
                            />
                            {[0, 25, 50, 75, 100].map((mark) => (
                              <Box
                                key={mark}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: `${mark}%`,
                                  width: '1px',
                                  height: '25px',
                                  bgcolor: 'grey.400',
                                  opacity: 0.5,
                                }}
                              />
                            ))}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: `${100 - stmt.effort}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '10px',
                                height: '10px',
                                bgcolor: 'black',
                                borderRadius: '50%',
                                border: '2px solid white',
                              }}
                            />
                            <Typography
                              sx={{
                                position: 'absolute',
                                top: '30px',
                                left: `${100 - stmt.effort}%`,
                                transform: 'translateX(-50%)',
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.9rem',
                              }}
                            >
                              {stmt.effort.toFixed(1)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Collapse>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default Dashboard;