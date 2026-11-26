import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { CATALOG_VERSIONS, catalogVersionForDate, catalogVersionById, capitalForSavedId } from "../src/capital-catalog.js";
import { CATALOGUE_UPDATE, REVIEWED_CAPITALS, applyCatalogueUpdate, showCatalogueUpdate } from "../src/catalogue-update.js";
import { targetForDate, puzzleForSavedPlay, dayNumber } from "../src/daily-puzzle.js";
import { scoreGuess, distanceKm } from "../src/scoring.js";
import { initialGuessesForToday, initialRevealForToday, computeStreak, addDays } from "../src/game-state.js";
const hash = value => createHash("sha256").update(value).digest("hex");
const v1 = catalogVersionById("v1"), v2 = catalogVersionById("v2"), v3 = catalogVersionById("v3");

test("version boundaries use UTC dates, with separate deck/scoring/guess references and frozen cities", () => {
  assert.equal(catalogVersionForDate("2026-11-25"), v1);
  assert.equal(catalogVersionForDate("2026-11-26"), v2);
  assert.equal(catalogVersionForDate("2026-11-27"), v3);
  assert.equal(v3.epoch, "2026-11-27");
  assert.equal(v3.guesses.length, 203);
  for (const version of CATALOG_VERSIONS) {
    assert(Object.isFrozen(version));
    for (const field of ["guesses", "targets", "scoring"]) {
      assert(Object.isFrozen(version[field]));
      assert(version[field].every(Object.isFrozen));
    }
  }
});

test("all 1,061 previously released daily targets retain the pre-edit golden digest", () => {
  const ids = Array.from({ length: 1061 }, (_, i) => targetForDate(addDays("2024-01-01", i)).id);
  assert.equal(hash(ids.join("\n")), "eda6afe85df46bc42cc8fbe5437cfd2a3fc4b9a01fa287a05b865d82da141d55");
  assert.equal(dayNumber(CATALOGUE_UPDATE.gameFrom), 1062);
});

test("both historical score matrices match pre-edit goldens after warming v3 scoring cache", () => {
  for (const target of v3.targets) scoreGuess(v3.guesses[0], target, v3.scoring);
  const goldens = ["5ad8b2b004e3f6afd769c8735b13732e91ea9e7cfa14eec6f4b844f2782a9bed", "ea1b537a458c0d66d1c7ed40117a36617b280ff3184836cdd86208299e4ea0d2"];
  for (const [i, version] of [v1, v2].entries()) {
    const scores = version.targets.flatMap(target => version.guesses.map(guess => scoreGuess(guess, target, version.scoring).score));
    assert.equal(hash(JSON.stringify(scores)), goldens[i]);
  }
});

test("the seven reviewed cities are distinct, retain multi-capital seats, and remove only three obsolete current records", () => {
  assert.equal(new Set(v3.guesses.map(city => city.country)).size, 196);
  for (const reviewed of REVIEWED_CAPITALS) {
    const city = v3.guesses.find(city => city.id === reviewed.id);
    assert(city, reviewed.id);
    assert.equal(scoreGuess(city, city, v3.scoring).score, 100);
    if (reviewed.replaces) {
      assert(!v3.guesses.some(city => city.id === reviewed.replaces));
      const old = capitalForSavedId(reviewed.replaces, CATALOGUE_UPDATE.gameFrom);
      assert.equal(old.id, reviewed.replaces);
      assert(distanceKm(old, city) > 1);
      assert(scoreGuess(old, city, v3.scoring).score < 100);
    }
  }
  const added = v3.guesses.filter(city => !v2.guesses.some(old => old.id === city.id));
  const removed = v2.guesses.filter(city => !v3.guesses.some(next => next.id === city.id));
  assert.equal(added.length, 7); assert.equal(removed.length, 3);
  for (const old of v2.guesses.filter(city => !removed.includes(city))) {
    assert.deepEqual(v3.guesses.find(city => city.id === old.id), old);
  }
  assert.equal(v3.guesses.filter(city => city.country === "South Africa").length, 3);
});

test("each new 203-day cycle visits every current target exactly once with no former capitals", () => {
  for (let cycle = 0; cycle < 3; cycle++) {
    const ids = Array.from({length: 203}, (_, day) => targetForDate(addDays(v3.epoch, cycle * 203 + day)).id);
    assert.equal(new Set(ids).size, 203);
    assert.deepEqual([...ids].sort(), v3.targets.map(city => city.id).sort());
  }
});

test("unversioned and versioned older-build plays restore after cutover without changing scores, reveals or streaks", () => {
  const date = "2026-11-27", target = targetForDate(date, v2);
  assert.notEqual(target.id, targetForDate(date, v3).id);
  for (const explicit of [false, true]) for (const state of ["unfinished", "won", "revealed"]) {
    const won = state === "won", revealed = state === "revealed";
    const old = v2.guesses.find(city => city.capital === "Dar es Salaam");
    const ids = won ? [old.id, target.id] : [old.id];
    const play = { targetId: target.id, guesses: ids, won, revealed, ...(explicit ? {catalogVersion: "v2"} : {}) };
    const store = { plays: {[date]: play}, history: { "2026-11-26": {won: true}, ...(won ? {[date]: {won, guesses: 2}} : {}) } };
    const snapshot = JSON.stringify(store), resolved = puzzleForSavedPlay(date, play);
    assert.equal(resolved.version, v2); assert.equal(resolved.target.id, target.id);
    const restored = initialGuessesForToday(store, date, resolved.target, null, resolved.version);
    assert.deepEqual(restored.map(city => city.id), ids);
    assert.equal(restored[0].score, scoreGuess(old, target, v2.scoring).score);
    assert.equal(initialRevealForToday(store, date, target, null), revealed);
    assert.equal(computeStreak(store.history, date), won ? 2 : 1);
    assert.equal(JSON.stringify(store), snapshot);
    assert.equal(puzzleForSavedPlay(addDays(date, 1), store.plays[addDays(date, 1)]).version, v3);
  }
  assert.equal(puzzleForSavedPlay(date, {targetId: targetForDate(date).id, catalogVersion: "v3"}).version, v3);
  assert.equal(puzzleForSavedPlay(date, {targetId: "invalid", catalogVersion: "v2"}).version, v3);
});

test("every removed-city historical puzzle restores its original coordinates and exact solve", () => {
  for (const removed of REVIEWED_CAPITALS.filter(city => city.replaces)) {
    let date = "2024-01-01";
    while (targetForDate(date).id !== removed.replaces) date = addDays(date, 1);
    assert(date < CATALOGUE_UPDATE.gameFrom);
    const original = targetForDate(date);
    const store = {history: {[date]: {won: true, guesses: 1}}, plays: {[date]: {targetId: original.id, guesses: [original.id], won: true}}};
    const result = initialGuessesForToday(store, date, original, null)[0];
    assert.equal(result.id, original.id); assert.equal(result.lat, original.lat); assert.equal(result.lon, original.lon); assert.equal(result.score, 100);
  }
});

test("curation is idempotent and generation reproduces the reviewed current data without touching legacy snapshots", () => {
  assert.deepEqual(applyCatalogueUpdate(v2.guesses), v3.guesses);
  assert.deepEqual(applyCatalogueUpdate(v3.guesses), v3.guesses);
  assert.throws(() => applyCatalogueUpdate(v2.guesses.filter(city => city.id !== "dar-es-salaam-tanzania")));
  const root = fileURLToPath(new URL("../", import.meta.url));
  const tempRoot = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(tempRoot, "daily-capital-generation-"));
  try {
    fs.mkdirSync(path.join(dir, "data-sources"));
    for (const file of ["ne_10m_populated_places_simple.geojson", "ne_110m_admin_0_countries.geojson"]) {
      fs.copyFileSync(path.join(root, "data-sources", file), path.join(dir, "data-sources", file));
    }
    execFileSync(process.execPath, [path.join(root, "scripts/generate-data.mjs")], {cwd: dir});
    for (const file of ["capitals.json", "world.json"]) {
      assert.equal(fs.readFileSync(path.join(dir, "src/data", file), "utf8"), fs.readFileSync(path.join(root, "src/data", file), "utf8"));
    }
  } finally {
    const resolved = fs.realpathSync(dir);
    assert.equal(path.dirname(resolved), tempRoot);
    assert(path.basename(resolved).startsWith("daily-capital-generation-"));
    fs.rmSync(resolved, {recursive: true});
  }
});

test("catalogue notice has a distinct dismissal and bounded date window", () => {
  assert.equal(showCatalogueUpdate("2026-11-26"), false);
  assert.equal(showCatalogueUpdate("2026-11-27"), true);
  assert.equal(showCatalogueUpdate("2026-12-10"), true);
  assert.equal(showCatalogueUpdate("2026-12-11"), false);
  assert.equal(showCatalogueUpdate("2026-11-27", true), false);
});
