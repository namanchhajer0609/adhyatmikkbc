import React from 'react';
import { Users } from 'lucide-react';

interface AudiencePollBarProps {
  percentages: Record<string, number>;
  totalVotes: number;
  secondsRemaining?: number;
  isActive?: boolean;
}

export const AudiencePollBar: React.FC<AudiencePollBarProps> = ({
  percentages,
  totalVotes,
  secondsRemaining,
  isActive = false,
}) => {
  const options = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl backdrop-blur-lg w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-500/30">
        <div className="flex items-center gap-2 text-amber-400">
          <Users className="w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider uppercase font-cinzel">Live Audience Poll</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-300 tabular-nums">
            Votes Cast: <strong className="text-amber-400">{totalVotes}</strong>
          </span>
          {isActive && secondsRemaining !== undefined && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold animate-pulse">
              {secondsRemaining}s
            </span>
          )}
        </div>
      </div>

      {/* 4 Column vertical bar charts */}
      <div className="grid grid-cols-4 gap-4 h-48 items-end pt-4 px-2">
        {options.map((opt) => {
          const pct = percentages[opt] || 0;
          return (
            <div key={opt} className="flex flex-col items-center h-full justify-end">
              <span className="text-xs font-bold text-amber-300 mb-1.5 tabular-nums">
                {pct}%
              </span>
              <div className="w-full bg-slate-950 rounded-t-lg h-36 flex items-end p-1 border border-slate-800">
                <div
                  className="w-full bg-gradient-to-t from-amber-700 via-amber-500 to-amber-300 rounded-t transition-all duration-500 ease-out shadow-lg"
                  style={{ height: `${Math.max(4, pct)}%` }}
                />
              </div>
              <span className="mt-2 text-sm font-bold w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-mono">
                {opt}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center text-[11px] text-slate-400">
        {isActive ? 'Audience is voting live on their devices...' : 'Audience Poll Closed'}
      </div>
    </div>
  );
};
