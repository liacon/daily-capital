import assert from "node:assert/strict";
import test from "node:test";
import capitalsData from "../src/data/capitals.json" with { type: "json" };
import { scoreGuess } from "../src/scoring.js";
import { initialGuessesForToday, initialRevealForToday, computeStreak, addDays } from "../src/game-state.js";

const target = capitalsData.capitals.find((c) => c.capital === "Cape Town");
const guess = capitalsData.capitals.find((c) => c.capital === "Pretoria");
const today = "2026-10-15";
const tomorrow = "2026-10-16";

test("unfinished, solved, and revealed games do not carry into a new date", () => {
  for (const state of ["unfinished", "won", "revealed"]) {
    const won = state === "won", revealed = state === "revealed";
    const store = {
      history: won || revealed ? { [today]: { won, revealed, guesses: 2 } } : {},
      plays: { [today]: { targetId: target.id, guesses: won ? [guess.id, target.id] : [guess.id], won, revealed } }
    };
    const snapshot = JSON.stringify(store);
    assert.deepEqual(initialGuessesForToday(store, tomorrow, target, null), []);
    assert.equal(initialRevealForToday(store, tomorrow, target, null), false);
    assert.equal(computeStreak(store.history, tomorrow), won ? 1 : 0);
    assert.equal(JSON.stringify(store), snapshot);
  }
});

test("restored plays keep guess IDs/order and use the current scoring curve", () => {
  const store = { history: {}, plays: { [today]: { targetId: target.id, guesses: [guess.id, "unknown-id", target.id] } } };
  const restored = initialGuessesForToday(store, today, target, null);
  assert.deepEqual(restored.map((g) => g.id), [guess.id, target.id]);
  assert.equal(restored[0].score, 76);
  assert.equal(restored[0].distance, scoreGuess(guess, target).distance);
  assert.equal(restored[1].score, 100);
});

test("revealed state restores only for its date and preview does not restore daily play", () => {
  const store = { history: { [today]: { revealed: true } }, plays: { [today]: { targetId: target.id, guesses: [guess.id], revealed: true } } };
  assert.equal(initialRevealForToday(store, today, target, null), true);
  assert.equal(initialRevealForToday(store, today, target, target), false);
  assert.deepEqual(initialGuessesForToday(store, today, target, target), []);
  assert.equal(computeStreak(store.history, tomorrow), 0);
});

test("a different target cannot restore old guesses; legacy completed games stay completed", () => {
  const store = { history: {}, plays: { [today]: { targetId: guess.id, guesses: [guess.id] } } };
  assert.deepEqual(initialGuessesForToday(store, today, target, null), []);
  const legacy = { history: { [today]: { won: true, guesses: 4 } } };
  assert.equal(initialGuessesForToday(legacy, today, target, null)[0].score, 100);
  assert.equal(legacy.history[today].guesses, 4);
});

test("streak survives midnight, expires after a missed day, and crosses year boundaries", () => {
  const history = { "2026-12-30": { won: true }, "2026-12-31": { won: true } };
  assert.equal(computeStreak(history, "2027-01-01"), 2);
  assert.equal(computeStreak(history, "2027-01-02"), 0);
  assert.equal(addDays("2027-01-01", -1), "2026-12-31");
});
