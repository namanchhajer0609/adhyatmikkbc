import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { soundEngine } from '../utils/audio';
import { PrizeLevel } from '../game/rules';
import { SpiritualQuestion, FffQuestion } from '../game/questionBank';
import { firebaseConfig, isFirebaseConfigured } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { staffRoleForEmail, StaffRole } from '../auth/staffRoles';
import {
  ensureLiveGame, subscribePublicState, subscribeAdminState, subscribeParticipants, subscribeSeatCount,
  subscribeFffSubmissions, subscribePollVotes, updatePollResults, registerGuest,
  submitGuestFff, submitGuestVote, executeLiveAdminAction, contestantSelect,
  contestantConfirm, contestantQuit as contestantQuitLive, resolveLocalTimerExpiry,
} from '../firebase/liveGame';

export interface PublicGameState {
  sessionId: string;
  roomCode: string;
  stage:
    | 'REGISTRATION'
    | 'FFF_INTRO'
    | 'FFF_ACTIVE'
    | 'FFF_WINNER'
    | 'HOT_SEAT_INTRO'
    | 'QUESTION_ACTIVE'
    | 'ANSWER_LOCKED'
    | 'ANSWER_REVEALED'
    | 'CONTESTANT_QUIT'
    | 'GAME_COMPLETED';
  registrationOpen: boolean;
  participantCount: number;
  fffQuestion: {
    id: string;
    question: string;
    instruction: string;
    items: { id: string; text: string }[];
    category: string;
    explanation?: string;
  };
  fffStartTime: number;
  fffWinner: { participantId: string; name: string; timeTakenMs: number } | null;
  hotSeatContestant: { id: string; name: string; pointsWon: number } | null;
  currentLadderLevel: number;
  activeQuestion: {
    id: string;
    ladderLevel: number;
    question: string;
    options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[];
    correctOption: 'A' | 'B' | 'C' | 'D' | null;
    explanation: string | null;
    category: string;
    difficulty: string;
    supportingReference?: string;
  } | null;
  activeQuestionRevealed: boolean;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isAnswerCorrect: boolean | null;
  lastSecuredMilestone: number;
  lifelines: {
    fiftyFifty: { used: boolean; active: boolean; hiddenOptions: string[] };
    askMaharaj: { used: boolean; active: boolean };
    audiencePoll: {
      used: boolean;
      active: boolean;
      durationSeconds: number;
      secondsRemaining: number;
      percentages: Record<string, number>;
      totalVotes: number;
    };
  };
  timer: {
    duration: number;
    secondsRemaining: number;
    isRunning: boolean;
    timerMode: 45 | 60 | 0;
  };
  soundTrigger: { type: string; timestamp: number } | null;
  soundEnabled: boolean;
  prizeLadder: PrizeLevel[];
}

export interface AdminGameState extends PublicGameState {
  fullActiveQuestion: SpiritualQuestion | null;
  fullFffQuestion: FffQuestion | null;
  participants: { id: string; name: string; registeredAt: number }[];
  fffSubmissions: {
    participantId: string;
    name: string;
    submittedOrder: string[];
    serverReceivedTimestamp: number;
    sequenceNumber: number;
  }[];
  questionsLadder: SpiritualQuestion[];
  questionBank: SpiritualQuestion[];
  fffBank: FffQuestion[];
  audiencePollVotes: Record<string, string>;
}

interface GameContextType {
  state: PublicGameState | null;
  adminState: AdminGameState | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  firebaseProjectId: string;
  isFirebaseConnected: boolean;
  lastSoundTime: number;
  executeAdminAction: (action: string, payload?: Record<string, unknown>) => Promise<boolean>;
  registerParticipant: (name: string, roomCode?: string) => Promise<{ id: string; name: string } | null>;
  submitFffOrder: (order: string[]) => Promise<boolean>;
  votePoll: (optionKey: 'A' | 'B' | 'C' | 'D') => Promise<boolean>;
  contestantSelectOption: (opt: 'A' | 'B' | 'C' | 'D') => Promise<boolean>;
  contestantConfirmAnswer: () => Promise<boolean>;
  contestantQuit: () => Promise<boolean>;
  setTimerMode: (mode: 45 | 60 | 0) => Promise<boolean>;
  addQuestion: (q: Omit<SpiritualQuestion, 'id'>) => Promise<boolean>;
  setLadderQuestion: (questionId: string, ladderLevel: number) => Promise<boolean>;
  currentParticipant: { id: string; name: string; sessionId?: string } | null;
  error: string | null;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PublicGameState | null>(null);
  const [adminState, setAdminState] = useState<AdminGameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [lastSoundTimestamp, setLastSoundTimestamp] = useState<number>(0);
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const timerEndsAt = useRef<number | null>(null);
  const pollEndsAt = useRef<number | null>(null);
  const participantCountRef = useRef<number | null>(null);
  const lastSoundRef = useRef(0);

  // Participant stored in localStorage for seamless reconnect
  const [currentParticipant, setCurrentParticipant] = useState<{ id: string; name: string; sessionId?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('akbc_participant');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const clearError = useCallback(() => setError(null), []);

  // The static Hosting app shares live show state through Firestore.
  useEffect(() => {
    const unsubscribe = subscribePublicState((next, ends) => {
      timerEndsAt.current = ends.timer;
      pollEndsAt.current = ends.poll;
      setState(prev => next ? {
        ...next,
        participantCount: prev?.sessionId === next.sessionId ? participantCountRef.current ?? next.participantCount : next.participantCount,
      } : null);
      setConnectionStatus(next ? 'connected' : 'connecting');
    }, () => setConnectionStatus('disconnected'));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!state?.sessionId) return;
    const sessionId = state.sessionId;
    participantCountRef.current = null;
    return subscribeSeatCount(sessionId, count => {
      participantCountRef.current = count;
      setState(prev => prev?.sessionId === sessionId ? { ...prev, participantCount: count } : prev);
    }, () => {});
  }, [state?.sessionId]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, user => setStaffRole(staffRoleForEmail(user?.email)));
  }, []);

  useEffect(() => {
    if (staffRole !== 'admin' && staffRole !== 'host') return;
    ensureLiveGame().catch(cause => setError(cause instanceof Error ? cause.message : 'Could not connect to Firestore.'));
  }, [staffRole]);

  useEffect(() => {
    if (staffRole !== 'admin' && staffRole !== 'host') {
      setAdminState(null);
      return;
    }
    if (!state?.sessionId) return;
    let stopAdmin = () => {};
    let stopPeople = () => {};
    stopAdmin = subscribeAdminState(next => setAdminState(prev => next ? {
      ...next,
      participants: prev?.participants ?? next.participants,
      fffSubmissions: prev?.fffSubmissions ?? next.fffSubmissions,
      audiencePollVotes: prev?.audiencePollVotes ?? next.audiencePollVotes,
    } : null), () => setError('Could not read show controls.'));
    stopPeople = subscribeParticipants(state.sessionId, items => setAdminState(prev => prev ? { ...prev, participants: items } : prev), () => {});
    return () => { stopAdmin(); stopPeople(); };
  }, [staffRole, state?.sessionId]);

  useEffect(() => {
    if (!state || !currentParticipant || currentParticipant.sessionId === state.sessionId) return;
    localStorage.removeItem('akbc_participant');
    setCurrentParticipant(null);
  }, [state?.sessionId, currentParticipant?.sessionId]);

  useEffect(() => {
    if ((staffRole !== 'admin' && staffRole !== 'host') || !state || state.stage !== 'FFF_ACTIVE') return;
    return subscribeFffSubmissions(state.fffStartTime, items => setAdminState(prev => prev ? { ...prev, fffSubmissions: items } : prev), () => {});
  }, [staffRole, state?.stage, state?.fffStartTime]);

  useEffect(() => {
    if (staffRole !== 'admin' && staffRole !== 'host') return;
    const pollId = (adminState as (AdminGameState & { pollId?: string }) | null)?.pollId;
    if (!pollId) return;
    return subscribePollVotes(pollId, votes => {
      setAdminState(prev => prev ? { ...prev, audiencePollVotes: votes } : prev);
      void updatePollResults(votes).catch(() => {});
    }, () => {});
  }, [staffRole, (adminState as (AdminGameState & { pollId?: string }) | null)?.pollId]);

  useEffect(() => {
    if (timerEndsAt.current === null && pollEndsAt.current === null) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setClockNow(now);
      if ((staffRole === 'admin' || staffRole === 'host') &&
        ((timerEndsAt.current !== null && timerEndsAt.current <= now) || (pollEndsAt.current !== null && pollEndsAt.current <= now))) {
        void resolveLocalTimerExpiry().catch(() => {});
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [state?.timer?.isRunning, state?.lifelines?.audiencePoll?.active, staffRole]);

  useEffect(() => {
    const sound = state?.soundTrigger;
    if (!sound || sound.timestamp <= lastSoundRef.current) return;
    lastSoundRef.current = sound.timestamp;
    setLastSoundTimestamp(sound.timestamp);
    soundEngine.setMuted(!state.soundEnabled);
    soundEngine.play(sound.type);
  }, [state?.soundTrigger?.timestamp, state?.soundEnabled]);

  useEffect(() => {
    if (!state) return;
    const timerRemaining = timerEndsAt.current === null ? state.timer.secondsRemaining : Math.max(0, Math.ceil((timerEndsAt.current - clockNow) / 1000));
    const pollRemaining = pollEndsAt.current === null ? state.lifelines.audiencePoll.secondsRemaining : Math.max(0, Math.ceil((pollEndsAt.current - clockNow) / 1000));
    setState(prev => prev ? {
      ...prev,
      timer: { ...prev.timer, secondsRemaining: timerRemaining },
      lifelines: { ...prev.lifelines, audiencePoll: { ...prev.lifelines.audiencePoll, secondsRemaining: pollRemaining } },
    } : prev);
  }, [clockNow]);

  // Admin action dispatcher
  const executeAdminAction = useCallback(async (action: string, payload?: Record<string, unknown>): Promise<boolean> => {
    if (staffRole !== 'admin' && staffRole !== 'host') {
      setError('Sign in with a host or admin account to control the show.');
      return false;
    }
    try {
      return await executeLiveAdminAction(action, payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Show action failed.');
      return false;
    }
  }, [staffRole]);

  // Register participant from /join
  const registerParticipant = useCallback(async (name: string, roomCode?: string) => {
    try {
      if (currentParticipant?.sessionId === state?.sessionId) return currentParticipant;
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const participant = await registerGuest(name, roomCode ?? state?.roomCode ?? '', id);
      if (!participant) return null;
      const savedParticipant = { ...participant, sessionId: state?.sessionId };
      setCurrentParticipant(savedParticipant);
      localStorage.setItem('akbc_participant', JSON.stringify(savedParticipant));
      return savedParticipant;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registration failed.');
      return null;
    }
  }, [currentParticipant?.id, state?.roomCode]);

  // Submit FFF ordering
  const submitFffOrder = useCallback(
    async (order: string[]): Promise<boolean> => {
      if (!currentParticipant) {
        setError('Participant profile not found. Please join again.');
        return false;
      }
      try {
        return await submitGuestFff(currentParticipant, order);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not submit answer.');
        return false;
      }
    },
    [currentParticipant]
  );

  // Vote in audience poll
  const votePoll = useCallback(
    async (optionKey: 'A' | 'B' | 'C' | 'D'): Promise<boolean> => {
      if (!currentParticipant) {
        setError('Please register before voting in the Audience Poll.');
        return false;
      }
      try {
        return await submitGuestVote(currentParticipant, optionKey);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not register vote.');
        return false;
      }
    },
    [currentParticipant]
  );

  // Contestant options
  const contestantSelectOption = useCallback(async (optionKey: 'A' | 'B' | 'C' | 'D'): Promise<boolean> => {
    if (staffRole !== 'player') return false;
    try {
      return await contestantSelect(optionKey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not select that answer.');
      return false;
    }
  }, [staffRole]);

  const contestantConfirmAnswer = useCallback(async (): Promise<boolean> => {
    if (staffRole !== 'player') return false;
    try {
      return await contestantConfirm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not lock the answer.');
      return false;
    }
  }, [staffRole]);

  const contestantQuit = useCallback(async (): Promise<boolean> => {
    if (staffRole !== 'player') return false;
    try {
      return await contestantQuitLive();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not quit the game.');
      return false;
    }
  }, [staffRole]);

  const setTimerMode = useCallback(
    async (mode: 45 | 60 | 0): Promise<boolean> => {
      return executeAdminAction('SET_TIMER_MODE', { timerMode: mode });
    },
    [executeAdminAction]
  );

  const addQuestion = useCallback(
    async (q: Omit<SpiritualQuestion, 'id'>): Promise<boolean> => {
      return executeAdminAction('ADD_QUESTION', { question: q });
    },
    [executeAdminAction]
  );

  const setLadderQuestion = useCallback(
    async (questionId: string, ladderLevel: number): Promise<boolean> => {
      return executeAdminAction('SET_LADDER_QUESTION', { questionId, ladderLevel });
    },
    [executeAdminAction]
  );

  const value = useMemo(
    () => ({
      state,
      adminState,
      connectionStatus,
      firebaseProjectId: firebaseConfig.projectId || 'kaunbanegacrorepati',
      isFirebaseConnected: isFirebaseConfigured(),
      lastSoundTime: lastSoundTimestamp,
      executeAdminAction,
      registerParticipant,
      submitFffOrder,
      votePoll,
      contestantSelectOption,
      contestantConfirmAnswer,
      contestantQuit,
      staffRole,
      setTimerMode,
      addQuestion,
      setLadderQuestion,
      currentParticipant,
      error,
      clearError,
    }),
    [
      state,
      adminState,
      connectionStatus,
      lastSoundTimestamp,
      executeAdminAction,
      registerParticipant,
      submitFffOrder,
      votePoll,
      contestantSelectOption,
      contestantConfirmAnswer,
      contestantQuit,
      staffRole,
      setTimerMode,
      addQuestion,
      setLadderQuestion,
      currentParticipant,
      error,
      clearError,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
