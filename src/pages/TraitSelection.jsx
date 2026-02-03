import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Checkbox,
  Grid,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Warning, CheckCircle } from '@mui/icons-material';

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
        p: 5,
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.6)), url(/LEP2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ width: '100%', maxWidth: '900px', mx: 'auto' }}>
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              Choose Your Focus Areas
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.2rem',
                color: 'text.secondary',
                mb: 1,
              }}
            >
              Based on your reflection, we've identified five subtraits where focused growth could have the greatest impact.
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1rem',
                color: 'text.secondary',
                fontStyle: 'italic',
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
                color: selectedTraits.length === 3 ? 'success.main' : 'text.primary',
              }}
            >
              {selectedTraits.length} of 3 selected
            </Typography>
          </Box>

          {/* Trait Cards */}
          <Grid container spacing={3}>
            {focusAreas.map((trait) => {
              const isSelected = selectedTraits.includes(trait.id);
              const isDisabled = !isSelected && selectedTraits.length >= 3;

              return (
                <Grid item xs={12} md={6} key={trait.id}>
                  <Card
                    sx={{
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      border: isSelected ? '3px solid' : '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderRadius: 3,
                      boxShadow: isSelected ? 8 : 2,
                      bgcolor: isSelected
                        ? 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.95))'
                        : 'rgba(255, 255, 255, 0.95)',
                      background: isSelected
                        ? 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,245,255,0.95))'
                        : 'rgba(255, 255, 255, 0.95)',
                      opacity: isDisabled ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: isDisabled ? 'none' : 'translateY(-4px)',
                        boxShadow: isDisabled ? 2 : 6,
                      },
                    }}
                    onClick={() => !isDisabled && handleTraitToggle(trait.id)}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          sx={{
                            color: 'primary.main',
                            '&.Mui-checked': {
                              color: 'primary.main',
                            },
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontWeight: 700,
                              color: 'text.primary',
                              mb: 1.5,
                            }}
                          >
                            {trait.traitName}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              color: 'secondary.main',
                              mb: 0.5,
                            }}
                          >
                            {trait.subTraitName}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Lightbulb sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              color: 'text.primary',
                            }}
                          >
                            Example in Action:
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.9rem',
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            pl: 4,
                          }}
                        >
                          {trait.example}
                        </Typography>
                      </Box>

                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Warning sx={{ color: 'warning.main', fontSize: 20 }} />
                          <Typography
                            sx={{
                              fontFamily: 'Gemunu Libre, sans-serif',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              color: 'text.primary',
                            }}
                          >
                            Risk of Not Improving:
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            fontSize: '0.9rem',
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            pl: 4,
                          }}
                        >
                          {trait.risk}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
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
      </Container>
    </Box>
  );
}

export default TraitSelection;

