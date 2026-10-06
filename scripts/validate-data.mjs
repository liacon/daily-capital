import capitalsData from "../src/data/capitals.json" with { type: "json" };
import worldData from "../src/data/world.json" with { type: "json" };

const { capitals } = capitalsData;
const errors = [];

if (!Array.isArray(capitals) || capitals.length < 190) {
  errors.push(`Expected at least 190 capitals, found ${capitals?.length ?? 0}.`);
}

if (!worldData?.features?.length) {
  errors.push("World map data is empty.");
}

const ids = new Set();
const names = new Set();

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

  if (capital.lat < -90 || capital.lat > 90) {
    errors.push(`Invalid latitude for ${capital.capital}: ${capital.lat}`);
  }
  if (capital.lon < -180 || capital.lon > 180) {
    errors.push(`Invalid longitude for ${capital.capital}: ${capital.lon}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${capitals.length} capitals and ${worldData.features.length} map features.`);
