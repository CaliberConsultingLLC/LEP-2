import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import JourneyChapterCeremony from './JourneyChapterCeremony';
import {
  getJourneyIndexForLocation,
  matchFlowHandoff,
  readJourneyJson,
} from '../pages/Dashboard/journey/journeyModel.js';

const SEEN_KEY = 'journeyCeremonySeen';

const SIGNAL_TABS = ['signal', 'signals', 'campaign-results', 'results'];
const PRACTICE_TABS = ['practice', 'growth-plan', 'plan'];

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
  } catch {
    return {};
  }
}

function markSeen(key) {
  if (key == null) return;
  try {
    const next = { ...readSeen(), [key]: true };
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function tabFromSearch(search) {
  return String(new URLSearchParams(search || '').get('tab') || '').trim().toLowerCase();
}

export default function JourneyCeremonyGate() {
  const location = useLocation();
  const [ceremony, setCeremony] = useState(null);
  const currentIndex = useMemo(
    () => getJourneyIndexForLocation(location.pathname, location.search),
    [location.pathname, location.search]
  );
  const previousIndex = useRef(currentIndex);
  const previousTab = useRef(null);
  const previousPath = useRef(location.pathname || '');
  const suppressInitialFlow = useRef(true);
  const ceremonyOpenRef = useRef(false);
  const userInfo = readJourneyJson('userInfo', {});
  const firstName = String(userInfo?.name || '').trim().split(/\s+/)[0] || '';

  useEffect(() => {
    const path = location.pathname || '';
    const tab = tabFromSearch(location.search);
    const seen = readSeen();
    const fromIndex = previousIndex.current;
    const prevTab = previousTab.current;
    const prevPath = previousPath.current;
    let nextCeremony = null;

    // First paint after load/refresh: remember location, don't popup mid-page.
    if (suppressInitialFlow.current) {
      suppressInitialFlow.current = false;
      previousIndex.current = currentIndex;
      previousTab.current = tab;
      previousPath.current = path;
      return;
    }

    const intraChapter = matchFlowHandoff(prevPath, path);
    if (intraChapter && !seen[intraChapter.id] && !ceremonyOpenRef.current) {
      nextCeremony = {
        fromIndex: intraChapter.fromIndex,
        toIndex: intraChapter.toIndex,
        seenKey: intraChapter.id,
        skipWalk: true,
        copy: {
          fromLabel: intraChapter.fromLabel,
          completeBlurb: intraChapter.completeBlurb,
          toLabel: intraChapter.toLabel,
          blurb: intraChapter.blurb,
          arriveHint: intraChapter.arriveHint,
        },
        key: `${intraChapter.id}-${Date.now()}`,
      };
    } else if (path.startsWith('/dashboard')) {
      // Ch5: first enter Signal (accept legacy tab aliases used by nav / staging panel).
      const enteredSignal = SIGNAL_TABS.includes(tab) && !SIGNAL_TABS.includes(prevTab);
      if (enteredSignal && !seen[4] && !ceremonyOpenRef.current) {
        nextCeremony = { fromIndex: 3, toIndex: 4, seenKey: 4, key: `3-4-${Date.now()}` };
      }
      // Ch6: first enter Practice.
      const enteredPractice = PRACTICE_TABS.includes(tab) && !PRACTICE_TABS.includes(prevTab);
      if (enteredPractice && !seen[5] && !ceremonyOpenRef.current && !nextCeremony) {
        nextCeremony = { fromIndex: 4, toIndex: 5, seenKey: 5, key: `4-5-${Date.now()}` };
      }
    } else if (
      currentIndex > fromIndex
      && !seen[currentIndex]
      && !ceremonyOpenRef.current
    ) {
      // Flow pages: arrive at a new chapter. If the jump skipped chapters
      // (staging panel / deep link), still introduce the destination using
      // the prior station so the complete → begin card still reads cleanly.
      const ceremonyFrom = currentIndex - fromIndex === 1 ? fromIndex : currentIndex - 1;
      nextCeremony = {
        fromIndex: Math.max(0, ceremonyFrom),
        toIndex: currentIndex,
        seenKey: currentIndex,
        key: `${ceremonyFrom}-${currentIndex}-${Date.now()}`,
      };
    }

    if (nextCeremony) {
      ceremonyOpenRef.current = true;
      setCeremony(nextCeremony);
    }
    previousIndex.current = currentIndex;
    previousTab.current = tab;
    previousPath.current = path;
  }, [currentIndex, location.pathname, location.search]);

  return (
    <JourneyChapterCeremony
      key={ceremony?.key || 'idle'}
      open={Boolean(ceremony)}
      fromIndex={ceremony?.fromIndex || 0}
      toIndex={ceremony?.toIndex || 1}
      copy={ceremony?.copy || null}
      skipWalk={Boolean(ceremony?.skipWalk)}
      firstName={firstName}
      onDone={() => {
        markSeen(ceremony?.seenKey);
        ceremonyOpenRef.current = false;
        setCeremony(null);
      }}
    />
  );
}
