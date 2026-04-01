#!/usr/bin/env node
/**
 * 排程中心本地伺服器
 * 提供檔案讀寫 API，讓網頁可以正確儲存資料
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 38765;
const DATA_DIR = path.join(__dirname, 'data');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// 確保目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;

  // GET /schedule - 讀取排程
  if (url === '/schedule' && req.method === 'GET') {
    try {
      if (fs.existsSync(SCHEDULE_FILE)) {
        const data = fs.readFileSync(SCHEDULE_FILE, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ groups: [], projects: [], lastUpdated: '' }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST /schedule - 儲存排程
  if (url === '/schedule' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(data, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, saved: true }));
        console.log(`[${new Date().toLocaleString('zh-TW')}] 排程已儲存`);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET /logs - 讀取日誌
  if (url === '/logs' && req.method === 'GET') {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        const data = fs.readFileSync(LOGS_FILE, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ logs: [], lastUpdated: '' }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST /logs - 儲存日誌
  if (url === '/logs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(LOGS_FILE, JSON.stringify(data, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, saved: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════╗`);
  console.log(`║  排程中心伺服器已啟動                ║`);
  console.log(`║  API: http://localhost:${PORT}         ║`);
  console.log(`║  GET  /schedule - 讀取排程           ║`);
  console.log(`║  POST /schedule - 儲存排程           ║`);
  console.log(`║  GET  /logs     - 讀取日誌           ║`);
  console.log(`║  POST /logs     - 儲存日誌           ║`);
  console.log(`╚══════════════════════════════════════╝`);
});
