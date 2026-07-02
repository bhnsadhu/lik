import { QUIZ_QUESTIONS } from '../pages/Quiz';

// Hard limits a student can set. Conflicts are the strongest compatibility
// signal we have: a direct clash between two people's stated dealbreakers,
// or between one person's dealbreaker and the other's quiz answer.
export const NONNEGOTIABLES = [
  { key: 'substance free space', conflictsWith: ['420 friendly'], quizConflict: { key: 'substances', value: 'b' } },
  { key: '420 friendly', conflictsWith: ['substance free space'] },
  { key: 'no smoking indoors' },
  { key: 'quiet after midnight' },
  { key: 'no overnight guests', quizConflict: { key: 'guests', value: 'b' } },
  { key: 'no pets', conflictsWith: ['i have a pet'] },
  { key: 'i have a pet', conflictsWith: ['no pets'] },
  { key: 'same sleep schedule', special: 'sleep' },
  { key: 'clean kitchen always' },
  { key: 'lgbtq+ friendly space' },
  { key: 'no parties at home', conflictsWith: ['host parties sometimes'] },
  { key: 'host parties sometimes', conflictsWith: ['no parties at home'] },
];

const NN_BY_KEY = Object.fromEntries(NONNEGOTIABLES.map(n => [n.key, n]));

function directionConflicts(nnList, otherNNSet, otherQuiz, myQuiz) {
  const found = new Set();
  for (const key of nnList) {
    const def = NN_BY_KEY[key];
    if (!def) continue;
    if (def.conflictsWith?.some(c => otherNNSet.has(c))) found.add(key);
    if (def.quizConflict && otherQuiz?.[def.quizConflict.key] === def.quizConflict.value) found.add(key);
    if (def.special === 'sleep' && myQuiz?.sleep_schedule && otherQuiz?.sleep_schedule
        && myQuiz.sleep_schedule !== otherQuiz.sleep_schedule) found.add(key);
  }
  return found;
}

// Quiz answers drive the base score (each of 12 matches counts equally).
// Nonnegotiables weight it: any conflict is a heavy penalty, a clean slate
// with zero conflicts earns a small bonus. Clamped so we never show 0 or 100.
export function computeCompatibility(myQuiz, theirQuiz, myNN, theirNN) {
  const mine = myNN ?? [];
  const theirs = theirNN ?? [];
  const mySet = new Set(mine);
  const theirSet = new Set(theirs);

  let matched = 0;
  const commons = [];
  for (const q of QUIZ_QUESTIONS) {
    const a = myQuiz?.[q.key];
    const b = theirQuiz?.[q.key];
    if (a && b && a === b) {
      matched += 1;
      commons.push((a === 'a' ? q.a : q.b).label);
    }
  }

  const sharedNN = mine.filter(k => theirSet.has(k));
  const conflictKeys = new Set([
    ...directionConflicts(mine, theirSet, theirQuiz, myQuiz),
    ...directionConflicts(theirs, mySet, myQuiz, theirQuiz),
  ]);

  let percent = (matched / QUIZ_QUESTIONS.length) * 100;
  if (conflictKeys.size === 0) percent += 8;
  percent -= conflictKeys.size * 15;
  percent = Math.round(Math.min(99, Math.max(5, percent)));

  return {
    percent,
    // shared hard limits first: they matter more than shared habits
    commons: [...sharedNN.map(k => `you both need ${k}`), ...commons],
    conflicts: [...conflictKeys],
  };
}
