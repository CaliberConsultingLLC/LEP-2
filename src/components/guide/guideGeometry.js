// Where the bubble goes, worked out rather than typed in.
//
// Every guide bubble in the product used to be placed by a breakpoint table —
// `left: { md: 290, lg: 350, xl: 390 }` — which is a guess about two things
// that both move: where the bird is inside its PNG, and how big the window is.
// The guesses were wrong often enough that the bubble covered the owl's face
// on the journal and the Next button on the reading.
//
// So nothing is typed in here except the shape of the preference. The anchor
// comes off the art (see scripts/build-guide-anchors.mjs), the sizes come off
// the DOM, and the placement is solved against both every time either changes.
//
// This module is deliberately pure: rectangles in, a rectangle and a tail out.
// It can be reasoned about — and corrected — without a browser.

import { getGuideAnchor } from '../../data/guideAnchors.generated';

// Breathing room. `EDGE` keeps the bubble off the window's edge, `GAP` keeps
// it off the owl's face; both are small enough to stay conversational and big
// enough that the tail has somewhere to live.
export const EDGE = 16;
export const GAP = 14;

// How far along its edge a tail may sit. Any closer to a corner and it reads
// as a rendering fault rather than as a tail.
const TAIL_INSET = 22;

const area = (r) => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);

const overlap = (a, b) => {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
};

const rect = (left, top, width, height) => ({
  left, top, width, height, right: left + width, bottom: top + height,
});

/**
 * The owl's anchor in viewport pixels.
 *
 * `owlRect` is the rendered <img> box — which is mostly transparent padding,
 * so none of these numbers can be read off it directly. `mirrored` is true for
 * the Summary and journal owls, which are flipped with scaleX(-1); flipping x
 * here is the whole fix for the bug where the mirror walked the face under a
 * bubble placed from unmirrored fractions.
 */
export function resolveAnchor(owlRect, src, mirrored = false) {
  const a = getGuideAnchor(src);
  const fx = (v) => (mirrored ? 1 - v : v);

  const faceL = Math.min(fx(a.face[0]), fx(a.face[2]));
  const faceR = Math.max(fx(a.face[0]), fx(a.face[2]));

  return {
    speak: {
      x: owlRect.left + fx(a.speak[0]) * owlRect.width,
      y: owlRect.top + a.speak[1] * owlRect.height,
    },
    face: rect(
      owlRect.left + faceL * owlRect.width,
      owlRect.top + a.face[1] * owlRect.height,
      (faceR - faceL) * owlRect.width,
      (a.face[3] - a.face[1]) * owlRect.height,
    ),
    // Which way the bird is looking out of the frame. A guide standing on the
    // left of the screen should speak to its right, and the reverse — this is
    // what makes the placement mirror without a second set of numbers.
    facing: mirrored ? 'right' : 'left',
  };
}

/**
 * The same anchor as CSS percentages, for placing something inside the owl's
 * own box without measuring it first.
 *
 * The owl image used to take pointer events across its whole square, 90% of
 * which is transparent padding — which is how it came to be swallowing clicks
 * on the "Read your reflection" button underneath it. The fix is to make the
 * image inert and put the click target on the bird's face, and the face is
 * already known.
 */
export function anchorPercents(src, mirrored = false) {
  const a = getGuideAnchor(src);
  const fx = (v) => (mirrored ? 1 - v : v);
  const l = Math.min(fx(a.face[0]), fx(a.face[2]));
  const r = Math.max(fx(a.face[0]), fx(a.face[2]));
  const pc = (v) => `${(v * 100).toFixed(2)}%`;
  return {
    face: { left: pc(l), top: pc(a.face[1]), width: pc(r - l), height: pc(a.face[3] - a.face[1]) },
  };
}

/**
 * Everything on the page the bubble must not cover.
 *
 * Pages opt in with `data-guide-keepclear` on the control or figure that
 * matters — the page-turn on the reading, the current station on the map. The
 * solver can only avoid what it has been told about, and the alternative to
 * telling it is the bubble landing on the Next button by luck.
 */
export function readKeepClear(root = document) {
  const out = [];
  root.querySelectorAll('[data-guide-keepclear]').forEach((el) => {
    if (el.getAttribute('data-guide-keepclear') === 'off') return;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    out.push(rect(r.left, r.top, r.width, r.height));
  });
  return out;
}

// The clock positions, in the order they are preferred. Each one says where
// the bubble sits relative to the speak point, expressed as the fraction of
// the bubble that hangs on each side of it.
//
// `tx` is where along the bubble's width the speak point falls — 0.16 means
// the bubble runs off to the right of the head, which is the one-to-two
// o'clock reading the guide is meant to have.
//
// `prefer` is the way the guide has to be facing for this to be its natural
// side, and every row of it used to say the opposite. `tx: 0.16` runs the
// bubble off to the RIGHT of the head, and it was tagged `prefer: 'left'`.
// The journal owl is mirrored, so it faces right, so the sort handed it
// `above-left` — the bubble ran away from the direction the bird was looking
// and into the corner of the window, which is the one place the eye is not.
const PLACEMENTS = [
  { id: 'above-right', tx: 0.16, ty: 1, prefer: 'right' },
  { id: 'above-left', tx: 0.84, ty: 1, prefer: 'left' },
  { id: 'above', tx: 0.5, ty: 1 },
  { id: 'right', tx: 0, ty: 0.5, prefer: 'right' },
  { id: 'left', tx: 1, ty: 0.5, prefer: 'left' },
  { id: 'below-right', tx: 0.16, ty: 0, prefer: 'right' },
  { id: 'below-left', tx: 0.84, ty: 0, prefer: 'left' },
];

// Where the speak point falls along the bubble in the placement the guide
// takes when nothing is in its way — the one-to-two o'clock reading it is
// meant to have. Exported so that a caller who wants the LINE centred can
// stand the bird at the x which puts that placement across the middle, rather
// than at the x which would centre some other placement it is not going to get.
export const NATURAL_TX = PLACEMENTS[0].tx;

// How far a box is from sitting in the middle of the window. The horizontal
// miss counts double: a bubble off to one side reads as belonging to the
// corner it is in, where one sitting high or low still reads as being in the
// middle of the page.
const centreCost = (box, viewport) =>
  2 * Math.abs(box.left + box.width / 2 - viewport.width / 2)
  + Math.abs(box.top + box.height / 2 - viewport.height / 2);

// Which edge of the bubble the tail leaves from, worked out from where the
// head ended up rather than from which placement was asked for — and null when
// the head is behind the bubble, which is the one arrangement that is not
// allowed, because a bubble with no tail is no longer the guide speaking.
function tailFor(speak, box) {
  const c = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const alongX = () => c(speak.x - box.left, TAIL_INSET, Math.max(TAIL_INSET, box.width - TAIL_INSET));
  const alongY = () => c(speak.y - box.top, TAIL_INSET, Math.max(TAIL_INSET, box.height - TAIL_INSET));
  if (speak.y >= box.bottom) return { side: 'bottom', offset: alongX() };
  if (speak.y <= box.top) return { side: 'top', offset: alongX() };
  if (speak.x >= box.right) return { side: 'right', offset: alongY() };
  if (speak.x <= box.left) return { side: 'left', offset: alongY() };
  return null;
}

export function solveBubble({ anchor, bubble, viewport, obstacles = [], edge = EDGE, gap = GAP }) {
  const { speak, face, facing } = anchor;
  const avoid = [face, ...obstacles];

  const maxLeft = Math.max(edge, viewport.width - edge - bubble.width);
  const maxTop = Math.max(edge, viewport.height - edge - bubble.height);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  const ordered = [...PLACEMENTS].sort((a, b) => {
    // A guide facing right speaks to its right; prefer the placements that go
    // that way, without dropping the others as fallbacks.
    const score = (p) => (p.prefer && p.prefer !== facing ? 1 : 0);
    return score(a) - score(b);
  });

  let best = null;
  let clear = null;
  ordered.forEach((p, index) => {
    // Put the speak point at (tx, ty) of the bubble, then push the whole
    // bubble clear of the head by the gap in whichever direction it sits.
    let left = speak.x - p.tx * bubble.width;
    let top = speak.y - p.ty * bubble.height;
    if (p.ty === 1) top -= gap;
    if (p.ty === 0) top += gap;
    if (p.tx === 0) left += gap;
    if (p.tx === 1) left -= gap;

    const box = rect(clamp(left, edge, maxLeft), clamp(top, edge, maxTop), bubble.width, bubble.height);

    // Overlapping the face is the thing this exists to prevent, so it counts
    // for more than covering a button, which in turn counts for more than
    // simply having been shoved away from where it was asked to go. The
    // weights are wide apart on purpose: a bubble at an awkward clock position
    // is a blemish, a bubble over the Next button is a broken page.
    const faceHit = overlap(box, face);
    const clearHit = obstacles.reduce((sum, o) => sum + overlap(box, o), 0);
    const drift = Math.hypot(box.left - left, box.top - top);
    const cost = faceHit * 12 + clearHit * 8 + drift + index * 40;

    if (!best || cost < best.cost) best = { cost, box, id: p.id, faceHit, clearHit };

    // A candidate that lands on nothing is not merely cheaper than one that
    // does — it is a different kind of answer, and among those the clock order
    // stops mattering. What matters is which of them is nearest the middle.
    if (faceHit === 0 && clearHit === 0) {
      const pull = centreCost(box, viewport);
      if (!clear || pull < clear.pull) clear = { pull, box, id: p.id };
    }
  });

  let box = clear ? clear.box : best.box;

  // Seven candidate positions is a coarse grid, and when none of them landed
  // clean the best of them can still clip a corner of something — a 30px
  // station marker sitting exactly where the bubble wants to be. So the winner
  // is pushed: take whatever it still overlaps, find the shortest move that
  // clears it without leaving the window, and repeat. This is what takes the
  // last few percent to nothing.
  for (let pass = 0; !clear && pass < 6; pass += 1) {
    let worst = null;
    for (const o of avoid) {
      const hit = overlap(box, o);
      if (hit > 0 && (!worst || hit > worst.hit)) worst = { o, hit };
    }
    if (!worst) break;

    const { o } = worst;
    const moves = [
      { dx: o.left - box.right - 1, dy: 0 },
      { dx: o.right - box.left + 1, dy: 0 },
      { dx: 0, dy: o.top - box.bottom - 1 },
      { dx: 0, dy: o.bottom - box.top + 1 },
    ]
      .map((m) => ({
        ...m,
        left: clamp(box.left + m.dx, edge, maxLeft),
        top: clamp(box.top + m.dy, edge, maxTop),
      }))
      .map((m) => {
        const moved = rect(m.left, m.top, box.width, box.height);
        return { ...m, moved, rest: avoid.reduce((s, x) => s + overlap(moved, x), 0), cost: Math.abs(m.dx) + Math.abs(m.dy) };
      })
      // A push that leaves as much overlap as it started with is the window
      // refusing to give ground; take the one that actually clears something.
      .filter((m) => m.rest < worst.hit)
      .sort((a, b) => (a.rest - b.rest) || (a.cost - b.cost));

    if (!moves.length) break;
    box = moves[0].moved;
  }

  // The bubble is not walked any further toward the middle of the window than
  // this. It was tried: from a full-screen interruption the free space lets it
  // reach dead centre, 150 to 230 pixels from the head depending on the window
  // — and the tail is a 14px nub on the bubble's edge, not a leader that
  // reaches. A centred bubble trailing a stub that points at nothing has
  // stopped being something the guide said. Where the line should sit near the
  // middle, the thing to move is the guide: stand the bird so that the bubble
  // beside its head is already central. See `fitPortrait`'s `speakX`.

  // Which edge the tail leaves from, decided by where the head ended up
  // relative to the bubble rather than by which placement was asked for. No
  // side means the head is behind the bubble, which both the scoring and the
  // walk above are meant to prevent; drawing a tail into the middle of the
  // bubble would look broken, so it is left off and the overlap is the thing
  // to fix.
  const tail = tailFor(speak, box);

  return {
    left: Math.round(box.left),
    top: Math.round(box.top),
    placement: clear ? clear.id : best.id,
    tail: tail ? { side: tail.side, offset: Math.round(tail.offset) } : null,
    // The origin the entrance animation grows from, so the bubble appears to
    // come out of the beak rather than fade in over the page.
    origin: {
      x: Math.round(clamp(speak.x - box.left, 0, box.width)),
      y: Math.round(clamp(speak.y - box.top, 0, box.height)),
    },
    // Measured on the box that actually shipped, after the push — reporting
    // the pre-push numbers would make the solver look better than it is.
    covers: {
      face: Math.round(overlap(box, face)),
      keepClear: Math.round(obstacles.reduce((s, o) => s + overlap(box, o), 0)),
    },
  };
}

export const __test = { rect, overlap, area, PLACEMENTS };

/**
 * The frame a full-height portrait owl should be given, worked out from the
 * bird rather than from the PNG that carries it.
 *
 * Two things are wrong with a width off a breakpoint table, and this replaces
 * both.
 *
 * The first is that a width given to the <img> is not a size given to the
 * bird. Across the 42 portraits the opaque box is between 0.78 and 0.99 of the
 * frame tall and between 0.59 and 0.98 of it wide, and its feet sit anywhere
 * from 0.87 to 1.0 down — so one CSS width draws birds that differ by a
 * quarter in height, and the guide changes size and lifts off the floor when
 * it changes pose. That is the "sometimes they just get super random" the
 * placement audit measured and could not explain from the CSS.
 *
 * The second is that a breakpoint table is a step function on the window's
 * width. The bird held at 480px from 900px of window all the way to 1200 while
 * the room around it stretched, then jumped to 580. Nothing else on the page
 * moves in steps.
 *
 * So the caller says how tall the bird should be drawn, where its leading edge
 * should land, and how far its feet stand off the floor — all in viewport
 * pixels, all derivable from whatever else the bird is standing next to — and
 * the frame falls out of the measured art. Size the bird off the scene and the
 * scene holds together at any window shape, which is the whole point.
 */
// How tall the bird stands when it IS the page rather than a speaker in it —
// the Summary, the field journal, a full-screen interruption. A share of the
// window's height, clamped, so it grows the way everything else on the page
// does: smoothly, and with the room it is in.
//
// One definition, because there are three callers and they have to agree. The
// journal used to size its guide off the BOOK's scale instead, which made it
// the smallest full-height owl in the product — a bird drawn to 465 where the
// Summary's stands at 522, in the same window, three clicks apart.
export const STANDING_H = 0.58;
export const STANDING_H_MIN = 300;
export const STANDING_H_MAX = 620;

export function standingHeight(viewportHeight) {
  const h = Number(viewportHeight) || 0;
  return Math.max(STANDING_H_MIN, Math.min(h * STANDING_H, STANDING_H_MAX));
}

// The journal's guide is the one deliberate exception, and it is a different
// job rather than a different opinion about the same one. Everywhere else the
// standing bird shares a page it is speaking about; in the journal it stands in
// the window's own bottom-left corner beside a book that fills the rest of the
// room, and at the shared height it read as a cut-out floating in the margin
// instead of somebody standing there. So it is taller, and it is allowed to
// keep growing a little further before it stops.
export const JOURNAL_STANDING_H = 0.66;
export const JOURNAL_STANDING_H_MAX = 700;

export function journalStandingHeight(viewportHeight) {
  const h = Number(viewportHeight) || 0;
  return Math.max(STANDING_H_MIN, Math.min(h * JOURNAL_STANDING_H, JOURNAL_STANDING_H_MAX));
}

export function fitPortrait({ src, mirrored = false, height, leadX, trailX, speakX, footInset = 0 }) {
  const a = getGuideAnchor(src);
  const [x0, y0] = a.box;
  const x1 = a.box[2];
  const y1 = a.box[3];
  // The portraits are square, so the drawn height fixes the whole frame.
  const frame = height / (y1 - y0);
  const fx = (v) => (mirrored ? 1 - v : v);
  // Three ways to say where the bird goes, and which one you want depends on
  // what it is standing next to.
  //
  //   leadX   the edge it faces into the page with — its right when the art is
  //           mirrored to stand on the left, its left when it is not. Use this
  //           when the bird has to tuck against something in the scene.
  //
  //   trailX  the other edge, the one behind it — its left when the art is
  //           mirrored to stand on the left. Use this when the bird is anchored
  //           to the window's corner rather than to anything on the page, the
  //           way the journal's guide stands in the bottom-left of the room.
  //           Anchoring by the leading edge instead lets the trailing edge fall
  //           wherever the art's own padding puts it, which is how a bird meant
  //           to be in the corner ends up floating 66px out of it.
  //
  //   speakX  the point the line comes out of its beak. Use this when what has
  //           to land somewhere is the line rather than the bird — on a
  //           full-screen interruption the eye goes to the middle of a blurred
  //           page, so the bubble belongs there, and the way to put it there
  //           is to stand the bird so that is where it speaks.
  let anchorFrac = fx(x0);
  let anchorAt = leadX;
  if (speakX != null) {
    anchorFrac = fx(a.speak[0]);
    anchorAt = speakX;
  } else if (trailX != null) {
    anchorFrac = fx(x1);
    anchorAt = trailX;
  }
  return {
    width: frame,
    height: frame,
    left: anchorAt - anchorFrac * frame,
    // `bottom` is measured up from the window's floor and the frame carries
    // transparent padding under the feet, so the padding comes back off — the
    // bird stands on the line it was given rather than hovering above it.
    bottom: footInset - (1 - y1) * frame,
  };
}
