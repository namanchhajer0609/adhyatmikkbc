import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIZE_LADDER,
  calculatePointsOnWrongAnswer,
  calculatePointsOnQuit,
  computeFiftyFifty,
  validateFffSubmission,
  determineFffWinner,
  calculateAudiencePollPercentages,
  formatSamvarPoints,
} from './rules';

test('Prize ladder has exactly 11 questions reaching 7 Crore Samvar Points', () => {
  assert.equal(PRIZE_LADDER.length, 11);
  assert.equal(PRIZE_LADDER[0].points, 1000);
  assert.equal(PRIZE_LADDER[1].points, 5000);
  assert.equal(PRIZE_LADDER[2].points, 10000); // Milestone 1
  assert.equal(PRIZE_LADDER[2].isGuaranteed, true);
  assert.equal(PRIZE_LADDER[7].points, 2500000); // Milestone 2
  assert.equal(PRIZE_LADDER[7].isGuaranteed, true);
  assert.equal(PRIZE_LADDER[10].points, 70000000); // 7 Crore
  assert.ok(PRIZE_LADDER[10].displayPoints.includes('7 CRORE'));
});

test('Wrong answer rules: before Q3 yields 0 points', () => {
  assert.equal(calculatePointsOnWrongAnswer(1), 0);
  assert.equal(calculatePointsOnWrongAnswer(2), 0);
});

test('Wrong answer rules: after securing Q3 but before Q8 yields 10,000 points', () => {
  assert.equal(calculatePointsOnWrongAnswer(3), 10000);
  assert.equal(calculatePointsOnWrongAnswer(4), 10000);
  assert.equal(calculatePointsOnWrongAnswer(5), 10000);
  assert.equal(calculatePointsOnWrongAnswer(6), 10000);
  assert.equal(calculatePointsOnWrongAnswer(7), 10000);
});

test('Wrong answer rules: after securing Q8 yields 25 Lakh (25,00,000) points', () => {
  assert.equal(calculatePointsOnWrongAnswer(8), 2500000);
  assert.equal(calculatePointsOnWrongAnswer(9), 2500000);
  assert.equal(calculatePointsOnWrongAnswer(10), 2500000);
  assert.equal(calculatePointsOnWrongAnswer(11), 2500000);
});

test('Quitting rules: retains exact amount of last correctly answered question', () => {
  // If contestant answered Q4 correctly and quits on Q5, they get 25,000
  assert.equal(calculatePointsOnQuit(4), 25000);
  // If contestant answered Q3 correctly and quits on Q4, they get 10,000
  assert.equal(calculatePointsOnQuit(3), 10000);
  // If contestant answered Q9 correctly and quits on Q10, they get 50,00,000
  assert.equal(calculatePointsOnQuit(9), 5000000);
  // If contestant quits before answering any question
  assert.equal(calculatePointsOnQuit(0), 0);
});

test('50:50 Lifeline never removes correct option and hides exactly 2 incorrect options', () => {
  const options = ['A', 'B', 'C', 'D'];
  const correctOption = 'C';

  for (let i = 0; i < 20; i++) {
    const hidden = computeFiftyFifty(options, correctOption);
    assert.equal(hidden.length, 2);
    assert.ok(!hidden.includes(correctOption), 'Correct option C must NEVER be removed');
    assert.ok(hidden.every((opt) => options.includes(opt) && opt !== correctOption));
    assert.notEqual(hidden[0], hidden[1]);
  }
});

test('Fastest Finger First validation checks exact sequence', () => {
  const correctOrder = ['opt-3', 'opt-1', 'opt-4', 'opt-2'];
  assert.equal(validateFffSubmission(['opt-3', 'opt-1', 'opt-4', 'opt-2'], correctOrder), true);
  assert.equal(validateFffSubmission(['opt-1', 'opt-3', 'opt-4', 'opt-2'], correctOrder), false);
  assert.equal(validateFffSubmission(['opt-3', 'opt-1'], correctOrder), false);
});

test('FFF winner determination selects fastest correct submission with server tie-breaker', () => {
  const correctOrder = ['1', '2', '3', '4'];
  const startTime = 1000;

  const submissions = [
    {
      participantId: 'p1',
      name: 'Aarav',
      submittedOrder: ['1', '2', '3', '4'],
      serverReceivedTimestamp: 3500,
      sequenceNumber: 1,
    },
    {
      participantId: 'p2',
      name: 'Diya',
      submittedOrder: ['1', '2', '4', '3'], // Incorrect
      serverReceivedTimestamp: 2000,
      sequenceNumber: 2,
    },
    {
      participantId: 'p3',
      name: 'Bhavik',
      submittedOrder: ['1', '2', '3', '4'], // Correct and fastest
      serverReceivedTimestamp: 2800,
      sequenceNumber: 3,
    },
  ];

  const result = determineFffWinner(submissions, correctOrder, startTime);
  assert.ok(result.winner !== null);
  assert.equal(result.winner?.name, 'Bhavik');
  assert.equal(result.winner?.timeTakenMs, 1800);
});

test('Audience Poll calculates real percentages summing to 100%', () => {
  const votes = {
    user1: 'A',
    user2: 'B',
    user3: 'B',
    user4: 'C',
    user5: 'B',
  };

  const poll = calculateAudiencePollPercentages(votes);
  assert.equal(poll.totalVotes, 5);
  assert.equal(poll.counts.B, 3);
  assert.equal(poll.counts.A, 1);
  assert.equal(poll.counts.C, 1);
  assert.equal(poll.counts.D, 0);

  const sum = poll.percentages.A + poll.percentages.B + poll.percentages.C + poll.percentages.D;
  assert.equal(sum, 100);
  assert.equal(poll.percentages.B, 60);
});

test('Formatting Samvar Points strictly avoids currency or rupees terminology', () => {
  const p1 = formatSamvarPoints(10000);
  assert.ok(!p1.includes('₹') && !p1.includes('Rs') && !p1.includes('Rupee'));
  assert.ok(p1.includes('Samvar Points'));

  const p11 = formatSamvarPoints(70000000);
  assert.equal(p11, '7 CRORE SAMVAR POINTS');
});
