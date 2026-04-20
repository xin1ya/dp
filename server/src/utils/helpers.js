// 工具函数

const http = require('http');
const { deleteRoom } = require('../roomStorage');

// 广播消息给所有玩家
function broadcastToAll(players, message) {
    players.forEach((wsPlayer) => {
        if (wsPlayer.loggedIn && wsPlayer.ws.readyState === 1) { // 1 = OPEN
            wsPlayer.ws.send(message);
        }
    });
}

// 广播消息给房间内所有玩家
function broadcastToRoom(room, players, message) {
    if (room) {
        room.game.players.forEach((player) => {
            const wsPlayer = players.get(player.id);
            if (wsPlayer && wsPlayer.loggedIn && wsPlayer.ws.readyState === 1) { // 1 = OPEN
                wsPlayer.ws.send(message);
            }
        });
    }
}

// 发送游戏状态给房间内所有玩家
function sendGameStateToRoom(room, players) {
    console.log(`sendGameStateToRoom 房间 ${room.id}, 存在: ${!!room}, 游戏存在: ${!!room?.game}`);
    if (room && room.game) {
        console.log(`房间 ${room.id} 玩家数量: ${room.game.players.size}`);
        room.game.players.forEach((gamePlayer) => {
            const wsPlayer = players.get(gamePlayer.id);
            console.log(`  玩家 ${gamePlayer.id}, WS存在: ${!!wsPlayer}, 已登录: ${wsPlayer?.loggedIn}, 准备状态: ${wsPlayer?.ws.readyState}`);
            if (wsPlayer && wsPlayer.loggedIn && wsPlayer.ws.readyState === 1) { // 1 = OPEN
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

// 获取房间列表
function getRoomList(rooms) {
    const roomList = [];
    rooms.forEach((room) => {
        roomList.push(room.toJSON());
    });
    return roomList;
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

// 检查房间活跃度，清除不活跃的房间
function checkRoomActivity(rooms, players, broadcastToAll, broadcastToRoom) {
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
                broadcastToRoom(room, players, JSON.stringify({
                    type: 'roomInactive',
                    message: '房间超过10分钟没有行动，已被清除'
                }));
                // 清除房间
                deleteRoom(roomId);
                rooms.delete(roomId);
                // 广播房间列表更新
                broadcastToAll(players, JSON.stringify({
                    type: 'roomList',
                    rooms: getRoomList(rooms)
                }));
            }
        }
    });
}

module.exports = {
    broadcastToAll,
    broadcastToRoom,
    sendGameStateToRoom,
    getRoomList,
    callBotManagerApi,
    handleSpecialCommand,
    checkRoomActivity
};
