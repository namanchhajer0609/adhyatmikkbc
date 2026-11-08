import {
  collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction,
  serverTimestamp, setDoc, updateDoc, where, writeBatch, increment,
} from 'firebase/firestore';
import { db } from './config';
import { INITIAL_QUESTIONS, INITIAL_FFF_QUESTIONS, EXTRA_BANK_QUESTIONS, SpiritualQuestion } from '../game/questionBank';
import { PRIZE_LADDER, calculatePointsOnQuit, calculatePointsOnWrongAnswer, computeFiftyFifty, determineFffWinner, calculateAudiencePollPercentages } from '../game/rules';
import type { PublicGameState, AdminGameState } from '../context/GameContext';

const publicRef = () => doc(db!, 'gameSessions', 'active', 'public', 'state');
const adminRef = () => doc(db!, 'gameSessions', 'active', 'private', 'state');
const participantsRef = () => collection(db!, 'gameSessions', 'active', 'participants');
const submissionsRef = () => collection(db!, 'gameSessions', 'active', 'fffSubmissions');
const votesRef = () => collection(db!, 'gameSessions', 'active', 'pollVotes');

const makeInitialAdminState = (): AdminGameState => {
  const questions = JSON.parse(JSON.stringify(INITIAL_QUESTIONS)) as SpiritualQuestion[];
  const fffBank = JSON.parse(JSON.stringify(INITIAL_FFF_QUESTIONS));
  const full = questions.find(q => q.ladderLevel === 1) ?? questions[0] ?? null;
  const firstFff = fffBank[0];
  return {
    sessionId: `session-${Date.now().toString(36)}`, roomCode: 'KBC-108', stage: 'REGISTRATION',
    registrationOpen: true, participantCount: 0, fffQuestion: { id: firstFff.id, question: firstFff.question, instruction: firstFff.instruction, items: firstFff.items, category: firstFff.category },
    fffStartTime: 0, fffWinner: null, hotSeatContestant: null, currentLadderLevel: 1,
    activeQuestion: full ? { ...full, correctOption: null, explanation: null } : null,
    activeQuestionRevealed: false, selectedOption: null, isAnswerCorrect: null, lastSecuredMilestone: 0,
    lifelines: { fiftyFifty: { used: false, active: false, hiddenOptions: [] }, askMaharaj: { used: false, active: false }, audiencePoll: { used: false, active: false, durationSeconds: 30, secondsRemaining: 30, percentages: { A: 0, B: 0, C: 0, D: 0 }, totalVotes: 0 } },
    timer: { duration: 45, secondsRemaining: 45, isRunning: false, timerMode: 45 },
    soundTrigger: null, soundEnabled: true, prizeLadder: PRIZE_LADDER,
    fullActiveQuestion: full, fullFffQuestion: fffBank[0], participants: [], fffSubmissions: [],
    questionsLadder: questions, questionBank: JSON.parse(JSON.stringify(EXTRA_BANK_QUESTIONS)),
    fffBank, audiencePollVotes: {}, usedContestantIds: [],
  } as unknown as AdminGameState;
};

const toPublicState = (admin: AdminGameState): PublicGameState => {
  const active = admin.fullActiveQuestion;
  const fff = admin.fullFffQuestion;
  const {
    fullActiveQuestion: _fullActiveQuestion,
    fullFffQuestion: _fullFffQuestion,
    participants: _participants,
    fffSubmissions: _fffSubmissions,
    questionsLadder: _questionsLadder,
    questionBank: _questionBank,
    fffBank: _fffBank,
    audiencePollVotes: _audiencePollVotes,
    usedContestantIds: _usedContestantIds,
    ...safeState
  } = admin as AdminGameState & { usedContestantIds?: string[]; pollId?: string };
  return {
    ...safeState,
    activeQuestion: active ? {
      id: active.id, ladderLevel: active.ladderLevel, question: active.question, options: active.options,
      category: active.category, difficulty: active.difficulty,
      ...(active.supportingReference ? { supportingReference: active.supportingReference } : {}),
      correctOption: admin.activeQuestionRevealed ? active.correctOption : null,
      explanation: admin.activeQuestionRevealed ? active.explanation : null,
    } : null,
    fffQuestion: fff ? {
      id: fff.id, question: fff.question, instruction: fff.instruction,
      items: fff.items.map(i => ({ id: i.id, text: i.text })), category: fff.category,
      ...(admin.stage === 'FFF_WINNER' && fff.explanation ? { explanation: fff.explanation } : {}),
    } : admin.fffQuestion,
    ...((admin as AdminGameState & { pollId?: string }).pollId ? { pollId: (admin as AdminGameState & { pollId?: string }).pollId } : {}),
  } as unknown as PublicGameState;
};

export async function ensureLiveGame(): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  const snapshot = await getDoc(adminRef());
  if (snapshot.exists()) return;
  const initial = makeInitialAdminState();
  const batch = writeBatch(db);
  batch.set(adminRef(), { ...initial, timerEndsAt: null, pollEndsAt: null });
  batch.set(publicRef(), { ...toPublicState(initial), timerEndsAt: null, pollEndsAt: null });
  await batch.commit();
}

export const subscribePublicState = (next: (state: PublicGameState | null, ends: { timer: number | null; poll: number | null }) => void, error: (e: Error) => void) => {
  if (!db) return () => {};
  return onSnapshot(publicRef(), snap => {
    if (!snap.exists()) return next(null, { timer: null, poll: null });
    const data = snap.data() as PublicGameState & { timerEndsAt?: number | null; pollEndsAt?: number | null };
    next(data, { timer: data.timerEndsAt ?? null, poll: data.pollEndsAt ?? null });
  }, error);
};

export const subscribeAdminState = (next: (state: AdminGameState | null) => void, error: (e: Error) => void) => {
  if (!db) return () => {};
  return onSnapshot(adminRef(), snap => next(snap.exists() ? snap.data() as AdminGameState : null), error);
};

export const subscribeParticipants = (sessionId: string, next: (items: AdminGameState['participants']) => void, error: (e: Error) => void) => db ? onSnapshot(query(participantsRef(), where('sessionId', '==', sessionId)), s => next(s.docs.map(d => d.data() as AdminGameState['participants'][number])), error) : () => {};
export const subscribeFffSubmissions = (start: number, next: (items: AdminGameState['fffSubmissions']) => void, error: (e: Error) => void) => db ? onSnapshot(query(submissionsRef(), where('roundStart', '==', start)), s => next(s.docs.map(d => {
  const v = d.data(); return { ...v, serverReceivedTimestamp: v.serverReceivedTimestamp?.toMillis?.() ?? v.serverReceivedTimestamp } as AdminGameState['fffSubmissions'][number];
})), error) : () => {};
export const subscribePollVotes = (pollId: string, next: (votes: Record<string, string>) => void, error: (e: Error) => void) => db ? onSnapshot(query(votesRef(), where('pollId', '==', pollId)), s => next(Object.fromEntries(s.docs.map(d => [d.id, d.data().optionKey]))), error) : () => {};

function withTimer(admin: AdminGameState, timerEndsAt: number | null, pollEndsAt: number | null) {
  const batch = writeBatch(db!);
  batch.set(adminRef(), { ...admin, timerEndsAt, pollEndsAt });
  batch.set(publicRef(), { ...toPublicState(admin), timerEndsAt, pollEndsAt });
  return batch.commit();
}

export async function registerGuest(name: string, roomCode: string, participantId: string): Promise<{ id: string; name: string } | null> {
  if (!db) return null;
  const cleanName = name.trim();
  const pRef = doc(participantsRef(), participantId);
  await runTransaction(db, async tx => {
    const [pub, person] = await Promise.all([tx.get(publicRef()), tx.get(pRef)]);
    if (!pub.exists()) throw new Error('The game is not ready yet. Ask the host to open the show controls.');
    const state = pub.data() as PublicGameState;
    if (person.exists()) {
      if (person.data().sessionId === state.sessionId) return;
      throw new Error('Refresh the page and join the current show again.');
    }
    if (!state.registrationOpen) throw new Error('Registration is currently closed by the operator.');
    if (state.participantCount >= 100) throw new Error('This game is full. The host has reached the 100 audience limit.');
    if (roomCode.trim().toUpperCase() !== state.roomCode.toUpperCase()) throw new Error(`Incorrect room code. Use ${state.roomCode}.`);
    if (cleanName.length < 2) throw new Error('Please enter a name with at least 2 characters.');
    if (person.exists()) return;
    tx.set(pRef, { id: participantId, name: cleanName, roomCode: state.roomCode, sessionId: state.sessionId, registeredAt: Date.now() });
    tx.update(publicRef(), { participantCount: increment(1) });
  });
  return { id: participantId, name: cleanName };
}

export async function submitGuestFff(participant: { id: string; name: string }, order: string[]): Promise<boolean> {
  if (!db) return false;
  const [pub, person] = await Promise.all([getDoc(publicRef()), getDoc(doc(participantsRef(), participant.id))]);
  if (!pub.exists() || !person.exists()) throw new Error('Join the audience first.');
  const state = pub.data() as PublicGameState;
  if (person.data().sessionId !== state.sessionId) throw new Error('Refresh and join the current show again.');
  if (state.stage !== 'FFF_ACTIVE' || order.length !== 4) throw new Error('Fastest Finger First is not accepting this submission.');
  const oldRef = doc(submissionsRef(), participant.id);
  const old = await getDoc(oldRef);
  if (old.exists() && old.data().roundStart === state.fffStartTime) throw new Error('You already submitted this round.');
  await setDoc(oldRef, { participantId: participant.id, name: participant.name, submittedOrder: order, roundStart: state.fffStartTime, serverReceivedTimestamp: serverTimestamp() });
  return true;
}

export async function submitGuestVote(participant: { id: string; name: string }, optionKey: 'A'|'B'|'C'|'D'): Promise<boolean> {
  if (!db) return false;
  const pub = await getDoc(publicRef());
  if (!pub.exists()) return false;
  const state = pub.data() as PublicGameState & { pollId?: string };
  if (!state.lifelines.audiencePoll.active || !state.pollId) throw new Error('The audience poll is closed.');
  const ref = doc(votesRef(), participant.id);
  const old = await getDoc(ref);
  if (old.exists() && old.data().pollId === state.pollId) throw new Error('You already voted in this poll.');
  await setDoc(ref, { participantId: participant.id, name: participant.name, optionKey, pollId: state.pollId, timestamp: serverTimestamp() });
  return true;
}

export async function updatePollResults(votes: Record<string,string>): Promise<void> {
  if (!db) return;
  const result = calculateAudiencePollPercentages(votes);
  await updateDoc(publicRef(), { 'lifelines.audiencePoll.percentages': result.percentages, 'lifelines.audiencePoll.totalVotes': result.totalVotes });
}

export async function executeLiveAdminAction(action: string, payload?: Record<string, unknown>): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(adminRef());
  if (!snap.exists()) throw new Error('Open the show once to initialize it.');
  const s = snap.data() as AdminGameState & { timerEndsAt?: number | null; pollEndsAt?: number | null; pollId?: string };
  const submissions = action === 'END_FFF' ? await getDocs(query(submissionsRef(), where('roundStart', '==', s.fffStartTime))) : null;
  const next = structuredClone(s) as typeof s;
  let timerEndsAt = s.timerEndsAt ?? null;
  let pollEndsAt = s.pollEndsAt ?? null;
  const now = Date.now();
  const duration = Number(payload?.duration) || 30;
  const setSound = (type: string) => { if (next.soundEnabled) next.soundTrigger = { type, timestamp: now }; };
  const startTimer = (seconds: number) => { next.timer.duration = seconds; next.timer.secondsRemaining = seconds; next.timer.isRunning = seconds > 0; timerEndsAt = seconds > 0 ? now + seconds*1000 : null; };
  switch (action) {
    case 'CREATE_SESSION': Object.assign(next, makeInitialAdminState()); timerEndsAt = null; pollEndsAt = null; setSound('intro'); break;
    case 'TOGGLE_REGISTRATION': next.registrationOpen = !next.registrationOpen; break;
    case 'SET_FFF_QUESTION': { const q=next.fffBank.find(x=>x.id===payload?.questionId); if(q){next.fullFffQuestion=q;next.fffQuestion=q;} next.stage='FFF_INTRO';next.fffSubmissions=[];next.fffWinner=null;setSound('fff-intro');break; }
    case 'START_FFF': next.stage='FFF_ACTIVE';next.fffStartTime=now;next.fffSubmissions=[];next.fffWinner=null;startTimer(duration);setSound('timer');break;
    case 'END_FFF': { next.stage='FFF_WINNER';next.timer.isRunning=false;timerEndsAt=null;const used=new Set((next as typeof next & {usedContestantIds?:string[]}).usedContestantIds??[]);const allRows=(submissions?.docs??[]).map(d=>{const v=d.data();return {...v,serverReceivedTimestamp:v.serverReceivedTimestamp?.toMillis?.()??now,sequenceNumber:0};}) as AdminGameState['fffSubmissions'];const rows=allRows.filter(v=>!used.has(String(v.participantId)));const result=determineFffWinner(rows,next.fullFffQuestion?.correctOrder??[],next.fffStartTime);next.fffSubmissions=rows;next.fffWinner=result.winner?{participantId:result.winner.participantId,name:result.winner.name,timeTakenMs:result.winner.timeTakenMs}:null;if(next.fffWinner)setSound('winner');break; }
    case 'CONFIRM_HOT_SEAT_WINNER': {const name=String(payload?.name??next.fffWinner?.name??'Contestant');const id=String(payload?.participantId??next.fffWinner?.participantId??'contestant-1');next.hotSeatContestant={id,name,pointsWon:0};(next as typeof next & {usedContestantIds?:string[]}).usedContestantIds=[...new Set([...(next as typeof next & {usedContestantIds?:string[]}).usedContestantIds??[],id])];next.currentLadderLevel=1;next.fullActiveQuestion=next.questionsLadder.find(q=>q.ladderLevel===1)??next.questionsLadder[0]??null;next.stage='HOT_SEAT_INTRO';next.activeQuestionRevealed=false;next.selectedOption=null;next.isAnswerCorrect=null;setSound('hot-seat-welcome');break;}
    case 'START_QUESTION': {const level=Number(payload?.ladderLevel)||next.currentLadderLevel;next.currentLadderLevel=level;next.fullActiveQuestion=next.questionsLadder.find(q=>q.ladderLevel===level)??next.fullActiveQuestion;next.stage='QUESTION_ACTIVE';next.activeQuestionRevealed=false;next.selectedOption=null;next.isAnswerCorrect=null;next.lifelines.fiftyFifty.active=false;next.lifelines.fiftyFifty.hiddenOptions=[];next.lifelines.audiencePoll.active=false;next.lifelines.audiencePoll.percentages={A:0,B:0,C:0,D:0};next.lifelines.audiencePoll.totalVotes=0;startTimer(next.timer.timerMode);setSound('question-appear');break;}
    case 'SET_TIMER_MODE': {const mode=Number(payload?.timerMode);if([0,45,60].includes(mode)){next.timer.timerMode=mode as 0|45|60;startTimer(next.stage==='QUESTION_ACTIVE'?mode:0);}break;}
    case 'TIMER_CONTROL': {const control=payload?.action;if(control==='START'&&next.timer.timerMode!==0){next.timer.isRunning=true;timerEndsAt=now+next.timer.secondsRemaining*1000;}else if(control==='PAUSE'){next.timer.isRunning=false;timerEndsAt=null;}else if(control==='RESET'){const n=next.timer.timerMode===0?0:Number(payload?.duration)||next.timer.timerMode;startTimer(n);}break;}
    case 'ACTIVATE_FIFTY_FIFTY': {if(next.lifelines.fiftyFifty.used||!next.fullActiveQuestion)throw new Error('50:50 is already used or no active question.');next.lifelines.fiftyFifty.used=true;next.lifelines.fiftyFifty.active=true;next.lifelines.fiftyFifty.hiddenOptions=computeFiftyFifty(next.fullActiveQuestion.options.map(o=>o.id),next.fullActiveQuestion.correctOption);setSound('lifeline');break;}
    case 'ACTIVATE_AUDIENCE_POLL': {if(next.lifelines.audiencePoll.used)throw new Error('Audience Poll is already used.');next.lifelines.audiencePoll.used=true;next.lifelines.audiencePoll.active=true;next.lifelines.audiencePoll.durationSeconds=duration;next.lifelines.audiencePoll.secondsRemaining=duration;next.lifelines.audiencePoll.percentages={A:0,B:0,C:0,D:0};next.lifelines.audiencePoll.totalVotes=0;next.pollId=`poll-${now}`;pollEndsAt=now+duration*1000;setSound('poll-start');break;}
    case 'CLOSE_AUDIENCE_POLL': next.lifelines.audiencePoll.active=false;pollEndsAt=null;setSound('poll-end');break;
    case 'USE_ASK_MAHARAJ': next.lifelines.askMaharaj.used=true;next.lifelines.askMaharaj.active=true;setSound('maharaj-cue');break;
    case 'REVEAL_ANSWER': {if(!next.fullActiveQuestion)throw new Error('No active question.');next.activeQuestionRevealed=true;next.stage='ANSWER_REVEALED';next.timer.isRunning=false;timerEndsAt=null;const correct=next.selectedOption===next.fullActiveQuestion.correctOption;next.isAnswerCorrect=correct;if(correct){const points=PRIZE_LADDER.find(p=>p.level===next.currentLadderLevel)?.points??0;if(next.hotSeatContestant)next.hotSeatContestant.pointsWon=points;if(next.currentLadderLevel>=8)next.lastSecuredMilestone=2500000;else if(next.currentLadderLevel>=3)next.lastSecuredMilestone=10000;if(next.currentLadderLevel===11){next.stage='GAME_COMPLETED';setSound('crorepati');}else setSound('correct');}else{if(next.hotSeatContestant)next.hotSeatContestant.pointsWon=calculatePointsOnWrongAnswer(next.currentLadderLevel);setSound('wrong');}break;}
    case 'ADVANCE_QUESTION': {if(next.currentLadderLevel<11){next.currentLadderLevel++;next.fullActiveQuestion=next.questionsLadder.find(q=>q.ladderLevel===next.currentLadderLevel)??next.fullActiveQuestion;next.stage='QUESTION_ACTIVE';next.activeQuestionRevealed=false;next.selectedOption=null;next.isAnswerCorrect=null;next.lifelines.fiftyFifty.active=false;next.lifelines.fiftyFifty.hiddenOptions=[];next.lifelines.audiencePoll.active=false;startTimer(next.timer.timerMode);setSound('question-appear');}break;}
    case 'ADD_QUESTION': {const q=payload?.question as Partial<SpiritualQuestion>;if(!q?.question||!q.options||q.options.length!==4||!q.correctOption)throw new Error('Question needs text, four options, and a correct answer.');const level=Number(q.ladderLevel)||0;const added={...q,id:`q-custom-${now.toString(36)}`,ladderLevel:level} as SpiritualQuestion;if(level>=1&&level<=11){const i=next.questionsLadder.findIndex(x=>x.ladderLevel===level);if(i>=0)next.questionsLadder[i]=added;else next.questionsLadder.push(added);if(next.currentLadderLevel===level)next.fullActiveQuestion=added;}else next.questionBank.unshift(added);setSound('lifeline');break;}
    case 'SET_LADDER_QUESTION': {const level=Number(payload?.ladderLevel);const q=next.questionBank.find(x=>x.id===payload?.questionId)??next.questionsLadder.find(x=>x.id===payload?.questionId);if(!q||level<1||level>11)throw new Error('Choose a valid question and ladder level.');const updated={...q,ladderLevel:level};const i=next.questionsLadder.findIndex(x=>x.ladderLevel===level);if(i>=0)next.questionsLadder[i]=updated;else next.questionsLadder.push(updated);if(next.currentLadderLevel===level)next.fullActiveQuestion=updated;break;}
    case 'TOGGLE_SOUND': next.soundEnabled=!next.soundEnabled;break;
    case 'MANAGE_QUESTION_BANK': if(payload?.questionsLadder)next.questionsLadder=payload.questionsLadder as SpiritualQuestion[];if(payload?.questionBank)next.questionBank=payload.questionBank as SpiritualQuestion[];break;
    default: throw new Error('Unknown show action.');
  }
  next.activeQuestion = next.fullActiveQuestion ? { ...next.fullActiveQuestion, correctOption: next.activeQuestionRevealed ? next.fullActiveQuestion.correctOption : null, explanation: next.activeQuestionRevealed ? next.fullActiveQuestion.explanation : null } : null;
  next.fffQuestion = next.fullFffQuestion ?? next.fffQuestion;
  await withTimer(next, timerEndsAt, pollEndsAt);
  return true;
}

export async function contestantSelect(option: 'A'|'B'|'C'|'D') { if(!db) return false; const batch=writeBatch(db);batch.update(publicRef(),{selectedOption:option});batch.update(adminRef(),{selectedOption:option});await batch.commit();return true; }
export async function contestantConfirm() { if(!db) return false; const batch=writeBatch(db);batch.update(publicRef(),{stage:'ANSWER_LOCKED','timer.isRunning':false,timerEndsAt:null});batch.update(adminRef(),{stage:'ANSWER_LOCKED','timer.isRunning':false,timerEndsAt:null});await batch.commit();return true; }
export async function contestantQuit() { if(!db) return false; const snap=await getDoc(publicRef());if(!snap.exists())return false;const s=snap.data() as PublicGameState;const points=calculatePointsOnQuit(s.currentLadderLevel-1);const batch=writeBatch(db);const change={stage:'CONTESTANT_QUIT','timer.isRunning':false,timerEndsAt:null,'hotSeatContestant.pointsWon':points};batch.update(publicRef(),change);batch.update(adminRef(),change);await batch.commit();return true; }

export async function resolveLocalTimerExpiry(): Promise<void> {
  if(!db)return;const snap=await getDoc(adminRef());if(!snap.exists())return;const data=snap.data() as AdminGameState & {timerEndsAt?:number|null;pollEndsAt?:number|null};const now=Date.now();let changed=false;if(data.timerEndsAt&&data.timerEndsAt<=now){data.timerEndsAt=null;data.timer.isRunning=false;data.timer.secondsRemaining=0;changed=true;}if(data.pollEndsAt&&data.pollEndsAt<=now){data.pollEndsAt=null;data.lifelines.audiencePoll.active=false;data.lifelines.audiencePoll.secondsRemaining=0;if(data.soundEnabled)data.soundTrigger={type:'poll-end',timestamp:now};changed=true;}if(changed)await withTimer(data,data.timerEndsAt??null,data.pollEndsAt??null);
}
