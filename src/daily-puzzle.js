import { catalogVersionForDate, catalogVersionById } from "./capital-catalog.js";

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

export function targetForDate(dateString, version = catalogVersionForDate(dateString)) {
  const capitals = version.targets;
  const puzzleIndex = Math.max(0, dayNumber(dateString) - dayNumber(version.epoch));
  const cycle = Math.floor(puzzleIndex / capitals.length);
  const deckIndex = puzzleIndex % capitals.length;
  const deck = [...capitals];
  const random = seededRandom(hashString(version.seedPrefix + cycle));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck[deckIndex];
}

// A game started in an older build keeps its deck and scoring reference.
export function puzzleForSavedPlay(date, play) {
  const active = catalogVersionForDate(date);
  const explicit = catalogVersionById(play?.catalogVersion);
  const candidates = play?.catalogVersion ? (explicit ? [explicit] : [])
    : [catalogVersionById("v2"), catalogVersionById("v1"), active];
  if (play?.targetId) {
    for (const version of candidates) {
      if (version.from <= date) {
        const target = targetForDate(date, version);
        if (target.id === play.targetId) return { version, target };
      }
    }
  }
  return { version: active, target: targetForDate(date, active) };
}
