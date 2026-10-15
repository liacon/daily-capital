import assert from "node:assert/strict";
import test from "node:test";
import capitalsData from "../src/data/capitals.json" with { type: "json" };
import { distanceKm, scoreGuess } from "../src/scoring.js";

const capitals = capitalsData.capitals;
const capital = (name) => {
  const found = capitals.find((item) => item.capital === name);
  assert.ok(found, `Missing fixture: ${name}`);
  return found;
};

test("agreed regional examples retain dense-area scores and warm sparse areas", () => {
  const examples = [
    ["Cape Town", "Pretoria", 76],
    ["Cape Town", "Windhoek", 77],
    ["Cape Town", "Bloemfontein", 83],
    ["Guatemala City", "San Salvador", 94],
    ["Belmopan", "Guatemala City", 89],
    ["Managua", "San José", 89],
    ["Panama City", "Managua", 79],
    ["Panama City", "San José", 86],
    ["San José", "Panama City", 84],
    ["Havana", "Nassau", 86],
    ["Havana", "Kingston", 81],
    ["Nassau", "Kingston", 80],
    ["Kingston", "Port-au-Prince", 87],
    ["Bridgetown", "Kingstown", 94],
    ["Castries", "Kingstown", 97],
    ["Pretoria", "Gaborone", 92],
    ["Paris", "Brussels", 92],
    ["Vienna", "Bratislava", 98],
    ["Honiara", "Port Vila", 77],
    ["Suva", "Nuku'alofa", 86],
    ["Wellington", "Canberra", 62],
    ["Tokyo", "Seoul", 79],
    ["Santiago", "Buenos Aires", 79],
    ["Cape Town", "London", 11]
  ];
  for (const [target, guess, expected] of examples) {
    assert.equal(scoreGuess(capital(guess), capital(target)).score, expected, `${guess} against ${target}`);
  }
});

test("all capital pairs preserve ordering, valid scores, and exact-match wins without mutating data", () => {
  const originalData = JSON.stringify(capitals);
  let pairs = 0;
  for (const target of capitals) {
    assert.deepEqual(scoreGuess(target, target), { distance: 0, score: 100 });
    const guesses = capitals.filter((guess) => guess.id !== target.id)
      .map((guess) => ({ guess, ...scoreGuess(guess, target) }))
      .sort((a, b) => a.distance - b.distance);
    let previous = 100;
    for (const { guess, distance, score } of guesses) {
      const label = `${guess.capital} against ${target.capital}`;
      assert.ok(Number.isFinite(distance) && distance > 0, label);
      assert.ok(Number.isInteger(score) && score >= 0 && score < 100, label);
      assert.ok(score <= previous, `Farther guess scored higher: ${label}`);
      // Historical standard curve: the adjustment must never make guesses colder.
      const oldStandardScore = Math.min(99, Math.max(0, Math.round(
        100 * Math.exp(-distance / 3500) * Math.max(0, 1 - distance / 20015)
      )));
      assert.ok(score >= oldStandardScore, `Reduced score: ${label}`);
      assert.deepEqual(scoreGuess({ ...guess }, { ...target }), { distance, score }, `Repeat scoring: ${label}`);
      previous = score;
      pairs += 1;
    }
  }
  assert.equal(pairs, 39402);
  assert.equal(JSON.stringify(capitals), originalData);
});

test("every existing Oceania target preserves its previous scores", () => {
  const targets = ["Canberra", "Suva", "Tarawa", "Majuro", "Palikir", "Wellington",
    "Melekeok", "Port Moresby", "Apia", "Honiara", "Nuku'alofa", "Funafuti", "Port Vila"];
  for (const name of targets) {
    const target = capital(name);
    for (const guess of capitals) {
      const distance = distanceKm(guess, target);
      const expected = guess.id === target.id ? 100 : Math.min(99, Math.max(0, Math.round(
        100 * Math.exp(-distance / 6500) * Math.max(0, 1 - distance / 20015)
      )));
      assert.equal(scoreGuess(guess, target).score, expected, `${guess.capital} against ${name}`);
    }
  }
});
