import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { PrizeLadderSidebar } from './PrizeLadderSidebar';
import { AudiencePollBar } from './AudiencePollBar';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Users,
  Timer,
  Maximize2,
  Minimize2,
  Award,
  BarChart3,
  X,
  Radio,
  BookOpen,
} from 'lucide-react';
import { formatSamvarPoints, PRIZE_LADDER } from '../game/rules';

export const ProjectorDisplay: React.FC = () => {
  const { state } = useGame();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const roomCode = state?.roomCode || 'KBC-108';

  // Generate high-resolution QR code with embedded room code
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const joinUrl = `${origin}/join?room=${encodeURIComponent(roomCode)}`;

    QRCode.toDataURL(joinUrl, {
      width: 440,
      margin: 2,
      color: {
        dark: '#030718',
        light: '#fbbf24',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [roomCode]);

  // Trigger celebratory confetti on FFF Winner or 7 Crore Win!
  useEffect(() => {
    if (state?.stage === 'FFF_WINNER' || state?.stage === 'GAME_COMPLETED') {
      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#34d399', '#ffffff', '#60a5fa'],
        });
      } catch {
        // fallback
      }
    }
  }, [state?.stage]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentLevel = state?.currentLadderLevel || 1;
  const currentPrize = PRIZE_LADDER.find((p) => p.level === currentLevel);
  const activeQ = state?.activeQuestion;
  const is5050Active = state?.lifelines.fiftyFifty.active;
  const hidden5050 = state?.lifelines.fiftyFifty.hiddenOptions || [];

  return (
    <div
      ref={containerRef}
      className="min-h-screen kbc-studio-bg text-slate-100 flex flex-col justify-between relative overflow-hidden select-none"
    >
      {/* Background KBC Studio Light Beams & Mandala Geometry */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Central KBC Rotating Gold Ring */}
        <div className="w-[900px] h-[900px] rounded-full border-[10px] border-amber-500/10 animate-spin [animation-duration:220s]" />
        <div className="absolute w-[700px] h-[700px] rounded-full border-[4px] border-amber-400/15 animate-spin [animation-duration:140s] [animation-direction:reverse]" />
        <div className="absolute w-[500px] h-[500px] rounded-full border border-blue-400/20" />

        {/* Studio Diagonal Light Rays */}
        <div className="absolute top-0 left-1/4 w-32 h-[120vh] bg-gradient-to-b from-blue-500/10 via-amber-500/5 to-transparent -rotate-45 blur-2xl" />
        <div className="absolute top-0 right-1/4 w-32 h-[120vh] bg-gradient-to-b from-blue-500/10 via-amber-500/5 to-transparent rotate-45 blur-2xl" />
      </div>

      {/* TOP KBC STUDIO BANNER */}
      <header className="px-10 py-4 flex items-center justify-between z-20 border-b border-amber-500/25 bg-slate-950/80 backdrop-blur-md">
        {/* Left: TV Logo Emblem */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-3xl font-cinzel shadow-xl gold-glow">
            ॐ
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-400 font-cinzel tracking-wider drop-shadow-md">
              ADHYATMIK KBC
            </h1>
            <span className="text-[11px] font-bold tracking-widest text-amber-400/90 uppercase block font-cinzel">
              Spiritual Quiz Show · Live Arena
            </span>
          </div>
        </div>

        {/* Center: Contestant & Current Stake Ribbon */}
        {state?.hotSeatContestant && state.stage !== 'REGISTRATION' ? (
          <div className="bg-slate-900/90 border border-amber-500/50 rounded-2xl px-6 py-2 flex items-center gap-6 shadow-2xl">
            <div>
              <span className="text-[10px] text-amber-400/80 font-bold block uppercase tracking-wider font-cinzel">
                Hot Seat Contestant
              </span>
              <strong className="text-xl font-black text-slate-100 font-cinzel">
                {state.hotSeatContestant.name}
              </strong>
            </div>
            <div className="h-8 w-px bg-amber-500/30" />
            <div>
              <span className="text-[10px] text-amber-400/80 font-bold block uppercase tracking-wider font-cinzel">
                Achieved Points
              </span>
              <strong className="text-xl font-mono font-bold text-emerald-400">
                {formatSamvarPoints(state.hotSeatContestant.pointsWon)}
              </strong>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-amber-500/40 rounded-xl px-4 py-1.5 flex items-center gap-3">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              Live Room Code: <strong className="text-amber-300 font-mono tracking-widest text-sm">{roomCode}</strong>
            </span>
          </div>
        )}

        {/* Right: Circular KBC Lifeline Discs & Fullscreen */}
        <div className="flex items-center gap-5">
          {state?.stage.startsWith('QUESTION') || state?.stage.startsWith('ANSWER') ? (
            <div className="flex items-center gap-3">
              {/* Lifeline 1: 50:50 */}
              <div
                title="50:50 Lifeline"
                className={`kbc-lifeline ${
                  state.lifelines.fiftyFifty.used
                    ? 'kbc-lifeline-used'
                    : state.lifelines.fiftyFifty.active
                    ? 'kbc-lifeline-active'
                    : ''
                }`}
              >
                <span className="font-bold font-mono text-xs text-amber-300">50:50</span>
                {state.lifelines.fiftyFifty.used && (
                  <X className="w-8 h-8 text-rose-500 absolute stroke-[3]" />
                )}
              </div>

              {/* Lifeline 2: Ask Maharaj */}
              <div
                title="Ask the Maharaj"
                className={`kbc-lifeline ${
                  state.lifelines.askMaharaj.used
                    ? 'kbc-lifeline-used'
                    : state.lifelines.askMaharaj.active
                    ? 'kbc-lifeline-active'
                    : ''
                }`}
              >
                <span className="font-bold font-cinzel text-[10px] text-center text-amber-300 leading-tight">
                  GURU
                </span>
                {state.lifelines.askMaharaj.used && (
                  <X className="w-8 h-8 text-rose-500 absolute stroke-[3]" />
                )}
              </div>

              {/* Lifeline 3: Audience Poll */}
              <div
                title="Audience Poll"
                className={`kbc-lifeline ${
                  state.lifelines.audiencePoll.used
                    ? 'kbc-lifeline-used'
                    : state.lifelines.audiencePoll.active
                    ? 'kbc-lifeline-active'
                    : ''
                }`}
              >
                <BarChart3 className="w-6 h-6 text-amber-300" />
                {state.lifelines.audiencePoll.used && (
                  <X className="w-8 h-8 text-rose-500 absolute stroke-[3]" />
                )}
              </div>
            </div>
          ) : null}

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-amber-500/40 transition-colors"
            title="Toggle Fullscreen (F11)"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MAIN SHOW VIEWPORT */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-10 z-10">
        {/* ============================================================ */}
        {/* STAGE 1: AUDIENCE REGISTRATION & ROOM CODE SHOWCASE */}
        {/* ============================================================ */}
        {state?.stage === 'REGISTRATION' && (
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/80 border-2 border-amber-500/50 rounded-3xl p-8 lg:p-12 shadow-2xl backdrop-blur-xl relative">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/40">
                <Sparkles className="w-4 h-4 text-amber-400" /> Live In-Person Quiz Arena
              </div>

              <h2 className="text-4xl lg:text-5xl font-black text-amber-200 font-cinzel leading-tight drop-shadow-md">
                Scan or Enter Code on Your Smartphone
              </h2>

              {/* GIANT PROMINENT ROOM CODE DISPLAY */}
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border-2 border-amber-400/80 rounded-2xl p-6 shadow-2xl gold-glow space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-cinzel block">
                  OFFICIAL ARENA ROOM CODE
                </span>
                <div className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-amber-400 font-mono tracking-widest">
                  {roomCode}
                </div>
                <div className="text-xs text-slate-300 font-medium pt-1">
                  Visit URL:{' '}
                  <strong className="text-amber-300 font-mono text-sm underline">
                    {typeof window !== 'undefined' ? `${window.location.origin}/join` : '/join'}
                  </strong>
                </div>
              </div>

              {/* 3 Step Join Instructions */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-1.5 font-mono">
                    1
                  </span>
                  <span className="font-semibold text-slate-200 block">Open URL / Scan</span>
                  <span className="text-[11px] text-slate-400">Open /join in browser</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-1.5 font-mono">
                    2
                  </span>
                  <span className="font-semibold text-slate-200 block">Enter Code</span>
                  <span className="text-[11px] text-amber-300 font-mono font-bold">{roomCode}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-1.5 font-mono">
                    3
                  </span>
                  <span className="font-semibold text-slate-200 block">Ready to Play</span>
                  <span className="text-[11px] text-slate-400">Fastest Finger First</span>
                </div>
              </div>

              {/* Live Count Counter */}
              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-amber-500/30">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    SEEKERS CONNECTED TO ROOM
                  </span>
                  <div className="text-3xl font-black text-amber-400 font-mono tabular-nums">
                    {state.participantCount}{' '}
                    <span className="text-sm text-slate-400 font-normal">Participants in Lobby</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Giant QR Code Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border-2 border-amber-400 shadow-2xl gold-glow-intense">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Scan to join Room ${roomCode}`}
                  className="w-72 h-72 rounded-xl object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-72 h-72 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                  Generating QR Code...
                </div>
              )}
              <div className="mt-4 text-center">
                <span className="text-sm font-bold text-amber-300 uppercase tracking-widest font-cinzel block">
                  Scan with Camera App
                </span>
                <span className="text-[11px] text-slate-400">Auto-joins Room: {roomCode}</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 2: FASTEST FINGER FIRST */}
        {/* ============================================================ */}
        {(state?.stage === 'FFF_INTRO' || state?.stage === 'FFF_ACTIVE') && (
          <div className="max-w-5xl w-full text-center space-y-8 bg-slate-900/90 border-2 border-amber-500/60 rounded-3xl p-10 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 text-amber-300 text-sm font-bold uppercase tracking-wider border border-amber-500/50 gold-glow">
              <Sparkles className="w-4 h-4 text-amber-400" /> FASTEST FINGER FIRST ROUND
            </div>

            <h2 className="text-3xl lg:text-4xl font-black text-amber-200 font-cinzel leading-snug">
              {state.fffQuestion.question}
            </h2>

            <p className="text-base text-amber-300 font-medium font-cinzel">
              {state.fffQuestion.instruction}
            </p>

            {/* TV Countdown Timer */}
            {state.stage === 'FFF_ACTIVE' && (
              <div className="flex items-center justify-center gap-3 text-3xl font-mono font-black text-amber-400">
                <Timer className="w-8 h-8 animate-pulse" />
                <span>{state.timer.secondsRemaining}s</span>
              </div>
            )}

            {/* 4 Hexagonal KBC Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {state.fffQuestion.items.map((item, idx) => (
                <div key={item.id} className="kbc-hex-border shadow-xl">
                  <div className="kbc-hex-inner px-8 py-5 flex items-center gap-4">
                    <span className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono text-base shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xl font-bold text-slate-100">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              {state.stage === 'FFF_ACTIVE'
                ? 'All participants are submitting on their smartphones now...'
                : 'Get ready. The round will begin on the host prompt.'}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 3: FASTEST FINGER FIRST WINNER */}
        {/* ============================================================ */}
        {state?.stage === 'FFF_WINNER' && state.fffWinner && (
          <div className="max-w-3xl w-full text-center space-y-6 bg-slate-900/95 border-4 border-amber-400 rounded-3xl p-12 shadow-2xl gold-glow-intense backdrop-blur-2xl animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 text-slate-950 flex items-center justify-center shadow-2xl gold-glow">
              <Award className="w-12 h-12" />
            </div>

            <span className="text-sm font-bold text-amber-400 uppercase tracking-widest block font-cinzel">
              FASTEST FINGER FIRST WINNER
            </span>

            <h2 className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-400 font-cinzel">
              {state.fffWinner.name}
            </h2>

            <div className="inline-block px-6 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-300 font-mono text-lg font-bold">
              Time: {(state.fffWinner.timeTakenMs / 1000).toFixed(2)} seconds
            </div>

            <p className="text-xl text-slate-200 pt-2 font-cinzel font-semibold">
              Please proceed to the Hot Seat to play for 7 Crore Samvar Points!
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 4: HOT SEAT INTRO */}
        {/* ============================================================ */}
        {state?.stage === 'HOT_SEAT_INTRO' && state.hotSeatContestant && (
          <div className="max-w-3xl w-full text-center space-y-8 bg-slate-900/90 border-2 border-amber-500/60 rounded-3xl p-12 shadow-2xl backdrop-blur-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block font-cinzel">
              WELCOME TO THE HOT SEAT
            </span>
            <h2 className="text-5xl lg:text-6xl font-black text-amber-300 font-cinzel">
              {state.hotSeatContestant.name}
            </h2>
            <p className="text-lg text-slate-200">
              11 Spiritual Questions · 2 Guaranteed Milestones (Q3: 10,000 & Q8: 25 Lakh)
            </p>
            <div className="text-3xl font-black text-amber-400 font-cinzel gold-glow inline-block px-8 py-3 rounded-2xl bg-slate-950 border border-amber-500/40">
              TARGET: 7 CRORE SAMVAR POINTS
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 5: ACTIVE HOT SEAT QUESTION / LOCKED / REVEALED */}
        {/* ============================================================ */}
        {(state?.stage === 'QUESTION_ACTIVE' ||
          state?.stage === 'ANSWER_LOCKED' ||
          state?.stage === 'ANSWER_REVEALED') &&
          activeQ && (
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Question & 4 Hexagonal Options (3 Columns) */}
              <div className="lg:col-span-3 space-y-6">
                {/* ICONIC KBC POINTED HEXAGON QUESTION CARD */}
                <div className="relative">
                  {/* Studio Horizontal Neon Laser Line passing through the Question */}
                  <div className="absolute -left-12 -right-12 top-1/2 -translate-y-1/2 kbc-line z-0 pointer-events-none" />

                  <div className="kbc-hex-border shadow-2xl relative z-10 gold-glow">
                    <div className="kbc-hex-inner px-12 py-8 text-center space-y-4">
                      {/* Top Header inside Question */}
                      <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 text-xs">
                        <span className="font-bold text-amber-400 font-cinzel tracking-wider uppercase">
                          Question {activeQ.ladderLevel} of 11 · {activeQ.category}
                        </span>

                        {state.stage === 'QUESTION_ACTIVE' && (
                          state.timer.timerMode === 0 ? (
                            <div className="bg-slate-950/90 border border-amber-500/40 px-4 py-1 rounded-full flex items-center gap-1.5 text-amber-300 font-cinzel text-xs shadow-md">
                              <span className="text-base font-bold leading-none font-mono">∞</span>
                              <span className="tracking-wider">Untimed Question</span>
                            </div>
                          ) : (
                            <div className="bg-slate-950 border border-amber-500/60 px-4 py-1 rounded-full flex items-center gap-2 text-amber-300 font-mono font-bold text-sm shadow-md">
                              <Timer className="w-4 h-4 animate-pulse text-amber-400" />
                              <span>{state.timer.secondsRemaining}s</span>
                            </div>
                          )
                        )}

                        <span className="font-black text-amber-300 font-mono text-base tabular-nums">
                          {currentPrize?.displayPoints}
                        </span>
                      </div>

                      {/* Main Question Text */}
                      <p className="text-2xl lg:text-3xl font-bold text-slate-100 font-cinzel leading-relaxed px-4">
                        {activeQ.question}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Audience Poll Chart Overlay if Active */}
                {state.lifelines.audiencePoll.active && (
                  <AudiencePollBar
                    percentages={state.lifelines.audiencePoll.percentages}
                    totalVotes={state.lifelines.audiencePoll.totalVotes}
                    secondsRemaining={state.lifelines.audiencePoll.secondsRemaining}
                    isActive={true}
                  />
                )}

                {/* THE 4 ICONIC KBC HEXAGONAL OPTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                  {/* Horizontal neon line connecting options */}
                  <div className="hidden md:block absolute -left-8 -right-8 top-1/2 -translate-y-1/2 kbc-line z-0 pointer-events-none" />

                  {activeQ.options.map((opt) => {
                    const isHiddenBy5050 = is5050Active && hidden5050.includes(opt.id);
                    const isSelected = state.selectedOption === opt.id;
                    const isLocked = state.stage === 'ANSWER_LOCKED' && isSelected;
                    const isRevealed = state.stage === 'ANSWER_REVEALED';
                    const isCorrect = isRevealed && opt.id === activeQ.correctOption;
                    const isWrongSelection = isRevealed && isSelected && !isCorrect;

                    if (isHiddenBy5050) {
                      return <div key={opt.id} className="opacity-0 pointer-events-none h-20" />;
                    }

                    // Border styling
                    let borderClass = 'kbc-hex-border shadow-xl';
                    let innerClass = 'kbc-hex-inner px-8 py-5 flex items-center gap-4 transition-all duration-300';
                    let letterBadgeClass = 'bg-slate-900 border border-amber-500/60 text-amber-300';

                    if (isCorrect) {
                      borderClass = 'kbc-hex-border green-glow animate-pulse';
                      innerClass = 'kbc-hex-inner px-8 py-5 flex items-center gap-4 bg-emerald-950/90 text-emerald-100';
                      letterBadgeClass = 'bg-emerald-500 text-slate-950 font-black';
                    } else if (isWrongSelection) {
                      borderClass = 'kbc-hex-border red-glow';
                      innerClass = 'kbc-hex-inner px-8 py-5 flex items-center gap-4 bg-rose-950/90 text-rose-100';
                      letterBadgeClass = 'bg-rose-500 text-white font-black';
                    } else if (isLocked) {
                      borderClass = 'kbc-hex-border gold-glow-intense';
                      innerClass = 'kbc-hex-inner px-8 py-5 flex items-center gap-4 bg-amber-600/90 text-slate-950 font-bold';
                      letterBadgeClass = 'bg-slate-950 text-amber-300 font-black';
                    } else if (isSelected) {
                      borderClass = 'kbc-hex-border gold-glow';
                      innerClass = 'kbc-hex-inner px-8 py-5 flex items-center gap-4 bg-amber-950/90 text-amber-200 animate-pulse';
                      letterBadgeClass = 'bg-amber-400 text-slate-950 font-black';
                    }

                    return (
                      <div key={opt.id} className={`${borderClass} relative z-10`}>
                        <div className={innerClass}>
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-lg shrink-0 ${letterBadgeClass}`}>
                            {opt.id}
                          </span>
                          <span className="text-xl font-bold leading-snug">{opt.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card once revealed */}
                {state.stage === 'ANSWER_REVEALED' && activeQ.explanation && (
                  <div className="bg-slate-900/95 border-2 border-amber-500/50 p-6 rounded-2xl text-left space-y-2 shadow-2xl animate-in fade-in duration-500 gold-glow">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block font-cinzel">
                      Spiritual Wisdom & Scriptural Explanation:
                    </span>
                    <p className="text-base text-slate-100 leading-relaxed font-serif">
                      {activeQ.explanation}
                    </p>
                    {activeQ.supportingReference && (
                      <span className="text-xs text-slate-400 block pt-1 font-mono">
                        Source Reference: {activeQ.supportingReference}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Col: KBC Tower Prize Ladder */}
              <div className="lg:col-span-1">
                <PrizeLadderSidebar currentLevel={currentLevel} />
              </div>
            </div>
          )}

        {/* ============================================================ */}
        {/* STAGE 6: QUIT SCREEN */}
        {/* ============================================================ */}
        {state?.stage === 'CONTESTANT_QUIT' && (
          <div className="max-w-3xl w-full text-center space-y-6 bg-slate-900/95 border-2 border-amber-500/60 rounded-3xl p-12 shadow-2xl gold-glow backdrop-blur-2xl">
            <span className="text-sm font-bold text-amber-400 uppercase tracking-widest block font-cinzel">
              HONOURABLE WALK AWAY
            </span>

            <h2 className="text-5xl font-black text-slate-100 font-cinzel">
              Wisdom & Contentment (Santosh)
            </h2>

            <p className="text-lg text-slate-300">
              {state.hotSeatContestant?.name} has successfully secured:
            </p>

            <div className="text-5xl font-black text-amber-400 font-mono py-2">
              {state.hotSeatContestant ? formatSamvarPoints(state.hotSeatContestant.pointsWon) : '0 Points'}
            </div>

            <p className="text-sm text-slate-400 font-cinzel">
              "Santosh lakshanam sukham" — Contentment is the supreme virtue.
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 7: 7 CRORE SUPREME CELEBRATION */}
        {/* ============================================================ */}
        {state?.stage === 'GAME_COMPLETED' && (
          <div className="max-w-4xl w-full text-center space-y-8 bg-slate-900/95 border-4 border-amber-400 rounded-3xl p-14 shadow-2xl gold-glow-intense backdrop-blur-2xl animate-in zoom-in-95 duration-700">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/30 text-amber-300 text-sm font-black uppercase tracking-widest border border-amber-400 gold-glow">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" /> HISTORIC MOMENT · 7 CRORE
            </div>

            <h2 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-400 font-cinzel tracking-wider">
              7 CRORE SAMVAR POINTS!
            </h2>

            <p className="text-3xl font-black text-amber-300 font-cinzel">
              Congratulations {state.hotSeatContestant?.name}!
            </p>

            <p className="text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
              You have attained the pinnacle of spiritual quiz mastery. May this divine knowledge illuminate your journey toward Right Faith, Right Knowledge, and Right Conduct.
            </p>

            <div className="text-base text-amber-400 font-cinzel font-black tracking-widest">
              मिच्छामि दुक्कडं · जय जिनेन्द्र
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM FOOTER RIBBON */}
      <footer className="px-10 py-3 flex items-center justify-between text-xs text-slate-400 border-t border-amber-500/20 bg-slate-950/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <span>Adhyatmik KBC · Single-Laptop Projector Display</span>
          <span>·</span>
          <span className="text-amber-300 font-mono font-bold">Room Code: {roomCode}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400/90 font-semibold font-cinzel">अहिंसा परमो धर्मः</span>
          <span>·</span>
          <span>7 Crore Samvar Points Format</span>
        </div>
      </footer>
    </div>
  );
};
