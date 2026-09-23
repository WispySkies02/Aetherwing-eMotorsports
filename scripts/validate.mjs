import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const json = (file) => JSON.parse(readFileSync(resolve(root, 'src/data', file), 'utf8'));
const text = (file) => readFileSync(resolve(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`✖ ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${message}`);
  }
};

const eventSlugForValidation = (event = {}) => {
  const slugify = (value = '') => String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${event.date || 'tbd'}-${event.league || 'event'}-${slugify(event.title || event.track || 'scheduled-event')}`;
};

const site = json('site.json');
const leadership = json('leadership.json');
const competitions = json('competitions.json');
const drivers = json('drivers.json');
const roster = json('roster-profiles.json');
const driverProfiles = json('driver-profiles.json');
const partners = json('partners.json');
const schedule = json('schedule.json');
const scheduleEvents = json('schedule-events.json');
const tracks = json('schedule-track-locations.json');
const iracing = json('iracing-garage.json');
const wins = json('wins.json');
const paints = json('paints.json');
const paintLeagues = json('paint-leagues.json');
const news = json('news.json');
const standings = json('standings.json');
const charters = json('charters.json');
const driverPortfolios = json('driver-portfolios.json');


assert(news.length === 11, 'News archive matches the current 11-story Team Wire');
assert(new Set(news.map((story) => story.slug)).size === news.length, 'All Team Wire story slugs are unique');
assert(news.filter((story) => story.category === 'Race & Competition').length === 7, 'Team Wire contains seven Race & Competition stories');
assert(news.filter((story) => story.category === 'Milestones').length === 2, 'Team Wire contains two Milestones stories');
assert(news.filter((story) => story.category === 'Team & Organization').length === 2, 'Team Wire contains two Team & Organization stories');
assert(news.some((story) => story.featured && story.slug === 'wispy-southern-500-darlington-top-five'), 'Southern 500 Top Five story is the Team Wire headline');
assert(news.some((story) => story.slug === 'wispy-100th-roracing-start-talladega'), '100th RoRacing start story is migrated');
assert(news.some((story) => story.slug === 'aetherwing-ngm-driver-development'), 'NGM Driver Development story is migrated');
assert(news.every((story) => Array.isArray(story.sections) && story.sections.length >= 3), 'Every Team Wire story has a full article body');

assert(site.competitionRelationships === 6, 'Six active competition relationships');
assert(site.featuredPartners === 2 && partners.filter((p) => p.featured).length === 2, 'Exactly two featured partners');
assert(driverPortfolios.map((portfolio)=>portfolio.name).join('|') === 'Hailey|Nico|Rocky', 'Driver portfolio seed includes Hailey, Nico, and Rocky');
assert(driverPortfolios.every((portfolio)=>portfolio.id && portfolio.name && Array.isArray(portfolio.brands) && portfolio.brands.length), 'Every driver portfolio has an editable identity and brand list');
assert(site.verifiedWins === 27 && wins.length === 27, '27 verified Aetherwing wins and 27 history rows');
assert(site.activeRoRacingDrivers === 10 && roster.length === 10, 'Ten current RoRacing driver profiles');
assert(site.aetherwingDrivers === 5 && site.allianceOnlyDrivers === 5, 'Drivers split is five Aetherwing / five alliance-only');
assert(competitions.length === 6, 'Competition data contains six active relationships');
assert(competitions.filter((c) => c.type === 'aetherwing').length === 4, 'Four active Aetherwing programs');
assert(competitions.filter((c) => c.type === 'alliance').length === 2, 'Two StarClutch Racing Alliance series');
assert(!competitions.some((c) => /flo/i.test(c.name)), 'FloRacing remains intentionally absent');
assert(!leadership.some((p) => /trent/i.test(p.name)), 'Trent is absent from current leadership');
assert(!leadership.some((p) => p.roles.some((r) => /co-owner|co-founder/i.test(r))), 'No Co-Owner/Co-Founder role in current leadership');
assert(leadership.some((p) => p.name === 'Callornot' && p.roles.includes('Team Principal')), 'Callornot is Team Principal');

const results = json('results.json');
const latestRace = results.find((race)=>race.featured);
const latestResult = latestRace?.entries?.find((entry)=>entry.featuredDriver);
assert(latestRace?.title === 'Southern 500' && latestResult?.start === 9 && latestResult?.stage1Points + latestResult?.stage2Points === 0 && latestResult?.finish === 5, 'Latest NRRS result is schedule-linked Southern 500: P9 start, 0 stage points, P5 finish');
assert(Array.isArray(results) && results.every((race)=>race.scheduleId && Array.isArray(race.entries)), 'Race Results uses schedule-linked race records with driver result rows');
assert(text('public/admin/content-admin.js').includes('data-result-driver-choice') && text('public/admin/content-admin.js').includes("resultRoster(current()?.league"), 'Race Results driver pickers are restricted to the selected league roster');
assert(text('src/styles/pages/history.css').includes('content:attr(data-track)') && !text('src/styles/pages/history.css').includes('content:"DAYTONA"'), 'Latest Result background etching reads DARLINGTON, not DAYTONA');

assert(!schedule.some((event) => event.id === 'uarl-d2') && !competitions.some((event) => event.id === 'uarl-d2') && !scheduleEvents.some((event) => event.league === 'uarl-d2'), 'UARL D2 is closed and removed from active competition/schedule data');
const pepsi400 = scheduleEvents.find((event) => event.league === 'nrrs' && event.title === 'Pepsi 400');
assert(pepsi400?.round === 'ROUND 19' && pepsi400?.specialTag === 'REGULAR SEASON FINALE', 'NRRS Pepsi 400 is Round 19 and the Regular Season Finale');
const nrrsSouthern500 = scheduleEvents.find((event) => event.league === 'nrrs' && event.title === 'Southern 500' && event.round === 'ROUND 20');
const nrrsFinale = scheduleEvents.find((event) => event.league === 'nrrs' && event.round === 'ROUND 25');
assert(nrrsSouthern500?.date === '2026-09-15' && nrrsSouthern500?.status === 'The Chase', 'NRRS Chase begins at Darlington on September 15');
const nrrsRemaining = scheduleEvents.filter((event) => event.league === 'nrrs' && ['ROUND 21','ROUND 22','ROUND 23','ROUND 24','ROUND 25'].includes(event.round));
const expectedNrrsRemaining = [
  ['ROUND 21','2026-09-22','Verizon 400','Richmond Raceway'],
  ['ROUND 22','2026-09-29','GEICO 400','Kansas Speedway'],
  ['ROUND 23','2026-10-06','Microsoft 200','Indianapolis Motor Speedway Road Course'],
  ['ROUND 24','2026-10-13','Comcast 301','New Hampshire Motor Speedway'],
  ['ROUND 25','2026-10-20','NRRS Championship Race at Homestead-Miami presented by American Express','Homestead-Miami Speedway']
];
assert(expectedNrrsRemaining.every(([round,date,title,track]) => nrrsRemaining.some((event) => event.round === round && event.date === date && event.title === title && event.track === track)), 'NRRS remaining schedule matches Richmond, Kansas, Indy RC, New Hampshire, and Homestead-Miami update');

assert(nrrsFinale?.date === '2026-10-20' && nrrsFinale?.title === 'NRRS Championship Race at Homestead-Miami presented by American Express' && nrrsFinale?.track === 'Homestead-Miami Speedway' && nrrsFinale?.status === 'Championship', 'NRRS Championship finale is the American Express-presented Homestead-Miami championship race on October 20');
assert(scheduleEvents.filter((event) => event.league === 'nrrs' && event.status === 'The Chase').length === 5, 'NRRS has five The Chase races before the Championship finale');
const nrrsStanding = standings.find((series) => series.id === 'nrrs');
const kmartStanding = standings.find((series) => series.id === 'kmart');
const sunocoStanding = standings.find((series) => series.id === 'sunoco');
const uarlStanding = standings.find((series) => series.id === 'uarl');
const nrrsHailey=nrrsStanding?.rows?.find((row)=>row.driver==='Hailey');
assert(nrrsStanding?.rows?.[0]?.position === 'P1' && nrrsHailey?.position === 'P6' && nrrsHailey?.points === 2087 && nrrsHailey?.delta === '-58' && nrrsHailey?.positionChange === '-1 spot' && nrrsHailey?.highlight === true, 'NRRS Chase standings are in position order with Hailey highlighted at P6, 2,087 points, -58 from leader, down 1 spot');
assert(kmartStanding?.rows?.length === 3 && kmartStanding.rows[0].driver === 'Jaxon' && kmartStanding.rows[0].position === 'P1' && kmartStanding.rows[1].driver === 'Will' && kmartStanding.rows[1].position === 'P2' && kmartStanding.rows[2].driver === 'Hailey' && kmartStanding.rows[2].position === 'P4', 'Kmart standings positions: Jaxon P1, Will P2, Hailey P4');
assert(kmartStanding?.ptEntry?.number === '29' && kmartStanding.ptEntry.status === 'NOT CHASE ELIGIBLE' && kmartStanding.ptEntry.drivers?.[0]?.driver === 'Clutch' && kmartStanding.ptEntry.drivers[0].points === 135 && kmartStanding.ptEntry.drivers[1].driver === 'Eazy' && kmartStanding.ptEntry.drivers[1].points === 59 && kmartStanding.ptEntry.drivers[2].driver === 'Matty' && kmartStanding.ptEntry.drivers[2].points === 58, 'Kmart #29 SCR PT car points and Chase ineligibility');
assert(sunocoStanding?.rows?.length === 4 && sunocoStanding.rows[0].driver === 'Will' && sunocoStanding.rows[0].position === 'P1' && sunocoStanding.rows[0].chaseStatus === 'CHASE' && sunocoStanding.rows[1].driver === 'Clutch' && sunocoStanding.rows[1].position === 'P2' && sunocoStanding.rows[1].chaseStatus === 'CHASE' && sunocoStanding.rows[2].driver === 'Eazy' && sunocoStanding.rows[2].position === 'P4' && sunocoStanding.rows[2].chaseStatus === 'CHASE' && sunocoStanding.rows[3].driver === 'Hailey' && sunocoStanding.rows[3].position === 'P10' && sunocoStanding.rows[3].chaseStatus === 'NOT IN CHASE', 'Sunoco positions and Chase status: Will P1, Clutch P2, Eazy P4, Hailey P10');
assert(uarlStanding?.rows?.length === 0 && /No official UARL standings snapshot published yet/i.test(uarlStanding?.emptyMessage || '') && uarlStanding?.status === 'D1 POSTPONED', 'UARL standings remain empty while D1 is postponed and D2 is closed');

const nrrsClash = scheduleEvents.find((event) => event.league === 'nrrs' && /Clash at the Coliseum/i.test(event.title));
const nrrsAllStar = scheduleEvents.find((event) => event.league === 'nrrs' && /All-Star Race/i.test(event.title));
assert(!nrrsClash?.round && !nrrsAllStar?.round, 'NRRS Clash and All-Star are excluded from round numbering');
const uarlD1Rounds = scheduleEvents.filter((event) => event.league === 'uarl-d1' && event.round).map((event) => event.round);
assert(uarlD1Rounds.length === 18 && uarlD1Rounds[0] === 'ROUND 1' && uarlD1Rounds.at(-1) === 'ROUND 18', 'UARL D1 countable schedule runs Round 1 through Round 18');
const uarlD1Clash = scheduleEvents.find((event) => event.league === 'uarl-d1' && /Bean Clash/i.test(event.title));
const uarlD1AllStar = scheduleEvents.find((event) => event.league === 'uarl-d1' && /All-Star Race/i.test(event.title));
assert(!uarlD1Clash?.round && !uarlD1AllStar?.round, 'UARL D1 Clash and All-Star are excluded from round numbering');
assert(uarlD1Clash?.date === '2026-09-09', 'UARL D1 L.L. Bean Clash remains on September 9');
const uarlD1PostClashSaturdays = scheduleEvents.filter((event) => event.league === 'uarl-d1' && event.date !== '2026-09-09' && new Date(`${event.date}T12:00:00Z`).getUTCDay() === 6);
assert(uarlD1PostClashSaturdays.length === 0, 'UARL D1 Saturday dates have moved to Sundays while special non-Saturday dates remain intact');
const uarlD1Competition = competitions.find((item) => item.id === 'uarl-d1');
assert(uarlD1Competition?.schedule === 'Sundays · 8:30 PM ET', 'UARL D1 recurring schedule is Sundays at 8:30 PM ET');
const uarlD1Daytona = scheduleEvents.find((event) => event.league === 'uarl-d1' && event.round === 'ROUND 1');
assert(uarlD1Daytona?.date === '2026-09-20' && uarlD1Daytona?.time === '8:30 PM ET' && /POSTPONED/i.test(uarlD1Daytona?.specialTag || ''), 'UARL D1 resumes with postponed Daytona 500 on September 20 at 8:30 PM ET');
const kmartRockingham = scheduleEvents.find((event) => event.league === 'kmart' && event.round === 'ROUND 7');
const kmartPortland = scheduleEvents.find((event) => event.league === 'kmart' && event.round === 'ROUND 8');
assert(kmartRockingham?.date === '2026-09-21' && kmartRockingham?.time === '8:30 PM ET' && /POSTPONED/i.test(kmartRockingham?.specialTag || '') && /DASH4CASH/i.test(kmartRockingham?.specialTag || ''), 'Kmart resumes with postponed Rockingham Round 7 on September 21 at 8:30 PM ET');
assert(kmartPortland?.date === '2026-09-28', 'Kmart remaining calendar is shifted one week after Rockingham postponement');
assert(scheduleEvents.filter((event) => event.league === 'uarl-d2').length === 0, 'UARL D2 contributes no active schedule entries after closure');
assert(scheduleEvents.filter((event) => event.league === 'open' && event.round).length === 12, 'UARL Open is numbered across 12 rounds');
assert(scheduleEvents.some((event) => event.league === 'uarl-d1' && event.title === 'Queen City 500' && event.specialTag === 'CROWN JEWEL'), 'UARL D1 Queen City 500 is a Crown Jewel');
assert(scheduleEvents.some((event) => event.league === 'kmart' && event.title === 'Goodyear Southern 300' && event.specialTag === 'CROWN JEWEL'), 'Kmart Goodyear Southern 300 is a Crown Jewel');
assert(scheduleEvents.some((event) => event.league === 'kmart' && event.title === 'WeatherTech Championship 300' && event.status === 'Championship'), 'Kmart finale is the Championship');

assert(scheduleEvents.filter((event) => event.league !== 'iracing' && !event.offWeek).length === 108, 'Active source contains 108 season races after UARL D2 closure');
assert(scheduleEvents.filter((event) => event.league === 'iracing').length === 16, 'Full source contains 16 iRacing special-event windows');
assert(scheduleEvents.length === 125, 'Complete active schedule source contains 125 calendar entries including specials/off-week');
assert(scheduleEvents.some((event) => event.league === 'iracing' && event.title === 'Southern 500' && event.endDate === '2026-09-07'), 'iRacing Southern 500 is a multi-day event window');
assert(scheduleEvents.some((event) => event.title === 'Suzuka 1000km' && event.endDate === '2026-09-15'), 'Suzuka 1000km is represented as a multi-day event window');
assert(Object.keys(tracks.locations || {}).length >= 60, 'Schedule retains track-location weather mapping');
assert(tracks.aliases?.Michigan === 'Michigan International Speedway', 'Kmart Michigan weather alias resolves correctly');
assert(tracks.aliases?.Portland === 'Portland International Raceway', 'Kmart Portland weather alias resolves correctly');
assert(tracks.aliases?.Silverstone === 'Silverstone Circuit', 'Silverstone weather alias resolves correctly');
const unresolvedWeatherTracks = [...new Set(scheduleEvents.filter((event) => !event.offWeek && event.track && event.track !== 'No race scheduled').map((event) => event.track))].filter((track) => !(tracks.locations?.[tracks.aliases?.[track] || track]));
assert(unresolvedWeatherTracks.length === 0, `All scheduled track names resolve to weather locations${unresolvedWeatherTracks.length ? ': ' + unresolvedWeatherTracks.join(', ') : ''}`);

const wispyIRacing = drivers.find((d) => d.id === 'nicholas-iracing');
assert(wispyIRacing?.displayName === 'Hailey Bell' && wispyIRacing?.profile === 'wispy', 'Hailey Bell resolves to the Wispy profile for current iRacing presentation');
assert(iracing.factoryDrivers === 3 && iracing.teamEntries === 1 && iracing.schemes === 13, 'iRacing garage totals are 03 drivers / 01 team entry / 13 schemes');
assert(paintLeagues.length === 7 && paintLeagues.filter((league) => league.relationship !== 'archive').length === 6, 'Paint Booth contains six active garages plus one historical archive');
assert(paints.length === 35, 'Paint Booth source contains all 35 uploaded schemes');
assert(paints.filter((paint) => paint.leagues?.includes('iracing')).length === 13, 'Paint Booth contains 13 iRacing liveries');
assert(paints.filter((paint) => paint.driver === 'Hailey').length === 20 && paints.filter((paint) => paint.driver === 'Wispy' && paint.leagues?.includes('uarl-d2')).length === 1, 'Paint Booth uses Hailey on 20 active RoRacing paints and retains one historical D2 Wispy paint');
assert(paints.filter((paint) => paint.driver === 'Hailey Bell').length === 12, 'Paint Booth contains all 12 Hailey Bell iRacing paints tied to the Wispy identity');
assert(paints.filter((paint) => ['Hailey','Wispy','Hailey Bell'].includes(paint.driver)).length === 33, 'Unified Hailey / historical Wispy / Hailey Bell identity exposes 33 seed paints across RoRacing and iRacing');
assert(paints.filter((paint) => paint.leagues?.includes('nrrs')).length === 10, 'NRRS garage contains 10 source paints');
assert(paints.filter((paint) => paint.leagues?.includes('uarl-d1')).length === 1, 'UARL D1 garage contains the source-tagged Mobil 1 paint');
assert(paints.filter((paint) => paint.leagues?.includes('uarl-d2')).length === 1 && paints.find((paint) => paint.slug === 'd2-mobil1-toyota-supra')?.historical === true, 'UARL D2 retains only the #62 Mobil 1 Supra as historical archive paint');
assert(paints.filter((paint) => paint.leagues?.includes('uarl-open')).length === 1, 'UARL Open garage contains its source-tagged late model paint');
assert(paints.filter((paint) => paint.leagues?.includes('kmart')).length === 5, 'Kmart garage contains all 5 uploaded paints');
assert(paints.filter((paint) => paint.leagues?.includes('sunoco-truck')).length === 4, 'Sunoco garage contains all 4 source paints');
assert(paints.some((p) => p.slug === 'kmart-2005-home-depot' && String(p.schemeId) === '77315638051491'), 'Kmart 2005 Home Depot paint/deep-link data is present');
assert(paints.some((p) => p.slug === 'kmart-clutch-sinder' && p.driver === 'Clutch' && String(p.schemeId) === '132350921119875'), 'Clutch #29 Sinder Dodge Kmart paint/deep-link data is present');
assert(paints.some((p) => p.slug === 'open-ghost-strawberry-watermelon' && String(p.schemeId) === '80179635555676'), 'UARL Open Ghost Strawberry Watermelon paint is present');
assert(paints.some((p) => p.slug === 'truck-mopar-starclutch-racing' && String(p.schemeId) === '101804322425759'), 'Mopar / StarClutch Racing truck paint is present');

const schedulePage = text('src/pages/schedule/index.astro');
const paintPage = text('src/pages/paint-booth/index.astro');
assert(schedulePage.includes('data-event-dock') && schedulePage.includes('updateNextOperation'), 'Schedule includes expandable event docks and reactive Next Operation logic');
assert(schedulePage.includes('Championship Tracker') && schedulePage.includes('chaseSeries?.status'), 'Schedule surfaces current standings and NRRS Chase status from editable data');
assert(schedulePage.includes('eventCriteria') && schedulePage.includes('Crown Jewel') && schedulePage.includes('Dash4Cash') && schedulePage.includes('Regular Season Finale') && schedulePage.includes("label:'Clash'"), 'Schedule includes semantic special-criteria tags');
assert(schedulePage.includes('data-event-share') && schedulePage.includes('revealEventHash'), 'Schedule includes share buttons and exact event deep-link reveal logic');
assert(existsSync(resolve(root, 'src/pages/event/[slug].astro')), 'Static share route exists for schedule events');
const eventShareRoute = text('src/pages/event/[slug].astro');
assert(eventShareRoute.includes('/images/social/events/${event.shareSlug}-v47.jpg'), 'Schedule event shares use cache-busted v47 event-specific image cards');
assert(eventShareRoute.includes('og:title') && eventShareRoute.includes('&#8203;') && !eventShareRoute.includes('og:description'), 'Schedule event embeds suppress visible Discord title/description text');
assert(!eventShareRoute.includes('http-equiv="refresh"'), 'Schedule event share crawler pages do not meta-refresh away from their OG image');
assert(schedulePage.includes('applyLeagueSelection(target.league)'), 'Shared schedule events open with their own league filter selected');
assert(scheduleEvents.every((event) => existsSync(resolve(root, 'public/images/social/events', `${eventSlugForValidation(event)}-v47.jpg`))), 'All 125 active schedule events have v47 share-card images');
assert(schedulePage.includes('data-league-share') && schedulePage.includes('/schedule/share/${encodeURIComponent(selected.key)}/?v=57'), 'Schedule can share the currently selected league with v57 cache revision');
assert(!schedulePage.includes('navigator.share') && schedulePage.includes('COPY ${selected.label.toUpperCase()} LINK'), 'League share button always copies the URL instead of opening the native share sheet');
assert(existsSync(resolve(root, 'src/pages/schedule/share/[league].astro')), 'Static league-share route exists for schedule filters');
const leagueShareRoute = text('src/pages/schedule/share/[league].astro');
assert(leagueShareRoute.includes('export function getStaticPaths() {\n  const definitions = {'), 'League-share route keeps static-path definitions inside getStaticPaths isolated scope');
assert(leagueShareRoute.includes('/images/social/leagues/${league}-v57.jpg') && leagueShareRoute.includes('&#8203;') && !leagueShareRoute.includes('og:description'), 'League embeds use image-only v57 next-race cards with race-type badges');
for (const league of ['nrrs','kmart','sunoco','uarl-all','uarl-d1','open','iracing']) { assert(existsSync(resolve(root, 'public/images/social/leagues', `${league}-v57.jpg`)), `League share image exists: ${league}`); }
assert(schedulePage.includes("'uarl-all':{key:'uarl-all'") && schedulePage.includes("activeFilter === 'uarl-group'"), 'UARL All Divisions share selection is supported');
assert(paintPage.includes('https://paint.aetherwing.net/') && paintPage.includes("location.replace(target)"), 'Legacy main-site Paint Booth route bridges to the canonical paint subdomain');
assert(paintPage.includes("#paint-") && paintPage.includes('encodeURIComponent(slug)'), 'Legacy Paint Booth hash links preserve the selected paint slug');
const siteHeader = text('src/components/global/SiteHeader.astro');
const siteFooter = text('src/components/global/SiteFooter.astro');
assert(siteHeader.includes("import { navigation, siteSettings }") && siteHeader.includes('group.links.map'), 'Header links are rendered from Admin-managed navigation');
assert(siteFooter.includes("import { navigation, siteSettings }") && siteFooter.includes('navigation.map'), 'Footer links are rendered from Admin-managed navigation');
const navigation = json('navigation.json');
assert(navigation.some((item) => item.label === 'Paint Booth' && item.href === 'https://paint.aetherwing.net/'), 'Navigation data uses the canonical Paint Booth subdomain');
const baseLayout = text('src/layouts/BaseLayout.astro');
assert(baseLayout.includes('preconnect" href="https://i.ibb.co'), 'Global shell preconnects to the paint image host');
const driversPage = text('src/pages/drivers/index.astro');
assert(driversPage.includes('driver.numberImages') && driversPage.includes('aw-driver-number-art'), 'Drivers page renders assignment-linked driver number artwork');
assert(text('src/pages/wins-history/index.astro').includes('numberArtFor') && text('src/pages/wins-history/index.astro').includes('data-live-milestones'), 'Results, wins, and milestones reuse assignment-linked number artwork');
assert(driversPage.includes('aw-driver-num') && driversPage.includes('numberParts'), 'Drivers page uses split multi-number rendering for Wispy and other multi-program drivers');
assert(driversPage.includes('Aetherwing Charter Board') && driversPage.includes('data-charter-group'), 'Drivers page includes the Aetherwing Charter Board');
const nrrsCharters = charters.find((group) => group.id === 'nrrs');
const d1Charters = charters.find((group) => group.id === 'uarl-d1');
const hasCurrentOpenCharter=(group)=>{
  const charter=group?.openCharters?.[0];
  return charter?.label==='Aetherwing Open Charter' && charter?.active===true &&
    charter.uses?.some((use)=>use.number==='62'&&use.label==='Part-Time') &&
    charter.uses?.some((use)=>use.number==='82'&&use.label==='Development');
};
assert(JSON.stringify(nrrsCharters?.fullTime) === JSON.stringify([{number:'32',driver:'Hailey'},{number:'43',driver:'Plarker'},{number:'54',driver:'Open'}]) && hasCurrentOpenCharter(nrrsCharters), 'NRRS baseline keeps FT #32 Hailey / #43 Plarker / #54 Open plus one configurable Open Charter');
assert(JSON.stringify(d1Charters?.fullTime) === JSON.stringify([{number:'28',driver:'Hailey'},{number:'32',driver:'BurgerTown2Good'},{number:'52',driver:'Gk3r'},{number:'54',driver:'Open'},{number:'92',driver:'Rocky'}]) && hasCurrentOpenCharter(d1Charters), 'UARL D1 baseline keeps five FT charters plus one configurable Open Charter');
assert(nrrsCharters?.fullTime?.length === 3 && d1Charters?.fullTime?.length === 5 && charters.length === 2, 'NRRS has three FT charters; UARL D1 has five FT charters; D2 charter board is removed');
assert([nrrsCharters,d1Charters].every((group) => Array.isArray(group.openCharters) && group.openCharters.length===1 && group.openCharters[0].uses.length===2), 'Current baseline has one Open Charter per active charter board with two possible uses');
assert([nrrsCharters,d1Charters].every((group) => group.openCharters.every((charter)=>charter.uses.every((use)=>!('driver' in use)))), 'Open Charter number identities remain driver-neutral');
assert(!JSON.stringify(charters).includes('\"64\"'), 'No Aetherwing #64 charter exists in the current baseline');
assert(driversPage.includes('(group.openCharters ?? [])') && driversPage.includes('One charter slot ·'), 'Drivers charter board renders arbitrary configurable Open Charters and usage counts');
assert(driversPage.includes('role="tablist"') && driversPage.includes('role="tab"') && driversPage.includes('data-charter-panel'), 'Configurable Open Charter module uses accessible tab semantics');
assert(driversPage.includes("event.key==='ArrowRight'") && driversPage.includes("event.key==='Home'") && driversPage.includes("tab.addEventListener('click'"), 'Open Charter usage switch supports keyboard and touch/click interaction');
assert(driversPage.includes('data-charter-slot') && driversPage.includes('aw-open-charter__switch-line'), 'Drivers board renders configurable Open Charter visual slots with an Aether Blue switch line');
assert(!drivers.some((entry) => entry.competitionId === 'uarl-d2'), 'Driver program data contains no active UARL D2 assignments');
const burgerD1Entry = drivers.find((entry) => entry.id === 'burgertown-uarl-d1');
const gk3rD1Entry = drivers.find((entry) => entry.id === 'gk3r-uarl-d1');
assert(burgerD1Entry?.number === '32' && burgerD1Entry?.status === 'Full-Time', 'BurgerTown2Good moves to UARL D1 FT #32');
assert(gk3rD1Entry?.number === '52' && gk3rD1Entry?.status === 'Full-Time' && gk3rD1Entry?.handle === '@sealsntags', 'Gk3r moves to UARL D1 FT #52 with @sealsntags');
assert(roster.find((entry) => entry.slug === 'parker')?.name === 'Plarker', '#43 NRRS driver displays as Plarker');
assert(roster.find((entry) => entry.slug === 'burgertown2good')?.programs?.includes('UARL D1'), 'BurgerTown2Good profile now belongs to UARL D1');
assert(roster.find((entry) => entry.slug === 'gk3r')?.programs?.includes('UARL D1') && roster.find((entry) => entry.slug === 'gk3r')?.handle === '@sealsntags', 'Gk3r profile now belongs to UARL D1 as @sealsntags');
assert(competitions.find((entry) => entry.id === 'nrrs')?.roster?.includes('4TH · AETHERWING OPEN CHARTER · #62 PT / #82 DEVELOPMENT') && competitions.find((entry) => entry.id === 'uarl-d1')?.roster?.includes('AETHERWING OPEN CHARTER · #62 PT / #82 DEVELOPMENT'), 'Active program rosters show one shared #62 PT / #82 Development Aetherwing Open Charter');
assert(competitions.find((entry) => entry.id === 'uarl-d1')?.roster?.includes('#32 BurgerTown2Good') && competitions.find((entry) => entry.id === 'uarl-d1')?.roster?.includes('#52 Gk3r'), 'UARL D1 roster carries #32 BurgerTown2Good and #52 Gk3r FT charters');


const newsIndex = text('src/pages/news/index.astro');
const newsArticle = text('src/pages/news/[slug].astro');
assert(newsIndex.includes('2026 Dispatches') && newsIndex.includes('2025 Archive') && newsIndex.includes('Stories on Record'), 'News index mirrors the current Team Wire archive structure');
assert(newsArticle.includes('story.sections.map') && newsArticle.includes('aw-news-story-body'), 'News article route renders full migrated story bodies');
assert(newsArticle.includes('story.metrics') && newsArticle.includes('story.timeline'), 'News article route supports story snapshots and the Chase ledger');

const requiredRoutes = [
  'src/pages/index.astro','src/pages/drivers/index.astro','src/pages/drivers/[slug].astro','src/pages/schedule/index.astro','src/pages/event/[slug].astro','src/pages/paint-booth/index.astro','src/pages/partners/index.astro','src/pages/news/index.astro','src/pages/news/[slug].astro','src/pages/wins-history/index.astro','src/pages/mission-values/index.astro','src/pages/team-handbook/index.astro','src/pages/contact/index.astro','src/pages/404.astro'
];
for (const route of requiredRoutes) assert(existsSync(resolve(root, route)), `Route exists: ${route.replace('src/pages/','')}`);

const requiredAssets = ['public/images/brand/aetherwing-logo.png','public/images/textures/aetherwing-editorial.webp','public/images/social/default-social.png'];
for (const asset of requiredAssets) assert(existsSync(resolve(root, asset)), `Local Aetherwing asset exists: ${asset.replace('public/','')}`);
assert(existsSync(resolve(root, 'public/favicon/favicon.png')) || existsSync(resolve(root, 'public/favicon/favicon.svg')), 'At least one local favicon exists (PNG or SVG)');

const adminPage = text('public/admin/index.html');
const adminScript = text('public/admin/paint-ops-admin.js');

const netlifyConfig = text('netlify.toml');
const contentStoreLib = text('netlify/lib/_content.cjs');
const paintStoreLib = text('netlify/lib/_registry.cjs');
assert(netlifyConfig.includes('NODE_VERSION = "24"'), 'Admin backend deploy pins Node 24 for Functions/Blobs compatibility');
assert(netlifyConfig.includes('node_bundler = "esbuild"'), 'Admin backend functions use the esbuild bundler');
assert(contentStoreLib.includes("import('@netlify/blobs')") && paintStoreLib.includes("import('@netlify/blobs')"), 'Netlify Blobs loads lazily inside requests instead of crashing function startup');
const contentSyncScript = text('scripts/sync-admin-content.mjs');
assert(contentSyncScript.includes("url.searchParams.set('admin_sync'") && contentSyncScript.includes('if (configured) throw') && contentSyncScript.includes('Continuing with bundled/last-known content'), 'Automatic live-content sync cache-busts/retries without deadlocking repair deploys, while explicit sync tests still fail hard');
const adminFunction = text('netlify/lib/_paint-admin.cjs');
assert(adminPage.includes('Aetherwing Control Center') && adminPage.includes('Paint Operations'), 'Central Aetherwing Admin includes the live Paint Operations module');
assert(adminPage.includes('https://paint.aetherwing.net/'), 'Central Paint Operations links to the public Paint Booth');
assert(text('src/lib/site-content.mjs').includes("choose('leadership', leadershipSeed)") && text('src/lib/site-content.mjs').includes("choose('partners', partnersSeed)") && text('src/lib/site-content.mjs').includes("choose('driver-portfolios', driverPortfoliosSeed)"), 'Leadership, partners, and driver portfolios consume published Admin overlays');
assert(adminPage.includes('data-admin-dataset="schedule-events"') && adminPage.includes('data-admin-dataset="results"') && adminPage.includes('data-admin-dataset="drivers"') && adminPage.includes('data-admin-dataset="leadership"') && adminPage.includes('data-admin-dataset="partners"') && adminPage.includes('data-admin-dataset="driver-portfolios"') && adminPage.includes('data-admin-dataset="news"') && adminPage.includes('data-admin-paint-tab="add"') && adminPage.includes('/admin/content-admin.js'), 'Central admin exposes dedicated tabs for all routine site-management editors');
const partnersPage = text('src/pages/partners/index.astro');
assert(partnersPage.includes('driverPortfolios as portfolioSource') && partnersPage.includes("window.addEventListener('aetherwing:content'") && !partnersPage.includes('const otherPortfolios'), 'Partners page renders published driver portfolios immediately and in the next static build');
assert(text('public/admin/content-admin.js').includes('data-portfolio-logo-upload') && text('public/admin/content-admin.js').includes('uploadedLogoData'), 'Driver portfolio brand logos support direct URLs and optimized file uploads');
assert(adminScript.includes("roles.includes('admin') || roles.includes('paint-admin')"), 'Admin interface accepts the admin and paint-admin roles');
assert(!adminScript.includes('netlifyIdentity.init()'), 'Identity widget is not initialized twice');
assert(adminFunction.includes('context?.clientContext?.user') && adminFunction.includes("role === 'admin' || role === 'paint-admin'"), 'Paint publishing is protected by verified Netlify user roles');
assert(existsSync(resolve(root, 'netlify/functions/paint-data.mjs')) && existsSync(resolve(root, 'netlify/lib/_registry.cjs')), 'Main site contains the published paint registry functions');
assert(existsSync(resolve(root, 'data/paint-seed.json')) && existsSync(resolve(root, 'public/data/paint-seed.json')), 'Main site contains server and browser copies of the Paint Booth seed data');

assert(paintStoreLib.includes('function mergedPublishedPaints') && paintStoreLib.includes("source: 'seed-override'"), 'Published paint registry merges original paints with Admin overrides');
assert(adminScript.includes('function libraryPaints()') && adminScript.includes("_origin: 'seed'"), 'Paint Operations library exposes original paints for editing');
assert(adminPage.includes('name="scrAffiliate"') && adminScript.includes("data.get('scrAffiliate') === 'on'") && paintStoreLib.includes("paint.special?.includes('starclutch')"), 'Paint add/edit form persists an explicit SCR Affiliate flag and normalizes existing StarClutch paints');
assert(adminPage.includes('name="throwback"') && adminPage.includes('name="specialPaint"') && adminPage.includes('name="specialTags"'), 'Paint add/edit form exposes Throwback, Special Paint, and structured special-type controls');
assert(adminScript.includes("data.get('throwback') === 'on'") && adminScript.includes("data.get('specialPaint') === 'on'") && adminScript.includes("data.getAll('specialTags')"), 'Paint Operations saves expanded paint classifications');
assert(paintStoreLib.includes('throwback') && paintStoreLib.includes('specialPaint') && paintStoreLib.includes("'crownjewel'") && paintStoreLib.includes("'championship'"), 'Published registry normalizes expanded paint classifications');
assert(adminScript.includes('slugField.readOnly = editingSeed') && adminFunction.includes('share slug is locked for pre-existing paints'), 'Original paint edits preserve their existing share slugs');
assert(adminFunction.includes("source: editingSeed ? 'seed-override' : 'admin'"), 'Original-paint edits save as non-destructive overrides');
assert(text('src/layouts/BaseLayout.astro').includes('location.replace(`/admin/${hash}`)'), 'Identity email tokens route into the central admin');
assert(text('src/layouts/BaseLayout.astro').includes("params.get('season') === 'summer-end'") && text('src/layouts/BaseLayout.astro').includes("Number(eastern.day) <= 24") && text('src/styles/global.css').includes("html[data-season=\"summer-end\"] .aw-summers-end"), 'Summer’s End overlay runs September 18–24 Eastern with a manual preview switch');
assert(adminScript.includes('AUTO_LOGIN') && adminScript.includes("window.netlifyIdentity.open('login')"), 'Admin login convenience route can auto-open the secure sign-in dialog');
const contentAdminScript = text('public/admin/content-admin.js');
const controlCenterCss = text('public/admin/control-center.css');
assert(adminPage.includes('data-schedule-shift') && adminPage.includes('data-shift-preview="-7"') && adminPage.includes('data-shift-preview="7"'), 'Schedule Manager includes one-week earlier/later bulk shift controls');
assert(contentAdminScript.includes('function previewScheduleShift(days)') && contentAdminScript.includes('function applyScheduleShift()') && contentAdminScript.includes('function undoScheduleShift()'), 'Schedule Manager bulk shift supports preview, apply, and undo');
assert(contentAdminScript.includes('function autoPlaceScheduleEvents()') && contentAdminScript.includes("key==='schedule-events'?'Add race'") && contentAdminScript.includes("key==='results'?'Choose race above'"), 'Schedule Manager adds races with automatic chronological placement');
assert(contentAdminScript.includes('scheduleTimeMinutes') && contentStoreLib.includes('compareScheduleEvents') && schedulePage.includes('.sort(compareScheduleEvents)'), 'Admin, backend, and public Schedule share date/time/league ordering behavior');
assert(contentAdminScript.includes("event.league===league&&event.date&&String(event.date)>=String(start.date)") && contentAdminScript.includes('event.endDate=shiftIsoDate(event.endDate,days)'), 'Bulk week shift affects only the selected series from the chosen event forward and preserves multi-day windows');
assert(contentAdminScript.includes('Use Publish current changes when the dates look right.') && contentAdminScript.includes("['saveDraft','publish'].includes(name)?{data}"), 'Bulk week shift can publish current unsaved Calendar changes without a separate draft save');
assert(controlCenterCss.includes('v0.4.45 — Schedule Manager bulk week-shift controls') && controlCenterCss.includes('@media(max-width:640px)'), 'Bulk schedule controls include mobile layout treatment');

const redirects = text('public/_redirects');
assert(/^\/admin\s+\/admin\/\s+301/m.test(redirects), 'Bare /admin canonicalizes to /admin/');
assert(/^\/admin\/login\/?\s+\/admin\/\?login=1\s+302/m.test(redirects), 'Admin login convenience route opens the canonical control center');
assert(/^\/updates\s+\/news\s+301/m.test(redirects), 'Legacy /updates route redirects to /news');
for (const story of news) {
  const escaped = story.legacyRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert(new RegExp(`^${escaped}\\s+\\/news\\/${story.slug}\\s+301`, 'm').test(redirects), `Legacy story redirects: ${story.slug}`);
}

if (process.exitCode) {
  console.error('\nAetherwing data validation failed. Fix locked facts before building.');
  process.exit(process.exitCode);
}

// v0.4.25 regression guards
const homePage = text('src/pages/index.astro');
assert(schedulePage.includes('SEP 15') && schedulePage.includes('September 15, 2026'), 'Schedule review stamp is September 15, 2026');
assert(schedulePage.includes('function selectPrimaryOperation') && schedulePage.includes("event.league === 'iracing'"), 'Schedule Next Operation uses fixed-race priority over active iRacing windows');
assert(schedulePage.includes('applyLeagueSelection(requested)'), 'UARL division subfilters activate their parent filter');
assert(driversPage.includes('data-filter="UARL Open"'), 'Drivers page includes UARL Open filter');
assert(driversPage.includes("'UARL Open':'uarl-open'") && driversPage.includes('Series number'), 'Drivers filters use series-specific numbers, including Hailey #28 for UARL Open');
assert(homePage.includes('story.featured') && homePage.includes('Read the Story'), 'Homepage Latest Updates follows the featured Southern 500 story');
assert(homePage.includes('/Daytona 500/i.test(event.title)') && !homePage.includes('uarl-d2'), 'Homepage initial UARL fallback follows the active D1 Daytona 500 rather than closed D2');
const darlingtonStory = news.find((story) => story.slug === 'wispy-southern-500-darlington-top-five');
assert(darlingtonStory?.category === 'Race & Competition' && darlingtonStory?.featured === true, 'Darlington Southern 500 story is featured under Race & Competition');
assert(darlingtonStory?.metrics?.some((metric) => metric.label === 'Finish' && metric.value === 'P5'), 'Darlington story records the P5 finish');
assert(darlingtonStory?.metrics?.some((metric) => metric.label === 'Stage Points' && metric.value === '0'), 'Darlington story records zero stage points');
assert(darlingtonStory?.metrics?.some((metric) => metric.label === 'Standings' && metric.value === 'P6') && darlingtonStory?.metrics?.some((metric) => metric.label === 'Points' && metric.value === '2,087'), 'Darlington story matches the current P6 / 2,087-point Chase snapshot');
assert(darlingtonStory?.quote?.text?.includes('keep racing'), 'Darlington story preserves Wispy’s frustrated-but-still-fighting perspective');
const chaseStory = news.find((story) => story.slug === 'wispy-clinches-nrrs-s3-chase-martinsville');
assert(chaseStory?.category === 'Race & Competition', 'Martinsville Chase-clinch story uses Race & Competition category');
// v0.4.26 mobile Schedule cockpit guards
const scheduleCss = text('src/styles/pages/schedule.css');
assert(scheduleCss.includes('.aw-subfilter-row[hidden]{display:none!important}'), 'Schedule CSS forces hidden UARL subfilters off on Safari/mobile');
assert(scheduleCss.includes('v0.4.26 — compact mobile schedule filter cockpit'), 'Schedule includes compact mobile filter cockpit overrides');
assert(schedulePage.includes("compact ? '⧉ COPY LINK'"), 'Mobile league-share control uses compact copy-link text');
// v0.4.27 UARL D2 Daytona postponement guard
assert(schedulePage.includes("kind:'postponed',label:'Postponed'"), 'Schedule renders a Postponed criteria badge when an event is rescheduled');

assert(driverProfiles.find((profile) => profile.slug === 'wispy')?.iracingName === 'Hailey Bell', 'Current iRacing name is Hailey Bell');
assert(wins.filter((win) => win.league === 'iRacing' && win.driver === 'Nicholas Waggoner').length === 3, 'Historical iRacing wins recorded under Nicholas Waggoner retain that attribution');
assert(paintLeagues.find((league) => league.id === 'uarl-d2')?.relationship === 'archive', 'UARL D2 Paint Booth data is historical/archive only');
assert(paintLeagues.find((league) => league.id === 'nrrs')?.drivers.length === 4, 'NRRS Paint Booth charter board has four actual slots');
assert(paintLeagues.find((league) => league.id === 'uarl-d1')?.drivers.length === 6, 'UARL D1 Paint Booth charter board has six actual slots');
assert(!driversPage.includes('Wispy / Hailey Bell') && !driversPage.includes('Hailey Bell / Wispy'), 'Current iRacing presentation does not pair Wispy with Hailey Bell');
assert(contentAdminScript.includes('Driver league assignments') && contentAdminScript.includes('data-competition-choice') && contentAdminScript.includes("['competitions','League details']"), 'Roster Manager exposes clear driver league assignments and editable league details');
assert(text('netlify/lib/_content.cjs').includes("'competitions'"), 'League details are included in the Admin content registry');
assert(contentAdminScript.includes('data-standing-drag') && contentAdminScript.includes('data-standing-highlight') && contentAdminScript.includes('data-standing-move'), 'Standings Admin supports drag reorder, move controls, and driver highlight toggles');
assert(contentAdminScript.includes('openCharters') && contentAdminScript.includes('Number identities / uses') && contentAdminScript.includes('migrateCharters'), 'Charter Admin supports configurable Open Charters, arbitrary number identities, and migration from the previous schema');
assert(text('netlify/lib/_content.cjs').includes('Every active Open Charter needs at least one active number identity'), 'Server validates flexible Open Charter structures');
assert(schedulePage.includes('is-highlighted') && scheduleCss.includes('.aw-standings-row.is-highlighted'), 'Public standings render Admin-controlled Aetherwing driver highlighting');
assert(schedulePage.includes("fetch(`/api/site-content?runtime=${Date.now()}`") && schedulePage.includes("published?.datasets?.['schedule-events']") && schedulePage.includes('renderPublishedList(scheduleEvents)'), 'Public Schedule loads and renders the authoritative published Admin calendar at page view time');
assert(schedulePage.includes('bundledSlugs.has(slug)') && schedulePage.includes('/schedule/#event-${encodeURIComponent(slug)}'), 'Live-only schedule dates receive working hash share links before a static social-card rebuild');

assert(roster.find((profile) => profile.slug === 'wispy')?.name === 'Hailey', 'Current Roblox / RoRacing display name is Hailey');
assert(roster.find((profile) => profile.slug === 'wispy')?.handle === '@Aokikoto', 'Current Roblox username remains @Aokikoto');
assert(drivers.filter((entry) => entry.profile === 'wispy' && entry.competitionId !== 'iracing-factory').every((entry) => entry.displayName === 'Hailey'), 'All current RoRacing assignments display Hailey');
assert(drivers.find((entry) => entry.competitionId === 'iracing-factory' && entry.profile === 'wispy')?.displayName === 'Hailey Bell', 'iRacing assignment displays Hailey Bell only');
assert(wins.some((win) => win.driver === 'Wispy'), 'Historical RoRacing wins recorded under Wispy remain historical');
console.log('\nAetherwing locked-fact validation passed.');
