import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { geoDistance, geoGraticule, geoNaturalEarth1, geoOrthographic, geoPath } from "d3-geo";
import capitalsData from "./data/capitals.json";
import worldData from "./data/world.json";
import "./styles.css";

const CAPITALS = capitalsData.capitals;
const GAME_START = "2024-01-01";
const STORAGE_KEY = "loughlane-capital-daily-v1";
const MAX_DISTANCE_KM = 20015;
const SCORE_DECAY_KM = 3500;
const TARGET_COLOR = "#1f9f65";
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const CAPITAL_ALIASES = {
  "k-benhavn-denmark": ["København", "Kobenhavn"]
};

function utcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayNumber(dateString) {
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

function shuffledCapitalDeck(cycle) {
  const deck = [...CAPITALS];
  const random = seededRandom(hashString(`loughlane-capital-cycle-${cycle}`));

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

function targetForDate(dateString) {
  const puzzleIndex = Math.max(0, dayNumber(dateString) - 1);
  const cycle = Math.floor(puzzleIndex / CAPITALS.length);
  const deckIndex = puzzleIndex % CAPITALS.length;
  return shuffledCapitalDeck(cycle)[deckIndex];
}

function targetFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get("target");
  if (!targetId) return null;
  return CAPITALS.find((capital) => capital.id === targetId) || null;
}

function normalizeSearchValue(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchTermsForCapital(capital) {
  return [capital.capital, capital.country, ...(CAPITAL_ALIASES[capital.id] || [])];
}

function capitalMatchesQuery(capital, query) {
  return searchTermsForCapital(capital).some((term) => normalizeSearchValue(term).includes(query));
}

function capitalMatchesInput(capital, inputValue) {
  const query = normalizeSearchValue(inputValue);
  const cityCountry = normalizeSearchValue(`${capital.capital}, ${capital.country}`);

  return (
    query === cityCountry ||
    searchTermsForCapital(capital).some((term) => normalizeSearchValue(term) === query)
  );
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function scoreGuess(guess, target) {
  if (guess.id === target.id) {
    return { distance: 0, score: 100 };
  }
  const distance = distanceKm(guess, target);
  const closeness = Math.max(0, 1 - distance / MAX_DISTANCE_KM);
  const score = Math.max(0, Math.round(100 * Math.exp(-distance / SCORE_DECAY_KM) * closeness));
  return {
    distance,
    score: Math.min(99, score)
  };
}

function proximityLabel(score) {
  if (score === 100) return "Solved";
  if (score >= 85) return "Scorching";
  if (score >= 65) return "Hot";
  if (score >= 42) return "Warm";
  if (score >= 20) return "Cool";
  return "Cold";
}

function colorForScore(score) {
  if (score === 100) return TARGET_COLOR;
  if (score >= 85) return "#d63d25";
  if (score >= 65) return "#ef8a24";
  if (score >= 42) return "#e4bf39";
  if (score >= 20) return "#61a9a6";
  return "#4d6f96";
}

function radiusForScore(score) {
  if (score === 100) return 10.5;
  return 3.2 + score * 0.07;
}

function loadStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.history && typeof stored.history === "object") {
      return stored;
    }
  } catch {
    return { history: {} };
  }
  return { history: {} };
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function guessesFromSavedPlay(play, target) {
  if (!play?.guesses || play.targetId !== target.id) return [];

  return play.guesses.flatMap((guessId) => {
    const capital = CAPITALS.find((item) => item.id === guessId);
    if (!capital) return [];
    return [{ ...capital, ...scoreGuess(capital, target) }];
  });
}

function initialGuessesForToday(store, today, target, demoTarget) {
  if (demoTarget) return [];

  const savedGuesses = guessesFromSavedPlay(store.plays?.[today], target);
  if (savedGuesses.length > 0) return savedGuesses;

  if (store.history?.[today]?.won) {
    return [{ ...target, distance: 0, score: 100, restored: true }];
  }

  return [];
}

function initialRevealForToday(store, today, target, demoTarget) {
  if (demoTarget) return false;
  const savedPlay = store.plays?.[today];
  if (savedPlay?.targetId === target.id && savedPlay.revealed) return true;
  return Boolean(store.history?.[today]?.revealed && !store.history?.[today]?.won);
}

function addDays(dateString, offset) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return utcDateString(date);
}

function computeStreak(history, today) {
  let anchor = history[today]?.won ? today : addDays(today, -1);
  let streak = 0;

  while (history[anchor]?.won) {
    streak += 1;
    anchor = addDays(anchor, -1);
  }

  return streak;
}

function buildShareText(puzzleNumber, guesses, bestBeforeSolve) {
  const pattern = guesses.map((guess) => shareSquare(guess.score)).join("");
  const best = bestBeforeSolve > 0 ? `Best clue ${bestBeforeSolve}/100` : "No warm-up guesses";
  return [
    `Daily Capital #${puzzleNumber}`,
    `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`,
    best,
    pattern,
    "https://github.com/liacon/LoughlaneDigital"
  ].join("\n");
}

function buildRevealShareText(puzzleNumber, guesses, bestBeforeSolve) {
  const pattern = guesses.length ? guesses.map((guess) => shareSquare(guess.score)).join("") : "No guesses";
  const best = bestBeforeSolve > 0 ? `Best clue ${bestBeforeSolve}/100` : "No warm-up guesses";
  return [
    `Daily Capital #${puzzleNumber}`,
    `Revealed after ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`,
    best,
    pattern,
    "https://github.com/liacon/LoughlaneDigital"
  ].join("\n");
}

function shareSquare(score) {
  if (score === 100) return "🟩";
  if (score >= 80) return "🟥";
  if (score >= 55) return "🟧";
  if (score >= 30) return "🟨";
  return "🟦";
}

function installGoogleAnalytics(measurementId) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!measurementId || window.__dailyCapitalGaInstalled) return;

  window.__dailyCapitalGaInstalled = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

function trackEvent(name, props = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.plausible === "function") {
    window.plausible(name, { props });
    return;
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", name, props);
    return;
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...props });
    return;
  }
  if (import.meta.env.DEV) {
    console.debug("[analytics]", name, props);
  }
}

function formatCoordinate(value, positiveLabel, negativeLabel) {
  const label = value >= 0 ? positiveLabel : negativeLabel;
  return `${Math.abs(value).toFixed(2)}° ${label}`;
}

function hemisphereText(city) {
  const northSouth = city.lat >= 0 ? "Northern" : "Southern";
  const eastWest = city.lon >= 0 ? "Eastern" : "Western";
  return `${northSouth} and ${eastWest} hemispheres`;
}

function weatherLabel(code) {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather update";
}

function buildExploreLinks(city) {
  const place = `${city.capital}, ${city.country}`;
  return [
    {
      label: "Live cams",
      href: `https://www.google.com/search?q=${encodeURIComponent(`${place} live webcam`)}`
    },
    {
      label: "Flights",
      href: `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${place}`)}`
    },
    {
      label: "Map",
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
    }
  ];
}

function computePlayerStats(history) {
  const plays = Object.values(history).filter((item) => item?.won || item?.revealed);
  const wins = Object.values(history).filter((item) => item?.won);
  const totalPlays = plays.length;
  const best = wins.reduce((bestSoFar, item) => {
    if (!item.guesses) return bestSoFar;
    return Math.min(bestSoFar, item.guesses);
  }, Number.POSITIVE_INFINITY);
  const average =
    wins.length === 0
      ? null
      : wins.reduce((sum, item) => sum + (item.guesses || 0), 0) / wins.length;

  return {
    totalPlays,
    bestGuesses: Number.isFinite(best) ? best : null,
    averageGuesses: average === null ? null : average.toFixed(1)
  };
}

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 900, height: 460 });

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.max(320, Math.round(entry.contentRect.width)),
        height: Math.max(300, Math.round(entry.contentRect.height))
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function MapView({ guesses, solved }) {
  const [wrapRef, size] = useElementSize();
  const [mode, setMode] = useState("flat");
  const [flatView, setFlatView] = useState({ x: 0, y: 0, k: 1 });
  const [globeView, setGlobeView] = useState({ rotate: [-12, -38, 0], k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const clampView = (nextView) => {
    const k = clamp(nextView.k, MIN_ZOOM, MAX_ZOOM);
    const maxX = size.width * (k - 1) + 80;
    const maxY = size.height * (k - 1) + 80;
    return {
      k,
      x: clamp(nextView.x, -maxX, 80),
      y: clamp(nextView.y, -maxY, 80)
    };
  };

  useEffect(() => {
    const latestGuess = guesses.at(-1);
    if (mode !== "globe" || !latestGuess) return;

    setGlobeView((current) => ({
      ...current,
      rotate: [-latestGuess.lon, clamp(-latestGuess.lat, -75, 75), 0]
    }));
  }, [guesses, mode]);

  const { paths, dots, graticulePath, spherePath } = useMemo(() => {
    const projection =
      mode === "globe"
        ? geoOrthographic()
            .rotate(globeView.rotate)
            .fitExtent(
              [
                [18, 18],
                [size.width - 18, size.height - 18]
              ],
              { type: "Sphere" }
            )
            .clipAngle(90)
        : geoNaturalEarth1().fitSize([size.width, size.height], worldData);

    if (mode === "globe") {
      projection.scale(projection.scale() * globeView.k);
    }

    const path = geoPath(projection);
    const graticule = geoGraticule().step([30, 30]);
    const globeCenter = [-globeView.rotate[0], -globeView.rotate[1]];

    return {
      graticulePath: path(graticule()),
      spherePath: path({ type: "Sphere" }),
      paths: worldData.features
        .map((feature, index) => ({
          key: `${feature.properties.isoA3 || "country"}-${index}`,
          d: path(feature)
        }))
        .filter((item) => item.d),
      dots: guesses.flatMap((guess) => {
        const visible =
          mode === "flat" || geoDistance([guess.lon, guess.lat], globeCenter) <= Math.PI / 2;
        if (!visible) return [];
        const [x, y] = projection([guess.lon, guess.lat]);
        return [{
          ...guess,
          x,
          y,
          radius: radiusForScore(guess.score),
          color: colorForScore(guess.score)
        }];
      })
    };
  }, [globeView, guesses, mode, size]);

  function zoomBy(multiplier, anchor = { x: size.width / 2, y: size.height / 2 }) {
    if (mode === "globe") {
      setGlobeView((current) => ({
        ...current,
        k: clamp(current.k * multiplier, MIN_ZOOM, MAX_ZOOM)
      }));
      return;
    }

    setFlatView((current) => {
      const nextK = clamp(current.k * multiplier, MIN_ZOOM, MAX_ZOOM);
      const scale = nextK / current.k;
      return clampView({
        k: nextK,
        x: anchor.x - (anchor.x - current.x) * scale,
        y: anchor.y - (anchor.y - current.y) * scale
      });
    });
  }

  function handleWheel(event) {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    zoomBy(event.deltaY < 0 ? 1.16 : 1 / 1.16, {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current =
      mode === "globe"
        ? {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            mode,
            originRotate: globeView.rotate
          }
        : {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            mode,
            originX: flatView.x,
            originY: flatView.y,
            originK: flatView.k
          };
    setIsDragging(true);
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.mode === "globe") {
      const nextRotate = [
        drag.originRotate[0] + (event.clientX - drag.startX) * 0.38,
        clamp(drag.originRotate[1] - (event.clientY - drag.startY) * 0.32, -75, 75),
        0
      ];
      setGlobeView((current) => ({ ...current, rotate: nextRotate }));
      return;
    }

    setFlatView(
      clampView({
        k: drag.originK,
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY
      })
    );
  }

  function endDrag(event) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
    }
  }

  function resetMap() {
    if (mode === "globe") {
      setGlobeView({ rotate: [-12, -38, 0], k: 1 });
      return;
    }
    setFlatView({ x: 0, y: 0, k: 1 });
  }

  const markerScale = mode === "flat" ? flatView.k : 1;

  return (
    <section
      className={`${isDragging ? "map-panel is-dragging" : "map-panel"} ${
        mode === "globe" ? "is-globe" : "is-flat"
      }`}
      ref={wrapRef}
      aria-label="World map with guessed capitals"
    >
      <div className="map-mode-toggle" aria-label="Map mode">
        <button
          aria-pressed={mode === "flat"}
          className={mode === "flat" ? "is-active" : ""}
          onClick={() => {
            setMode("flat");
            trackEvent("map_mode_changed", { mode: "flat" });
          }}
          type="button"
        >
          Flat
        </button>
        <button
          aria-pressed={mode === "globe"}
          className={mode === "globe" ? "is-active" : ""}
          onClick={() => {
            setMode("globe");
            trackEvent("map_mode_changed", { mode: "globe" });
          }}
          type="button"
        >
          Globe
        </button>
      </div>
      <div className="map-controls" aria-label="Map controls">
        <button onClick={() => zoomBy(1.3)} type="button" aria-label="Zoom in">
          +
        </button>
        <button onClick={() => zoomBy(1 / 1.3)} type="button" aria-label="Zoom out">
          -
        </button>
        <button onClick={resetMap} type="button" aria-label="Reset map">
          Reset
        </button>
      </div>
      <svg
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerLeave={endDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onWheel={handleWheel}
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
      >
        <title>World map showing guessed capital locations</title>
        <defs>
          <radialGradient id="oceanGlow" cx="48%" cy="42%" r="78%">
            <stop offset="0%" stopColor="#e9f7f6" />
            <stop offset="58%" stopColor="#d7ecef" />
            <stop offset="100%" stopColor="#bed9df" />
          </radialGradient>
        </defs>
        <rect className="ocean" width={size.width} height={size.height} />
        <g
          className="map-layer"
          transform={
            mode === "flat" ? `translate(${flatView.x} ${flatView.y}) scale(${flatView.k})` : undefined
          }
        >
          <path className="sphere" d={spherePath} />
          <path className="graticule" d={graticulePath} />
          {paths.map((item) => (
            <path className="country" d={item.d} key={item.key} />
          ))}
          {dots.map((dot, index) => (
            <g className="guess-dot-group" key={dot.id}>
              {dot.score === 100 && (
                <circle
                  className="target-halo"
                  cx={dot.x}
                  cy={dot.y}
                  r={(dot.radius + 6) / markerScale}
                />
              )}
              <circle
                className={dot.score === 100 ? "guess-dot solved-dot" : "guess-dot"}
                cx={dot.x}
                cy={dot.y}
                r={dot.radius / markerScale}
                fill={dot.color}
              />
              <text
                className="dot-label"
                style={{ fontSize: `${11 / markerScale}px`, strokeWidth: 3 / markerScale }}
                x={dot.x}
                y={dot.y - (dot.radius + 7) / markerScale}
              >
                {index + 1}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </section>
  );
}

function WeatherSummary({ city }) {
  const [weather, setWeather] = useState({ status: "loading" });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      latitude: city.lat,
      longitude: city.lon,
      current: "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m",
      timezone: "auto"
    });

    setWeather({ status: "loading" });

    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) throw new Error("Weather unavailable");
        return response.json();
      })
      .then((data) => {
        setWeather({
          status: "ready",
          current: data.current,
          units: data.current_units,
          timezone: data.timezone
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setWeather({ status: "error" });
        }
      });

    return () => controller.abort();
  }, [city]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (weather.status === "loading") {
    return <p className="weather-loading">Checking today's weather...</p>;
  }

  if (weather.status === "error" || !weather.current) {
    return <p className="weather-loading">Weather is unavailable right now.</p>;
  }

  const current = weather.current;
  const units = weather.units || {};
  const localTime =
    weather.timezone &&
    new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: weather.timezone
    }).format(now);

  return (
    <div className="weather-card">
      <div>
        <span className="fact-label">Weather now</span>
        <strong>
          {Math.round(current.temperature_2m)}
          {units.temperature_2m}
        </strong>
      </div>
      <div>
        <span>{weatherLabel(current.weather_code)}</span>
        <small>
          Wind {Math.round(current.wind_speed_10m)} {units.wind_speed_10m}
          {current.relative_humidity_2m !== undefined &&
            ` · Humidity ${current.relative_humidity_2m}${units.relative_humidity_2m}`}
        </small>
        {localTime && <small>Time in {city.capital} {localTime}</small>}
      </div>
    </div>
  );
}

function SolvePanel({ target, guesses, history, streak, demoTarget, revealed }) {
  const exploreLinks = buildExploreLinks(target);
  const stats = computePlayerStats(history);
  const closestBeforeSolve = guesses
    .filter((guess) => guess.score < 100)
    .sort((a, b) => b.score - a.score)[0];

  return (
    <section className="solve-panel" aria-label="Solved city facts and stats">
      <div className="solve-panel-header">
        <div>
          <span className="fact-label">{demoTarget ? "Preview capital" : "Today's capital"}</span>
          <h2>
            {target.capital}, {target.country}
          </h2>
        </div>
        <span className={revealed ? "solve-pill is-revealed" : "solve-pill"}>
          {revealed ? `Revealed after ${guesses.length}` : `Solved in ${guesses.length}`}
        </span>
      </div>

      <WeatherSummary city={target} />

      <div className="fact-grid">
        <div>
          <span className="fact-label">Location</span>
          <strong>
            {formatCoordinate(target.lat, "N", "S")}, {formatCoordinate(target.lon, "E", "W")}
          </strong>
          <small>{hemisphereText(target)}</small>
        </div>
        <div>
          <span className="fact-label">Closest clue</span>
          <strong>
            {closestBeforeSolve
              ? `${closestBeforeSolve.capital} · ${closestBeforeSolve.score}/100`
              : "First-guess solve"}
          </strong>
          <small>{closestBeforeSolve ? closestBeforeSolve.country : "No warm-up guess needed"}</small>
        </div>
      </div>

      <div className="explore-links" aria-label={`Explore ${target.capital}`}>
        {exploreLinks.map((link) => (
          <a
            href={link.href}
            key={link.label}
            onClick={() => trackEvent("explore_link_clicked", { label: link.label })}
            rel="noreferrer"
            target="_blank"
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="stats-panel">
        <h2>Your stats</h2>
        <div className="stats-grid">
          <div>
            <span className="fact-label">Current streak</span>
            <strong>{demoTarget ? "Paused" : streak}</strong>
          </div>
          <div>
            <span className="fact-label">Total plays</span>
            <strong>{stats.totalPlays}</strong>
          </div>
          <div>
            <span className="fact-label">Best solve</span>
            <strong>{stats.bestGuesses ?? "Not yet"}</strong>
          </div>
          <div>
            <span className="fact-label">Average</span>
            <strong>{stats.averageGuesses ?? "Not yet"}</strong>
          </div>
        </div>
        {demoTarget && <p className="stats-note">Preview solves are not added to your stats.</p>}
      </div>
    </section>
  );
}

function InfoPanel() {
  return (
    <section className="info-panel" aria-label="About Daily Capital">
      <article>
        <span className="fact-label">About</span>
        <h2>Daily Capital is a daily geography guessing game.</h2>
        <p>
          Each day has one hidden world capital. Make capital-city guesses, compare proximity
          scores, and use the map to narrow down the answer before revealing the city facts.
        </p>
      </article>
      <article>
        <span className="fact-label">How to play</span>
        <h2>Guess the capital, then follow the score.</h2>
        <p>
          Scores run from 0 to 100. Warmer colours and larger dots mean your guess is closer to
          the Daily Capital. There are no arrows or connecting lines, and the answer stays hidden
          until you solve it or reveal it.
        </p>
      </article>
      <article>
        <span className="fact-label">Privacy</span>
        <h2>No account is needed to play.</h2>
        <p>
          Your streak and play history are saved only in this browser. Daily Capital uses Google
          Analytics to understand aggregate activity such as visits, solves, reveals, and shares.
        </p>
      </article>
    </section>
  );
}

function App() {
  const today = utcDateString();
  const puzzleNumber = dayNumber(today);
  const demoTarget = useMemo(() => targetFromUrl(), []);
  const target = useMemo(() => demoTarget || targetForDate(today), [demoTarget, today]);
  const [store, setStore] = useState(loadStore);
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState(() => initialGuessesForToday(store, today, target, demoTarget));
  const [message, setMessage] = useState(() =>
    initialGuessesForToday(store, today, target, demoTarget).some((guess) => guess.id === target.id) ||
    initialRevealForToday(store, today, target, demoTarget)
      ? "You've already completed today's puzzle. Come back tomorrow for a new capital."
      : ""
  );
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(() => initialRevealForToday(store, today, target, demoTarget));
  const solvePanelRef = useRef(null);

  const won = guesses.some((guess) => guess.id === target.id);
  const solved = won || revealed;
  const mapGuesses = revealed
    ? [
        ...guesses,
        { ...target, distance: 0, score: 100, revealed: true }
      ]
    : guesses;
  const streak = computeStreak(store.history, today);
  const bestBeforeSolve = guesses
    .filter((guess) => guess.score < 100)
    .reduce((best, guess) => Math.max(best, guess.score), 0);

  const suggestions = useMemo(() => {
    const query = normalizeSearchValue(input);
    if (!query) return CAPITALS.slice(0, 8);
    return CAPITALS.filter((capital) => capitalMatchesQuery(capital, query)).slice(0, 8);
  }, [input]);

  const recentHistory = useMemo(() => {
    return Object.entries(store.history)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7);
  }, [store.history]);

  useEffect(() => {
    installGoogleAnalytics(GA_MEASUREMENT_ID);
  }, []);

  useEffect(() => {
    trackEvent("game_loaded", {
      preview: Boolean(demoTarget),
      puzzleNumber
    });
  }, [demoTarget, puzzleNumber]);

  useEffect(() => {
    if (demoTarget || (guesses.length === 0 && !revealed)) return;

    const nextPlay = {
      puzzleNumber,
      targetId: target.id,
      guesses: guesses.map((guess) => guess.id),
      revealed,
      won,
      completed: solved
    };

    setStore((current) => {
      const currentPlay = current.plays?.[today];
      if (JSON.stringify(currentPlay) === JSON.stringify(nextPlay)) return current;

      const next = {
        ...current,
        plays: {
          ...(current.plays || {}),
          [today]: nextPlay
        }
      };
      saveStore(next);
      return next;
    });
  }, [demoTarget, guesses, puzzleNumber, revealed, solved, target.id, today, won]);

  useEffect(() => {
    if (!won || demoTarget) return;
    setStore((current) => {
      if (current.history[today]?.won) return current;
      const next = {
        ...current,
        history: {
          ...current.history,
          [today]: {
            won: true,
            guesses: guesses.length,
            guessIds: guesses.map((guess) => guess.id),
            puzzleNumber
          }
        }
      };
      saveStore(next);
      return next;
    });
    trackEvent("puzzle_solved", {
      guesses: guesses.length,
      puzzleNumber
    });
  }, [demoTarget, guesses.length, puzzleNumber, today, won]);

  useEffect(() => {
    if (!revealed || demoTarget) return;
    setStore((current) => {
      if (current.history[today]?.won || current.history[today]?.revealed) return current;
      const next = {
        ...current,
        history: {
          ...current.history,
          [today]: {
            won: false,
            revealed: true,
            guesses: guesses.length,
            guessIds: guesses.map((guess) => guess.id),
            puzzleNumber
          }
        }
      };
      saveStore(next);
      return next;
    });
    trackEvent("puzzle_revealed", {
      guesses: guesses.length,
      puzzleNumber
    });
  }, [demoTarget, guesses.length, puzzleNumber, revealed, today]);

  useEffect(() => {
    if (!won) return undefined;
    const timer = setTimeout(() => {
      solvePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 1600);
    return () => clearTimeout(timer);
  }, [won]);

  function dismissHint() {
    setStore((current) => {
      const next = { ...current, hintDismissed: true };
      saveStore(next);
      return next;
    });
  }

  function submitGuess(capital) {
    const selected =
      capital ||
      CAPITALS.find((item) => capitalMatchesInput(item, input));

    if (!selected) {
      setMessage("Choose a capital from the list.");
      return;
    }

    if (guesses.some((guess) => guess.id === selected.id)) {
      setMessage(`${selected.capital} is already on the board.`);
      setInput("");
      return;
    }

    const scored = { ...selected, ...scoreGuess(selected, target) };
    setGuesses((current) => [...current, scored]);
    setInput("");
    setMessage(scored.score === 100 ? "Solved. Nicely done." : `${proximityLabel(scored.score)}: ${scored.score}/100`);
    trackEvent("guess_submitted", {
      preview: Boolean(demoTarget),
      score: scored.score,
      solved: scored.score === 100
    });
  }

  function revealTarget() {
    setRevealed(true);
    setInput("");
    setMessage("Target revealed. This one will not count as a win.");
  }

  async function shareResult() {
    const text = revealed
      ? buildRevealShareText(puzzleNumber, guesses, bestBeforeSolve)
      : buildShareText(puzzleNumber, guesses, bestBeforeSolve);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage(text);
    }
    trackEvent("share_result", {
      guesses: guesses.length,
      revealed,
      puzzleNumber
    });
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">Loughlane Digital</p>
          <h1>Daily Capital</h1>
        </div>
        <div className="puzzle-meta" aria-label="Puzzle details">
          <span>{demoTarget ? "Preview" : `#${puzzleNumber}`}</span>
          <span>{today}</span>
        </div>
      </header>

      <section className="game-layout">
        <MapView guesses={mapGuesses} solved={solved} />

        <aside className="control-panel">
          <div className="status-row">
            <div>
              <span className="stat-label">Guesses</span>
              <strong>{guesses.length}</strong>
            </div>
            <div>
              <span className="stat-label">Streak</span>
              <strong>{demoTarget ? "Paused" : streak}</strong>
            </div>
          </div>

          <div className={solved ? "win-banner is-visible" : "win-banner"}>
            <span>Daily Capital:</span>
            <strong>
              {target.capital}, {target.country}
            </strong>
          </div>

          {demoTarget && (
            <p className="demo-note">
              Preview target: {demoTarget.capital}, {demoTarget.country}. Local streak is paused.
            </p>
          )}

          {!store.hintDismissed && (
            <section className="hint-panel" aria-label="How to play">
              <div>
                <strong>How to play</strong>
                <p>Guess the hidden capital. Higher scores mean closer. No arrows, no spoilers.</p>
              </div>
              <button onClick={dismissHint} type="button">
                Got it
              </button>
            </section>
          )}

          <form
            className="guess-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitGuess();
            }}
          >
            <label htmlFor="capital-search">Guess a capital city</label>
            <div className="input-row">
              <input
                autoComplete="off"
                disabled={solved}
                id="capital-search"
                list="capital-options"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Start typing, e.g. Lisbon"
                type="search"
                value={input}
              />
              <button disabled={solved} type="submit">
                Guess
              </button>
            </div>
            {!solved && (
              <button className="reveal-button" onClick={revealTarget} type="button">
                Give up / reveal
              </button>
            )}
            <datalist id="capital-options">
              {CAPITALS.map((capital) => (
                <option key={capital.id} value={`${capital.capital}, ${capital.country}`} />
              ))}
            </datalist>
          </form>

          {!solved && input.trim() && (
            <div className="suggestions" role="listbox" aria-label="Capital suggestions">
              {suggestions.map((capital) => (
                <button key={capital.id} onClick={() => submitGuess(capital)} type="button">
                  <span>{capital.capital}</span>
                  <small>{capital.country}</small>
                </button>
              ))}
            </div>
          )}

          {message && <p className="message">{message}</p>}

          <div className="temperature-key" aria-label="Score temperature guide">
            <span>Cold</span>
            <div>
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span>Hot</span>
          </div>

          <section className="guess-list" aria-label="Guess history">
            <h2>Guesses</h2>
            {guesses.length === 0 ? (
              <p className="empty-state">Your first dot will appear here and on the map.</p>
            ) : (
              <ol>
                {[...guesses].sort((a, b) => b.score - a.score).map((guess) => (
                  <li key={guess.id}>
                    <span className="score-dot" style={{ background: colorForScore(guess.score) }} />
                    <div>
                      <strong>{guess.capital}</strong>
                      <small>{guess.country}</small>
                    </div>
                    <span className="guess-score">{guess.score}</span>
                    <span className="guess-temp">{proximityLabel(guess.score)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {solved && (
            <div ref={solvePanelRef}>
              <SolvePanel
                demoTarget={demoTarget}
                guesses={guesses}
                history={store.history}
                revealed={revealed}
                streak={streak}
                target={target}
              />
            </div>
          )}

          {solved && !demoTarget && (
            <button className="share-button" onClick={shareResult} type="button">
              {copied ? "Copied" : "Share result"}
            </button>
          )}

          <section className="history-panel" aria-label="Local history">
            <h2>History</h2>
            {demoTarget ? (
              <p className="empty-state">Preview mode does not change local history.</p>
            ) : recentHistory.length === 0 ? (
              <p className="empty-state">Solved days are saved on this device.</p>
            ) : (
              <ul>
                {recentHistory.map(([date, item]) => (
                  <li key={date}>
                    <span>{date}</span>
                    <strong>
                      #{item.puzzleNumber} {item.won ? `in ${item.guesses}` : "revealed"}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </section>
      <InfoPanel />
      <div className="builder-mark" aria-label="Built by Loughlane Digital">
        <span>Built by</span>
        <img src="/loughlane-digital-logo.jpeg" alt="Loughlane Digital" />
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
