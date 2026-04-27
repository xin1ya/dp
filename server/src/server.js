const http = require('http');
const https = require('https');
const url = require('url');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { Game } = require('./game');
const { createUser, getUserByUsername, getUserById, updateLastLogin, updateUserOnline, updateUserAvatar, updateUserNickname } = require('./db');
const { saveRoom, loadRoom, deleteRoom } = require('./roomStorage');
const multer = require('multer');

// 创建头像存储目录
const avatarDir = path.join(__dirname, '../../public/avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        // 解析URL查询参数
        const parsedUrl = url.parse(req.url, true);
        const userId = parsedUrl.query.userId || 'unknown';
        cb(null, `${userId}.png`);
    }
});

const upload = multer({ storage: storage });

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, '../../public');
const MAX_ROOMS = 5;
const MIN_PLAYERS_PER_ROOM = 4;
const MAX_PLAYERS_PER_ROOM = 12;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

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

            // 查找用户所在的房间并更新游戏中的玩家信息
            let targetRoom = null;
            rooms.forEach((room) => {
                const player = room.game.players.get(userId);
                if (player) {
                    targetRoom = room;
                    // 更新玩家的头像更新时间
                    const user = getUserById(userId);
                    if (user) {
                        player.avatarUpdatedAt = user.avatarUpdatedAt;
                    }
                }
            });

            // 如果用户在房间中，通知房间内的其他玩家
            if (targetRoom) {
                targetRoom.saveToStorage();
                sendGameStateToRoom(targetRoom.id);
            }

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
});

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

const rooms = new Map();
const players = new Map();
const onlineUsers = new Set();
const reconnectList = new Map(); // 重连名单，存储玩家ID和断开时间
const sseConnections = new Map(); // 存储SSE连接
let roomIdCounter = 1;

class Room {
    constructor(id, name, creatorId, endTime, cardSkin = 'default') {
        this.id = id;
        this.name = name;
        this.creatorId = creatorId;
        this.createdAt = Date.now();
        this.lastActionTime = Date.now(); // 最后行动时间
        this.endTime = endTime ? new Date(endTime).getTime() : null;
        this.isEnding = false;
        this.extendVotes = new Map(); // 存储延长时间的投票
        this.resetVotes = new Map(); // 存储重置房间的投票
        this.kickVotes = new Map(); // 存储踢出玩家的投票
        this.kickTargetPlayerId = null; // 存储目标玩家ID
        this.chatMessages = []; // 存储聊天消息
        this.cardSkin = cardSkin;
        this.game = new Game(id, name);
        let lastStage = null;
        let lastGameActive = false;
        
        this.game.onStageChange = () => {
            console.log(`房间 ${this.id}: 状态变化，当前阶段: ${this.game.stage}, gameActive: ${this.game.gameActive}`);
            this.saveToStorage();
            sendGameStateToRoom(this.id);
            broadcastToAll(JSON.stringify({
                type: 'roomList',
                rooms: getRoomList()
            }));
            
            // 发送阶段切换日志，避免重复发送
            if (this.game.stage === 'preflop' && this.game.gameActive && (!lastStage || lastStage !== 'preflop' || !lastGameActive)) {
                // 游戏开始
                broadcastToRoom(this.id, JSON.stringify({
                    type: 'gameStart'
                }));
            } else if (this.game.stage !== 'ready' && this.game.stage !== 'result' && this.game.stage !== lastStage) {
                // 阶段切换
                const stageNames = {
                    'preflop': '盲注阶段',
                    'flop': '翻牌',
                    'turn': '转牌',
                    'river': '河牌'
                };
                broadcastToRoom(this.id, JSON.stringify({
                    type: 'stageChange',
                    stage: stageNames[this.game.stage] || this.game.stage
                }));
            } else if (this.game.stage === 'result') {
                // 检查房间结束时间
                this.checkEndTime();
            }
            
            // 更新最后阶段状态
            lastStage = this.game.stage;
            lastGameActive = this.game.gameActive;
        };
        this.saveToStorage();
    }
    
    checkEndTime() {
        if (this.endTime && !this.isEnding && Date.now() >= this.endTime) {
            this.isEnding = true;
            // 广播房间即将结束的消息
            broadcastToRoom(this.id, JSON.stringify({
                type: 'roomEnding',
                message: '房间即将结束，是否延长时间？'
            }));
        }
    }
    
    extendEndTime(hours) {
        if (this.endTime) {
            this.endTime += hours * 60 * 60 * 1000;
            this.isEnding = false;
            this.saveToStorage();
            broadcastToRoom(this.id, JSON.stringify({
                type: 'roomExtended',
                message: `房间结束时间已延长 ${hours} 小时`,
                endTime: this.endTime
            }));
            return true;
        }
        return false;
    }
    
    isRoomEnded() {
        return this.endTime && Date.now() >= this.endTime && this.isEnding;
    }
    
    checkExtendVoteResult() {
        // 获取房间内的所有玩家数量
        const totalPlayers = this.game.players.size;
        // 统计同意和不同意的投票数量
        let yesVotes = 0;
        let noVotes = 0;
        
        this.extendVotes.forEach(vote => {
            if (vote === 'yes') {
                yesVotes++;
            } else {
                noVotes++;
            }
        });
        
        // 检查是否达到一半以上玩家投票
        const requiredVotes = Math.ceil(totalPlayers / 2);
        
        if (yesVotes >= requiredVotes) {
            // 同意延长的玩家达到一半以上，延长1小时
            this.extendEndTime(1);
            // 清空投票记录
            this.extendVotes.clear();
        } else if (noVotes >= requiredVotes) {
            // 不同意延长的玩家达到一半以上，房间结束
            this.isEnding = true;
            this.saveToStorage();
            broadcastToRoom(this.id, JSON.stringify({
                type: 'roomEnded',
                message: '房间已结束，无法进行准备'
            }));
            // 清空投票记录
            this.extendVotes.clear();
        } else {
            // 投票未达到一半以上，继续等待
            // 广播投票进度
            broadcastToRoom(this.id, JSON.stringify({
                type: 'extendVoteUpdate',
                yesVotes: yesVotes,
                noVotes: noVotes,
                totalPlayers: totalPlayers,
                requiredVotes: requiredVotes
            }));
        }
    }
    
    checkResetVoteResult() {
        // 获取房间内的活跃玩家数量
        const activePlayers = Array.from(this.game.players.values()).filter(player => player.state !== 'left' && !player.isSpectator);
        const totalPlayers = activePlayers.length;
        // 统计同意和不同意的投票数量
        let yesVotes = 0;
        let noVotes = 0;
        
        this.resetVotes.forEach(vote => {
            if (vote === 'yes') {
                yesVotes++;
            } else {
                noVotes++;
            }
        });
        
        // 检查是否达到一半以上玩家投票
        const requiredVotes = Math.ceil(totalPlayers / 2);
        
        if (yesVotes >= requiredVotes) {
            // 同意重置的玩家达到一半以上，重置房间
            this.resetRoom();
            // 清空投票记录
            this.resetVotes.clear();
        } else if (noVotes >= requiredVotes) {
            // 不同意重置的玩家达到一半以上，取消重置
            broadcastToRoom(this.id, JSON.stringify({
                type: 'resetRoomCancelled',
                message: '重置房间投票未通过，取消重置'
            }));
            // 清空投票记录
            this.resetVotes.clear();
        } else {
            // 投票未达到一半以上，继续等待
            // 广播投票进度
            broadcastToRoom(this.id, JSON.stringify({
                type: 'resetVoteUpdate',
                yesVotes: yesVotes,
                noVotes: noVotes,
                totalPlayers: totalPlayers,
                requiredVotes: requiredVotes
            }));
        }
    }
    
    checkKickVoteResult() {
        // 获取房间内的活跃玩家数量
        const activePlayers = Array.from(this.game.players.values()).filter(player => player.state !== 'left' && !player.isSpectator);
        const totalPlayers = activePlayers.length;
        // 统计同意和不同意的投票数量
        let yesVotes = 0;
        let noVotes = 0;
        
        this.kickVotes.forEach(vote => {
            if (vote === 'yes') {
                yesVotes++;
            } else {
                noVotes++;
            }
        });
        
        // 检查是否达到一半以上玩家投票
        const requiredVotes = Math.ceil(totalPlayers / 2);
        
        if (yesVotes >= requiredVotes) {
            // 同意踢出的玩家达到一半以上，将目标玩家状态切换为弃牌
            this.kickPlayer();
            // 清空投票记录
            this.kickVotes.clear();
            this.kickTargetPlayerId = null;
        } else if (noVotes >= requiredVotes) {
            // 不同意踢出的玩家达到一半以上，取消踢出
            broadcastToRoom(this.id, JSON.stringify({
                type: 'kickPlayerCancelled',
                message: '踢出玩家投票未通过，取消踢出'
            }));
            // 清空投票记录
            this.kickVotes.clear();
            this.kickTargetPlayerId = null;
        } else {
            // 投票未达到一半以上，继续等待
            // 广播投票进度
            broadcastToRoom(this.id, JSON.stringify({
                type: 'kickVoteUpdate',
                yesVotes: yesVotes,
                noVotes: noVotes,
                totalPlayers: totalPlayers,
                requiredVotes: requiredVotes
            }));
        }
    }
    
    kickPlayer() {
        if (this.kickTargetPlayerId) {
            const player = this.game.players.get(this.kickTargetPlayerId);
            if (player) {
                // 检查该玩家是否是当前行动玩家
                const isCurrentPlayer = this.game.isCurrentPlayer(player.id);
                
                // 将玩家状态切换为弃牌
                player.folded = true;
                player.state = 'folded'; 
                
                // 广播玩家被踢出的消息
                broadcastToRoom(this.id, JSON.stringify({
                    type: 'playerKicked',
                    message: `${player.name} 被投票踢出，已切换为弃牌状态`
                }));
                
                // 检查还在场的活跃玩家人数
                const activePlayers = this.game.getActivePlayers();
                
                // 如果只有一名活跃玩家，直接胜利
                if (activePlayers.length === 1 && this.game.handInProgress) {
                    const winner = activePlayers[0];
                    this.game.endHand();
                } else if (isCurrentPlayer && this.game.handInProgress) {
                    // 如果被踢出的玩家是当前行动玩家，更新游戏轮次
                    this.game.nextPlayer();
                }
                
                // 保存房间状态
                this.saveToStorage();
                // 发送游戏状态更新
                sendGameStateToRoom(this.id);
            }
        }
    }
    
    resetRoom() {
        // 重置所有玩家的筹码和待还筹码为2000
        this.game.players.forEach(player => {
            player.chips = 2000;
            player.borrowedChips = 2000;
        });
        
        // 保存房间状态
        this.saveToStorage();
        
        // 发送重置成功消息
        broadcastToRoom(this.id, JSON.stringify({
            type: 'roomReset',
            message: '房间已重置，所有玩家筹码和待还筹码已调整为2000'
        }));
        
        // 发送游戏状态更新
        sendGameStateToRoom(this.id);
    }

    addPlayer(playerId, player, playerName) {
        if (this.game.players.size >= MAX_PLAYERS_PER_ROOM) {
            return false;
        }
        this.game.addPlayer(playerId, playerName);
        this.saveToStorage();
        return true;
    }

    removePlayer(playerId) {
        this.game.removePlayer(playerId);
        this.saveToStorage();
    }

    getPlayerCount() {
        return this.game.players.size;
    }

    saveToStorage() {
        const roomData = {
            ...this.game.saveToStorage(),
            chatMessages: this.chatMessages
        };
        saveRoom(this.id, roomData);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            playerCount: this.getPlayerCount(),
            maxPlayers: MAX_PLAYERS_PER_ROOM,
            minPlayers: MIN_PLAYERS_PER_ROOM,
            creatorId: this.creatorId,
            stage: this.game.stage,
            gameActive: this.game.gameActive,
            handInProgress: this.game.handInProgress,
            cardSkin: this.cardSkin,
            endTime: this.endTime,
            isEnding: this.isEnding
        };
    }
}

function broadcastToAll(message) {
    players.forEach((wsPlayer) => {
        if (wsPlayer.loggedIn && wsPlayer.ws.readyState === WebSocket.OPEN) {
            wsPlayer.ws.send(message);
        }
    });
}

function broadcastToRoom(roomId, message) {
    const room = rooms.get(roomId);
    if (room) {
        room.game.players.forEach((player) => {
            const wsPlayer = players.get(player.id);
            if (wsPlayer && wsPlayer.loggedIn && wsPlayer.ws.readyState === WebSocket.OPEN) {
                wsPlayer.ws.send(message);
            }
        });
    }
}

// HTTP请求函数，用于调用机器人管理服务器API
function callBotManagerApi(endpoint, method, data, callback) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api${endpoint}`,
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(responseData);
                callback(null, parsedData);
            } catch (error) {
                callback(error, null);
            }
        });
    });

    req.on('error', (error) => {
        callback(error, null);
    });

    if (data) {
        req.write(JSON.stringify(data));
    }
    req.end();
}

// 处理特殊指令
function handleSpecialCommand(message, roomName, callback) {
    // 解析添加指令
    const addRegex = /^!bot\s+add\s*(\d*)$/;
    const addMatch = message.match(addRegex);
    
    // 解析移除指令（通过昵称）
    const removeRegex = /^!bot\s+remove\s+(.+)$/;
    const removeMatch = message.match(removeRegex);
    
    if (addMatch) {
        const count = addMatch[1] ? parseInt(addMatch[1]) : 1;
        // 调用添加机器人API
        callBotManagerApi('/bots/add', 'POST', { roomName, botCount: count }, callback);
    } else if (removeMatch) {
        const botNickname = removeMatch[1].trim();
        console.log(`Removing bot with nickname: ${botNickname}`);
        // 直接调用管理服务器的移除接口，传递昵称参数
        callBotManagerApi('/bots/remove-by-nickname', 'POST', { nickname: botNickname }, (error, result) => {
            if (error) {
                console.error(`Error removing bot: ${error}`);
                callback(error, null);
            } else {
                console.log(`Bot removed successfully: ${result.message}`);
                callback(null, result);
            }
        });
    } else {
        callback(new Error('Invalid command'), null);
    }
}

function completeLogin(user, currentPlayer, ws) {
    updateLastLogin(user.username);
    onlineUsers.add(user.id);
    updateUserOnline(user.id, true);
    
    const oldId = currentPlayer.id;
    
    // 更新SSE连接映射：将旧的clientId映射更新为新的userId（仅适用于iOS/SSE连接）
    const sseRes = sseConnections.get(oldId);
    if (sseRes) {
        console.log(`更新SSE连接映射: ${oldId} -> ${user.id}`);
        sseConnections.delete(oldId);
        sseConnections.set(user.id, sseRes);
        
        // 更新ws.send方法，使用新的userId查找SSE连接（仅适用于SSE连接）
        // 检查是否是SSE连接（通过检查ws是否有readyState属性且不是WebSocket）
        if (!ws.readyState || ws.readyState === 1) {
            ws.send = (message) => {
                console.log('通过SSE发送消息:', user.id, message);
                const sseResNew = sseConnections.get(user.id);
                if (sseResNew) {
                    console.log('SSE连接存在，发送消息');
                    sseResNew.write(`data: ${message}\n\n`);
                } else {
                    console.error('SSE连接不存在:', user.id);
                }
            };
        }
    }
    
    players.delete(oldId);
    currentPlayer.id = user.id;
    currentPlayer.userId = user.id;
    currentPlayer.loggedIn = true;
    currentPlayer.name = user.nickname;
    players.set(user.id, currentPlayer);
    
    if (currentPlayer.roomId) {
        const room = rooms.get(currentPlayer.roomId);
        if (room) {
            const oldGamePlayer = room.game.players.get(oldId);
            if (oldGamePlayer) {
                room.game.players.delete(oldId);
                oldGamePlayer.id = user.id;
                room.game.players.set(user.id, oldGamePlayer);
                room.saveToStorage();
                sendGameStateToRoom(room.id);
            }
        }
    } else {
        // 检查重连名单，恢复房间ID
        if (reconnectList.has(user.id)) {
            const reconnectInfo = reconnectList.get(user.id);
            const room = rooms.get(reconnectInfo.roomId);
            if (room) {
                currentPlayer.roomId = reconnectInfo.roomId;
                // 检查玩家是否在游戏的重连名单中
                if (room.game.isPlayerReconnecting(user.id)) {
                    room.game.removeFromReconnectList(user.id);
                    console.log(`玩家 ${user.username} 重连成功，从重连名单中移除`);
                }
                // 查找并更新游戏中的玩家ID
                let gamePlayer = null;
                for (const [id, player] of room.game.players) {
                    if (player.id === user.id) {
                        gamePlayer = player;
                        break;
                    }
                }
                // 如果找到了玩家，确保其状态正确
                if (gamePlayer) {
                    // 只有当玩家处于重连状态时才将其状态设置为'NOT_READY'
                    // 否则保持玩家的原有状态（如弃牌状态）
                    gamePlayer.isSpectator = false;
                } else {
                    // 如果没找到，添加新玩家
                    room.game.addPlayer(user.id, user.nickname);
                }
                room.saveToStorage();
                // 发送房间信息和游戏状态
                ws.send(JSON.stringify({
                    type: 'roomJoined',
                    room: room.toJSON()
                }));
                sendGameStateToRoom(room.id);
                console.log(`玩家 ${user.username} 重连成功，恢复房间ID: ${currentPlayer.roomId}`);
            }
            reconnectList.delete(user.id);
        }
    }
    
    console.log(`用户 ${user.username} 登录成功，用户ID: ${user.id}`);
            // 读取表情包名录和扑克牌皮肤
            const emojiCollections = require('../data/emojiCollections.json');
            const cardSkins = require('../data/cardSkins.json');
            
            // 获取用户权限的皮肤
            const userPermissions = cardSkins.permissions[user.id] || [];
            const availableSkins = {};
            
            // 所有用户都可以使用默认皮肤
            availableSkins.default = cardSkins.skins.default;
            
            // 添加用户有权限的皮肤
            userPermissions.forEach(skinId => {
                if (cardSkins.skins[skinId]) {
                    availableSkins[skinId] = cardSkins.skins[skinId];
                }
            });
            
            ws.send(JSON.stringify({
                type: 'loginSuccess',
                userId: user.id,
                playerId: user.id,
                nickname: user.nickname,
                avatarUpdatedAt: user.avatarUpdatedAt,
                emojiCollections: emojiCollections,
                cardSkins: availableSkins
            }));
}

function sendGameStateToRoom(roomId) {
    const room = rooms.get(roomId);
    console.log(`sendGameStateToRoom 房间 ${roomId}, 存在: ${!!room}, 游戏存在: ${!!room?.game}`);
    if (room && room.game) {
        console.log(`房间 ${roomId} 玩家数量: ${room.game.players.size}`);
        room.game.players.forEach((gamePlayer) => {
            const wsPlayer = players.get(gamePlayer.id);
            console.log(`  玩家 ${gamePlayer.id}, WS存在: ${!!wsPlayer}, 已登录: ${wsPlayer?.loggedIn}, 准备状态: ${wsPlayer?.ws.readyState}`);
            if (wsPlayer && wsPlayer.loggedIn && wsPlayer.ws.readyState === WebSocket.OPEN) {
                // 确保发送给玩家的游戏状态中包含该玩家的手牌
                const gameState = room.game.getGameState(gamePlayer.id);
                // 添加房间的扑克牌皮肤信息
                gameState.cardSkin = room.cardSkin;
                wsPlayer.ws.send(JSON.stringify({
                    type: 'gameState',
                    state: gameState
                }));
            }
        });
    }
}

function getRoomList() {
    const roomList = [];
    rooms.forEach((room) => {
        roomList.push(room.toJSON());
    });
    return roomList;
}

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

// 处理玩家消息的通用函数（供WebSocket和HTTP POST共用）
function processPlayerMessage(currentPlayer, data) {
    try {
        const player = players.get(currentPlayer.id);
        const ws = currentPlayer.ws;
        
        switch (data.type) {
                case 'register':
                    if (data.inviteCode !== 'xuerma') {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '邀请码错误'
                        }));
                        break;
                    }
                    const registerId = Math.random().toString(36).substring(2, 15);
                    const registerSuccess = createUser(registerId, data.username, data.password, data.nickname);
                    if (registerSuccess) {
                        onlineUsers.add(registerId);
                        updateUserOnline(registerId, true);
                        
                        const oldId = currentPlayer.id;
                        
                        players.delete(oldId);
                        currentPlayer.id = registerId;
                        currentPlayer.userId = registerId;
                        currentPlayer.loggedIn = true;
                        currentPlayer.name = data.nickname;
                        players.set(registerId, currentPlayer);
                        
                        if (currentPlayer.roomId) {
                            const room = rooms.get(currentPlayer.roomId);
                            if (room) {
                                const oldGamePlayer = room.game.players.get(oldId);
                                if (oldGamePlayer) {
                                    room.game.players.delete(oldId);
                                    oldGamePlayer.id = registerId;
                                    room.game.players.set(registerId, oldGamePlayer);
                                    room.saveToStorage();
                                    sendGameStateToRoom(room.id);
                                }
                            }
                        }
                        
                        console.log(`用户 ${data.username} 注册成功并登录，用户ID: ${registerId}`);
            const now = Date.now();
            ws.send(JSON.stringify({
                type: 'registerSuccess',
                userId: registerId,
                playerId: registerId,
                nickname: data.nickname,
                avatarUpdatedAt: null
            }));

                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '用户名已存在'
                        }));
                    }
                    break;

                case 'login':
                    const user = getUserByUsername(data.username);
                    if (user && user.password === data.password) {
                        console.log(`用户 ${data.username} 尝试登录，用户ID: ${user.id}，当前在线用户: ${Array.from(onlineUsers)}`);
                        if (onlineUsers.has(user.id)) {
                            console.log(`用户 ${data.username} 已在线，发送登录冲突通知`);
                            ws.send(JSON.stringify({
                                type: 'loginConflict',
                                message: '检测到账号已登录，是否进行顶号？',
                                userId: user.id,
                                nickname: user.nickname
                            }));
                        } else {
                            // 直接登录
                            completeLogin(user, currentPlayer, ws);
                        }
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '用户名或密码错误'
                        }));
                    }
                    break;
                    
                case 'confirmLogin':
                    if (data.confirm) {
                        const user = getUserById(data.userId);
                        if (user) {
                            console.log(`用户 ${user.username} 确认顶号，用户ID: ${user.id}`);
                            // 顶掉旧连接
                            players.forEach((oldPlayer, oldPlayerId) => {
                                if (oldPlayer.userId === user.id && oldPlayer.ws !== ws) {
                                    console.log(`顶掉旧连接: ${oldPlayerId}`);
                                    // 发送顶号通知，禁止重连
                                    // 检查是否是WebSocket连接（通过检查ws对象是否有close方法）
                                    if (typeof oldPlayer.ws.close === 'function') {
                                        // WebSocket连接
                                        if (oldPlayer.ws.readyState === WebSocket.OPEN) {
                                            oldPlayer.ws.send(JSON.stringify({
                                                type: 'kicked',
                                                message: '您的账号已在其他设备登录，您被强制下线'
                                            }));
                                            oldPlayer.ws.close();
                                        }
                                    } else {
                                        // SSE连接
                                        // 对于SSE连接，直接清理
                                        const sseRes = sseConnections.get(oldPlayerId);
                                        if (sseRes) {
                                            sseRes.end(); // 关闭SSE连接
                                            sseConnections.delete(oldPlayerId);
                                        }
                                    }
                                    players.delete(oldPlayerId);
                                }
                            });
                            // 完成登录
                            completeLogin(user, currentPlayer, ws);
                        }
                    } else {
                        ws.send(JSON.stringify({
                            type: 'loginCancelled',
                            message: '登录已取消'
                        }));
                    }
                    break;

                case 'getRooms':
                    ws.send(JSON.stringify({
                        type: 'roomList',
                        rooms: getRoomList()
                    }));
                    break;
                    
                case 'createRoom':
                if (!currentPlayer.loggedIn) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '请先登录'
                    }));
                    return;
                }
                if (rooms.size >= MAX_ROOMS) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '房间数量已达上限'
                    }));
                    return;
                }
                const roomName = data.name || `房间 ${roomIdCounter}`;
                const endTime = data.endTime;
                const cardSkin = data.cardSkin || 'default';
                const newRoom = new Room(roomIdCounter++, roomName, currentPlayer.id, endTime, cardSkin);
                newRoom.addPlayer(currentPlayer.id, currentPlayer, currentPlayer.name);
                rooms.set(newRoom.id, newRoom);
                currentPlayer.roomId = newRoom.id;
                ws.send(JSON.stringify({
                    type: 'roomCreated',
                    room: newRoom.toJSON()
                }));
                sendGameStateToRoom(newRoom.id);
                broadcastToAll(JSON.stringify({
                    type: 'roomList',
                    rooms: getRoomList()
                }));
                break;
                    
                case 'joinRoom':
                    if (!currentPlayer.loggedIn) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '请先登录'
                        }));
                        return;
                    }
                    const roomToJoin = rooms.get(data.roomId);
                    if (!roomToJoin) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '房间不存在'
                        }));
                        return;
                    }
                    if (roomToJoin.getPlayerCount() >= MAX_PLAYERS_PER_ROOM) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '房间人数已满'
                        }));
                        return;
                    }
                    if (currentPlayer.roomId) {
                        const oldRoom = rooms.get(currentPlayer.roomId);
                        if (oldRoom) {
                            oldRoom.removePlayer(currentPlayer.id);
                            if (oldRoom.getPlayerCount() === 0) {
                                deleteRoom(oldRoom.id);
                                rooms.delete(oldRoom.id);
                            } else {
                                sendGameStateToRoom(oldRoom.id);
                            }
                        }
                    }
                    roomToJoin.addPlayer(currentPlayer.id, currentPlayer, currentPlayer.name);
                    roomToJoin.lastActionTime = Date.now(); // 更新最后行动时间
                    currentPlayer.roomId = roomToJoin.id;
                    ws.send(JSON.stringify({
                        type: 'roomJoined',
                        room: roomToJoin.toJSON()
                    }));
                    sendGameStateToRoom(roomToJoin.id);
                    broadcastToAll(JSON.stringify({
                        type: 'roomList',
                        rooms: getRoomList()
                    }));
                    console.log(`玩家 ${currentPlayer.id} 加入房间 ${roomToJoin.id}`);
                    break;
                    
                case 'leaveRoom':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const currentRoom = rooms.get(currentPlayer.roomId);
                    if (currentRoom) {
                        currentRoom.removePlayer(currentPlayer.id);
                        if (currentRoom.getPlayerCount() === 0 || currentRoom.game.areAllPlayersLeft()) {
                            deleteRoom(currentRoom.id);
                            rooms.delete(currentRoom.id);
                        } else {
                            sendGameStateToRoom(currentRoom.id);
                        }
                    }
                    currentPlayer.roomId = null;
                    ws.send(JSON.stringify({
                        type: 'roomLeft'
                    }));
                    broadcastToAll(JSON.stringify({
                        type: 'roomList',
                        rooms: getRoomList()
                    }));
                    break;
                    
                case 'toggleReady':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const room = rooms.get(currentPlayer.roomId);
                    if (room) {
                        const result = room.game.setPlayerReady(currentPlayer.id, data.ready);
                        room.lastActionTime = Date.now(); // 更新最后行动时间
                        console.log(`玩家 ${currentPlayer.id} 切换准备状态为: ${data.ready}`);
                        if (!result.success) {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: result.message
                            }));
                        }
                    }
                    break;
                    
                case 'playerAction':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const actionRoom = rooms.get(currentPlayer.roomId);
                    if (actionRoom && actionRoom.game) {
                        // 检查玩家是否在重连名单中，如果是，将其移除
                        if (actionRoom.game.isPlayerReconnecting(currentPlayer.id)) {
                            actionRoom.game.removeFromReconnectList(currentPlayer.id);
                            console.log(`玩家 ${currentPlayer.name} 重连成功，从重连名单中移除`);
                        }
                        
                        const success = actionRoom.game.playerAction(currentPlayer.id, data.action, data.amount);
                        if (success) {
                            actionRoom.lastActionTime = Date.now(); // 更新最后行动时间
                            actionRoom.saveToStorage();
                            sendGameStateToRoom(actionRoom.id);
                            
                            // 发送玩家操作日志
                            const actionNames = {
                                'fold': '弃牌',
                                'check': '过牌',
                                'call': '跟注',
                                'raise': '加注',
                                'allin': '全下'
                            };
                            broadcastToRoom(actionRoom.id, JSON.stringify({
                                type: 'playerAction',
                                playerName: currentPlayer.name,
                                action: actionNames[data.action] || data.action,
                                amount: data.amount
                            }));
                        } else {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: '操作无效'
                            }));
                        }
                    }
                    break;
                    
                case 'borrowChips':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const borrowRoom = rooms.get(currentPlayer.roomId);
                    if (borrowRoom && borrowRoom.game) {
                        const result = borrowRoom.game.borrowChips(currentPlayer.id, data.amount);
                        if (result.success) {
                            borrowRoom.saveToStorage();
                            sendGameStateToRoom(borrowRoom.id);
                            ws.send(JSON.stringify({
                                type: 'borrowSuccess',
                                ...result
                            }));
                        } else {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: result.message
                            }));
                        }
                    }
                    break;

                case 'repayChips':
                if (!currentPlayer.roomId) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '你不在任何房间中'
                    }));
                    return;
                }
                const repayRoom = rooms.get(currentPlayer.roomId);
                if (repayRoom && repayRoom.game) {
                    const result = repayRoom.game.repayChips(currentPlayer.id, data.amount);
                    if (result.success) {
                        repayRoom.saveToStorage();
                        sendGameStateToRoom(repayRoom.id);
                        ws.send(JSON.stringify({
                            type: 'repaySuccess',
                            ...result
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: result.message
                        }));
                    }
                }
                break;
                
            case 'giftChips':
                if (!currentPlayer.roomId) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '你不在任何房间中'
                    }));
                    return;
                }
                const giftRoom = rooms.get(currentPlayer.roomId);
                if (giftRoom && giftRoom.game) {
                    const result = giftRoom.game.giftChips(currentPlayer.id, data.toPlayerId, data.amount);
                    if (result.success) {
                        giftRoom.saveToStorage();
                        sendGameStateToRoom(giftRoom.id);
                        // 通知赠送者
                        ws.send(JSON.stringify({
                            type: 'giftSuccess',
                            ...result,
                            isSender: true,
                            senderName: currentPlayer.name,
                            receiverName: giftRoom.game.players.get(data.toPlayerId)?.name || '未知玩家',
                            amount: data.amount
                        }));
                        // 通知接收者
                        const receiverPlayer = players.get(data.toPlayerId);
                        if (receiverPlayer && receiverPlayer.loggedIn && receiverPlayer.ws.readyState === WebSocket.OPEN) {
                            receiverPlayer.ws.send(JSON.stringify({
                                type: 'giftReceived',
                                ...result,
                                isSender: false,
                                senderName: currentPlayer.name,
                                receiverName: giftRoom.game.players.get(data.toPlayerId)?.name || '未知玩家',
                                amount: data.amount
                            }));
                        }
                    }
                }
                break;
                
                case 'getUserInfo':
                    if (currentPlayer.loggedIn) {
                        const user = getUserById(currentPlayer.userId);
                        if (user) {
                    ws.send(JSON.stringify({
                        type: 'userInfo',
                        user: {
                            id: user.id,
                            username: user.username,
                            nickname: user.nickname,
                            avatarUpdatedAt: user.avatarUpdatedAt
                        }
                    }));
                }
                    }
                    break;
                    
                case 'updateUserInfo':
                    if (currentPlayer.loggedIn) {
                        if (data.nickname) {
                            updateUserNickname(currentPlayer.userId, data.nickname);
                            currentPlayer.name = data.nickname;
                        }
                        ws.send(JSON.stringify({
                            type: 'userInfoUpdated',
                            success: true
                        }));
                    }
                    break;

                case 'voteRunIt':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const voteRoom = rooms.get(currentPlayer.roomId);
                    if (voteRoom && voteRoom.game) {
                        const result = voteRoom.game.voteRunIt(currentPlayer.id, data.times);
                        if (result.success) {
                            voteRoom.saveToStorage();
                            sendGameStateToRoom(voteRoom.id);
                        } else {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: result.message
                            }));
                        }
                    }
                    break;

                case 'requestResetRoom':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const resetRoom = rooms.get(currentPlayer.roomId);
                    if (resetRoom && resetRoom.game && resetRoom.game.stage === 'result') {
                        // 广播重置房间投票请求
                        broadcastToRoom(resetRoom.id, JSON.stringify({
                            type: 'resetRoomRequest',
                            message: `${currentPlayer.name} 请求重置房间，是否同意？`,
                            requester: currentPlayer.name
                        }));
                    }
                    break;

                case 'requestKickPlayer':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const kickRoom = rooms.get(currentPlayer.roomId);
                    if (kickRoom) {
                        const targetPlayerId = data.targetPlayerId;
                        const targetPlayer = kickRoom.game.players.get(targetPlayerId);
                        if (targetPlayer) {
                            // 存储目标玩家ID
                            kickRoom.kickTargetPlayerId = targetPlayerId;
                            // 清空之前的投票记录
                            kickRoom.kickVotes.clear();
                            // 广播踢出玩家投票请求
                            broadcastToRoom(kickRoom.id, JSON.stringify({
                                type: 'kickPlayerRequest',
                                message: `${currentPlayer.name} 请求踢出 ${targetPlayer.name}，是否同意？`,
                                requester: currentPlayer.name,
                                targetPlayerName: targetPlayer.name
                            }));
                        } else {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: '目标玩家不存在'
                            }));
                        }
                    }
                    break;

                case 'voteKickPlayer':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const kickVoteRoom = rooms.get(currentPlayer.roomId);
                    if (kickVoteRoom && kickVoteRoom.kickTargetPlayerId) {
                        // 记录投票
                        kickVoteRoom.kickVotes.set(currentPlayer.id, data.vote);
                        // 检查投票结果
                        kickVoteRoom.checkKickVoteResult();
                    }
                    break;

                case 'voteResetRoom':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const resetVoteRoom = rooms.get(currentPlayer.roomId);
                    if (resetVoteRoom) {
                        // 记录投票
                        resetVoteRoom.resetVotes.set(currentPlayer.id, 'yes');
                        // 检查投票结果
                        resetVoteRoom.checkResetVoteResult();
                    }
                    break;

                case 'rejectResetRoom':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const rejectResetRoom = rooms.get(currentPlayer.roomId);
                    if (rejectResetRoom) {
                        // 记录投票
                        rejectResetRoom.resetVotes.set(currentPlayer.id, 'no');
                        // 检查投票结果
                        rejectResetRoom.checkResetVoteResult();
                    }
                    break;

                case 'chooseShowdown':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const showdownRoom = rooms.get(currentPlayer.roomId);
                    if (showdownRoom && showdownRoom.game) {
                        const result = showdownRoom.game.chooseShowdown(currentPlayer.id, data.showHand);
                        if (result.success) {
                            showdownRoom.saveToStorage();
                            sendGameStateToRoom(showdownRoom.id);
                        } else {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: result.message
                            }));
                        }
                    }
                    break;
                    
                case 'setSpectator':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const spectatorRoom = rooms.get(currentPlayer.roomId);
                    if (spectatorRoom && spectatorRoom.game) {
                        const result = spectatorRoom.game.setPlayerSpectator(currentPlayer.id, data.isSpectator);
                        if (result.success) {
                            spectatorRoom.saveToStorage();
                            sendGameStateToRoom(spectatorRoom.id);
                        } else {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: result.message
                            }));
                        }
                    }
                    break;
                    
                case 'voteExtendRoom':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const extendRoom = rooms.get(currentPlayer.roomId);
                    if (extendRoom && extendRoom.isEnding) {
                        // 记录投票
                        extendRoom.extendVotes.set(currentPlayer.id, 'yes');
                        // 检查投票结果
                        extendRoom.checkExtendVoteResult();
                    }
                    break;
                    
                case 'rejectExtendRoom':
                    if (!currentPlayer.roomId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '你不在任何房间中'
                        }));
                        return;
                    }
                    const rejectRoom = rooms.get(currentPlayer.roomId);
                    if (rejectRoom && rejectRoom.isEnding) {
                        // 记录投票
                        rejectRoom.extendVotes.set(currentPlayer.id, 'no');
                        // 检查投票结果
                        rejectRoom.checkExtendVoteResult();
                    }
                    break;

                case 'hello':
                    console.log('客户端问候:', data.message);
                    break;
                    
                case 'chatMessage':
                    if (currentPlayer.loggedIn) {
                        // 检查是否是特殊指令
                        if (data.message.startsWith('!bot')) {
                            if (currentPlayer.roomId) {
                                const room = rooms.get(currentPlayer.roomId);
                                if (room) {
                                    // 处理特殊指令
                                    handleSpecialCommand(data.message, room.name, (error, result) => {
                                        // 向发送者返回指令执行结果
                                        if (currentPlayer.ws && currentPlayer.ws.readyState === WebSocket.OPEN) {
                                            currentPlayer.ws.send(JSON.stringify({
                                                type: 'chatMessage',
                                                message: error ? `指令执行失败: ${error.message}` : `指令执行成功: ${result.message}`,
                                                sender: '系统',
                                                senderId: 'system',
                                                timestamp: Date.now()
                                            }));
                                        }
                                    });
                                }
                            }
                        } else {
                            // 广播聊天消息给房间内所有玩家
                            if (currentPlayer.roomId) {
                                const room = rooms.get(currentPlayer.roomId);
                                if (room) {
                                    // 存储聊天消息
                                    const chatMessage = {
                                        id: Date.now().toString(),
                                        sender: currentPlayer.name,
                                        senderId: currentPlayer.id,
                                        message: data.message,
                                        timestamp: Date.now(),
                                        type: 'chat'
                                    };
                                    room.chatMessages.push(chatMessage);
                                    room.lastActionTime = Date.now(); // 更新最后行动时间
                                    room.saveToStorage();
                                    
                                    // 广播聊天消息
                                    broadcastToRoom(currentPlayer.roomId, JSON.stringify({
                                        type: 'chatMessage',
                                        message: data.message,
                                        sender: currentPlayer.name,
                                        senderId: currentPlayer.id,
                                        timestamp: Date.now()
                                    }));
                                }
                            }
                        }
                    }
                    break;
                    
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                    
                default:
                    console.log('未知消息类型:', data.type);
            }
        } catch (error) {
            console.error('处理消息失败:', error);
        }
    }

// 定期检查房间活跃度，清除10分钟没有行动的房间
function checkRoomActivity() {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    rooms.forEach((room, roomId) => {
        if (now - room.lastActionTime > tenMinutes) {
            console.log(`房间 ${roomId} 超过10分钟没有行动，检查是否需要清除`);
            
            // 检查房间中是否还有活跃玩家
            const hasActivePlayers = Array.from(room.game.players.values()).some(player => {
                return player.state !== 'left' && !room.game.reconnectingPlayers.has(player.id);
            });
            
            if (!hasActivePlayers) {
                console.log(`房间 ${roomId} 没有活跃玩家，清除房间`);
                // 通知房间内的所有玩家
                broadcastToRoom(roomId, JSON.stringify({
                    type: 'roomInactive',
                    message: '房间超过10分钟没有行动，已被清除'
                }));
                // 清除房间
                deleteRoom(roomId);
                rooms.delete(roomId);
                // 广播房间列表更新
                broadcastToAll(JSON.stringify({
                    type: 'roomList',
                    rooms: getRoomList()
                }));
            }
        }
    });
}

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`WebSocket服务器运行在 ws://localhost:${PORT}`);
    
    setInterval(() => {
        const now = Date.now();
        const timeout = 1200000;
        players.forEach((player, playerId) => {
            if (now - player.lastActivity > timeout && player.ws.readyState === WebSocket.OPEN) {
                console.log(`清理不活跃连接: ${playerId}, 最后活动时间: ${new Date(player.lastActivity).toLocaleTimeString()}`);
                player.ws.close();
            }
        });
        
        // 清理不活跃的SSE连接（超过20分钟没有活动）
        const sseTimeout = 1200000; // 20分钟
        sseConnections.forEach((res, clientId) => {
            const player = players.get(clientId);
            if (player) {
                if (now - player.lastActivity > sseTimeout) {
                    console.log(`清理不活跃SSE连接: ${clientId}, 最后活动时间: ${new Date(player.lastActivity).toLocaleTimeString()}`);
                    res.end(); // 关闭SSE连接，会触发close事件
                }
            } else {
                // 如果没有对应的player，清理该SSE连接
                console.log(`清理无对应player的SSE连接: ${clientId}`);
                res.end(); // 关闭SSE连接，会触发close事件
            }
        });
        
        // 清理过期的重连记录（超过30秒）
        const reconnectTimeout = 30000;
        reconnectList.forEach((info, userId) => {
            if (now - info.disconnectTime > reconnectTimeout) {
                reconnectList.delete(userId);
                console.log(`清理过期重连记录: ${userId}`);
            }
        });
        
        // 检查房间活跃度，清除10分钟没有行动的房间
        checkRoomActivity();
    }, 30000);
});
