# Daily Capital — capital data audit

Audit date: 26 November 2026. Local revision: 59108cb (main).

This is an audit and proposed correction plan, not a data release. No application files, playable answers, source datasets, dependencies, saved games or deployments were changed. Findings concern the checked local revision; production was not independently inspected during this audit.

## Scope and evidence

- Inspected all **199 playable records**, representing **195 country labels**, and all **16 excluded Natural Earth records classified as national or alternate national capitals**. Also checked missing-country coverage and relevant records classified below national-capital level, including Gitega.
- Downloaded the [UNdata country-profile index](https://data.un.org/legacy/en/index.html) and screened country/capital names against its profiles, which contain 2025 reference data. Of the 199 game records, 195 map to a retrieved capital profile; Apia, Pristina, Taipei and Hargeisa have separate official/public-authority references. The Samoa profile redirected without a usable capital field.
- 185 records match the baseline capital name after case, accent, punctuation and spacing normalization. This is a screening count, **not 185 independent certifications that every legal status, coordinate and alternative seat is current**. Differences and additional seats were manually reviewed below. Myanmar's Naypyidaw / Nay Pyi Taw is a spelling difference, not a relocation.
- [CAPITAL_DATA_AUDIT.json](CAPITAL_DATA_AUDIT.json) records every playable city, coordinates as found, baseline reference, assessment, finding ID, excluded-source inventory, coverage gaps and dataset hash. It is documentation only and is not imported by the game.
- Supplemented the baseline with country governments, constitutions, municipal authorities, UN and government geographical references. The baseline is not sufficient on its own: it still lists Malabo, uses Melekeok for Palau, and lists Colombo with Kotte in a footnote.
- This is a complete **catalogue name/coverage audit**, with focused source verification of exceptions. It is not a fresh legal review of 195 constitutions, a point-by-point coordinate survey, or an exhaustive inventory of every overseas territory and temporary government office. Replacement coordinates and current cutover dates must be verified during implementation.

## Priority corrections and omissions

| ID | Country | Current game | Finding and proposed action | Evidence |
| --- | --- | --- | --- | --- |
| F01 | Tanzania | Dar es Salaam; Dodoma rejected | **Use Dodoma as the current national-capital target.** Dar es Salaam is the commercial capital; it must not stand in for Dodoma or share its coordinates. Preserve historical Dar es Salaam guesses as that distinct city. | [Tanzanian embassy](https://www.us.tzembassy.go.tz/tanzania/about-tanzania), [UN profile](https://data.un.org/legacy/en/iso/tz.html) |
| F02 | Burundi | Bujumbura; no Gitega | **Add Gitega and make it the political-capital target.** Burundi officially distinguishes political Gitega from economic Bujumbura. Do not describe Bujumbura as simply a misspelling or silently relocate its saved ID. Decide economic-capital eligibility under P01. | [Burundi prime minister's office](https://primature.gov.bi/presentation-generale/), [2019 government gazette](https://amategeko.gov.bi/wp-content/uploads/2019/11/BOB_No2BIS-2019.pdf) |
| F03 | Benin | Cotonou; no Porto-Novo | **Add Porto-Novo, the official/constitutional capital.** Cotonou can remain under an explicit government-seat policy; it should not be the only option. | [France Diplomatie](https://www.diplomatie.gouv.fr/fr/information-par-pays/benin/presentation-du-benin), [German Foreign Office country directory, capital and government seat](https://www.auswaertiges-amt.de/resource/blob/215256/9c319212055fc109813748ba72a9a6c4/laenderverzeichnis-data.pdf) |
| F04 | Sri Lanka | Colombo; no Sri Jayawardenepura Kotte | **Add Sri Jayawardenepura Kotte.** Retain Colombo with a role explanation; the UN explicitly identifies Kotte as legislative capital, and the municipality records its designation. Accept common Kotte/Jayewardenepura spelling variants. | [Kotte Municipal Council](https://www.kotte.mc.gov.lk/index.php?Itemid=175&id=25&lang=en&option=com_content&view=article), [UN profile and footnote](https://data.un.org/legacy/en/iso/lk.html) |
| F05 | South Sudan | Entire country absent | **Add Juba.** This is a clear coverage omission: its source record is classified as a national capital but has adm0cap=0, so the importer rejects it. | [South Sudan Constitution, article 50(4)](https://www.mofp.gov.ss/laws/Constitution.pdf), [Juba City Council](https://jcc.gov.ss/en/about-juba) |
| F06 | Palau | Melekeok; no Ngerulmud record | **Use Ngerulmud as the precise canonical capital name.** Palau's government locates it in Melekeok. Check whether the current point (7.487396, 134.626549) represents the intended settlement/capitol before adjusting coordinates or migration. This is a naming/granularity issue, not an established recent relocation. | [Palau government statistical yearbook](https://www.palaugov.pw/wp-content/uploads/2023-Statistical_Yearbook.pdf); [UN uses broader Melekeok label](https://data.un.org/legacy/en/iso/pw.html) |
| F07 | Eswatini | Mbabane; no Lobamba | **Add Lobamba alongside Mbabane**, consistently with the game's existing multi-capital support. Distinguish legislative/royal Lobamba from administrative Mbabane. | [African Union](https://au.int/en/cities/lobambaroyal-and-legislative-mbabane-administrative), [UN profile footnote](https://data.un.org/legacy/en/iso/sz.html) |

F01/F02 are not recent changes: Dodoma's designation dates to 1973, with a [2018 declaration act](https://polis.parliament.go.tz/uploads/bills/acts/1563456817-5.THE%20DODOMA%20CAPITAL%20CITY%20_DECLARATION_%20ACT%2C%202018.pdf); Burundi's political/economic distinction was legislated in 2019. Any player notice should say **we corrected our data**, not that these countries changed capital today.

## Policy decisions, separate from factual corrections

### P01 — define what counts as a playable capital

Recommended rule: include national capitals and recognised national administrative/legislative seats, with a visible role label. Do not automatically include former capitals, places called a summer capital, commercial centres or every city hosting a government institution. This is a proposal, not an implemented policy.

- Keep South Africa's **Pretoria, Cape Town and Bloemfontein**. The [South African government](https://www.gov.za/about-sa/south-africa-glance-1) explicitly lists all three. Johannesburg is not a fourth capital merely because it hosts the Constitutional Court.
- Keep **Sucre and La Paz**, identifying constitutional capital and government seat respectively. [UN Bolivia profile](https://data.un.org/legacy/en/iso/bo.html)
- Keep **Yamoussoukro and Abidjan** under a documented multi-seat rule; the UN distinguishes capital and administrative capital. Do not infer that every economic capital worldwide should therefore be included. [UN Ivory Coast profile](https://data.un.org/legacy/en/iso/ci.html)
- Consider **The Hague** alongside Amsterdam and **Putrajaya** alongside Kuala Lumpur as recognised government/administrative seats. Their absence is a consistency issue under a broad seat policy, not proof Amsterdam or Kuala Lumpur is wrong. [European Union](https://european-union.europa.eu/principles-countries-history/eu-countries/netherlands_en), [Malaysia foreign ministry](https://www.kln.gov.my/web/fin_helsinki/post/federal-territory-day-hari-wilayah-persekutuan)
- **Valparaiso** houses Chile's Congress, while Santiago remains the capital. Decide explicitly whether the rule extends to this legislative seat; avoid mechanically treating every parliamentary or court location as a separate capital. [Congress library](https://www.bcn.cl/portal/api-servicios/servicio/GetContenidoPaginaInternaHTML?url=ubicacion), [UN Chile profile](https://data.un.org/legacy/en/iso/cl.html)
- **Bujumbura** has a formally designated economic-capital role. Recommend Gitega as the national puzzle target, with Bujumbura retained in historical records; broader eligibility needs a deliberate decision. Dar es Salaam's commercial role alone likewise does not justify it as Tanzania's national target.
- A city can be accepted as a geographically scored guess without being in the daily-answer pool. This distinction offers a useful way to avoid rejecting reasonable government-seat guesses while keeping daily questions clear.

### P02 — missing country with no official capital

**Naoero (formerly Nauru)** is absent. Yaren is commonly used as its government-seat answer, but it is a district and the country has no official capital. If included, explain this rather than call it an ordinary capital city. Also use the current country name with Nauru as a familiar alias: the [UN records the name notification on 26 June 2026](https://www.un.org/en/about-us/member-states/naoero). [UNCTAD explains Yaren's status](https://dgff2021.unctad.org/nauru/). This is a scope/wording decision, not the same type of error as missing Juba.

### P03 — territorial coverage needs an explicit rule

The 195 country labels are **not** a complete list of the 193 UN members plus two observer states. The game covers 191 UN member countries, Vatican/Holy See, and three additional entries (Kosovo, Taiwan, Somaliland); South Sudan, Naoero/Nauru and Palestine are absent relative to that baseline.

- **Palestine:** the [UN profile](https://data.un.org/legacy/en/iso/ps.html) lists East Jerusalem. Assess Ramallah separately as a government-seat candidate, not an interchangeable spelling/location. Jerusalem's disputed status needs precise wording and coordinates; do not use this audit to silently change Israel's existing entry or substitute Tel Aviv. [UN discussion of Jerusalem's status](https://www.un.org/unispal/permanent-status-issues/)
- **Kosovo/Pristina, Taiwan/Taipei and Somaliland/Hargeisa:** these entries are outside the UN-member baseline. Their presence is a scope decision rather than a simple erroneous-capital finding. Their differing recognition situations should not be collapsed into one unsupported sovereignty claim. References are attached to their rows in the JSON ledger. No removals are proposed as an automatic consequence of the audit.
- **Cook Islands/Avarua and Niue/Alofi:** both have [UN profiles](https://data.un.org/legacy/en/iso/ck.html), [including Niue](https://data.un.org/legacy/en/iso/nu.html), but are absent from the game. Decide eligibility for these and dependencies as a separate scope change. This audit does not recommend expanding to every territory by default.

## Other reviewed entries

| ID | Entry | Assessment |
| --- | --- | --- |
| V01 | Equatorial Guinea | Ciudad de la Paz is already corrected in local commit 59108cb, with a game cutover on 26 November. Retain this correction; the older UN profile must not undo it. [Official decree](https://www.guineaecuatorialpress.com/index.php/noticias/decreto_ley_por_el_que_se_declara_la_ciudad_de_la_paz_djibloho_capital_de_la_republica_de_guinea_ecuatorial). Production deployment not verified here. |
| V02 | Kiribati | UNdata says Bairiki; Australian DFAT describes Tarawa as capital. Treat this as geographic granularity, not an automatic error or three new cities. Review whether to display South Tarawa with Tarawa/Bairiki search aliases against the actual point. [UN](https://data.un.org/legacy/en/iso/ki.html), [DFAT](https://www.dfat.gov.au/geo/kiribati/kiribati-country-brief) |
| V02 | Tuvalu | Funafuti matches the [UN profile](https://data.un.org/legacy/en/iso/tv.html). No replacement proposed. Distinguish atoll and settlement when refining descriptions. |
| V02 | Switzerland | Keep Bern; explain federal city/de facto capital if adding facts. [Swiss government](https://www.aboutswitzerland.eda.admin.ch/en/political-system) |
| V03 | Indonesia | Jakarta matches the UN baseline. Nusantara's statutory status, physical relocation and operative presidential cutover must be distinguished. The March 2026 [Constitutional Court report](https://en.mkri.id/news/details/2026-03-11/House_of_Representatives_Explains_the_Stages_of_Implementing_the_Transfer_of_National_Capital) describes the decree mechanism. No effective relocation decree was verified in this audit; keep on watch and recheck before any release rather than claim the future transition is settled. |
| V03 | Egypt | Keep Cairo based on the [constitution, article 222](https://www.sis.gov.eg/newvr/dustor-en001.pdf) and UN profile. The new administrative city does not by itself prove a constitutional-capital change; monitor separately. |
| V03 | Sudan | Keep Khartoum; current [Sudanese embassy](https://www.sudanembassy.org.uk/) identifies it as capital. Port Sudan's wartime government role does not justify a silent replacement. |
| V03 | Yemen | Keep Sanaa based on the [UN profile](https://data.un.org/legacy/en/iso/ye.html). Temporary government seats and conflicting control need separate explanations, not automatic substitution. |

Minor display review: Washington,  D.C. has doubled spacing in the local data. Naypyidaw / Nay Pyi Taw are equivalent naming variants. Country naming aliases (for example Turkey/Turkiye, Cape Verde/Cabo Verde, East Timor/Timor-Leste) should be handled separately from capital correctness; no blanket country-label rewrite was performed.

## All 16 excluded national/alternate source records

| Excluded record | Audit disposition |
| --- | --- |
| Lobamba | Add recognised alternate capital (F07). |
| Bir Lehlou | Western Sahara scope/status review; do not import merely because of source classification. |
| Juba | Add missing national capital/country (F05). |
| The Hague | Government-seat eligibility decision (P01). |
| Sri Jayawardenepura Kotte | Add missing capital (F04). |
| Baguio | Keep excluded from ordinary national-capital targets; Manila is the [UN-listed capital](https://data.un.org/legacy/en/iso/ph.html). Summer/historic usage is insufficient. |
| Dodoma | Correct Tanzania (F01). |
| Laayoune | Western Sahara/Morocco scope/status review; do not treat the source's Morocco label as a settled national-capital claim. |
| Putrajaya | Administrative-seat eligibility decision (P01). |
| Kyoto | Keep excluded from current national targets; [Tokyo is current](https://data.un.org/legacy/en/iso/jp.html). |
| Porto-Novo | Add missing national capital (F03). |
| Valparaiso | Legislative-seat eligibility decision (P01). |
| Tel Aviv | Do not substitute for Jerusalem; territorial/status wording belongs to P03. [UN Israel profile](https://data.un.org/legacy/en/iso/il.html). |
| Yangon | Keep excluded from current national targets; [Nay Pyi Taw is current](https://data.un.org/legacy/en/iso/mm.html). |
| Johannesburg | Keep excluded as an additional national capital; official three-capital list is already represented. |
| Lagos | Keep excluded from current national targets; [Abuja is current](https://data.un.org/legacy/en/iso/ng.html). |

Gitega is outside these 16: its source classification is Admin-1 capital. Loosening the filter to accept all alternate national capitals would therefore **still miss Gitega**, while wrongly adding historical or disputed records. Yaren/Ngerulmud also require curated records or name/location resolution rather than a filter-only fix.

## Root cause and implementation plan

The importer in scripts/generate-data.mjs admits only featurecla=Admin-0 capital AND adm0cap=1. These cartographic flags are not an authoritative, current eligibility policy. The validator mainly checks structure, coordinate bounds, uniqueness and a minimum count of 190; only Equatorial Guinea has a specific factual correction assertion. A count of 199 can therefore pass while whole countries and valid capitals are missing.

Recommended implementation order:

1. Correct Tanzania first using a verified Dodoma point and a separate city ID, then Burundi and Palau. Preserve the old-city records for saved guesses; never make Dar es Salaam an alias of a different location.
2. Separate the **accepted-guess catalogue** from the **daily-answer schedule**. Add Porto-Novo, Kotte, Juba and Lobamba under reviewed rules. Decide P01/P02/P03 explicitly rather than letting Natural Earth flags decide.
3. Store curated eligibility, city role, authoritative source, review date, real-world effective date and game cutover date. Ensure data regeneration reapplies the curation and cannot silently regress.
4. Preserve the existing 199-slot schedule/history for dates before an announced UTC cutover. Current daily selection shuffles the whole catalogue and calculates cycles using its length: inserting, removing or sorting records changes unrelated puzzles. Use explicit schedule versions and a defined new-cycle start; the current Equatorial Guinea-only historical reconstruction is not sufficient for arbitrary future additions.
5. Version or freeze the scoring reference catalogue for past dates too. Adding nearby capitals changes the third-nearest-neighbour spacing and can rescore old guesses, even if targets stay stable. Preserve streaks, historical solves/reveals, city IDs, saved guess locations and previously published results.
6. Add curated coverage assertions and regression cases for these omissions, regeneration, date boundaries, historical targets/scores/restoration and autocomplete. Coordinate bounds alone cannot verify the correct city. Test distance markers, disambiguation and weather/info/link lookups for replacements.
7. Publish a brief correction notice: for example, 'We have corrected our capital-city list. Tanzania now uses Dodoma, its official capital; Dar es Salaam is its commercial centre. Your previous results and streaks are preserved.' Only promise preservation after tests prove it. Put enduring multiple-capital role explanations in city information/How to Play, separate from a temporary correction notice.

No implementation or release date is approved by this report. The recommended next development task is the curated correction and historical-compatibility work above, with a preview and checks before the user's commit/push.
