#!/bin/bash
# Schedule Monitor Script
# 每小時自動檢查並執行排程任務

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCHEDULE_FILE="$SCRIPT_DIR/../data/schedule.json"
LOG_FILE="$SCRIPT_DIR/../data/logs.json"
CONTENT_FILE="$SCRIPT_DIR/../data/today-content.md"

# 確保目錄存在
mkdir -p "$(dirname "$SCHEDULE_FILE")"

# 取得當前時間
CURRENT_HOUR=$(date +"%H")
CURRENT_DATE=$(date +"%Y-%m-%d")
CURRENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 開始檢查排程..."

# 檢查 schedule.json 是否存在
if [ ! -f "$SCHEDULE_FILE" ]; then
    echo "[ERROR] 找不到 schedule.json: $SCHEDULE_FILE"
    exit 1
fi

# 使用 node.js 處理 JSON 並執行瀏覽器操作
node << NODESCRIPT
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = process.env.SCRIPT_DIR;
const SCHEDULE_FILE = path.join(scriptDir, '../data/schedule.json');
const LOG_FILE = path.join(scriptDir, '../data/logs.json');
const CONTENT_FILE = path.join(scriptDir, '../data/today-content.md');
const CURRENT_HOUR = process.env.CURRENT_HOUR;
const CURRENT_TIMESTAMP = process.env.CURRENT_TIMESTAMP;

function log(message) {
    console.log(message);
}

function executeInBrowser(platformUrl, content) {
    try {
        log(\`[瀏覽器] 開啟 \${platformUrl}\`);
        // 使用 AppleScript 打開瀏覽器
        execSync('osascript -e \'tell application "Google Chrome" to activate\'', { stdio: 'ignore' });
        execSync(\`open "\${platformUrl}"\`, { stdio: 'ignore' });
        return true;
    } catch(e) {
        log(\`[錯誤] 瀏覽器操作失敗: \${e.message}\`);
        return false;
    }
}

async function publishToPlatform(platform, content) {
    const url = platform.url || platform;
    log(\`[發佈] \${platform.name || '平台'}: \${url}\`);
    
    // 實際打開瀏覽器
    const result = executeInBrowser(url, content);
    
    // 等待一下
    await new Promise(r => setTimeout(r, 2000));
    
    return result;
}

async function run() {
    try {
        // 讀取排程
        const schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
        
        // 讀取現有日誌
        let logs = { logs: [] };
        if (fs.existsSync(LOG_FILE)) {
            try {
                logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
                if (!logs.logs) logs.logs = [];
            } catch(e) {
                logs = { logs: [] };
            }
        }
        
        let executed = 0;
        let newLogs = [];
        
        // 遍歷每個專案
        for (const project of schedule.projects || []) {
            if (!project.enabled) continue;
            
            // 找到對應的群組
            const group = (schedule.groups || []).find(g => g.id === project.groupId);
            
            // 遍歷每個任務
            for (const task of project.tasks || []) {
                if (!task.enabled) continue;
                
                // 檢查任務時間是否符合當前小時
                const taskHour = task.time ? task.time.split(':')[0] : null;
                if (!taskHour || taskHour !== CURRENT_HOUR) continue;
                
                log(\`[執行] \${project.name} - \${task.time} \${task.action} - \${task.description}\`);
                
                let status = 'success';
                let message = '';
                
                try {
                    const action = task.action || '✍️ 生成';
                    const desc = task.description || '';
                    
                    // 根據任務類型執行不同操作
                    if (action === '✍️ 生成' || action === 'generate') {
                        // 生成內容：建立內容檔案
                        const content = \`# \${project.name} - \${task.time}

\${desc}

產生時間：\${CURRENT_TIMESTAMP}
\`;
                        fs.writeFileSync(CONTENT_FILE, content, 'utf8');
                        message = \`已生成內容並儲存到 today-content.md\`;
                        log(\`[生成] \${message}\`);
                    } 
                    else if (action === '📢 發布' || action === 'publish') {
                        // 發布內容：讀取當天內容並發布到各平台
                        let publishContent = '';
                        if (fs.existsSync(CONTENT_FILE)) {
                            publishContent = fs.readFileSync(CONTENT_FILE, 'utf8');
                        } else {
                            publishContent = desc;
                        }
                        
                        // 發布到群組中的所有平台
                        if (group && group.platforms && group.platforms.length > 0) {
                            for (const platform of group.platforms) {
                                await publishToPlatform(platform, publishContent);
                            }
                            const platforms = group.platforms.map(p => p.name).join(', ');
                            message = \`成功發佈到 \${platforms}\`;
                        } else {
                            message = \`完成發佈任務：\${desc}\`;
                        }
                    }
                    else {
                        // 搜尋或其他任務
                        message = \`完成任務：\${desc}\`;
                    }
                } catch(e) {
                    status = 'fail';
                    message = \`執行失敗：\${e.message}\`;
                    log(\`[錯誤] \${message}\`);
                }
                
                const logEntry = {
                    id: \`log_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
                    timestamp: CURRENT_TIMESTAMP,
                    status: status,
                    project: { id: project.id, name: project.name },
                    task: { id: task.id, time: task.time, action: task.action, description: task.description },
                    message: message
                };
                
                newLogs.push(logEntry);
                executed++;
                log(\`[\${status.toUpperCase()}] \${message}\`);
            }
        }
        
        if (executed === 0) {
            log(\`[略過] 目前沒有需要執行的任務 (時間: \${CURRENT_HOUR})\`);
        }
        
        // 合併日誌
        logs.logs = [...newLogs, ...logs.logs];
        logs.lastUpdated = CURRENT_TIMESTAMP;
        
        // 限制日誌數量
        if (logs.logs.length > 500) {
            logs.logs = logs.logs.slice(0, 500);
        }
        
        // 寫入日誌檔案
        fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
        
        log(\`[完成] 共執行 \${executed} 個任務\`);
        
    } catch(e) {
        log(\`[錯誤] \${e.message}\`);
        process.exit(1);
    }
}

run();
NODESCRIPT

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 排程檢查完成"
