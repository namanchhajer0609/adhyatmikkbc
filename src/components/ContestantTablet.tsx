import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PrizeLadderSidebar } from './PrizeLadderSidebar';
import { AudiencePollBar } from './AudiencePollBar';
import {
  Lock,
  LogOut,
  HelpCircle,
  Timer,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { PRIZE_LADDER, formatSamvarPoints } from '../game/rules';

export const ContestantTablet: React.FC = () => {
  const {
    state,
    contestantSelectOption,
    contestantConfirmAnswer,
    contestantQuit,
  } = useGame();

  const [showQuitModal, setShowQuitModal] = useState(false);
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);

  const currentLevel = state?.currentLadderLevel || 1;
  const currentPrize = PRIZE_LADDER.find((p) => p.level === currentLevel);
  const activeQ = state?.activeQuestion;
  const isLocked = state?.stage === 'ANSWER_LOCKED' || state?.stage === 'ANSWER_REVEALED';
  const isRevealed = state?.stage === 'ANSWER_REVEALED';

  const handleSelect = async (optId: 'A' | 'B' | 'C' | 'D') => {
    if (isLocked || state?.stage !== 'QUESTION_ACTIVE') return;
    await contestantSelectOption(optId);
  };

  const handleConfirmLock = async () => {
    if (!state?.selectedOption || isLocked) return;
    setIsSubmittingLock(true);
    await contestantConfirmAnswer();
    setIsSubmittingLock(false);
  };

  const handleConfirmQuit = async () => {
    await contestantQuit();
    setShowQuitModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 max-w-6xl mx-auto space-y-6">
      {/* Contestant Tablet Header */}
      <header className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold font-cinzel">
            ॐ
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-400 font-cinzel">
              Contestant Hot Seat · {state?.hotSeatContestant?.name || 'Contestant'}
            </h1>
            <span className="text-xs text-slate-400">Tablet Screen · Touch to Select Answer</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">PRIZE AT STAKE</span>
            <span className="text-base font-bold text-amber-300 font-mono">
              {currentPrize?.displayPoints}
            </span>
          </div>

          <button
            onClick={() => setShowQuitModal(true)}
            disabled={isLocked && state?.stage !== 'QUESTION_ACTIVE'}
            className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quit with Points</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Question + Options + Prize Ladder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        {/* Left 2 Cols: Question & Touch Options */}
        <div className="lg:col-span-2 space-y-6">
          {activeQ ? (
            <div className="bg-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 text-xs">
                <span className="text-amber-400 font-bold uppercase tracking-wider font-cinzel">
                  Question {activeQ.ladderLevel} · {activeQ.category}
                </span>

                {state?.timer.timerMode === 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-300 font-cinzel text-xs bg-slate-950 px-3 py-1 rounded-full border border-amber-500/40">
                    <span className="font-mono text-base font-bold">∞</span>
                    <span>Untimed</span>
                  </div>
                ) : (
                  state?.timer.isRunning && (
                    <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-sm bg-slate-950 px-3 py-1 rounded-full border border-amber-500/40">
                      <Timer className="w-4 h-4 animate-pulse" />
                      <span>{state.timer.secondsRemaining}s</span>
                    </div>
                  )
                )}
              </div>

              <h2 className="text-2xl font-bold text-slate-100 font-cinzel leading-relaxed">
                {activeQ.question}
              </h2>

              {/* Audience Poll Results if Active */}
              {state?.lifelines.audiencePoll.active && (
                <AudiencePollBar
                  percentages={state.lifelines.audiencePoll.percentages}
                  totalVotes={state.lifelines.audiencePoll.totalVotes}
                  secondsRemaining={state.lifelines.audiencePoll.secondsRemaining}
                  isActive={true}
                />
              )}

              {/* 4 Authentic KBC Hexagonal Touch Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeQ.options.map((opt) => {
                  const is5050Hidden =
                    state?.lifelines.fiftyFifty.active &&
                    state.lifelines.fiftyFifty.hiddenOptions.includes(opt.id);
                  const isSelected = state?.selectedOption === opt.id;
                  const isCorrect = isRevealed && opt.id === activeQ.correctOption;
                  const isWrong = isRevealed && isSelected && !isCorrect;

                  if (is5050Hidden) {
                    return (
                      <div
                        key={opt.id}
                        className="opacity-0 pointer-events-none h-20"
                      />
                    );
                  }

                  let borderClass = 'kbc-hex-border';
                  let innerClass = 'kbc-hex-inner p-5 flex items-center gap-4 text-left cursor-pointer transition-all active:scale-95';
                  let badgeClass = 'bg-slate-900 text-amber-300 border border-slate-700';

                  if (isCorrect) {
                    borderClass = 'kbc-hex-border green-glow animate-pulse';
                    innerClass = 'kbc-hex-inner p-5 flex items-center gap-4 text-left bg-emerald-950 text-emerald-100';
                    badgeClass = 'bg-emerald-500 text-slate-950 font-black';
                  } else if (isWrong) {
                    borderClass = 'kbc-hex-border red-glow';
                    innerClass = 'kbc-hex-inner p-5 flex items-center gap-4 text-left bg-rose-950 text-rose-100';
                    badgeClass = 'bg-rose-500 text-white font-black';
                  } else if (isLocked && isSelected) {
                    borderClass = 'kbc-hex-border gold-glow-intense';
                    innerClass = 'kbc-hex-inner p-5 flex items-center gap-4 text-left bg-amber-600 text-slate-950 font-bold';
                    badgeClass = 'bg-slate-950 text-amber-300 font-black';
                  } else if (isSelected) {
                    borderClass = 'kbc-hex-border gold-glow';
                    innerClass = 'kbc-hex-inner p-5 flex items-center gap-4 text-left bg-amber-950/80 text-amber-200 animate-pulse';
                    badgeClass = 'bg-amber-400 text-slate-950 font-black';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      className={`${borderClass} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={innerClass}>
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-base shrink-0 ${badgeClass}`}
                        >
                          {opt.id}
                        </span>
                        <span className="text-base font-semibold">{opt.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm / Lock Answer Action Bar */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {isLocked ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <Lock className="w-4 h-4" /> Answer Locked on Option {state?.selectedOption}
                    </span>
                  ) : state?.selectedOption ? (
                    <span className="text-amber-300">
                      Option {state.selectedOption} selected. Click Confirm to lock.
                    </span>
                  ) : (
                    <span>Tap any option above to make your selection.</span>
                  )}
                </div>

                {!isLocked && state?.selectedOption && (
                  <button
                    onClick={handleConfirmLock}
                    disabled={isSubmittingLock}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl flex items-center gap-2 gold-glow transition-all active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock Answer ({state.selectedOption})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <h2 className="text-xl font-bold text-amber-400 font-cinzel mb-2">Welcome to the Hot Seat</h2>
              <p className="text-sm">The operator is preparing the question on the host screen...</p>
            </div>
          )}
        </div>

        {/* Right Col: Prize Ladder Sidebar */}
        <div>
          <PrizeLadderSidebar currentLevel={currentLevel} />
        </div>
      </div>

      {/* QUIT CONFIRMATION MODAL */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 font-cinzel">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Confirm Walk Away / Quit
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              Are you sure you wish to quit? You will walk away with the Samvar Points of your LAST correctly answered question:{' '}
              <strong className="text-amber-400">
                {currentLevel > 1 ? PRIZE_LADDER[currentLevel - 2].displayPoints : '0 Points'}
              </strong>
              .
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowQuitModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Continue Playing
              </button>
              <button
                onClick={handleConfirmQuit}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg"
              >
                Yes, Quit with Points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
