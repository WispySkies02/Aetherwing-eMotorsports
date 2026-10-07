import overlay from '../data/admin-content.json';
import scheduleSeed from '../data/schedule-events.json';
import resultsSeed from '../data/results.json';
import winsSeed from '../data/wins.json';
import standingsSeed from '../data/standings.json';
import milestonesSeed from '../data/milestones.json';
import rosterSeed from '../data/roster-profiles.json';
import profilesSeed from '../data/driver-profiles.json';
import driversSeed from '../data/drivers.json';
import chartersSeed from '../data/charters.json';
import iracingSeed from '../data/iracing-garage.json';
import newsSeed from '../data/news.json';
import competitionsSeed from '../data/competitions.json';
import leadershipSeed from '../data/leadership.json';
import partnersSeed from '../data/partners.json';
import siteSeed from '../data/site.json';
import navigationSeed from '../data/navigation.json';
import liveryBrandsSeed from '../data/livery-brands.json';
import driverPortfoliosSeed from '../data/driver-portfolios.json';
import pageOverridesSeed from '../data/page-overrides.json';
const choose = (name, seed) => overlay.datasets?.[name] ?? seed;

const normalizeDriverAssignments = (rows=[]) => {
  const normalized=rows.flatMap((entry) => {
    if (entry?.id !== 'shared-kmart' && !(entry?.competitionId === 'kmart' && String(entry?.number) === '29' && /Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.displayName || ''))) return [entry];
    const common = {
      number:'29', numberImage:entry.numberImage || '', numberImageBackup:entry.numberImageBackup || '', competition:entry.competition || 'Kmart Auto Parts Series', competitionId:'kmart',
      status:entry.status || 'Shared Part-Time Entry', affiliation:entry.affiliation || 'alliance', car:entry.car || 'SCR #29 PT'
    };
    return [
      {...common,id:'clutch-kmart',profile:'clutch',displayName:'Clutch'},
      {...common,id:'eazy-kmart',profile:'eazy',displayName:'Eazy'},
      {...common,id:'matty-kmart',profile:'matty',displayName:'Matty'}
    ];
  });
  const shared29=normalized.find((entry)=>entry?.competitionId==='kmart'&&String(entry?.number)==='29'&&entry?.numberImageBackup)||normalized.find((entry)=>entry?.competitionId==='kmart'&&String(entry?.number)==='29'&&entry?.numberImage);
  if(!shared29)return normalized;
  const sharedUpload=shared29.numberImageBackup||'';
  const sharedSource=shared29.numberImage||sharedUpload;
  return normalized.map((entry)=>entry?.competitionId==='kmart'&&String(entry?.number)==='29'?{...entry,numberImage:entry.numberImage||sharedSource,numberImageBackup:entry.numberImageBackup||sharedUpload}:entry);
};
const normalizeLegacyKmartResult = (result) => ({...result, entries:(result.entries||[]).map((entry) => {
  if (entry?.assignmentId === 'shared-kmart' || (String(entry?.number) === '29' && /Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.driver || ''))) {
    return {...entry, assignmentId:'', driver:'Part-Time Entry'};
  }
  return entry;
})});
const publishedSchedule = choose('schedule-events', scheduleSeed);
export const scheduleEvents = (Array.isArray(publishedSchedule)?publishedSchedule:scheduleSeed).filter((event)=>event?.league!=='uarl-d2').map((event)=>event?.league==='nrrs'&&event?.date==='2026-09-22'?{...event,title:'North Wilkesboro Speedway (Chase Race 2)',track:'North Wilkesboro Speedway',status:'The Chase',round:'ROUND 21',time:'7:30 PM ET'}:event);
export const siteSettings = choose('site', siteSeed);
const publishedNavigation = choose('navigation', navigationSeed);
const obsoleteNavigation = Array.isArray(publishedNavigation) && (
  publishedNavigation.some((item) => ['/contact/','/wins-history/'].includes(item.href)) ||
  ['/programs/','/championships/','/history/','/mission-values/','/team-handbook/'].some((href) => !publishedNavigation.some((item) => item.href === href))
);
const rawNavigation = obsoleteNavigation ? navigationSeed : publishedNavigation;
export const navigation = (Array.isArray(rawNavigation)?rawNavigation:navigationSeed).map((item)=>item?.label==='Paint Booth'&&item?.href==='/paint-booth/'?{...item,href:'https://paint.aetherwing.net/'}:item);
export const liveryBrands = choose('livery-brands', liveryBrandsSeed);
const normalizeDriverPortfolios=(rows=[])=>rows.map((portfolio)=>({...portfolio,profile:portfolio?.profile==='wispy'?'hailey':portfolio?.profile}));
export const driverPortfolios = normalizeDriverPortfolios(choose('driver-portfolios', driverPortfoliosSeed));
export const pageOverrides = choose('page-overrides', pageOverridesSeed);
const resultSlug=(value='')=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
const scheduleResultId=(event={})=>`${event.date||'tbd'}-${event.league||'event'}-${resultSlug(event.title||event.track||'scheduled-event')}`;
const normalizeResults=(value)=>{
  if(Array.isArray(value))return value;
  if(Array.isArray(value?.races))return value.races;
  const old=value?.latestResult;if(!old)return [];
  const parsed=new Date(old.date),date=Number.isNaN(parsed.getTime())?'':parsed.toISOString().slice(0,10);
  const event=scheduleEvents.find((item)=>item.league==='nrrs'&&(item.title===old.title||item.track===old.track)&&(!date||item.date===date));
  return [{scheduleId:event?scheduleResultId(event):`${date||'tbd'}-nrrs-${resultSlug(old.title)}`,league:event?.league||'nrrs',leagueName:event?.leagueName||old.series||'NRRS',title:event?.title||old.title||'',track:event?.track||old.track||'',date:event?.date||date,round:event?.round||old.round||'',status:event?.status||'',specialTag:event?.specialTag||old.specialTag||'',featured:true,headline:old.headline||'',headlineAccent:old.headlineAccent||'',summary:old.summary||'',entries:[{driver:old.driver||'',number:String(old.number||''),start:Number(old.start||0),stage1Finish:0,stage1Points:0,stage2Finish:0,stage2Points:Number(old.stagePoints||0),finish:Number(old.finish||0),racePoints:Number(old.pointsChange||0),featuredDriver:true}]}];
};
const publicUarlFinishPoints=[0,50,45,42,40,38,36,34,32,30,28,27,26,25,24,23,22];
const scorePublishedRace=(race)=>{
  if(!race||!['nrrs','kmart','uarl-d1'].includes(race.league)||!Array.isArray(race.entries))return race;
  const stage=(finish)=>{const pos=Number(finish||0);if(race.league==='nrrs')return pos>=1&&pos<=5?11-pos:0;return pos>=1&&pos<=5?6-pos:0;};
  const finishPoints=(finish)=>{const pos=Number(finish||0);if(pos<1)return 0;if(race.league==='nrrs')return pos===1?40:Math.max(1,37-pos);if(race.league==='kmart')return pos===1?55:Math.max(1,37-pos);return publicUarlFinishPoints[pos]||0;};
  return {...race,entries:race.entries.map((entry)=>{const stage1Points=stage(entry.stage1Finish),stage2Points=stage(entry.stage2Finish),base=finishPoints(entry.finish),bonusPoints=Math.max(0,Number(entry.bonusPoints||0)||0),pointsEligible=entry.pointsEligible!==false;return {...entry,stage1Points,stage2Points,finishPoints:base,bonusPoints,pointsEligible,racePoints:pointsEligible?base+stage1Points+stage2Points+bonusPoints:0};})};
};
const canonicalResults=resultsSeed.filter((result)=>(result.league==='nrrs'&&result.date==='2026-09-22')||(result.league==='kmart'&&result.date==='2026-09-28')||(result.league==='uarl-d2'&&result.date==='2026-09-12'));
const mergedResults=normalizeResults(choose('results', resultsSeed));
for(const official of canonicalResults){
  const i=mergedResults.findIndex((result)=>result?.league===official.league&&result?.date===official.date);
  if(i===-1)mergedResults.push(official);
  else if(['nrrs','kmart'].includes(official.league))mergedResults[i]={...mergedResults[i],title:official.title,track:official.track,round:official.round,status:official.status,specialTag:official.specialTag,entries:mergedResults[i].entries?.length?mergedResults[i].entries:official.entries};
}
export const results = mergedResults.map(normalizeLegacyKmartResult).map(scorePublishedRace).map((result)=>{
  const event=scheduleEvents.find((item)=>scheduleResultId(item)===result.scheduleId);
  return event?{...result,league:event.league,leagueName:event.leagueName,title:event.title,track:event.track,date:event.date,round:event.round||'',status:event.status||'',specialTag:event.specialTag||''}:result;
}).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map((result,index)=>({...result,featured:index===0}));
export const wins = choose('wins', winsSeed);
const publishedStandings = choose('standings', standingsSeed);
export const standings = Array.isArray(publishedStandings) ? publishedStandings : standingsSeed;
export const milestones = choose('milestones', milestonesSeed);
const enforceCurrentAssignments=(rows=[])=>normalizeDriverAssignments(rows).filter((entry)=>!(entry?.competitionId==='kmart'&&entry?.profile==='jaxon')).map((entry)=>{entry=entry?.profile==='wispy'?{...entry,profile:'hailey'}:entry;
  if(entry?.competitionId!=='uarl-d1')return entry;
  const key=String(entry?.profile||entry?.displayName||'').toLowerCase();
  if(key==='wispy'||key==='hailey')return {...entry,number:'28',displayName:'Hailey'};
  if(key==='burgertown2good')return {...entry,number:'32'};
  if(key==='gk3r')return {...entry,number:'42',displayName:'GK3R'};
  if(key==='rocky')return {...entry,number:'46'};
  return entry;
});
export const drivers = enforceCurrentAssignments(choose('drivers', driversSeed));
const rosterProgramLabels = {
  nrrs:'NRRS', 'uarl-d1':'UARL D1', 'uarl-open':'UARL Open',
  kmart:'Kmart', sunoco:'Sunoco'
};
const rosterBase = choose('roster-profiles', rosterSeed);
export const rosterProfiles = rosterBase.map((sourceProfile) => {
  const profile=sourceProfile?.slug==='wispy'?{...sourceProfile,slug:'hailey'}:sourceProfile;
  const assignments = drivers.filter((entry) => entry.profile === profile.slug && entry.competitionId !== 'iracing-factory');
  if (!assignments.length) return profile;
  return {
    ...profile,
    numbers: [...new Set(assignments.map((entry) => entry.number).filter(Boolean))].join(' / '),
    numberImages: assignments.filter((entry)=>entry.numberImageBackup||entry.numberImage).map((entry)=>({assignmentId:entry.id,competitionId:entry.competitionId,number:entry.number,image:entry.numberImageBackup||entry.numberImage})),
    programs: [...new Set(assignments.map((entry) => rosterProgramLabels[entry.competitionId] || entry.competition).filter(Boolean))]
  };
});
export const driverProfiles = choose('driver-profiles', profilesSeed).map((profile)=>profile?.slug==='wispy'?{...profile,slug:'hailey'}:profile);
const normalizeCharters = (boards) => (boards ?? []).map((board) => {
  if (Array.isArray(board.openCharters)) return board;
  const old = board.openCharter;
  if (!old) return { ...board, openCharters: [] };
  const uses = [old.partTime, old.development].filter(Boolean).map((use) => ({ ...use, active:true }));
  const next = { ...board, openCharters:[{ id:`${board.id || 'league'}-open-1`, label:old.label || 'Aetherwing Open Charter', slotLabel:old.slotLabel || '', active:true, uses }] };
  delete next.openCharter;
  return next;
});
const enforceCurrentCharters=(boards=[])=>normalizeCharters(boards).map((board)=>{
  if(board?.id!=='uarl-d1')return board;
  return {...board,fullTime:[
    {number:'28',driver:'Hailey',numberImage:board.fullTime?.find(x=>String(x.number)==='28')?.numberImage||''},
    {number:'32',driver:'BurgerTown2Good',numberImage:board.fullTime?.find(x=>String(x.number)==='32')?.numberImage||''},
    {number:'42',driver:'GK3R',numberImage:board.fullTime?.find(x=>['42','52'].includes(String(x.number)))?.numberImage||''},
    {number:'46',driver:'Rocky',numberImage:board.fullTime?.find(x=>['46','92'].includes(String(x.number)))?.numberImage||''},
    {number:'56',driver:'Open',numberImage:board.fullTime?.find(x=>['56','54'].includes(String(x.number)))?.numberImage||''}
  ],openCharters:(board.openCharters||[]).slice(0,1).map((charter)=>({...charter,slotLabel:'6TH CHARTER',uses:[{...(charter.uses||[]).find(u=>String(u.number)==='62'),number:'62',label:'Part-Time',active:true},{...(charter.uses||[]).find(u=>String(u.number)==='82'),number:'82',label:'Development',active:true}]}))};
});
export const charters = enforceCurrentCharters(choose('charters', chartersSeed));
export const iracingGarage = choose('iracing-garage', iracingSeed);
const publishedNews = choose('news', newsSeed);
const currentFeaturedNewsSlug='talladega-leaves-bell-frustrated-championship-gap-grows';
const requiredNewsSlugs = new Set(['hailey-bell-joins-starclutch-racing-nrrs-season-4','hailey-bell-to-step-back-from-full-time-competition-after-season-4',currentFeaturedNewsSlug]);
const newsSeedBySlug = new Map(newsSeed.map((story)=>[story.slug,story]));
// v2.0.11 — Team Wire uses Hailey consistently in all reader-facing copy.
// Keep legacy slugs/routes stable so old links do not break.
const normalizeNewsIdentityValue = (value, key='') => {
  if (Array.isArray(value)) return value.map((item)=>normalizeNewsIdentityValue(item));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey,childValue])=>[childKey,(childKey==='slug'||childKey==='legacyRoute')?childValue:normalizeNewsIdentityValue(childValue,childKey)]));
  if (typeof value !== 'string') return value;
  return value
    .replace(/WispySkies02/g,'Hailey Bell')
    .replace(/WISPY/g,'HAILEY')
    .replace(/Wispy’s/g,'Hailey’s')
    .replace(/Wispy's/g,"Hailey's")
    .replace(/\bWispy\b/g,'Hailey');
};
const normalizeNewsIdentity = (story) => {
  const normalized = normalizeNewsIdentityValue(story);
  if (normalized?.slug === 'wispy-100th-roracing-start-talladega' && typeof normalized.summary === 'string') normalized.summary = normalized.summary.replace('Hailey marked his 100th','Hailey marked her 100th');
  if (normalized?.slug === 'wispy-wins-nrrs-all-star' && typeof normalized.summary === 'string') normalized.summary = normalized.summary.replace('for his first career RoRacing win','for her first career RoRacing win');
  return normalized;
};
const replaceFullCirclePartner = (value) => {
  if (Array.isArray(value)) return value.map(replaceFullCirclePartner);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,replaceFullCirclePartner(child)]));
  if (typeof value === 'string') return value.replace(/Pokémon|Pokemon/g,'Ironmouse');
  return value;
};
const migrateStaleNewsStory = (story) => {
  let normalized = normalizeNewsIdentity(story);
  if (normalized?.slug === 'hailey-bell-to-step-back-from-full-time-competition-after-season-4') normalized = replaceFullCirclePartner(normalized);
  const fresh = newsSeedBySlug.get(normalized?.slug);
  if (!fresh) return normalized;
  if (normalized.slug === 'hailey-bell-joins-starclutch-racing-nrrs-season-4') {
    const serialized = JSON.stringify(normalized);
    if ((normalized.metrics || []).some((metric)=>metric?.value === 'CONTINUES') || /SCR\/Aetherwing partnership|SCR × Aetherwing partnership|one of her personal partners|Hailey personal partner|relationship follows Bell|final full-time|Post-S4 Focus|Full-Time Competition Steps Back|One Final Full-Time Chapter/i.test(serialized)) return fresh;
  }
  if (normalized.slug === currentFeaturedNewsSlug && normalized.contentRevision !== fresh.contentRevision) return fresh;
  if (normalized.slug === 'hailey-bell-to-step-back-from-full-time-competition-after-season-4') {
    const serialized = JSON.stringify(normalized);
    if (!/FULL HEART/i.test(serialized) || /FULL CIRCLE/i.test(serialized) || !/Toys [“"]R[”"] Us|Toys R Us/i.test(serialized) || !/Cheddar/i.test(serialized) || !/Apex Sim Racing/i.test(serialized) || !/Ironmouse/i.test(serialized) || /Driver Second\. Team Builder First|AFTER NRRS SEASON 4/i.test(serialized)) return fresh;
    return {
      ...normalized,
      socialImage: (!normalized.socialImage || /full-heart-tour-2027-logo\.jpg$/i.test(normalized.socialImage)) ? fresh.socialImage : normalized.socialImage,
      articleLogo: normalized.articleLogo || fresh.articleLogo,
      embedDescription: normalized.embedDescription || fresh.embedDescription
    };
  }
  return normalized;
};
const publishedHasCurrentFeatured=Array.isArray(publishedNews)&&publishedNews.some((item)=>item?.slug===currentFeaturedNewsSlug);
const mergedNews=Array.isArray(publishedNews)
  ? [...publishedNews, ...newsSeed.filter((story)=>requiredNewsSlugs.has(story.slug)&&!publishedNews.some((item)=>item?.slug===story.slug))].map(migrateStaleNewsStory)
  : newsSeed;
export const news = publishedHasCurrentFeatured ? mergedNews : mergedNews.map((story)=>({...story,featured:story?.slug===currentFeaturedNewsSlug}));
const publishedCompetitions = choose('competitions', competitionsSeed);
const competitionSeedById = new Map(competitionsSeed.map((item)=>[item.id,item]));
const staleCompetition = (item={}) => {
  if(item.id==='uarl-d2') return true;
  if(item.id==='uarl-d1') return /Saturday/i.test(item.schedule||'') || /Cadillac/i.test(item.machine||'') || !['#28 Hailey','#32 BurgerTown2Good','#42 GK3R','#46 Rocky','#56 OPEN'].every((entry)=>(item.roster||[]).includes(entry));
  if(item.id==='kmart' && (item.roster||[]).some((entry)=>/Jaxon/i.test(entry))) return true;
  if(item.id==='nrrs') return (item.roster||[]).some((entry)=>/#32\s+Wispy|#43\s+Parker/i.test(entry));
  if(item.id==='iracing-factory') return (item.roster||[]).some((entry)=>/Nicholas Waggoner/i.test(entry));
  return false;
};
export const competitions = (Array.isArray(publishedCompetitions)?publishedCompetitions:competitionsSeed)
  .filter((item)=>item?.id!=='uarl-d2')
  .map((item)=>staleCompetition(item)?competitionSeedById.get(item.id)||item:item);
const publishedLeadership = choose('leadership', leadershipSeed);
export const leadership = (Array.isArray(publishedLeadership)?publishedLeadership:leadershipSeed).map((entry,index)=>{
  if(index===0 && /^(Wispy|WispySkies02|Hailey)$/i.test(String(entry?.name||''))) return leadershipSeed[0];
  return entry;
});
const publishedPartners = choose('partners', partnersSeed);
const normalizeTeamPartners=(rows=[])=>{const list=[...rows];const canonical=partnersSeed.find((item)=>item?.name==='Palmetto Gaming');if(!canonical)return list;const index=list.findIndex((item)=>item?.name==='Palmetto Gaming');if(index===-1)return [canonical,...list];if(/hailey|personal/i.test(String(list[index]?.role||'')))list[index]={...canonical};return list;};
export const partners = normalizeTeamPartners(Array.isArray(publishedPartners)?publishedPartners:partnersSeed);
