import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase/config';
import { STAFF_EMAILS, STAFF_LOGIN_IDS, StaffRole } from '../auth/staffRoles';

interface StaffLoginProps {
  role: StaffRole;
  onSignedIn: () => void;
}

const roleNames: Record<StaffRole, string> = {
  admin: 'Admin',
  host: 'Host / Presenter',
  player: 'Contestant',
};

export const StaffLogin: React.FC<StaffLoginProps> = ({ role, onSignedIn }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth) {
      setError('Staff sign-in is not configured for this project yet.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, STAFF_EMAILS[role], password);
      onSignedIn();
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      setError(code === 'auth/too-many-requests'
        ? 'Too many attempts. Wait a little and try again.'
        : 'That password did not match this staff account.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="staff-login-page">
    <a className="staff-back" href="/"><ArrowLeft size={15}/> Return to audience</a>
    <form className="staff-login-card" onSubmit={handleSubmit}>
      <div className="staff-login-mark"><ShieldCheck size={22}/></div>
      <span className="staff-login-kicker">ADHYATMIK KBC · STAFF ACCESS</span>
      <h1>{roleNames[role]} sign in</h1>
      <p>This screen is for the {roleNames[role].toLowerCase()} account. Audience members can join from the home page.</p>
      <label htmlFor="staff-email">Account</label>
      <div className="staff-account-field"><KeyRound size={15}/><input id="staff-email" value={STAFF_LOGIN_IDS[role]} readOnly /></div>
      <label htmlFor="staff-password">Password</label>
      <input id="staff-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required />
      {error && <div className="staff-login-error" role="alert">{error}</div>}
      <button type="submit" disabled={busy || !password}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
      <small>Passwords are handled by Firebase Authentication.</small>
    </form>
  </main>;
};
