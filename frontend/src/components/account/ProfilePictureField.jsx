import { useRef, useState } from 'react';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, ApiError } from '../../lib/api.js';

/** Self-service profile picture — one component mounted on every account
 * type's own profile/account page (Student, Parent, and the generic
 * AccountPage every staff-type portal shares), backed by the one shared
 * accounts.User.avatar field so it works uniformly regardless of account
 * type. Refreshes AuthContext on change so the topbar's own Avatar
 * (ProfileMenu) updates immediately, without a full page reload. */
export default function ProfilePictureField() {
  const { user, refresh } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const initials = user?.full_name?.match(/\b\w/g)?.slice(0, 2).join('').toUpperCase();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/auth/me/avatar', formData);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload this image.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    setUploading(true);
    try {
      await api.delete('/auth/me/avatar');
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove your profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-lg">
      <Avatar src={user?.avatar} alt={user?.full_name} fallbackInitials={initials} size="lg" className="w-20 h-20 text-headline-sm shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sm flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : user?.avatar ? 'Replace Photo' : 'Upload Photo'}
          </Button>
          {user?.avatar && !uploading && (
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          )}
        </div>
        {!error && <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">JPG or PNG, up to 40KB.</p>}
        {error && <p className="font-label-sm text-label-sm text-error mt-1">{error}</p>}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}
