import { deleteField, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const TEAM_WINDOW_CHANGED_EVENT = 'compass-team-window-changed';
export const LOCK_CONFIRM_PHRASE = 'Finalize Assessment';

function parseRecords() {
  try {
    return JSON.parse(localStorage.getItem('campaignRecords') || '{}');
  } catch {
    return {};
  }
}

export function parseExpectedTeamCount(raw) {
  if (raw == null || raw === '') return 8;
  const direct = Number(raw);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const plus = String(raw).trim().match(/^(\d+)\s*\+/);
  if (plus) return Number(plus[1]);
  const range = String(raw).match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return Number(range[1]);
  return 8;
}

function emitWindowChanged() {
  try {
    window.dispatchEvent(new Event(TEAM_WINDOW_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export async function lockTeamCampaignWindow() {
  const records = parseRecords();
  const teamCampaignId = String(records?.teamCampaignId || '').trim();
  const closedAt = new Date().toISOString();
  const nextRecords = {
    ...records,
    teamCampaignClosed: true,
    teamCampaignClosedAt: closedAt,
  };
  localStorage.setItem('campaignRecords', JSON.stringify(nextRecords));
  localStorage.setItem('teamCampaignCompleted', 'true');
  emitWindowChanged();

  const ownerUid = String(auth?.currentUser?.uid || '').trim();
  if (!ownerUid || !teamCampaignId) return nextRecords;

  await setDoc(
    doc(db, 'responses', ownerUid),
    {
      ownerUid,
      campaignBundle: {
        campaignRecords: {
          teamCampaignId,
          teamCampaignClosed: true,
          teamCampaignClosedAt: closedAt,
        },
        savedAt: closedAt,
      },
    },
    { merge: true }
  );
  await setDoc(
    doc(db, 'campaigns', teamCampaignId),
    {
      surveyClosed: true,
      surveyClosedAt: closedAt,
    },
    { merge: true }
  );
  return nextRecords;
}

export async function reopenTeamCampaignWindow() {
  const records = parseRecords();
  const teamCampaignId = String(records?.teamCampaignId || '').trim();
  const reopenedAt = new Date().toISOString();
  const nextRecords = { ...records, teamCampaignClosed: false };
  delete nextRecords.teamCampaignClosedAt;
  localStorage.setItem('campaignRecords', JSON.stringify(nextRecords));
  localStorage.setItem('teamCampaignCompleted', 'false');
  emitWindowChanged();

  const ownerUid = String(auth?.currentUser?.uid || '').trim();
  if (!ownerUid || !teamCampaignId) return nextRecords;

  await setDoc(
    doc(db, 'responses', ownerUid),
    {
      ownerUid,
      campaignBundle: {
        campaignRecords: {
          teamCampaignId,
          teamCampaignClosed: false,
          teamCampaignClosedAt: deleteField(),
        },
        savedAt: reopenedAt,
      },
    },
    { merge: true }
  );
  await setDoc(
    doc(db, 'campaigns', teamCampaignId),
    {
      surveyClosed: false,
      surveyClosedAt: deleteField(),
    },
    { merge: true }
  );
  return nextRecords;
}
