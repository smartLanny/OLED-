const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { packageSite, RUNTIME_ASSETS } = require('../scripts/package-site');

async function writeRuntimeFixture(root, { omit } = {}) {
  for (const asset of RUNTIME_ASSETS) {
    if (asset === omit) continue;
    const filename = path.join(root, ...asset.split('/'));
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, asset === 'assets/test-icons.png'
      ? Buffer.from([0x89, 0x50, 0x4e, 0x47])
      : `runtime:${asset}`);
  }
}

async function listFiles(root, directory = root) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, filename));
    } else {
      files.push(path.relative(root, filename).split(path.sep).join('/'));
    }
  }
  return files.sort();
}

test('packages only the explicit runtime allowlist and replaces stale output', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'oled-package-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await writeRuntimeFixture(root);
  await fs.mkdir(path.join(root, 'docs'));
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.writeFile(path.join(root, 'app.jsx'), 'private source');
  await fs.writeFile(path.join(root, 'server.log'), 'private log');
  await fs.writeFile(path.join(root, 'docs', 'notes.md'), 'private docs');
  await fs.writeFile(path.join(root, 'node_modules', 'secret.js'), 'private dependency');
  const outputDir = path.join(root, 'dist');
  await fs.mkdir(outputDir);
  await fs.writeFile(path.join(outputDir, 'stale.txt'), 'remove me');

  const result = await packageSite({ root, outputDir });

  assert.deepEqual(await listFiles(outputDir), [...RUNTIME_ASSETS, '.nojekyll'].sort());
  assert.deepEqual(result.assets.slice().sort(), [...RUNTIME_ASSETS, '.nojekyll'].sort());
  assert.equal(await fs.readFile(path.join(outputDir, '.nojekyll'), 'utf8'), '');
  for (const asset of RUNTIME_ASSETS) {
    assert.deepEqual(
      await fs.readFile(path.join(outputDir, ...asset.split('/'))),
      await fs.readFile(path.join(root, ...asset.split('/'))),
      asset,
    );
  }
});

test('reports a missing required runtime asset without replacing existing output', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'oled-package-missing-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await writeRuntimeFixture(root, { omit: 'assets/test-icons.png' });
  const outputDir = path.join(root, 'dist');
  await fs.mkdir(outputDir);
  await fs.writeFile(path.join(outputDir, 'keep.txt'), 'preserve');

  await assert.rejects(
    packageSite({ root, outputDir }),
    /Missing required runtime asset: assets\/test-icons\.png/,
  );
  assert.equal(await fs.readFile(path.join(outputDir, 'keep.txt'), 'utf8'), 'preserve');
});
