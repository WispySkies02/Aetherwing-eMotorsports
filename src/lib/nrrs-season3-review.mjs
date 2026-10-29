import data from '../data/nrrs-season3-review.json' with {type:'json'};

export const storySlug='hailey-bell-nrrs-season-3-review';
export const races=data.races;
export const chase=races.filter(race=>race.round>=20);
const started=rows=>rows.filter(race=>race.finish!==null);
const sum=rows=>started(rows).reduce((total,race)=>total+race.finish,0);
const average=rows=>sum(rows)/started(rows).length;
const starts=started(races);
export const superspeedways=races.filter(race=>['Daytona','Talladega'].includes(race.track));
export const otherTracks=races.filter(race=>!superspeedways.includes(race));
export const stats={
  scheduled:races.length,starts:starts.length,missed:races.length-starts.length,
  sum:sum(races),average:average(races),totalEntries:data.totalEntries,
  averageFieldSize:data.totalEntries/races.length,
  topFive:starts.filter(race=>race.finish<=5).length,
  podiums:starts.filter(race=>race.finish<=3).length,
  wins:starts.filter(race=>race.finish===1).length,
  topFiveRate:starts.filter(race=>race.finish<=5).length/starts.length*100,
  best:starts.reduce((best,race)=>race.finish<best.finish?race:best),
  worst:starts.reduce((worst,race)=>race.finish>worst.finish?race:worst),
  superspeedwayAverage:average(superspeedways),otherAverage:average(otherTracks),
  chaseStarts:started(chase).length,chaseAverage:average(chase),
  chasePodiums:started(chase).filter(race=>race.finish<=3).length,
};
export const resultLabel=race=>race.finish===null?`DNS — ${race.dnsReason}`:`P${race.finish}`;
export const raceDetail=race=>`R${race.round} · ${race.track} · ${resultLabel(race)}${race.fieldSize?` of ${race.fieldSize}`:''}${race.qualifyingPosition?` · Qualified P${race.qualifyingPosition}; did not start`:''}`;
// Fixed readable spacing makes the chart scroll inside its panel on small screens.
// DNS is not a number on the finish axis and ends the current line segment.
export function finishChart(){
  const width=1200,height=370,left=52,right=30,top=38,bottom=282;
  const x=round=>left+(round-1)*(width-left-right)/24;
  const y=finish=>top+(finish-1)*(bottom-top)/8;
  const segments=[];let segment=[];
  for(const race of races){if(race.finish===null){if(segment.length)segments.push(segment);segment=[];}else segment.push({...race,x:x(race.round),y:y(race.finish)});}
  if(segment.length)segments.push(segment);
  return {width,height,left,right,top,bottom,x,y,dnsY:319,chaseX:(x(19)+x(20))/2,segments,
    paths:segments.map(points=>points.map((point,index)=>`${index?'L':'M'}${point.x},${point.y}`).join(' '))};
}
