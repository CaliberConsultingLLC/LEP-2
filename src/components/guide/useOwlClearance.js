import { useCallback, useEffect, useRef, useState } from 'react';
import { getGuideAnchor } from '../../data/guideAnchors.generated';
import { readKeepClear } from './guideGeometry';

// Getting the bird out of the way of the page.
//
// Solving the bubble is only half of it. The guide stands in the bottom-right
// corner, and two pages put their primary control in that same corner: the
// campaign builder's "Review campaign", and Review & Lock's "Read your
// reflection" — the only way out of the intake. Making the image inert fixed
// the click that the owl used to swallow, but nobody can read a button through
// an owl.
//
// Two moves, in order of how little they disturb the composition:
//
//   sink   drop the bird further off the bottom edge. It already bleeds off
//          that edge everywhere in the product, so a little further down reads
//          as composition rather than as avoidance.
//   flip   stand on the other side. Reserved for when sinking cannot clear —
//          a control pinned to the bottom of the window cannot be sunk past
//          without the guide leaving the page altogether.
//
// If neither works the bird sinks as far as it is allowed and the page keeps
// its control on top, which is the right way round for a tie.
//
// How far it may sink is a rule rather than a number: down to the point where
// the face is the last thing above the edge. The guide is still present and
// still recognisably itself — looking over the bottom of the window — and that
// is enough further down to clear a button sitting in its corner, which a flat
// fraction was not.

const overlaps = (a, b) => {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
};

// How much of the page is under a box, sampled rather than reasoned about.
//
// Keep-clear tells the guide about the controls a page cares most about, but a
// page is more than its controls — a column of chapter titles is not marked
// and is still a bad thing to stand on. So the footprint is probed on a coarse
// grid and anything that is text, a control or a picture counts as occupied.
// It is an estimate, and it only ever decides between two candidate positions,
// so being approximately right is enough.
const PROBE = 6;

function contentUnder(box, guideEl) {
  if (typeof document === 'undefined') return 0;
  let busy = 0;
  for (let iy = 0; iy < PROBE; iy += 1) {
    for (let ix = 0; ix < PROBE; ix += 1) {
      const x = box.left + ((ix + 0.5) / PROBE) * (box.right - box.left);
      const y = box.top + ((iy + 0.5) / PROBE) * (box.bottom - box.top);
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
      const el = document.elementFromPoint(Math.round(x), Math.round(y));
      if (!el || el === document.body || el === document.documentElement) continue;
      if (guideEl && (guideEl.contains(el) || el.contains(guideEl))) continue;
      if (el.closest('[role="status"]')) continue;

      const tag = el.tagName;
      if (tag === 'IMG' || tag === 'SVG' || tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') { busy += 1; continue; }
      // Text this element owns, rather than text somewhere inside a wrapper
      // that happens to span the whole page.
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (ownText) busy += 1;
    }
  }
  return busy;
}

function emptier(candidate, current, guideEl) {
  const there = contentUnder(candidate, guideEl);
  const here = contentUnder(current, guideEl);
  // A clear margin, not a hair's breadth: swapping sides is a big visual move
  // and is only worth making when the other side is plainly freer.
  return there * 1.6 < here;
}

// How far the bird may sink: far enough to clear most things, never so far
// that it stops reading as a guide. Two limits, whichever binds first —
// the face stays above the window's edge, and at least half the bird stays in
// view. Without the second one a page whose control sits low enough sank the
// owl until only its ear tufts showed, which reads as a rendering fault rather
// than as a guide standing back.
function sinkLimit(rect, src) {
  const faceBottom = getGuideAnchor(src).face[3];
  const byFace = window.innerHeight - 10 - (rect.top + faceBottom * rect.height);
  const byBody = rect.height * 0.5;
  return Math.max(0, Math.round(Math.min(byFace, byBody)));
}

export default function useOwlClearance(owlRef, { enabled = true, allowFlip = true } = {}) {
  const [state, setState] = useState({ sink: 0, flipped: false });
  const frame = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const measure = useCallback(() => {
    const el = owlRef?.current;
    if (!el) return;
    if (!enabled) {
      if (stateRef.current.sink || stateRef.current.flipped) setState({ sink: 0, flipped: false });
      return;
    }

    const r = el.getBoundingClientRect();
    if (r.width < 8) return;

    const vw = window.innerWidth;
    const { sink: appliedSink, flipped } = stateRef.current;

    // Undo whatever is currently applied, so each pass measures the same
    // resting position rather than the result of the last one. Sinking moves
    // the bird *down*, so resting position is the measured one moved back up —
    // adding instead of subtracting here made the second pass measure a box
    // below the window, find nothing to avoid, and settle back to no sink at
    // all, which looked exactly like the hook never running.
    const top = r.top - appliedSink;
    const bottom = r.bottom - appliedSink;
    const home = flipped
      ? { left: vw - r.right, right: vw - r.left, top, bottom }
      : { left: r.left, right: r.right, top, bottom };
    const away = { left: vw - home.right, right: vw - home.left, top, bottom };

    const regions = readKeepClear();
    const hits = (box) => regions.reduce((sum, k) => sum + overlaps(box, k), 0);

    const cap = sinkLimit({ top, height: r.height }, el.getAttribute('src'));
    const sinkToClear = (box) => {
      let needed = 0;
      for (const k of regions) {
        if (Math.min(box.right, k.right) - Math.max(box.left, k.left) <= 0) continue;
        if (Math.min(box.bottom, k.bottom) - Math.max(box.top, k.top) <= 0) continue;
        needed = Math.max(needed, k.bottom - box.top);
      }
      return Math.round(needed);
    };

    let next;
    if (!hits(home)) {
      next = { sink: 0, flipped: false };
    } else {
      const needed = sinkToClear(home);
      if (needed <= cap) {
        next = { sink: needed, flipped: false };
      } else if (allowFlip && !hits(away) && emptier(away, home, el)) {
        // Standing on the other side only helps if the other side is actually
        // freer. On Review & Lock it is not — the corner holds the way out of
        // the intake and the opposite side holds the chapter list — so the
        // guide stays where it is rather than trading one obstruction for
        // another, and the page keeps its control on top.
        next = { sink: 0, flipped: true };
      } else {
        next = { sink: Math.min(needed, cap), flipped: false };
      }
    }

    setState((prev) => (
      prev.flipped === next.flipped && Math.abs(prev.sink - next.sink) < 2 ? prev : next
    ));
  }, [owlRef, enabled, allowFlip]);

  useEffect(() => {
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);

    // The first pass runs before the portrait has decoded, when the image has
    // no height and there is nothing to measure. Watching the body alone never
    // brought it back — the page's layout does not change when a fixed-size
    // overlay image finishes loading — so the owl is watched directly and its
    // load event is listened for.
    const el = owlRef?.current;
    el?.addEventListener('load', schedule);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro) {
      if (el) ro.observe(el);
      if (document.body) ro.observe(document.body);
    }
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      el?.removeEventListener('load', schedule);
      ro?.disconnect();
    };
  }, [measure, owlRef]);

  return state;
}
