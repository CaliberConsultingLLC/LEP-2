import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Campaign,
  Assessment,
  Lightbulb,
  Map,
} from '@mui/icons-material';
import ResultsTab from './Dashboard/ResultsTab';
import ActionTab from './Dashboard/ActionTab';
import JourneyTab from './Dashboard/JourneyTab';
import GrowthCampaignTab from './Dashboard/GrowthCampaignTab';

function Dashboard() {
  const [currentTab, setCurrentTab] = useState(0);

  const directoryItems = [
    {
      label: 'Growth Campaign',
      description: 'Build, verify, and share your campaign',
      icon: Campaign,
    },
    {
      label: 'Campaign Results',
      description: 'Explore insights and trait analysis',
      icon: Assessment,
    },
    {
      label: 'Plan of Attack',
      description: 'Turn insights into actionable plans',
      icon: Lightbulb,
    },
    {
      label: 'Journey',
      description: 'Track milestones and progress',
      icon: Map,
    },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        py: 4,
        color: 'text.primary',
        // full bleed bg
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
        // dark overlay
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(255,255,255,0.65), rgba(0,0,0,0.35))',
        },
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
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
            Leadership Compass Dashboard
          </Typography>
          <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.1rem', color: 'text.secondary' }}>
            Your leadership journey, insights, and action plan
          </Typography>
        </Box>

        {/* Directory Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {directoryItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentTab === idx;
            return (
              <Grid item xs={12} sm={6} md={3} key={item.label}>
                <Card
                  onClick={() => setCurrentTab(idx)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,245,255,0.85))',
                    border: '1px solid',
                    borderColor: isActive ? 'primary.main' : 'rgba(224,122,63,0.25)',
                    borderRadius: 3,
                    boxShadow: isActive ? '0 10px 30px rgba(0,0,0,0.18)' : '0 6px 18px rgba(0,0,0,0.12)',
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        mx: 'auto',
                        mb: 2,
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive
                          ? 'linear-gradient(135deg, #E07A3F, #C85A2A)'
                          : 'linear-gradient(135deg, rgba(99,147,170,0.35), rgba(99,147,170,0.15))',
                        color: isActive ? 'white' : 'primary.main',
                      }}
                    >
                      <Icon />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: 'Gemunu Libre, sans-serif',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: 'text.primary',
                        mb: 1,
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'text.secondary' }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Typography
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'text.primary',
            textAlign: 'center',
            mb: 2,
          }}
        >
          {directoryItems[currentTab]?.label}
        </Typography>

        {/* Tab Content */}
        <Box sx={{ mt: 4 }}>
          {currentTab === 0 && <GrowthCampaignTab />}
          {currentTab === 1 && <ResultsTab />}
          {currentTab === 2 && <ActionTab />}
          {currentTab === 3 && <JourneyTab />}
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;
