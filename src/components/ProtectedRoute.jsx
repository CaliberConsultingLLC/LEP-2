import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const allowDevBypass = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_BYPASS === 'true';
  const isDevBypass = allowDevBypass && params.get('dev') === '1';

  if (isDevBypass) {
    return children;
  }

  const sessionRaw = localStorage.getItem('dashboardSession');
  let hasSession = false;

  try {
    const parsed = sessionRaw ? JSON.parse(sessionRaw) : null;
    hasSession = Boolean(parsed?.active);
  } catch {
    hasSession = false;
  }

  if (!hasSession) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  const selfCompleted = localStorage.getItem('selfCampaignCompleted') === 'true';
  if (!selfCompleted && location.pathname === '/dashboard') {
    return <Navigate to="/campaign-verify" replace />;
  }

  return children;
}

export default ProtectedRoute;
