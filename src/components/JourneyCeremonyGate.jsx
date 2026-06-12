import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import JourneyChapterCeremony from './JourneyChapterCeremony';
import { getJourneyIndexForLocation, readJourneyJson } from '../pages/Dashboard/journey/journeyModel.js';

export default function JourneyCeremonyGate() {
  const location = useLocation();
  const [ceremony, setCeremony] = useState(null);
  const currentIndex = useMemo(() => getJourneyIndexForLocation(location.pathname, location.search), [location.pathname, location.search]);
  const previousIndex = useRef(currentIndex);
  const suppressInitial = useRef(true);
  const userInfo = readJourneyJson('userInfo', {});
  const firstName = String(userInfo?.name || '').trim().split(/\s+/)[0] || '';

  useEffect(() => {
    if (suppressInitial.current) {
      suppressInitial.current = false;
      previousIndex.current = currentIndex;
      return;
    }
    const fromIndex = previousIndex.current;
    if (currentIndex > fromIndex && currentIndex - fromIndex <= 1) {
      setCeremony({ fromIndex, toIndex: currentIndex, key: `${fromIndex}-${currentIndex}-${Date.now()}` });
    }
    previousIndex.current = currentIndex;
  }, [currentIndex]);

  return (
    <JourneyChapterCeremony
      key={ceremony?.key || 'idle'}
      open={Boolean(ceremony)}
      fromIndex={ceremony?.fromIndex || 0}
      toIndex={ceremony?.toIndex || 1}
      firstName={firstName}
      onDone={() => setCeremony(null)}
    />
  );
}
