import React from 'react';
import { Tv, Shield, Mic, Tablet, Smartphone, Home } from 'lucide-react';

interface RoleNavigationHeaderProps {
  currentPath: string;
}

export const RoleNavigationHeader: React.FC<RoleNavigationHeaderProps> = ({ currentPath }) => {
  // Completely declutter dedicated operational views:
  // Projector (audience TV), Join (mobile participants), Contestant (hot-seat tablet), Host (presenter tablet), Admin (laptop operator)
  if (
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/projector') ||
    currentPath.startsWith('/join') ||
    currentPath.startsWith('/contestant') ||
    currentPath.startsWith('/host')
  ) {
    return null;
  }

  const links = [
    { path: '/', label: 'Overview', icon: Home },
    { path: '/admin', label: 'Admin (Laptop)', icon: Shield },
    { path: '/projector', label: 'Projector (HDMI)', icon: Tv },
    { path: '/host', label: 'Host (Tablet)', icon: Mic },
    { path: '/contestant', label: 'Contestant (Tablet)', icon: Tablet },
    { path: '/join', label: 'Participant (Mobile)', icon: Smartphone },
  ];

  return (
    <nav className="bg-slate-950/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="font-bold text-amber-400 font-cinzel tracking-wider">ADHYATMIK KBC</span>
        <span className="text-[10px] text-slate-500 hidden sm:inline">| Extended Display Multi-Device Architecture</span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <a
              key={item.path}
              href={item.path}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
