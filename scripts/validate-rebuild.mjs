import { existsSync,readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname,resolve } from 'node:path';

// Always validate from the project root, even if Netlify invokes the build
// from a different working directory.
const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(projectRoot);
const needed=['src/pages/mission-values/index.astro','src/pages/team-handbook/index.astro','src/pages/index.astro','src/pages/schedule/index.astro','src/pages/drivers/index.astro','src/pages/championships/index.astro','src/pages/paint-booth/index.astro','src/pages/partners/index.astro','src/pages/news/index.astro','src/pages/history/index.astro','src/pages/event/[slug].astro','src/pages/programs/index.astro','public/images/textures/aetherwing-editorial.webp','public/seasonal-theme.js','public/admin/index.html','public/admin/theme-preview.js'];
for(const file of needed)if(!existsSync(file))throw Error(`Missing site asset: ${file}`);
for(const name of ['schedule-events','drivers','charters','results','standings','driver-portfolios','partners','paints','news']){const content=JSON.parse(readFileSync(`src/data/${name}.json`,'utf8'));if(!Array.isArray(content)||!content.length)throw Error(`Empty or invalid ${name} dataset`);}
const standings=JSON.parse(readFileSync('src/data/standings.json','utf8'));
const kmart=standings.find((board)=>board.id==='kmart');
if(!kmart||!Array.isArray(kmart.rows)||kmart.rows.length<17)throw Error('Kmart standings must include the full 17-driver grid.');
if(kmart.cutoffAfter!==6)throw Error('Kmart Chase cutoff must remain after P6.');
if(!Array.isArray(kmart.ptEntry?.drivers)||kmart.ptEntry.drivers.length<3)throw Error('Kmart standings must include all three part-time ineligible drivers.');

const drivers=JSON.parse(readFileSync('src/data/drivers.json','utf8'));
const kmart29=drivers.filter((driver)=>driver.competitionId==='kmart'&&String(driver.number)==='29');
if(kmart29.length!==3||!['Clutch','Eazy','Matty'].every((name)=>kmart29.some((driver)=>driver.displayName===name)))throw Error('Kmart #29 must remain three driver-specific part-time assignments.');
const charters=JSON.parse(readFileSync('src/data/charters.json','utf8'));
if(charters.some((board)=>(board.fullTime||[]).some((slot)=>!Object.hasOwn(slot,'numberImage'))||(board.openCharters||[]).some((charter)=>(charter.uses||[]).some((use)=>!Object.hasOwn(use,'numberImage')))))throw Error('Charter number identities must keep editable numberImage fields.');
const profileSource=readFileSync('src/pages/drivers/[slug].astro','utf8');
if(!profileSource.includes("d['driver-portfolios']")||!profileSource.includes('data-profile-partners'))throw Error('Driver profiles must stay synchronized with live Driver Portfolios.');
const lineupSource=readFileSync('src/components/DriverLineup.astro','utf8');
if(!lineupSource.includes("alliance=e.affiliation==='alliance'")||!lineupSource.includes('STARCLUTCH RACING'))throw Error('Driver Lineup must retain partner-team roster support.');
if(!lineupSource.includes('const groupedDrivers=')||!lineupSource.includes('ONE CARD EACH')||!lineupSource.includes('aw-lineup__summary-rides'))throw Error('Driver Lineup ALL filter must group league assignments into one card per driver.');
if(!lineupSource.includes('chooseDriverArt')||!lineupSource.includes('uploadedByNumber')||!lineupSource.includes('Math.random()')||!lineupSource.includes('artCorrections'))throw Error('Driver Lineup must retain single-number normalization and randomized uploaded-art selection.');
const lineupCss=readFileSync('src/styles/driver-lineup.css','utf8');
if(!lineupCss.includes('v1.1.45 — shared hard boundary between card art and information panel')||!lineupCss.includes('grid-template-rows:minmax(0,1fr) auto')||!lineupCss.includes('height:220px'))throw Error('Driver cards must retain the v1.1.45 hard art/panel boundary and 220px mobile art stage.');
if(!lineupSource.includes('contentWidth')||!lineupSource.includes('contentHeight'))throw Error('Single-number fitting must use the padded artwork content box.');
const eventSource=readFileSync('src/pages/event/[slug].astro','utf8');
const adminContentSource=readFileSync('public/admin/content-admin.js','utf8');
if(!adminContentSource.includes('data-signature-upload-status')||!adminContentSource.includes('Math.pow(.84,pass)'))throw Error('Driver Directory signature upload must retain progressive downscale fallback and inline upload feedback.');
if(!lineupSource.includes('data-backup-src')||!lineupSource.includes('e.numberImageBackup||e.numberImage')||!adminContentSource.includes('numberImageBackup')||!adminContentSource.includes('public primary'))throw Error('Driver number uploads must remain the public primary source with a secondary URL fallback.');
if(!lineupSource.includes('sharedKmart29')||!lineupSource.includes('chooseDriverArt')||!adminContentSource.includes('syncSharedKmart29Art'))throw Error('Kmart #29 artwork must synchronize across Clutch/Eazy/Matty and remain eligible for ALL-card randomized art selection.');
if(!lineupSource.includes('const src=ride.numberImageBackup||ride.numberImage')||!lineupSource.includes('sessionStorage')||!lineupSource.includes('queue.shift()'))throw Error('ALL-card artwork pool must include every configured image source and cycle through a persistent randomized shuffle bag.');
if(!lineupSource.includes('const tightenNumber=')||!lineupSource.includes('data-short=')||!(adminContentSource.includes('probeScale=Math.min(1,1200/Math.max(1,image.naturalWidth),800/Math.max(1,image.naturalHeight))')||adminContentSource.includes('probeScale=Math.min(1,1600/Math.max(1,image.naturalWidth),1100/Math.max(1,image.naturalHeight))')))throw Error('Driver number artwork normalization/mobile stage safeguards are missing.');
if(!eventSource.includes("entryListMode==='custom'")||!eventSource.includes("status:'Raced'"))throw Error('Race Weekend pages must support custom event entry lists and result-driven Auto mode.');
if(!adminContentSource.includes('data-schedule-entry-driver-choice')||!adminContentSource.includes('data-event-entries-sync-result')||!adminContentSource.includes('Fill from league roster'))throw Error('Calendar Admin must retain event-specific entry list editing tools.');

const baseSource=readFileSync('src/layouts/Base.astro','utf8');
const seasonSource=readFileSync('public/seasonal-theme.js','utf8');
const adminHtml=readFileSync('public/admin/index.html','utf8');
const adminThemeSource=readFileSync('public/admin/theme-preview.js','utf8');
for(const id of ['summer-end','halloween-teaser','halloween','halloween-week','fall','christmas-teaser','christmas','christmas-week','calm-winter','new-year','clean-winter','valentine-teaser','valentine','late-winter','spring','st-patrick','easter','memorial-day','summer','independence-day'])if(!seasonSource.includes(`'${id}'`))throw Error(`Seasonal theme missing from controller: ${id}`);
if(!baseSource.includes('/seasonal-theme.js')||!baseSource.includes('data-season-banner'))throw Error('Base layout must load the automatic seasonal controller and shared banner.');
if(!adminHtml.includes('data-admin-tab="theme-preview"')||!adminHtml.includes('data-admin-theme-preview')||!adminHtml.includes('/admin/theme-preview.js'))throw Error('Admin Theme Preview tab must remain available.');
if(!adminThemeSource.includes('dataset.adminTheme')||adminThemeSource.includes('localStorage'))throw Error('Admin Theme Preview must remain temporary and must not persist to local storage.');

for(const id of ['palm-sunday','good-friday','easter-sunday','thanksgiving','christmas-eve','christmas-day'])if(!seasonSource.includes(`'${id}'`))throw Error(`Faith observance missing from seasonal controller: ${id}`);
if(!seasonSource.includes("motif:'thorns'")||!seasonSource.includes("motif:'empty-tomb'")||!seasonSource.includes("motif:'wheat'")||!seasonSource.includes("scene:'bethlehem'"))throw Error('Faith observances must retain story-driven visual motifs.');
if(!adminHtml.includes('data-theme-faith-banner')||!adminHtml.includes('data-observance="palm-sunday"'))throw Error('Admin Theme Preview must retain the faith verse banner and Palm Sunday preview.');
if(!adminThemeSource.includes('faithBanner')||!adminThemeSource.includes('HOSANNA IN THE HIGHEST'))throw Error('Admin faith preview banner logic is missing.');
if(existsSync('src/pages/schedule/share'))throw Error('Legacy share-only pages remain.');
console.log('Fresh routes, existing data, background, and admin source verified.');

// Full seasonal takeovers must replace the default Aetherwing editorial backdrop, including inside Theme Preview.
const siteCss=readFileSync('src/styles/site.css','utf8');
const adminCss=readFileSync('public/admin/fresh-admin.css','utf8');
for(const theme of ['halloween','halloween-week','fall','christmas','christmas-week','calm-winter','clean-winter','valentine','spring','easter','new-year','independence-day']){
  const publicRule=siteCss.match(new RegExp(`html\\[data-season=\\"${theme}\\"\\][^{]*\\{--site-bg-art:([^}]*)`))?.[1]||'';
  const adminRule=adminCss.match(new RegExp(`html\\[data-admin-theme=\\"${theme}\\"\\][^{]*\\{--preview-bg-art:([^}]*)`))?.[1]||'';
  if(!publicRule||publicRule.includes('aetherwing-editorial.webp'))throw Error(`Full takeover ${theme} must replace the public editorial background.`);
  if(!adminRule||adminRule.includes('aetherwing-editorial.webp'))throw Error(`Theme Preview ${theme} must replace the admin editorial background.`);
}
for(const file of ['src/styles/home.css','src/styles/records.css','src/styles/race-calendar.css']){
  const css=readFileSync(file,'utf8');
  if(css.includes("url('/images/textures/aetherwing-editorial.webp')"))throw Error(`${file} still hard-codes the editorial image instead of using --site-bg-art.`);
}

// v1.1.29 — results/standings automation regressions.
const scheduleEvents=JSON.parse(readFileSync('src/data/schedule-events.json','utf8'));
const r21=scheduleEvents.find((event)=>event.league==='nrrs'&&event.date==='2026-09-22');
if(!r21||r21.track!=='North Wilkesboro Speedway'||!/North Wilkesboro/i.test(r21.title))throw Error('NRRS Race 21 must remain North Wilkesboro on Sep 22, 2026.');
if(scheduleEvents.some((event)=>event.league==='uarl-d2'))throw Error('Closed UARL D2 must stay off the active schedule.');
const results=JSON.parse(readFileSync('src/data/results.json','utf8'));
const northWilkesboro=results.find((race)=>race.league==='nrrs'&&race.date==='2026-09-22');
if(!northWilkesboro||northWilkesboro.entries?.length<7||Number(northWilkesboro.entries.find((e)=>e.driver==='Trent')?.racePoints)!==58)throw Error('Corrected North Wilkesboro Race 21 result is missing.');
if(!results.some((race)=>race.league==='uarl-d2'&&race.date==='2026-09-12'))throw Error('Closed UARL D2 Daytona result must remain in History data.');
if(results[0]?.featured!==true||results.slice(1).some((race)=>race.featured))throw Error('Latest Result must be automatic: newest result only.');
const nrrs=standings.find((board)=>board.id==='nrrs');
if(!nrrs||nrrs.autoPoints!==true||nrrs.lastResultDate!=='2026-09-22')throw Error('NRRS standings must retain automatic result-point advancement metadata.');
if(nrrs.rows?.[0]?.driver!=='Will'||Number(nrrs.rows?.[0]?.points)!==2195)throw Error('Corrected Race 21 NRRS leader must be Will with 2,195 points.');
const hailey=nrrs.rows?.find((row)=>row.driver==='Hailey');
if(!hailey||Number(hailey.points)!==2087||hailey.delta!=='-108')throw Error('Hailey Race 21 standings must be P6, 2,087 points, -108.');
if(!adminContentSource.includes('data-standings-import-text')||!adminContentSource.includes('Apply waiting race points')||!adminContentSource.includes('External / unrostered participant'))throw Error('Admin must retain standings import, automatic result points, and external result participants.');
if(!profileSource.includes('data-profile-identity')||!profileSource.includes("d['roster-profiles']")||!profileSource.includes("d['driver-profiles']"))throw Error('Driver profile identity/stat edits must stay live-synced.');
if(!adminContentSource.includes('data-partner-logo-upload'))throw Error('Team partner logo uploads must remain available in Admin.');
if(!adminContentSource.includes('data-signature-logo-upload')||!lineupSource.includes('aw-lineup__signature'))throw Error('Driver signature-logo uploads and public roster rendering are missing.');
if(!lineupSource.includes('fitNumberVisual')||!lineupSource.includes('targetArea=contentWidth*contentHeight'))throw Error('Driver number artwork must retain padded-box visible-area normalization.');
if(!adminContentSource.includes('uploadedSignatureData')||!adminContentSource.includes('probeCtx.getImageData')||!lineupSource.includes("${signature?'has-signature':''}")||!lineupSource.includes('tightenSignature'))throw Error('Driver signatures must use transparent-padding trimming and the prominent roster-card treatment.');

// v1.1.30 — Sep. 25 review closeout guards.
const raceCalendarSource=readFileSync('src/components/RaceCalendar.astro','utf8');
if(!raceCalendarSource.includes('const resultFor=')||!raceCalendarSource.includes('const completed=')||!raceCalendarSource.includes('!completed(e,now)'))throw Error('Race Calendar must treat a published result as completed immediately and roll to the next event.');
const contentStoreSource=readFileSync('netlify/lib/_content.cjs','utf8');
if(!contentStoreSource.includes('function scoreKnownRace')||!contentStoreSource.includes("league==='uarl-d1'")||!contentStoreSource.includes('stage1Points:stage1'))throw Error('Known NRRS/UARL D1 scoring must retain automatic stage-point calculation.');
if(!adminContentSource.includes('scoreKnownResult')||!adminContentSource.includes('Bonus / adjustment points')||!adminContentSource.includes('Championship points eligible'))throw Error('Results Admin must expose the automatic scoring controls for known points systems.');
const driverProfiles=JSON.parse(readFileSync('src/data/driver-profiles.json','utf8'));
const haileyProfile=driverProfiles.find((profile)=>profile.slug==='wispy');
const statMap=new Map((haileyProfile?.stats||[]).map((item)=>[item.label,item.value]));
if(statMap.get('iRacing Starts')!=='409'||statMap.get('Wins')!=='59'||statMap.get('Top Fives')!=='121'||statMap.get('Poles')!=='52'||statMap.get('Formula Win Rate')!=='14.1%')throw Error('Published iRacing figures changed from the reviewed 409/59/121/52/14.1% baseline.');
if(haileyProfile?.iracingName!=='Hailey Bell'||haileyProfile?.historicalIRacingName!=='Nicholas Waggoner')throw Error('Hailey Bell must remain the current iRacing identity with Nicholas Waggoner retained as the historical name.');
const wins=JSON.parse(readFileSync('src/data/wins.json','utf8'));if(wins.length!==27)throw Error('Verified History win count must remain 27 unless an actual qualifying win is added.');
const news=JSON.parse(readFileSync('src/data/news.json','utf8'));if(!news.some((story)=>story.dateIso==='2026-09-24'&&/North Wilkesboro/i.test(story.title)))throw Error('North Wilkesboro Chase Race 2 article is missing from Team Wire.');
const scheduleMeta=JSON.parse(readFileSync('src/data/schedule.json','utf8'));if(scheduleMeta.find((row)=>row.id==='uarl-d1')?.time!=='20:30')throw Error('UARL D1 weekly time must remain Sundays at 8:30 PM ET.');
if(!seasonSource.includes("'halloween-teaser'")||!seasonSource.includes('IN EVERY THING GIVE THANKS')||!seasonSource.includes('THIS IS THE DAY WHICH THE LORD HATH MADE')||!seasonSource.includes('HE IS NOT HERE: FOR HE IS RISEN'))throw Error('Seasonal controller must retain the Sep 25–30 Halloween teaser and reviewed KJV faith-banner wording.');
if(!raceCalendarSource.includes("e.detail?.['schedule-events']")||!raceCalendarSource.includes('setInterval(tick,1000)'))throw Error('Public/Home Race Calendar must consume live Admin schedule edits and keep countdown rollover active.');
const siteAdminSource=readFileSync('netlify/lib/_site-admin.cjs','utf8');
if(!siteAdminSource.includes('priorResults=[]')||!siteAdminSource.includes('apply only the point delta')||!siteAdminSource.includes('Corrected ${next.title'))throw Error('Republishing the latest result must adjust standings by the corrected point delta instead of double-counting or ignoring it.');
const partnersPageSource=readFileSync('src/pages/partners/index.astro','utf8');
const homeSource=readFileSync('src/pages/index.astro','utf8');
if(!partnersPageSource.includes('Array.isArray(d.partners)')||!partnersPageSource.includes('renderTeamPartners'))throw Error('Team partner edits must live-sync to the public Partners page without waiting for a rebuild.');
if(!homeSource.includes('data-home-partners')||!homeSource.includes('Array.isArray(d.partners)'))throw Error('Team partner edits must live-sync to the homepage partner strip.');
for(const boardId of ['nrrs','uarl-d1']){
  const board=charters.find((item)=>item.id===boardId);
  const shared=(board?.openCharters||[]).find((item)=>item.active!==false);
  const uses=(shared?.uses||[]).filter((item)=>item.active!==false);
  if(!shared||uses.length!==2||!['62','82'].every((number)=>uses.some((use)=>String(use.number)===number)))throw Error(`${boardId} must preserve #62 PT and #82 Development as two identities of one shared open charter.`);
  if(uses.some((use)=>Object.hasOwn(use,'driver')&&String(use.driver||'').trim()))throw Error(`${boardId} shared #62/#82 charter identities must not carry permanent driver assignments.`);
}
if(drivers.some((driver)=>driver.competitionId==='uarl-d2')||scheduleEvents.some((event)=>event.league==='uarl-d2'))throw Error('Closed UARL D2 must not reappear in active driver or schedule filters.');
const currentNumbers={
  'uarl-d1':new Set(drivers.filter((d)=>d.competitionId==='uarl-d1').map((d)=>String(d.number))),
  nrrs:new Set(drivers.filter((d)=>d.competitionId==='nrrs').map((d)=>String(d.number)))
};
if(currentNumbers['uarl-d1'].has('42')||currentNumbers['uarl-d1'].has('46')||currentNumbers['uarl-d1'].has('56')||currentNumbers.nrrs.has('42')||currentNumbers.nrrs.has('46')||currentNumbers.nrrs.has('56'))throw Error('Proposed next-season #42/#46/#56 numbers must stay out of the current roster until the season changes.');

// v1.1.31 — selected-board standings PNG export.
if(!adminContentSource.includes('data-standings-export')||!adminContentSource.includes('createStandingsPng')||!adminContentSource.includes('Save PNG')||!adminContentSource.includes('Open full size'))throw Error('Admin Standings must retain full selected-board PNG generation, preview, and save controls.');

// v1.1.34 — standings manufacturer icons + league-specific Dodge/RAM assets.
if(!adminContentSource.includes('NRRS TOWN FAIR TIRE CUP SERIES')||!adminContentSource.includes('NASCAR KMART AUTO PARTS SERIES')||!adminContentSource.includes('NASCAR SUNOCO TRUCK SERIES')||!adminContentSource.includes('UARL L.L. BEAN CUP SERIES')||!adminContentSource.includes('UARL BANGOR SAVINGS BANK LATE MODEL SERIES'))throw Error('Standings PNG league title branding is incomplete.');
if(!adminContentSource.includes('standingsManufacturerByNumber')||!adminContentSource.includes('latestStandingResultEntry')||!adminContentSource.includes('standingManufacturer'))throw Error('Standings PNG manufacturer mapping/latest-result logic is missing.');
if(!adminContentSource.includes('board?.chaseActive!==true')||adminContentSource.includes('const highlighted=Boolean(row.highlight)'))throw Error('Standings PNG must highlight Chase drivers only when the board is actively in the Chase.');
if(adminContentSource.includes('AETHERWING eMOTORSPORTS · STANDINGS')||adminContentSource.includes('AETHERWING eMOTORSPORTS · ADMIN STANDINGS EXPORT'))throw Error('Standings PNG must remain league-branded rather than Aetherwing-branded.');
const chaseFlags=Object.fromEntries(standings.map((board)=>[board.id,board.chaseActive]));
if(chaseFlags.nrrs!==true||chaseFlags.kmart!==false||chaseFlags.sunoco!==true||chaseFlags.uarl!==false)throw Error('Standings Chase-active flags do not match the current league states.');


// v1.1.37 — Sunoco dual points workflow + championship filters + Kmart round metadata.
const sunoco=standings.find((board)=>board.id==='sunoco');
if(!sunoco||!Array.isArray(sunoco.rows)||sunoco.rows.length<17)throw Error('Sunoco standings must include the full 17-driver active roster.');
if(!Array.isArray(sunoco.chaseRows))throw Error('Sunoco standings must keep Chase-only points as a separate dataset.');
if(!adminContentSource.includes('data-sunoco-chase-import-text')||!adminContentSource.includes('applySunocoChaseImport')||!adminContentSource.includes('createSunocoStandingsPng'))throw Error('Sunoco Admin must retain separate Regular/Chase CSV import boxes and dual-panel PNG export.');
if(!adminContentSource.includes('standingsRoundSummary')||!adminContentSource.includes("league!=='kmart'")||!adminContentSource.includes('standingsExportStatus'))throw Error('Kmart standings PNG must derive round metadata instead of team-specific header text.');
const championshipsSource=readFileSync('src/pages/championships/index.astro','utf8');
for(const value of ['all','nrrs','kmart','sunoco','uarl'])if(!championshipsSource.includes(`data-championship-filter-value=\"${value}\"`))throw Error(`Championship page filter is missing ${value}.`);
if(!championshipsSource.includes('repairSunoco')||!championshipsSource.includes('standings-chase-panel'))throw Error('Public Championship page must retain full Sunoco roster repair and Chase-only panel rendering.');


// v1.1.43 — current Mission/Handbook operations + private Roblox asset tracking.
const competitions=JSON.parse(readFileSync('src/data/competitions.json','utf8'));
const missionSource=readFileSync('src/pages/mission-values/index.astro','utf8');
const handbookSource=readFileSync('src/pages/team-handbook/index.astro','utf8');
if(!missionSource.includes('aetherwing.length')||!missionSource.includes('alliance.length')||!missionSource.includes('active.length'))throw Error('Mission & Values counters must be derived from active competition data.');
if(!missionSource.includes('Former program / historical archive')||!handbookSource.includes('UARL D2 is closed'))throw Error('Closed UARL D2 must be historical-only on Mission and Handbook pages.');
if(!competitions.find((item)=>item.id==='uarl-d1')?.roster?.includes('#32 BurgerTown2Good')||!competitions.find((item)=>item.id==='uarl-d1')?.roster?.includes('#52 Gk3r'))throw Error('UARL D1 current roster is incomplete.');
if(competitions.some((item)=>item.id==='uarl-d2'))throw Error('UARL D2 must stay out of active competitions.');
if(competitions.find((item)=>item.id==='uarl-d1')?.schedule!=='Sundays · 8:30 PM ET')throw Error('UARL D1 must race Sundays at 8:30 PM ET.');
if(!JSON.stringify(competitions.find((item)=>item.id==='nrrs')?.roster||[]).includes('Hailey')||!JSON.stringify(competitions.find((item)=>item.id==='nrrs')?.roster||[]).includes('Plarker'))throw Error('NRRS active roster must use Hailey and Plarker identities.');
if(JSON.stringify(competitions.find((item)=>item.id==='iracing-factory')?.roster||[]).includes('Nicholas Waggoner'))throw Error('Current iRacing Factory roster must use Hailey Bell rather than Nicholas Waggoner.');
if(!JSON.stringify(JSON.parse(readFileSync('src/data/leadership.json','utf8'))[0]).includes('Hailey / @Aokikoto'))throw Error('Current leadership owner identity must use Hailey / @Aokikoto.');
if(!adminHtml.includes('Roblox asset tracking · internal only')||!adminHtml.includes('name="robloxModerationStatus"'))throw Error('Paint Admin Roblox asset tracking fields are missing.');
const paintRegistrySource=readFileSync('netlify/lib/_registry.cjs','utf8');
if(!paintRegistrySource.includes('robloxAssetId')||!paintRegistrySource.includes('...publicPaint'))throw Error('Roblox tracking must save privately and be stripped from the public paint API.');
if(!raceCalendarSource.includes('Boolean(resultFor(e))||end(e)<now')||!raceCalendarSource.includes('setInterval(tick,1000)'))throw Error('Homepage next-event rollover protection is missing.');
console.log('v1.1.43 verified: active-program pages, current identities, private Roblox asset tracking, and next-event rollover are intact.');

// v1.1.49 — randomized no-repeat ALL-tab number art pool.
if(!lineupSource.includes('chooseDriverArt')||!lineupSource.includes('sessionStorage')||!lineupSource.includes('ride.numberImageBackup||ride.numberImage'))throw Error('Driver ALL-tab number art shuffle-bag selection is missing.');

// v1.1.51 — resilient number uploads + public driver-removal cascade.
if(!adminContentSource.includes("for(let pass=0;pass<18;pass+=1)")||!adminContentSource.includes("Number artwork should never be rejected merely because the first optimized pass is too large")||adminContentSource.includes('This number art is too large after optimization'))throw Error('Driver number uploads must keep downscaling instead of failing at the old optimization ceiling.');
if(!siteAdminSource.includes('cascadeRemovedDriverProfiles')||!siteAdminSource.includes("registry.published.drivers=normalize('drivers'")||!siteAdminSource.includes("registry.published['schedule-events']=cleanSchedules"))throw Error('Publishing a Driver Directory deletion must cascade current driver assignments and active custom event entries.');
if(!profileSource.includes("location.replace('/drivers/')"))throw Error('Removed driver profile routes must redirect away when live Admin data no longer contains the profile.');
console.log('v1.1.51 verified: number uploads are resilient and Driver Directory removal cascades to current public roster data.');

// v1.2.0 — public team-site redesign + logo-led filters.
const headerSource=readFileSync('src/components/global/SiteHeader.astro','utf8');
const homeCss=readFileSync('src/styles/home.css','utf8');
const paintPageSource=readFileSync('src/pages/paint-booth/index.astro','utf8');
if(!headerSource.includes('site-header__utility')||!headerSource.includes('header-race-link')||!headerSource.includes('AETHERWING eMOTORSPORTS'))throw Error('v1.2.0 team-site header/race-control treatment is missing.');
for(const asset of ['/images/schedule-logos/nrrs.png','/images/schedule-logos/kmart-regular.jpg','/images/schedule-logos/sunoco.png','/images/schedule-logos/uarl-d1.png','/images/schedule-logos/open.png','/images/schedule-logos/iracing.png'])if(!raceCalendarSource.includes(asset))throw Error(`Race Calendar logo filter is missing ${asset}.`);
if(!lineupSource.includes('aw-lineup__filter-logo')||!lineupSource.includes("all:'/images/brand/aetherwing-logo.png'"))throw Error('Driver Lineup must use the logo-led program filter system.');
if(!championshipsSource.includes('/images/schedule-logos/nrrs.png')||!championshipsSource.includes('/images/schedule-logos/kmart-regular.jpg')||!championshipsSource.includes('/images/schedule-logos/sunoco.png')||!championshipsSource.includes('/images/schedule-logos/uarl-d1.png'))throw Error('Championship filters must use league logos.');
if(!paintPageSource.includes('leagueVisual')||!paintPageSource.includes('/images/schedule-logos/uarl-d2.png'))throw Error('Paint Booth must use logo-led league filters while retaining historical UARL D2 paint access.');
if(!homeSource.includes('home-programs__rail')||!homeSource.includes('programLogo')||!homeCss.includes('v1.2.0 — full team-site homepage redesign'))throw Error('Homepage program rail/team-site redesign is missing.');
if(!siteCss.includes('v1.2.0 — AETHERWING TEAM-SITE REDESIGN')||!siteCss.includes('--red:#e10600')||!siteCss.includes('--blue:#4a6fff'))throw Error('Aetherwing logo-led v1.2.0 public design tokens are missing.');
console.log('v1.2.0 verified: team-site redesign and logo-led public filters are intact.');

// v2.0.5 — recurring Oct. 1–7 Anniversary Week + 2015 debut identity + pre-2.0.4 header typography rollback.
if(!existsSync('public/images/brand/aetherwing-anniversary-2015.png'))throw Error('Anniversary Week throwback logo asset is missing.');
if(!seasonSource.includes("return eastern.month===10&&eastern.day>=1&&eastern.day<=7")||!seasonSource.includes("window:'October 1–7'")||!seasonSource.includes('nextAnniversaryBoundary'))throw Error('Anniversary Week must recur every Oct. 1–7 in Eastern Time and hand control back on Oct. 8.');
if(!seasonSource.includes('syncAnniversaryLogos')||!seasonSource.includes('/images/brand/aetherwing-anniversary-2015.png')||!seasonSource.includes('BELLSOUTH RACING ROOTS'))throw Error('Anniversary Week must swap to the 2015 throwback mark and debut-identity HUD.');
if(!seasonSource.includes("if(month===10&&day<=24)return 'halloween';"))throw Error('Normal October Halloween theme must remain intact underneath Anniversary Week.');
if(!siteCss.includes('v2.0.5 — header typography rollback')||!siteCss.includes("--font-condensed:'Saira Condensed'")||!siteCss.includes("--font-brush:'Saira Condensed'")||!siteCss.includes('v2.0.4 — Anniversary Week is a 2015 team-identity throwback'))throw Error('v2.0.5 header typography rollback or Anniversary Week debut styling is missing.');
if(!baseSource.includes('family=Permanent+Marker&family=Saira+Condensed:')||!baseSource.includes('family=Share+Tech+Mono&family=Tomorrow:'))throw Error('Public site must load restored Saira Condensed headers plus the existing body/data font families.');
if(!adminHtml.includes('data-theme="anniversary"')||!adminThemeSource.includes("anniversary:{window:'Every year · Oct 1–7 · Eastern Time'")||!adminCss.includes('data-admin-theme="anniversary"'))throw Error('Admin Theme Preview must include the recurring Anniversary Week debut-identity picker.');
if(!adminThemeSource.includes("url.searchParams.set('anniversary','throwback')"))throw Error('Admin Anniversary Week preview must force the public throwback overlay in the preview frame.');
console.log('v2.0.5 verified: Saira Condensed headers restored; 2015 Anniversary Week identity, recurring Oct. 1–7 timing, and Admin preview remain intact.');

// v2.0.7 — dedicated driver artwork delivery + Anniversary Paint Booth bundle.
const driverArtHandler=readFileSync('netlify/lib/_driver-art.cjs','utf8');
const netlifyConfig=readFileSync('netlify.toml','utf8');
const paintCss=readFileSync('src/styles/paint-gallery.css','utf8');
if(!existsSync('netlify/functions/driver-art.mjs')||!driverArtHandler.includes('numberImageBackup')||!driverArtHandler.includes('signatureLogo')||!netlifyConfig.includes('/api/driver-art'))throw Error('Dedicated public driver-art delivery endpoint is missing.');
if(!lineupSource.includes('/api/driver-art?v=${Date.now()}')||!lineupSource.includes('publishedArtById')||!lineupSource.includes('publishedSignatureBySlug')||!lineupSource.includes('profileWithPublishedSignature'))throw Error('Drivers grid must independently hydrate published number and signature artwork.');
if(!paintPageSource.includes("allPaintLogo=()=>document.documentElement.dataset.anniversaryRetro==='true'")||!paintPageSource.includes('MutationObserver'))throw Error('Paint Booth must use the Anniversary throwback mark and react to Anniversary mode changes.');
if(!paintCss.includes('v2.0.7 — Anniversary Week Paint Booth uses the full 2015 debut identity')||!paintCss.includes('AETHERWING PAINT SHOP • EST. 2015'))throw Error('Anniversary Week Paint Booth takeover styling is missing.');
if(!siteCss.includes('v2.0.6 — Anniversary interior-page badge must stay compact'))throw Error('v2.0.6 compact Anniversary interior-page badge fix must remain bundled.');
console.log('v2.0.7 verified: desktop driver artwork feed, compact Anniversary badge, and 2015 Paint Booth takeover are bundled.');

// v2.0.7 — Paint Booth header navigation must migrate the legacy internal path to the standalone viewer.
const navigationSeedNow=JSON.parse(readFileSync('src/data/navigation.json','utf8'));
const paintNav=navigationSeedNow.find((item)=>item.label==='Paint Booth'&&item.group==='Team');
if(paintNav?.href!=='https://paint.aetherwing.net/')throw Error('Team → Paint Booth navigation must point directly to paint.aetherwing.net.');
if(!headerSource.includes("item?.label==='Paint Booth'&&item?.href==='/paint-booth/'")||!readFileSync('src/lib/site-content.mjs','utf8').includes("href:'https://paint.aetherwing.net/'"))throw Error('Public navigation must migrate previously published legacy /paint-booth/ links to the standalone Paint Booth.');
console.log('v2.0.7 verified: Team → Paint Booth routes directly to the standalone viewer, including legacy published navigation.');

// v2.0.8 — desktop artwork hydration must retry and must not depend on the mobile canvas fitter.
if(!lineupSource.includes('hydrateDriverArtwork')||!lineupSource.includes('/api/site-content?v=${Date.now()}')||!lineupSource.includes('visibilitychange'))throw Error('Desktop driver artwork must retry the dedicated art feed and fall back to live site content.');
if(!lineupCss.includes('v2.0.8 — desktop driver artwork must render as actual uploaded art')||!lineupCss.includes('visibility:visible!important')||!lineupCss.includes('z-index:12!important'))throw Error('Desktop number/signature artwork visibility safeguards are missing.');
console.log('v2.0.8 verified: desktop driver number and signature artwork hydration is resilient.');

// v2.0.9 — Team Wire feature treatment + mobile headline overflow fix + SCR Season 4 story.
const newsSourceNow=JSON.parse(readFileSync('src/data/news.json','utf8'));
const scrStory=newsSourceNow.find((story)=>story.slug==='hailey-bell-joins-starclutch-racing-nrrs-season-4');
if(!scrStory||scrStory.dateIso!=='2026-09-14'||!scrStory.title.includes('StarClutch Racing')||!scrStory.summary.includes('Aetherwing will continue to compete in NRRS'))throw Error('SCR Season 4 Team Wire story is missing or incomplete.');
const newsArticleSource=readFileSync('src/pages/news/[slug].astro','utf8');
const recordsCssNow=readFileSync('src/styles/records.css','utf8');
const siteContentSourceNow=readFileSync('src/lib/site-content.mjs','utf8');
if(!newsArticleSource.includes('news-headline-mark')||!newsArticleSource.includes('news-timeline')||!newsArticleSource.includes('news-callout')||!newsArticleSource.includes('news-section-index'))throw Error('Team Wire articles must render feature modules, not paragraph-only stories.');
if(!recordsCssNow.includes('v2.0.9 — Team Wire feature layout + mobile-safe story headlines')||!recordsCssNow.includes('overflow-wrap:anywhere')||!recordsCssNow.includes('font-size:clamp(2.35rem,11.6vw,3.25rem)')||!recordsCssNow.includes('.news-article{position:relative;width:100%;max-width:100%;overflow-x:clip'))throw Error('Team Wire mobile headline overflow safeguards are missing.');
if(!siteContentSourceNow.includes('requiredNewsSlugs')||!siteContentSourceNow.includes('hailey-bell-joins-starclutch-racing-nrrs-season-4'))throw Error('New Team Wire story must survive older published Admin overlays during deployment.');
if(!adminContentSource.includes("timeline:'Story timeline'")||!adminContentSource.includes('requiredNewsSlugs'))throw Error('Team Wire Admin must expose the visual timeline and include the new SCR story in older published datasets.');
console.log('v2.0.9 verified: Team Wire stories are mobile-safe, visually structured, and include the SCR Season 4 announcement.');
