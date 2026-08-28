import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUIPreferences } from '../../context/UIPreferences.jsx';

// Where "My Profile" / "Settings" land for each portal. Student and Parent
// already have real, dedicated pages; every other portal shares one generic
// account page (identity + password/sessions) since none of them have any
// personal-account page of their own yet.
const DESTINATIONS = {
  student: { profile: '/student/profile', settings: '/student/settings' },
  parent: { profile: '/parent/profile', settings: '/parent/settings' },
};
const GENERIC_ACCOUNT_PATH = {
  superAdmin: '/super-admin/account',
  admin: '/admin/account',
  bursary: '/bursary/account',
  teacher: '/staff/teacher/account',
  classTeacher: '/staff/class-teacher/account',
  examOfficer: '/staff/exam-officer/account',
  libraryAttendant: '/staff/library/account',
};

export default function ProfileMenu({ portalId }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, focusMode, toggleFocusMode } = useUIPreferences();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onEscape);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const dest = DESTINATIONS[portalId];
  const genericPath = GENERIC_ACCOUNT_PATH[portalId];
  const initials = user?.full_name?.match(/\b\w/g)?.slice(0, 2).join('').toUpperCase();

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Account menu" className="rounded-full">
        <Avatar alt={user?.full_name} fallbackInitials={initials} size="sm" className="ml-xs" />
      </button>
      {open && (
        <div className="absolute right-0 mt-sm w-64 bg-surface-container-lowest border border-outline/10 rounded-lg shadow-lg z-40 overflow-hidden">
          <div className="px-md py-md border-b border-outline/10">
            <p className="font-label-md text-label-md font-bold text-on-surface truncate">{user?.full_name || 'Account'}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user?.email || user?.identifier || ''}</p>
          </div>
          <div className="py-xs">
            {dest ? (
              <>
                <button type="button" onClick={() => goTo(dest.profile)} className="w-full flex items-center gap-sm px-md py-sm text-left hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
                  <span className="font-body-md text-body-md text-on-surface">My Profile</span>
                </button>
                <button type="button" onClick={() => goTo(dest.settings)} className="w-full flex items-center gap-sm px-md py-sm text-left hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">settings</span>
                  <span className="font-body-md text-body-md text-on-surface">Settings</span>
                </button>
              </>
            ) : genericPath ? (
              <button type="button" onClick={() => goTo(genericPath)} className="w-full flex items-center gap-sm px-md py-sm text-left hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">manage_accounts</span>
                <span className="font-body-md text-body-md text-on-surface">My Account</span>
              </button>
            ) : null}
            <button type="button" onClick={toggleTheme} className="w-full flex items-center justify-between gap-sm px-md py-sm text-left hover:bg-surface-container-low transition-colors">
              <span className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{isDark ? 'dark_mode' : 'light_mode'}</span>
                <span className="font-body-md text-body-md text-on-surface">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
              <span className="font-label-sm text-label-sm text-primary">Switch</span>
            </button>
            <button type="button" onClick={toggleFocusMode} className="w-full flex items-center justify-between gap-sm px-md py-sm text-left hover:bg-surface-container-low transition-colors">
              <span className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">center_focus_strong</span>
                <span className="font-body-md text-body-md text-on-surface">Focus Mode</span>
              </span>
              <span className="font-label-sm text-label-sm text-primary">{focusMode ? 'On' : 'Off'}</span>
            </button>
          </div>
          <div className="py-xs border-t border-outline/10">
            <button type="button" onClick={handleSignOut} className="w-full flex items-center gap-sm px-md py-sm text-left hover:bg-error-container/20 transition-colors">
              <span className="material-symbols-outlined text-error text-[20px]">logout</span>
              <span className="font-body-md text-body-md text-error">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
