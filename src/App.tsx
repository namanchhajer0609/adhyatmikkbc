import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { AdminPanel } from './components/AdminPanel';
import { ProjectorDisplay } from './components/ProjectorDisplay';
import { HostTablet } from './components/HostTablet';
import { ContestantTablet } from './components/ContestantTablet';
import { ParticipantMobile } from './components/ParticipantMobile';
// The public default view is the audience join experience.
import { StaffRouteGate } from './components/StaffRouteGate';
import { protectedRoleForPath } from './auth/staffRoles';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.toLowerCase();
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderCurrentView = () => {
    if (currentPath.startsWith('/admin')) {
      return <AdminPanel />;
    }
    if (currentPath.startsWith('/projector')) {
      return <ProjectorDisplay />;
    }
    if (currentPath.startsWith('/host')) {
      return <HostTablet />;
    }
    if (currentPath.startsWith('/contestant')) {
      return <ContestantTablet />;
    }
    if (currentPath.startsWith('/join')) {
      return <ParticipantMobile />;
    }
    return <ParticipantMobile />;
  };

  const staffRole = protectedRoleForPath(currentPath);

  return (
    <GameProvider>
      <div className={`app-shell view-${currentPath.split("/")[1] || "home"}`}>
        <div className="flex-1">
          {staffRole
            ? <StaffRouteGate role={staffRole}>{renderCurrentView()}</StaffRouteGate>
            : renderCurrentView()}
        </div>
      </div>
    </GameProvider>
  );
}
