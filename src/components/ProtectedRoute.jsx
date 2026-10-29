import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { allowAuthBypass, allowDevBypass } from '../config/runtimeFlags';
import { isDemoSession } from '../utils/demoMode';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { hydrateProgress, stopProgressSync } from '../utils/progressSync';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isDevBypass = allowDevBypass && params.get('dev') === '1';
  const [authResolved, setAuthResolved] = useState(false);
  const [hasFirebaseUser, setHasFirebaseUser] = useState(false);
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setHasFirebaseUser(Boolean(user));
      if (user) {
        // Pull the leader's saved progress down before any screen reads it.
        // Never hold the page more than a few seconds if Firebase is slow.
        await Promise.race([
          hydrateProgress(user.uid),
          new Promise((resolve) => { window.setTimeout(resolve, 5000); }),
        ]);
      } else {
        stopProgressSync();
      }
      setProgressReady(true);
      setAuthResolved(true);
    });

    return () => unsubscribe();
  }, []);

  if (isDevBypass || allowAuthBypass || isDemoSession()) {
    return children;
  }

  if (!authResolved || !progressReady) {
    return null;
  }

  if (!hasFirebaseUser) {
    return <Navigate to="/sign-in" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
}

export default ProtectedRoute;
