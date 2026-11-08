import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import {
  PRIZE_LADDER,
  calculatePointsOnWrongAnswer,
  calculatePointsOnQuit,
  computeFiftyFifty,
  determineFffWinner,
  calculateAudiencePollPercentages,
  formatSamvarPoints,
  FffParticipantSubmission,
} from './src/game/rules';
import {
  INITIAL_QUESTIONS,
  INITIAL_FFF_QUESTIONS,
  EXTRA_BANK_QUESTIONS,
  SpiritualQuestion,
  FffQuestion,
} from './src/game/questionBank';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory single-source-of-truth game state (authoritative server state)
export interface GameState {
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
  participants: { id: string; name: string; registeredAt: number }[];
  fffQuestion: FffQuestion;
  fffStartTime: number;
  fffSubmissions: FffParticipantSubmission[];
  fffWinner: { participantId: string; name: string; timeTakenMs: number } | null;
  hotSeatContestant: { id: string; name: string; pointsWon: number } | null;
  currentLadderLevel: number; // 1 to 11
  activeQuestion: SpiritualQuestion | null;
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
      votes: Record<string, string>; // participantId -> 'A' | 'B' | 'C' | 'D'
      percentages: Record<string, number>;
      totalVotes: number;
    };
  };
  timer: {
    duration: number;
    secondsRemaining: number;
    isRunning: boolean;
    timerMode: 45 | 60 | 0; // 45s, 60s, or 0 = No Time Limit (Untimed)
  };
  soundTrigger: { type: string; timestamp: number } | null;
  soundEnabled: boolean;
  questionsLadder: SpiritualQuestion[];
  questionBank: SpiritualQuestion[];
  fffBank: FffQuestion[];
}

let fffSequenceCounter = 0;

function createInitialGameState(): GameState {
  return {
    sessionId: 'session-' + Date.now().toString(36),
    roomCode: 'KBC-108',
    stage: 'REGISTRATION',
    registrationOpen: true,
    participants: [],
    fffQuestion: { ...INITIAL_FFF_QUESTIONS[0] },
    fffStartTime: 0,
    fffSubmissions: [],
    fffWinner: null,
    hotSeatContestant: null,
    currentLadderLevel: 1,
    activeQuestion: { ...INITIAL_QUESTIONS[0] },
    activeQuestionRevealed: false,
    selectedOption: null,
    isAnswerCorrect: null,
    lastSecuredMilestone: 0,
    lifelines: {
      fiftyFifty: { used: false, active: false, hiddenOptions: [] },
      askMaharaj: { used: false, active: false },
      audiencePoll: {
        used: false,
        active: false,
        durationSeconds: 30,
        secondsRemaining: 30,
        votes: {},
        percentages: { A: 0, B: 0, C: 0, D: 0 },
        totalVotes: 0,
      },
    },
    timer: {
      duration: 45,
      secondsRemaining: 45,
      isRunning: false,
      timerMode: 45,
    },
    soundTrigger: null,
    soundEnabled: true,
    questionsLadder: JSON.parse(JSON.stringify(INITIAL_QUESTIONS)),
    questionBank: JSON.parse(JSON.stringify(EXTRA_BANK_QUESTIONS)),
    fffBank: JSON.parse(JSON.stringify(INITIAL_FFF_QUESTIONS)),
  };
}

let gameState: GameState = createInitialGameState();

// Active SSE client connections for broadcast
const sseClients = new Set<Response>();

function broadcastState() {
  const publicState = getSanitizedState();
  const adminState = getAdminState();

  const publicPayload = `event: state\ndata: ${JSON.stringify(publicState)}\n\n`;
  const adminPayload = `event: admin-state\ndata: ${JSON.stringify(adminState)}\n\n`;

  sseClients.forEach((res) => {
    try {
      // If client flagged as admin in request or we broadcast dual channels
      res.write(publicPayload);
      res.write(adminPayload);
    } catch {
      sseClients.delete(res);
    }
  });
}

// Timer ticker interval
let timerInterval: NodeJS.Timeout | null = null;

function startTimerTicker() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    let stateChanged = false;

    // Main Question Timer
    if (gameState.timer.isRunning && gameState.timer.timerMode !== 0 && gameState.timer.secondsRemaining > 0) {
      gameState.timer.secondsRemaining -= 1;
      stateChanged = true;
      if (gameState.timer.secondsRemaining === 0) {
        gameState.timer.isRunning = false;
        triggerSound('time-up');
      }
    }

    // Audience Poll Timer
    if (gameState.lifelines.audiencePoll.active && gameState.lifelines.audiencePoll.secondsRemaining > 0) {
      gameState.lifelines.audiencePoll.secondsRemaining -= 1;
      stateChanged = true;
      if (gameState.lifelines.audiencePoll.secondsRemaining === 0) {
        gameState.lifelines.audiencePoll.active = false;
        triggerSound('poll-end');
      }
    }

    if (stateChanged) {
      broadcastState();
    }
  }, 1000);
}

startTimerTicker();

function triggerSound(type: string) {
  if (gameState.soundEnabled) {
    gameState.soundTrigger = { type, timestamp: Date.now() };
  }
}

/**
 * Public sanitized state: strictly hides the correct answer and secret admin details!
 */
function getSanitizedState() {
  const sanitizedActiveQuestion = gameState.activeQuestion
    ? {
        id: gameState.activeQuestion.id,
        ladderLevel: gameState.activeQuestion.ladderLevel,
        question: gameState.activeQuestion.question,
        options: gameState.activeQuestion.options,
        category: gameState.activeQuestion.category,
        difficulty: gameState.activeQuestion.difficulty,
        supportingReference: gameState.activeQuestion.supportingReference,
        // Only reveal correctOption and explanation AFTER operator reveals it!
        correctOption: gameState.activeQuestionRevealed ? gameState.activeQuestion.correctOption : null,
        explanation: gameState.activeQuestionRevealed ? gameState.activeQuestion.explanation : null,
      }
    : null;

  // For FFF: omit correct order until completed/revealed
  const sanitizedFff = {
    id: gameState.fffQuestion.id,
    question: gameState.fffQuestion.question,
    instruction: gameState.fffQuestion.instruction,
    items: gameState.fffQuestion.items.map((i) => ({ id: i.id, text: i.text })),
    category: gameState.fffQuestion.category,
    // Explanation and correctOrder hidden until FFF winner is shown
    explanation: gameState.stage === 'FFF_WINNER' ? gameState.fffQuestion.explanation : undefined,
  };

  return {
    sessionId: gameState.sessionId,
    roomCode: gameState.roomCode,
    stage: gameState.stage,
    registrationOpen: gameState.registrationOpen,
    participantCount: gameState.participants.length,
    fffQuestion: sanitizedFff,
    fffStartTime: gameState.fffStartTime,
    fffWinner: gameState.fffWinner,
    hotSeatContestant: gameState.hotSeatContestant,
    currentLadderLevel: gameState.currentLadderLevel,
    activeQuestion: sanitizedActiveQuestion,
    activeQuestionRevealed: gameState.activeQuestionRevealed,
    selectedOption: gameState.selectedOption,
    isAnswerCorrect: gameState.isAnswerCorrect,
    lastSecuredMilestone: gameState.lastSecuredMilestone,
    lifelines: {
      fiftyFifty: gameState.lifelines.fiftyFifty,
      askMaharaj: gameState.lifelines.askMaharaj,
      audiencePoll: {
        used: gameState.lifelines.audiencePoll.used,
        active: gameState.lifelines.audiencePoll.active,
        durationSeconds: gameState.lifelines.audiencePoll.durationSeconds,
        secondsRemaining: gameState.lifelines.audiencePoll.secondsRemaining,
        percentages: gameState.lifelines.audiencePoll.percentages,
        totalVotes: gameState.lifelines.audiencePoll.totalVotes,
      },
    },
    timer: gameState.timer,
    soundTrigger: gameState.soundTrigger,
    soundEnabled: gameState.soundEnabled,
    prizeLadder: PRIZE_LADDER,
  };
}

/**
 * Full state for Admin Control Panel
 */
function getAdminState() {
  return {
    ...getSanitizedState(),
    fullActiveQuestion: gameState.activeQuestion,
    fullFffQuestion: gameState.fffQuestion,
    participants: gameState.participants,
    fffSubmissions: gameState.fffSubmissions,
    questionsLadder: gameState.questionsLadder,
    questionBank: gameState.questionBank,
    fffBank: gameState.fffBank,
    audiencePollVotes: gameState.lifelines.audiencePoll.votes,
  };
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// SSE stream for real-time events across all screens
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial payloads
  res.write(`event: state\ndata: ${JSON.stringify(getSanitizedState())}\n\n`);
  res.write(`event: admin-state\ndata: ${JSON.stringify(getAdminState())}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Get sanitized public state
app.get('/api/state', (_req: Request, res: Response) => {
  res.json(getSanitizedState());
});

// Get full admin state
app.get('/api/admin/state', (_req: Request, res: Response) => {
  res.json(getAdminState());
});

// Register participant (from smartphone)
app.post('/api/participant/register', (req: Request, res: Response) => {
  const { name, roomCode } = req.body;
  if (!gameState.registrationOpen) {
    return res.status(403).json({ error: 'Registration is currently closed by the operator.' });
  }

  // Validate room code if provided
  if (roomCode) {
    const cleanRoomCode = String(roomCode).trim().toUpperCase();
    if (cleanRoomCode !== gameState.roomCode.toUpperCase()) {
      return res.status(400).json({
        error: `Incorrect Room Code "${roomCode}". Look at the projector screen (Room: ${gameState.roomCode}).`,
      });
    }
  }

  const cleanName = (name || '').trim();
  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ error: 'Please enter a valid name (at least 2 characters).' });
  }

  // Prevent duplicate names or create unique participant ID
  const existing = gameState.participants.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return res.json({ participant: existing, reconnected: true });
  }

  const newParticipant = {
    id: 'part-' + Math.random().toString(36).substring(2, 9),
    name: cleanName,
    registeredAt: Date.now(),
  };

  gameState.participants.push(newParticipant);
  broadcastState();
  res.json({ participant: newParticipant, reconnected: false });
});

// Participant submit FFF ordering
app.post('/api/participant/fff/submit', (req: Request, res: Response) => {
  const { participantId, name, submittedOrder } = req.body;
  if (gameState.stage !== 'FFF_ACTIVE') {
    return res.status(400).json({ error: 'Fastest Finger First is not actively accepting submissions.' });
  }

  // Check if participant already submitted
  const alreadySubmitted = gameState.fffSubmissions.some((s) => s.participantId === participantId);
  if (alreadySubmitted) {
    return res.status(400).json({ error: 'You have already submitted your answer for this round.' });
  }

  fffSequenceCounter++;
  const submission: FffParticipantSubmission = {
    participantId,
    name: name || 'Participant',
    submittedOrder: Array.isArray(submittedOrder) ? submittedOrder : [],
    serverReceivedTimestamp: Date.now(),
    sequenceNumber: fffSequenceCounter,
  };

  gameState.fffSubmissions.push(submission);
  broadcastState();
  res.json({ success: true, timestamp: submission.serverReceivedTimestamp });
});

// Participant vote in live Audience Poll
app.post('/api/participant/poll/vote', (req: Request, res: Response) => {
  const { participantId, optionKey } = req.body;
  if (!gameState.lifelines.audiencePoll.active) {
    return res.status(400).json({ error: 'Audience Poll is not currently active.' });
  }
  if (!['A', 'B', 'C', 'D'].includes(optionKey)) {
    return res.status(400).json({ error: 'Invalid option key.' });
  }

  // Enforce one vote per registered participant
  gameState.lifelines.audiencePoll.votes[participantId] = optionKey;

  // Recalculate real percentages
  const tally = calculateAudiencePollPercentages(gameState.lifelines.audiencePoll.votes);
  gameState.lifelines.audiencePoll.percentages = tally.percentages;
  gameState.lifelines.audiencePoll.totalVotes = tally.totalVotes;

  broadcastState();
  res.json({ success: true, optionKey });
});

// Contestant selects an option (prior to locking)
app.post('/api/contestant/select-option', (req: Request, res: Response) => {
  const { optionKey } = req.body;
  if (gameState.stage !== 'QUESTION_ACTIVE') {
    return res.status(400).json({ error: 'Question is not actively open for option selection.' });
  }
  if (optionKey !== null && !['A', 'B', 'C', 'D'].includes(optionKey)) {
    return res.status(400).json({ error: 'Invalid option.' });
  }

  gameState.selectedOption = optionKey;
  triggerSound('option-select');
  broadcastState();
  res.json({ success: true, selectedOption: gameState.selectedOption });
});

// Contestant locks / confirms answer
app.post('/api/contestant/confirm-answer', (req: Request, res: Response) => {
  if (gameState.stage !== 'QUESTION_ACTIVE' || !gameState.selectedOption) {
    return res.status(400).json({ error: 'No option selected or question not active.' });
  }

  gameState.stage = 'ANSWER_LOCKED';
  gameState.timer.isRunning = false;
  triggerSound('lock-answer');
  broadcastState();
  res.json({ success: true, lockedOption: gameState.selectedOption });
});

// Contestant quits
app.post('/api/contestant/quit', (_req: Request, res: Response) => {
  if (gameState.stage !== 'QUESTION_ACTIVE' && gameState.stage !== 'ANSWER_LOCKED') {
    return res.status(400).json({ error: 'Cannot quit at this stage.' });
  }

  const lastCorrectLevel = gameState.currentLadderLevel - 1;
  const pointsRetained = calculatePointsOnQuit(lastCorrectLevel);

  if (gameState.hotSeatContestant) {
    gameState.hotSeatContestant.pointsWon = pointsRetained;
  }

  gameState.stage = 'CONTESTANT_QUIT';
  gameState.timer.isRunning = false;
  triggerSound('quit');
  broadcastState();
  res.json({ success: true, pointsRetained });
});

// -------------------------------------------------------------
// Admin Action Controls (Authorized operator commands)
// -------------------------------------------------------------

app.post('/api/admin/action', (req: Request, res: Response) => {
  const { action, payload } = req.body;

  switch (action) {
    case 'CREATE_SESSION': {
      gameState = createInitialGameState();
      fffSequenceCounter = 0;
      triggerSound('intro');
      break;
    }

    case 'TOGGLE_REGISTRATION': {
      gameState.registrationOpen = !gameState.registrationOpen;
      break;
    }

    case 'SET_FFF_QUESTION': {
      const questionId = payload?.questionId;
      const found = gameState.fffBank.find((q) => q.id === questionId);
      if (found) {
        gameState.fffQuestion = { ...found };
      }
      gameState.stage = 'FFF_INTRO';
      gameState.fffSubmissions = [];
      gameState.fffWinner = null;
      triggerSound('fff-intro');
      break;
    }

    case 'START_FFF': {
      gameState.stage = 'FFF_ACTIVE';
      gameState.fffStartTime = Date.now();
      gameState.fffSubmissions = [];
      gameState.fffWinner = null;
      fffSequenceCounter = 0;
      gameState.timer.duration = payload?.duration || 30;
      gameState.timer.secondsRemaining = payload?.duration || 30;
      gameState.timer.isRunning = true;
      triggerSound('timer');
      break;
    }

    case 'END_FFF': {
      gameState.stage = 'FFF_WINNER';
      gameState.timer.isRunning = false;
      const result = determineFffWinner(
        gameState.fffSubmissions,
        gameState.fffQuestion.correctOrder,
        gameState.fffStartTime
      );
      if (result.winner) {
        gameState.fffWinner = {
          participantId: result.winner.participantId,
          name: result.winner.name,
          timeTakenMs: result.winner.timeTakenMs,
        };
        triggerSound('winner');
      } else {
        gameState.fffWinner = null;
      }
      break;
    }

    case 'CONFIRM_HOT_SEAT_WINNER': {
      const contestantName = payload?.name || gameState.fffWinner?.name || 'Contestant';
      const contestantId = payload?.participantId || gameState.fffWinner?.participantId || 'contestant-1';

      gameState.hotSeatContestant = {
        id: contestantId,
        name: contestantName,
        pointsWon: 0,
      };
      gameState.currentLadderLevel = 1;
      gameState.activeQuestion = gameState.questionsLadder.find((q) => q.ladderLevel === 1) || gameState.questionsLadder[0];
      gameState.activeQuestionRevealed = false;
      gameState.selectedOption = null;
      gameState.isAnswerCorrect = null;
      gameState.stage = 'HOT_SEAT_INTRO';
      triggerSound('hot-seat-welcome');
      break;
    }

    case 'START_QUESTION': {
      const level = payload?.ladderLevel || gameState.currentLadderLevel;
      gameState.currentLadderLevel = level;
      const targetQuestion = gameState.questionsLadder.find((q) => q.ladderLevel === level);
      if (targetQuestion) {
        gameState.activeQuestion = targetQuestion;
      }
      gameState.stage = 'QUESTION_ACTIVE';
      gameState.activeQuestionRevealed = false;
      gameState.selectedOption = null;
      gameState.isAnswerCorrect = null;
      // Reset 50:50 and poll state for the new question
      gameState.lifelines.fiftyFifty.active = false;
      gameState.lifelines.fiftyFifty.hiddenOptions = [];
      gameState.lifelines.audiencePoll.active = false;
      gameState.lifelines.audiencePoll.votes = {};
      gameState.lifelines.audiencePoll.percentages = { A: 0, B: 0, C: 0, D: 0 };
      gameState.lifelines.audiencePoll.totalVotes = 0;

      // Timer duration depends on operator setting: 45s, 60s, or 0 (untimed)
      if (gameState.timer.timerMode === 0) {
        gameState.timer.duration = 0;
        gameState.timer.secondsRemaining = 0;
        gameState.timer.isRunning = false;
      } else {
        const duration = gameState.timer.timerMode;
        gameState.timer.duration = duration;
        gameState.timer.secondsRemaining = duration;
        gameState.timer.isRunning = true;
      }
      triggerSound('question-appear');
      break;
    }

    case 'SET_TIMER_MODE': {
      const mode = Number(payload?.timerMode);
      if (mode === 45 || mode === 60 || mode === 0) {
        gameState.timer.timerMode = mode as 45 | 60 | 0;
        if (mode === 0) {
          gameState.timer.duration = 0;
          gameState.timer.secondsRemaining = 0;
          gameState.timer.isRunning = false;
        } else {
          gameState.timer.duration = mode;
          gameState.timer.secondsRemaining = mode;
          // Keep running if question is currently active
          if (gameState.stage === 'QUESTION_ACTIVE') {
            gameState.timer.isRunning = true;
          }
        }
      }
      break;
    }

    case 'TIMER_CONTROL': {
      if (payload?.action === 'START') {
        if (gameState.timer.timerMode !== 0) {
          gameState.timer.isRunning = true;
        }
      }
      if (payload?.action === 'PAUSE') gameState.timer.isRunning = false;
      if (payload?.action === 'RESET') {
        if (gameState.timer.timerMode === 0) {
          gameState.timer.secondsRemaining = 0;
          gameState.timer.isRunning = false;
        } else {
          const resetVal = payload.duration || gameState.timer.timerMode || 45;
          gameState.timer.secondsRemaining = resetVal;
          gameState.timer.duration = resetVal;
        }
      }
      break;
    }

    case 'ACTIVATE_FIFTY_FIFTY': {
      if (gameState.lifelines.fiftyFifty.used || !gameState.activeQuestion) {
        return res.status(400).json({ error: '50:50 is already used or no active question.' });
      }
      const allOpts = gameState.activeQuestion.options.map((o) => o.id);
      const hidden = computeFiftyFifty(allOpts, gameState.activeQuestion.correctOption);
      gameState.lifelines.fiftyFifty.used = true;
      gameState.lifelines.fiftyFifty.active = true;
      gameState.lifelines.fiftyFifty.hiddenOptions = hidden;
      triggerSound('lifeline');
      break;
    }

    case 'ACTIVATE_AUDIENCE_POLL': {
      if (gameState.lifelines.audiencePoll.used) {
        return res.status(400).json({ error: 'Audience Poll is already used.' });
      }
      gameState.lifelines.audiencePoll.used = true;
      gameState.lifelines.audiencePoll.active = true;
      gameState.lifelines.audiencePoll.durationSeconds = payload?.duration || 30;
      gameState.lifelines.audiencePoll.secondsRemaining = payload?.duration || 30;
      gameState.lifelines.audiencePoll.votes = {};
      gameState.lifelines.audiencePoll.percentages = { A: 0, B: 0, C: 0, D: 0 };
      gameState.lifelines.audiencePoll.totalVotes = 0;
      triggerSound('poll-start');
      break;
    }

    case 'CLOSE_AUDIENCE_POLL': {
      gameState.lifelines.audiencePoll.active = false;
      triggerSound('poll-end');
      break;
    }

    case 'USE_ASK_MAHARAJ': {
      gameState.lifelines.askMaharaj.used = true;
      gameState.lifelines.askMaharaj.active = true;
      triggerSound('maharaj-cue');
      break;
    }

    case 'REVEAL_ANSWER': {
      if (!gameState.activeQuestion) return res.status(400).json({ error: 'No active question.' });
      gameState.activeQuestionRevealed = true;
      gameState.stage = 'ANSWER_REVEALED';
      gameState.timer.isRunning = false;

      const correct = gameState.selectedOption === gameState.activeQuestion.correctOption;
      gameState.isAnswerCorrect = correct;

      if (correct) {
        const ladderItem = PRIZE_LADDER.find((p) => p.level === gameState.currentLadderLevel);
        const currentPoints = ladderItem ? ladderItem.points : 0;
        if (gameState.hotSeatContestant) {
          gameState.hotSeatContestant.pointsWon = currentPoints;
        }

        // Update secured milestone
        if (gameState.currentLadderLevel >= 8) {
          gameState.lastSecuredMilestone = 2500000;
        } else if (gameState.currentLadderLevel >= 3) {
          gameState.lastSecuredMilestone = 10000;
        }

        if (gameState.currentLadderLevel === 11) {
          gameState.stage = 'GAME_COMPLETED';
          triggerSound('crorepati');
        } else {
          triggerSound('correct');
        }
      } else {
        // Wrong answer scoring rules
        const pointsWon = calculatePointsOnWrongAnswer(gameState.currentLadderLevel);
        if (gameState.hotSeatContestant) {
          gameState.hotSeatContestant.pointsWon = pointsWon;
        }
        triggerSound('wrong');
      }
      break;
    }

    case 'ADVANCE_QUESTION': {
      if (gameState.currentLadderLevel < 11) {
        gameState.currentLadderLevel += 1;
        const nextQ = gameState.questionsLadder.find((q) => q.ladderLevel === gameState.currentLadderLevel);
        if (nextQ) {
          gameState.activeQuestion = nextQ;
        }
        gameState.stage = 'QUESTION_ACTIVE';
        gameState.activeQuestionRevealed = false;
        gameState.selectedOption = null;
        gameState.isAnswerCorrect = null;
        gameState.lifelines.fiftyFifty.active = false;
        gameState.lifelines.fiftyFifty.hiddenOptions = [];
        gameState.lifelines.audiencePoll.active = false;
        if (gameState.timer.timerMode === 0) {
          gameState.timer.duration = 0;
          gameState.timer.secondsRemaining = 0;
          gameState.timer.isRunning = false;
        } else {
          const duration = gameState.timer.timerMode;
          gameState.timer.duration = duration;
          gameState.timer.secondsRemaining = duration;
          gameState.timer.isRunning = true;
        }
        triggerSound('question-appear');
      }
      break;
    }

    case 'ADD_QUESTION': {
      const qData = payload?.question as Partial<SpiritualQuestion>;
      if (!qData || !qData.question || !qData.options || qData.options.length !== 4 || !qData.correctOption) {
        return res.status(400).json({ error: 'Invalid question: must supply question text, 4 options, and correctOption.' });
      }

      const targetLevel = Number(qData.ladderLevel) || 0;
      const newQuestion: SpiritualQuestion = {
        id: 'q-custom-' + Date.now().toString(36),
        ladderLevel: targetLevel,
        question: String(qData.question).trim(),
        options: qData.options as any,
        correctOption: qData.correctOption as 'A' | 'B' | 'C' | 'D',
        explanation: String(qData.explanation || 'Sacred spiritual principle').trim(),
        category: String(qData.category || 'General Spiritual Knowledge').trim(),
        difficulty: (qData.difficulty as any) || 'Medium',
        supportingReference: qData.supportingReference ? String(qData.supportingReference).trim() : undefined,
      };

      if (targetLevel >= 1 && targetLevel <= 11) {
        // Place in 11-question ladder at specific level
        const existingIdx = gameState.questionsLadder.findIndex((q) => q.ladderLevel === targetLevel);
        if (existingIdx !== -1) {
          gameState.questionsLadder[existingIdx] = newQuestion;
        } else {
          gameState.questionsLadder.push(newQuestion);
          gameState.questionsLadder.sort((a, b) => a.ladderLevel - b.ladderLevel);
        }
        // If the live show is currently on this level, update active question
        if (gameState.currentLadderLevel === targetLevel) {
          gameState.activeQuestion = newQuestion;
        }
      } else {
        // Place in Question Bank pool
        gameState.questionBank.unshift(newQuestion);
      }
      triggerSound('lifeline');
      break;
    }

    case 'SET_LADDER_QUESTION': {
      const questionId = payload?.questionId;
      const ladderLevel = Number(payload?.ladderLevel);
      if (ladderLevel < 1 || ladderLevel > 11) {
        return res.status(400).json({ error: 'Ladder level must be between 1 and 11.' });
      }

      const poolQuestion =
        gameState.questionBank.find((q) => q.id === questionId) ||
        gameState.questionsLadder.find((q) => q.id === questionId);

      if (!poolQuestion) {
        return res.status(404).json({ error: 'Question not found.' });
      }

      const updatedQ: SpiritualQuestion = { ...poolQuestion, ladderLevel };
      const existingIdx = gameState.questionsLadder.findIndex((q) => q.ladderLevel === ladderLevel);
      if (existingIdx !== -1) {
        gameState.questionsLadder[existingIdx] = updatedQ;
      } else {
        gameState.questionsLadder.push(updatedQ);
        gameState.questionsLadder.sort((a, b) => a.ladderLevel - b.ladderLevel);
      }

      if (gameState.currentLadderLevel === ladderLevel) {
        gameState.activeQuestion = updatedQ;
      }
      break;
    }

    case 'TOGGLE_SOUND': {
      gameState.soundEnabled = !gameState.soundEnabled;
      break;
    }

    case 'MANAGE_QUESTION_BANK': {
      // Allows swapping, adding or editing questions
      if (payload?.questionsLadder) {
        gameState.questionsLadder = payload.questionsLadder;
      }
      if (payload?.questionBank) {
        gameState.questionBank = payload.questionBank;
      }
      break;
    }

    default:
      return res.status(400).json({ error: 'Unknown admin action.' });
  }

  broadcastState();
  res.json({ success: true, stage: gameState.stage });
});

// Setup Vite development middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Adhyatmik KBC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
