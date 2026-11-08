import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Users,
  Timer,
  Award,
  Vote,
  Radio,
  KeyRound,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { PRIZE_LADDER } from '../game/rules';

export const ParticipantMobile: React.FC = () => {
  const {
    state,
    currentParticipant,
    registerParticipant,
    submitFffOrder,
    votePoll,
    connectionStatus,
    error,
    clearError,
  } = useGame();

  // Extract room from query string e.g. /join?room=KBC-108
  const [roomCodeInput, setRoomCodeInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room')?.toUpperCase() || state?.roomCode || 'KBC-108';
    }
    return 'KBC-108';
  });

  const [inputName, setInputName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [fffSubmitted, setFffSubmitted] = useState(false);
  const [votedOption, setVotedOption] = useState<string | null>(null);

  // Sync roomCode input if state arrives
  useEffect(() => {
    if (state?.roomCode && !window.location.search.includes('room=')) {
      setRoomCodeInput((prev) => prev || state.roomCode);
    }
  }, [state?.roomCode]);

  // Reset FFF selection when new question arrives or round starts
  useEffect(() => {
    setSelectedOrderIds([]);
    setFffSubmitted(false);
  }, [state?.fffQuestion?.id, state?.stage]);

  // Reset poll vote when new poll starts
  useEffect(() => {
    if (state?.lifelines?.audiencePoll?.active) {
      setVotedOption(null);
    }
  }, [state?.lifelines?.audiencePoll?.active]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setIsRegistering(true);
    await registerParticipant(inputName.trim(), roomCodeInput.trim().toUpperCase());
    setIsRegistering(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('akbc_participant');
      window.location.reload();
    } catch {}
  };

  // Tap-in-Order Selection: tap item to assign next sequence number (1, 2, 3, 4)
  const handleToggleItem = (itemId: string) => {
    if (fffSubmitted) return;
    const existingIndex = selectedOrderIds.indexOf(itemId);
    if (existingIndex !== -1) {
      // Tap again on an already selected item to unselect it and any subsequent selections
      setSelectedOrderIds((prev) => prev.slice(0, existingIndex));
    } else {
      // Add as next item in chronological/procedural order
      if (selectedOrderIds.length < 4) {
        setSelectedOrderIds((prev) => [...prev, itemId]);
      }
    }
  };

  const handleResetOrder = () => {
    if (fffSubmitted) return;
    setSelectedOrderIds([]);
  };

  const handleFffSubmit = async () => {
    if (fffSubmitted || selectedOrderIds.length !== 4) return;
    const ok = await submitFffOrder(selectedOrderIds);
    if (ok) {
      setFffSubmitted(true);
    }
  };

  const handleVote = async (opt: 'A' | 'B' | 'C' | 'D') => {
    if (votedOption) return;
    const ok = await votePoll(opt);
    if (ok) {
      setVotedOption(opt);
    }
  };

  const isFffWinner =
    state?.stage === 'FFF_WINNER' &&
    state.fffWinner?.participantId === currentParticipant?.id;

  const isAudiencePollActive = state?.lifelines?.audiencePoll?.active;
  const isFffActive = state?.stage === 'FFF_ACTIVE';
  const currentPrize = PRIZE_LADDER.find((p) => p.level === (state?.currentLadderLevel || 1));
  const activeRoomCode = state?.roomCode || 'KBC-108';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto p-4 select-none">
      {/* Mobile Top App Bar */}
      <header className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold font-cinzel text-sm">
            ॐ
          </div>
          <div>
            <h1 className="text-sm font-bold text-amber-400 font-cinzel">Adhyatmik KBC</h1>
            <span className="text-[10px] text-slate-400">Live Audience</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`}
          />
          {currentParticipant ? (
            <div className="flex items-center gap-1.5">
              <span className="text-amber-300 font-semibold truncate max-w-[100px]">
                {currentParticipant.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 p-1"
                title="Leave Room"
                aria-label="Leave Room"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-slate-400 font-mono">Room: {activeRoomCode}</span>
          )}
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-950/90 border border-rose-800 text-rose-200 text-xs p-3.5 rounded-xl mb-4 flex items-center justify-between shadow-lg">
          <span>{error}</span>
          <button onClick={clearError} className="underline text-rose-400 text-[11px] ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* WINNER SPECIAL BANNER */}
      {isFffWinner && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 p-6 rounded-2xl shadow-2xl mb-4 text-center space-y-2 animate-in zoom-in-95 duration-500 gold-glow">
          <Award className="w-12 h-12 mx-auto text-slate-950" />
          <h2 className="text-2xl font-black font-cinzel">YOU WON FASTEST FINGER FIRST!</h2>
          <p className="text-xs font-bold leading-relaxed">
            Congratulations! Please stand up and proceed directly to the Hot Seat with the Host!
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 1: PARTICIPANT ONBOARDING & ROOM CODE FORM */}
      {/* ============================================================ */}
      {!currentParticipant ? (
        <div className="flex-1 flex flex-col justify-center space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 text-2xl font-cinzel shadow-xl gold-glow">
              ॐ
            </div>
            <h2 className="text-2xl font-black text-amber-300 font-cinzel">Join the Audience</h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Look at the projector screen for the <strong>Room Code</strong>, enter your name, and take part in the show!
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 bg-slate-900/90 p-6 rounded-2xl border-2 border-amber-500/40 shadow-2xl">
            {/* Room Code Input */}
            <div>
              <label htmlFor="room-code-input" className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> 1. Arena Room Code
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. KBC-108"
                required
                className="w-full bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-3 text-base text-amber-300 font-mono font-bold uppercase tracking-widest placeholder:text-slate-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Shown prominently on the front projector screen
              </span>
            </div>

            {/* Name Input */}
            <div>
              <label htmlFor="participant-name-input" className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                2. Your Full Name
              </label>
              <input
                id="participant-name-input"
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="e.g. Aarav Shah"
                required
                minLength={2}
                maxLength={40}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering || !inputName.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl transition-transform active:scale-95 gold-glow uppercase tracking-wider"
            >
              {isRegistering ? 'Joining the show…' : 'Join the show'}
            </button>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center space-y-1">
              <span className="block font-cinzel text-amber-300">Ahimsa Paramo Dharmah</span>
              <span>No App Download Needed · Instant Live Synchronisation</span>
            </div>
          </form>
        </div>
      ) : isAudiencePollActive ? (
        /* ============================================================ */
        /* SCREEN 2: REAL AUDIENCE POLL VOTING MODE */
        /* ============================================================ */
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-4 text-center space-y-2 shadow-xl gold-glow">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-cinzel">
              <Vote className="w-4 h-4 text-amber-400 animate-bounce" /> LIVE AUDIENCE POLL
            </div>
            <h3 className="text-base font-bold text-slate-100 font-cinzel">
              Help the Hot Seat Contestant!
            </h3>
            <p className="text-xs text-slate-300">
              Cast your vote for the option you believe is spiritually correct:
            </p>
          </div>

          {/* 4 Large Hexagonal Voting Touch Pads */}
          <div className="grid grid-cols-2 gap-3.5 flex-1 py-3">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const isSelected = votedOption === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleVote(opt)}
                  disabled={!!votedOption}
                  className={`rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black border-amber-200 gold-glow scale-105'
                      : votedOption
                      ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-40'
                      : 'bg-slate-900 border-slate-700 hover:border-amber-400 text-slate-100 hover:bg-slate-850 shadow-lg'
                  }`}
                >
                  <span className="text-4xl font-black font-mono">{opt}</span>
                  <span className="text-xs font-bold tracking-wider uppercase">
                    {isSelected ? 'Your Vote' : `Vote ${opt}`}
                  </span>
                </button>
              );
            })}
          </div>

          {votedOption ? (
            <div className="bg-emerald-950/70 border-2 border-emerald-500/50 p-4 rounded-xl text-center text-xs text-emerald-200 flex items-center justify-center gap-2 shadow-lg green-glow">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Vote submitted for Option {votedOption}! Watch the percentages on the front projector.</span>
            </div>
          ) : (
            <div className="text-[11px] text-center text-slate-400">
              Tap any option above to cast your live vote once.
            </div>
          )}
        </div>
      ) : isFffActive ? (
        /* ============================================================ */
        /* SCREEN 3: FASTEST FINGER FIRST TAP-IN-ORDER MODE */
        /* ============================================================ */
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-4 text-center space-y-1.5 gold-glow">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold pb-1.5 border-b border-slate-800">
              <span className="font-cinzel tracking-wider">FASTEST FINGER FIRST</span>
              <span className="font-mono text-base bg-slate-950 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                {state?.timer.secondsRemaining}s
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 pt-1">
              {state?.fffQuestion?.question}
            </h3>
            <p className="text-[11px] text-amber-300 font-medium bg-amber-500/10 py-1 px-2 rounded-lg border border-amber-500/20">
              👉 {state?.fffQuestion?.instruction}
            </p>
          </div>

          {/* Sequence Progress Bar & Reset Button */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap font-semibold">
                Order:
              </span>
              {[0, 1, 2, 3].map((stepIdx) => {
                const itemId = selectedOrderIds[stepIdx];
                const item = state?.fffQuestion?.items.find((i) => i.id === itemId);
                const isAssigned = !!item;

                return (
                  <span
                    key={stepIdx}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1 whitespace-nowrap ${
                      isAssigned
                        ? 'bg-amber-500 text-slate-950 font-bold gold-glow'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    <span>#{stepIdx + 1}</span>
                    {isAssigned && <span className="truncate max-w-[65px]">{item.text}</span>}
                  </span>
                );
              })}
            </div>

            {selectedOrderIds.length > 0 && !fffSubmitted && (
              <button
                onClick={handleResetOrder}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 shrink-0 transition-colors"
                title="Reset Order"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* 4 Tap-in-Order Cards */}
          <div className="space-y-2.5 flex-1">
            <div className="text-[11px] text-slate-400 text-center font-medium">
              Tap items in the correct chronological or procedural order:
            </div>

            {state?.fffQuestion?.items.map((item) => {
              const selectedIndex = selectedOrderIds.indexOf(item.id);
              const isSelected = selectedIndex !== -1;
              const stepNumber = selectedIndex + 1;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleItem(item.id)}
                  disabled={fffSubmitted}
                  className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-amber-400 text-slate-100 gold-glow shadow-md'
                      : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 pr-2">
                    {/* Position Badge */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-black text-sm shrink-0 transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 gold-glow ring-2 ring-amber-300 scale-105'
                          : 'bg-slate-950 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isSelected ? stepNumber : '○'}
                    </div>

                    <span className="text-xs font-semibold leading-snug">
                      {item.text}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono shrink-0">
                    {isSelected ? (
                      <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                        STEP {stepNumber}
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {selectedOrderIds.length < 4 ? `Tap for #${selectedOrderIds.length + 1}` : ''}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Order Button */}
          {!fffSubmitted ? (
            <button
              onClick={handleFffSubmit}
              disabled={selectedOrderIds.length !== 4}
              className={`w-full py-4 rounded-xl text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all uppercase tracking-wider ${
                selectedOrderIds.length === 4
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 gold-glow cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700'
              }`}
            >
              {selectedOrderIds.length === 4
                ? 'Submit Final Order Now'
                : `Tap Order: Pick #${selectedOrderIds.length + 1} (${selectedOrderIds.length}/4 selected)`}
            </button>
          ) : (
            <div className="bg-emerald-950/70 border border-emerald-500/50 p-4 rounded-xl text-center text-xs text-emerald-200 flex items-center justify-center gap-2 shadow-lg green-glow">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Order submitted in <strong>{selectedOrderIds.length} steps</strong>! Server timestamp recorded. Watch the projector screen!
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* SCREEN 4: LOBBY & SPECTATOR MODE */
        /* ============================================================ */
        <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
          <div className="space-y-4 text-center">
            {/* Room Confirmation Badge */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-amber-300 font-cinzel">
                Welcome, {currentParticipant.name}!
              </h2>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                Connected to Room: <strong className="text-amber-400">{activeRoomCode}</strong>
              </div>
              <p className="text-xs text-slate-400 pt-1">
                {state?.stage === 'REGISTRATION'
                  ? 'You are safely in the arena lobby. Waiting for the operator to start Fastest Finger First!'
                  : state?.stage === 'FFF_WINNER'
                  ? 'Fastest Finger First finished. Watch the winner move to the Hot Seat!'
                  : 'Hot seat quiz is live! Look at the front projector screen.'}
              </p>
            </div>

            {/* How It Works Guide */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-left space-y-2 text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider block font-cinzel flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> What Happens Next on Your Phone:
              </span>
              <ul className="text-slate-300 space-y-2 text-[11px] list-disc list-inside">
                <li>
                  <strong>Fastest Finger First:</strong> The 4 items will appear here automatically. Arrange and tap Submit.
                </li>
                <li>
                  <strong>Audience Poll:</strong> If the contestant asks the audience, voting buttons A, B, C, D will instantly appear right here.
                </li>
                <li>
                  <strong>Stay Connected:</strong> Keep this browser tab open throughout the event.
                </li>
              </ul>
            </div>
          </div>

          {/* Current Question Teaser if playing */}
          {state?.activeQuestion && (
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-left space-y-1.5">
              <div className="flex justify-between text-[11px] text-amber-400 font-mono font-bold">
                <span>QUESTION {state.currentLadderLevel}</span>
                <span>{currentPrize?.displayPoints}</span>
              </div>
              <p className="text-xs text-slate-200 line-clamp-2">{state.activeQuestion.question}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
