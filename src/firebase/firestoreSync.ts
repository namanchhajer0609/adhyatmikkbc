import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, firebaseConfig } from './config';

/**
 * Real-time Firestore synchronisation for Adhyatmik KBC
 * Connected to Firebase project: kaunbanegacrorepati
 */

export interface FirestoreParticipant {
  id: string;
  name: string;
  registeredAt: number;
}

export const syncGameStateToFirestore = async (
  sessionId: string,
  state: Record<string, unknown>
): Promise<boolean> => {
  if (!db || !isFirebaseConfigured()) return false;
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
    await setDoc(
      sessionRef,
      {
        ...state,
        lastUpdated: serverTimestamp(),
        firebaseProject: firebaseConfig.projectId,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Firestore game sync error:', err);
    return false;
  }
};

export const saveParticipantToFirestore = async (
  sessionId: string,
  participant: FirestoreParticipant
): Promise<boolean> => {
  if (!db || !isFirebaseConfigured()) return false;
  try {
    const partRef = doc(db, 'gameSessions', sessionId, 'participants', participant.id);
    await setDoc(partRef, {
      ...participant,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Firestore participant save error:', err);
    return false;
  }
};

export const saveFffSubmissionToFirestore = async (
  sessionId: string,
  submission: {
    participantId: string;
    name: string;
    submittedOrder: string[];
    serverReceivedTimestamp: number;
    sequenceNumber: number;
  }
): Promise<boolean> => {
  if (!db || !isFirebaseConfigured()) return false;
  try {
    const subRef = doc(db, 'gameSessions', sessionId, 'fffSubmissions', submission.participantId);
    await setDoc(subRef, {
      ...submission,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Firestore FFF submission save error:', err);
    return false;
  }
};

export const savePollVoteToFirestore = async (
  sessionId: string,
  participantId: string,
  optionKey: string
): Promise<boolean> => {
  if (!db || !isFirebaseConfigured()) return false;
  try {
    const voteRef = doc(db, 'gameSessions', sessionId, 'pollVotes', participantId);
    await setDoc(voteRef, {
      participantId,
      optionKey,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Firestore poll vote save error:', err);
    return false;
  }
};
