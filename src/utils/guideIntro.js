// Whether a room's interruption has already been given.
//
// An interruption is the guide stepping in front of the page to orient someone
// to a step they have not taken yet. That is a first-visit job. Read a second
// time it is not orientation, it is a door you have to close before you can get
// back to work, so each one is spent once and then gone for good.
//
// The mark is per person: it survives leaving the page, the tab, and the
// session. In a demo session localStorage is already redirected into
// sessionStorage, so a demo gets its interruption back with every fresh run
// without this file having to know that.

const key = (id) => `guideIntroSeen_${id}`;

export function hasSeenIntro(id) {
  if (!id) return false;
  try {
    return localStorage.getItem(key(id)) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen(id) {
  if (!id) return;
  try {
    localStorage.setItem(key(id), '1');
  } catch {
    /* storage unavailable — the interruption comes back, which is the safe miss */
  }
}
