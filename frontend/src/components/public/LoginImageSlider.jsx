import { useEffect, useState } from 'react';

/** Every style is expressed as a function of `offset` — the image's
 * position relative to the active one (0 = showing, +1 = next/incoming,
 * -1 = previous/outgoing). All images stay mounted, stacked in the same
 * spot, and only their opacity/transform/filter change — that's what lets
 * a plain CSS `transition` animate the crossfade/slide/etc smoothly on
 * every index change, for every style, without any per-style JS. */
export const TRANSITION_STYLES = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide_left', label: 'Slide Left' },
  { value: 'slide_right', label: 'Slide Right' },
  { value: 'slide_up', label: 'Slide Up' },
  { value: 'slide_down', label: 'Slide Down' },
  { value: 'zoom_in', label: 'Zoom In' },
  { value: 'zoom_out', label: 'Zoom Out' },
  { value: 'flip_horizontal', label: 'Flip Horizontal' },
  { value: 'flip_vertical', label: 'Flip Vertical' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'blur_fade', label: 'Blur Fade' },
  { value: 'ken_burns', label: 'Ken Burns (Pan & Zoom)' },
];

const TRANSFORM_FNS = {
  fade: () => 'none',
  slide_left: (o) => `translateX(${o * 100}%)`,
  slide_right: (o) => `translateX(${-o * 100}%)`,
  slide_up: (o) => `translateY(${o * 100}%)`,
  slide_down: (o) => `translateY(${-o * 100}%)`,
  zoom_in: (o) => (o === 0 ? 'scale(1)' : 'scale(1.25)'),
  zoom_out: (o) => (o === 0 ? 'scale(1)' : 'scale(0.8)'),
  flip_horizontal: (o) => (o === 0 ? 'rotateY(0deg)' : `rotateY(${o * 90}deg)`),
  flip_vertical: (o) => (o === 0 ? 'rotateX(0deg)' : `rotateX(${o * 90}deg)`),
  rotate: (o) => (o === 0 ? 'rotate(0deg) scale(1)' : `rotate(${o * 12}deg) scale(1.1)`),
  blur_fade: () => 'none',
  ken_burns: () => 'none', // handled by the kenBurnsPan CSS animation instead
};

const FILTER_FNS = {
  blur_fade: (o) => (o === 0 ? 'blur(0px)' : 'blur(14px)'),
};

// The crossfade/slide/etc transition itself always plays over this fixed,
// snappy length regardless of how long each image is displayed — a Super
// Admin setting "duration" to 10s wants each image to STAY for 10s, not a
// sluggish 10-second slide animation every time it changes.
const TRANSITION_ANIM_SECONDS = 1.1;

/** Login page desktop slider — Super-Admin-managed images (SiteMedia,
 * placement=login_slider) with a configurable transition style/duration
 * (SystemSetting login.transition_style / login.transition_duration, read
 * via PublicBrandingView). Renders nothing for an empty image list — the
 * caller keeps its existing plain-color panel as the fallback — shows a
 * single image statically with no timer/transition for exactly one, and
 * auto-advances with the chosen transition for more than one. */
export default function LoginImageSlider({ images, transitionStyle = 'fade', durationSeconds = 5 }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    if (count < 2) return undefined;
    const ms = Math.max(1, Number(durationSeconds) || 5) * 1000;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, durationSeconds]);

  if (count === 0) return null;

  const transformFn = TRANSFORM_FNS[transitionStyle] || TRANSFORM_FNS.fade;
  const filterFn = FILTER_FNS[transitionStyle];

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ perspective: '1200px' }}>
      {images.map((img, i) => {
        let offset = i - index;
        if (offset > count / 2) offset -= count;
        if (offset < -count / 2) offset += count;
        const clamped = offset === 0 ? 0 : Math.max(-1, Math.min(1, offset));
        const active = clamped === 0;
        const isKenBurns = transitionStyle === 'ken_burns' && active && count > 0;

        return (
          <img
            key={img.id || img.url}
            src={img.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: active ? 1 : 0,
              transform: transformFn(clamped),
              filter: filterFn ? filterFn(clamped) : 'none',
              transition: count < 2
                ? 'none'
                : `opacity ${TRANSITION_ANIM_SECONDS}s ease, transform ${TRANSITION_ANIM_SECONDS}s ease, filter ${TRANSITION_ANIM_SECONDS}s ease`,
              animation: isKenBurns ? `kenBurnsPan ${Math.max(1, Number(durationSeconds) || 5)}s ease-in-out forwards` : 'none',
              willChange: 'opacity, transform, filter',
            }}
          />
        );
      })}
    </div>
  );
}
