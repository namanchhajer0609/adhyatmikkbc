import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { soundEngine } from '../utils/audio';
import { PrizeLevel } from '../game/rules';
import { SpiritualQuestion, FffQuestion } from '../game/questionBank';
import { firebaseConfig, isFirebaseConfigured } from '../firebase/config';
import {
  syncGameStateToFirestore,
  saveParticipantToFirestore,
  saveFffSubmissionToFirestore,
  savePollVoteToFirestore,
} from '../firebase/firestoreSync';

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
  currentParticipant: { id: string; name: string } | null;
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

  // Participant stored in localStorage for seamless reconnect
  const [currentParticipant, setCurrentParticipant] = useState<{ id: string; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('akbc_participant');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const clearError = useCallback(() => setError(null), []);

  // Fetch full state once via REST
  const refreshState = useCallback(async () => {
    try {
      const [resPublic, resAdmin] = await Promise.all([
        fetch('/api/state'),
        fetch('/api/admin/state').catch(() => null),
      ]);
      if (resPublic.ok) {
        const data = await resPublic.json();
        setState(data);
        setConnectionStatus('connected');
      }
      if (resAdmin && resAdmin.ok) {
        const dataAdmin = await resAdmin.json();
        setAdminState(dataAdmin);
      }
    } catch {
      setConnectionStatus('disconnected');
    }
  }, []);

  // Real-time synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    let sse: EventSource | null = null;
    let pollFallback: NodeJS.Timeout | null = null;

    function connectSSE() {
      setConnectionStatus('connecting');
      sse = new EventSource('/api/stream');

      sse.onopen = () => {
        setConnectionStatus('connected');
      };

      sse.addEventListener('state', (event) => {
        try {
          const parsed: PublicGameState = JSON.parse(event.data);
          setState(parsed);
          setConnectionStatus('connected');

          // Trigger sound if new sound trigger
          if (parsed.soundTrigger && parsed.soundTrigger.timestamp > lastSoundTimestamp) {
            setLastSoundTimestamp(parsed.soundTrigger.timestamp);
            soundEngine.setMuted(!parsed.soundEnabled);
            soundEngine.play(parsed.soundTrigger.type);
          }
        } catch (err) {
          console.error('SSE state parse error:', err);
        }
      });

      sse.addEventListener('admin-state', (event) => {
        try {
          const parsedAdmin: AdminGameState = JSON.parse(event.data);
          setAdminState(parsedAdmin);
        } catch (err) {
          console.error('SSE admin-state parse error:', err);
        }
      });

      sse.onerror = () => {
        setConnectionStatus('disconnected');
        sse?.close();
        // Try reconnect in 3 seconds
        setTimeout(connectSSE, 3000);
      };
    }

    connectSSE();

    // Secondary backup poll every 2 seconds for guaranteed resilience
    pollFallback = setInterval(refreshState, 2000);

    return () => {
      sse?.close();
      if (pollFallback) clearInterval(pollFallback);
    };
  }, [refreshState, lastSoundTimestamp]);

  // Admin action dispatcher
  const executeAdminAction = useCallback(async (action: string, payload?: Record<string, unknown>): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Admin action failed');
        return false;
      }
      return true;
    } catch {
      setError('Network communication failed.');
      return false;
    }
  }, []);

  // Register participant from /join
  const registerParticipant = useCallback(async (name: string, roomCode?: string) => {
    try {
      const res = await fetch('/api/participant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, roomCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to register');
        return null;
      }
      const data = await res.json();
      setCurrentParticipant(data.participant);
      try {
        localStorage.setItem('akbc_participant', JSON.stringify(data.participant));
      } catch {
        // storage quota fallback
      }
      // Sync to Firebase Firestore project kaunbanegacrorepati
      if (state?.sessionId) {
        saveParticipantToFirestore(state.sessionId, data.participant).catch(() => {});
      }
      return data.participant;
    } catch {
      setError('Registration server unavailable.');
      return null;
    }
  }, [state?.sessionId]);

  // Submit FFF ordering
  const submitFffOrder = useCallback(
    async (order: string[]): Promise<boolean> => {
      if (!currentParticipant) {
        setError('Participant profile not found. Please join again.');
        return false;
      }
      try {
        const res = await fetch('/api/participant/fff/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: currentParticipant.id,
            name: currentParticipant.name,
            submittedOrder: order,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Submission error');
          return false;
        }
        // Sync to Firebase Firestore project kaunbanegacrorepati
        if (state?.sessionId) {
          saveFffSubmissionToFirestore(state.sessionId, {
            participantId: currentParticipant.id,
            name: currentParticipant.name,
            submittedOrder: order,
            serverReceivedTimestamp: Date.now(),
            sequenceNumber: 0,
          }).catch(() => {});
        }
        return true;
      } catch {
        setError('Could not submit answer.');
        return false;
      }
    },
    [currentParticipant, state?.sessionId]
  );

  // Vote in audience poll
  const votePoll = useCallback(
    async (optionKey: 'A' | 'B' | 'C' | 'D'): Promise<boolean> => {
      if (!currentParticipant) {
        setError('Please register before voting in the Audience Poll.');
        return false;
      }
      try {
        const res = await fetch('/api/participant/poll/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: currentParticipant.id,
            optionKey,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Voting closed');
          return false;
        }
        // Sync to Firebase Firestore project kaunbanegacrorepati
        if (state?.sessionId) {
          savePollVoteToFirestore(state.sessionId, currentParticipant.id, optionKey).catch(() => {});
        }
        return true;
      } catch {
        setError('Could not register vote.');
        return false;
      }
    },
    [currentParticipant, state?.sessionId]
  );

  // Contestant options
  const contestantSelectOption = useCallback(async (optionKey: 'A' | 'B' | 'C' | 'D'): Promise<boolean> => {
    try {
      const res = await fetch('/api/contestant/select-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionKey }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const contestantConfirmAnswer = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/contestant/confirm-answer', {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const contestantQuit = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/contestant/quit', {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

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
