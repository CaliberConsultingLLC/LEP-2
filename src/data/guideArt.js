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

/**
 * Pose names in the copy → numbered file in Guide Images.
 *
 * Twelve pose names used to collapse into five slots, so every guide's images
 * beyond _05 were unreachable — twelve of the forty-two files could not be
 * requested by any page. They are now spread across eight.
 *
 * Slots are ordered by how often each pose is actually asked for, because
 * every guide has at least six images but only Mother and Roaster have eight.
 * Putting the common poses low means the wrap below costs the least-used ones.
 *
 * Slots 1-5 keep their existing art direction. 6-8 are an even distribution,
 * not a reading of what each picture shows — Mother_06 is a wing-out gesture
 * and Roaster_07 is a wings-spread laugh, so the art supports finer assignment
 * than this once someone has looked at all forty-two.
 */
const POSE_INDEX = {
  idle: 1,
  greet: 1,
  armsCross: 2,
  point: 3,
  pointUp: 3,
  sign: 4,
  lantern: 5,
  think: 6,
  read: 6,
  page: 7,
  map: 7,
  plain: 8,
};

function padded(n) {
  return String(n).padStart(2, '0');
}

export function guideImage(guideId, pose = 'idle') {
  const id = PREFIX[guideId] ? guideId : 'mentor';
  const prefix = PREFIX[id];
  const max = MAX_INDEX[id] || 1;
  const slot = POSE_INDEX[pose] || 1;
  // Wrap rather than fall back to 1. A guide with six images asked for slot 7
  // used to show its idle pose; now it shows a different one, so the guide
  // still changes when the copy says it should.
  const index = ((slot - 1) % max) + 1;
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
