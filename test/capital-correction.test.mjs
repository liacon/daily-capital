import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { EQUATORIAL_GUINEA_CORRECTION as correction, applyCapitalCorrections, showCapitalCorrection } from "../src/capital-corrections.js";
import { capitalsForDate, capitalForSavedId, catalogVersionForDate } from "../src/capital-catalog.js";
import { targetForDate } from "../src/daily-puzzle.js";
import { scoreGuess, distanceKm } from "../src/scoring.js";
import { initialGuessesForToday, initialRevealForToday, computeStreak } from "../src/game-state.js";

const historical = capitalsForDate("2026-11-25");
const current = capitalsForDate("2026-11-26");
const hash = (value) => createHash("sha256").update(value).digest("hex");

test("capital relocation activates on the game cutover, with a distinct ID and mainland coordinates", () => {
  assert.equal(current.length, 199);
  const index = historical.findIndex((city) => city.id === correction.previous.id);
  assert.deepEqual(current[index], correction.current);
  assert(!current.some((city) => city.id === correction.previous.id));
  assert(!historical.some((city) => city.id === correction.current.id));
  assert(Math.abs(correction.current.lat - (1 + 35 / 60 + 33 / 3600)) < 0.000001);
  assert(Math.abs(correction.current.lon - (10 + 49 / 60 + 25 / 3600)) < 0.000001);
  assert(distanceKm(correction.previous, correction.current) > 300);
  assert(scoreGuess(correction.previous, correction.current).score < 100);
  assert.equal(scoreGuess(correction.current, correction.current).score, 100);
  assert.equal(capitalForSavedId(correction.previous.id, "2026-11-26").capital, "Malabo");
});

test("legacy schedule retains all 3,000 original slots when explicitly selected", () => {
  const ids = [];
  for (let index = 0; index < 3000; index += 1) {
    const date = new Date(Date.UTC(2024, 0, 1 + index)).toISOString().slice(0, 10);
    const target = targetForDate(date, catalogVersionForDate(date < correction.gameFrom ? date : correction.gameFrom));
    if (date >= correction.gameFrom) assert.notEqual(target.id, correction.previous.id);
    ids.push(target.id === correction.current.id ? correction.previous.id : target.id);
  }
  // Golden digest captured from the unmodified application before this change.
  assert.equal(hash(ids.join("\n")), "0188c4797f7ca69c97cd54a55355028b3fae72f63259e5bf5056cf1153633cb3");
  assert.deepEqual(targetForDate("2026-11-25"), correction.previous);
  assert.equal(targetForDate("2026-11-26").id, "lilongwe-malawi");
});

test("every historical score stays unchanged even after current-catalog scoring populates the cache", () => {
  current.forEach((target) => scoreGuess(current[0], target, current));
  const scores = historical.flatMap((target) => historical.map((guess) => scoreGuess(guess, target, historical).score));
  // Original 199 x 199 score matrix, including exact matches.
  assert.equal(hash(JSON.stringify(scores)), "5ad8b2b004e3f6afd769c8735b13732e91ea9e7cfa14eec6f4b844f2782a9bed");
});

test("old unfinished, solved and revealed Malabo plays restore without rewriting history or streaks", () => {
  const date = correction.puzzleDate;
  const other = historical.find((city) => city.capital === "Libreville");
  for (const state of ["unfinished", "won", "revealed"]) {
    const won = state === "won", revealed = state === "revealed";
    const ids = won ? [other.id, correction.previous.id] : [other.id];
    const store = {
      history: won || revealed ? { [date]: { won, revealed, guesses: ids.length, guessIds: ids, puzzleNumber: 1060 } } : {},
      plays: { [date]: { targetId: correction.previous.id, guesses: ids, won, revealed } }
    };
    const snapshot = JSON.stringify(store);
    const restored = initialGuessesForToday(store, date, targetForDate(date), null);
    assert.deepEqual(restored.map((guess) => guess.id), ids);
    assert.equal(restored.at(-1).score === 100, won);
    assert.equal(initialRevealForToday(store, date, targetForDate(date), null), revealed);
    assert.equal(computeStreak(store.history, correction.gameFrom), won ? 1 : 0);
    assert.deepEqual(initialGuessesForToday(store, correction.gameFrom, targetForDate(correction.gameFrom), null), []);
    assert.equal(JSON.stringify(store), snapshot);
  }
});

test("generator correction is repeatable, preserves order and rejects ambiguous source data", () => {
  const snapshot = JSON.stringify(historical);
  assert.deepEqual(applyCapitalCorrections(historical), current);
  assert.deepEqual(applyCapitalCorrections(current), current);
  assert.equal(JSON.stringify(historical), snapshot);
  assert.throws(() => applyCapitalCorrections([...historical, correction.current]));
  assert.throws(() => applyCapitalCorrections(historical.filter((city) => city.id !== correction.previous.id)));
});

test("notice is withheld on puzzle day, available for a week and respects dismissal", () => {
  assert.equal(showCapitalCorrection("2026-11-25"), false);
  assert.equal(showCapitalCorrection("2026-11-26"), true);
  assert.equal(showCapitalCorrection("2026-12-02"), true);
  assert.equal(showCapitalCorrection("2026-12-03"), false);
  assert.equal(showCapitalCorrection("2026-11-26", true), false);
});
