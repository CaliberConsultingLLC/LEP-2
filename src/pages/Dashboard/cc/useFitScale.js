// Fit a room to the window instead of hoping it fits.
//
// The command center gives every page a fixed box: `100svh` minus the chrome,
// with overflow hidden. A page that runs taller than that box does not scroll
// — it is silently clipped. So the page measures itself against the box and
// scales down until it fits, the same mechanic the Today room uses.
//
// The content is laid out at `100% / fit` wide and scaled back down, so the
// scaled result still fills the box's width rather than leaving a gutter.
// Measurement runs against the unscaled layout height, which is what
// `scrollHeight` reports whether or not a transform is applied, so each pass
// converges: a wider layout is a shorter one, and the loop settles in two or
// three passes. The pass cap is the guard against a layout that oscillates.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MAX_PASSES = 8;

/**
 * @param {object}  opts
 * @param {boolean} opts.enabled  false leaves the page at natural size
 * @param {number}  opts.min      the floor; below this the page is clipped
 * @returns {{ frameRef, contentRef, fit, remeasure }}
 */
export function useFitScale({ enabled = true, min = 0.62 } = {}) {
  const frameRef = useRef(null);
  const contentRef = useRef(null);
  const passRef = useRef(0);
  const [fit, setFit] = useState(1);
  // Resetting the scale to 1 when it is already 1 is not a state change, so
  // React bails out of the render and the layout effect below never runs —
  // which is exactly the case a window resize hits. This counter guarantees
  // the render, and therefore the re-measurement, every time.
  const [, setTick] = useState(0);

  // Anything that changes the box or what is in it starts over from full size,
  // so the page grows back into a taller window as readily as it shrinks into
  // a shorter one.
  const remeasure = useCallback(() => {
    passRef.current = 0;
    setFit(1);
    setTick((t) => t + 1);
  }, []);

  // Deliberately dependency-free: the measurement has to run after every
  // render, because every render is what may have changed the height. The
  // pass counter, not a dependency list, is what stops the loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!enabled) {
      if (fit !== 1) setFit(1);
      return;
    }
    const room = frameRef.current?.clientHeight;
    const content = contentRef.current?.scrollHeight;
    if (!room || !content) return;
    const wanted = room / content;
    const next = Math.min(1, Math.max(min, wanted));
    if (Math.abs(next - fit) > 0.004 && passRef.current < MAX_PASSES) {
      passRef.current += 1;
      setFit(next);
    }
  });

  useEffect(() => {
    if (!enabled || typeof ResizeObserver === 'undefined') return undefined;
    const frame = frameRef.current;
    if (!frame) return undefined;
    const observer = new ResizeObserver(remeasure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [enabled, remeasure]);

  // Fraunces and Manrope land after first paint and change every line height
  // on the page. Without this the fit is measured against fallback metrics.
  useEffect(() => {
    if (!enabled || !document.fonts?.ready) return undefined;
    let live = true;
    document.fonts.ready.then(() => { if (live) remeasure(); }).catch(() => {});
    return () => { live = false; };
  }, [enabled, remeasure]);

  return { frameRef, contentRef, fit, remeasure };
}

export default useFitScale;
