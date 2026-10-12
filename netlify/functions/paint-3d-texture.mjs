// Web Response + ReadableStream: avoids the 6 MB buffered response ceiling.
// Existing public URL remains /api/paint-3d-texture/:hash.png.
export default async (request) => {
  if (request.method !== 'GET') return new Response('GET only.', { status: 405, headers: { allow: 'GET' } });
  const name = (new URL(request.url).searchParams.get('id') || '').replace(/\.png$/, '');
  if (!/^[a-f0-9]{64}$/.test(name)) return new Response('Not found.', { status: 404 });
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: 'aetherwing-3d-textures', consistency: 'strong' });
    const stream = await store.get(`textures/${name}`, { type: 'stream' });
    if (!stream) return new Response('Not found.', { status: 404 });
    return new Response(stream, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public,max-age=31536000,immutable',
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('paint-3d-texture', error);
    return new Response('Temporarily unavailable.', { status: 503 });
  }
};
