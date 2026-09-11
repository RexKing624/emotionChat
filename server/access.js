import express from 'express';
import { randomBytes, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
const scrypt = promisify(derive);
export function createAccess(authPath) {
  const router = express.Router();
  const sessions = new Map();
  let failures = 0, blockedUntil = 0;
  const token = req => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('emotion_session='))?.slice(16);
  const authorized = req => (sessions.get(token(req)) || 0) > Date.now();
  async function read() { try { return JSON.parse(await fs.readFile(authPath, 'utf8')); } catch(e) { if(e.code === 'ENOENT') return null; throw e; } }
  function signIn(res) {
    for (const [key, expiry] of sessions) if (expiry <= Date.now()) sessions.delete(key);
    const id = randomBytes(32).toString('hex'); sessions.set(id, Date.now() + 12*60*60*1000);
    res.setHeader('Set-Cookie', `emotion_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`);
    res.json({ authenticated: true });
  }
  router.get('/status', async (req,res) => { try { res.json({ configured: Boolean(await read()), authenticated: authorized(req) }); } catch { res.status(500).json({error:'access_unavailable'}); } });
  router.post('/setup', async (req,res) => {
    if (!/^\d{6}$/.test(req.body?.pin || '')) return res.status(400).json({error:'six_digits'});
    try {
      if (await read()) return res.status(409).json({error:'already_configured'});
      const salt = randomBytes(16).toString('hex');
      const hash = (await scrypt(req.body.pin, salt, 64)).toString('hex');
      await fs.writeFile(authPath, JSON.stringify({version:1,algorithm:'scrypt',salt,hash},null,2), {flag:'wx',mode:0o600});
      signIn(res);
    } catch(e) { res.status(e.code === 'EEXIST' ? 409 : 500).json({error:'setup_failed'}); }
  });
  router.post('/unlock', async (req,res) => {
    if (Date.now() < blockedUntil) return res.status(429).json({error:'try_later'});
    if (!/^\d{6}$/.test(req.body?.pin || '')) return res.status(400).json({error:'six_digits'});
    // Count before the expensive hash so concurrent requests cannot bypass the cooldown.
    failures++; if (failures >= 5) blockedUntil = Date.now() + 30000;
    try {
      const saved = await read();
      if (!saved) return res.status(409).json({error:'not_configured'});
      const hash = await scrypt(req.body.pin, saved.salt, 64);
      if (!timingSafeEqual(hash, Buffer.from(saved.hash,'hex'))) return res.status(401).json({error:'wrong_pin'});
      failures = 0; blockedUntil = 0; signIn(res);
    } catch { res.status(500).json({error:'unlock_failed'}); }
  });
  router.post('/lock', (req,res) => { sessions.delete(token(req)); res.setHeader('Set-Cookie','emotion_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ok:true}); });
  return {router, async verifyPin(pin) {
    if(Date.now()<blockedUntil) throw Object.assign(new Error('try_later'),{status:429});
    if(typeof pin !== 'string'||!/^\d{6}$/.test(pin))throw Object.assign(new Error('six_digits'),{status:400});
    failures++;if(failures>=5)blockedUntil=Date.now()+30000;
    const saved=await read();
    if(!saved || !timingSafeEqual(await scrypt(pin,saved.salt,64),Buffer.from(saved.hash,'hex')))throw Object.assign(new Error('wrong_pin'),{status:403});
    failures=0;blockedUntil=0;
  }, guard(req,res,next) { if(!authorized(req)) return res.status(401).json({error:'locked'}); next(); }};
}
