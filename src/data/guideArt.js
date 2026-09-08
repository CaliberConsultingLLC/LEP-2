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

/**
 * The poses, and the file is named after the pose.
 *
 * This was a table of numbered slots: a pose mapped to an index, and the index
 * wrapped by however many files that guide happened to have. Two things came
 * of that. A guide with six pictures asked for slot seven got a different pose
 * than the copy had asked for — silently, and differently per guide, because
 * they had between six and eight files each. And twelve of the forty-two files
 * could not be reached from any page at all, because no slot ever landed on
 * them.
 *
 * The September 2026 drop is thirteen deliberate poses for each of the six, so
 * there is nothing left to wrap and nothing to look up: the pose IS the
 * filename. A name that is not one of these falls back to idle, which is the
 * only case left where the picture is not the one that was asked for.
 *
 * Where a set had no art for a pose the nearest one in character stands in —
 * Mother has no lantern, map or sign; Roaster has no plain, think or open
 * book. scripts/guide-set-map.json records exactly which those are, so a later
 * drop can replace the stand-ins without anyone having to work out which
 * pictures were doing double duty.
 */
const POSES = new Set([
  'idle', 'plain', 'armsCross', 'point', 'pointUp', 'sign',
  'lantern', 'think', 'read', 'page', 'map', 'greet', 'mad',
]);

export function guideImage(guideId, pose = 'idle') {
  const id = PREFIX[guideId] ? guideId : 'mentor';
  const name = POSES.has(pose) ? pose : 'idle';
  // WebP, because the set this replaced was 72MB of PNG for art that is never
  // drawn larger than about 700 CSS pixels. The same pictures are 11.8MB here.
  return `/Guide%20Images/${PREFIX[id]}_${name}.webp`;
}

export function guidePoses(guideId) {
  const out = {};
  POSES.forEach((pose) => { out[pose] = guideImage(guideId, pose); });
  return out;
}

export const GUIDE_POSE_NAMES = [...POSES];
