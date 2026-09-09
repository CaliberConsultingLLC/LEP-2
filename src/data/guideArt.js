/**
 * Every guide portrait in the running app comes from /public/Guide Images/.
 * Do not point at /guides, /hero, or /landing/alt for owl art.
 */

import { getGuideAnchor } from './guideAnchors.generated';

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

/**
 * When a pose cannot be stood in a corner, the nearest one that can.
 *
 * The guide always stands in a corner of the window with the branch behind
 * it — bottom-right normally, bottom-left when the art is mirrored, which
 * flips the branch along with the bird. So the requirement is the same in both
 * cases and it is a property of the picture, not of the page: the branch has
 * to run off to the right of the art. Two of the seventy-eight do not
 * (Mentor_think, Roaster_map — both branches leave to the left), and stood in
 * the corner they draw a sawn-off stump pointing back into the page with
 * nothing under the bird on the side it is standing.
 *
 * The alternative to substituting is mirroring the odd ones, and that is
 * worse: it turns the guide around to face out of the page, and on half the
 * poses it mirrors the lettering on a sign or the hand holding a lantern.
 *
 * So the pose moves instead. Each row is ordered by what the pose is doing
 * rather than by what it looks like — think and read are both "considering
 * something", map and page are both "holding a document open" — so the
 * substitute still fits the line the guide is saying. The first one whose art
 * runs the right way wins, and if a set somehow had none the picture that was
 * asked for is drawn anyway; a branch facing the wrong way is a blemish, a
 * missing guide is a hole in the page.
 */
const STAND_INS = {
  idle: ['plain', 'read', 'think'],
  plain: ['idle', 'read', 'think'],
  armsCross: ['mad', 'sign', 'idle'],
  point: ['pointUp', 'sign', 'idle'],
  pointUp: ['point', 'greet', 'idle'],
  sign: ['point', 'page', 'idle'],
  lantern: ['read', 'map', 'idle'],
  think: ['read', 'plain', 'idle'],
  read: ['think', 'page', 'idle'],
  page: ['read', 'map', 'idle'],
  map: ['page', 'read', 'idle'],
  greet: ['pointUp', 'point', 'idle'],
  mad: ['armsCross', 'sign', 'idle'],
};

/** Whether this picture's branch runs off the side the bird backs onto. */
export function perches(src) {
  const { branch } = getGuideAnchor(src);
  return branch === 'right' || branch === 'both';
}

/**
 * The picture to draw for a pose when the guide is standing in a corner.
 *
 * `poses` is a persona's own map — `persona.poses` — so the substitute always
 * comes from the same bird.
 */
export function perchedPose(poses, pose = 'idle') {
  if (!poses) return undefined;
  const wanted = poses[pose] ? pose : 'idle';
  const ok = (p) => poses[p] && perches(poses[p]);
  if (ok(wanted)) return poses[wanted];
  for (const alt of STAND_INS[wanted] || []) if (ok(alt)) return poses[alt];
  for (const alt of POSES) if (ok(alt)) return poses[alt];
  return poses[wanted] || poses.idle;
}

/**
 * The same substitution for a caller that already holds a picture rather than
 * a pose name — the campaign and trait panels pick their own art and pass it
 * down, and the pose it came from is recoverable from the persona's own map.
 */
export function perchedSrc(poses, src) {
  if (!src || perches(src)) return src;
  const pose = Object.keys(poses || {}).find((k) => poses[k] === src);
  return pose ? perchedPose(poses, pose) : src;
}

/** guideImage's corner-safe twin, for a caller holding an id rather than a persona. */
export function perchedImage(guideId, pose = 'idle') {
  return perchedPose(guidePoses(guideId), pose);
}
