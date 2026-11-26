import { createHash } from "node:crypto";
import legacyData from "../src/data/catalogs/v2.json" with { type: "json" };
import { REVIEWED_CAPITALS } from "../src/catalogue-update.js";
import capitalsData from "../src/data/capitals.json" with { type: "json" };
import worldData from "../src/data/world.json" with { type: "json" };
import { EQUATORIAL_GUINEA_CORRECTION as correction } from "../src/capital-corrections.js";

const { capitals } = capitalsData;
const errors = [];

if (!Array.isArray(capitals) || capitals.length !== 203) {
  errors.push(`Expected 203 capitals in catalogue v3, found ${capitals?.length ?? 0}.`);
}

if (!worldData?.features?.length) {
  errors.push("World map data is empty.");
}


// Published catalogue order and coordinates are immutable: create a new version to change them.
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
if (digest(legacyData.capitals) !== "d2374f8bfc56631f9b322ead546a8fd90f932a2240c16490f40d86c1a85eed0c") errors.push("Frozen v2 catalogue changed.");
if (digest(capitals) !== "1338348e9404424a21a179f6afda6757cb5157278e2f831679729aae3d750cd1") errors.push("Catalogue v3 changed; introduce a new version instead of rewriting a published deck.");
for (const entry of REVIEWED_CAPITALS) {
  const city = capitals.find(city => city.id === entry.id);
  if (!city || ["capital", "country", "sovereign", "lat", "lon"].some(key => city[key] !== entry[key])) {
    errors.push("Missing or incorrect reviewed capital: " + entry.id);
  }
  if (entry.replaces && capitals.some(city => city.id === entry.replaces)) errors.push("Former record in current catalogue: " + entry.replaces);
}
if (new Set(capitals.map(city => city.country)).size !== 196) errors.push("Expected 196 country labels in v3.");
for (const id of ["cotonou-benin", "colombo-sri-lanka", "mbabane-eswatini", "pretoria-south-africa", "cape-town-south-africa", "bloemfontein-south-africa"]) {
  if (!capitals.some(city => city.id === id)) errors.push("Missing retained capital seat: " + id);
}

const ids = new Set();
const names = new Set();

const equatorialGuinea = capitals.filter((city) => city.country === "Equatorial Guinea");
if (equatorialGuinea.length !== 1 ||
    Object.entries(correction.current).some(([key, value]) => equatorialGuinea[0]?.[key] !== value)) {
  errors.push("Equatorial Guinea must use Ciudad de la Paz and its verified mainland coordinates.");
}

for (const capital of capitals) {
  const required = ["id", "capital", "country", "lat", "lon"];
  for (const key of required) {
    if (capital[key] === undefined || capital[key] === "") {
      errors.push(`Missing ${key} for ${JSON.stringify(capital)}.`);
    }
  }

  if (ids.has(capital.id)) {
    errors.push(`Duplicate id: ${capital.id}`);
  }
  ids.add(capital.id);

  if (names.has(capital.capital)) {
    errors.push(`Duplicate capital name: ${capital.capital}`);
  }
  names.add(capital.capital);

  if (!Number.isFinite(capital.lat) || capital.lat < -90 || capital.lat > 90) {
    errors.push(`Invalid latitude for ${capital.capital}: ${capital.lat}`);
  }
  if (!Number.isFinite(capital.lon) || capital.lon < -180 || capital.lon > 180) {
    errors.push(`Invalid longitude for ${capital.capital}: ${capital.lon}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${capitals.length} capitals and ${worldData.features.length} map features.`);
