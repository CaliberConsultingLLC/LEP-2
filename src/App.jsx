import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import NotFound from './pages/NotFound';
import Home from './pages/Home';
import UserInfo from './pages/UserInfo';
import IntakeForm from './pages/IntakeForm';
import Summary from './pages/Summary';
import SummarySnapshot from './pages/SummarySnapshot';
import TraitSelection from './pages/TraitSelection';
import CampaignBuilder from './pages/CampaignBuilder';
import CampaignVerify from './pages/CampaignVerify';
import SelfAssessmentChapter from './pages/SelfAssessmentChapter';
import NewCampaignIntro from './pages/NewCampaignIntro';
import CampaignSurvey from './pages/CampaignSurvey';
import CampaignComplete from './pages/CampaignComplete';
import Dashboard from './pages/Dashboard';
import DesignSystem from './pages/DesignSystem';
import Faq from './pages/Faq';
import Documents from './pages/Documents';
import DevSkipOne from './pages/DevSkipOne';
import DevSkipTwo from './pages/DevSkipTwo'
import DevSkipAssessments from './pages/DevSkipAssessments';
import RepositoryConsole from './pages/RepositoryConsole';
import RepositoryLogin from './pages/RepositoryLogin';
import SignIn from './pages/SignIn';
import Pricing from './pages/Pricing';
import GuideSelect from './pages/GuideSelect';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import DemoStart from './pages/DemoStart';
import DemoCatalog from './pages/DemoCatalog';
import ProtectedRoute from './components/ProtectedRoute';
import DemoBanner from './components/DemoBanner';
import { showDevTools, useCairnTheme, isProductionHost } from './config/runtimeFlags';
import { GuideProvider } from './context/GuideContext';
import { StepNavProvider } from './context/StepNavContext';
import GuideOverlay from './components/GuideOverlay';
import StagingDevPanel from './components/StagingDevPanel';
import JourneyCeremonyGate from './components/JourneyCeremonyGate';
import { autoSeedIfNeeded } from './utils/stagingSeed';
import { isDemoSession } from './utils/demoMode';

const GUIDE_HIDDEN_ROUTES = ['/', '/landing', '/sign-in', '/guide-select', '/user-info', '/pay', '/pay/success', '/demo', '/demo/catalog', '/faq', '/documents'];

function RouteAwareGuide() {
  const { pathname } = useLocation();
  if (GUIDE_HIDDEN_ROUTES.includes(pathname) || pathname.startsWith('/campaign/')) return null;
  return <GuideOverlay />;
}

function DemoChrome() {
  const { pathname } = useLocation();
  const demo = isDemoSession();
  const onDemoStart = pathname === '/demo' || pathname.startsWith('/demo/');
  return (
    <>
      {demo && <DemoBanner />}
      {!demo && !onDemoStart && <StagingDevPanel />}
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/landing" element={<Home />} />
      {!isProductionHost && <Route path="/demo" element={<DemoStart />} />}
      {!isProductionHost && <Route path="/demo/catalog" element={<DemoCatalog />} />}
      <Route path="/user-info" element={<UserInfo />} />
      <Route path="/guide-select" element={<GuideSelect />} />
      <Route path="/pay" element={<Checkout />} />
      <Route path="/pay/success" element={<CheckoutSuccess />} />
      <Route path="/form" element={<IntakeForm />} />
      <Route path="/summary" element={<Summary />} />
      <Route path="/summary-static" element={<ProtectedRoute><SummarySnapshot /></ProtectedRoute>} />
      <Route path="/trait-selection" element={<TraitSelection />} />
      <Route path="/campaign-intro" element={<Navigate to="/campaign-builder" replace />} />
      <Route path="/campaign-builder" element={<CampaignBuilder />} />
      <Route path="/campaign-verify" element={<CampaignVerify />} />
      <Route path="/self-assessment" element={<SelfAssessmentChapter />} />
      <Route path="/team-assessment" element={<Navigate to="/self-assessment?step=invite" replace />} />
      <Route path="/campaign/:id" element={<NewCampaignIntro />} />
      <Route path="/campaign/:id/survey" element={<CampaignSurvey />} />
      <Route path="/campaign/:id/complete" element={<CampaignComplete />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {useCairnTheme && <Route path="/design" element={<DesignSystem />} />}
      <Route path="/faq" element={<Faq />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/pricing" element={<Pricing />} />
      {showDevTools && <Route path="/dev-skip-1" element={<DevSkipOne />} />}
      {showDevTools && <Route path="/dev-skip-two" element={<DevSkipTwo />} />}
      {showDevTools && <Route path="/dev-assessments" element={<DevSkipAssessments />} />}
      {showDevTools && <Route path="/dev-repository-login" element={<RepositoryLogin />} />}
      {showDevTools && <Route path="/dev-repository" element={<RepositoryConsole />} />}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  // GuideProvider + GuideOverlay are mounted only when the Cairn (staging)
  // skin is active. On production the tree is identical to what shipped
  // before — no provider, no overlay, no behavior change.
  if (useCairnTheme) {
    if (!isDemoSession()) autoSeedIfNeeded();
    return (
      <GuideProvider>
        <StepNavProvider>
          <Router>
            <DemoChrome />
            <AppRoutes />
            <JourneyCeremonyGate />
            <RouteAwareGuide />
          </Router>
        </StepNavProvider>
      </GuideProvider>
    );
  }
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;