const { read, json, normalizeDriverAssignments, seeds } = require('./_content.cjs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error:'Method not allowed.' });
  try {
    const { registry } = await read();
    const seed = seeds();
    const drivers = normalizeDriverAssignments(registry.published?.drivers ?? seed.drivers ?? []).map((entry)=>({
      id:entry?.id||'',
      profile:entry?.profile||'',
      displayName:entry?.displayName||'',
      competitionId:entry?.competitionId||'',
      number:String(entry?.number||''),
      numberImage:entry?.numberImage||'',
      numberImageBackup:entry?.numberImageBackup||''
    }));
    const profiles = (registry.published?.['roster-profiles'] ?? seed['roster-profiles'] ?? []).map((profile)=>({
      slug:profile?.slug||'',
      signatureLogo:profile?.signatureLogo||''
    }));
    return json(200, { version:1, revision:registry.revision, drivers, profiles });
  } catch (error) {
    console.error('driver-art', error);
    return json(503, { error:'Published driver artwork is temporarily unavailable.' });
  }
};
