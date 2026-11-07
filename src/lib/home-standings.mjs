import {standingIdentity} from './standings-metadata.mjs';

const leagueAliases={uarl:'uarl-d1',open:'uarl-open',iracing:'iracing-factory'};
const canonicalLeague=value=>{
  const league=String(value||'').trim().toLowerCase();
  return Object.hasOwn(leagueAliases,league)?leagueAliases[league]:league;
};
const number=value=>String(value??'').trim();
export const homeStandingKey=row=>`${standingIdentity(row)}|${number(row?.number)}`;
const assignmentIdentity=assignment=>standingIdentity(assignment?.displayName||assignment?.profile||assignment?.handle||'');

// One snapshot drives the homepage header, highlighted driver and timing tower.
// An explicitly selected empty board/table stays empty; another league's points
// must never fill the gap. Reading this model does not update any source data.
export function homeStandings(boards=[],drivers=[]){
  const available=Array.isArray(boards)?boards.filter(board=>board&&typeof board==='object'&&!Array.isArray(board)):[];
  const board=available.find(board=>board.featuredOnHome===true)
    ||available.find(board=>canonicalLeague(board.id)==='nrrs'||canonicalLeague(board.league)==='nrrs')
    ||available[0]||null;
  const league=canonicalLeague(board?.league||board?.id);
  const table=board?.homeTable==='chase'?'chase':'regular';
  const source=table==='chase'?board?.chaseRows:board?.rows;
  const rows=Array.isArray(source)?[...source]:[];
  const leader=rows[0]||null,focusRow=rows.find(row=>row?.highlight===true)||leader;
  const scored=row=>row&&row.pointsPending!==true&&Number.isFinite(row.points);
  const gap=scored(focusRow)&&scored(leader)?focusRow.points-leader.points:null;
  const focusGap=gap===null?'—':focusRow===leader?'LEADER':gap>0?`+${gap}`:String(gap);
  const assignments=(Array.isArray(drivers)?drivers:[]).filter(assignment=>assignment&&assignment.active!==false&&canonicalLeague(assignment.competitionId||assignment.league)===league);
  const matchingAssignment=row=>{
    const identity=standingIdentity(row),car=number(row?.number);
    return identity&&car?assignments.find(assignment=>assignmentIdentity(assignment)===identity&&number(assignment.number)===car)||null:null;
  };
  const focusAssignment=focusRow?matchingAssignment(focusRow):null;
  const teamRows=rows.filter(row=>row?.highlight===true||matchingAssignment(row));
  const cutoff=table==='chase'?0:league==='nrrs'?5:Number.isInteger(board?.cutoffAfter)&&board.cutoffAfter>0?board.cutoffAfter:0;
  const regularTitle=board?.title||'Championship standings',chaseTitle=board?.chaseTitle;
  const title=table==='chase'&&chaseTitle&&String(chaseTitle).trim().toLowerCase()!==String(regularTitle).trim().toLowerCase()?`${regularTitle} · ${chaseTitle}`:regularTitle;
  return {
    board,rows,table,league,
    title,
    subtitle:table==='chase'?(board?.chaseSubtitle||board?.subtitle||''):(board?.subtitle||''),
    status:table==='chase'?'Chase points':(board?.status||'Standings'),
    cutoff,
    cutoffLabel:cutoff?(league==='nrrs'?'Chase cutoff · Top 5':board?.cutoffLabel||`Chase cutoff · Top ${cutoff}`):'',
    focusRow,leader,focusAssignment,focusGap,
    teamNumbers:[...new Set(teamRows.map(row=>number(row?.number)).filter(Boolean))],
    teamDrivers:[...new Set(teamRows.map(row=>standingIdentity(row)).filter(Boolean))],
    teamKeys:[...new Set(teamRows.map(homeStandingKey))],
    teamLabel:league==='nrrs'?'Aetherwing car':'Highlighted driver / team car'
  };
}
