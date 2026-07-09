---
name: Institutional Heritage
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4450'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7e7481'
  outline-variant: '#cfc2d1'
  surface-tint: '#7d46a1'
  primary: '#2e004a'
  on-primary: '#ffffff'
  primary-container: '#4a0f6e'
  on-primary-container: '#ba80df'
  inverse-primary: '#e4b5ff'
  secondary: '#4e599f'
  on-secondary: '#ffffff'
  secondary-container: '#a6b1fe'
  on-secondary-container: '#364186'
  tertiary: '#3c0022'
  on-tertiary: '#ffffff'
  tertiary-container: '#62003a'
  on-tertiary-container: '#ff57aa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f4d9ff'
  primary-fixed-dim: '#e4b5ff'
  on-primary-fixed: '#2f004c'
  on-primary-fixed-variant: '#632c87'
  secondary-fixed: '#dee0ff'
  secondary-fixed-dim: '#bbc3ff'
  on-secondary-fixed: '#031159'
  on-secondary-fixed-variant: '#354185'
  tertiary-fixed: '#ffd9e5'
  tertiary-fixed-dim: '#ffb0ce'
  on-tertiary-fixed: '#3e0022'
  on-tertiary-fixed-variant: '#8c0055'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Arimo
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Arimo
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Arimo
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Arimo
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Archivo Narrow
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Archivo Narrow
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Domine
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Domine
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is anchored in the concepts of **Academic Authority** and **Technical Precision**. It reflects the storied heritage of a Catholic secondary institution through a "Modern Institutional" aesthetic—balancing traditional prestige with the efficiency of a contemporary management tool. 

The visual language avoids the whimsical or overly-fluid trends of consumer tech. Instead, it prioritizes a structured, high-trust environment. Design choices emphasize clarity, order, and a sense of permanence. This is achieved through a high-contrast palette, a mix of architectural and high-legibility typography, and a "Modern UI Craft" approach that values crisp lines and purposeful ornamentation over generic decorative effects.

## Colors
The palette is dominated by **Deep Royal Purple** and **Royal Navy Blue**, establishing a tone of sobriety and institutional gravity. 

- **Primary (Purple):** Used for core branding elements, navigation headers, and primary actions. It represents the spiritual and leadership foundation of the school.
- **Secondary (Navy Blue):** Used for data-heavy backgrounds, sidebar elements, and decorative motifs like the cross and star.
- **Accent (Magenta):** Reserved for high-priority notifications, progress indicators, and "active" states where immediate attention is required. Use sparingly to maintain its impact.
- **Surface:** The background is a crisp White, with **Warm Off-White (#FAFAFA)** used for secondary containers and background sections to reduce eye strain during long administrative sessions.
- **Semantic Colors:** Success (Emerald), Warning (Amber), and Error (Crimson) must be used in their muted, professional variants to align with the high-trust tone.

## Typography
This design system utilizes a multi-layered typographic approach to balance modern administration with academic roots.

- **Headlines:** Use **Arimo**. Its sturdy, neo-grotesque proportions provide an immediate sense of modern reliability and structural integrity for page titles and section headers.
- **Body & Technical Data:** Use **Archivo Narrow**. Specifically chosen for its space-efficiency, it allows for dense administrative data (grades, schedules, records) to remain highly legible while fitting more content on screen.
- **Labels:** Use **Domine**. This elegant serif is used for table headers and metadata labels, providing a subtle "scholarly" contrast to the sans-serif data, making it easier to distinguish between structural labels and user content.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy to maintain a sense of order and institutional stability. 

- **Grid System:** A 12-column grid with 24px gutters. On desktop, content is centered within a 1280px container. 
- **Spacing Rhythm:** Based on a 4px baseline. Vertical spacing between sections should be generous (40px+) to ensure the interface feels organized and professional, preventing it from feeling cluttered.
- **Mobile Adaptation:** On mobile devices, margins shrink to 16px, and the 12-column layout collapses into a single vertical stack. Data tables should transition into card-based views or utilize horizontal scrolling with fixed first columns.

## Elevation & Depth
Depth in this design system is created through **Tonal Layers** rather than heavy shadows, adhering to the "Modern UI Craft" requirement.

1.  **Level 0 (Background):** Warm Off-White (#FAFAFA).
2.  **Level 1 (Surface):** Pure White (#FFFFFF) containers with a subtle 1px border (#E5E7EB).
3.  **Level 2 (Interaction):** Elements like active cards or dropdown menus use a very soft, low-opacity Navy tint shadow (e.g., `0px 4px 12px rgba(30, 42, 110, 0.08)`).
4.  **The Ribbon Effect:** Specialized status tags (e.g., "Honor Roll," "Urgent") utilize a "Ribbon" shape—a flat, rectangular base with a small triangular "notch" on one side to imply a physical academic banner.

## Shapes
The shape language is **Substantially Rounded**, providing an approachable contrast to the rigid grid.

- **Primary Radius:** A consistent 16px (1rem) radius is applied to buttons, input fields, and small containers. This softens the institutional feel, making the tool feel more like a modern application without losing professionalism.
- **Large Containers:** Cards and modals may use up to 32px (2rem) to feel more substantial and distinct.
- **Motifs:** Subtle Navy-colored stars or the school cross should be used as background watermarks or small iconography details (16px - 24px) to reinforce the Catholic identity without cluttering the functional space.

## Components

- **Buttons:** Primary buttons use the Royal Purple background with White text, Arimo Semi-Bold, and 16px corners. Secondary buttons use a Navy border and Navy text.
- **Input Fields:** High-trust fields with a 1px solid border (#D1D5DB) and 16px roundedness. On focus, the border transitions to Royal Purple with a 2px offset "ring" of soft purple.
- **Chips & Tags:** Designed as "Banners." They use the secondary blue or primary purple colors as backgrounds with white text and 16px rounding. For status tags (Pass/Fail), use the Ribbon shape described in the Elevation section.
- **Cards:** White background, 1px grey border, 32px roundedness. Card headers should use a sub-surface of Off-White to separate the title from the content.
- **Data Tables:** Clean rows with Archivo Narrow typography. Alternate row striping using the Warm Off-White color. Headers are Navy Blue with White Domine labels.
- **Navigation:** A vertical sidebar in Royal Navy Blue. Icons should be thin-stroke (2px) and professional. Active states are indicated by a Magenta vertical line on the left edge of the menu item.