// Branding + fixed lists, straight out of the PRD.

export const BRAND = {
  welcome: 'All Aboard!',
  startQuiz: 'Depart Now',
  chooseDestination: 'Choose Your Destination',
  hallOfFame: "Engineer's Log",
  mistakeBucket: 'Repair Yard',
  perfectScore: 'Express Service!',
  quizComplete: 'You reached the station!',
  tagline: 'All Aboard for Olympiad Success!',
};

export const SUBJECTS = ['English', 'Maths', 'Science', 'Computers', 'General Knowledge'];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export function scoreBucketKey(score, total) {
  if (score === total) return String(total);            // "20"
  if (score === total - 1) return String(total - 1);      // "19"
  const pct = score / total;
  if (pct >= 0.8) return '16-18';
  if (pct >= 0.6) return '12-15';
  return '0-11';
}

export function starsForScore(score, total) {
  const pct = score / total;
  if (pct === 1) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.4) return 1;
  return 0;
}
