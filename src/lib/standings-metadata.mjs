const common=['Ford','Chevrolet','Toyota'];
const choices={nrrs:[...common,'Cadillac'],uarl:[...common,'Cadillac'],'uarl-d1':[...common,'Cadillac'],kmart:[...common,'Dodge'],sunoco:[...common,'RAM']};
const manufacturers={ford:'Ford',chevrolet:'Chevrolet',chevy:'Chevrolet',chev:'Chevrolet',toyota:'Toyota',cadillac:'Cadillac',dodge:'Dodge',ram:'RAM',honda:'Honda'};
const aliases={
 wispy:'hailey',haileybell:'hailey',aokikoto:'hailey',mymainisgone98:'matty',eazyonthafarilla:'eazy',willsracingdesigns:'will',deadmansrisin27:'eazy',gostclutch24:'clutch',mattycampbell:'matty',arcticblitzzzz:'jaxon',arctic:'jaxon',troopersregiment214:'cod',mannygtr:'manny',frogboy4783:'frogboy',player138164:'carl',player13:'carl',outlaw5948:'outlaw',trentplayz:'trent',retrosp4rkz:'sparklez',voidwinter:'alex',b4lalex:'alex',owenn001:'owen',montaque77:'tj',redfont:'redfont',rapperessnetioal:'chandler',stampy13:'stampy',bluelagoon1376:'nico',sbnjco:'nico',sbnjc:'nico',matts1964:'matt',tnfanracing:'tnfan',evilcharms:'ryan',emoflamingo:'flamingo',hotline:'hotline'
};

export function manufacturerChoices(league=''){
 return [...(choices[String(league||'').trim().toLowerCase()]||[])];
}

export function normalizeManufacturer(value=''){
 if(typeof value!=='string')return '';
 const text=value.trim();return manufacturers[text.toLowerCase()]||text;
}

export function standingIdentity(row={}){
 const value=typeof row==='string'?row:row?.driver;
 const key=String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 return aliases[key]||key;
}

// Labels are manually recorded facts, independent of points, cutoff position
// and whether the league has begun its Chase. Missing fields mean no label.
export function standingLabels(row={}){
 return [row?.chaseLocked===true?'CHASE LOCKED':'',row?.regularSeasonChampion===true?'REGULAR-SEASON CHAMPION':''].filter(Boolean);
}

// A driver can appear in both regular and Chase points. Explicit regular-row
// metadata wins, including false/Auto. Missing fields can inherit an existing
// Chase value before an editor adds defaults. Keep the supplied row's points.
export function standingMetadata(board={},row={}){
 const next={...row},identity=standingIdentity(row);
 const regular=identity&&Array.isArray(board?.rows)?board.rows.find(item=>standingIdentity(item)===identity):null;
 const chase=identity&&Array.isArray(board?.chaseRows)?board.chaseRows.find(item=>standingIdentity(item)===identity):null;
 for(const key of ['manufacturer','chaseLocked','regularSeasonChampion']){
  const source=[regular,row,chase].find(item=>item&&Object.hasOwn(item,key));
  if(source)next[key]=source[key];
 }
 return next;
}

function validRawMetadata(board){
 if(board?.rows!=null&&!Array.isArray(board.rows)||board?.chaseRows!=null&&!Array.isArray(board.chaseRows)||board?.ptEntry?.drivers!=null&&!Array.isArray(board.ptEntry.drivers))return false;
 const allowed=manufacturerChoices(board?.league||board?.id);
 for(const row of [...(board?.rows||[]),...(board?.chaseRows||[]),...(board?.ptEntry?.drivers||[])]){
  if(!row||typeof row!=='object'||Array.isArray(row))return false;
  for(const key of ['chaseLocked','regularSeasonChampion'])if(Object.hasOwn(row,key)&&typeof row[key]!=='boolean')return false;
  if(Object.hasOwn(row,'manufacturer')){
   if(typeof row.manufacturer!=='string'||row.manufacturer.length>80||/[<>]/.test(row.manufacturer))return false;
   const make=normalizeManufacturer(row.manufacturer);if(make&&allowed.length&&!allowed.includes(make))return false;
  }
 }
 return true;
}

// Validate raw values before merging, so an explicit regular false/Auto cannot
// hide a malformed Chase value. Invalid boards remain untouched for rejection
// by server validation; normalization never converts bad input into a save.
export function normalizeStandingMetadata(board={}){
 if(!board||typeof board!=='object'||Array.isArray(board)||!validRawMetadata(board))return board;
 const canonical=row=>{const next={...row};if(Object.hasOwn(next,'manufacturer'))next.manufacturer=normalizeManufacturer(next.manufacturer);return next;};
 const next={...board};
 if(Array.isArray(board.rows))next.rows=board.rows.map(row=>canonical(standingMetadata(board,row)));
 if(Array.isArray(board.chaseRows))next.chaseRows=board.chaseRows.map(row=>canonical(standingMetadata(next,row)));
 if(Array.isArray(board.ptEntry?.drivers))next.ptEntry={...board.ptEntry,drivers:board.ptEntry.drivers.map(canonical)};
 return next;
}
