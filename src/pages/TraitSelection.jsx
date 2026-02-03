import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Warning, CheckCircle, TrendingUp } from '@mui/icons-material';

function TraitSelection() {
  const navigate = useNavigate();
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('focusAreas');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 5) {
          setFocusAreas(parsed);
          return;
        }
      } catch {
        // fall through to error
      }
    }
    setLoadError('Focus areas not found. Please generate your summary first.');
  }, []);

  const handleTraitToggle = (traitId) => {
    setSelectedTraits((prev) => {
      if (prev.includes(traitId)) {
        return prev.filter((id) => id !== traitId);
      } else if (prev.length < 3) {
        return [...prev, traitId];
      }
      return prev;
    });
  };

  const handleContinue = () => {
    if (selectedTraits.length !== 3) {
      return;
    }
    // Store selected traits and navigate to campaign builder
    localStorage.setItem('selectedTraits', JSON.stringify(selectedTraits));
    navigate('/campaign-builder');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0)',
        },
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
        },
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
          width: '100vw',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 880 }}>
        <Stack spacing={4} sx={{ width: '100%' }}>
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontWeight: 700,
                color: 'white',
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Choose Your Focus Areas
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.2rem',
                color: 'rgba(255,255,255,0.9)',
                mb: 1,
                textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              Based on your reflection, we've identified five subtraits where focused growth could have the greatest impact.
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.9)',
                fontStyle: 'italic',
                textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              Select exactly 3 traits you'd like to focus on in your leadership development journey.
            </Typography>
          </Box>

          {/* Selection Counter */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: selectedTraits.length === 3 ? 'success.main' : 'rgba(255,255,255,0.9)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              {selectedTraits.length} of 3 selected
            </Typography>
          </Box>

          {/* Trait Focus Bars */}
          <Stack spacing={2}>
            {focusAreas.map((focusArea) => {
              const isSelected = selectedTraits.includes(focusArea.id);
              const isDisabled = !isSelected && selectedTraits.length >= 3;

              return (
                <Paper
                  key={focusArea.id}
                  onClick={() => !isDisabled && handleTraitToggle(focusArea.id)}
                  sx={{
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    border: isSelected ? '2px solid #2d4a5a' : '2px solid rgba(255,255,255,0.2)',
                    borderRadius: 3,
                    boxShadow: isSelected
                      ? '0 8px 24px rgba(45,74,90,0.35)'
                      : '0 4px 16px rgba(0,0,0,0.12)',
                    bgcolor: isSelected
                      ? 'rgba(255,255,255,0.98)'
                      : 'rgba(255,255,255,0.95)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,245,255,0.95))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: isDisabled ? 'none' : 'translateY(-3px)',
                      boxShadow: isDisabled
                        ? '0 4px 16px rgba(0,0,0,0.1)'
                        : '0 12px 32px rgba(45,74,90,0.25)',
                      borderColor: isDisabled ? 'rgba(255,255,255,0.2)' : (isSelected ? '#2d4a5a' : '#E07A3F'),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'stretch', minHeight: '140px' }}>
                    {/* Trait */}
                    <Box
                      sx={{
                        width: '33.33%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        p: 2.5,
                        borderRight: '2px solid',
                        borderColor: 'divider',
                        bgcolor: isSelected ? 'rgba(224,122,63,0.05)' : 'transparent',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'primary.main',
                          lineHeight: 1.3,
                          mb: 0.5,
                        }}
                      >
                        {focusArea.traitName}
                      </Typography>
                      {focusArea.traitDefinition && (
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.75rem',
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            lineHeight: 1.2,
                          }}
                        >
                          {focusArea.traitDefinition}
                        </Typography>
                      )}
                    </Box>

                    {/* Subtrait */}
                    <Box
                      sx={{
                        width: '33.33%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        p: 2.5,
                        borderRight: '2px solid',
                        borderColor: 'divider',
                        bgcolor: isSelected ? 'rgba(99,147,170,0.05)' : 'transparent',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: 'secondary.main',
                          lineHeight: 1.3,
                          mb: 0.5,
                        }}
                      >
                        {focusArea.subTraitName}
                      </Typography>
                      {focusArea.subTraitDefinition && (
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.7rem',
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            lineHeight: 1.2,
                          }}
                        >
                          {focusArea.subTraitDefinition}
                        </Typography>
                      )}
                    </Box>

                    {/* Example/Risk or Impact */}
                    {isSelected ? (
                      <Box
                        sx={{
                          width: '33.33%',
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          bgcolor: '#457089',
                          background: 'linear-gradient(135deg, #457089, #375d78)',
                        }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                          <TrendingUp sx={{ color: 'white', fontSize: 16 }} />
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'white',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Impact
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.75rem',
                            color: 'white',
                            lineHeight: 1.4,
                          }}
                        >
                          {focusArea.impact}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box
                          sx={{
                            width: '16.67%',
                            p: 2,
                            borderRight: '1px solid',
                            borderColor: 'rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'primary.main',
                            background: 'linear-gradient(135deg, #E07A3F, #C85A2A)',
                          }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                            <Lightbulb sx={{ color: 'white', fontSize: 16 }} />
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              Example
                            </Typography>
                          </Stack>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.75rem',
                              color: 'white',
                              lineHeight: 1.4,
                            }}
                          >
                            {focusArea.example}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: '16.67%',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'warning.main',
                            background: 'linear-gradient(135deg, #ED6C02, #D84315)',
                          }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                            <Warning sx={{ color: 'white', fontSize: 16 }} />
                            <Typography
                              sx={{
                                fontFamily: 'Gemunu Libre, sans-serif',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              Risk
                            </Typography>
                          </Stack>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.75rem',
                              color: 'white',
                              lineHeight: 1.4,
                            }}
                          >
                            {focusArea.risk}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
          {loadError && (
            <Alert
              severity="warning"
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                mt: 2,
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              {loadError}
            </Alert>
          )}

          {/* Continue Button */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            {selectedTraits.length !== 3 && (
              <Alert
                severity="info"
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  mb: 2,
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Please select exactly 3 traits to continue.
              </Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleContinue}
              disabled={selectedTraits.length !== 3}
              startIcon={selectedTraits.length === 3 ? <CheckCircle /> : null}
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.1rem',
                px: 6,
                py: 1.5,
                minWidth: '250px',
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              {selectedTraits.length === 3 ? 'Build My Growth Campaign' : `Select ${3 - selectedTraits.length} more`}
            </Button>
          </Box>
        </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default TraitSelection;

