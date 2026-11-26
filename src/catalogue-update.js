// Reviewed corrections, not a blanket import of Natural Earth's alternate-capital flags.
export const CATALOGUE_UPDATE = Object.freeze({
  id: "capital-audit-2026", version: "v3", gameFrom: "2026-11-27", noticeUntil: "2026-12-11", reviewed: "2026-11-26"
});
const naturalEarth = "https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places_simple.geojson";
export const REVIEWED_CAPITALS = [
  { id: "dodoma-tanzania", capital: "Dodoma", country: "Tanzania", sovereign: "Tanzania", lat: -6.183306, lon: 35.750004,
    replaces: "dar-es-salaam-tanzania", role: "National capital", source: "https://www.us.tzembassy.go.tz/tanzania/about-tanzania", coordinateSource: naturalEarth,
    note: "Dodoma is Tanzania’s official capital. Dar es Salaam is its commercial centre and former capital. We corrected our game data; this is not a new capital relocation." },
  { id: "gitega-burundi", capital: "Gitega", country: "Burundi", sovereign: "Burundi", lat: -3.426007, lon: 29.843594,
    replaces: "bujumbura-burundi", role: "Political capital", source: "https://primature.gov.bi/presentation-generale/", coordinateSource: naturalEarth,
    note: "Gitega is Burundi’s political capital. Bujumbura retains its economic-capital role; the game now uses Gitega for the national-capital puzzle." },
  { id: "ngerulmud-palau", capital: "Ngerulmud", country: "Palau", sovereign: "Palau", lat: 7.5006, lon: 134.6242,
    replaces: "melekeok-palau", role: "National capital", source: "https://www.palaugov.pw/wp-content/uploads/2023-Statistical_Yearbook.pdf",
    coordinateSource: "https://open.unep.org/docs/gef/PIR/10267_PIR_UNEP_2024_GEF_CW.10267.ISLANDS_Pacific.pdf",
    note: "Ngerulmud is Palau’s capital, in the state of Melekeok. We have made the city name and map location more precise." },
  { id: "porto-novo-benin", capital: "Porto-Novo", country: "Benin", sovereign: "Benin", lat: 6.483311, lon: 2.616626,
    role: "Official capital", source: "https://www.diplomatie.gouv.fr/fr/information-par-pays/benin/presentation-du-benin", coordinateSource: naturalEarth,
    note: "Porto-Novo is Benin’s official capital. Cotonou is the seat of government; both are playable, as separate cities." },
  { id: "sri-jayawardenepura-kotte-sri-lanka", capital: "Sri Jayawardenepura Kotte", country: "Sri Lanka", sovereign: "Sri Lanka", lat: 6.900004, lon: 79.949993,
    role: "Legislative capital", source: "https://data.un.org/legacy/en/iso/lk.html", coordinateSource: naturalEarth,
    note: "Sri Jayawardenepura Kotte is Sri Lanka’s legislative capital. Colombo is also included; each city has its own location and answer." },
  { id: "juba-south-sudan", capital: "Juba", country: "South Sudan", sovereign: "South Sudan", lat: 4.829975, lon: 31.580026,
    role: "National capital", source: "https://www.mofp.gov.ss/laws/Constitution.pdf", coordinateSource: naturalEarth,
    note: "Juba is the capital of South Sudan. It was missing from our original list and is now included." },
  { id: "lobamba-eswatini", capital: "Lobamba", country: "eSwatini", sovereign: "eSwatini", lat: -26.466667, lon: 31.199997,
    role: "Royal and legislative capital", source: "https://au.int/en/cities/lobambaroyal-and-legislative-mbabane-administrative", coordinateSource: naturalEarth,
    note: "Lobamba is Eswatini’s royal and legislative capital. Mbabane is the administrative capital; both are playable." }
].map(Object.freeze);

export function applyCatalogueUpdate(capitals) {
  const result = capitals.map(city => ({ ...city }));
  for (const entry of REVIEWED_CAPITALS) {
    const { id, capital, country, sovereign, lat, lon } = entry;
    const record = { id, capital, country, sovereign, lat, lon };
    const matches = result.map((city, index) => [city, index])
      .filter(([city]) => city.id === id || (entry.replaces && city.id === entry.replaces));
    if (matches.length > 1 || (entry.replaces && matches.length !== 1)) {
      throw new Error("Ambiguous or missing capital correction: " + id);
    }
    if (matches.length) result[matches[0][1]] = record;
    else result.push(record);
  }
  return result.sort((a, b) => a.capital.localeCompare(b.capital, "en"));
}
export function capitalRoleNote(id) {
  const counterpart = { "cotonou-benin": "porto-novo-benin", "colombo-sri-lanka": "sri-jayawardenepura-kotte-sri-lanka", "mbabane-eswatini": "lobamba-eswatini" };
  return REVIEWED_CAPITALS.find(city => city.id === (counterpart[id] || id));
}
export function showCatalogueUpdate(date, dismissed = false) {
  return !dismissed && date >= CATALOGUE_UPDATE.gameFrom && date < CATALOGUE_UPDATE.noticeUntil;
}
