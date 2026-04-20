// Room模型

const { saveRoom, loadRoom, deleteRoom } = require('../roomStorage');
const { Game } = require('./game');

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
            // 发送游戏状态和房间列表更新的逻辑将由外部处理
        };
        this.saveToStorage();
    }
    
    checkEndTime() {
        if (this.endTime && !this.isEnding && Date.now() >= this.endTime) {
            this.isEnding = true;
            // 广播房间即将结束的消息的逻辑将由外部处理
        }
    }
    
    extendEndTime(hours) {
        if (this.endTime) {
            this.endTime += hours * 60 * 60 * 1000;
            this.isEnding = false;
            this.saveToStorage();
            // 广播房间延长消息的逻辑将由外部处理
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
            return { result: 'extended', yesVotes, noVotes, totalPlayers, requiredVotes };
        } else if (noVotes >= requiredVotes) {
            // 不同意延长的玩家达到一半以上，房间结束
            this.isEnding = true;
            this.saveToStorage();
            // 清空投票记录
            this.extendVotes.clear();
            return { result: 'ended', yesVotes, noVotes, totalPlayers, requiredVotes };
        } else {
            // 投票未达到一半以上，继续等待
            return { result: 'waiting', yesVotes, noVotes, totalPlayers, requiredVotes };
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
            return { result: 'reset', yesVotes, noVotes, totalPlayers, requiredVotes };
        } else if (noVotes >= requiredVotes) {
            // 不同意重置的玩家达到一半以上，取消重置
            // 清空投票记录
            this.resetVotes.clear();
            return { result: 'cancelled', yesVotes, noVotes, totalPlayers, requiredVotes };
        } else {
            // 投票未达到一半以上，继续等待
            return { result: 'waiting', yesVotes, noVotes, totalPlayers, requiredVotes };
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
            return { result: 'kicked', yesVotes, noVotes, totalPlayers, requiredVotes };
        } else if (noVotes >= requiredVotes) {
            // 不同意踢出的玩家达到一半以上，取消踢出
            // 清空投票记录
            this.kickVotes.clear();
            this.kickTargetPlayerId = null;
            return { result: 'cancelled', yesVotes, noVotes, totalPlayers, requiredVotes };
        } else {
            // 投票未达到一半以上，继续等待
            return { result: 'waiting', yesVotes, noVotes, totalPlayers, requiredVotes };
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
    }

    addPlayer(playerId, playerName) {
        if (this.game.players.size >= 12) { // MAX_PLAYERS_PER_ROOM
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
            maxPlayers: 12, // MAX_PLAYERS_PER_ROOM
            minPlayers: 4, // MIN_PLAYERS_PER_ROOM
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
