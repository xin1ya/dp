const { completeLogin } = require('../utils/auth');
const { broadcastToAll, broadcastToRoom, sendGameStateToRoom, getRoomList } = require('../utils/broadcast');
const { MAX_ROOMS, MAX_PLAYERS_PER_ROOM } = require('../config/config');
const { deleteRoom } = require('../roomStorage');
const Room = require('../models/Room');
const { createUser, getUserByUsername, getUserById, updateUserOnline, updateUserNickname } = require('../db');
const { handleSpecialCommand } = require('../utils/botCommands');
const WebSocket = require('ws');

let rooms = new Map();
let players = new Map();
let sseConnections = new Map();
let reconnectList = new Map();
let roomIdCounter = 1;
let onlineUsers = new Set();

// 设置全局变量
function setGlobalVariables(r, p, s, re, rc, ou) {
    rooms = r;
    players = p;
    sseConnections = s;
    reconnectList = re;
    roomIdCounter = rc;
    if (ou) onlineUsers = ou;
}

// 处理玩家消息
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
                        
                        // 发送赠送成功消息给赠送者
                        ws.send(JSON.stringify({
                            type: 'giftSuccess',
                            ...result
                        }));
                        
                        // 发送收到筹码消息给接收者
                        const receiverPlayer = players.get(data.toPlayerId);
                        if (receiverPlayer && receiverPlayer.ws.readyState === WebSocket.OPEN) {
                            receiverPlayer.ws.send(JSON.stringify({
                                type: 'giftReceived',
                                ...result
                            }));
                        }
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: result.message
                        }));
                    }
                }
                break;

            case 'chatMessage':
                if (!currentPlayer.roomId) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '你不在任何房间中'
                    }));
                    return;
                }
                const chatRoom = rooms.get(currentPlayer.roomId);
                if (chatRoom) {
                    // 处理特殊指令
                    if (data.message.startsWith('!bot')) {
                        handleSpecialCommand(data.message, chatRoom.name, (error, result) => {
                            if (error) {
                                ws.send(JSON.stringify({
                                    type: 'error',
                                    message: error.message
                                }));
                            } else {
                                // 发送机器人操作结果
                                broadcastToRoom(currentPlayer.roomId, JSON.stringify({
                                    type: 'chatMessage',
                                    message: result.message,
                                    isSystem: true
                                }));
                            }
                        });
                    } else {
                        // 普通聊天消息
                        chatRoom.chatMessages.push({
                            sender: currentPlayer.name,
                            message: data.message,
                            timestamp: Date.now()
                        });
                        chatRoom.saveToStorage();
                        
                        broadcastToRoom(currentPlayer.roomId, JSON.stringify({
                            type: 'chatMessage',
                            message: data.message,
                            sender: currentPlayer.name,
                            senderId: currentPlayer.id
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
                if (extendRoom) {
                    extendRoom.extendVotes.set(currentPlayer.id, 'yes');
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
                if (rejectRoom) {
                    rejectRoom.extendVotes.set(currentPlayer.id, 'no');
                    rejectRoom.checkExtendVoteResult();
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
                if (resetRoom) {
                    // 广播重置房间请求
                    broadcastToRoom(currentPlayer.roomId, JSON.stringify({
                        type: 'resetRoomRequest',
                        requester: currentPlayer.name
                    }));
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
                const voteResetRoom = rooms.get(currentPlayer.roomId);
                if (voteResetRoom) {
                    voteResetRoom.resetVotes.set(currentPlayer.id, 'yes');
                    voteResetRoom.checkResetVoteResult();
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
                    rejectResetRoom.resetVotes.set(currentPlayer.id, 'no');
                    rejectResetRoom.checkResetVoteResult();
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
                    const targetPlayer = kickRoom.game.players.get(data.targetPlayerId);
                    if (targetPlayer) {
                        kickRoom.kickTargetPlayerId = data.targetPlayerId;
                        // 广播踢出玩家请求
                        broadcastToRoom(currentPlayer.roomId, JSON.stringify({
                            type: 'kickPlayerRequest',
                            requester: currentPlayer.name,
                            targetPlayerName: targetPlayer.name
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
                const voteKickRoom = rooms.get(currentPlayer.roomId);
                if (voteKickRoom) {
                    voteKickRoom.kickVotes.set(currentPlayer.id, data.vote);
                    voteKickRoom.checkKickVoteResult();
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
                const runItRoom = rooms.get(currentPlayer.roomId);
                if (runItRoom && runItRoom.game) {
                    runItRoom.game.voteRunIt(currentPlayer.id, data.times);
                    sendGameStateToRoom(runItRoom.id);
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
                    showdownRoom.game.chooseShowdown(currentPlayer.id, data.showHand);
                    sendGameStateToRoom(showdownRoom.id);
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
                    spectatorRoom.game.setPlayerSpectator(currentPlayer.id, data.isSpectator);
                    spectatorRoom.saveToStorage();
                    sendGameStateToRoom(spectatorRoom.id);
                }
                break;

            case 'getUserInfo':
                if (!currentPlayer.loggedIn) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '请先登录'
                    }));
                    return;
                }
                const userInfo = getUserById(currentPlayer.userId);
                if (userInfo) {
                    ws.send(JSON.stringify({
                        type: 'userInfo',
                        user: userInfo
                    }));
                }
                break;

            case 'updateUserInfo':
                if (!currentPlayer.loggedIn) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '请先登录'
                    }));
                    return;
                }
                if (data.nickname) {
                    const success = updateUserNickname(currentPlayer.userId, data.nickname);
                    if (success) {
                        currentPlayer.name = data.nickname;
                        // 更新游戏中的玩家名称
                        if (currentPlayer.roomId) {
                            const updateRoom = rooms.get(currentPlayer.roomId);
                            if (updateRoom && updateRoom.game) {
                                const gamePlayer = updateRoom.game.players.get(currentPlayer.id);
                                if (gamePlayer) {
                                    gamePlayer.name = data.nickname;
                                    updateRoom.saveToStorage();
                                    sendGameStateToRoom(updateRoom.id);
                                }
                            }
                        }
                        ws.send(JSON.stringify({
                            type: 'userInfoUpdated',
                            success: true
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'userInfoUpdated',
                            success: false
                        }));
                    }
                }
                break;

            case 'ping':
                ws.send(JSON.stringify({
                    type: 'pong'
                }));
                break;

            default:
                console.log('未知消息类型:', data.type);
        }
    } catch (error) {
        console.error('处理玩家消息失败:', error);
    }
}



module.exports = {
    processPlayerMessage,
    setGlobalVariables
};