import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Measure a composition into the box it is given, and scale it to fit.
 *
 * A Compass screen is a room a leader stands in, not a document they read, so
 * it has to land inside the viewport at 100% zoom. The thing that keeps coming
 * loose is doing that with numbers — a type scale hand-tuned until it fits one
 * monitor, which the next paragraph of generated copy immediately breaks. Text
 * written by a model has no fixed length, so no fixed size can be correct.
 *
 * This measures instead. The box reports the height it actually has; the
 * content reports the height it actually wants; the ratio between them becomes
 * a `--fit` scale applied to the content. Longer copy renders slightly smaller
 * rather than off the bottom of the screen.
 *
 * The pattern is TodayRoom's (`src/pages/Dashboard/cc/TodayRoom.jsx`), pulled
 * out so the next screen that needs it copies a mechanism instead of a number.
 *
 * Usage:
 *   const { boxRef, contentRef, fit, floored, remeasure } = useViewportFit({ enabled });
 *   <Box ref={boxRef} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
 *     <Box ref={contentRef} style={{ '--fit': fit }} sx={{
 *       width: 'calc(100% / var(--fit))',
 *       transformOrigin: 'top center',
 *       transform: 'scale(var(--fit))',
 *     }}>
 *
 * @param {object}   opts
 * @param {boolean}  opts.enabled  false in the stacked/narrow layout, where a
 *   phone-shaped page is expected to scroll and shrinking it would be wrong.
 * @param {number}   opts.minFit   the floor. Below this the copy is too small
 *   to read, and clipping is the more honest failure — `floored` reports it so
 *   the caller can let the box scroll instead.
 * @param {Array}    opts.watch    values that change what is on the stage, so
 *   the measurement restarts from full size rather than creeping down.
 */
export default function useViewportFit({ enabled = true, minFit = 0.72, watch = [] } = {}) {
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const passRef = useRef(0);
  const [fit, setFit] = useState(1);
  const [floored, setFloored] = useState(false);

  // Deliberately no dependency list. What this reads is layout, and layout
  // moves for reasons no dependency array can name — a rewrapped headline, a
  // font that landed late, one more sentence than last time. The tolerance and
  // the pass counter are what stop it, not the deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!enabled) {
      if (fit !== 1) setFit(1);
      if (floored) setFloored(false);
      return;
    }
    const box = boxRef.current?.clientHeight;
    const content = contentRef.current?.scrollHeight;
    if (!box || !content) return;

    // `content` is the element's LAYOUT height, which a CSS transform does not
    // change — `scrollHeight` reports the same number at any scale. So it is
    // already the natural height and must not be divided by the current fit.
    // Doing that compounds every pass into the last and walks a page that only
    // needed 0.9 all the way down to the floor.
    const wanted = box / content;
    const next = Math.min(1, Math.max(minFit, wanted));
    const hitFloor = wanted < minFit - 0.004;
    if (hitFloor !== floored) setFloored(hitFloor);
    if (Math.abs(next - fit) > 0.004 && passRef.current < 8) {
      passRef.current += 1;
      setFit(next);
    }
  });

  // Start over from full size whenever the box or its contents change, so the
  // stage grows back into a taller window as readily as it shrank into a short
  // one.
  const remeasure = useCallback(() => {
    passRef.current = 0;
    setFit(1);
    setFloored(false);
  }, []);

  useEffect(() => {
    if (!enabled || typeof ResizeObserver === 'undefined') return undefined;
    const box = boxRef.current;
    if (!box) return undefined;
    const observer = new ResizeObserver(remeasure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [enabled, remeasure]);

  // And the window itself. The observer above watches the box, and the box gets
  // its height from `100svh` — which does not always report a change to a
  // ResizeObserver when the window is resized, so on its own the observer left
  // a stretched window rendering at the old scale and clipping. Verified by
  // resizing 1440x900 down to 1366x768 and watching the fit stay put.
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    const onResize = () => remeasure();
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [enabled, remeasure]);

  // Fraunces and Manrope land after first paint and change every line height on
  // the page. Without this the fit is measured against fallback metrics and is
  // wrong by the time the real faces arrive.
  useEffect(() => {
    if (!enabled || !document.fonts?.ready) return undefined;
    let live = true;
    document.fonts.ready.then(() => { if (live) remeasure(); }).catch(() => {});
    return () => { live = false; };
  }, [enabled, remeasure]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(remeasure, watch);

  return { boxRef, contentRef, fit, floored, remeasure };
}
