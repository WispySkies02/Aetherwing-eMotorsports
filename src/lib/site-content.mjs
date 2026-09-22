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
import pageOverridesSeed from '../data/page-overrides.json';
const choose = (name, seed) => overlay.datasets?.[name] ?? seed;
export const scheduleEvents = choose('schedule-events', scheduleSeed);
export const siteSettings = choose('site', siteSeed);
export const navigation = choose('navigation', navigationSeed);
export const liveryBrands = choose('livery-brands', liveryBrandsSeed);
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
export const results = normalizeResults(choose('results', resultsSeed)).map((result)=>{
  const event=scheduleEvents.find((item)=>scheduleResultId(item)===result.scheduleId);
  return event?{...result,league:event.league,leagueName:event.leagueName,title:event.title,track:event.track,date:event.date,round:event.round||'',status:event.status||'',specialTag:event.specialTag||''}:result;
}).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
export const wins = choose('wins', winsSeed);
export const standings = choose('standings', standingsSeed);
export const milestones = choose('milestones', milestonesSeed);
export const drivers = choose('drivers', driversSeed);
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
