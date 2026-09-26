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

const normalizeDriverAssignments = (rows=[]) => rows.flatMap((entry) => {
  if (entry?.id !== 'shared-kmart' && !(entry?.competitionId === 'kmart' && String(entry?.number) === '29' && /Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.displayName || ''))) return [entry];
  const common = {
    number:'29', numberImage:entry.numberImage || '', competition:entry.competition || 'Kmart Auto Parts Series', competitionId:'kmart',
    status:entry.status || 'Shared Part-Time Entry', affiliation:entry.affiliation || 'alliance', car:entry.car || 'SCR #29 PT'
  };
  return [
    {...common,id:'clutch-kmart',profile:'clutch',displayName:'Clutch'},
    {...common,id:'eazy-kmart',profile:'eazy',displayName:'Eazy'},
    {...common,id:'matty-kmart',profile:'matty',displayName:'Matty'}
  ];
});
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
  publishedNavigation.some((item) => ['/mission-values/','/team-handbook/','/contact/','/wins-history/'].includes(item.href)) ||
  ['/programs/','/championships/','/history/'].some((href) => !publishedNavigation.some((item) => item.href === href))
);
export const navigation = obsoleteNavigation ? navigationSeed : publishedNavigation;
export const liveryBrands = choose('livery-brands', liveryBrandsSeed);
export const driverPortfolios = choose('driver-portfolios', driverPortfoliosSeed);
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
  if(!race||!['nrrs','uarl-d1'].includes(race.league)||!Array.isArray(race.entries))return race;
  const stage=(finish)=>{const pos=Number(finish||0);if(race.league==='nrrs')return pos>=1&&pos<=5?11-pos:0;return pos>=1&&pos<=5?6-pos:0;};
  const finishPoints=(finish)=>{const pos=Number(finish||0);if(pos<1)return 0;if(race.league==='nrrs')return pos===1?40:Math.max(1,37-pos);return publicUarlFinishPoints[pos]||0;};
  return {...race,entries:race.entries.map((entry)=>{const stage1Points=stage(entry.stage1Finish),stage2Points=stage(entry.stage2Finish),base=finishPoints(entry.finish),bonusPoints=Math.max(0,Number(entry.bonusPoints||0)||0),pointsEligible=entry.pointsEligible!==false;return {...entry,stage1Points,stage2Points,finishPoints:base,bonusPoints,pointsEligible,racePoints:pointsEligible?base+stage1Points+stage2Points+bonusPoints:0};})};
};
const canonicalResults=resultsSeed.filter((result)=>(result.league==='nrrs'&&result.date==='2026-09-22')||(result.league==='uarl-d2'&&result.date==='2026-09-12'));
const mergedResults=normalizeResults(choose('results', resultsSeed));
for(const official of canonicalResults){
  const i=mergedResults.findIndex((result)=>result?.league===official.league&&result?.date===official.date);
  if(i===-1)mergedResults.push(official);
  else if(official.league==='nrrs')mergedResults[i]={...mergedResults[i],title:official.title,track:official.track,round:official.round,status:official.status,specialTag:official.specialTag,entries:mergedResults[i].entries?.length?mergedResults[i].entries:official.entries};
}
export const results = mergedResults.map(normalizeLegacyKmartResult).map(scorePublishedRace).map((result)=>{
  const event=scheduleEvents.find((item)=>scheduleResultId(item)===result.scheduleId);
  return event?{...result,league:event.league,leagueName:event.leagueName,title:event.title,track:event.track,date:event.date,round:event.round||'',status:event.status||'',specialTag:event.specialTag||''}:result;
}).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map((result,index)=>({...result,featured:index===0}));
export const wins = choose('wins', winsSeed);
const publishedStandings = choose('standings', standingsSeed);
const standingsSeedById = new Map(standingsSeed.map((board) => [board.id, board]));
const supersededSnapshot = (board) => {
  if (board?.id === 'nrrs') { const last=String(board.lastResultDate||''); return /After Race 20 of 25/.test(board.subtitle||'') || /After R20\/25/.test(board.subtitle||'') || (!last&&/After R21\/25/.test(board.subtitle||'')) || (last==='2026-09-22'&&board.rows?.some((row)=>row.driver==='Trent'&&Number(row.points)===2197)); }
  if (board?.id !== 'kmart') return false;
  const fresh = standingsSeedById.get('kmart');
  const publishedRows = Array.isArray(board.rows) ? board.rows.length : 0;
  const freshRows = Array.isArray(fresh?.rows) ? fresh.rows.length : 0;
  const publishedPt = Array.isArray(board.ptEntry?.drivers) ? board.ptEntry.drivers.length : 0;
  const freshPt = Array.isArray(fresh?.ptEntry?.drivers) ? fresh.ptEntry.drivers.length : 0;
  return /After Race 6 of 23/.test(board.subtitle || '') || publishedRows < freshRows || publishedPt < freshPt;
};
export const standings = Array.isArray(publishedStandings)
  ? publishedStandings.map((board) => supersededSnapshot(board) ? standingsSeedById.get(board.id) || board : board)
  : standingsSeed;
export const milestones = choose('milestones', milestonesSeed);
export const drivers = normalizeDriverAssignments(choose('drivers', driversSeed));
const rosterProgramLabels = {
  nrrs:'NRRS', 'uarl-d1':'UARL D1', 'uarl-open':'UARL Open',
  kmart:'Kmart', sunoco:'Sunoco'
};
const rosterBase = choose('roster-profiles', rosterSeed);
export const rosterProfiles = rosterBase.map((profile) => {
  const assignments = drivers.filter((entry) => entry.profile === profile.slug && entry.competitionId !== 'iracing-factory');
  if (!assignments.length) return profile;
  return {
    ...profile,
    numbers: [...new Set(assignments.map((entry) => entry.number).filter(Boolean))].join(' / '),
    numberImages: assignments.filter((entry)=>entry.numberImage).map((entry)=>({assignmentId:entry.id,competitionId:entry.competitionId,number:entry.number,image:entry.numberImage})),
    programs: [...new Set(assignments.map((entry) => rosterProgramLabels[entry.competitionId] || entry.competition).filter(Boolean))]
  };
});
export const driverProfiles = choose('driver-profiles', profilesSeed);
const normalizeCharters = (boards) => (boards ?? []).map((board) => {
  if (Array.isArray(board.openCharters)) return board;
  const old = board.openCharter;
  if (!old) return { ...board, openCharters: [] };
  const uses = [old.partTime, old.development].filter(Boolean).map((use) => ({ ...use, active:true }));
  const next = { ...board, openCharters:[{ id:`${board.id || 'league'}-open-1`, label:old.label || 'Aetherwing Open Charter', slotLabel:old.slotLabel || '', active:true, uses }] };
  delete next.openCharter;
  return next;
});
export const charters = normalizeCharters(choose('charters', chartersSeed));
export const iracingGarage = choose('iracing-garage', iracingSeed);
export const news = choose('news', newsSeed);
export const competitions = choose('competitions', competitionsSeed);
export const leadership = choose('leadership', leadershipSeed);
export const partners = choose('partners', partnersSeed);
