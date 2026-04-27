const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
const { getUserById } = require('./db');

const HAND_RANKS = {
    HIGH_CARD: 1,
    ONE_PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
};

const HAND_NAMES = {
    1: '高牌',
    2: '一对',
    3: '两对',
    4: '三条',
    5: '顺子',
    6: '同花',
    7: '葫芦',
    8: '四条',
    9: '同花顺',
    10: '皇家同花顺'
};

const GAME_STAGES = {
    READY: 'ready',
    PRE_FLOP: 'preflop',
    FLOP: 'flop',
    TURN: 'turn',
    RIVER: 'river',
    RESULT: 'result'
};

const PLAYER_STATES = {
    NOT_READY: 'not_ready',
    READY: 'ready',
    FOLDED: 'folded',
    ALL_IN: 'all_in',
    LEFT: 'left'
};

class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = RANK_VALUES[rank];
    }

    toString() {
        return `${this.rank}${this.suit}`;
    }

    toJSON() {
        return {
            suit: this.suit,
            rank: this.rank,
            value: this.value
        };
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        if (this.cards.length === 0) {
            return null;
        }
        return this.cards.pop();
    }
}

class HandEvaluator {
    static evaluateHand(cards) {
        if (cards.length < 5) {
            return { rank: HAND_RANKS.HIGH_CARD, cards: cards.slice(-5).sort((a, b) => b.value - a.value) };
        }

        const combinations = this.getCombinations(cards, 5);
        let bestHand = null;

        for (const combo of combinations) {
            const evaluated = this.evaluateFiveCards(combo);
            if (!bestHand || this.compareHands(evaluated, bestHand) > 0) {
                bestHand = evaluated;
            }
        }

        return bestHand;
    }

    static getCombinations(arr, k) {
        if (k === 1) return arr.map(x => [x]);
        if (k === arr.length) return [arr];

        const result = [];
        const [first, ...rest] = arr;
        const withFirst = this.getCombinations(rest, k - 1).map(x => [first, ...x]);
        const withoutFirst = this.getCombinations(rest, k);
        return [...withFirst, ...withoutFirst];
    }

    static evaluateFiveCards(cards) {
        const originalSorted = [...cards].sort((a, b) => b.value - a.value);
        let sorted = [...originalSorted];
        const isFlush = this.isFlush(originalSorted);
        const isStraight = this.isStraight(originalSorted);
        const rankCounts = this.getRankCounts(originalSorted);
        const countValues = Object.values(rankCounts).sort((a, b) => b - a);

        const isLowStraight = originalSorted[0].value === 14 && originalSorted[1].value === 5 && 
                              originalSorted[2].value === 4 && originalSorted[3].value === 3 && originalSorted[4].value === 2;
        
        const isRoyalFlush = originalSorted[0].value === 14 && originalSorted[1].value === 13 && 
                              originalSorted[2].value === 12 && originalSorted[3].value === 11 && originalSorted[4].value === 10;
        
        if (isLowStraight) {
            sorted = [originalSorted[1], originalSorted[2], originalSorted[3], originalSorted[4], originalSorted[0]];
        }

        if (isFlush && isStraight && isRoyalFlush) {
            return { rank: HAND_RANKS.ROYAL_FLUSH, cards: sorted };
        }

        if (isFlush && isStraight) {
            return { rank: HAND_RANKS.STRAIGHT_FLUSH, cards: sorted };
        }

        if (countValues[0] === 4) {
            sorted = this.sortByRankGroups(originalSorted);
            return { rank: HAND_RANKS.FOUR_OF_A_KIND, cards: sorted };
        }

        if (countValues[0] === 3 && countValues[1] === 2) {
            sorted = this.sortByRankGroups(originalSorted);
            return { rank: HAND_RANKS.FULL_HOUSE, cards: sorted };
        }

        if (isFlush) {
            return { rank: HAND_RANKS.FLUSH, cards: sorted };
        }

        if (isStraight) {
            return { rank: HAND_RANKS.STRAIGHT, cards: sorted };
        }

        if (countValues[0] === 3) {
            sorted = this.sortByRankGroups(originalSorted);
            return { rank: HAND_RANKS.THREE_OF_A_KIND, cards: sorted };
        }

        if (countValues[0] === 2 && countValues[1] === 2) {
            sorted = this.sortByRankGroups(originalSorted);
            return { rank: HAND_RANKS.TWO_PAIR, cards: sorted };
        }

        if (countValues[0] === 2) {
            sorted = this.sortByRankGroups(originalSorted);
            return { rank: HAND_RANKS.ONE_PAIR, cards: sorted };
        }

        return { rank: HAND_RANKS.HIGH_CARD, cards: sorted };
    }

    static sortByRankGroups(cards) {
        const counts = {};
        for (const card of cards) {
            counts[card.value] = (counts[card.value] || 0) + 1;
        }
        
        return [...cards].sort((a, b) => {
            if (counts[a.value] !== counts[b.value]) {
                return counts[b.value] - counts[a.value];
            }
            return b.value - a.value;
        });
    }

    static isFlush(cards) {
        return cards.every(card => card.suit === cards[0].suit);
    }

    static isStraight(cards) {
        const values = cards.map(card => card.value).sort((a, b) => b - a);
        
        for (let i = 0; i < values.length - 1; i++) {
            if (values[i] - values[i + 1] !== 1) {
                if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
                    return true;
                }
                return false;
            }
        }
        return true;
    }

    static getRankCounts(cards) {
        const counts = {};
        for (const card of cards) {
            counts[card.value] = (counts[card.value] || 0) + 1;
        }
        return counts;
    }

    static getSortedRankCounts(cards) {
        const counts = {};
        for (const card of cards) {
            counts[card.value] = (counts[card.value] || 0) + 1;
        }
        return Object.entries(counts)
            .map(([value, count]) => ({ value: parseInt(value), count }))
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return b.value - a.value;
            });
    }

    static compareHands(hand1, hand2) {
        if (hand1.rank !== hand2.rank) {
            return hand1.rank - hand2.rank;
        }

        const cards1 = hand1.cards;
        const cards2 = hand2.cards;

        switch (hand1.rank) {
            case HAND_RANKS.ROYAL_FLUSH:
                return 0;

            case HAND_RANKS.STRAIGHT_FLUSH:
            case HAND_RANKS.STRAIGHT:
                return cards1[0].value - cards2[0].value;

            case HAND_RANKS.FOUR_OF_A_KIND: {
                const counts1 = this.getSortedRankCounts(cards1);
                const counts2 = this.getSortedRankCounts(cards2);
                if (counts1[0].value !== counts2[0].value) {
                    return counts1[0].value - counts2[0].value;
                }
                return counts1[1].value - counts2[1].value;
            }

            case HAND_RANKS.FULL_HOUSE: {
                const counts1 = this.getSortedRankCounts(cards1);
                const counts2 = this.getSortedRankCounts(cards2);
                if (counts1[0].value !== counts2[0].value) {
                    return counts1[0].value - counts2[0].value;
                }
                return counts1[1].value - counts2[1].value;
            }

            case HAND_RANKS.FLUSH:
            case HAND_RANKS.HIGH_CARD:
                for (let i = 0; i < 5; i++) {
                    if (cards1[i].value !== cards2[i].value) {
                        return cards1[i].value - cards2[i].value;
                    }
                }
                return 0;

            case HAND_RANKS.THREE_OF_A_KIND: {
                const counts1 = this.getSortedRankCounts(cards1);
                const counts2 = this.getSortedRankCounts(cards2);
                if (counts1[0].value !== counts2[0].value) {
                    return counts1[0].value - counts2[0].value;
                }
                for (let i = 1; i < counts1.length; i++) {
                    if (counts1[i].value !== counts2[i].value) {
                        return counts1[i].value - counts2[i].value;
                    }
                }
                return 0;
            }

            case HAND_RANKS.TWO_PAIR: {
                const counts1 = this.getSortedRankCounts(cards1);
                const counts2 = this.getSortedRankCounts(cards2);
                if (counts1[0].value !== counts2[0].value) {
                    return counts1[0].value - counts2[0].value;
                }
                if (counts1[1].value !== counts2[1].value) {
                    return counts1[1].value - counts2[1].value;
                }
                return counts1[2].value - counts2[2].value;
            }

            case HAND_RANKS.ONE_PAIR: {
                const counts1 = this.getSortedRankCounts(cards1);
                const counts2 = this.getSortedRankCounts(cards2);
                if (counts1[0].value !== counts2[0].value) {
                    return counts1[0].value - counts2[0].value;
                }
                for (let i = 1; i < counts1.length; i++) {
                    if (counts1[i].value !== counts2[i].value) {
                        return counts1[i].value - counts2[i].value;
                    }
                }
                return 0;
            }

            default:
                return 0;
        }
    }

    static getHandName(rank) {
        return HAND_NAMES[rank] || '未知';
    }
}

class GamePlayer {
    constructor(id, name, seatNumber, chips = 2000, borrowedChips = 2000, avatarUpdatedAt = null) {
        this.id = id;
        this.name = name;
        this.seatNumber = seatNumber;
        this.chips = chips;
        this.borrowedChips = borrowedChips;
        this.hand = [];
        this.bet = 0;
        this.totalBet = 0;
        this.state = PLAYER_STATES.NOT_READY;
        this.isSpectator = false;
        this.hasActed = false;
        this.avatarUpdatedAt = avatarUpdatedAt;
    }

    resetForNewHand() {
        this.hand = [];
        this.bet = 0;
        this.totalBet = 0;
        this.hasActed = false;
        if (this.state !== PLAYER_STATES.LEFT) {
            this.state = PLAYER_STATES.NOT_READY;
        }
    }

    resetForReady() {
        if (this.state !== PLAYER_STATES.LEFT) {
            this.state = PLAYER_STATES.NOT_READY;
        }
    }

    addCard(card) {
        this.hand.push(card);
    }

    placeBet(amount) {
        const actualAmount = Math.min(amount, this.chips);
        this.chips -= actualAmount;
        this.bet += actualAmount;
        this.totalBet += actualAmount;
        if (this.chips === 0 && actualAmount > 0) {
            this.state = PLAYER_STATES.ALL_IN;
        }
        return actualAmount;
    }

    fold() {
        if (this.state !== PLAYER_STATES.LEFT) {
            this.state = PLAYER_STATES.FOLDED;
        }
    }

    leave() {
        this.state = PLAYER_STATES.LEFT;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            seatNumber: this.seatNumber,
            chips: this.chips,
            borrowedChips: this.borrowedChips,
            hand: this.hand.map(c => c.toJSON()),
            bet: this.bet,
            state: this.state,
            isSpectator: this.isSpectator,
            avatarUpdatedAt: this.avatarUpdatedAt
        }
    }
}

class Game {
    constructor(roomId, roomName, smallBlind = 10, bigBlind = 20) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.players = new Map();
        this.seatMap = new Map();
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.stage = GAME_STAGES.READY;
        this.dealerSeat = 0;
        this.dealerPlayerId = null;
        this.smallBlindSeat = -1;
        this.bigBlindSeat = -1;
        this.currentPlayerSeat = 0;
        this.currentActionIndex = 0;
        this.minRaise = bigBlind;
        this.lastBet = 0;
        this.gameActive = false;
        this.handInProgress = false;
        this.startTimer = null;
        this.onStageChange = null;
        this.winners = [];
        
        this.runItTimes = 1;
        this.runItVotes = new Map();
        this.isWaitingForRunItVotes = false;
        this.additionalCommunityCards = [];
        
        this.savedRunItTimes = 1;
        this.savedInitialCommunityCards = [];
        this.savedAdditionalCommunityCards = [];
        this.savedRunResults = [];
        
        this.isWaitingForShowdown = false;
        this.waitingForShowdownPlayerId = null;
        
        this.reconnectingPlayers = new Map(); // 重连中的玩家，存储玩家ID和断开时间
    }

    addPlayer(playerId, playerName, chips = 2000) {
        const existingPlayer = this.players.get(playerId);
        if (existingPlayer) {
            if (existingPlayer.state === PLAYER_STATES.LEFT) {
                existingPlayer.state = PLAYER_STATES.NOT_READY;
                existingPlayer.isSpectator = true;
            }
            // 如果玩家在重连名单中，将其移除
            if (this.reconnectingPlayers.has(playerId)) {
                this.reconnectingPlayers.delete(playerId);
                console.log(`玩家 ${playerName} 重连成功，从重连名单中移除`);
            }
            // 更新玩家头像更新时间
            const user = getUserById(playerId);
            if (user) {
                existingPlayer.avatarUpdatedAt = user.avatarUpdatedAt;
            }
            return existingPlayer;
        }
        
        // 获取用户头像更新时间
        let avatarUpdatedAt = null;
        const user = getUserById(playerId);
        if (user) {
            avatarUpdatedAt = user.avatarUpdatedAt;
        }
        
        const seatNumber = this.getNextAvailableSeat();
        const newPlayer = new GamePlayer(playerId, playerName, seatNumber, chips, chips, avatarUpdatedAt);
        if (this.handInProgress || this.stage !== GAME_STAGES.READY) {
            newPlayer.isSpectator = true;
            newPlayer.state = PLAYER_STATES.NOT_READY;
        }
        this.players.set(playerId, newPlayer);
        this.seatMap.set(seatNumber, playerId);
        
        return this.players.get(playerId);
    }

    getNextAvailableSeat() {
        for (let i = 0; i < 12; i++) {
            if (!this.seatMap.has(i)) {
                return i;
            }
        }
        return this.players.size;
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            if (this.stage === GAME_STAGES.READY) {
                this.seatMap.delete(player.seatNumber);
                this.players.delete(playerId);
                
                // 重新分配座位号，使它们连续
                const remainingPlayers = Array.from(this.players.values()).sort((a, b) => a.seatNumber - b.seatNumber);
                this.seatMap.clear();
                
                for (let i = 0; i < remainingPlayers.length; i++) {
                    const p = remainingPlayers[i];
                    p.seatNumber = i;
                    this.seatMap.set(i, p.id);
                }
            } else {
                // 将玩家加入重连名单，30秒后标记为left
                this.reconnectingPlayers.set(playerId, Date.now());
                
                // 30秒后检查玩家是否重连
                setTimeout(() => {
                    if (this.reconnectingPlayers.has(playerId)) {
                        // 检查该玩家是否是当前行动玩家
                        const isCurrentPlayer = this.isCurrentPlayer(playerId);
                        
                        this.reconnectingPlayers.delete(playerId);
                        player.leave();
                        this.notifyStageChange();
                        
                        if (this.handInProgress && this.stage !== GAME_STAGES.RESULT) {
                            const activePlayers = this.getActivePlayers();
                            if (activePlayers.length <= 1) {
                                console.log(`房间 ${this.roomId}: 玩家断线后只剩${activePlayers.length}名活跃玩家，结束游戏`);
                                this.endHand();
                            } else if (isCurrentPlayer) {
                                // 如果离开的玩家是当前行动玩家，更新游戏轮次
                                this.nextPlayer();
                            }
                        }
                    }
                }, 30000);
            }
            this.notifyStageChange();
            
            if (this.handInProgress && this.stage !== GAME_STAGES.RESULT) {
                const activePlayers = this.getActivePlayers();
                if (activePlayers.length <= 1) {
                    console.log(`房间 ${this.roomId}: 玩家断线后只剩${activePlayers.length}名活跃玩家，结束游戏`);
                    this.endHand();
                }
            }
        }
        this.clearStartTimer();
    }
    
    removeFromReconnectList(playerId) {
        if (this.reconnectingPlayers.has(playerId)) {
            this.reconnectingPlayers.delete(playerId);
            this.notifyStageChange();
        }
    }
    
    isPlayerReconnecting(playerId) {
        return this.reconnectingPlayers.has(playerId);
    }
    
    areAllPlayersLeftOrReconnecting() {
        for (const player of this.players.values()) {
            if (player.state !== PLAYER_STATES.LEFT && !this.reconnectingPlayers.has(player.id)) {
                return false;
            }
        }
        return true;
    }

    areAllPlayersLeft() {
        for (const player of this.players.values()) {
            if (player.state !== PLAYER_STATES.LEFT) {
                return false;
            }
        }
        return true;
    }

    setPlayerReady(playerId, ready) {
        const player = this.players.get(playerId);
        if (player && player.state !== PLAYER_STATES.LEFT) {
            if (ready) {
                if (player.chips < 20) {
                    return { success: false, message: '筹码不足，请借取筹码后再准备' };
                }
                player.state = PLAYER_STATES.READY;
                player.isSpectator = false;
            } else {
                player.state = PLAYER_STATES.NOT_READY;
            }
        }
        
        this.notifyStageChange();
        
        if (this.stage === GAME_STAGES.READY || this.stage === GAME_STAGES.RESULT) {
            this.checkReadyAndStart();
        }
        
        return { success: true };
    }

    checkReadyAndStart() {
        const nonLeftPlayers = Array.from(this.players.values()).filter(p => p.state !== PLAYER_STATES.LEFT);
        const validPlayers = nonLeftPlayers.filter(p => !p.isSpectator);
        const readyPlayers = validPlayers.filter(p => p.state === PLAYER_STATES.READY);
        
        console.log(`房间 ${this.roomId}: 检查准备状态 - 总非离开玩家: ${nonLeftPlayers.length}, 有效玩家(非观战): ${validPlayers.length}, 准备玩家: ${readyPlayers.length}`);
        
        if (validPlayers.length >= 4 && readyPlayers.length >= 4) {
            if (!this.startTimer) {
                this.startTimer = setTimeout(() => {
                    this.startNewHand();
                }, 30000);
                console.log(`房间 ${this.roomId}: 开始30秒倒计时进入游戏`);
            }
        } else {
            this.clearStartTimer();
        }
        
        if (validPlayers.length >= 4 && readyPlayers.length === validPlayers.length) {
            this.clearStartTimer();
            console.log(`房间 ${this.roomId}: 所有有效玩家已准备，立即开始游戏`);
            this.startNewHand();
        }
    }

    clearStartTimer() {
        if (this.startTimer) {
            clearTimeout(this.startTimer);
            this.startTimer = null;
        }
    }

    startNewHand() {
        const nonLeftPlayers = Array.from(this.players.values()).filter(p => p.state !== PLAYER_STATES.LEFT);
        
        const readyPlayerIds = new Set(nonLeftPlayers.filter(p => p.state === PLAYER_STATES.READY).map(p => p.id));
        
        this.players.forEach(player => {
            if (player.state !== PLAYER_STATES.LEFT) {
                player.resetForNewHand();
            }
        });
        
        nonLeftPlayers.forEach(player => {
            if (readyPlayerIds.has(player.id)) {
                player.isSpectator = false;
                player.state = PLAYER_STATES.READY;
            } else {
                player.isSpectator = true;
            }
        });
        
        this.deck.reset();
        this.deck.shuffle();
        this.communityCards = [];
        this.pot = 0;
        this.stage = GAME_STAGES.PRE_FLOP;
        this.minRaise = this.bigBlind;
        this.lastBet = 0;
        this.gameActive = true;
        this.handInProgress = true;
        this.winners = [];

        const activePlayers = this.getActivePlayers();
        console.log(`房间 ${this.roomId}: 开始新游戏，活跃玩家数量: ${activePlayers.length}`);
        if (activePlayers.length < 2) {
            this.gameActive = false;
            this.handInProgress = false;
            this.stage = GAME_STAGES.RESULT;
            this.notifyStageChange();
            return;
        }

        this.dealerPlayerId = activePlayers[this.dealerSeat % activePlayers.length].id;
        const sbIndex = (this.dealerSeat + 1) % activePlayers.length;
        const bbIndex = (this.dealerSeat + 2) % activePlayers.length;

        this.smallBlindSeat = activePlayers[sbIndex].seatNumber;
        this.bigBlindSeat = activePlayers[bbIndex].seatNumber;

        const smallBlindPlayer = activePlayers[sbIndex];
        const bigBlindPlayer = activePlayers[bbIndex];

        smallBlindPlayer.placeBet(this.smallBlind);
        bigBlindPlayer.placeBet(this.bigBlind);
        this.pot = this.smallBlind + this.bigBlind;
        this.lastBet = this.bigBlind;

        for (let i = 0; i < 2; i++) {
            for (const player of activePlayers) {
                player.addCard(this.deck.deal());
            }
        }

        const allSeatedPlayers = Array.from(this.players.values())
            .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT)
            .sort((a, b) => a.seatNumber - b.seatNumber);
        
        const bbPlayerId = bigBlindPlayer.id;
        const bbIndexInAll = allSeatedPlayers.findIndex(p => p.id === bbPlayerId);
        
        let firstActionIndex = (bbIndexInAll + 1) % allSeatedPlayers.length;
        
        for (let i = 0; i < allSeatedPlayers.length; i++) {
            const candidatePlayer = allSeatedPlayers[firstActionIndex];
            if (candidatePlayer.state !== PLAYER_STATES.FOLDED && 
                candidatePlayer.state !== PLAYER_STATES.ALL_IN) {
                this.currentActionIndex = firstActionIndex;
                this.currentPlayerSeat = activePlayers.findIndex(p => p.id === candidatePlayer.id);
                break;
            }
            firstActionIndex = (firstActionIndex + 1) % allSeatedPlayers.length;
        }
        
        this.notifyStageChange();
    }

    getActivePlayers() {
        return Array.from(this.players.values())
            .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT && p.state !== PLAYER_STATES.FOLDED);
    }

    getSeatedPlayers() {
        return Array.from(this.players.values())
            .filter(p => p.state !== PLAYER_STATES.LEFT)
            .sort((a, b) => a.seatNumber - b.seatNumber);
    }

    getPlayerById(playerId) {
        return this.players.get(playerId);
    }

    getCurrentPlayer() {
        const activePlayers = this.getActivePlayers();
        return activePlayers[this.currentPlayerSeat];
    }

    isCurrentPlayer(playerId) {
        const current = this.getCurrentPlayer();
        return current && current.id === playerId;
    }

    playerAction(playerId, action, amount = 0) {
        if (!this.handInProgress || !this.isCurrentPlayer(playerId)) {
            return false;
        }

        const player = this.getPlayerById(playerId);
        if (!player || player.state === PLAYER_STATES.FOLDED || 
            player.state === PLAYER_STATES.LEFT || player.isSpectator) {
            return false;
        }
        
        // 如果玩家在重连名单中，将其移除
        if (this.reconnectingPlayers.has(playerId)) {
            this.reconnectingPlayers.delete(playerId);
            console.log(`玩家 ${player.name} 重连成功，从重连名单中移除`);
        }

        const activePlayers = this.getActivePlayers();
        const callAmount = this.lastBet - player.bet;

        switch (action) {
            case 'fold':
                player.fold();
                player.hasActed = true;
                break;
            case 'check':
                if (callAmount > 0) {
                    return false;
                }
                player.hasActed = true;
                break;
            case 'call':
                const calledAmount = player.placeBet(callAmount);
                this.pot += calledAmount;
                player.hasActed = true;
                break;
            case 'raise':
                const minRequiredBet = Math.max(0, this.lastBet + this.minRaise - player.bet);
                const desiredBet = Math.max(amount, minRequiredBet);
                const totalBet = player.bet + desiredBet;
                const raised = player.placeBet(desiredBet);
                this.pot += raised;
                const newMinRaise = totalBet - this.lastBet;
                this.lastBet = totalBet;
                this.minRaise = newMinRaise;
                player.hasActed = true;
                activePlayers.forEach(p => {
                    if (p.id !== playerId && p.state !== PLAYER_STATES.ALL_IN && p.state !== PLAYER_STATES.FOLDED) {
                        p.hasActed = false;
                    }
                });
                break;
            case 'allin':
                const allInAmount = player.chips;
                const totalAllInBet = player.bet + allInAmount;
                player.placeBet(allInAmount);
                this.pot += allInAmount;
                player.hasActed = true;
                if (totalAllInBet > this.lastBet) {
                    this.minRaise = Math.max(this.minRaise, totalAllInBet - this.lastBet);
                    this.lastBet = totalAllInBet;
                    activePlayers.forEach(p => {
                        if (p.id !== playerId && p.state !== PLAYER_STATES.ALL_IN && p.state !== PLAYER_STATES.FOLDED) {
                            p.hasActed = false;
                        }
                    });
                }
                break;
            default:
                return false;
        }

        this.nextPlayer();
        return true;
    }

    nextPlayer() {
        const allSeatedPlayers = Array.from(this.players.values())
            .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT)
            .sort((a, b) => a.seatNumber - b.seatNumber);
        
        console.log(`nextPlayer: 当前阶段=${this.stage}, currentActionIndex=${this.currentActionIndex}`);
        
        const activePlusAllInPlayers = allSeatedPlayers.filter(p => 
            p.state !== PLAYER_STATES.FOLDED
        );
        
        if (activePlusAllInPlayers.length <= 1) {
            if (activePlusAllInPlayers.length === 1) {
                this.isWaitingForShowdown = true;
                this.waitingForShowdownPlayerId = activePlusAllInPlayers[0].id;
                this.notifyStageChange();
            } else {
                this.endHand(false);
                this.notifyStageChange();
            }
            return;
        }

        const activePlayers = this.getActivePlayers();
        
        let nextActionIndex = (this.currentActionIndex + 1) % allSeatedPlayers.length;
        let foundNextPlayer = null;
        
        for (let i = 0; i < allSeatedPlayers.length; i++) {
            const candidatePlayer = allSeatedPlayers[nextActionIndex];
            if (candidatePlayer.state !== PLAYER_STATES.FOLDED && 
                candidatePlayer.state !== PLAYER_STATES.ALL_IN) {
                foundNextPlayer = candidatePlayer;
                this.currentActionIndex = nextActionIndex;
                break;
            }
            nextActionIndex = (nextActionIndex + 1) % allSeatedPlayers.length;
        }

        const allActed = activePlayers.every(p => 
            p.state === PLAYER_STATES.ALL_IN || 
            p.state === PLAYER_STATES.FOLDED || 
            p.hasActed
        );
        
        const allBetSame = activePlayers.every(p => 
            p.state === PLAYER_STATES.ALL_IN || 
            p.state === PLAYER_STATES.FOLDED || 
            p.bet === this.lastBet
        );
        
        const allAllIn = activePlayers.every(p => 
            p.state === PLAYER_STATES.ALL_IN || 
            p.state === PLAYER_STATES.FOLDED
        );

        if (!foundNextPlayer || allAllIn) {
            const nonFoldedPlayers = activePlayers.filter(p => p.state !== PLAYER_STATES.FOLDED);
            if (nonFoldedPlayers.length >= 2 && this.communityCards.length < 5 && !this.isWaitingForRunItVotes) {
                this.startRunItVoting();
            } else {
                this.nextStage(true);
            }
        } else if (foundNextPlayer) {
            this.currentPlayerSeat = activePlayers.findIndex(p => p.id === foundNextPlayer.id);
            
            if (allActed && allBetSame) {
                this.nextStage(false);
            } else {
                this.notifyStageChange();
            }
        } else {
            this.notifyStageChange();
        }
    }

    startRunItVoting() {
        this.isWaitingForRunItVotes = true;
        this.runItVotes = new Map();
        this.notifyStageChange();
    }

    voteRunIt(playerId, times) {
        if (!this.isWaitingForRunItVotes) return { success: false, message: '当前不接受跑马投票' };
        const activePlayers = this.getActivePlayers().filter(p => p.state !== PLAYER_STATES.FOLDED);
        const isEligible = activePlayers.some(p => p.id === playerId);
        if (!isEligible) return { success: false, message: '你没有投票权' };
        if (times < 1 || times > 3) return { success: false, message: '跑马次数必须是1-3' };
        
        this.runItVotes.set(playerId, times);
        
        if (this.runItVotes.size === activePlayers.length) {
            this.finishRunItVoting();
        } else {
            this.notifyStageChange();
        }
        
        return { success: true };
    }

    finishRunItVoting() {
        const votes = Array.from(this.runItVotes.values());
        this.runItTimes = Math.min(...votes);
        this.isWaitingForRunItVotes = false;
        
        this.endHand();
    }

    chooseShowdown(playerId, showHand) {
        if (!this.isWaitingForShowdown || this.waitingForShowdownPlayerId !== playerId) {
            return { success: false, message: '当前不能选择是否秀底牌' };
        }
        
        this.isWaitingForShowdown = false;
        this.waitingForShowdownPlayerId = null;
        
        this.endHand(showHand);
        return { success: true };
    }

    dealAdditionalCommunityCards() {
        this.additionalCommunityCards = [];
        const cardsNeededPerRun = 5 - this.communityCards.length;
        
        for (let i = 1; i < this.runItTimes; i++) {
            const runCards = [];
            for (let j = 0; j < cardsNeededPerRun; j++) {
                runCards.push(this.deck.deal());
            }
            this.additionalCommunityCards.push(runCards);
        }
    }

    calculateSidePots() {
        const allPlayers = Array.from(this.players.values())
            .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT);
        
        const activePlayers = allPlayers.filter(p => p.state !== PLAYER_STATES.FOLDED);
        
        const activeBets = activePlayers.map(p => p.totalBet).filter(b => b > 0);
        const sortedUniqueBets = [...new Set(activeBets)].sort((a, b) => a - b);
        
        const sidePots = [];
        let previousBet = 0;
        
        for (const betLevel of sortedUniqueBets) {
            const potSize = allPlayers.reduce((sum, player) => {
                const contribution = Math.min(player.totalBet, betLevel) - Math.min(player.totalBet, previousBet);
                return sum + contribution;
            }, 0);
            
            if (potSize > 0) {
                const eligiblePlayers = activePlayers.filter(p => p.totalBet >= betLevel);
                sidePots.push({
                    amount: potSize,
                    betLevel: betLevel,
                    eligiblePlayerIds: new Set(eligiblePlayers.map(p => p.id))
                });
            }
            
            previousBet = betLevel;
        }
        
        return sidePots;
    }

    dealAllCommunityCards() {
        while (this.communityCards.length < 5) {
            this.communityCards.push(this.deck.deal());
        }
    }

    nextStage(skipBetting = false) {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length <= 1) {
            this.endHand();
            return;
        }
        
        const nonAllInPlayers = activePlayers.filter(p => 
            p.state !== PLAYER_STATES.ALL_IN && 
            p.state !== PLAYER_STATES.FOLDED
        );
        
        if (nonAllInPlayers.length === 1) {
            const player = nonAllInPlayers[0];
            if (player.chips > 0) {
                const allInAmount = player.chips;
                const totalAllInBet = player.bet + allInAmount;
                player.placeBet(allInAmount);
                this.pot += allInAmount;
                player.hasActed = true;
                if (totalAllInBet > this.lastBet) {
                    this.minRaise = Math.max(this.minRaise, totalAllInBet - this.lastBet);
                    this.lastBet = totalAllInBet;
                }
                console.log(`房间 ${this.roomId}: 玩家 ${player.name} 被自动设为allin`);
            }
            
            const nonFoldedPlayers = activePlayers.filter(p => p.state !== PLAYER_STATES.FOLDED);
            if (nonFoldedPlayers.length >= 2 && this.communityCards.length < 5 && !this.isWaitingForRunItVotes) {
                this.startRunItVoting();
                this.notifyStageChange();
                return;
            } else {
                this.endHand();
                return;
            }
        }

        switch (this.stage) {
            case GAME_STAGES.PRE_FLOP:
                this.stage = GAME_STAGES.FLOP;
                for (let i = 0; i < 3; i++) {
                    this.communityCards.push(this.deck.deal());
                }
                break;
            case GAME_STAGES.FLOP:
                this.stage = GAME_STAGES.TURN;
                this.communityCards.push(this.deck.deal());
                break;
            case GAME_STAGES.TURN:
                this.stage = GAME_STAGES.RIVER;
                this.communityCards.push(this.deck.deal());
                break;
            case GAME_STAGES.RIVER:
                this.endHand();
                return;
        }

        if (skipBetting) {
            this.nextStage(true);
            return;
        }

        this.lastBet = 0;
        this.minRaise = this.bigBlind;
        
        activePlayers.forEach(p => {
            p.bet = 0;
            p.hasActed = false;
        });

        const allSeatedPlayers = Array.from(this.players.values())
            .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT)
            .sort((a, b) => a.seatNumber - b.seatNumber);
        
        const dealerPlayerId = allSeatedPlayers[this.dealerSeat % allSeatedPlayers.length].id;
        const dealerIndexInAll = allSeatedPlayers.findIndex(p => p.id === dealerPlayerId);
        
        let firstActionIndex = (dealerIndexInAll + 1) % allSeatedPlayers.length;
        
        for (let i = 0; i < allSeatedPlayers.length; i++) {
            const candidatePlayer = allSeatedPlayers[firstActionIndex];
            if (candidatePlayer.state !== PLAYER_STATES.FOLDED && 
                candidatePlayer.state !== PLAYER_STATES.ALL_IN) {
                this.currentActionIndex = firstActionIndex;
                this.currentPlayerSeat = activePlayers.findIndex(p => p.id === candidatePlayer.id);
                break;
            }
            firstActionIndex = (firstActionIndex + 1) % allSeatedPlayers.length;
        }
        
        this.notifyStageChange();
    }

    endHand(showHand = true) {
        this.stage = GAME_STAGES.RESULT;
        this.handInProgress = false;
        
        this.savedRunItTimes = this.runItTimes;
        this.savedInitialCommunityCards = this.communityCards.map(c => ({ suit: c.suit, rank: c.rank }));
        this.savedAdditionalCommunityCards = [];
        this.savedRunResults = [];
        
        const activePlayers = Array.from(this.players.values())
            .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT && p.state !== PLAYER_STATES.FOLDED);

        this.winners = [];
        
        if (activePlayers.length === 1) {
            activePlayers[0].chips += this.pot;
            this.winners = [{
                id: activePlayers[0].id,
                name: activePlayers[0].name,
                handRank: null,
                handRankName: '唯一存活'
            }];
            
            const winnerIds = new Set(this.winners.map(w => w.id));
            this.players.forEach(player => {
                if (!showHand || !winnerIds.has(player.id)) {
                    player.hand = [];
                }
            });
        } else if (activePlayers.length > 1) {
            const sidePots = this.calculateSidePots();
            const playerWins = new Map();
            activePlayers.forEach(p => playerWins.set(p.id, 0));
            
            const cardsNeededPerRun = 5 - this.communityCards.length;
            for (let i = 0; i < this.runItTimes; i++) {
                const runCards = [];
                for (let j = 0; j < cardsNeededPerRun; j++) {
                    runCards.push(this.deck.deal());
                }
                this.savedAdditionalCommunityCards.push(runCards.map(c => ({ suit: c.suit, rank: c.rank })));
            }
            
            for (let run = 0; run < this.runItTimes; run++) {
                let communityCardsForRun = [...this.communityCards];
                if (this.savedAdditionalCommunityCards[run]) {
                    const additionalCards = this.savedAdditionalCommunityCards[run].map(c => new Card(c.suit, c.rank));
                    communityCardsForRun = [...this.communityCards, ...additionalCards];
                }
                
                while (communityCardsForRun.length < 5) {
                    communityCardsForRun.push(this.deck.deal());
                }
                
                const runWinnersForThisRun = [];
                
                const allPlayerResults = [];
                for (const player of activePlayers) {
                    const allCards = [...player.hand, ...communityCardsForRun];
                    const hand = HandEvaluator.evaluateHand(allCards);
                    allPlayerResults.push({ player, hand });
                }
                
                allPlayerResults.sort((a, b) => HandEvaluator.compareHands(b.hand, a.hand));
                
                const playerRankings = [];
                let currentRank = 0;
                let previousHand = null;
                
                for (let i = 0; i < allPlayerResults.length; i++) {
                    const result = allPlayerResults[i];
                    if (previousHand === null || HandEvaluator.compareHands(result.hand, previousHand) !== 0) {
                        currentRank = i;
                        previousHand = result.hand;
                    }
                    playerRankings.push({
                        playerId: result.player.id,
                        playerName: result.player.name,
                        handRank: result.hand.rank,
                        handRankName: HandEvaluator.getHandName(result.hand.rank),
                        rank: currentRank
                    });
                }
                
                for (const sidePot of sidePots) {
                    const potPerRunForPot = Math.floor(sidePot.amount / this.runItTimes);
                    
                    const eligiblePlayers = activePlayers.filter(p => sidePot.eligiblePlayerIds.has(p.id));
                    
                    const results = [];
                    for (const player of eligiblePlayers) {
                        const allCards = [...player.hand, ...communityCardsForRun];
                        const hand = HandEvaluator.evaluateHand(allCards);
                        results.push({ player, hand });
                    }

                    results.sort((a, b) => HandEvaluator.compareHands(b.hand, a.hand));
                    const bestHand = results[0].hand;
                    const potWinners = results.filter(r => HandEvaluator.compareHands(r.hand, bestHand) === 0);
                    const potPerWinnerThisRun = Math.floor(potPerRunForPot / potWinners.length);
                    
                    for (const winner of potWinners) {
                        const currentWins = playerWins.get(winner.player.id) || 0;
                        playerWins.set(winner.player.id, currentWins + potPerWinnerThisRun);
                        
                        if (!runWinnersForThisRun.includes(winner.player.id)) {
                            runWinnersForThisRun.push(winner.player.id);
                        }
                    }
                }
                
                this.savedRunResults.push({
                    runNumber: run + 1,
                    winnerIds: runWinnersForThisRun,
                    playerRankings: playerRankings
                });
            }
            
            let totalDistributed = 0;
            for (const [playerId, amount] of playerWins.entries()) {
                totalDistributed += amount;
            }
            const remainingPot = this.pot - totalDistributed;
            
            if (remainingPot > 0) {
                const allPlayers = Array.from(this.players.values())
                    .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT);
                allPlayers.sort((a, b) => (a.chips - a.borrowedChips) - (b.chips - b.borrowedChips));
                const currentWins = playerWins.get(allPlayers[0].id) || 0;
                playerWins.set(allPlayers[0].id, currentWins + remainingPot);
            }
            
            const maxWins = Math.max(...playerWins.values());
            const overallWinners = activePlayers.filter(p => (playerWins.get(p.id) || 0) === maxWins);
            
            for (const player of activePlayers) {
                const wins = playerWins.get(player.id) || 0;
                player.chips += wins;
            }

            this.winners = overallWinners.map(p => ({
                id: p.id,
                name: p.name,
                handRank: null,
                handRankName: `跑马${this.runItTimes}次获胜`
            }));
            
            const activePlayerIds = new Set(activePlayers.map(p => p.id));
            this.players.forEach(player => {
                if (!activePlayerIds.has(player.id)) {
                    player.hand = [];
                }
            });
        }

        this.players.forEach(player => {
            if (player.state !== PLAYER_STATES.LEFT) {
                player.state = PLAYER_STATES.NOT_READY;
            }
        });

        this.gameActive = false;
        this.handInProgress = false;
        
        this.runItTimes = 1;
        this.runItVotes = new Map();
        this.isWaitingForRunItVotes = false;
        this.additionalCommunityCards = [];

        const activePlayersForDealer = Array.from(this.players.values())
            .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT);
        this.dealerSeat = (this.dealerSeat + 1) % Math.max(1, activePlayersForDealer.length);
        
        this.notifyStageChange();
        this.checkReadyAndStart();
    }

    notifyStageChange() {
        if (this.onStageChange) {
            this.onStageChange();
        }
    }

    toJSON() {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            stage: this.stage,
            communityCards: this.communityCards.map(c => c.toJSON()),
            pot: this.pot,
            players: Array.from(this.players.values()).map(p => p.toJSON()),
            dealerPlayerId: this.dealerPlayerId,
            smallBlindSeat: this.smallBlindSeat,
            bigBlindSeat: this.bigBlindSeat,
            currentPlayerSeat: this.currentPlayerSeat,
            currentPlayerId: this.getCurrentPlayer()?.id,
            lastBet: this.lastBet,
            minRaise: this.minRaise,
            gameActive: this.gameActive,
            handInProgress: this.handInProgress,
            winners: this.winners
        };
    }

    getGameState(playerId) {
        const player = this.getPlayerById(playerId);
        const playerHand = player ? player.hand.map(c => c.toJSON()) : [];

        const showdownPlayers = this.stage === GAME_STAGES.RESULT
            ? new Set(Array.from(this.players.values())
                .filter(p => !p.isSpectator && p.state !== PLAYER_STATES.LEFT && p.state !== PLAYER_STATES.FOLDED)
                .map(p => p.id))
            : new Set([playerId]);

        const activePlayers = this.getActivePlayers().filter(p => p.state !== PLAYER_STATES.FOLDED);
        const canVoteRunIt = activePlayers.some(p => p.id === playerId);
        const myVote = this.runItVotes.get(playerId);

        return {
            stage: this.stage,
            communityCards: this.communityCards.map(c => c.toJSON()),
            pot: this.pot,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                seatNumber: p.seatNumber,
                chips: p.chips,
                borrowedChips: p.borrowedChips,
                bet: p.bet,
                totalBet: p.totalBet,
                state: p.state,
                ready: p.state === PLAYER_STATES.READY,
                folded: p.state === PLAYER_STATES.FOLDED,
                allIn: p.state === PLAYER_STATES.ALL_IN,
                isSpectator: p.isSpectator,
                isDealer: p.id === this.dealerPlayerId,
                isSmallBlind: p.seatNumber === this.smallBlindSeat,
                isBigBlind: p.seatNumber === this.bigBlindSeat,
                avatarUpdatedAt: p.avatarUpdatedAt,
                hand: showdownPlayers.has(p.id) ? p.hand.map(c => c.toJSON()) : []
            })),
            currentPlayerId: this.getCurrentPlayer()?.id,
            dealerPlayerId: this.dealerPlayerId,
            lastBet: this.lastBet,
            minRaise: this.minRaise,
            gameActive: this.gameActive,
            handInProgress: this.handInProgress,
            winners: this.winners,
            isWaitingForRunItVotes: this.isWaitingForRunItVotes,
            canVoteRunIt: canVoteRunIt,
            myRunItVote: myVote,
            runItVotes: Object.fromEntries(this.runItVotes),
            totalRunItVotes: this.runItVotes.size,
            requiredRunItVotes: activePlayers.length,
            runItTimes: this.savedRunItTimes,
            initialCommunityCards: this.savedInitialCommunityCards,
            additionalCommunityCards: this.savedAdditionalCommunityCards,
            runResults: this.savedRunResults || [],
            isWaitingForShowdown: this.isWaitingForShowdown,
            canChooseShowdown: this.waitingForShowdownPlayerId === playerId
        };
    }

    saveToStorage() {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind,
            stage: this.stage,
            communityCards: this.communityCards.map(c => ({ suit: c.suit, rank: c.rank })),
            pot: this.pot,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                seatNumber: p.seatNumber,
                chips: p.chips,
                borrowedChips: p.borrowedChips,
                hand: p.hand.map(c => ({ suit: c.suit, rank: c.rank })),
                bet: p.bet,
                totalBet: p.totalBet,
                state: p.state,
                isSpectator: p.isSpectator
            })),
            dealerSeat: this.dealerSeat,
            dealerPlayerId: this.dealerPlayerId,
            smallBlindSeat: this.smallBlindSeat,
            bigBlindSeat: this.bigBlindSeat,
            currentPlayerSeat: this.currentPlayerSeat,
            minRaise: this.minRaise,
            lastBet: this.lastBet,
            gameActive: this.gameActive,
            handInProgress: this.handInProgress,
            winners: this.winners
        };
    }

    borrowChips(playerId, amount) {
        const player = this.players.get(playerId);
        if (!player || player.state === PLAYER_STATES.LEFT) {
            return { success: false, message: '玩家不存在' };
        }
        if (amount <= 0) {
            return { success: false, message: '借取金额必须大于0' };
        }
        player.chips += amount;
        player.borrowedChips += amount;
        this.notifyStageChange();
        return { success: true, chips: player.chips, borrowedChips: player.borrowedChips };
    }

    repayChips(playerId, amount) {
        const player = this.players.get(playerId);
        if (!player || player.state === PLAYER_STATES.LEFT) {
            return { success: false, message: '玩家不存在' };
        }
        if (amount <= 0) {
            return { success: false, message: '归还金额必须大于0' };
        }
        if (amount > player.chips) {
            return { success: false, message: '筹码不足' };
        }
        if (amount > player.borrowedChips) {
            return { success: false, message: '归还金额超过待还金额' };
        }
        player.chips -= amount;
        player.borrowedChips -= amount;
        this.notifyStageChange();
        return { success: true, chips: player.chips, borrowedChips: player.borrowedChips };
    }
    
    giftChips(fromPlayerId, toPlayerId, amount) {
        const fromPlayer = this.players.get(fromPlayerId);
        const toPlayer = this.players.get(toPlayerId);
        
        if (!fromPlayer || fromPlayer.state === PLAYER_STATES.LEFT) {
            return { success: false, message: '赠送者不存在' };
        }
        if (!toPlayer || toPlayer.state === PLAYER_STATES.LEFT) {
            return { success: false, message: '接收者不存在' };
        }
        if (fromPlayerId === toPlayerId) {
            return { success: false, message: '不能给自己赠送筹码' };
        }
        if (amount <= 0) {
            return { success: false, message: '赠送金额必须大于0' };
        }
        if (amount > fromPlayer.chips) {
            return { success: false, message: '筹码不足' };
        }
        
        fromPlayer.chips -= amount;
        toPlayer.chips += amount;
        this.notifyStageChange();
        return { success: true, fromChips: fromPlayer.chips, toChips: toPlayer.chips };
    }
    
    setPlayerSpectator(playerId, isSpectator) {
        const player = this.players.get(playerId);
        if (!player || player.state === PLAYER_STATES.LEFT) {
            return { success: false, message: '玩家不存在' };
        }
        
        player.isSpectator = isSpectator;
        if (isSpectator) {
            player.state = PLAYER_STATES.NOT_READY;
        }
        this.notifyStageChange();
        return { success: true };
    }

    static loadFromStorage(data) {
        const game = new Game(data.roomId, data.roomName, data.smallBlind, data.bigBlind);
        
        game.stage = data.stage;
        game.communityCards = data.communityCards.map(c => new Card(c.suit, c.rank));
        game.pot = data.pot;
        game.dealerSeat = data.dealerSeat;
        game.dealerPlayerId = data.dealerPlayerId;
        game.smallBlindSeat = data.smallBlindSeat;
        game.bigBlindSeat = data.bigBlindSeat;
        game.currentPlayerSeat = data.currentPlayerSeat;
        game.minRaise = data.minRaise;
        game.lastBet = data.lastBet;
        game.gameActive = data.gameActive;
        game.handInProgress = data.handInProgress;
        game.winners = data.winners;

        data.players.forEach(pData => {
            const player = new GamePlayer(pData.id, pData.name, pData.seatNumber, pData.chips, pData.borrowedChips);
            player.hand = pData.hand.map(c => new Card(c.suit, c.rank));
            player.bet = pData.bet;
            player.totalBet = pData.totalBet || 0;
            player.state = pData.state;
            player.isSpectator = pData.isSpectator;
            game.players.set(pData.id, player);
            game.seatMap.set(pData.seatNumber, pData.id);
        });

        return game;
    }
}

module.exports = {
    Card,
    Deck,
    HandEvaluator,
    Game,
    GamePlayer,
    GAME_STAGES,
    PLAYER_STATES,
    HAND_RANKS,
    HAND_NAMES
};
