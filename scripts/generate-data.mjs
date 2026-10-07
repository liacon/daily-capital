import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "data-sources");
const outDir = path.join(root, "src", "data");

const placesPath = path.join(sourceDir, "ne_10m_populated_places_simple.geojson");
const countriesPath = path.join(sourceDir, "ne_110m_admin_0_countries.geojson");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CAPITAL_NAME_OVERRIDES = {
  "Andorra|Andorra": "Andorra la Vella",
  "Denmark|København": "Copenhagen"
};

function displayCapitalName(props) {
  return CAPITAL_NAME_OVERRIDES[`${props.adm0name}|${props.name}`] || props.name;
}

const places = readJson(placesPath);
const countries = readJson(countriesPath);

const capitals = places.features
  .filter((feature) => {
    const props = feature.properties;
    return props.featurecla === "Admin-0 capital" && Number(props.adm0cap) === 1;
  })
  .map((feature) => {
    const props = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    return {
      id: `${slugify(props.name)}-${slugify(props.adm0name)}`,
      capital: displayCapitalName(props),
      country: props.adm0name,
      sovereign: props.sov0name,
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      sortName: props.name
    };
  })
  .sort((a, b) => a.sortName.localeCompare(b.sortName, "en"))
  .map(({ sortName, ...capital }) => capital);

const world = {
  type: "FeatureCollection",
  metadata: {
    source: "Natural Earth ne_110m_admin_0_countries.geojson",
    sourceUrl:
      "https://github.com/nvkelso/natural-earth-vector/tree/master/geojson",
    license: "Public domain"
  },
  features: countries.features.map((feature) => ({
    type: "Feature",
    properties: {
      name: feature.properties.NAME,
      admin: feature.properties.ADMIN,
      isoA3: feature.properties.ISO_A3,
      continent: feature.properties.CONTINENT
    },
    geometry: feature.geometry
  }))
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "capitals.json"),
  `${JSON.stringify(
    {
      metadata: {
        source: "Natural Earth ne_10m_populated_places_simple.geojson",
        sourceUrl:
          "https://github.com/nvkelso/natural-earth-vector/tree/master/geojson",
        license: "Public domain",
        included:
          "Records where featurecla is Admin-0 capital and adm0cap equals 1.",
        excluded:
          "Admin-0 region capitals, Admin-0 alternate capitals, Admin-1 capitals, non-capital populated places."
      },
      capitals
    },
    null,
    2
  )}\n`
);
fs.writeFileSync(path.join(outDir, "world.json"), `${JSON.stringify(world)}\n`);

console.log(`Generated ${capitals.length} capital records.`);
console.log(`Generated ${world.features.length} country boundary records.`);
