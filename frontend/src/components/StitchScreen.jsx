import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const logoUrl = '/mcss-logo.png';

const mobilePolishScreens = new Set([
  'Apply Status',
  'Portal Login',
  'Super Admin Dashboard',
  'School Management',
  'Staff Management',
  'Admin Dashboard',
  'Library Admin',
  'Inventory Admin',
  'Recruitment Admin',
  'Mess Admin',
  'Activity Admin',
  'Official Report Card',
  'Class Teacher Overview',
  'Exam Officer Marksheet',
  'Library Attendant',
]);

export default function StitchScreen({ title, bodyClassName, html }) {
  const screenRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${title} | MCSS Portal`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [title]);

  useEffect(() => {
    const root = screenRef.current;
    if (!root) return;

    root.querySelectorAll('img').forEach((image) => {
      const descriptor = `${image.alt || ''} ${image.dataset.alt || ''} ${image.className || ''}`.toLowerCase();
      if (descriptor.includes('crest') || descriptor.includes('logo') || descriptor.includes('school seal')) {
        image.src = logoUrl;
        image.alt = 'Mount Carmel School logo';
        image.classList.add('mcss-logo-img');
      }
    });

    const brandTargets = [
      ...root.querySelectorAll('header .flex.items-center, aside > div:first-child, aside .px-lg, aside .px-6'),
    ].filter((target) => /mount carmel|mcss portal|admin portal|secondary/i.test(target.textContent || ''));

    brandTargets.forEach((target) => {
      if (target.querySelector('.mcss-brand-logo')) return;
      target.querySelectorAll(':scope > div, :scope > span').forEach((child) => {
        if (child.matches('a, button')) return;
        const icon = child.matches('.material-symbols-outlined')
          ? child.textContent?.trim()
          : child.querySelector('.material-symbols-outlined')?.textContent?.trim();
        if (['school', 'account_balance'].includes(icon)) child.remove();
      });
      const logo = document.createElement('img');
      logo.src = logoUrl;
      logo.alt = 'Mount Carmel School logo';
      logo.className = 'mcss-brand-logo';
      target.prepend(logo);
    });

    const logos = root.querySelectorAll('.mcss-brand-logo');
    logos.forEach((logo, index) => {
      const parent = logo.parentElement;
      if (!parent) return;
      parent.querySelectorAll('.mcss-brand-logo').forEach((duplicate, duplicateIndex) => {
        if (duplicateIndex > 0) duplicate.remove();
      });
      if (index > 0 && parent.closest('header') && root.querySelector('header .mcss-brand-logo') !== logo) {
        logo.remove();
      }
    });

    const navMap = new Map([
      ['dashboard', '/admin'],
      ['home', '/'],
      ['school', '/admin/students'],
      ['group', '/admin/students'],
      ['groups', '/admin/students'],
      ['badge', '/super-admin/staff'],
      ['domain', '/super-admin/schools'],
      ['settings', '/super-admin/settings'],
      ['payments', '/bursary'],
      ['account_balance_wallet', '/bursary'],
      ['calendar_today', '/admin/activity'],
      ['event_note', '/admin/activity'],
      ['menu_book', '/admin/library'],
      ['local_library', '/admin/library'],
      ['restaurant', '/admin/mess'],
      ['directions_bus', '/admin/transport'],
      ['inventory_2', '/admin/inventory'],
      ['assignment_ind', '/admin/activity'],
      ['pending_actions', '/super-admin/applicants'],
      ['logout', '/login'],
    ]);

    root.querySelectorAll('a[href="#"]').forEach((anchor) => {
      const icon = anchor.querySelector('.material-symbols-outlined')?.textContent?.trim();
      const text = anchor.textContent?.trim().toLowerCase() || '';
      let path = icon ? navMap.get(icon) : null;
      if (!path && text.includes('student')) path = '/admin/students';
      if (!path && text.includes('staff')) path = '/super-admin/staff';
      if (!path && text.includes('school')) path = '/super-admin/schools';
      if (!path && text.includes('setting')) path = '/super-admin/settings';
      if (!path && text.includes('library')) path = '/admin/library';
      if (!path && text.includes('transport')) path = '/admin/transport';
      if (!path && text.includes('inventory')) path = '/admin/inventory';
      if (!path && text.includes('recruit')) path = '/admin/recruitment';
      if (!path && text.includes('dashboard')) path = '/admin';
      if (!path) return;

      anchor.dataset.route = path;
      anchor.addEventListener('click', (event) => {
        event.preventDefault();
        navigate(path);
      });
    });

    const revealElements = [...root.querySelectorAll('.reveal')];
    let observer;
    if ('IntersectionObserver' in window && revealElements.length > 0) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('active');
          });
        },
        { threshold: 0.1 },
      );
      revealElements.forEach((element) => observer.observe(element));
    } else {
      revealElements.forEach((element) => element.classList.add('active'));
    }

    const menuToggle = root.querySelector('#menu-toggle');
    const menuClose = root.querySelector('#menu-close');
    const mobileMenu = root.querySelector('#mobile-menu');
    const openMenu = () => {
      mobileMenu?.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
      mobileMenu?.classList.remove('active');
      document.body.style.overflow = '';
    };
    menuToggle?.addEventListener('click', openMenu);
    menuClose?.addEventListener('click', closeMenu);

    const header = root.querySelector('header');
    const handleScroll = () => {
      if (!header) return;
      header.classList.toggle('shadow-lg', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer?.disconnect();
      menuToggle?.removeEventListener('click', openMenu);
      menuClose?.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = '';
    };
  }, [html, navigate]);

  return (
    <main
      ref={screenRef}
      className={`stitch-screen ${mobilePolishScreens.has(title) ? 'needs-mobile-polish' : ''} ${bodyClassName || ''}`}
      data-screen-title={title}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
