import fs from 'node:fs';
import { createRequire } from 'node:module';
import { prepareConfirmedRacingUpdates } from '../src/lib/confirmed-racing-updates.mjs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Usage: node scripts/prepare-confirmed-racing-updates.mjs published-feed.json prepared-feed.json');
if(input===output)throw new Error('Use a separate output file to preserve the original publication.');
const prepared=prepareConfirmedRacingUpdates(JSON.parse(fs.readFileSync(input,'utf8')));
const {validate,normalize}=createRequire(import.meta.url)('../netlify/lib/_content.cjs');
for(const key of ['schedule-events','results']){
  prepared.datasets[key]=normalize(key,prepared.datasets[key]);
  const error=validate(key,prepared.datasets[key],{published:prepared.datasets});
  if(error)throw new Error(`${key}: ${error}`);
}
fs.writeFileSync(output,JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});
console.log(`Prepared ${prepared.preparedUpdate} from revision ${prepared.revision??'unknown'} in ${output}. No live data was written.`);
