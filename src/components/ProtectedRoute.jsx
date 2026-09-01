import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { allowAuthBypass, allowDevBypass } from '../config/runtimeFlags';
import { isDemoSession } from '../utils/demoMode';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isDevBypass = allowDevBypass && params.get('dev') === '1';
  const [authResolved, setAuthResolved] = useState(false);
  const [hasFirebaseUser, setHasFirebaseUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setHasFirebaseUser(Boolean(user));
      setAuthResolved(true);
    });

    return () => unsubscribe();
  }, []);

  if (isDevBypass || allowAuthBypass || isDemoSession()) {
    return children;
  }

  if (!authResolved) {
    return null;
  }

  if (!hasFirebaseUser) {
    return <Navigate to="/sign-in" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
}

export default ProtectedRoute;
