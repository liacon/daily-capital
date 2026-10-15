export function utcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// Recheck on resume as background tabs can suspend timers past midnight.
export function watchUtcDate(onChange, {
  now = () => new Date(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  page = window,
  visibility = document
} = {}) {
  let timer;
  let lastDay;
  let stopped = false;

  function check() {
    if (stopped) return;
    clearTimer(timer);
    const current = now();
    const day = utcDateString(current);
    if (day !== lastDay) {
      lastDay = day;
      onChange(day);
    }
    const nextMidnight = Date.parse(`${day}T00:00:00Z`) + 86400000;
    timer = setTimer(check, Math.max(1, nextMidnight - current.getTime()));
  }

  page.addEventListener("focus", check);
  page.addEventListener("pageshow", check);
  visibility.addEventListener("visibilitychange", check);
  check();

  return () => {
    stopped = true;
    clearTimer(timer);
    page.removeEventListener("focus", check);
    page.removeEventListener("pageshow", check);
    visibility.removeEventListener("visibilitychange", check);
  };
}
