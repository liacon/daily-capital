import currentData from "./data/capitals.json" with { type: "json" };
import legacyData from "./data/catalogs/v2.json" with { type: "json" };
import { EQUATORIAL_GUINEA_CORRECTION as correction } from "./capital-corrections.js";
import { CATALOGUE_UPDATE } from "./catalogue-update.js";

const freezeCities = cities => Object.freeze(cities.map(city => Object.freeze({ ...city })));
const v2 = freezeCities(legacyData.capitals);
const v1 = freezeCities(v2.map(city => city.id === correction.current.id ? correction.previous : city));
const v3 = freezeCities(currentData.capitals);
function version(id, from, cities, epoch = "2024-01-01", seedPrefix = "loughlane-capital-cycle-") {
  // Separate fields allow guess-only additions without altering answer decks or scoring references.
  return Object.freeze({ id, from, epoch, seedPrefix, guesses: cities, targets: cities, scoring: cities });
}
export const CATALOG_VERSIONS = Object.freeze([
  version("v1", "2024-01-01", v1),
  version("v2", correction.gameFrom, v2),
  version("v3", CATALOGUE_UPDATE.gameFrom, v3, CATALOGUE_UPDATE.gameFrom, "loughlane-capital-v3-cycle-")
]);
export function catalogVersionById(id) {
  return CATALOG_VERSIONS.find(version => version.id === id);
}
export function catalogVersionForDate(date) {
  return CATALOG_VERSIONS.findLast(version => date >= version.from) || CATALOG_VERSIONS[0];
}
export function capitalsForDate(date) {
  return catalogVersionForDate(date).guesses;
}
export function capitalForSavedId(id, date, version = catalogVersionForDate(date)) {
  return version.guesses.find(city => city.id === id)
    || v2.find(city => city.id === id)
    || (id === correction.previous.id ? v1.find(city => city.id === id) : null);
}
