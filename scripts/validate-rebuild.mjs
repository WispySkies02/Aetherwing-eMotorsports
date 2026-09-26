import { existsSync,readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname,resolve } from 'node:path';

// Always validate from the project root, even if Netlify invokes the build
// from a different working directory.
const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(projectRoot);
const needed=['src/pages/index.astro','src/pages/schedule/index.astro','src/pages/drivers/index.astro','src/pages/championships/index.astro','src/pages/paint-booth/index.astro','src/pages/partners/index.astro','src/pages/news/index.astro','src/pages/history/index.astro','src/pages/event/[slug].astro','src/pages/programs/index.astro','public/images/textures/aetherwing-editorial.webp','public/seasonal-theme.js','public/admin/index.html','public/admin/theme-preview.js'];
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
const eventSource=readFileSync('src/pages/event/[slug].astro','utf8');
const adminContentSource=readFileSync('public/admin/content-admin.js','utf8');
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

// v1.1.33 — league-branded standings graphics + manufacturer / Chase logic.
if(!adminContentSource.includes('NRRS TOWN FAIR TIRE CUP SERIES')||!adminContentSource.includes('NASCAR KMART AUTO PARTS SERIES')||!adminContentSource.includes('NASCAR SUNOCO TRUCK SERIES')||!adminContentSource.includes('UARL L.L. BEAN CUP SERIES')||!adminContentSource.includes('UARL BANGOR SAVINGS BANK LATE MODEL SERIES'))throw Error('Standings PNG league title branding is incomplete.');
if(!adminContentSource.includes('standingsManufacturerByNumber')||!adminContentSource.includes('latestStandingResultEntry')||!adminContentSource.includes('standingManufacturer'))throw Error('Standings PNG manufacturer mapping/latest-result logic is missing.');
if(!adminContentSource.includes('board?.chaseActive!==true')||adminContentSource.includes('const highlighted=Boolean(row.highlight)'))throw Error('Standings PNG must highlight Chase drivers only when the board is actively in the Chase.');
if(adminContentSource.includes('AETHERWING eMOTORSPORTS · STANDINGS')||adminContentSource.includes('AETHERWING eMOTORSPORTS · ADMIN STANDINGS EXPORT'))throw Error('Standings PNG must remain league-branded rather than Aetherwing-branded.');
const chaseFlags=Object.fromEntries(standings.map((board)=>[board.id,board.chaseActive]));
if(chaseFlags.nrrs!==true||chaseFlags.kmart!==false||chaseFlags.sunoco!==true||chaseFlags.uarl!==false)throw Error('Standings Chase-active flags do not match the current league states.');

