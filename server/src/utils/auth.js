const { updateLastLogin, updateUserOnline } = require('../db');
const { broadcastToRoom, sendGameStateToRoom } = require('./broadcast');

// 完成登录过程
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

// 全局变量
let players = new Map();
let rooms = new Map();
let sseConnections = new Map();
let reconnectList = new Map();
let onlineUsers = new Set();

// 设置全局变量
function setGlobalVariables(p, r, s, re, o) {
    players = p;
    rooms = r;
    sseConnections = s;
    reconnectList = re;
    onlineUsers = o;
}

module.exports = {
    completeLogin,
    setGlobalVariables
};