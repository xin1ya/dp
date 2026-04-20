// 消息处理器

const { createUser, getUserByUsername, getUserById, updateLastLogin, updateUserOnline, updateUserAvatar, updateUserNickname } = require('../db');
const { broadcastToAll, broadcastToRoom, sendGameStateToRoom, getRoomList, handleSpecialCommand } = require('./helpers');
const { MAX_ROOMS, MAX_PLAYERS_PER_ROOM } = require('../config/config');

// 完成登录流程
function completeLogin(user, currentPlayer, ws, players, sseConnections, rooms, reconnectList) {
    updateLastLogin(user.username);
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
                sendGameStateToRoom(room, players);
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
                sendGameStateToRoom(room, players);
                console.log(`玩家 ${user.username} 重连成功，恢复房间ID: ${currentPlayer.roomId}`);
            }
            reconnectList.delete(user.id);
        }
    }
    
    console.log(`用户 ${user.username} 登录成功，用户ID: ${user.id}`);
            // 读取表情包名录和扑克牌皮肤
            const emojiCollections = require('../../data/emojiCollections.json');
            const cardSkins = require('../../data/cardSkins.json');
            
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

// 处理玩家消息的通用函数（供WebSocket和HTTP POST共用）
function processPlayerMessage(currentPlayer, data, players, rooms, sseConnections, reconnectList, onlineUsers) {
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
                                    sendGameStateToRoom(room, players);
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
                            completeLogin(user, currentPlayer, ws, players, sseConnections, rooms, reconnectList);
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
                                        if (oldPlayer.ws.readyState === 1) { // 1 = OPEN
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
                            completeLogin(user, currentPlayer, ws, players, sseConnections, rooms, reconnectList);
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
                        rooms: getRoomList(rooms)
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
                const Room = require('../models/Room');
                const roomName = data.name || `房间 ${rooms.size + 1}`;
                const endTime = data.endTime;
                const cardSkin = data.cardSkin || 'default';
                const newRoom = new Room(rooms.size + 1, roomName, currentPlayer.id, endTime, cardSkin);
                newRoom.addPlayer(currentPlayer.id, currentPlayer.name);
                rooms.set(newRoom.id, newRoom);
                currentPlayer.roomId = newRoom.id;
                ws.send(JSON.stringify({
                    type: 'roomCreated',
                    room: newRoom.toJSON()
                }));
                sendGameStateToRoom(newRoom, players);
                broadcastToAll(players, JSON.stringify({
                    type: 'roomList',
                    rooms: getRoomList(rooms)
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
                                const { deleteRoom } = require('../roomStorage');
                                deleteRoom(oldRoom.id);
                                rooms.delete(oldRoom.id);
                            } else {
                                sendGameStateToRoom(oldRoom, players);
                            }
                        }
                    }
                    roomToJoin.addPlayer(currentPlayer.id, currentPlayer.name);
                    roomToJoin.lastActionTime = Date.now(); // 更新最后行动时间
                    currentPlayer.roomId = roomToJoin.id;
                    ws.send(JSON.stringify({
                        type: 'roomJoined',
                        room: roomToJoin.toJSON()
                    }));
                    sendGameStateToRoom(roomToJoin, players);
                    broadcastToAll(players, JSON.stringify({
                        type: 'roomList',
                        rooms: getRoomList(rooms)
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
                            const { deleteRoom } = require('../roomStorage');
                            deleteRoom(currentRoom.id);
                            rooms.delete(currentRoom.id);
                        } else {
                            sendGameStateToRoom(currentRoom, players);
                        }
                    }
                    currentPlayer.roomId = null;
                    ws.send(JSON.stringify({
                        type: 'roomLeft'
                    }));
                    broadcastToAll(players, JSON.stringify({
                        type: 'roomList',
                        rooms: getRoomList(rooms)
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
                            sendGameStateToRoom(actionRoom, players);
                            
                            // 发送玩家操作日志
                            const actionNames = {
                                'fold': '弃牌',
                                'check': '过牌',
                                'call': '跟注',
                                'raise': '加注',
                                'allin': '全下'
                            };
                            broadcastToRoom(actionRoom, players, JSON.stringify({
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
                            sendGameStateToRoom(borrowRoom, players);
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
                        sendGameStateToRoom(repayRoom, players);
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
                        sendGameStateToRoom(giftRoom, players);
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
                        if (receiverPlayer && receiverPlayer.loggedIn && receiverPlayer.ws.readyState === 1) { // 1 = OPEN
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
                            sendGameStateToRoom(voteRoom, players);
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
                        broadcastToRoom(resetRoom, players, JSON.stringify({
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
                            broadcastToRoom(kickRoom, players, JSON.stringify({
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
                        const result = kickVoteRoom.checkKickVoteResult();
                        // 处理投票结果
                        if (result.result === 'kicked') {
                            broadcastToRoom(kickVoteRoom, players, JSON.stringify({
                                type: 'playerKicked',
                                message: `${kickVoteRoom.game.players.get(kickVoteRoom.kickTargetPlayerId)?.name} 被投票踢出，已切换为弃牌状态`
                            }));
                            sendGameStateToRoom(kickVoteRoom, players);
                        } else if (result.result === 'cancelled') {
                            broadcastToRoom(kickVoteRoom, players, JSON.stringify({
                                type: 'kickPlayerCancelled',
                                message: '踢出玩家投票未通过，取消踢出'
                            }));
                        } else if (result.result === 'waiting') {
                            broadcastToRoom(kickVoteRoom, players, JSON.stringify({
                                type: 'kickVoteUpdate',
                                yesVotes: result.yesVotes,
                                noVotes: result.noVotes,
                                totalPlayers: result.totalPlayers,
                                requiredVotes: result.requiredVotes
                            }));
                        }
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
                        const result = resetVoteRoom.checkResetVoteResult();
                        // 处理投票结果
                        if (result.result === 'reset') {
                            broadcastToRoom(resetVoteRoom, players, JSON.stringify({
                                type: 'roomReset',
                                message: '房间已重置，所有玩家筹码和待还筹码已调整为2000'
                            }));
                            sendGameStateToRoom(resetVoteRoom, players);
                        } else if (result.result === 'cancelled') {
                            broadcastToRoom(resetVoteRoom, players, JSON.stringify({
                                type: 'resetRoomCancelled',
                                message: '重置房间投票未通过，取消重置'
                            }));
                        } else if (result.result === 'waiting') {
                            broadcastToRoom(resetVoteRoom, players, JSON.stringify({
                                type: 'resetVoteUpdate',
                                yesVotes: result.yesVotes,
                                noVotes: result.noVotes,
                                totalPlayers: result.totalPlayers,
                                requiredVotes: result.requiredVotes
                            }));
                        }
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
                        const result = rejectResetRoom.checkResetVoteResult();
                        // 处理投票结果
                        if (result.result === 'reset') {
                            broadcastToRoom(rejectResetRoom, players, JSON.stringify({
                                type: 'roomReset',
                                message: '房间已重置，所有玩家筹码和待还筹码已调整为2000'
                            }));
                            sendGameStateToRoom(rejectResetRoom, players);
                        } else if (result.result === 'cancelled') {
                            broadcastToRoom(rejectResetRoom, players, JSON.stringify({
                                type: 'resetRoomCancelled',
                                message: '重置房间投票未通过，取消重置'
                            }));
                        } else if (result.result === 'waiting') {
                            broadcastToRoom(rejectResetRoom, players, JSON.stringify({
                                type: 'resetVoteUpdate',
                                yesVotes: result.yesVotes,
                                noVotes: result.noVotes,
                                totalPlayers: result.totalPlayers,
                                requiredVotes: result.requiredVotes
                            }));
                        }
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
                            sendGameStateToRoom(showdownRoom, players);
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
                            sendGameStateToRoom(spectatorRoom, players);
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
                        const result = extendRoom.checkExtendVoteResult();
                        // 处理投票结果
                        if (result.result === 'extended') {
                            broadcastToRoom(extendRoom, players, JSON.stringify({
                                type: 'roomExtended',
                                message: `房间结束时间已延长 1 小时`,
                                endTime: extendRoom.endTime
                            }));
                        } else if (result.result === 'ended') {
                            broadcastToRoom(extendRoom, players, JSON.stringify({
                                type: 'roomEnded',
                                message: '房间已结束，无法进行准备'
                            }));
                        } else if (result.result === 'waiting') {
                            broadcastToRoom(extendRoom, players, JSON.stringify({
                                type: 'extendVoteUpdate',
                                yesVotes: result.yesVotes,
                                noVotes: result.noVotes,
                                totalPlayers: result.totalPlayers,
                                requiredVotes: result.requiredVotes
                            }));
                        }
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
                        const result = rejectRoom.checkExtendVoteResult();
                        // 处理投票结果
                        if (result.result === 'extended') {
                            broadcastToRoom(rejectRoom, players, JSON.stringify({
                                type: 'roomExtended',
                                message: `房间结束时间已延长 1 小时`,
                                endTime: rejectRoom.endTime
                            }));
                        } else if (result.result === 'ended') {
                            broadcastToRoom(rejectRoom, players, JSON.stringify({
                                type: 'roomEnded',
                                message: '房间已结束，无法进行准备'
                            }));
                        } else if (result.result === 'waiting') {
                            broadcastToRoom(rejectRoom, players, JSON.stringify({
                                type: 'extendVoteUpdate',
                                yesVotes: result.yesVotes,
                                noVotes: result.noVotes,
                                totalPlayers: result.totalPlayers,
                                requiredVotes: result.requiredVotes
                            }));
                        }
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
                                        if (currentPlayer.ws && currentPlayer.ws.readyState === 1) { // 1 = OPEN
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
                                    broadcastToRoom(room, players, JSON.stringify({
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

module.exports = {
    processPlayerMessage,
    completeLogin
};
