import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Typography } from '@mui/material';
import Home from './pages/Home';
import Landing from './pages/Landing';
import UserInfo from './pages/UserInfo';
import IntakeForm from './pages/IntakeForm';
import Summary from './pages/Summary';
import TraitSelection from './pages/TraitSelection';
import CampaignIntro from './pages/CampaignIntro';
import CampaignBuilder from './pages/CampaignBuilder';
import CampaignVerify from './pages/CampaignVerify';
import NewCampaignIntro from './pages/NewCampaignIntro';
import CampaignSurvey from './pages/CampaignSurvey';
import CampaignComplete from './pages/CampaignComplete';
import Dashboard from './pages/Dashboard';
import Faq from './pages/Faq';
import DevSkipOne from './pages/DevSkipOne';
import DevSkipTwo from './pages/DevSkipTwo'
import DevSkipAssessments from './pages/DevSkipAssessments';
import SignIn from './pages/SignIn';
import ProtectedRoute from './components/ProtectedRoute';
import { showDevTools } from './config/runtimeFlags';

function App() {
  return (
    <Router>
      <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/landing" element={<Landing />} />
  <Route path="/user-info" element={<UserInfo />} />
  <Route path="/form" element={<IntakeForm />} />
  <Route path="/summary" element={<Summary />} />
  <Route path="/trait-selection" element={<TraitSelection />} />
  <Route path="/campaign-intro" element={<CampaignIntro />} />
  <Route path="/campaign-builder" element={<CampaignBuilder />} />
  <Route path="/campaign-verify" element={<CampaignVerify />} />
  <Route path="/campaign/:id" element={<NewCampaignIntro />} />
  <Route path="/campaign/:id/survey" element={<CampaignSurvey />} />
  <Route path="/campaign/:id/complete" element={<CampaignComplete />} />
  <Route path="/sign-in" element={<SignIn />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/faq" element={<Faq />} />
  {showDevTools && <Route path="/dev-skip-1" element={<DevSkipOne />} />}
  {showDevTools && <Route path="/dev-skip-two" element={<DevSkipTwo />} />}
  {showDevTools && <Route path="/dev-assessments" element={<DevSkipAssessments />} />}
 

  <Route path="*" element={<Typography sx={{ fontFamily: 'Montserrat, sans-serif' }}>No match found</Typography>} />
</Routes>
    </Router>
  );
}

export default App;