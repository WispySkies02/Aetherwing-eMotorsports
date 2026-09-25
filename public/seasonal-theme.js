(()=>{
  const THEMES={
    'summer-end':{title:"SUMMER'S END",subtitle:'LAST LIGHT OF THE SEASON'},
    'halloween-teaser':{title:'HALLOWEEN IS CREEPING IN',subtitle:'SUBTLE SPOOKY SEASON'},
    'halloween':{title:'SPOOKY SEASON',subtitle:'AETHERWING AFTER DARK'},
    'halloween-week':{title:'HALLOWEEN WEEK',subtitle:'FULL SEND · FULL SPOOKY'},
    'fall':{title:'FALL AT AETHERWING',subtitle:'COOL AIR · HOT LAPS'},
    'christmas-teaser':{title:'CHRISTMAS IS COMING',subtitle:'FIRST LIGHTS OF THE SEASON'},
    'christmas':{title:'CHRISTMAS / WINTER',subtitle:'RACE THROUGH THE HOLIDAYS'},
    'christmas-week':{title:'CHRISTMAS WEEK',subtitle:'MERRY & BRIGHT · AETHERWING'},
    'calm-winter':{title:'WINTER RESET',subtitle:'QUIET DAYS · NEXT RACE AHEAD'},
    'new-year':{title:'NEW YEAR',subtitle:'NEW LAPS · SAME FIGHT'},
    'clean-winter':{title:'CLEAN WINTER',subtitle:'COLD AIR · CLEAR FOCUS'},
    'valentine-teaser':{title:'VALENTINE TEASER',subtitle:'A LITTLE HEART IN THE GARAGE'},
    'valentine':{title:"VALENTINE'S WEEK",subtitle:'LOVE THE RACE · LOVE THE TEAM'},
    'late-winter':{title:'LATE WINTER',subtitle:'THE THAW IS COMING'},
    'spring':{title:'SPRING',subtitle:'FRESH SEASON · FRESH START'},
    'st-patrick':{title:"ST. PATRICK'S DAY",subtitle:'A FLASH OF GREEN'},
    'easter':{title:'EASTER / SPRING',subtitle:'HOPE · RENEWAL · NEW BEGINNINGS'},
    'memorial-day':{title:'MEMORIAL DAY',subtitle:'REMEMBER & HONOR'},
    'summer':{title:'SUMMER',subtitle:'LONG DAYS · FAST LAPS'},
    'independence-day':{title:'INDEPENDENCE DAY',subtitle:'RED · WHITE · BLUE'},
  };
  const pad=(value)=>String(value).padStart(2,'0');
  const dateKey=(year,month,day)=>`${year}-${pad(month)}-${pad(day)}`;
  const partsInEastern=(date=new Date())=>{
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter((p)=>p.type!=='literal').map((p)=>[p.type,p.value]));
    return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day)};
  };
  const easterSunday=(year)=>{
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(Date.UTC(year,month-1,day));
  };
  const memorialDay=(year)=>{
    const last=new Date(Date.UTC(year,4,31));
    last.setUTCDate(31-((last.getUTCDay()+6)%7));
    return last;
  };
  const thanksgiving=(year)=>{
    const first=new Date(Date.UTC(year,10,1));
    const firstThursday=1+((4-first.getUTCDay()+7)%7);
    return new Date(Date.UTC(year,10,firstThursday+21));
  };
  const between=(key,start,end)=>key>=start&&key<=end;
  function automaticTheme({year,month,day}){
    const key=dateKey(year,month,day);
    if(key===dateKey(year,12,31)||key===dateKey(year,1,1))return 'new-year';
    if(month===1&&day>=2)return 'clean-winter';
    if(month===2&&day<=7)return 'valentine-teaser';
    if(month===2&&day<=14)return 'valentine';
    if(month===2)return 'late-winter';
    if(month===3&&day===17)return 'st-patrick';
    const easter=easterSunday(year),easterStart=new Date(easter);easterStart.setUTCDate(easter.getUTCDate()-6);
    const easterStartKey=easterStart.toISOString().slice(0,10),easterKey=easter.toISOString().slice(0,10);
    if(between(key,easterStartKey,easterKey))return 'easter';
    const memorial=memorialDay(year),memorialStart=new Date(memorial);memorialStart.setUTCDate(memorial.getUTCDate()-3);
    if(between(key,memorialStart.toISOString().slice(0,10),memorial.toISOString().slice(0,10)))return 'memorial-day';
    if((month===3&&day>=1)||(month===4)||(month===5&&key<memorialStart.toISOString().slice(0,10)))return 'spring';
    if(month===5&&key>memorial.toISOString().slice(0,10))return 'summer';
    if(month===6&&day<=27)return 'summer';
    if((month===6&&day>=28)||(month===7&&day<=4))return 'independence-day';
    if((month===7&&day>=5)||month===8&&day<=24)return 'summer';
    if(year===2026&&month===9&&day>=20&&day<=24)return 'summer-end';
    if(year!==2026&&((month===8&&day>=25)||(month===9&&day<=7)))return 'summer-end';
    if(year!==2026&&month===9&&day>=8&&day<=24)return 'standard';
    if(year===2026&&month===9&&day<20)return 'standard';
    if(month===9&&day>=25)return 'halloween-teaser';
    if(month===10&&day<=24)return 'halloween';
    if(month===10)return 'halloween-week';
    const thanks=thanksgiving(year).toISOString().slice(0,10);
    if(month===11&&key<=thanks)return 'fall';
    if(month===11)return 'christmas-teaser';
    if(month===12&&day<=17)return 'christmas';
    if(month===12&&day<=25)return 'christmas-week';
    if(month===12&&day<=30)return 'calm-winter';
    return 'standard';
  }
  function resolveTheme(){
    const forced=new URLSearchParams(location.search).get('season');
    if(forced==='off'||forced==='standard')return 'standard';
    if(forced&&Object.hasOwn(THEMES,forced))return forced;
    return automaticTheme(partsInEastern());
  }
  function apply(){
    const theme=resolveTheme();
    if(theme==='standard')delete document.documentElement.dataset.season;else document.documentElement.dataset.season=theme;
    window.__AETHERWING_SEASON__={id:theme,...(THEMES[theme]||{title:'',subtitle:''})};
    const banner=document.querySelector('[data-season-banner]');
    if(banner){
      const info=window.__AETHERWING_SEASON__,active=theme!=='standard';
      banner.hidden=!active;
      banner.setAttribute('aria-label',active?`${info.title} seasonal theme`:'Seasonal theme');
      const title=banner.querySelector('[data-season-title]'),subtitle=banner.querySelector('[data-season-subtitle]');
      if(title)title.textContent=info.title||'';
      if(subtitle)subtitle.textContent=info.subtitle||'';
    }
  }
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  setInterval(apply,60*1000);
})();
