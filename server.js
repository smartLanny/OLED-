#!/usr/bin/env node
/** Offline static server for the OLED phone screen test. */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5173);
const HOST = '0.0.0.0';

// Keep the server surface limited to files needed by index.html at runtime.
// Build inputs, source code, backups, Git metadata, and node_modules stay private.
const RUNTIME_ASSETS = new Set([
  'index.html',
  'app.js',
  'app.css',
  'vendor/react.js',
  'vendor/react-dom.js',
  'vendor/LICENSE-react.txt',
  'assets/test-icons.png',
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
};

function listLanIPs() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const [name, list] of Object.entries(ifaces)) {
    for (const iface of list || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        out.push({ name, address: iface.address });
      }
    }
  }
  return out;
}

function isWithinRoot(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function parseRequestPath(requestTarget) {
  if (typeof requestTarget !== 'string' || !requestTarget.startsWith('/')) {
    return { error: 400 };
  }

  const rawPath = requestTarget.split('?', 1)[0];
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return { error: 400 };
  }

  if (decodedPath.includes('\0') || decodedPath.includes('\\')) {
    return { error: 400 };
  }
  if (decodedPath.split('/').includes('..')) {
    return { error: 403 };
  }

  const normalized = path.posix.normalize(decodedPath);
  return { asset: normalized === '/' ? 'index.html' : normalized.slice(1) };
}

function send(req, res, status, body, headers = {}) {
  const content = Buffer.from(body);
  res.writeHead(status, {
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
    ...(req.method === 'HEAD' ? { 'Content-Length': content.length } : {}),
  });
  res.end(req.method === 'HEAD' ? undefined : content);
}

function createServer({ root = ROOT } = {}) {
  const absoluteRoot = path.resolve(root);
  const realRootPromise = fs.promises.realpath(absoluteRoot);

  return http.createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(req, res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    }

    const parsed = parseRequestPath(req.url);
    if (parsed.error) {
      const body = parsed.error === 403 ? 'Forbidden' : 'Bad Request';
      return send(req, res, parsed.error, body);
    }
    if (!RUNTIME_ASSETS.has(parsed.asset)) {
      return send(req, res, 404, 'Not Found');
    }

    const candidate = path.resolve(absoluteRoot, ...parsed.asset.split('/'));
    if (!isWithinRoot(absoluteRoot, candidate)) {
      return send(req, res, 403, 'Forbidden');
    }

    let filename;
    let stat;
    try {
      const realRoot = await realRootPromise;
      filename = await fs.promises.realpath(candidate);
      if (!isWithinRoot(realRoot, filename)) {
        return send(req, res, 403, 'Forbidden');
      }
      stat = await fs.promises.stat(filename);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        return send(req, res, 404, 'Not Found');
      }
      return send(req, res, 500, 'Internal Server Error');
    }

    if (!stat.isFile()) {
      return send(req, res, 404, 'Not Found');
    }

    const headers = {
      'Cache-Control': 'no-cache',
      'Content-Type': MIME[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
    };
    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      return res.end();
    }

    const stream = fs.createReadStream(filename);
    stream.on('error', () => {
      if (res.headersSent) {
        res.destroy();
      } else {
        send(req, res, 500, 'Internal Server Error');
      }
    });
    res.on('close', () => {
      if (!res.writableFinished) stream.destroy();
    });
    stream.pipe(res);
  });
}

function startServer() {
  const server = createServer();
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n端口 ${PORT} 已被占用，请先关闭占用进程，或用 PORT=xxxx npm start 换端口。\n`);
    } else {
      console.error('\n服务器错误：', error.message, '\n');
    }
    process.exit(1);
  });

  server.listen(PORT, HOST, () => {
    const ips = listLanIPs();
    const line = '─'.repeat(46);
    console.log('\n\x1b[1m\x1b[36m  OLED 低灰阶滚动测试 · 局域网服务器\x1b[0m');
    console.log('\x1b[90m' + line + '\x1b[0m');
    console.log(`  本机访问   \x1b[32mhttp://localhost:${PORT}\x1b[0m`);
    if (ips.length === 0) {
      console.log('  \x1b[33m未检测到局域网 IPv4 地址（请检查 Wi-Fi / 网线连接）\x1b[0m');
    } else {
      console.log('  局域网访问：');
      for (const { name, address } of ips) {
        console.log(`    \x1b[32mhttp://${address}:${PORT}\x1b[0m  \x1b[90m(${name})\x1b[0m`);
      }
    }
    console.log('\x1b[90m' + line + '\x1b[0m');
    console.log('  按 Ctrl+C 停止服务\n');
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { createServer, listLanIPs, parseRequestPath };
