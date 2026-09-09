// /revisit/intake — the sealed intake, read back, with a way home.
//
// The journey map's Revisit pill on "Recorded your leadership instincts" used
// to point at /form. That works, in the sense that a locked intake draws the
// sealed ledger — but it mounts the whole intake: the autosave, the Firestore
// writes, the entitlement gate, the step machinery, and a terminal button that
// hands the reader on to their reflection. None of that belongs in a look
// back, and the last of it actively takes them somewhere they did not ask to
// go.
//
// So this page mounts the ledger and nothing else. ReviewAndLock is the same
// component the intake's last step renders, given the same four inputs, and
// the questions come from the same INTAKE_BEHAVIOR_SET the form asks them
// from — so what a leader reads here is what they read the day they locked it,
// and it cannot drift, because there is only one copy of it.
//
// The answers are read from localStorage first and hydrated from Firestore
// when the local copy is empty, which is the case on a browser this account
// has never signed in on before.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ProcessTopRail from '../../components/ProcessTopRail';
import CompassLayout from '../../components/CompassLayout';
import ReviewAndLock from '../IntakeForm/ReviewAndLock';
import { INTAKE_BEHAVIOR_SET } from '../../data/intakeBehaviorSet';
import { SOCIETAL_NORM_DISPLAY_TEMPLATES } from '../../data/intakeContext';
import { auth, db } from '../../firebase';
import { colors, fonts, type } from '../../styles/tokens';
import { RevisitBar, useBaseCampReturn } from './RevisitShell';

const parseJson = (raw, fallback = null) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

/** The three things the ledger needs, pulled out of a stored draft. */
function readDraft() {
  const draft = parseJson(localStorage.getItem('intakeDraft'), null);
  const latest = parseJson(localStorage.getItem('latestFormData'), null);
  const status = parseJson(localStorage.getItem('intakeStatus'), null);
  const formData = draft?.formData || latest || null;
  if (!formData) return null;
  return {
    formData,
    societalResponses: Array.isArray(draft?.societalResponses)
      ? draft.societalResponses
      : Array.isArray(latest?.societalResponses)
        ? latest.societalResponses
        : Array(10).fill(null),
    // The lock stamp rides inside the draft for the UI; intakeStatus carries
    // the last write either way, and one of the two is always there for an
    // intake that got far enough to be worth revisiting.
    lockedAt: String(draft?.intakeLock?.lockedAt || status?.updatedAt || ''),
  };
}

export default function RevisitIntake() {
  const goBase = useBaseCampReturn();
  const [record, setRecord] = useState(() => readDraft());
  const [hydrating, setHydrating] = useState(() => !readDraft());

  // Only reached when nothing is stored locally — a fresh browser, or storage
  // that has been cleared since the intake was locked.
  useEffect(() => {
    if (record) return undefined;
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.uid) {
        if (active) setHydrating(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'responses', user.uid));
        if (!active) return;
        const payload = snap.exists() ? snap.data() || {} : {};
        if (payload?.intakeDraft) {
          localStorage.setItem('intakeDraft', JSON.stringify(payload.intakeDraft));
        }
        if (payload?.latestFormData) {
          localStorage.setItem('latestFormData', JSON.stringify(payload.latestFormData));
        }
        if (payload?.intakeStatus) {
          localStorage.setItem('intakeStatus', JSON.stringify(payload.intakeStatus));
        }
        setRecord(readDraft());
      } catch (err) {
        console.warn('Unable to load the saved intake:', err);
      } finally {
        if (active) setHydrating(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [record]);

  const lockedDisplay = useMemo(() => {
    if (!record?.lockedAt) return '';
    const d = new Date(record.lockedAt);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [record]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100svh',
        width: '100%',
        overflowX: 'hidden',
        bgcolor: 'var(--sand-50, #FBF7F0)',
      }}
    >
      {/* Utility bar only — no chapter rail.
          The rail's three steps for Chapter II are Habits, Insights and Review
          & Lock, and every one of them navigates into the live /form. On a page
          whose whole point is that it is not the live form, that is a trapdoor:
          one click and the reader is back inside the intake machinery with a
          terminal button that hands them on to their reflection. The chapter
          this belongs to is named in the bar below instead, where it is a label
          rather than a door. */}
      <ProcessTopRail utilityOnly />

      <CompassLayout>
        <RevisitBar
          label="Chapter II · Your intake"
          note={
            lockedDisplay
              ? `Locked ${lockedDisplay}. Nothing on this page is live — it is the record of what you answered.`
              : 'Nothing on this page is live — it is the record of what you answered.'
          }
        />

        {record ? (
          <ReviewAndLock
            formData={record.formData}
            societalResponses={record.societalResponses}
            behaviorSet={INTAKE_BEHAVIOR_SET}
            societalNormsQuestions={SOCIETAL_NORM_DISPLAY_TEMPLATES}
            onEdit={() => {}}
            onLock={goBase}
            locked
            lockedAt={record.lockedAt}
            revisit
            exitLabel="Back to Base Camp"
          />
        ) : (
          <Box sx={{ maxWidth: 620, mx: 'auto', textAlign: 'center', py: '48px' }}>
            <Typography sx={{ ...type.pageTitle, mb: '10px' }}>
              {hydrating ? 'Finding your intake…' : 'No intake on record here.'}
            </Typography>
            <Typography sx={{ fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 1.65, color: colors.inkSoft }}>
              {hydrating
                ? 'One moment — reading it back from your account.'
                : 'Nothing was saved against this account, or it was cleared from this browser. Base Camp will still have everything built from it.'}
            </Typography>
          </Box>
        )}
      </CompassLayout>
    </Box>
  );
}
