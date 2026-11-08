import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ExtendedDisplayGuide } from './ExtendedDisplayGuide';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Users,
  Award,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Tv,
  Sparkles,
  ArrowRight,
  LogOut,
  Radio,
  PlusCircle,
  Clock,
  BookOpen,
  X,
  Check,
} from 'lucide-react';
import { formatSamvarPoints, PRIZE_LADDER } from '../game/rules';

export const AdminPanel: React.FC = () => {
  const {
    adminState,
    state,
    executeAdminAction,
    setTimerMode,
    addQuestion,
    setLadderQuestion,
    connectionStatus,
    firebaseProjectId,
    isFirebaseConnected,
    error,
    clearError,
  } = useGame();

  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [selectedFffId, setSelectedFffId] = useState<string>('fff-1');
  const [activeTab, setActiveTab] = useState<'control' | 'questions' | 'participants'>('control');

  // Question Creation Form State
  const [newQText, setNewQText] = useState('');
  const [newQOptionA, setNewQOptionA] = useState('');
  const [newQOptionB, setNewQOptionB] = useState('');
  const [newQOptionC, setNewQOptionC] = useState('');
  const [newQOptionD, setNewQOptionD] = useState('');
  const [newQCorrect, setNewQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newQLadderLevel, setNewQLadderLevel] = useState<number>(1);
  const [newQCategory, setNewQCategory] = useState('Jain Philosophy');
  const [newQDifficulty, setNewQDifficulty] = useState<'Easy' | 'Medium' | 'Challenging' | 'Expert' | 'Supreme'>('Medium');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQReference, setNewQReference] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const currentStage = state?.stage || 'REGISTRATION';
  const fullQ = adminState?.fullActiveQuestion;
  const currentLevel = state?.currentLadderLevel || 1;
  const currentPrize = PRIZE_LADDER.find((p) => p.level === currentLevel);
  const currentTimerMode = state?.timer?.timerMode ?? 45;

  const handleAction = async (action: string, payload?: Record<string, unknown>) => {
    await executeAdminAction(action, payload);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newQOptionA.trim() || !newQOptionB.trim() || !newQOptionC.trim() || !newQOptionD.trim()) {
      return;
    }
    setIsSavingQuestion(true);
    const ok = await addQuestion({
      question: newQText.trim(),
      options: [
        { id: 'A', text: newQOptionA.trim() },
        { id: 'B', text: newQOptionB.trim() },
        { id: 'C', text: newQOptionC.trim() },
        { id: 'D', text: newQOptionD.trim() },
      ],
      correctOption: newQCorrect,
      ladderLevel: Number(newQLadderLevel),
      category: newQCategory.trim(),
      difficulty: newQDifficulty,
      explanation: newQExplanation.trim() || 'Sacred spiritual principle and verified philosophy.',
      supportingReference: newQReference.trim() || undefined,
    });
    setIsSavingQuestion(false);
    if (ok) {
      setSaveSuccessMsg(true);
      setTimeout(() => {
        setSaveSuccessMsg(false);
        setShowAddQuestionModal(false);
        setNewQText('');
        setNewQOptionA('');
        setNewQOptionB('');
        setNewQOptionC('');
        setNewQOptionD('');
        setNewQExplanation('');
        setNewQReference('');
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-slate-900 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold font-cinzel text-lg shadow">
            ॐ
          </div>
          <div>
            <h1 className="text-base font-bold text-amber-400 font-cinzel tracking-wide flex items-center gap-2">
              Adhyatmik KBC — Admin Console
            </h1>
            <p className="text-[11px] text-slate-400">Single-Laptop Extended Display Controller</p>
          </div>
        </div>

        {/* Status Indicators, Add Question, & Setup Guide */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Radio
              className={`w-3.5 h-3.5 ${
                connectionStatus === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
              }`}
            />
            <span className="text-slate-300 font-mono text-[11px]">
              {connectionStatus === 'connected' ? 'Live Sync' : 'Connecting...'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/40 font-mono font-bold flex items-center gap-1.5 text-xs">
            <span className="text-[10px] text-slate-400 font-sans font-normal">ROOM:</span>
            <span className="tracking-widest text-amber-300">{state?.roomCode || 'KBC-108'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-orange-950/40 text-orange-300 border border-orange-500/40 font-mono flex items-center gap-1.5 text-xs">
            <span className="text-orange-400">🔥</span>
            <span className="text-[10px] text-slate-400 font-sans font-normal">FIREBASE:</span>
            <span className="font-bold text-orange-200">{firebaseProjectId || 'kaunbanegacrorepati'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Firestore Connected" />
          </div>

          <button
            onClick={() => setShowAddQuestionModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>

          <button
            onClick={() => handleAction('TOGGLE_SOUND')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
              state?.soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {state?.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Sound {state?.soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={() => setShowSetupGuide(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Projector Guide</span>
          </button>

          <a
            href="/projector"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-medium flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open /projector</span>
          </a>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="underline text-rose-400 hover:text-rose-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Clean Dashboard Overview Ribbon (4 clear summary cards) */}
      <section className="bg-slate-900/60 border-b border-slate-800 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">SHOW STAGE</span>
          <strong className="text-amber-400 font-mono text-sm uppercase">{currentStage.replace('_', ' ')}</strong>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">HOT SEAT CONTESTANT</span>
          <strong className="text-slate-100 text-sm truncate block">
            {state?.hotSeatContestant ? state.hotSeatContestant.name : 'None (FFF Pending)'}
          </strong>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">QUESTION & STAKES</span>
          <strong className="text-emerald-400 font-mono text-sm">
            {state?.stage.startsWith('QUESTION') || state?.stage.startsWith('ANSWER')
              ? `Q${currentLevel}: ${currentPrize?.displayPoints}`
              : 'N/A'}
          </strong>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">REGISTERED PARTICIPANTS</span>
          <strong className="text-indigo-400 font-mono text-sm flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {state?.participantCount || 0} Seekers Joined
          </strong>
        </div>
      </section>

      {/* Main Admin Tabs */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('control')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'control'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Live Show Control
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'questions'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Questions Ladder & Bank ({adminState?.questionsLadder?.length || 11})
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'participants'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Participants ({state?.participantCount || 0})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition-colors"
            >
              Reset Session
            </button>
          </div>
        </div>

        {/* TAB 1: LIVE SHOW CONTROL */}
        {activeTab === 'control' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Stage Controls, Question Runner, Lifelines */}
            <div className="lg:col-span-2 space-y-6">
              {/* SECTION 1: REGISTRATION & FASTEST FINGER FIRST */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Play className="w-4 h-4" /> Stage 1: Registration & Fastest Finger First
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Participants tap 1st to 4th in sequence
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleAction('TOGGLE_REGISTRATION')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      state?.registrationOpen
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40'
                        : 'bg-rose-600/30 text-rose-300 border-rose-500/50 hover:bg-rose-600/40'
                    }`}
                  >
                    Registration: {state?.registrationOpen ? 'OPEN' : 'CLOSED'}
                  </button>

                  <select
                    value={selectedFffId}
                    onChange={(e) => setSelectedFffId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl"
                  >
                    {adminState?.fffBank?.map((q) => (
                      <option key={q.id} value={q.id}>
                        FFF: {q.question.substring(0, 40)}...
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleAction('SET_FFF_QUESTION', { questionId: selectedFffId })}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700"
                  >
                    Load FFF on Projector
                  </button>

                  <button
                    onClick={() => handleAction('START_FFF', { duration: 30 })}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                  >
                    Start FFF Round
                  </button>

                  <button
                    onClick={() => handleAction('END_FFF')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                  >
                    Evaluate Winner
                  </button>
                </div>

                {/* FFF Winner Display */}
                {state?.fffWinner ? (
                  <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                        FASTEST FINGER FIRST WINNER DECLARED
                      </span>
                      <h3 className="text-xl font-bold text-emerald-200 font-cinzel">{state.fffWinner.name}</h3>
                      <p className="text-xs text-emerald-300/80 font-mono">
                        Time: {(state.fffWinner.timeTakenMs / 1000).toFixed(2)} seconds
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction('CONFIRM_HOT_SEAT_WINNER')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4" /> Move to Hot Seat
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>
                      FFF Submissions Logged:{' '}
                      <strong className="text-amber-400 font-mono">{adminState?.fffSubmissions?.length || 0}</strong>
                    </span>
                    <span className="text-[11px] text-slate-500">Tap-in-order sequence timestamps recorded</span>
                  </div>
                )}
              </div>

              {/* SECTION 2: HOT SEAT QUESTION RUNNER */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Stage 2: Hot Seat Question Runner
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction('START_QUESTION', { ladderLevel: currentLevel })}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                    >
                      Start Q{currentLevel}
                    </button>
                    <button
                      onClick={() => handleAction('ADVANCE_QUESTION')}
                      disabled={currentLevel >= 11}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <span>Next Q</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Secret Admin Question Preview */}
                {fullQ ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400 font-cinzel">
                        Question {fullQ.ladderLevel} · {currentPrize?.displayPoints}
                      </span>
                      <span className="text-slate-400">{fullQ.category}</span>
                    </div>

                    <p className="text-base font-semibold text-slate-100">{fullQ.question}</p>

                    {/* 4 Options with secret answer highlighted for admin */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {fullQ.options.map((opt) => {
                        const isCorrectAnswer = opt.id === fullQ.correctOption;
                        const isContestantSelected = opt.id === state?.selectedOption;
                        const isEliminatedBy5050 = state?.lifelines.fiftyFifty.hiddenOptions.includes(opt.id);

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                              isEliminatedBy5050
                                ? 'opacity-30 line-through bg-slate-950 border-slate-800'
                                : isCorrectAnswer
                                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                                : isContestantSelected
                                ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <strong className="font-mono text-sm">{opt.id}:</strong> {opt.text}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {isCorrectAnswer && (
                                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                  SECRET CORRECT
                                </span>
                              )}
                              {isContestantSelected && (
                                <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                                  CONTESTANT PICK
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <strong>Spiritual Principle:</strong> {fullQ.explanation}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                    No active question selected. Click "Start Q1" to begin the hot seat ladder.
                  </div>
                )}

                {/* Operator Answer Verification & Reveal Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => handleAction('REVEAL_ANSWER')}
                    disabled={!fullQ || state?.activeQuestionRevealed}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Reveal Correct Answer on Projector</span>
                  </button>

                  <button
                    onClick={() => setShowQuitConfirm(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Contestant Decides to Quit</span>
                  </button>
                </div>
              </div>

              {/* SECTION 3: LIFELINES OPERATION */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Lifelines Operation
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lifeline 1: 50:50 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block mb-1">50:50</span>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Eliminates 2 incorrect answers, retains correct answer.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction('ACTIVATE_FIFTY_FIFTY')}
                      disabled={state?.lifelines.fiftyFifty.used || !fullQ}
                      className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 disabled:opacity-30 border border-amber-500/40 text-xs font-bold"
                    >
                      {state?.lifelines.fiftyFifty.used ? 'USED' : 'Activate 50:50'}
                    </button>
                  </div>

                  {/* Lifeline 2: Ask the Maharaj */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block mb-1">Ask the Maharaj</span>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Physical presence in hall. Prompts host to introduce Maharaj.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction('USE_ASK_MAHARAJ')}
                      disabled={state?.lifelines.askMaharaj.used}
                      className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 disabled:opacity-30 border border-amber-500/40 text-xs font-bold"
                    >
                      {state?.lifelines.askMaharaj.used ? 'USED' : 'Mark Maharaj Used'}
                    </button>
                  </div>

                  {/* Lifeline 3: Audience Poll */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block mb-1">Audience Poll</span>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Opens live voting on participant phones (30s).
                      </p>
                    </div>
                    {state?.lifelines.audiencePoll.active ? (
                      <button
                        onClick={() => handleAction('CLOSE_AUDIENCE_POLL')}
                        className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold animate-pulse"
                      >
                        Close Voting ({state.lifelines.audiencePoll.secondsRemaining}s)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('ACTIVATE_AUDIENCE_POLL', { duration: 30 })}
                        disabled={state?.lifelines.audiencePoll.used}
                        className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 disabled:opacity-30 border border-amber-500/40 text-xs font-bold"
                      >
                        {state?.lifelines.audiencePoll.used ? 'USED' : 'Start Audience Poll'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: 3 Timer Settings Segmented Control & Prize Ladder */}
            <div className="space-y-6">
              {/* TIMER CONTROL WITH 3 DEDICATED TIME SETTINGS */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" /> 3 Time Settings
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mode:{' '}
                    <strong className="text-amber-300 font-mono">
                      {currentTimerMode === 0 ? 'No Limit (∞)' : `${currentTimerMode}s`}
                    </strong>
                  </span>
                </div>

                {/* 3 Explicit Time Setting Buttons */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTimerMode(45)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      currentTimerMode === 45
                        ? 'bg-amber-500 text-slate-950 font-black gold-glow shadow-md scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-sm font-mono">45s</span>
                    <span className="text-[10px] opacity-80">Default</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimerMode(60)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      currentTimerMode === 60
                        ? 'bg-amber-500 text-slate-950 font-black gold-glow shadow-md scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-sm font-mono">60s</span>
                    <span className="text-[10px] opacity-80">Extended</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimerMode(0)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      currentTimerMode === 0
                        ? 'bg-amber-500 text-slate-950 font-black gold-glow shadow-md scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-sm font-mono">No Limit</span>
                    <span className="text-[10px] opacity-80">Untimed (∞)</span>
                  </button>
                </div>

                {/* Clock Status & Runner */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                  <div className="text-4xl font-mono font-black text-amber-400 tabular-nums">
                    {currentTimerMode === 0 ? '∞' : `${state?.timer.secondsRemaining || 0}s`}
                  </div>
                  <span className="text-xs text-slate-300 block">
                    {currentTimerMode === 0
                      ? 'No Time Limit (Contestant Untimed)'
                      : state?.timer.isRunning
                      ? 'Clock is Counting Down'
                      : 'Clock is Paused'}
                  </span>

                  {currentTimerMode !== 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => handleAction('TIMER_CONTROL', { action: 'START' })}
                        className="py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" /> Start
                      </button>
                      <button
                        onClick={() => handleAction('TIMER_CONTROL', { action: 'PAUSE' })}
                        className="py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                      <button
                        onClick={() =>
                          handleAction('TIMER_CONTROL', { action: 'RESET', duration: currentTimerMode })
                        }
                        className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ladder & Milestones Overview */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Ladder & Guaranteed Milestones
                  </h3>
                  <span className="text-[10px] text-amber-300">Q3 (10k) & Q8 (25L)</span>
                </div>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {[...PRIZE_LADDER].reverse().map((step) => {
                    const isCurrent = step.level === currentLevel;
                    const isPassed = step.level < currentLevel;

                    return (
                      <div
                        key={step.level}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                            : isPassed
                            ? 'bg-slate-950 text-emerald-400 border border-slate-800'
                            : step.isGuaranteed
                            ? 'bg-slate-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {step.isGuaranteed && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{step.label}</span>
                        </div>
                        <span className="font-mono">{step.displayPoints.replace(' Samvar Points', '')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUESTIONS LADDER & BANK */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-amber-400 font-cinzel">11-Question Ladder & Question Pool</h2>
                <span className="text-xs text-slate-400">
                  Add custom questions, assign to ladder levels, or manage question pool.
                </span>
              </div>
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow gold-glow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add New Question</span>
              </button>
            </div>

            {/* Ladder Questions List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active 11-Level Ladder Sequence
              </h3>

              {adminState?.questionsLadder?.map((q, idx) => (
                <div key={q.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400">
                      Ladder Position: Q{idx + 1} ({PRIZE_LADDER[idx]?.displayPoints})
                    </span>
                    <span className="text-slate-400">{q.category} · {q.difficulty}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{q.question}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border ${
                          opt.id === q.correctOption
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <strong>{opt.id}:</strong> {opt.text}
                      </div>
                    ))}
                  </div>
                  {q.supportingReference && (
                    <span className="text-[11px] text-slate-400 block">
                      Reference: {q.supportingReference}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Extra Question Bank Pool */}
            {adminState?.questionBank && adminState.questionBank.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Backup Question Pool ({adminState.questionBank.length} available)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adminState.questionBank.map((q) => (
                    <div key={q.id} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400 font-semibold">{q.category}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Assign to:</span>
                          <select
                            onChange={(e) => {
                              const lvl = Number(e.target.value);
                              if (lvl >= 1 && lvl <= 11) {
                                setLadderQuestion(q.id, lvl);
                              }
                            }}
                            defaultValue=""
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1"
                          >
                            <option value="" disabled>
                              Select Ladder Level...
                            </option>
                            {PRIZE_LADDER.map((step) => (
                              <option key={step.level} value={step.level}>
                                Q{step.level} ({step.displayPoints.replace(' Samvar Points', '')})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200">{q.question}</p>
                      <div className="text-[11px] text-emerald-400">
                        Answer: Option {q.correctOption} ({q.options.find((o) => o.id === q.correctOption)?.text})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PARTICIPANTS LIST */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-amber-400 font-cinzel">
                Registered Participants ({adminState?.participants?.length || 0})
              </h2>
              <div className="text-xs text-slate-400">
                Direct join link: <code className="text-amber-400">/join</code> (Room: {state?.roomCode || 'KBC-108'})
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Participant Name</th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Registration Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminState?.participants?.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-200">{p.name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{p.id}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(p.registeredAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {(!adminState?.participants || adminState.participants.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No participants registered yet. Show the QR code on the projector to allow participants to join.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* QUESTION BUILDER MODAL */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-cinzel font-bold text-base">
                <PlusCircle className="w-5 h-5" /> Add New Question
              </div>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Question saved and added to game successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              {/* Question Text */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Question Text</label>
                <textarea
                  rows={3}
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="e.g. Which ancient scripture outlines the 14 Gunasthanas (stages of spiritual elevation)?"
                  required
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* 4 Options with Correct Answer Selector */}
              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">
                  4 Options & Mark the Correct Answer:
                </label>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const val =
                    opt === 'A'
                      ? newQOptionA
                      : opt === 'B'
                      ? newQOptionB
                      : opt === 'C'
                      ? newQOptionC
                      : newQOptionD;
                  const setVal =
                    opt === 'A'
                      ? setNewQOptionA
                      : opt === 'B'
                      ? setNewQOptionB
                      : opt === 'C'
                      ? setNewQOptionC
                      : setNewQOptionD;
                  const isCorrect = newQCorrect === opt;

                  return (
                    <div key={opt} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewQCorrect(opt)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                            : 'bg-slate-950 text-slate-400 border border-slate-700 hover:border-slate-500'
                        }`}
                        title="Click to set as correct answer"
                      >
                        {isCorrect ? '✓' : opt}
                      </button>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={`Option ${opt} text`}
                        required
                        className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>
                  );
                })}
                <span className="text-[10px] text-slate-400">
                  Green button indicates the correct answer. Click any letter to mark it correct.
                </span>
              </div>

              {/* Level & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Assign to Ladder / Pool</label>
                  <select
                    value={newQLadderLevel}
                    onChange={(e) => setNewQLadderLevel(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                  >
                    {PRIZE_LADDER.map((step) => (
                      <option key={step.level} value={step.level}>
                        Ladder Q{step.level} ({step.displayPoints.replace(' Samvar Points', '')})
                      </option>
                    ))}
                    <option value={0}>Question Pool (Extra Backup)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category</label>
                  <input
                    type="text"
                    value={newQCategory}
                    onChange={(e) => setNewQCategory(e.target.value)}
                    placeholder="e.g. Tirthankara, Navkar Mantra"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                  />
                </div>
              </div>

              {/* Spiritual Explanation */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Spiritual Explanation</label>
                <input
                  type="text"
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  placeholder="Revealed when the answer is confirmed on the projector"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md gold-glow"
                >
                  {isSavingQuestion ? 'Saving Question...' : 'Save & Deploy Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETUP GUIDE MODAL */}
      <ExtendedDisplayGuide isOpen={showSetupGuide} onClose={() => setShowSetupGuide(false)} />

      {/* RESET SESSION CONFIRMATION DIALOG */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-500/40 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Confirm Reset Session
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to reset the current game session? This will clear all FFF submissions and reset the ladder to Question 1.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAction('CREATE_SESSION');
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTESTANT QUIT CONFIRMATION DIALOG */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Contestant Quit Confirmation
            </h3>
            <p className="text-xs text-slate-300">
              The contestant will retain the Samvar Points of the LAST correctly answered question (
              {state?.currentLadderLevel && state.currentLadderLevel > 1
                ? PRIZE_LADDER[state.currentLadderLevel - 2].displayPoints
                : '0 Points'}
              ).
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/contestant/quit', { method: 'POST' });
                  setShowQuitConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Confirm Contestant Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
