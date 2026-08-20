import { useEffect, useRef } from 'react';
import { useUIPreferences } from '../../context/UIPreferences.jsx';

/**
 * Ambient spotlight that trails the pointer when Focus Mode is on. Position
 * is written straight to CSS custom properties via a ref (never React
 * state), and the pointermove listener is rAF-throttled and only attached
 * while focus mode is active, so it costs nothing the rest of the time.
 */
export default function CursorGlow() {
  const { focusMode } = useUIPreferences();
  const glowRef = useRef(null);

  useEffect(() => {
    if (!focusMode) return undefined;

    let frame = null;
    const handleMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const node = glowRef.current;
        if (!node) return;
        node.style.setProperty('--cursor-x', `${event.clientX}px`);
        node.style.setProperty('--cursor-y', `${event.clientY}px`);
        node.style.setProperty('--cursor-opacity', '1');
      });
    };
    const handleLeave = () => {
      glowRef.current?.style.setProperty('--cursor-opacity', '0');
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [focusMode]);

  if (!focusMode) return null;

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}
