import assert from "node:assert/strict";
import test from "node:test";
import { utcDateString, watchUtcDate } from "../src/daily-clock.js";

function clockAt(iso) {
  let current = new Date(iso);
  let nextId = 0;
  const timers = new Map();
  const page = new EventTarget();
  const visibility = new EventTarget();
  const days = [];
  const stop = watchUtcDate((day) => days.push(day), {
    now: () => current,
    setTimer: (callback, delay) => { timers.set(++nextId, { callback, delay }); return nextId; },
    clearTimer: (id) => timers.delete(id),
    page,
    visibility
  });
  return {
    days, timers, page, visibility, stop,
    setTime: (iso) => { current = new Date(iso); },
    fire: () => {
      const [id, { callback }] = timers.entries().next().value;
      timers.delete(id);
      callback();
    }
  };
}

test("UTC date ignores local timezone, including British Summer Time", () => {
  assert.equal(utcDateString(new Date("2026-10-16T00:30:00+01:00")), "2026-10-15");
  assert.equal(utcDateString(new Date("2026-10-16T01:00:00+01:00")), "2026-10-16");
});

test("an open tab changes day at midnight and schedules the following midnight", () => {
  const clock = clockAt("2026-10-15T23:59:59.750Z");
  assert.deepEqual(clock.days, ["2026-10-15"]);
  assert.equal([...clock.timers.values()][0].delay, 250);
  clock.setTime("2026-10-16T00:00:00.000Z");
  clock.fire();
  assert.deepEqual(clock.days, ["2026-10-15", "2026-10-16"]);
  assert.equal([...clock.timers.values()][0].delay, 86400000);
  clock.stop();
});

test("resume events catch up across multiple days without duplicate notifications", () => {
  for (const event of ["focus", "pageshow", "visibilitychange"]) {
    const clock = clockAt("2026-10-15T12:00:00Z");
    const events = event === "visibilitychange" ? clock.visibility : clock.page;
    clock.setTime("2026-10-18T08:00:00Z");
    events.dispatchEvent(new Event(event));
    events.dispatchEvent(new Event(event));
    assert.deepEqual(clock.days, ["2026-10-15", "2026-10-18"], event);
    assert.equal(clock.timers.size, 1);
    assert.equal([...clock.timers.values()][0].delay, 16 * 3600000);
    clock.stop();
  }
});

test("delayed timers handle month/year/leap-day boundaries", () => {
  for (const [before, after] of [
    ["2026-12-31", "2027-01-01"],
    ["2028-02-28", "2028-02-29"],
    ["2028-02-29", "2028-03-01"]
  ]) {
    const clock = clockAt(`${before}T23:59:59Z`);
    clock.setTime(`${after}T08:30:00Z`);
    clock.fire();
    assert.deepEqual(clock.days, [before, after]);
    clock.stop();
  }
});

test("cleanup cancels timers and listeners, including a callback already queued", () => {
  const clock = clockAt("2026-10-15T23:59:59Z");
  const queued = [...clock.timers.values()][0].callback;
  clock.stop();
  clock.setTime("2026-10-16T00:00:01Z");
  for (const event of ["focus", "pageshow"]) clock.page.dispatchEvent(new Event(event));
  clock.visibility.dispatchEvent(new Event("visibilitychange"));
  queued();
  assert.equal(clock.timers.size, 0);
  assert.deepEqual(clock.days, ["2026-10-15"]);
});
