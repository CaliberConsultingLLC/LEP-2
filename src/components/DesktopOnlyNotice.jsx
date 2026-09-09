import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/desktop-notice.css';

/**
 * "Best viewed on a desktop."
 *
 * The landing page and the leader-facing product are laid out for a desktop
 * window and are not being built for phones yet. Rather than let someone
 * discover that by scrolling a squeezed page, they get told once, up front,
 * with a way past it — nothing here blocks the site.
 *
 * The team survey is the deliberate exception. Teammates answer it from an
 * emailed link, usually on a phone, and it is built responsive on purpose; a
 * "use a desktop" card in front of it would cost responses for no reason.
 */

const MOBILE_QUERY = '(max-width: 899px)';
const DISMISS_KEY = 'compassDesktopNoticeDismissed';

/* Routes built for a phone on purpose. Everything else is desktop-first. */
const MOBILE_READY = (pathname) => pathname.startsWith('/campaign/');

const readDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

export default function DesktopOnlyNotice() {
  const { pathname } = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(mq.matches);
    sync();
    // `addListener` is the Safari < 14 spelling; both are kept because the
    // people most likely to hit this notice are the ones on older phones.
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', sync);
      else mq.removeListener(sync);
    };
  }, []);

  const open = isMobile && !dismissed && !MOBILE_READY(pathname);

  // A dialog over a page that still scrolls behind it reads as a broken page,
  // so the body is held still for as long as the card is up.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* Private browsing: the notice simply comes back next navigation. */
    }
  };

  return (
    <div className="dn-scrim" role="dialog" aria-modal="true" aria-labelledby="dn-title">
      <div className="dn-card">
        <img className="dn-logo" src="/landing/CompassLogo.png" alt="" />
        <h2 className="dn-title" id="dn-title">
          Best viewed on a desktop
        </h2>
        <p className="dn-body">
          The Compass is built for a full-size screen. You can keep looking around on your phone,
          but the maps, the dashboard, and your field journal are laid out for a desktop or laptop.
          That is where you will want to do the actual work.
        </p>
        <button type="button" className="dn-btn" onClick={dismiss}>
          Continue anyway
        </button>
      </div>
    </div>
  );
}
