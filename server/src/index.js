const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 导入配置
const config = require('./config/config');

// 导入模型
const Room = require('./models/Room');
const { Game } = require('./game');

// 导入工具
const { saveRoom, loadRoom, deleteRoom } = require('./roomStorage');
const { createUser, getUserByUsername, getUserById, updateLastLogin, updateUserOnline, updateUserAvatar, updateUserNickname } = require('./db');
const { broadcastToAll, broadcastToRoom, sendGameStateToRoom, getRoomList, setGlobalVariables: setBroadcastGlobals } = require('./utils/broadcast');
const { processPlayerMessage, setGlobalVariables: setPlayerControllerGlobals } = require('./controllers/playerController');
const { completeLogin, setGlobalVariables: setAuthGlobals } = require('./utils/auth');

// 创建头像存储目录
if (!fs.existsSync(config.AVATAR_DIR)) {
    fs.mkdirSync(config.AVATAR_DIR, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.AVATAR_DIR);
    },
    filename: (req, file, cb) => {
        // 解析URL查询参数
        const parsedUrl = url.parse(req.url, true);
        const userId = parsedUrl.query.userId || 'unknown';
        cb(null, `${userId}.png`);
    }
});

const upload = multer({ storage: storage });

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // 处理头像上传
    if (req.url.startsWith('/upload-avatar') && req.method === 'POST') {
        // 解析URL查询参数
        const parsedUrl = url.parse(req.url, true);
        const userId = parsedUrl.query.userId;
        
        upload.single('avatar')(req, res, (err) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: '上传失败', error: err.message }));
                return;
            }

            if (!userId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: '缺少用户ID' }));
                return;
            }

            // 更新用户头像信息
            const avatarPath = `/avatars/${userId}.png`;
            updateUserAvatar(userId, avatarPath);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, avatar: avatarPath }));
        });
        return;
    }

    // 处理用户信息更新
    if (req.url === '/update-user' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { userId, nickname } = data;
                
                if (userId && nickname) {
                    const success = updateUserNickname(userId, nickname);
                    if (success) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: '更新失败' }));
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: '缺少必要参数' }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: '请求格式错误' }));
            }
        });
        return;
    }

    // 处理SSE请求
    if (req.url.startsWith('/api/events')) {
        const parsedUrl = url.parse(req.url, true);
        const clientId = parsedUrl.query.clientId || Math.random().toString(36).substring(2, 15);
        
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        
        // 存储连接
        sseConnections.set(clientId, res);
        
        // 发送欢迎消息
        res.write(`data: ${JSON.stringify({
            type: 'welcome',
            message: '欢迎来到德州扑克游戏！',
            playerId: clientId
        })}\n\n`);
        
        // 处理连接关闭
        req.on('close', () => {
            sseConnections.delete(clientId);
            const player = players.get(clientId);
            if (player) {
                if (player.userId) {
                    onlineUsers.delete(player.userId);
                    updateUserOnline(player.userId, false);
                    console.log(`用户 ${player.name} (ID: ${player.userId}) 已下线，当前在线用户: ${Array.from(onlineUsers)}`);
                    
                    // 如果玩家在房间中，添加到重连名单
                    if (player.roomId) {
                        reconnectList.set(player.userId, {
                            roomId: player.roomId,
                            disconnectTime: Date.now()
                        });
                        console.log(`玩家 ${player.name} 添加到重连名单，房间ID: ${player.roomId}`);
                    }
                }
                if (player.roomId) {
                    const room = rooms.get(player.roomId);
                    if (room) {
                        room.removePlayer(clientId);
                        if (room.getPlayerCount() === 0 || room.game.areAllPlayersLeftOrReconnecting()) {
                            deleteRoom(room.id);
                            rooms.delete(room.id);
                        } else {
                            sendGameStateToRoom(room.id);
                        }
                    }
                }
            }
            players.delete(clientId);
            console.log(`SSE客户端已断开连接: ${clientId}`);
        });
        return;
    }

    // 处理POST请求（iOS设备发送消息）
    if (req.url === '/api/send' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const clientId = data.clientId || Math.random().toString(36).substring(2, 15);
                
                // 查找或创建player对象
                let currentPlayer = players.get(clientId);
                if (!currentPlayer) {
                    // 创建新的player对象
                    currentPlayer = {
                        id: clientId,
                        ws: {
                            send: (message) => {
                                // 通过SSE发送消息给客户端
                                console.log('通过SSE发送消息:', clientId, message);
                                const sseRes = sseConnections.get(clientId);
                                if (sseRes) {
                                    console.log('SSE连接存在，发送消息');
                                    sseRes.write(`data: ${message}\n\n`);
                                } else {
                                    console.error('SSE连接不存在:', clientId);
                                }
                            },
                            readyState: 1 // OPEN
                        },
                        roomId: null,
                        name: `玩家${clientId.substring(0, 4)}`,
                        userId: null,
                        loggedIn: false,
                        lastActivity: Date.now()
                    };
                    players.set(clientId, currentPlayer);
                }
                
                // 更新ws.send方法为SSE发送
                currentPlayer.ws.send = (message) => {
                    console.log('通过SSE发送消息:', clientId, message);
                    const sseRes = sseConnections.get(clientId);
                    if (sseRes) {
                        console.log('SSE连接存在，发送消息');
                        sseRes.write(`data: ${message}\n\n`);
                    } else {
                        console.error('SSE连接不存在:', clientId);
                    }
                };
                
                // 处理消息（复用WebSocket的消息处理逻辑）
                processPlayerMessage(currentPlayer, data);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('处理POST消息失败:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // 处理静态文件请求
    let filePath = req.url === '/' ? 'index.html' : req.url;
    
    // 移除查询参数，因为 path.join 不处理查询参数
    filePath = filePath.split('?')[0];
    
    // 解码URL路径，处理特殊字符如 #
    const decodedPath = decodeURIComponent(filePath);
    
    // 构建完整的文件路径
    filePath = path.join(config.PUBLIC_DIR, decodedPath);
    
    // 调试信息
    console.log(`Static file request: ${req.url}`);
    console.log(`Public directory: ${config.PUBLIC_DIR}`);
    console.log(`File path: ${filePath}`);
    
    // 检查文件是否存在且是文件（不是目录）
    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`, 'utf-8');
            }
            return;
        }
        
        // 如果是目录，尝试返回index.html
        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            fs.readFile(indexPath, (error, content) => {
                if (error) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1>', 'utf-8');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                }
            });
            return;
        }
        
        // 处理文件
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = config.mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ 
    server,
    perMessageDeflate: {
        zlibDeflateOptions: { chunkSize: 1024, memLevel: 7, level: 3 },
        zlibInflateOptions: { chunkSize: 10 * 1024 },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        clientMaxWindowBits: 10,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024
    }
});

// 全局变量
const rooms = new Map();
const players = new Map();
const onlineUsers = new Set();
const reconnectList = new Map(); // 重连名单，存储玩家ID和断开时间
const sseConnections = new Map(); // 存储SSE连接
let roomIdCounter = 1;

// 设置全局变量
setBroadcastGlobals(players, rooms);
setPlayerControllerGlobals(rooms, players, sseConnections, reconnectList, roomIdCounter);
setAuthGlobals(players, rooms, sseConnections, reconnectList, onlineUsers);

// WebSocket连接处理
wss.on('connection', (ws) => {
    const tempPlayerId = Math.random().toString(36).substring(2, 15);
    let currentPlayer = {
        id: tempPlayerId,
        ws: ws,
        roomId: null,
        name: `玩家${tempPlayerId.substring(0, 4)}`,
        userId: null,
        loggedIn: false,
        lastActivity: Date.now()
    };
    players.set(tempPlayerId, currentPlayer);

    console.log(`新客户端已连接: ${tempPlayerId}`);

    ws.send(JSON.stringify({
        type: 'welcome',
        message: '欢迎来到德州扑克游戏！',
        playerId: tempPlayerId
    }));

    ws.on('message', (message) => {
        currentPlayer.lastActivity = Date.now();
        try {
            const data = JSON.parse(message);
            console.log('收到消息:', data);
            processPlayerMessage(currentPlayer, data);
        } catch (error) {
            console.error('解析消息失败:', error);
        }
    });

    ws.on('close', () => {
        const player = players.get(currentPlayer.id);
        if (player && player.userId) {
            onlineUsers.delete(player.userId);
            updateUserOnline(player.userId, false);
            console.log(`用户 ${player.name} (ID: ${player.userId}) 已下线，当前在线用户: ${Array.from(onlineUsers)}`);
            
            // 如果玩家在房间中，添加到重连名单
            if (player.roomId) {
                reconnectList.set(player.userId, {
                    roomId: player.roomId,
                    disconnectTime: Date.now()
                });
                console.log(`玩家 ${player.name} 添加到重连名单，房间ID: ${player.roomId}`);
            }
        }
        if (player && player.roomId) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.removePlayer(currentPlayer.id);
                if (room.getPlayerCount() === 0 || room.game.areAllPlayersLeftOrReconnecting()) {
                    deleteRoom(room.id);
                    rooms.delete(room.id);
                } else {
                    sendGameStateToRoom(room.id);
                }
            }
        }
        players.delete(currentPlayer.id);
        console.log(`客户端已断开连接: ${currentPlayer.id}`);
    });
});

// 启动服务器
server.listen(config.PORT, () => {
    console.log(`服务器运行在 http://localhost:${config.PORT}`);
});