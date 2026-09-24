const { read, json, normalizeDriverAssignments } = require('./_content.cjs');
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error:'Method not allowed.' });
  try {
    const { registry } = await read();
    const datasets={...registry.published};
    if(Array.isArray(datasets.drivers))datasets.drivers=normalizeDriverAssignments(datasets.drivers);
    if(Array.isArray(datasets.results))datasets.results=datasets.results.map((race)=>({...race,entries:(race.entries||[]).map((entry)=>entry?.assignmentId==='shared-kmart'||(String(entry?.number)==='29'&&/Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.driver||''))?{...entry,assignmentId:'',driver:'Part-Time Entry'}:entry)}));
    return json(200, { version:1, revision:registry.revision, datasets });
  } catch (error) {
    console.error('site-data', error);
    return json(503, { error:'Published site content is temporarily unavailable.' });
  }
};
