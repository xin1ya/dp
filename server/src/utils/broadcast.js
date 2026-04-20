const WebSocket = require('ws');

// 全局变量
let players = new Map();
let rooms = new Map();

// 设置全局变量
function setGlobalVariables(p, r) {
    players = p;
    rooms = r;
}

// 广播消息给所有玩家
function broadcastToAll(message) {
    players.forEach((wsPlayer) => {
        if (wsPlayer.loggedIn && wsPlayer.ws.readyState === WebSocket.OPEN) {
            wsPlayer.ws.send(message);
        }
    });
}

// 广播消息给房间内的所有玩家
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

// 发送游戏状态到房间
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

// 获取房间列表
function getRoomList() {
    const roomList = [];
    rooms.forEach((room) => {
        roomList.push(room.toJSON());
    });
    return roomList;
}

module.exports = {
    setGlobalVariables,
    broadcastToAll,
    broadcastToRoom,
    sendGameStateToRoom,
    getRoomList
};