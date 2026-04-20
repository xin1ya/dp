const { saveRoom } = require('../roomStorage');
const { Game } = require('../game');
const { MAX_PLAYERS_PER_ROOM, MIN_PLAYERS_PER_ROOM } = require('../config/config');
const { broadcastToAll, broadcastToRoom, sendGameStateToRoom, getRoomList } = require('../utils/broadcast');

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



module.exports = Room;