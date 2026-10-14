#!/usr/bin/env node
/** Copy the explicitly supported, self-contained runtime into dist/. */

const fs = require('node:fs/promises');
const path = require('node:path');

const RUNTIME_ASSETS = [
  'index.html',
  'app.js',
  'app.css',
  'vendor/react.js',
  'vendor/react-dom.js',
  'vendor/LICENSE-react.txt',
  'assets/test-icons.png',
];

function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function validateRuntimeAssets(root) {
  for (const asset of RUNTIME_ASSETS) {
    const filename = path.join(root, ...asset.split('/'));
    let stat;
    try {
      stat = await fs.lstat(filename);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        throw new Error(`Missing required runtime asset: ${asset}`);
      }
      throw error;
    }

    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`Required runtime asset must be a regular file: ${asset}`);
    }
  }
}

async function packageSite({ root = path.resolve(__dirname, '..'), outputDir } = {}) {
  const absoluteRoot = path.resolve(root);
  const absoluteOutput = outputDir
    ? path.resolve(absoluteRoot, outputDir)
    : path.join(absoluteRoot, 'dist');
  if (!isWithin(absoluteRoot, absoluteOutput) || absoluteOutput === absoluteRoot) {
    throw new Error('Output directory must be a child of the project root');
  }
  for (const asset of RUNTIME_ASSETS) {
    const source = path.join(absoluteRoot, ...asset.split('/'));
    if (isWithin(absoluteOutput, source)) {
      throw new Error(`Output directory would overwrite required runtime asset: ${asset}`);
    }
  }

  // Validate before clearing the previous output so a missing input preserves it.
  await validateRuntimeAssets(absoluteRoot);
  await fs.rm(absoluteOutput, { recursive: true, force: true });
  await fs.mkdir(absoluteOutput, { recursive: true });

  for (const asset of RUNTIME_ASSETS) {
    const source = path.join(absoluteRoot, ...asset.split('/'));
    const destination = path.join(absoluteOutput, ...asset.split('/'));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }
  await fs.writeFile(path.join(absoluteOutput, '.nojekyll'), '');

  return { outputDir: absoluteOutput, assets: [...RUNTIME_ASSETS, '.nojekyll'] };
}

if (require.main === module) {
  packageSite().then(({ outputDir, assets }) => {
    console.log(`Packaged ${assets.length} runtime files into ${outputDir}`);
  }).catch((error) => {
    console.error(`Site packaging failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { packageSite, RUNTIME_ASSETS };
