import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();
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

  return children;
}

export default ProtectedRoute;
