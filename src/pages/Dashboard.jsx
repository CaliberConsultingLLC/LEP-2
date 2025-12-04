import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import ResultsTab from './Dashboard/ResultsTab';
import ActionTab from './Dashboard/ActionTab';
import JourneyTab from './Dashboard/JourneyTab';

function Dashboard() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

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
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
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

        {/* Tabs */}
        <Box sx={{ 
          mb: 4,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-root': {
            borderBottom: '2px solid rgba(224,122,63,0.3)',
          },
          '& .MuiTab-root': {
            fontFamily: 'Gemunu Libre, sans-serif',
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main',
              fontWeight: 700,
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: 'primary.main',
            height: 3,
          },
        }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
            }}
          >
            <Tab label="Results" />
            <Tab label="Action" />
            <Tab label="Journey" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 4 }}>
          {currentTab === 0 && <ResultsTab />}
          {currentTab === 1 && <ActionTab />}
          {currentTab === 2 && <JourneyTab />}
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;
