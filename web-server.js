#!/usr/bin/env node
/**
 * 排程中心網頁伺服器
 * 提供靜態檔案服務 + API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 38766;
// 優先使用 dist（建構後），否則使用 web 目錄（開發時）
const WEB_DIR = fs.existsSync(path.join(__dirname, 'web', 'dist'))
  ? path.join(__dirname, 'web', 'dist')
  : path.join(__dirname, 'web');
const DATA_DIR = path.join(__dirname, 'data');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// 確保目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

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

  const url = req.url.split('?')[0]; // 移除 query string

  // API endpoints
  if (url === '/api/schedule' && req.method === 'GET') {
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

  if (url === '/api/schedule' && req.method === 'POST') {
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

  if (url === '/api/logs' && req.method === 'GET') {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
        // 正規化：支援巢狀格式（含 tasks 陣列）和扁平格式
        const normalized = [];
        const entries = raw.logs || [];
        for (const entry of entries) {
          if (Array.isArray(entry.tasks)) {
            // 巢狀格式：展平每個 task 為獨立紀錄
            for (const task of entry.tasks) {
              normalized.push({
                id: `${entry.timestamp}_${task.taskId || task.id || Math.random()}`,
                timestamp: task.executedAt || entry.timestamp,
                status: task.status === 'success' ? 'success' : (task.status === 'skipped' ? 'skipped' : 'fail'),
                project: {
                  id: entry.projectId || '',
                  name: entry.projectName || entry.project?.name || '',
                },
                task: {
                  id: task.taskId || task.id || '',
                  time: task.scheduledTime || task.time || '',
                  action: task.action || '',
                  description: task.description || task.note || '',
                },
                message: task.note || task.message || '',
                platforms: task.platforms || [],
              });
            }
          } else {
            // 扁平格式：直接使用
            normalized.push(entry);
          }
        }
        // 依時間倒序
        normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ logs: normalized, lastUpdated: raw.lastUpdated || '' }));
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

  if (url === '/api/logs' && req.method === 'POST') {
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

  // 靜態檔案服務
  let filePath = url === '/' ? '/index.html' : url;
  filePath = path.join(WEB_DIR, filePath);

  // 安全檢查：防止目錄遍歷
  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // 讀取檔案
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════╗`);
  console.log(`║  排程中心網頁伺服器已啟動            ║`);
  console.log(`║  網頁: http://localhost:${PORT}         ║`);
  console.log(`║  API:  http://localhost:${PORT}/api/*  ║`);
  console.log(`║                                      ║`);
  console.log(`║  GET  /api/schedule - 讀取排程       ║`);
  console.log(`║  POST /api/schedule - 儲存排程       ║`);
  console.log(`║  GET  /api/logs     - 讀取日誌       ║`);
  console.log(`║  POST /api/logs     - 儲存日誌       ║`);
  console.log(`╚══════════════════════════════════════╝`);
});
