/* Browser tests: serves the package over HTTP, opens test/browser/index.html
   in headless Chrome over the DevTools protocol, and reports its results.
   No dependencies; needs Chrome or Chromium. Set CHROME_PATH if it isn't
   found. `--reduced-motion` runs the suite with reduced motion forced on. */

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const known = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].find((file) => fs.existsSync(file));
  if (known) return known;
  for (const name of ['google-chrome', 'chromium', 'chromium-browser']) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  }
  return null;
}

const chromePath = findChrome();
if (!chromePath) {
  console.log('Skipping browser tests: no Chrome found (set CHROME_PATH).');
  process.exit(0);
}

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

const reducedMotion = process.argv.includes('--reduced-motion');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'robo-folk-chrome-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  ...(reducedMotion ? ['--force-prefers-reduced-motion'] : []),
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let exitCode = 1;
try {
  // Chrome prints its DevTools address once it's listening.
  const browserUrl = await new Promise((resolve, reject) => {
    let output = '';
    chrome.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) resolve(match[1]);
    });
    chrome.on('exit', () => reject(new Error(`Chrome exited before starting:\n${output}`)));
  });
  const { port } = new URL(browserUrl);
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));
  let nextId = 0;
  const pending = new Map();
  const pageErrors = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id) { pending.get(msg.id)?.(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') {
      const details = msg.params.exceptionDetails;
      pageErrors.push(details.exception?.description ?? details.text);
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    pending.set(++nextId, resolve);
    ws.send(JSON.stringify({ id: nextId, method, params }));
  });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;

  await send('Runtime.enable');
  const { port: serverPort } = server.address();
  await send('Page.navigate', { url: `http://127.0.0.1:${serverPort}/test/browser/index.html` });

  let results;
  for (let waited = 0; waited < 120_000 && !results; waited += 100) {
    if (pageErrors.length) break;
    await sleep(100);
    results = await evaluate('window.testResults');
  }
  ws.close();

  if (pageErrors.length) {
    console.log(`Page error:\n${pageErrors.join('\n')}`);
  } else if (!results) {
    console.log('Timed out waiting for the browser tests.');
  } else {
    for (const { name, error } of results) console.log(`${error ? '✖' : '✔'} ${name}${error ? `\n    ${error}` : ''}`);
    const failed = results.filter((r) => r.error).length;
    console.log(`\n${results.length - failed} passed, ${failed} failed${reducedMotion ? ' (reduced motion)' : ''}`);
    exitCode = failed ? 1 : 0;
  }
} finally {
  chrome.kill();
  server.close();
  await sleep(200);
  fs.rmSync(profile, { recursive: true, force: true });
}
process.exit(exitCode);
