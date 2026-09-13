import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useBranding } from '../../context/BrandingContext.jsx';
import LoginImageSlider from './LoginImageSlider.jsx';

/** Drop-in replacement for a landing-page section's single
 * `{fallbackUrl && <img ... />}` — extends it with any additional images
 * the Super Admin has added for this spot (SiteMediaManager, in
 * Website.jsx) without changing how the spot looks when there's still
 * just the one original image. `fallbackUrl` always renders first, so an
 * existing single-image setting keeps behaving exactly as before until
 * someone actually adds more. Fills its parent (`w-full h-full`) and
 * establishes its own `relative` containing block, so it drops into any
 * of the existing image wrappers — positioned or not — without needing
 * to touch their classNames. */
export default function LandingImageSpot({ placement, fallbackUrl, alt = '' }) {
  const { branding } = useBranding();
  const [extra, setExtra] = useState([]);

  useEffect(() => {
    api.get(`/config/site-media/public?placement=${placement}`, { auth: false })
      .then(setExtra)
      .catch(() => setExtra([]));
  }, [placement]);

  const images = [...(fallbackUrl ? [{ id: 'base', url: fallbackUrl }] : []), ...extra];

  if (images.length === 0) return null;

  if (images.length === 1) {
    return <img src={images[0].url} alt={alt} className="w-full h-full object-cover" />;
  }

  return (
    <div className="relative w-full h-full">
      <LoginImageSlider images={images} transitionStyle={branding.login_transition_style} durationSeconds={branding.login_transition_duration} />
    </div>
  );
}
