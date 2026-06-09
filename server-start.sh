#!/bin/bash
cd /home/z/my-project
exec node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/home/z/my-project/out';
const PORT = 3000;

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(OUT_DIR, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);
  
  // SPA fallback
  if (!ext && urlPath !== '/') {
    filePath = path.join(OUT_DIR, urlPath + '.html');
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback to index.html for SPA routing
      fs.readFile(path.join(OUT_DIR, 'index.html'), (err2, data2) => {
        if (err2) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data2);
      });
      return;
    }
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.txt': 'text/plain',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('WC2026 Server running at http://0.0.0.0:' + PORT);
});
"
