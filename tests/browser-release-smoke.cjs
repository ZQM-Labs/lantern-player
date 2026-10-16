const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

function startServer() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\\/+/, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) { res.writeHead(403).end('Forbidden'); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(bytes);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function enterDemo(page) {
  await page.locator('#btn-start').click();
  await page.locator('[data-pick="cozy"]').click();
  await page.locator('#screen-map.active').waitFor();
  await page.locator('#next-stop').waitFor();
  const text = await page.locator('#next-stop').innerText();
  if (!text.trim()) throw new Error('Map opened but no next-stop content rendered');
}

(async () => {
  const server = await startServer();
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await page.addInitScript(() => localStorage.setItem('lantern-state', '{malformed'));
    await page.goto(base + '/?demo=1', { waitUntil: 'networkidle' });
    await page.locator('#screen-start.active').waitFor();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('service worker did not take control')), 10000);
          navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timeout); resolve(); }, { once: true });
        });
      }
    });
    for (let attempt = 1; attempt < 20; attempt++) {
      await page.reload({ waitUntil: 'networkidle' });
      await page.locator('#screen-start.active').waitFor();
    }
    await page.evaluate(() => localStorage.setItem('lantern-lang', 'es'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.lang === 'es');
    await enterDemo(page);
    await context.setOffline(true);
    for (let cycle = 1; cycle <= 5; cycle++) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#screen-start.active').waitFor();
      await page.waitForFunction(() => document.documentElement.lang === 'es');
      await enterDemo(page);
    }
    if (pageErrors.length) throw new Error('Uncaught browser errors: ' + pageErrors.join(' | '));
    console.log('PASS: 20 startup checks; corrupt saved state recovery; Spanish language load; 5 offline launch-and-play cycles.');
  } finally {
    await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
