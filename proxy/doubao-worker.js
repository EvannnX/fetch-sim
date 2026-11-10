// Cloudflare Worker: forwards the page's requests to Doubao (Volcengine Ark) and keeps the API key on the server.
// Deploy:  npx wrangler deploy proxy/doubao-worker.js --name fetch-doubao
// Secret:  npx wrangler secret put ARK_API_KEY
// Optional: set ALLOWED_ORIGIN to your Pages URL, e.g. https://<user>.github.io
// Then paste the worker URL into the page's settings as "Proxy URL" and leave the key empty.
const ARK = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allow = env.ALLOWED_ORIGIN || '*';
    if (allow !== '*' && origin !== allow) return new Response('Forbidden', { status: 403 });
    const cors = {
      'Access-Control-Allow-Origin': allow === '*' ? '*' : origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return new Response('Use POST', { status: 405, headers: cors });
    const body = await req.text();
    if (body.length > 8_000_000) return new Response('Too large', { status: 413, headers: cors });
    const r = await fetch(ARK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.ARK_API_KEY },
      body,
    });
    return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } });
  },
};
