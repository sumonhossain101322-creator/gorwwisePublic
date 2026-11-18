'use client';

import { useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ThemeContext } from '@/context/ThemeContext';
import { signOut } from 'next-auth/react';
import { FaCheckCircle } from 'react-icons/fa';
import { BsPencil } from 'react-icons/bs';
import { uploadImageFile } from '@/utils/uploadImage';
import styles from './ProfileSettings.module.css';

const emptyUser = {
  firstName: '',
  lastName: '',
  username: '',
  role: '',
  location: '',
  bio: '',
  image: '',
  coverImage: '',
  name: '',
  joined: '',
  verified: false,
  settings: {
    visibleProfile: true,
    withdrawalActivity: true,
    weeklyReport: false,
    passwordChange: true,
    dataUsageAlert: false,
    notifyComments: true,
    notifyPostActivity: true,
    notifyEmail: true,
    notifyDesktop: false,
    deactivated: false,
  },
};

export default function ProfileSettings({ user = emptyUser }) {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const titleId = useId();
  const updateRef = useRef(null);
  const closeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username || '',
    role: user.role || '',
    location: user.location || '',
    bio: user.bio || '',
    image: user.image || '',
  });
  const [settings, setSettings] = useState(user.settings || emptyUser.settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const close = () => {
    if (saving || uploading || deactivating) return;
    setOpen(false);
    setConfirmDeactivate(false);
    updateRef.current?.focus();
  };

  const busy = saving || uploading || deactivating;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape' || busyRef.current) return;
      setOpen(false);
      setConfirmDeactivate(false);
      updateRef.current?.focus();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Could not save your profile.');
      setMessage('Profile saved.');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = async (key) => {
    const next = !settings[key];
    setSettings((current) => ({ ...current, [key]: next }));
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Could not update that setting.');
      if (json.settings) setSettings(json.settings);
      if (key === 'notifyDesktop' && next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      setMessage('Setting saved.');
      router.refresh();
    } catch (err) {
      setSettings((current) => ({ ...current, [key]: !next }));
      setError(err.message || 'Could not update that setting.');
    }
  };

  const changePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const image = await uploadImageFile(file);
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Could not update your photo.');
      setForm((current) => ({ ...current, image }));
      setMessage('Profile photo updated.');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Could not update your photo.');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async () => {
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Could not remove your photo.');
      setForm((current) => ({ ...current, image: '' }));
      setMessage('Profile photo removed.');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Could not remove your photo.');
    } finally {
      setUploading(false);
    }
  };

  const deactivateAccount = async () => {
    setDeactivating(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Could not deactivate your account.');
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      setError(err.message || 'Could not deactivate your account.');
      setDeactivating(false);
    }
  };

  const displayName = [form.firstName, form.lastName].filter(Boolean).join(' ') || user.name || 'Your profile';
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <section className={styles.profilePage}>
      <div
        className={styles.cover}
        style={user.coverImage ? { backgroundImage: `url(${user.coverImage})` } : undefined}
      />
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          {form.image ? (
            <img src={form.image} alt="" className={styles.avatar} />
          ) : (
            <div className={`${styles.avatar} ${styles.avatarFallback}`} aria-hidden="true">{initial}</div>
          )}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{displayName}</h1>
            {user.verified && <FaCheckCircle className={styles.verified} aria-label="Verified" />}
          </div>
          <div className={styles.meta}>
            {form.role && <span>{form.role}</span>}
            {form.location && <span>{form.location}</span>}
            {user.joined && <span>Joined on {user.joined}</span>}
          </div>
        </div>
        <button
          ref={updateRef}
          className={styles.updateBtn}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Update
        </button>
      </div>

      {open
        ? createPortal(
        <div className={`${styles.backdrop} ${theme === 'dark' ? 'dark' : 'light'}`} onMouseDown={close}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.dialogHead}>
              <div>
                <h2 id={titleId}>Update profile</h2>
                <p className={styles.dialogDek}>Name, photo, and what readers see on your articles.</p>
              </div>
              <button ref={closeRef} type="button" className={styles.closeBtn} onClick={close}>
                Close
              </button>
            </div>

            {(message || error) && (
              <p className={`${styles.toast} ${error ? styles.toastError : ''}`} role="status">
                {error || message}
              </p>
            )}

            <form className={styles.content} onSubmit={saveProfile}>
              <div className={styles.leftColumn}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Profile</h3>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-first-name">Full name</label>
                    <div className={styles.twoInputs}>
                      <input id="profile-first-name" type="text" value={form.firstName} onChange={setField('firstName')} className={styles.input} required autoComplete="given-name" placeholder="First name" />
                      <input type="text" value={form.lastName} onChange={setField('lastName')} className={styles.input} aria-label="Last name" autoComplete="family-name" placeholder="Last name" />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-username">Username</label>
                    <div className={styles.usernameRow}>
                      <span className={styles.prefix}>@</span>
                      <input id="profile-username" type="text" value={form.username} onChange={setField('username')} className={styles.input} autoComplete="username" spellCheck={false} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Profile picture</label>
                    <div className={styles.avatarEdit}>
                      <div className={styles.photoWrap}>
                        {form.image ? (
                          <img src={form.image} alt="" className={styles.smallAvatar} />
                        ) : (
                          <div className={`${styles.smallAvatar} ${styles.avatarFallback}`} aria-hidden="true">{initial}</div>
                        )}
                        <label className={styles.editIcon}>
                          <BsPencil />
                          <span className={styles.srOnly}>{uploading ? 'Uploading photo' : 'Change profile photo'}</span>
                          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={changePhoto} disabled={uploading} hidden />
                        </label>
                      </div>
                      <button type="button" className={styles.deleteBtn} onClick={deletePhoto} disabled={uploading || !form.image}>
                        {uploading ? 'Working...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-role">Job title</label>
                    <input id="profile-role" type="text" value={form.role} onChange={setField('role')} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-location">Location</label>
                    <input id="profile-location" type="text" value={form.location} onChange={setField('location')} className={styles.input} autoComplete="address-level2" />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-bio">Bio</label>
                    <textarea id="profile-bio" className={styles.textarea} rows={4} maxLength={500} placeholder="Write your bio..." value={form.bio} onChange={setField('bio')} />
                    <p className={styles.counter}>{form.bio.length}/500</p>
                  </div>
                </div>
              </div>

              <div className={styles.rightColumn}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Profile Setting</h3>
                  <Toggle label="Visible profile to everyone" hint="Shows your name, photo, and bio on articles." checked={settings.visibleProfile} onChange={() => toggleSetting('visibleProfile')} />
                </div>

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Notifications</h3>
                  <p className={styles.note}>Choose type of notifications you want to receive</p>
                  <Toggle label="Comments on your posts" checked={settings.notifyComments} onChange={() => toggleSetting('notifyComments')} />
                  <Toggle label="Approvals and post activity" checked={settings.notifyPostActivity} onChange={() => toggleSetting('notifyPostActivity')} />
                  <Toggle label="Email me about notifications" checked={settings.notifyEmail} onChange={() => toggleSetting('notifyEmail')} />
                  <Toggle label="Desktop alerts (browser)" checked={settings.notifyDesktop} onChange={() => toggleSetting('notifyDesktop')} />
                </div>

                <div className={styles.dangerZone}>
                  <h3 className={styles.sectionTitle}>Deactivate Account</h3>
                  <p className={styles.dangerText}>
                    This signs you out and blocks future sign-in. Your published articles stay on the site under a former-member name.
                  </p>
                  {confirmDeactivate ? (
                    <div className={styles.confirmRow}>
                      <button className={styles.deactivateBtn} type="button" onClick={deactivateAccount} disabled={deactivating}>
                        {deactivating ? 'Deactivating...' : 'Yes, deactivate'}
                      </button>
                      <button className={styles.deleteBtn} type="button" onClick={() => setConfirmDeactivate(false)} disabled={deactivating}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className={styles.deactivateBtn} type="button" onClick={() => setConfirmDeactivate(true)}>
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.formFooter}>
                <button className={styles.saveBtn} type="submit" disabled={saving || uploading || deactivating}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )
        : null}
    </section>
  );
}

function Toggle({ label, hint = '', checked, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <ToggleSwitch checked={checked} onChange={onChange} label={label} />
      <span>
        {label}
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </span>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={Boolean(checked)} onChange={onChange} aria-label={label} />
      <span className={styles.slider} />
    </label>
  );
}
