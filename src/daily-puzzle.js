import { capitalsForDate } from "./capital-catalog.js";

const GAME_START = "2024-01-01";

export function dayNumber(dateString) {
  const start = Date.parse(`${GAME_START}T00:00:00Z`);
  const day = Date.parse(`${dateString}T00:00:00Z`);
  return Math.floor((day - start) / 86400000) + 1;
}

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

export function targetForDate(dateString) {
  const capitals = capitalsForDate(dateString);
  const puzzleIndex = Math.max(0, dayNumber(dateString) - 1);
  const cycle = Math.floor(puzzleIndex / capitals.length);
  const deckIndex = puzzleIndex % capitals.length;
  const deck = [...capitals];
  const random = seededRandom(hashString(`loughlane-capital-cycle-${cycle}`));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck[deckIndex];
}
