import React from 'react';
import { PRIZE_LADDER, formatSamvarPoints } from '../game/rules';
import { ShieldCheck, Sparkles, Check } from 'lucide-react';

interface PrizeLadderSidebarProps {
  currentLevel: number;
  compact?: boolean;
}

export const PrizeLadderSidebar: React.FC<PrizeLadderSidebarProps> = ({
  currentLevel,
  compact = false,
}) => {
  // Show Q11 at the top, Q1 at the bottom
  const reversedLadder = [...PRIZE_LADDER].reverse();

  return (
    <div
      className={`bg-slate-950/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col justify-between shadow-2xl backdrop-blur-md ${
        compact ? 'w-full' : 'w-72'
      }`}
    >
      <div className="text-center pb-2 mb-2 border-b border-amber-500/20">
        <span className="text-[11px] font-bold tracking-widest text-amber-400 font-cinzel uppercase">
          Samvar Ladder
        </span>
      </div>

      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        {reversedLadder.map((step) => {
          const isCurrent = step.level === currentLevel;
          const isPassed = step.level < currentLevel;
          const isTopPrize = step.level === 11;

          let bgClass = 'bg-slate-900/40 text-slate-400 border border-slate-800/60';
          if (isCurrent) {
            bgClass = 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold border-amber-300 shadow-lg scale-[1.02] gold-glow';
          } else if (isPassed) {
            bgClass = 'bg-amber-950/20 text-amber-300/80 border border-amber-500/20';
          } else if (step.isGuaranteed) {
            bgClass = 'bg-slate-900/80 text-amber-200 border border-amber-500/40 font-semibold';
          } else if (isTopPrize) {
            bgClass = 'bg-amber-950/40 text-amber-300 border border-amber-500/50 font-bold';
          }

          return (
            <div
              key={step.level}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all duration-300 ${bgClass}`}
            >
              <div className="flex items-center gap-1.5">
                {isPassed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : step.isGuaranteed ? (
                  <ShieldCheck className={`w-3.5 h-3.5 ${isCurrent ? 'text-slate-950' : 'text-amber-400'}`} />
                ) : isTopPrize ? (
                  <Sparkles className={`w-3.5 h-3.5 ${isCurrent ? 'text-slate-950' : 'text-amber-400'}`} />
                ) : (
                  <span className={`w-3.5 text-[10px] text-center font-mono ${isCurrent ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
                    {step.level}
                  </span>
                )}
                <span className="font-mono font-semibold">{step.label}</span>
              </div>

              <div className="text-right tabular-nums">
                {isTopPrize ? (
                  <span className={`font-black ${isCurrent ? 'text-slate-950' : 'text-amber-300 tracking-wider'}`}>
                    7 CRORE
                  </span>
                ) : (
                  <span>{step.displayPoints.replace(' Samvar Points', '')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 mt-2 border-t border-amber-500/20 text-[10px] text-slate-400 flex justify-between items-center px-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-amber-400" /> Milestones: Q3, Q8
        </span>
        <span className="text-amber-300 font-semibold">Max: 7 Crore</span>
      </div>
    </div>
  );
};
