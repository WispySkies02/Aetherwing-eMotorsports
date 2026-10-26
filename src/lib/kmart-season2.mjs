import data from '../data/kmart-season2-chart-data.json' with { type:'json' };

export const season = data;
export const checkpoints = data.checkpoints;
export const latest = checkpoints.at(-1);
export const transferIndex = checkpoints.findIndex(point=>point.isAdministrativeTransfer);
export const storySlug = 'from-fourth-to-first-hailey-bell-kmart-chase';
export const drivers = [
  {id:'hailey',name:'Hailey Bell',color:'#4a6fff'},
  {id:'will',name:'Will',color:'#dfc891'},
  {id:'jaxon',name:'Jaxon · departed',color:'#bd98d0'},
  {id:'carl',name:'Carl',color:'#8ac6bc'},
  {id:'sparklez',name:'Sparklez',color:'#c9cdd2'},
  {id:'tj',name:'TJ',color:'#dd9a82'},
  {id:'outlaw',name:'Outlaw',color:'#a5b58a'}
];
export const presets = { story:['hailey','will','jaxon'], chase:['hailey','will','carl','sparklez','tj','outlaw'] };
export const shortLabels = ['Daytona','Fontana','Las Vegas','COTA','Phoenix','Michigan','Rockingham','Portland','Transfer','Martinsville','Talladega'];
export const valueAt = (point,id,mode='official') => id==='hailey' ? point[mode==='earned'?'haileyRaceEarned':'haileyOfficial'] : point[id];
export const raceNumber = index => checkpoints.slice(0,index+1).filter(point=>!point.isAdministrativeTransfer).length;
export const dateLabel = date => new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
export const math = {
  lead:latest.haileyOfficial-latest.will,
  transferred:data.transferPoints,
  chaseCutoffDriver:'Trent',chaseCutoffPoints:125,
  remainingMaximum:data.remainingRegularSeasonRaces*data.maximumRacePoints,
  thresholdAfter:completedFromNow=>(data.remainingRegularSeasonRaces-completedFromNow)*data.maximumRacePoints+1
};
export const nextRaces = [
  {date:'2026-11-02',track:'Iowa',title:'MasterPro Iowa 200',eyebrow:'NOT YET',detail:`Six races remain afterward: an outright clinch needs a ${math.thresholdAfter(1)}-point lead over every rival. Even a maximum swing over Will would leave Bell at +${math.lead+data.maximumRacePoints}.`},
  {date:'2026-11-09',track:'Mexico City',title:'Corona Mexico 250',eyebrow:'EARLIEST OPPORTUNITY',detail:`A ${math.thresholdAfter(2)}-point lead over every eligible rival would secure the regular season. Bell must outscore Will by ${math.thresholdAfter(2)-math.lead} across Iowa and Mexico, while keeping every other rival out of reach.`},
  {date:'2026-11-16',track:'New Hampshire',title:'USAA Salute to Service 250',eyebrow:'ANOTHER OPPORTUNITY',detail:`The outright threshold falls to ${math.thresholdAfter(3)}. Existing season-wide scoring averages project a lead of about ${Math.round(math.lead+(latest.haileyRaceEarned-latest.will)/data.pointsEventsComplete*3)} over Will — conditional pace, not a prediction or guarantee.`},
  {date:'2026-12-21',track:'Darlington',title:'Goodyear Southern 300',eyebrow:'THE CHASE BEGINS',detail:'Six drivers. Six races. No eliminations. A regular-season title would earn 2,100 starting points, only 25 ahead of second. The overall championship is a new fight.'}
];

export function chartModel(mode='official',ids=presets.story,width=960,height=340) {
  width=Math.max(260,width);
  const left=44,right=18,top=32,bottom=50,max=Math.ceil(Math.max(...checkpoints.map(point=>point.haileyOfficial))/100)*100;
  const x=index=>left+index*(width-left-right)/(checkpoints.length-1);
  const y=value=>top+(1-value/max)*(height-top-bottom);
  const series=drivers.filter(driver=>ids.includes(driver.id)).map(driver=>{
    let drawing=false;
    const path=checkpoints.map((point,index)=>{
      const value=valueAt(point,driver.id,mode);
      if(value===null||!Number.isFinite(value)){drawing=false;return '';}
      const segment=`${drawing?'L':'M'}${x(index).toFixed(2)},${y(value).toFixed(2)}`;
      drawing=true;return segment;
    }).filter(Boolean).join(' ');
    return {...driver,path,points:checkpoints.flatMap((point,index)=>{const value=valueAt(point,driver.id,mode);return value===null||!Number.isFinite(value)?[]:[{index,value,x:x(index),y:y(value)}];})};
  });
  const visibleTicks=width>=720?shortLabels.map((_,index)=>index):width>=500?[0,3,7,10]:[0,5,10];
  return {width,height,left,right,top,bottom,max,x,y,series,ticks:[0,200,400,600],labels:shortLabels.map((label,index)=>({label,index,x:x(index)})).filter(tick=>visibleTicks.includes(tick.index))};
}
