// 主服务器文件

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

// 导入配置
const { PORT, AVATAR_DIR, PLAYER_TIMEOUT, SSE_TIMEOUT, RECONNECT_TIMEOUT } = require('./config/config');

// 导入模型
const Room = require('./models/Room');

// 导入工具函数
const { broadcastToAll, broadcastToRoom, sendGameStateToRoom, getRoomList, checkRoomActivity } = require('./utils/helpers');
const { processPlayerMessage } = require('./utils/messageHandler');

// 导入路由处理
const { handleStaticFiles, handleAvatarUpload, handleUpdateUser, handleSSE, handlePostMessage } = require('./routes/httpRoutes');

// 导入数据库操作
const { updateUserOnline } = require('./db');

// 导入房间存储
const { deleteRoom } = require('./roomStorage');

// 创建头像存储目录
if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // 处理头像上传
    if (req.url.startsWith('/upload-avatar') && req.method === 'POST') {
        handleAvatarUpload(req, res);
        return;
    }

    // 处理用户信息更新
    if (req.url === '/update-user' && req.method === 'POST') {
        handleUpdateUser(req, res);
        return;
    }

    // 处理SSE请求
    if (req.url.startsWith('/api/events')) {
        handleSSE(req, res, sseConnections, players, onlineUsers, reconnectList, rooms, deleteRoom, sendGameStateToRoom, updateUserOnline);
        return;
    }

    // 处理POST请求（iOS设备发送消息）
    if (req.url === '/api/send' && req.method === 'POST') {
        handlePostMessage(req, res, players, sseConnections, processPlayerMessage, rooms, reconnectList, onlineUsers);
        return;
    }

    // 处理静态文件请求
    handleStaticFiles(req, res);
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

// 全局状态
const rooms = new Map();
const players = new Map();
const onlineUsers = new Set();
const reconnectList = new Map(); // 重连名单，存储玩家ID和断开时间
const sseConnections = new Map(); // 存储SSE连接
let roomIdCounter = 1;

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
            processPlayerMessage(currentPlayer, data, players, rooms, sseConnections, reconnectList, onlineUsers);
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
                    sendGameStateToRoom(room, players);
                }
            }
        }
        players.delete(currentPlayer.id);
        console.log(`客户端已断开连接: ${currentPlayer.id}`);
    });
});

// 定期清理任务
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`WebSocket服务器运行在 ws://localhost:${PORT}`);
    
    setInterval(() => {
        const now = Date.now();
        
        // 清理不活跃的WebSocket连接
        players.forEach((player, playerId) => {
            if (now - player.lastActivity > PLAYER_TIMEOUT && player.ws.readyState === WebSocket.OPEN) {
                console.log(`清理不活跃连接: ${playerId}, 最后活动时间: ${new Date(player.lastActivity).toLocaleTimeString()}`);
                player.ws.close();
            }
        });
        
        // 清理不活跃的SSE连接
        sseConnections.forEach((res, clientId) => {
            const player = players.get(clientId);
            if (player) {
                if (now - player.lastActivity > SSE_TIMEOUT) {
                    console.log(`清理不活跃SSE连接: ${clientId}, 最后活动时间: ${new Date(player.lastActivity).toLocaleTimeString()}`);
                    res.end(); // 关闭SSE连接，会触发close事件
                }
            } else {
                // 如果没有对应的player，清理该SSE连接
                console.log(`清理无对应player的SSE连接: ${clientId}`);
                res.end(); // 关闭SSE连接，会触发close事件
            }
        });
        
        // 清理过期的重连记录
        reconnectList.forEach((info, userId) => {
            if (now - info.disconnectTime > RECONNECT_TIMEOUT) {
                reconnectList.delete(userId);
                console.log(`清理过期重连记录: ${userId}`);
            }
        });
        
        // 检查房间活跃度，清除不活跃的房间
        checkRoomActivity(rooms, players, broadcastToAll, broadcastToRoom);
    }, 30000);
});
