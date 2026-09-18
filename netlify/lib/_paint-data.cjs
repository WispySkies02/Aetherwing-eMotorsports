const { json, publicRegistry, readRegistry } = require('./_registry.cjs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' }, { allow: 'GET' });
  try {
    const registry = await readRegistry();
    return json(200, publicRegistry(registry), { 'cache-control': 'public, max-age=0, must-revalidate' });
  } catch (error) {
    console.error('paint-data', error);
    return json(503, { error: 'The published paint registry is temporarily unavailable.' });
  }
};
