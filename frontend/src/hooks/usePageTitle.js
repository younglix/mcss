import { useEffect } from 'react';

/**
 * Sets document.title and scrolls to top on mount/route change.
 * Mirrors the behavior StitchScreen.jsx provides for un-migrated pages,
 * for use by pages built with the new shared component layer.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | MCSS Portal`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [title]);
}
