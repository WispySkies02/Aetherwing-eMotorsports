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


assert(news.length === 10, 'News archive matches the current 10-story Team Wire');
assert(new Set(news.map((story) => story.slug)).size === news.length, 'All Team Wire story slugs are unique');
assert(news.filter((story) => story.category === 'Race & Competition').length === 5, 'Team Wire contains five Race & Competition stories');
assert(news.filter((story) => story.category === 'Milestones').length === 3, 'Team Wire contains three Milestones stories');
assert(news.filter((story) => story.category === 'Team & Organization').length === 2, 'Team Wire contains two Team & Organization stories');
assert(news.some((story) => story.featured && story.slug === 'wispy-clinches-nrrs-s3-chase-martinsville'), 'Martinsville Chase clinch remains the Team Wire headline');
assert(news.some((story) => story.slug === 'wispy-100th-roracing-start-talladega'), '100th RoRacing start story is migrated');
assert(news.some((story) => story.slug === 'aetherwing-ngm-driver-development'), 'NGM Driver Development story is migrated');
assert(news.every((story) => Array.isArray(story.sections) && story.sections.length >= 3), 'Every Team Wire story has a full article body');

assert(site.competitionRelationships === 7, 'Seven competition relationships');
assert(site.featuredPartners === 2 && partners.filter((p) => p.featured).length === 2, 'Exactly two featured partners');
assert(site.verifiedWins === 27 && wins.length === 27, '27 verified Aetherwing wins and 27 history rows');
assert(site.activeRoRacingDrivers === 10 && roster.length === 10, 'Ten current RoRacing driver profiles');
assert(site.aetherwingDrivers === 5 && site.allianceOnlyDrivers === 5, 'Drivers split is five Aetherwing / five alliance-only');
assert(competitions.length === 7, 'Competition data contains seven relationships');
assert(competitions.filter((c) => c.type === 'aetherwing').length === 5, 'Five Aetherwing programs');
assert(competitions.filter((c) => c.type === 'alliance').length === 2, 'Two StarClutch Racing Alliance series');
assert(!competitions.some((c) => /flo/i.test(c.name)), 'FloRacing remains intentionally absent');
assert(!leadership.some((p) => /trent/i.test(p.name)), 'Trent is absent from current leadership');
assert(!leadership.some((p) => p.roles.some((r) => /co-owner|co-founder/i.test(r))), 'No Co-Owner/Co-Founder role in current leadership');
assert(leadership.some((p) => p.name === 'Callornot' && p.roles.includes('Team Principal')), 'Callornot is Team Principal');

const results = json('results.json');
const latestResult = results.latestResult;
assert(latestResult?.title === 'Pepsi 400' && latestResult?.start === 7 && latestResult?.stage2?.finish === 4 && latestResult?.finish === 4, 'Latest NRRS result is Pepsi 400: P7 start, P4 Stage 2, P4 finish');

const d2 = schedule.find((event) => event.id === 'uarl-d2');
assert(d2?.day === 1 && d2?.time === '18:45', 'Recurring UARL D2 time locked to Monday 6:45 PM ET');
const d2Event = scheduleEvents.find((event) => event.league === 'uarl-d2' && event.date === '2026-09-14');
assert(d2Event?.time === '6:45 PM ET' && /Daytona 250/i.test(d2Event?.title || ''), 'September 14 UARL D2 Daytona event remains 6:45 PM ET');
const pepsi400 = scheduleEvents.find((event) => event.league === 'nrrs' && event.title === 'Pepsi 400');
assert(pepsi400?.round === 'ROUND 19' && pepsi400?.specialTag === 'REGULAR SEASON FINALE', 'NRRS Pepsi 400 is Round 19 and the Regular Season Finale');
const nrrsSouthern500 = scheduleEvents.find((event) => event.league === 'nrrs' && event.title === 'Southern 500' && event.round === 'ROUND 20');
const nrrsFord400 = scheduleEvents.find((event) => event.league === 'nrrs' && event.title === 'Ford 400' && event.round === 'ROUND 25');
assert(nrrsSouthern500?.date === '2026-09-15' && nrrsSouthern500?.status === 'The Chase', 'NRRS Chase begins at Darlington on September 15');
assert(nrrsFord400?.date === '2026-10-20' && nrrsFord400?.status === 'Championship', 'NRRS Championship finale is Ford 400 on October 20');
assert(scheduleEvents.filter((event) => event.league === 'nrrs' && event.status === 'The Chase').length === 5, 'NRRS has five The Chase races before the Championship finale');
const nrrsStanding = standings.find((series) => series.id === 'nrrs');
const kmartStanding = standings.find((series) => series.id === 'kmart');
const sunocoStanding = standings.find((series) => series.id === 'sunoco');
const uarlStanding = standings.find((series) => series.id === 'uarl');
assert(nrrsStanding?.rows?.[0]?.driver === 'Wispy' && nrrsStanding.rows[0].position === 'P5' && nrrsStanding.rows[0].points === 2055 && nrrsStanding.rows[0].delta === '-45', 'NRRS Chase standings snapshot: Wispy P5, 2,055 points, -45');
assert(kmartStanding?.rows?.length === 3 && kmartStanding.rows[0].driver === 'Jaxon' && kmartStanding.rows[0].position === 'P1' && kmartStanding.rows[1].driver === 'Will' && kmartStanding.rows[1].position === 'P2' && kmartStanding.rows[2].driver === 'Wispy' && kmartStanding.rows[2].position === 'P4', 'Kmart standings positions: Jaxon P1, Will P2, Wispy P4');
assert(kmartStanding?.ptEntry?.number === '29' && kmartStanding.ptEntry.status === 'NOT CHASE ELIGIBLE' && kmartStanding.ptEntry.drivers?.[0]?.driver === 'Clutch' && kmartStanding.ptEntry.drivers[0].points === 135 && kmartStanding.ptEntry.drivers[1].driver === 'Eazy' && kmartStanding.ptEntry.drivers[1].points === 59 && kmartStanding.ptEntry.drivers[2].driver === 'Matty' && kmartStanding.ptEntry.drivers[2].points === 58, 'Kmart #29 SCR PT car points and Chase ineligibility');
assert(sunocoStanding?.rows?.length === 4 && sunocoStanding.rows[0].driver === 'Will' && sunocoStanding.rows[0].position === 'P1' && sunocoStanding.rows[0].chaseStatus === 'CHASE' && sunocoStanding.rows[1].driver === 'Clutch' && sunocoStanding.rows[1].position === 'P2' && sunocoStanding.rows[1].chaseStatus === 'CHASE' && sunocoStanding.rows[2].driver === 'Eazy' && sunocoStanding.rows[2].position === 'P4' && sunocoStanding.rows[2].chaseStatus === 'CHASE' && sunocoStanding.rows[3].driver === 'Wispy' && sunocoStanding.rows[3].position === 'P10' && sunocoStanding.rows[3].chaseStatus === 'NOT IN CHASE', 'Sunoco positions and Chase status: Will P1, Clutch P2, Eazy P4, Wispy P10');
assert(uarlStanding?.rows?.length === 0 && /Awaiting the start of Season 6/i.test(uarlStanding?.emptyMessage || ''), 'UARL standings remain awaiting Season 6');

const nrrsClash = scheduleEvents.find((event) => event.league === 'nrrs' && /Clash at the Coliseum/i.test(event.title));
const nrrsAllStar = scheduleEvents.find((event) => event.league === 'nrrs' && /All-Star Race/i.test(event.title));
assert(!nrrsClash?.round && !nrrsAllStar?.round, 'NRRS Clash and All-Star are excluded from round numbering');
const uarlD1Rounds = scheduleEvents.filter((event) => event.league === 'uarl-d1' && event.round).map((event) => event.round);
assert(uarlD1Rounds.length === 18 && uarlD1Rounds[0] === 'ROUND 1' && uarlD1Rounds.at(-1) === 'ROUND 18', 'UARL D1 countable schedule runs Round 1 through Round 18');
const uarlD1Clash = scheduleEvents.find((event) => event.league === 'uarl-d1' && /Bean Clash/i.test(event.title));
const uarlD1AllStar = scheduleEvents.find((event) => event.league === 'uarl-d1' && /All-Star Race/i.test(event.title));
assert(!uarlD1Clash?.round && !uarlD1AllStar?.round, 'UARL D1 Clash and All-Star are excluded from round numbering');
assert(scheduleEvents.filter((event) => event.league === 'uarl-d2' && event.round).length === 18, 'UARL D2 is numbered across 18 rounds');
assert(scheduleEvents.filter((event) => event.league === 'open' && event.round).length === 12, 'UARL Open is numbered across 12 rounds');
assert(scheduleEvents.some((event) => event.league === 'uarl-d1' && event.title === 'Queen City 500' && event.specialTag === 'CROWN JEWEL'), 'UARL D1 Queen City 500 is a Crown Jewel');
assert(scheduleEvents.some((event) => event.league === 'kmart' && event.title === 'Goodyear Southern 300' && event.specialTag === 'CROWN JEWEL'), 'Kmart Goodyear Southern 300 is a Crown Jewel');
assert(scheduleEvents.some((event) => event.league === 'kmart' && event.title === 'WeatherTech Championship 300' && event.status === 'Championship'), 'Kmart finale is the Championship');

assert(scheduleEvents.filter((event) => event.league !== 'iracing' && !event.offWeek).length === 126, 'Full source contains 126 season races');
assert(scheduleEvents.filter((event) => event.league === 'iracing').length === 16, 'Full source contains 16 iRacing special-event windows');
assert(scheduleEvents.length === 143, 'Complete schedule source contains 143 calendar entries including specials/off-week');
assert(scheduleEvents.some((event) => event.league === 'iracing' && event.title === 'Southern 500' && event.endDate === '2026-09-07'), 'iRacing Southern 500 is a multi-day event window');
assert(scheduleEvents.some((event) => event.title === 'Suzuka 1000km' && event.endDate === '2026-09-15'), 'Suzuka 1000km is represented as a multi-day event window');
assert(Object.keys(tracks.locations || {}).length >= 60, 'Schedule retains track-location weather mapping');
assert(tracks.aliases?.Michigan === 'Michigan International Speedway', 'Kmart Michigan weather alias resolves correctly');
assert(tracks.aliases?.Portland === 'Portland International Raceway', 'Kmart Portland weather alias resolves correctly');
assert(tracks.aliases?.Silverstone === 'Silverstone Circuit', 'Silverstone weather alias resolves correctly');
const unresolvedWeatherTracks = [...new Set(scheduleEvents.filter((event) => !event.offWeek && event.track && event.track !== 'No race scheduled').map((event) => event.track))].filter((track) => !(tracks.locations?.[tracks.aliases?.[track] || track]));
assert(unresolvedWeatherTracks.length === 0, `All scheduled track names resolve to weather locations${unresolvedWeatherTracks.length ? ': ' + unresolvedWeatherTracks.join(', ') : ''}`);

const wispyIRacing = drivers.find((d) => d.id === 'nicholas-iracing');
assert(wispyIRacing?.displayName === 'Nicholas Waggoner' && wispyIRacing?.profile === 'wispy', 'Nicholas Waggoner resolves to Wispy profile for iRacing');
assert(iracing.factoryDrivers === 3 && iracing.teamEntries === 1 && iracing.schemes === 13, 'iRacing garage totals are 03 drivers / 01 team entry / 13 schemes');
assert(paintLeagues.length === 7, 'Paint Booth source contains all seven garages');
assert(paints.length === 35, 'Paint Booth source contains all 35 uploaded schemes');
assert(paints.filter((paint) => paint.leagues?.includes('iracing')).length === 13, 'Paint Booth contains 13 iRacing liveries');
assert(paints.filter((paint) => paint.driver === 'Wispy').length === 21, 'Paint Booth contains all 21 direct Wispy paints from V23');
assert(paints.filter((paint) => paint.driver === 'Nicholas Waggoner').length === 12, 'Paint Booth contains all 12 Nicholas Waggoner iRacing paints tied to the Wispy identity');
assert(paints.filter((paint) => ['Wispy','Nicholas Waggoner'].includes(paint.driver)).length === 33, 'Wispy identity exposes 33 paints across RoRacing and iRacing');
assert(paints.filter((paint) => paint.leagues?.includes('nrrs')).length === 9, 'NRRS garage contains 9 source paints');
assert(paints.filter((paint) => paint.leagues?.includes('uarl-d1')).length === 1, 'UARL D1 garage contains the source-tagged Mobil 1 paint');
assert(paints.filter((paint) => paint.leagues?.includes('uarl-d2')).length === 2, 'UARL D2 garage contains both source-tagged paints');
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
assert(schedulePage.includes('Championship Tracker') && schedulePage.includes('WISPY IS IN THE CHASE'), 'Schedule surfaces current standings and NRRS Chase status');
assert(schedulePage.includes('eventCriteria') && schedulePage.includes('Crown Jewel') && schedulePage.includes('Dash4Cash') && schedulePage.includes('Regular Season Finale') && schedulePage.includes("label:'Clash'"), 'Schedule includes semantic special-criteria tags');
assert(schedulePage.includes('data-event-share') && schedulePage.includes('revealEventHash'), 'Schedule includes share buttons and exact event deep-link reveal logic');
assert(existsSync(resolve(root, 'src/pages/event/[slug].astro')), 'Static share route exists for schedule events');
const eventShareRoute = text('src/pages/event/[slug].astro');
assert(eventShareRoute.includes('/images/social/events/${event.shareSlug}-v47.jpg'), 'Schedule event shares use cache-busted v47 event-specific image cards');
assert(eventShareRoute.includes('og:title') && eventShareRoute.includes('&#8203;') && !eventShareRoute.includes('og:description'), 'Schedule event embeds suppress visible Discord title/description text');
assert(!eventShareRoute.includes('http-equiv="refresh"'), 'Schedule event share crawler pages do not meta-refresh away from their OG image');
assert(schedulePage.includes('applyLeagueSelection(target.league)'), 'Shared schedule events open with their own league filter selected');
assert(scheduleEvents.every((event) => existsSync(resolve(root, 'public/images/social/events', `${eventSlugForValidation(event)}-v47.jpg`))), 'All 143 schedule events have v47 share-card images');
assert(paintPage.includes('https://paint.aetherwing.net/') && paintPage.includes("location.replace(target)"), 'Legacy main-site Paint Booth route bridges to the canonical paint subdomain');
assert(paintPage.includes("#paint-") && paintPage.includes('encodeURIComponent(slug)'), 'Legacy Paint Booth hash links preserve the selected paint slug');
const siteHeader = text('src/components/global/SiteHeader.astro');
const siteFooter = text('src/components/global/SiteFooter.astro');
assert(siteHeader.includes("['Paint Booth','https://paint.aetherwing.net/']"), 'Header links directly to the canonical Paint Booth subdomain');
assert(siteFooter.includes('href="https://paint.aetherwing.net/"'), 'Footer links directly to the canonical Paint Booth subdomain');
const navigation = json('navigation.json');
assert(navigation.some((item) => item.label === 'Paint Booth' && item.href === 'https://paint.aetherwing.net/'), 'Navigation data uses the canonical Paint Booth subdomain');
const baseLayout = text('src/layouts/BaseLayout.astro');
assert(baseLayout.includes('preconnect" href="https://i.ibb.co'), 'Global shell preconnects to the paint image host');
const driversPage = text('src/pages/drivers/index.astro');
assert(driversPage.includes('aw-driver-num') && driversPage.includes('numberParts'), 'Drivers page uses split multi-number rendering for Wispy and other multi-program drivers');


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

const redirects = text('public/_redirects');
assert(/^\/updates\s+\/news\s+301/m.test(redirects), 'Legacy /updates route redirects to /news');
for (const story of news) {
  const escaped = story.legacyRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert(new RegExp(`^${escaped}\\s+\\/news\\/${story.slug}\\s+301`, 'm').test(redirects), `Legacy story redirects: ${story.slug}`);
}

if (process.exitCode) {
  console.error('\nAetherwing data validation failed. Fix locked facts before building.');
  process.exit(process.exitCode);
}
console.log('\nAetherwing locked-fact validation passed.');
