// HTTP路由处理

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PUBLIC_DIR, AVATAR_DIR, mimeTypes } = require('../config/config');
const { updateUserAvatar, updateUserNickname } = require('../db');

// 配置multer存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, AVATAR_DIR);
    },
    filename: (req, file, cb) => {
        // 解析URL查询参数
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const userId = parsedUrl.searchParams.get('userId') || 'unknown';
        cb(null, `${userId}.png`);
    }
});

const upload = multer({ storage: storage });

// 处理静态文件请求
function handleStaticFiles(req, res) {
    let filePath = req.url === '/' ? 'index.html' : req.url;
    
    // 移除查询参数，因为 path.join 不处理查询参数
    filePath = filePath.split('?')[0];
    
    // 解码URL路径，处理特殊字符如 #
    const decodedPath = decodeURIComponent(filePath);
    
    // 构建完整的文件路径
    filePath = path.join(PUBLIC_DIR, decodedPath);
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// 处理头像上传
function handleAvatarUpload(req, res) {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: '上传失败', error: err.message }));
            return;
        }

        // 解析URL查询参数
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const userId = parsedUrl.searchParams.get('userId');
        
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
}

// 处理用户信息更新
function handleUpdateUser(req, res) {
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
}

// 处理SSE请求
function handleSSE(req, res, sseConnections, players, onlineUsers, reconnectList, rooms, deleteRoom, sendGameStateToRoom, updateUserOnline) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const clientId = parsedUrl.searchParams.get('clientId') || Math.random().toString(36).substring(2, 15);
    
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
                        sendGameStateToRoom(room, players);
                    }
                }
            }
        }
        players.delete(clientId);
        console.log(`SSE客户端已断开连接: ${clientId}`);
    });
}

// 处理POST请求（iOS设备发送消息）
function handlePostMessage(req, res, players, sseConnections, processPlayerMessage, rooms, reconnectList, onlineUsers) {
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
            processPlayerMessage(currentPlayer, data, players, rooms, sseConnections, reconnectList, onlineUsers);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (error) {
            console.error('处理POST消息失败:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    });
}

// 导出路由处理函数
module.exports = {
    handleStaticFiles,
    handleAvatarUpload,
    handleUpdateUser,
    handleSSE,
    handlePostMessage
};
