import capitalsData from "./data/capitals.json" with { type: "json" };

const MAX_DISTANCE_KM = 20015;
const BASE_DECAY_KM = 3500;
const MAX_DECAY_KM = 6500;
const SPACING_MULTIPLIER = 5;
const OCEANIA_COUNTRIES = new Set([
  "Australia",
  "Fiji",
  "Kiribati",
  "Marshall Islands",
  "Federated States of Micronesia",
  "New Zealand",
  "Palau",
  "Papua New Guinea",
  "Samoa",
  "Solomon Islands",
  "Tonga",
  "Tuvalu",
  "Vanuatu"
]);
const decayByTarget = new Map();

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function distanceKm(a, b) {
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

function decayForTarget(target) {
  if (decayByTarget.has(target.id)) return decayByTarget.get(target.id);

  const existingDecay = OCEANIA_COUNTRIES.has(target.country) ? MAX_DECAY_KM : BASE_DECAY_KM;
  const distances = capitalsData.capitals
    .filter((capital) => capital.id !== target.id)
    .map((capital) => distanceKm(capital, target))
    .sort((a, b) => a - b);
  // The third neighbour is the median of the nearest five, so one close pair
  // does not determine the curve. Preserve the existing Oceania adjustment.
  const localSpacing = distances[2] ?? 0;
  const decay = Math.max(existingDecay, Math.min(MAX_DECAY_KM, SPACING_MULTIPLIER * localSpacing));
  decayByTarget.set(target.id, decay);
  return decay;
}

export function scoreGuess(guess, target) {
  if (guess.id === target.id) {
    return { distance: 0, score: 100 };
  }
  const distance = distanceKm(guess, target);
  const closeness = Math.max(0, 1 - distance / MAX_DISTANCE_KM);
  const score = Math.max(0, Math.round(100 * Math.exp(-distance / decayForTarget(target)) * closeness));
  return { distance, score: Math.min(99, score) };
}
