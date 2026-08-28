import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import JourneyChapterCeremony from './JourneyChapterCeremony';
import {
  CHAPTER_TOTAL_ROMAN,
  chapterById,
  chapterIndexOf,
  resolveFromLocation,
  stationIndexForChapter,
} from '../data/chapterMap';

const SEEN_KEY = 'journeyCeremonySeen';

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

/**
 * Chapter popups fire only when chapterId changes (complete previous → begin next).
 * Tab changes inside a chapter stay quiet.
 */
export default function JourneyCeremonyGate() {
  const location = useLocation();
  const [ceremony, setCeremony] = useState(null);
  const previousChapterId = useRef(null);
  const suppressInitialFlow = useRef(true);
  const ceremonyOpenRef = useRef(false);

  useEffect(() => {
    const current = resolveFromLocation(location.pathname, location.search);
    const seen = readSeen();
    const prevId = previousChapterId.current;

    if (suppressInitialFlow.current) {
      suppressInitialFlow.current = false;
      previousChapterId.current = current?.chapterId || null;
      return;
    }

    if (!current?.chapterId) {
      return;
    }

    const fromId = prevId;
    const toId = current.chapterId;
    previousChapterId.current = toId;

    if (!fromId || fromId === toId) return;

    const fromChapterIndex = chapterIndexOf(fromId);
    const toChapterIndex = chapterIndexOf(toId);
    if (toChapterIndex <= fromChapterIndex) return;
    if (seen[toId] || ceremonyOpenRef.current) return;

    const fromChapter = chapterById(fromId);
    const toChapter = chapterById(toId);
    const fromStationIndex = stationIndexForChapter(fromId);
    const toStationIndex = stationIndexForChapter(toId);
    ceremonyOpenRef.current = true;
    try { sessionStorage.setItem('journeyCeremonyOpen', '1'); } catch { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('compass:journey-ceremony-start')); } catch { /* ignore */ }
    setCeremony({
      fromIndex: fromStationIndex,
      toIndex: toStationIndex,
      skipWalk: fromStationIndex === toStationIndex,
      seenKey: toId,
      copy: {
        fromLabel: fromChapter?.name || 'Previous chapter',
        toLabel: toChapter?.name || 'Next chapter',
        toChapterId: toId,
        fromNum: fromChapter?.num,
        toNum: toChapter?.num,
        totalRoman: CHAPTER_TOTAL_ROMAN,
      },
      key: `${fromId}-${toId}-${Date.now()}`,
    });
  }, [location.pathname, location.search]);

  return (
    <JourneyChapterCeremony
      key={ceremony?.key || 'idle'}
      open={Boolean(ceremony)}
      fromIndex={ceremony?.fromIndex || 0}
      toIndex={ceremony?.toIndex || 1}
      copy={ceremony?.copy || null}
      skipWalk={Boolean(ceremony?.skipWalk)}
      onDone={() => {
        markSeen(ceremony?.seenKey);
        ceremonyOpenRef.current = false;
        try { sessionStorage.removeItem('journeyCeremonyOpen'); } catch { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('compass:journey-ceremony-done')); } catch { /* ignore */ }
        setCeremony(null);
      }}
    />
  );
}
