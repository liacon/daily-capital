// Separate the real-world change from our game-data cutover to preserve played puzzles.
export const EQUATORIAL_GUINEA_CORRECTION = {
  id: "equatorial-guinea-2026",
  effectiveDate: "2026-01-02",
  puzzleDate: "2026-11-25",
  gameFrom: "2026-11-26",
  noticeUntil: "2026-12-03",
  source: "https://www.guineaecuatorialpress.com/index.php/noticias/decreto_ley_por_el_que_se_declara_la_ciudad_de_la_paz_djibloho_capital_de_la_republica_de_guinea_ecuatorial",
  coordinateSource: "https://assets.publishing.service.gov.uk/media/695fb2f757e7407fe07765d8/Equatorial_Guinea_Toponymic_Factfile.pdf",
  previous: {
    id: "malabo-equatorial-guinea", capital: "Malabo", country: "Equatorial Guinea",
    sovereign: "Equatorial Guinea", lat: 3.750015, lon: 8.783278
  },
  current: {
    id: "ciudad-de-la-paz-equatorial-guinea", capital: "Ciudad de la Paz", country: "Equatorial Guinea",
    sovereign: "Equatorial Guinea", lat: 1.5925, lon: 10.823611
  }
};

// Replace in place: sorting the replacement by its new name would change every daily deck.
export function applyCapitalCorrections(capitals) {
  const correction = EQUATORIAL_GUINEA_CORRECTION;
  const matches = capitals.filter((city) => city.country === correction.current.country);
  if (matches.length !== 1 || ![correction.previous.id, correction.current.id].includes(matches[0].id)) {
    throw new Error("Expected exactly one known Equatorial Guinea capital before applying correction.");
  }
  return capitals.map((city) => city.country === correction.current.country ? { ...correction.current } : city);
}

export function showCapitalCorrection(date, dismissed = false) {
  const { gameFrom, noticeUntil } = EQUATORIAL_GUINEA_CORRECTION;
  return !dismissed && date >= gameFrom && date < noticeUntil;
}
