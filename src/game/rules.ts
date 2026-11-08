export interface PrizeLevel {
  level: number;
  label: string;
  points: number;
  displayPoints: string;
  isGuaranteed: boolean;
}

export const PRIZE_LADDER: PrizeLevel[] = [
  { level: 1, label: 'Q1', points: 1000, displayPoints: '1,000 Samvar Points', isGuaranteed: false },
  { level: 2, label: 'Q2', points: 5000, displayPoints: '5,000 Samvar Points', isGuaranteed: false },
  { level: 3, label: 'Q3', points: 10000, displayPoints: '10,000 Samvar Points', isGuaranteed: true },
  { level: 4, label: 'Q4', points: 25000, displayPoints: '25,000 Samvar Points', isGuaranteed: false },
  { level: 5, label: 'Q5', points: 50000, displayPoints: '50,000 Samvar Points', isGuaranteed: false },
  { level: 6, label: 'Q6', points: 100000, displayPoints: '1,00,000 Samvar Points', isGuaranteed: false },
  { level: 7, label: 'Q7', points: 1000000, displayPoints: '10,00,000 Samvar Points', isGuaranteed: false },
  { level: 8, label: 'Q8', points: 2500000, displayPoints: '25,00,000 Samvar Points', isGuaranteed: true },
  { level: 9, label: 'Q9', points: 5000000, displayPoints: '50,00,000 Samvar Points', isGuaranteed: false },
  { level: 10, label: 'Q10', points: 10000000, displayPoints: '1,00,00,000 Samvar Points', isGuaranteed: false },
  { level: 11, label: 'Q11', points: 70000000, displayPoints: '7 CRORE SAMVAR POINTS', isGuaranteed: false },
];

export const MILESTONE_1_LEVEL = 3;
export const MILESTONE_1_POINTS = 10000;
export const MILESTONE_2_LEVEL = 8;
export const MILESTONE_2_POINTS = 2500000;
export const MAX_POINTS = 70000000;

/**
 * Calculates Samvar Points earned when contestant submits a wrong answer.
 * - Wrong answer before Q3: 0 points
 * - Wrong answer after securing Q3 but before Q8: 10,000 points
 * - Wrong answer after securing Q8: 25 Lakh (25,00,000) Samvar Points
 *
 * @param currentQuestionLevel 1-based question level (1 to 11) being attempted
 */
export function calculatePointsOnWrongAnswer(currentQuestionLevel: number): number {
  if (currentQuestionLevel < MILESTONE_1_LEVEL) {
    return 0;
  }
  if (currentQuestionLevel < MILESTONE_2_LEVEL) {
    return MILESTONE_1_POINTS;
  }
  return MILESTONE_2_POINTS;
}

/**
 * Calculates Samvar Points retained when contestant decides to quit.
 * Contestant keeps the amount corresponding to the LAST correctly answered question.
 *
 * @param lastCorrectQuestionLevel 1-based question level (0 if quit before answering Q1)
 */
export function calculatePointsOnQuit(lastCorrectQuestionLevel: number): number {
  if (lastCorrectQuestionLevel <= 0) {
    return 0;
  }
  const item = PRIZE_LADDER.find((p) => p.level === lastCorrectQuestionLevel);
  return item ? item.points : 0;
}

/**
 * 50:50 Lifeline logic:
 * Removes exactly 2 incorrect options, preserving the correct answer and 1 random incorrect answer.
 *
 * @param allOptions Array of 4 option keys e.g. ['A', 'B', 'C', 'D']
 * @param correctOption The single correct option key e.g. 'B'
 * @param randomSeed Optional random function (defaults to Math.random)
 * @returns Array of 2 option keys to hide
 */
export function computeFiftyFifty(
  allOptions: string[],
  correctOption: string,
  randomFn: () => number = Math.random
): string[] {
  const incorrectOptions = allOptions.filter((opt) => opt !== correctOption);
  if (incorrectOptions.length <= 2) {
    return incorrectOptions;
  }
  // Shuffle incorrect options deterministically or pseudo-randomly
  const shuffled = [...incorrectOptions].sort(() => randomFn() - 0.5);
  // Pick first 2 to eliminate, leaving 1 incorrect + 1 correct visible
  return shuffled.slice(0, 2);
}

/**
 * Validates a Fastest Finger First submission.
 * Checks if the submitted item ID order matches the expected correct order.
 */
export function validateFffSubmission(
  submittedOrder: string[],
  correctOrder: string[]
): boolean {
  if (submittedOrder.length !== correctOrder.length) return false;
  return submittedOrder.every((id, idx) => id === correctOrder[idx]);
}

export interface FffParticipantSubmission {
  participantId: string;
  name: string;
  submittedOrder: string[];
  serverReceivedTimestamp: number;
  sequenceNumber: number;
}

export interface FffEvaluatedResult extends FffParticipantSubmission {
  isCorrect: boolean;
  timeTakenMs: number;
}

/**
 * Evaluates all FFF submissions and determines the winner based on:
 * 1. Correctness (only correct submissions qualify)
 * 2. Fastest submission relative to question start time
 * 3. Tie-breaker by server sequenceNumber
 */
export function determineFffWinner(
  submissions: FffParticipantSubmission[],
  correctOrder: string[],
  questionStartTime: number
): { winner: FffEvaluatedResult | null; leaderboard: FffEvaluatedResult[] } {
  const evaluated: FffEvaluatedResult[] = submissions.map((sub) => {
    const isCorrect = validateFffSubmission(sub.submittedOrder, correctOrder);
    const timeTakenMs = Math.max(0, sub.serverReceivedTimestamp - questionStartTime);
    return {
      ...sub,
      isCorrect,
      timeTakenMs,
    };
  });

  // Sort: correct first, then lowest timeTakenMs, then sequenceNumber
  evaluated.sort((a, b) => {
    if (a.isCorrect && !b.isCorrect) return -1;
    if (!a.isCorrect && b.isCorrect) return 1;
    if (a.isCorrect && b.isCorrect) {
      if (a.timeTakenMs !== b.timeTakenMs) {
        return a.timeTakenMs - b.timeTakenMs;
      }
      return a.sequenceNumber - b.sequenceNumber;
    }
    return a.sequenceNumber - b.sequenceNumber;
  });

  const correctSubs = evaluated.filter((e) => e.isCorrect);
  const winner = correctSubs.length > 0 ? correctSubs[0] : null;

  return { winner, leaderboard: evaluated };
}

/**
 * Calculates percentage breakdown for Audience Poll.
 * Returns percentages that sum to 100% (or 0% if no votes).
 */
export function calculateAudiencePollPercentages(
  votes: Record<string, string>, // participantId -> optionKey ('A' | 'B' | 'C' | 'D')
  optionKeys: string[] = ['A', 'B', 'C', 'D']
): { counts: Record<string, number>; percentages: Record<string, number>; totalVotes: number } {
  const counts: Record<string, number> = {};
  const percentages: Record<string, number> = {};

  optionKeys.forEach((key) => {
    counts[key] = 0;
    percentages[key] = 0;
  });

  const voteValues = Object.values(votes);
  const totalVotes = voteValues.length;

  voteValues.forEach((opt) => {
    if (counts[opt] !== undefined) {
      counts[opt]++;
    }
  });

  if (totalVotes === 0) {
    return { counts, percentages, totalVotes: 0 };
  }

  // Calculate percentages rounded to integers
  let sum = 0;
  optionKeys.forEach((key) => {
    percentages[key] = Math.round((counts[key] / totalVotes) * 100);
    sum += percentages[key];
  });

  // Normalize rounding difference if needed
  if (sum !== 100 && totalVotes > 0) {
    // Find the option with highest count to absorb rounding diff
    let maxKey = optionKeys[0];
    optionKeys.forEach((key) => {
      if (counts[key] > counts[maxKey]) {
        maxKey = key;
      }
    });
    percentages[maxKey] += 100 - sum;
  }

  return { counts, percentages, totalVotes };
}

/**
 * Formats a point amount into Indian numbering representation with "Samvar Points".
 */
export function formatSamvarPoints(points: number): string {
  if (points >= 70000000) {
    return '7 CRORE SAMVAR POINTS';
  }
  if (points >= 10000000) {
    const crore = points / 10000000;
    return `${crore} Crore Samvar Points`;
  }
  if (points >= 100000) {
    const lakh = points / 100000;
    return `${lakh} Lakh Samvar Points`;
  }
  return `${points.toLocaleString('en-IN')} Samvar Points`;
}
