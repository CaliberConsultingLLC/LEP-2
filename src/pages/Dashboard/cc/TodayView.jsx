/**
 * Today, wired to the running session.
 *
 * `TodayRoom` draws; this decides what it draws. Everything that has to touch
 * storage — the plans, the journal notes, the close timestamp, the team link —
 * happens here, so the room stays a pure function of its view and the catalog
 * can hand it a fixture instead.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import TodayRoom from './TodayRoom';
import { buildTodayView, momentFor, themeForClock } from './todayRoomModel.js';
import { planComplete } from './FieldJournal.jsx';
import { readTraitNotes } from './traitRoomNotes.js';
import { deriveTraitRoles } from './debriefContent.js';
import { useGuide } from '../../../context/GuideContext';
import { lockTeamCampaignWindow } from '../../../utils/lockTeamCampaign';

const readJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * How long after the window closes the check-in opens. The product does not yet
 * store a check-in date anywhere, and this is the interval the journey copy has
 * always described, so it is the working assumption rather than a read value.
 * When a real date lands, this is the one thing to replace.
 */
const CHECK_IN_WINDOW_DAYS = 90;

// The clock picks night or day, but an explicit dark-mode toggle outranks it:
// a leader who asked the whole app for a dark room should not be handed the
// cream one at nine in the morning.
const DARK_MODE_EVENT = 'cairn-dark-mode-change';
const readDarkMode = () => {
  try {
    return localStorage.getItem('cairn_dark_mode') === 'true';
  } catch {
    return false;
  }
};

const daysUntilCheckIn = (closedAt) => {
  const closed = closedAt ? new Date(closedAt) : null;
  if (!closed || Number.isNaN(closed.getTime())) return null;
  const opensAt = closed.getTime() + CHECK_IN_WINDOW_DAYS * 86400000;
  const days = Math.ceil((opensAt - Date.now()) / 86400000);
  return days > 0 ? days : null;
};

export default function TodayView({
  onNavigate = () => {},
  campaignClosed = false,
  respondents = 0,
  invited = 0,
  rows = [],
  phases,
}) {
  const { personaId, setSuppress } = useGuide();
  const [locking, setLocking] = useState(false);
  const [dark, setDark] = useState(readDarkMode);

  useEffect(() => {
    const sync = () => setDark(readDarkMode());
    window.addEventListener(DARK_MODE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(DARK_MODE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // The guide is in the room, standing in the corner with a line of his own.
  // The overlay owl would be a second one saying something else.
  useEffect(() => {
    setSuppress(true);
    return () => setSuppress(false);
  }, [setSuppress]);

  const view = useMemo(() => {
    const userInfo = readJson('userInfo', {});
    const records = readJson('campaignRecords', {});
    const userKey = userInfo?.email || userInfo?.name || 'anonymous';
    const campaignKey = records?.bundleId || records?.teamCampaignId || records?.selfCampaignId || '123';

    const ordered = deriveTraitRoles(rows).ordered || [];
    // Evidence is walked trait by trait, so a trait counts as read once the
    // walk has passed it — or once the whole phase is marked done.
    const evidencePage = Number(phases?.pages?.evidence) || 0;
    const evidenceDone = Boolean(phases?.done?.evidence);

    const traits = ordered.map((row, i) => {
      const plan = readJson(`practiceStudio_${campaignKey}_${userKey}_${row.trait}`, null);
      const statements = row.team?.statements || [];
      const lowest = statements
        .filter((s) => String(s?.text || '').trim())
        .sort((a, b) => (a.lepScore || 0) - (b.lepScore || 0))[0];
      return {
        key: row.subTraitId || row.traitId || row.trait || `trait-${i}`,
        name: row.subTrait || row.trait || `Trait ${i + 1}`,
        team: Math.round(row.team?.lepScore || 0),
        self: Math.round(row.self?.lepScore || 0),
        read: evidenceDone || i < evidencePage,
        statement: String(lowest?.text || '').trim(),
        practice: String(plan?.branchBehavior || plan?.commitment || '').trim(),
        hasPractice: planComplete(plan),
        notes: readTraitNotes(row.trait).map((n) => n.text).filter(Boolean),
      };
    });

    const practiceCount = traits.filter((t) => t.hasPractice).length;
    const moment = momentFor({
      campaignClosed,
      evidenceRead: evidenceDone || (traits.length > 0 && traits.every((t) => t.read)),
      practiceCount,
    });

    const teamLink = records?.teamCampaignId
      ? `${window.location.origin}/campaign/${records.teamCampaignId}`.replace(/^https?:\/\//, '')
      : '';

    return buildTodayView({
      moment,
      theme: dark ? 'night' : themeForClock(),
      guideId: personaId,
      name: userInfo?.name || '',
      responded: respondents,
      invited: invited || respondents,
      teamLink,
      traits,
      daysToCheckIn: daysUntilCheckIn(records?.teamCampaignClosedAt),
    });
  }, [rows, phases?.pages?.evidence, phases?.done?.evidence, campaignClosed, respondents, invited, personaId, dark]);

  const lockIn = async () => {
    if (locking) return;
    setLocking(true);
    try {
      await lockTeamCampaignWindow();
      onNavigate('signal');
    } catch {
      // The window stays open and the leader stays on Today. `lockTeamCampaign`
      // already surfaces the reason; re-navigating would hide it.
    } finally {
      setLocking(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      <TodayRoom view={view} onLockIn={lockIn} onNavigate={onNavigate} />
    </Box>
  );
}
