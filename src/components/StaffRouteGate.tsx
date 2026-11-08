import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { LogOut, LoaderCircle } from 'lucide-react';
import { auth } from '../firebase/config';
import { StaffLogin } from './StaffLogin';
import { STAFF_EMAILS, StaffRole } from '../auth/staffRoles';

export const StaffRouteGate: React.FC<{ role: StaffRole; children: React.ReactNode }> = ({ role, children }) => {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [authReady, setAuthReady] = useState(!auth);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, nextUser => {
      setUser(nextUser);
      setAuthorized(false);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setAuthorized(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    const isRoleAccount = user.email?.trim().toLowerCase() === STAFF_EMAILS[role].toLowerCase();
    setAuthorized(isRoleAccount);
    setChecking(false);
    if (!isRoleAccount && auth) void signOut(auth);
  }, [user, role]);

  if (!authReady || checking) return <div className="staff-auth-loading"><LoaderCircle size={22} className="spin"/><span>Checking staff access…</span></div>;
  if (!authorized) return <StaffLogin role={role} onSignedIn={() => { setUser(auth?.currentUser ?? null); }} />;
  return <div className="staff-protected-shell"><div className="staff-session"><span>{user?.email}</span><button onClick={() => auth && signOut(auth)}><LogOut size={14}/> Sign out</button></div>{children}</div>;
};
