// No third-party runtime dependencies. Never log requests, IPs or payloads.
const EXTENSION = 'chrome-extension://gcngilgdbfbghagejgjependcpbckdig';
const ORIGINS = new Set(['https://letemcookie.com', 'https://www.letemcookie.com', EXTENSION]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = (origin) => ({
  'Access-Control-Allow-Origin': ORIGINS.has(origin) ? origin : 'https://letemcookie.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin', 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
});
export async function hashIP(ip, day, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, enc.encode(day+'|'+ip));
  return Array.from(new Uint8Array(digest), b=>b.toString(16).padStart(2,'0')).join('');
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = request.headers.get('Origin') || '';
    const response = (body, status=200) => new Response(JSON.stringify(body), {status,headers:headers(origin)});
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:headers(origin)});
    try {
      if (url.pathname === '/stats' && request.method === 'GET') {
        const total = await env.DB.prepare('SELECT eaten FROM totals WHERE id=1').first();
        return response({eaten:total?.eaten || 0, metric:'observed_banner_dismissals', since:env.COUNTING_SINCE || null});
      }
      if (url.pathname !== '/eat' || request.method !== 'POST') return response({error:'not found'},404);
      // This is a speed bump, not authentication: a public extension cannot keep a secret.
      if (origin !== EXTENSION) return response({error:'origin'},403);
      if (!env.IP_HMAC_SECRET) return response({error:'not ready'},503);
      if (Number(request.headers.get('Content-Length') || 0)>256) return response({error:'too large'},413);
      const raw = await request.text();
      if (raw.length>256) return response({error:'too large'},413);
      let data; try { data=JSON.parse(raw); } catch { return response({error:'json'},400); }
      if (!data || Object.keys(data).length!==1 || !UUID.test(data.event || '')) return response({error:'event'},400);
      const ip=request.headers.get('CF-Connecting-IP');
      if (!ip) return response({error:'network'},400);
      const now=Date.now(), day=new Date(now).toISOString().slice(0,10);
      const hash=await hashIP(ip,day,env.IP_HMAC_SECRET);
      await env.DB.prepare('INSERT OR IGNORE INTO events(id,day,hash,received) VALUES(?,?,?,?)').bind(data.event,day,hash,now).run();
      // Successful duplicates and per-IP capped events both acknowledge without recounting.
      return response({ok:true});
    } catch { return response({error:'unavailable'},503); }
  },
  async scheduled(event,env,ctx) {
    // Keep raw-IP-derived hashes and dedup IDs only for 48 hours; aggregates survive.
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare('DELETE FROM events WHERE received < ?').bind(Date.now()-47*3600*1000),
      env.DB.prepare('DELETE FROM clients WHERE day < ?').bind(new Date(Date.now()-23*3600*1000).toISOString().slice(0,10))
    ]));
  }
};
