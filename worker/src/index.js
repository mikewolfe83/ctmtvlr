/**
 * CTM Creator Studio: secure edge login and protected static assets.
 * Secrets are created with `npx wrangler secret put`, never committed to GitHub.
 * Every request for a private static asset passes through this Worker first.
 */
const COOKIE = '__Host-ctm_studio';
const CSRF_COOKIE = '__Host-ctm_csrf';
const CSRF_SECONDS = 20 * 60;
const SESSION_SECONDS = 8 * 60 * 60;
const te = new TextEncoder();

const securityHeaders = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
};

function decorate(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function html(body, status = 200, extras = {}) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...securityHeaders, ...extras } });
}
function redirect(path, extras = {}) {
  return new Response(null, { status: 303, headers: { Location: path, ...securityHeaders, ...extras } });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function loginPage(message = '', csrf = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex,nofollow"/>
  <title>CTM Creator Studio — Sign In</title>
  <style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 15% 0%,#28151c,#090b0f 60%);color:#fff;font:16px/1.55 system-ui,"Segoe UI",Arial,sans-serif}main{width:min(440px,calc(100% - 32px));background:#13161d;border:1px solid #37373e;padding:38px;box-shadow:0 28px 65px #0008}.eyebrow{font-size:11px;letter-spacing:2px;color:#f0444d;font-weight:800}h1{font-size:40px;letter-spacing:-1.8px;line-height:1.1;margin:10px 0}p{color:#a6a7b0;font-size:13px;margin-bottom:26px}label{display:block;margin:14px 0 5px;font-size:11px;letter-spacing:1px;font-weight:800;color:#bbb}input{width:100%;padding:13px 14px;background:#090b0f;border:1px solid #5b5962;color:#fff;font-size:15px;border-radius:0}input:focus{outline:2px solid #f0444d;outline-offset:1px}button{width:100%;background:#e23542;color:#fff;font-weight:900;letter-spacing:1px;border:0;padding:15px;margin-top:23px;cursor:pointer}button:hover{background:#c72232}.error{background:#38181d;border:1px solid #a13c4a;color:#ffbdc3;padding:10px;font-size:13px}footer{margin-top:24px;color:#85858d;font-size:11px;text-align:center}a{color:#d7d7dc}</style>
  </head><body><main><div class="eyebrow">CTM MEDIA NETWORK / PRIVATE WORKSPACE</div>
  <h1>CREATOR <span style="color:#f0444d">STUDIO.</span></h1><p>Sign in to access the CTM podcast research dashboard.</p>
  ${message ? `<div class="error" role="alert">${escapeHtml(message)}</div>` : ''}
  <form method="post" action="/login" autocomplete="on"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"/><label for="u">USERNAME</label><input id="u" name="username" type="text" autocomplete="username" maxlength="120" required autofocus/>
  <label for="p">PASSWORD</label><input id="p" name="password" type="password" autocomplete="current-password" maxlength="512" required/>
  <button type="submit">SIGN IN ↗</button></form>
  <footer>Access restricted to authorized CTM team members.</footer></main></body></html>`;
}

async function sha256(text) { return new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(text))); }
function equalBytes(a, b) { let diff = a.length ^ b.length; for (let i=0; i<Math.max(a.length,b.length); i++) diff |= (a[i]||0) ^ (b[i]||0); return diff === 0; }
function encode64(bytes) { let s=''; for(let i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function decode64(str) { const raw=atob(str.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-str.length%4)%4));return Uint8Array.from(raw, ch=>ch.charCodeAt(0)); }
async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', te.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,te.encode(message)));
}
async function makeSession(env) {
  const payload = encode64(te.encode(JSON.stringify({u:env.STUDIO_USERNAME, exp:Math.floor(Date.now()/1000)+SESSION_SECONDS})));
  return `${payload}.${encode64(await hmac(env.SESSION_SECRET,payload))}`;
}
async function validSession(req, env) {
  const value = (req.headers.get('Cookie') || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1);
  if(!value || value.length>2000) return false;
  const parts = value.split('.'); if (parts.length !== 2) return false;
  try {
    const signature = await hmac(env.SESSION_SECRET,parts[0]);
    if(!equalBytes(signature,decode64(parts[1]))) return false;
    const body = JSON.parse(new TextDecoder().decode(decode64(parts[0])));
    return body.u===env.STUDIO_USERNAME && Number.isSafeInteger(body.exp) && body.exp>Math.floor(Date.now()/1000);
  } catch { return false; }
}
// The browser Origin header can be absent or modified by privacy/proxy software.
// Use a per-form CSRF token, stored in a Secure __Host- cookie, instead of
// making successful logins depend on one specific browser header.
function freshCsrf() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encode64(bytes);
}
function cookieValue(request, name) {
  const prefix = `${name}=`;
  return (request.headers.get('Cookie') || '').split(';').map(x => x.trim())
    .find(x => x.startsWith(prefix))?.slice(prefix.length) || '';
}
function validCsrf(request, token) {
  const fromCookie = cookieValue(request, CSRF_COOKIE);
  const fromForm = String(token || '');
  const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
  return tokenPattern.test(fromCookie) && tokenPattern.test(fromForm)
    && equalBytes(te.encode(fromCookie), te.encode(fromForm));
}
function csrfCookieHeader(token, maxAge=CSRF_SECONDS) {
  return `${CSRF_COOKIE}=${token}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
function serveLogin(message='', status=200) {
  const token = freshCsrf();
  return html(loginPage(message, token), status, {'Set-Cookie': csrfCookieHeader(token)});
}
function cookieHeader(value, maxAge=SESSION_SECONDS) { return `${COOKIE}=${value}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`; }

export default {
  async fetch(request, env) {
    // Fail closed if credentials are missing.
    if (!env.STUDIO_USERNAME || !env.STUDIO_PASSWORD || !env.SESSION_SECRET || !env.ASSETS) {
      return html('<h1>CTM Studio not configured</h1><p>Set the three Wrangler secrets before publishing the Studio.</p>', 503);
    }
    const url = new URL(request.url);
    const route = url.pathname;
    if (route === '/login' && request.method === 'GET') {
      if (await validSession(request, env)) return redirect('/');
      return serveLogin();
    }
    if (route === '/login' && request.method === 'POST') {
      if (!(request.headers.get('Content-Type')||'').startsWith('application/x-www-form-urlencoded')) return serveLogin('Please use the login form.',415);
      if (Number(request.headers.get('Content-Length')||0)>4096) return serveLogin('Invalid login submission.',413);
      const submitted = (await request.text()).slice(0,4097);
      if (submitted.length>4096) return serveLogin('Invalid login submission.',413);
      const fields = new URLSearchParams(submitted);
      if (!validCsrf(request, fields.get('csrf'))) return serveLogin('Login form expired or cookies are disabled. Reload this page and try again.',403);
      const username = fields.get('username') || '';
      const password = fields.get('password') || '';
      if (username.length>120 || password.length>512) return serveLogin('Invalid login submission.',401);
      // Hash each side so comparison is constant-time. The password is a Worker secret, never in a static file.
      const [actual, wanted] = await Promise.all([
        sha256(`${username}\0${password}`),
        sha256(`${env.STUDIO_USERNAME}\0${env.STUDIO_PASSWORD}`)
      ]);
      if(!equalBytes(actual,wanted)) return serveLogin('Invalid username or password.',401);
      const session=await makeSession(env);
      return redirect('/', {'Set-Cookie':cookieHeader(session)});
    }
    if (route === '/logout' && request.method === 'POST') {
      if (!(request.headers.get('Content-Type')||'').startsWith('application/x-www-form-urlencoded')) {
        return new Response('Forbidden',{status:403,headers:securityHeaders});
      }
      if (Number(request.headers.get('Content-Length')||0)>4096) return new Response('Forbidden',{status:403,headers:securityHeaders});
      const submitted = (await request.text()).slice(0,4097);
      if (submitted.length>4096 || !validCsrf(request,new URLSearchParams(submitted).get('csrf'))) {
        return new Response('Forbidden',{status:403,headers:securityHeaders});
      }
      return redirect('/login',{'Set-Cookie':cookieHeader('',0)});
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed',{status:405,headers:securityHeaders});
    if (!await validSession(request,env)) return redirect('/login');
    const isStudioDocument=route==='/' || route==='/index.html' || route==='/studio.html';
    // The authenticated HTML and every CSS/JS/image request are protected by the Worker.
    let assetResponse;
    if (isStudioDocument) {
      assetResponse=await env.ASSETS.fetch(new Request(new URL('/studio.html',url),request));
      if(assetResponse.ok && request.method==='GET') {
        const csrf = freshCsrf();
        assetResponse=new HTMLRewriter().on('[data-public-home]', {
          element(el) { el.setAttribute('href', env.PUBLIC_SITE_URL || 'https://www.youtube.com/@ctmtvlr'); }
        }).on('form[action="/logout"]', {
          element(el) { el.append(`<input type="hidden" name="csrf" value="${csrf}">`,{html:true}); }
        }).transform(assetResponse);
        const headers = new Headers(assetResponse.headers);
        headers.append('Set-Cookie', csrfCookieHeader(csrf));
        assetResponse = new Response(assetResponse.body,{status:assetResponse.status,headers});
      }
    } else if (route.startsWith('/assets/') || route==='/styles.css' || route==='/studio.js') {
      assetResponse=await env.ASSETS.fetch(request);
    } else {
      return new Response('Not Found',{status:404,headers:securityHeaders});
    }
    return decorate(assetResponse);
  }
};
