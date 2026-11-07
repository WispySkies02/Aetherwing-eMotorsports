import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {homeStandings} from '../src/lib/home-standings.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const scratch=fs.mkdtempSync(join(tmpdir(),'aetherwing-home-standings-')),cwd=join(scratch,'site');
const {seeds}=createRequire(import.meta.url)('../netlify/lib/_content.cjs');
const baseline=seeds(),original=fs.readFileSync(join(root,'src/data/admin-content.json'),'utf8');
async function build(){
 const env={...process.env,ASTRO_TELEMETRY_DISABLED:'1',AETHERWING_CONTENT_URL:''};delete env.NETLIFY;
 await new Promise((resolve,reject)=>{
  const child=spawn('npm',['run','build'],{cwd,env,shell:false});let output='';
  child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
  child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(output.slice(-7000))));
 });
}
try{
 fs.cpSync(root,cwd,{recursive:true,filter:source=>!['.git','node_modules','.astro','dist'].includes(relative(root,source).split(sep)[0])});
 fs.symlinkSync(join(root,'node_modules'),join(cwd,'node_modules'),'junction');
 for(const [id,table] of [['kmart','regular'],['sunoco','chase']]){
  const data=structuredClone(baseline);
  for(const board of data.standings){board.featuredOnHome=board.id===id;if(board.id===id)board.homeTable=table;}
  const selected=data.standings.find(board=>board.id===id);
  if(id==='sunoco'){
   selected.chaseRows=[{position:'P1',number:'54',driver:'Hailey',points:123,delta:'LEADER',positionChange:1,highlight:true,chaseLocked:true,regularSeasonChampion:true}];
  }
  const expected=homeStandings(data.standings,data.drivers);
  fs.writeFileSync(join(cwd,'src/data/admin-content.json'),JSON.stringify({version:1,revision:500,datasets:data}));
  await build();
  const overlay=JSON.parse(fs.readFileSync(join(cwd,'src/data/admin-content.json'),'utf8'));
  assert.deepEqual(overlay.datasets.standings,data.standings,'Build synchronization preserves the exact approved boards and selection');
  const dom=new JSDOM(fs.readFileSync(join(cwd,'dist/index.html'),'utf8'));
  try{
   const document=dom.window.document,card=document.querySelector('.hub-battle__card'),tower=document.querySelector('[data-timing-tower]');
   assert.equal(card.dataset.homeStandingsId,id,'SSR card selects the published board');assert.equal(card.dataset.homeStandingsTable,table);
   assert.equal(tower.dataset.homeStandingsId,id,'SSR tower selects the same board');assert.equal(tower.dataset.homeStandingsTable,table);
   assert.equal(document.querySelector('[data-battle-heading]').textContent,`${expected.focusRow.driver} · ${expected.focusRow.position}`);
   assert.equal(document.querySelector('[data-battle-leader]').textContent,expected.leader.driver);
   assert.equal(document.querySelector('[data-battle-gap]').textContent,expected.focusGap);
   assert.equal(tower.querySelector('[data-tower-title]').textContent,expected.title);
   assert.match(document.querySelector('[data-battle-context]').textContent,new RegExp(Number(expected.focusRow.points).toLocaleString('en-US')));
   if(id==='kmart')assert.equal(tower.querySelector('[data-tower-cut]').textContent,'Chase cutoff · Top 6 full-time drivers');
   else{assert.equal(tower.querySelector('[data-tower-cut]').hidden,true,'Chase-only points do not invent a regular-season cutoff');assert.match(tower.textContent,/CHASE LOCKED/);}
   assert.equal(document.querySelector('.hub-wire__lead').getAttribute('href'),'/news/hailey-bell-nrrs-season-3-review/','Standings selection does not alter the featured story');
  }finally{dom.window.close();}
 }
 assert.equal(fs.readFileSync(join(root,'src/data/admin-content.json'),'utf8'),original,'Isolated builds leave the working source overlay intact');
 console.log('PASS: isolated Kmart regular and Sunoco Chase production builds retain homepage selection, identical card/tower snapshots, correct cutoff/manual labels, unchanged source overlay and featured news.');
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
