#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const ROOT = __dirname;
const OUTPUT_DIR = path.resolve(process.env.BUILD_OUT_DIR || ROOT);
const JSX_FILE = path.join(ROOT, 'app.jsx');
const CSS_FILE = path.join(ROOT, 'src.css');

async function build() {
  const jsResult = babel.transformFileSync(JSX_FILE, {
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('@babel/preset-react'), { runtime: 'classic' }]],
    sourceMaps: false,
  });

  if (!jsResult || typeof jsResult.code !== 'string') {
    throw new Error('Babel did not produce app.js output.');
  }

  const tailwindConfig = require(path.join(ROOT, 'tailwind.config.js'));
  const cssResult = await postcss([
    tailwindcss({
      ...tailwindConfig,
      content: [JSX_FILE, path.join(ROOT, 'index.html')],
    }),
    autoprefixer,
  ]).process(fs.readFileSync(CSS_FILE, 'utf8'), {
    from: CSS_FILE,
    to: path.join(OUTPUT_DIR, 'app.css'),
  });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'app.js'), jsResult.code + '\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'app.css'), cssResult.css);
  process.stdout.write(`Built app.js (${Buffer.byteLength(jsResult.code)} bytes) and app.css (${Buffer.byteLength(cssResult.css)} bytes)\n`);
}

build().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
