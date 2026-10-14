const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createServer } = require('../server');

function request(base, pathname, { method = 'GET' } = {}) {
  const url = new URL(base);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      method,
      path: pathname,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('static server exposes only runtime assets and handles HTTP paths safely', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'oled-server-test-'));
  await fs.mkdir(path.join(root, 'vendor'));
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.writeFile(path.join(root, 'index.html'), '<main>OLED</main>');
  await fs.writeFile(path.join(root, 'app.js'), 'window.app = true;');
  await fs.writeFile(path.join(root, 'app.css'), 'body { color: white; }');
  await fs.writeFile(path.join(root, 'vendor/react.js'), 'window.React = {};');
  await fs.writeFile(path.join(root, 'vendor/react-dom.js'), 'window.ReactDOM = {};');
  await fs.writeFile(path.join(root, 'app.jsx'), 'private source');
  await fs.writeFile(path.join(root, 'src.css'), 'private source');
  await fs.writeFile(path.join(root, 'server.js'), 'private source');
  await fs.writeFile(path.join(root, 'backup.txt'), 'private backup');
  await fs.writeFile(path.join(root, 'node_modules', 'secret.js'), 'private dependency');

  const server = createServer({ root });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(root, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${server.address().port}`;

  await t.test('serves the document and bundled runtime assets', async () => {
    const index = await request(base, '/');
    assert.equal(index.status, 200);
    assert.equal(index.body, '<main>OLED</main>');
    assert.match(index.headers['content-type'], /^text\/html/);

    for (const asset of ['/app.js', '/app.css', '/vendor/react.js', '/vendor/react-dom.js']) {
      const response = await request(base, asset);
      assert.equal(response.status, 200, asset);
      assert.ok(response.body.length > 0, asset);
    }
  });

  await t.test('supports HEAD with the same metadata and no response body', async () => {
    const response = await request(base, '/app.js', { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.equal(response.body, '');
    assert.equal(Number(response.headers['content-length']), Buffer.byteLength('window.app = true;'));
  });

  await t.test('rejects unsupported methods and private project files', async () => {
    const method = await request(base, '/app.js', { method: 'POST' });
    assert.equal(method.status, 405);
    assert.equal(method.headers.allow, 'GET, HEAD');

    for (const file of ['/app.jsx', '/src.css', '/server.js', '/backup.txt', '/node_modules/secret.js', '/vendor/tailwind.js']) {
      assert.equal((await request(base, file)).status, 404, file);
    }
  });

  await t.test('rejects traversal and malformed percent encoding', async () => {
    assert.equal((await request(base, '/../outside')).status, 403);
    assert.equal((await request(base, '/%2e%2e/outside')).status, 403);
    assert.equal((await request(base, '/%E0%A4%A')).status, 400);
    assert.equal((await request(base, '/app.js%00')).status, 400);
  });
});
