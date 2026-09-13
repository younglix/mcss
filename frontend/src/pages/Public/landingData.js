// Static nav — actual page content (hero, about, academics, fees,
// gallery, banner) now comes from the database via
// /settings/public-website-content and /settings/public-branding; see
// LandingContent.jsx and PublicFooter.jsx. These link labels stay static
// since they're plain in-page anchors/placeholders, not editable settings.
// The Portal Login button in PublicHeader is the one login entry point —
// no separate role-labeled nav link ("Student Portal", "Staff Login", ...)
// duplicating it here.
export const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Admissions', path: '/apply' },
  { label: 'Academics', path: '/#academics' },
];

export const footerLinks = {
  explore: ['Academic Calendar', 'School Management', 'Careers', 'Alumni Network'],
  resources: ['Student Portal', 'Parent Handbook', 'Campus Safety', 'Support Desk'],
};
