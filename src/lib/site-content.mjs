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
const choose = (name, seed) => overlay.datasets?.[name] ?? seed;
export const scheduleEvents = choose('schedule-events', scheduleSeed);
export const results = choose('results', resultsSeed);
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
    programs: [...new Set(assignments.map((entry) => rosterProgramLabels[entry.competitionId] || entry.competition).filter(Boolean))]
  };
});
export const driverProfiles = choose('driver-profiles', profilesSeed);
export const charters = choose('charters', chartersSeed);
export const iracingGarage = choose('iracing-garage', iracingSeed);
export const news = choose('news', newsSeed);
export const competitions = choose('competitions', competitionsSeed);
export const leadership = choose('leadership', leadershipSeed);
export const partners = choose('partners', partnersSeed);
