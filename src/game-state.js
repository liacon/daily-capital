import capitalsData from "./data/capitals.json" with { type: "json" };
import { scoreGuess } from "./scoring.js";
import { utcDateString } from "./daily-clock.js";

export function guessesFromSavedPlay(play, target) {
  if (!play?.guesses || play.targetId !== target.id) return [];

  return play.guesses.flatMap((guessId) => {
    const capital = capitalsData.capitals.find((item) => item.id === guessId);
    if (!capital) return [];
    return [{ ...capital, ...scoreGuess(capital, target) }];
  });
}

export function initialGuessesForToday(store, today, target, demoTarget) {
  if (demoTarget) return [];

  const savedGuesses = guessesFromSavedPlay(store.plays?.[today], target);
  if (savedGuesses.length > 0) return savedGuesses;

  if (store.history?.[today]?.won) {
    return [{ ...target, distance: 0, score: 100, restored: true }];
  }

  return [];
}

export function initialRevealForToday(store, today, target, demoTarget) {
  if (demoTarget) return false;
  const savedPlay = store.plays?.[today];
  if (savedPlay?.targetId === target.id && savedPlay.revealed) return true;
  return Boolean(store.history?.[today]?.revealed && !store.history?.[today]?.won);
}

export function addDays(dateString, offset) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return utcDateString(date);
}

export function computeStreak(history, today) {
  let anchor = history[today]?.won ? today : addDays(today, -1);
  let streak = 0;

  while (history[anchor]?.won) {
    streak += 1;
    anchor = addDays(anchor, -1);
  }

  return streak;
}

