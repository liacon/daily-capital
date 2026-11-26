import capitalsData from "./data/capitals.json" with { type: "json" };
import { EQUATORIAL_GUINEA_CORRECTION as correction } from "./capital-corrections.js";

const currentCapitals = capitalsData.capitals;
const historicalCapitals = currentCapitals.map((city) =>
  city.id === correction.current.id ? correction.previous : city
);

export function capitalsForDate(date) {
  return date < correction.gameFrom ? historicalCapitals : currentCapitals;
}

export function capitalForSavedId(id, date) {
  return capitalsForDate(date).find((city) => city.id === id)
    // Old IDs remain distinct locations when reading historical saved guesses.
    || (id === correction.previous.id ? correction.previous : null);
}
