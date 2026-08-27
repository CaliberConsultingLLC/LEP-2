/**
 * Every guide portrait in the running app comes from /public/Guide Images/.
 * Do not point at /guides, /hero, or /landing/alt for owl art.
 */

const PREFIX = {
  mentor: 'Mentor',
  catalyst: 'Catalyst',
  challenger: 'Challenger',
  bestFriend: 'BestFriend',
  mother: 'Mother',
  roaster: 'Roaster',
};

const MAX_INDEX = {
  mentor: 6,
  catalyst: 7,
  challenger: 6,
  bestFriend: 7,
  mother: 8,
  roaster: 8,
};

/** Pose names used in overlay copy → numbered file in Guide Images. */
const POSE_INDEX = {
  idle: 1,
  greet: 1,
  think: 2,
  read: 2,
  page: 3,
  map: 3,
  lantern: 3,
  point: 4,
  pointUp: 4,
  plain: 4,
  armsCross: 5,
  sign: 5,
  mad: 5,
};

function padded(n) {
  return String(n).padStart(2, '0');
}

export function guideImage(guideId, pose = 'idle') {
  const id = PREFIX[guideId] ? guideId : 'mentor';
  const prefix = PREFIX[id];
  const max = MAX_INDEX[id] || 1;
  let index = POSE_INDEX[pose] || 1;
  if (index > max) index = 1;
  return `/Guide%20Images/${prefix}_${padded(index)}.png`;
}

export function guidePoses(guideId) {
  return {
    idle: guideImage(guideId, 'idle'),
    greet: guideImage(guideId, 'greet'),
    think: guideImage(guideId, 'think'),
    read: guideImage(guideId, 'read'),
    page: guideImage(guideId, 'page'),
    map: guideImage(guideId, 'map'),
    lantern: guideImage(guideId, 'lantern'),
    point: guideImage(guideId, 'point'),
    pointUp: guideImage(guideId, 'pointUp'),
    plain: guideImage(guideId, 'plain'),
    armsCross: guideImage(guideId, 'armsCross'),
    sign: guideImage(guideId, 'sign'),
    mad: guideImage(guideId, 'mad'),
  };
}
