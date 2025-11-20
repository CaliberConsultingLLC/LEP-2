import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Typography } from '@mui/material';
import Home from './pages/Home';
import IntakeForm from './pages/IntakeForm';
import Summary from './pages/Summary';
import CampaignIntro from './pages/CampaignIntro';
import CampaignBuilder from './pages/CampaignBuilder';
import CampaignVerify from './pages/CampaignVerify';
import NewCampaignIntro from './pages/NewCampaignIntro';
import CampaignSurvey from './pages/CampaignSurvey';
import CampaignComplete from './pages/CampaignComplete';
import Dashboard from './pages/Dashboard';
import DevSkipOne from './pages/DevSkipOne';
import DevSkipTwo from './pages/DevSkipTwo'

function App() {
  return (
    <Router>
      <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/form" element={<IntakeForm />} />
  <Route path="/summary" element={<Summary />} />
  <Route path="/campaign-intro" element={<CampaignIntro />} />
  <Route path="/campaign-builder" element={<CampaignBuilder />} />
  <Route path="/campaign-verify" element={<CampaignVerify />} />
  <Route path="/campaign/:id" element={<NewCampaignIntro />} />
  <Route path="/campaign/:id/survey" element={<CampaignSurvey />} />
  <Route path="/campaign/:id/complete" element={<CampaignComplete />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/dev-skip-1" element={<DevSkipOne />} />
  <Route path="/dev-skip-two" element={<DevSkipTwo />} />
 

  <Route path="*" element={<Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>No match found</Typography>} />
</Routes>
    </Router>
  );
}

export default App;