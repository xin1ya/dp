<template>
  <div class="game-area" v-if="currentRoom">
    <!-- 准备房间信息 -->
    <div class="ready-room-info" v-if="!gameState">
      <h2>当前房间</h2>
      <div class="ready-room-details">
        <p>房间名称: {{ currentRoom.name }}</p>
        <p>玩家数量: {{ currentRoom.players.length }}/12</p>
      </div>
      <div class="ready-buttons">
        <button class="primary-btn" @click="toggleReady">准备游戏</button>
        <button class="danger-btn" @click="leaveRoom">离开房间</button>
      </div>
    </div>

    <!-- 游戏界面 -->
    <div v-else class="game-table">
      <!-- 侧边栏 -->
      <div class="sidebar">
        <div class="sidebar-toggle" @click="toggleSidebar">
          <span class="toggle-icon">{{ sidebarOpen ? '◀' : '▶' }}</span>
        </div>
        <div class="sidebar-content" v-show="sidebarOpen">
          <div class="sidebar-buttons">
            <button class="sidebar-btn" @click="showChipsModal = true">筹码</button>
            <button class="sidebar-btn" @click="toggleReady">准备游戏</button>
            <button class="sidebar-btn" @click="toggleFullscreen">全屏</button>
            <button class="sidebar-btn danger" @click="leaveRoom">离开房间</button>
          </div>
          <div class="sidebar-ranking">
            <h3>积分排行</h3>
            <div class="ranking-list">
              <div v-for="(player, index) in gameState.players" :key="player.id" class="ranking-item">
                <span class="rank">{{ index + 1 }}</span>
                <span class="player-name">{{ player.nickname }}</span>
                <span class="chips">{{ player.chips }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 信息栏 -->
      <div class="info-bar">
        <div class="info-bar-toggle" @click="toggleInfoBar">
          <span class="toggle-icon">{{ infoBarOpen ? '▶' : '◀' }}</span>
        </div>
        <div class="info-bar-content" v-show="infoBarOpen">
          <div class="chat-tabs">
            <button 
              class="chat-tab" 
              :class="{ active: activeTab === 'chat' }" 
              @click="activeTab = 'chat'"
            >
              聊天
            </button>
            <button 
              class="chat-tab" 
              :class="{ active: activeTab === 'log' }" 
              @click="activeTab = 'log'"
            >
              日志
            </button>
          </div>
          <div class="chat-messages" v-show="activeTab === 'chat'">
            <div 
              v-for="message in chatMessages" 
              :key="message.id" 
              class="message"
            >
              <span class="sender">{{ message.sender }}:</span>
              <span class="message-content">{{ message.message }}</span>
            </div>
          </div>
          <div class="log-messages" v-show="activeTab === 'log'">
            <div 
              v-for="message in logMessages" 
              :key="message.id" 
              class="log-message"
            >
              {{ message.message }}
            </div>
          </div>
          <div class="chat-controls" v-show="activeTab === 'chat'">
            <input 
              type="text" 
              v-model="messageInput" 
              placeholder="输入消息..."
              @keyup.enter="sendMessage"
              class="message-input"
            />
            <button class="send-btn" @click="sendMessage">发送</button>
          </div>
        </div>
      </div>

      <!-- 玩家区域 -->
      <div class="players-area">
        <div 
          v-for="player in gameState.players" 
          :key="player.id" 
          class="player-box"
          :class="{
            current: player.id === userId,
            folded: player.folded,
            'all-in': player.allIn,
            ready: player.ready
          }"
        >
          <div class="player-header">
            <div class="player-avatar">{{ player.nickname.charAt(0) }}</div>
            <div class="player-info">
              <div class="player-name">{{ player.nickname }}</div>
              <div class="player-badges">
                <span v-if="player.isDealer" class="badge dealer">庄</span>
                <span v-if="player.isSmallBlind" class="badge small-blind">小盲</span>
                <span v-if="player.isBigBlind" class="badge big-blind">大盲</span>
              </div>
            </div>
          </div>
          <div class="player-cards">
            <div 
              v-for="(card, index) in player.cards" 
              :key="index" 
              class="card"
              :class="{ hidden: !player.showCards && player.id !== userId }"
            >
              {{ card ? card : '?' }}
            </div>
          </div>
          <div class="player-stats">
            <div class="player-chips">筹码: {{ player.chips }}</div>
            <div class="player-bet">下注: {{ player.bet }}</div>
          </div>
        </div>
      </div>

      <!-- 牌桌区域 -->
      <div class="table-area">
        <div class="community-cards">
          <div 
            v-for="(card, index) in gameState.communityCards" 
            :key="index" 
            class="card"
          >
            {{ card }}
          </div>
        </div>
        <div class="pot">底池: {{ gameState.pot }}</div>
      </div>

      <!-- 手牌区域 -->
      <div class="hand-area">
        <div class="my-hand-label">我的手牌</div>
        <div class="my-cards">
          <div 
            v-for="(card, index) in myCards" 
            :key="index" 
            class="card"
          >
            {{ card }}
          </div>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="action-area" v-if="isMyTurn">
        <button class="action-btn fold" @click="playerAction('fold')">弃牌</button>
        <button class="action-btn check" @click="playerAction('check')">过牌</button>
        <button class="action-btn call" @click="playerAction('call')">跟注</button>
        <button class="action-btn raise" @click="showRaiseModal = true">加注</button>
        <button class="action-btn all-in" @click="playerAction('allin')">全下</button>
      </div>
    </div>

    <!-- 筹码管理模态框 -->
    <div class="modal" v-if="showChipsModal" @click="showChipsModal = false">
      <div class="modal-content" @click.stop>
        <span class="close" @click="showChipsModal = false">&times;</span>
        <h2>筹码管理</h2>
        <div class="chips-section">
          <h3>借取/归还筹码</h3>
          <div class="chips-info">
            <p>当前筹码: <strong>{{ myPlayer?.chips || 0 }}</strong></p>
            <p>待还筹码: <strong>{{ myPlayer?.borrowedChips || 0 }}</strong></p>
            <p>净筹码: <strong>{{ (myPlayer?.chips || 0) - (myPlayer?.borrowedChips || 0) }}</strong></p>
          </div>
          <input 
            type="number" 
            v-model.number="chipsAmount" 
            placeholder="输入金额" 
            min="100" 
            step="100"
            class="form-input"
          />
          <div class="chips-buttons">
            <button class="primary-btn" @click="borrowChips">借取</button>
            <button class="secondary-btn" @click="repayChips">归还</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加注模态框 -->
    <div class="modal" v-if="showRaiseModal" @click="showRaiseModal = false">
      <div class="modal-content" @click.stop>
        <span class="close" @click="showRaiseModal = false">&times;</span>
        <h2>加注金额</h2>
        <p>请输入加注金额（最低 {{ minRaise }}）</p>
        <input 
          type="number" 
          v-model.number="raiseAmount" 
          placeholder="输入金额"
          class="form-input"
        />
        <div class="raise-presets">
          <button class="preset-btn" @click="setRaiseAmount('min')">最低下注</button>
          <button class="preset-btn" @click="setRaiseAmount('half-pot')">1/2底池</button>
          <button class="preset-btn" @click="setRaiseAmount('pot')">1倍底池</button>
          <button class="preset-btn" @click="setRaiseAmount('double-pot')">2倍底池</button>
        </div>
        <div class="modal-buttons">
          <button class="secondary-btn" @click="showRaiseModal = false">取消</button>
          <button class="primary-btn" @click="confirmRaise">确认加注</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../../stores/game';
import { useUserStore } from '../../stores/user';
import socketService from '../../services/socket';

const gameStore = useGameStore();
const userStore = useUserStore();

// 状态管理
const sidebarOpen = ref(false);
const infoBarOpen = ref(false);
const activeTab = ref('chat');
const messageInput = ref('');
const showChipsModal = ref(false);
const showRaiseModal = ref(false);
const chipsAmount = ref(2000);
const raiseAmount = ref(0);

// 计算属性
const currentRoom = computed(() => gameStore.currentRoom);
const gameState = computed(() => gameStore.gameState);
const userId = computed(() => userStore.userId);
const chatMessages = computed(() => gameStore.chatMessages);
const logMessages = computed(() => gameStore.logMessages);

const myPlayer = computed(() => {
  if (!gameState.value || !gameState.value.players) return null;
  return gameState.value.players.find(player => player.id === userId.value);
});

const myCards = computed(() => {
  return myPlayer.value?.cards || [];
});

const isMyTurn = computed(() => {
  if (!gameState.value || !myPlayer.value) return false;
  return gameState.value.currentPlayerId === userId.value;
});

const minRaise = computed(() => {
  if (!gameState.value) return 0;
  return gameState.value.minRaise || 0;
});

// 方法
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const toggleInfoBar = () => {
  infoBarOpen.value = !infoBarOpen.value;
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

const toggleReady = () => {
  gameStore.toggleReady(!myPlayer.value?.ready);
};

const leaveRoom = async () => {
  try {
    await gameStore.leaveRoom();
  } catch (error) {
    alert(error.message || '离开房间失败');
  }
};

const sendMessage = () => {
  if (messageInput.value.trim()) {
    socketService.send({
      type: 'chatMessage',
      message: messageInput.value.trim()
    });
    messageInput.value = '';
  }
};

const playerAction = (action, amount = 0) => {
  gameStore.playerAction(action, amount);
};

const borrowChips = () => {
  if (chipsAmount.value > 0) {
    gameStore.borrowChips(chipsAmount.value);
    showChipsModal.value = false;
  }
};

const repayChips = () => {
  if (chipsAmount.value > 0) {
    gameStore.repayChips(chipsAmount.value);
    showChipsModal.value = false;
  }
};

const setRaiseAmount = (type) => {
  if (!gameState.value) return;
  
  switch (type) {
    case 'min':
      raiseAmount.value = minRaise.value;
      break;
    case 'half-pot':
      raiseAmount.value = Math.floor(gameState.value.pot / 2);
      break;
    case 'pot':
      raiseAmount.value = gameState.value.pot;
      break;
    case 'double-pot':
      raiseAmount.value = gameState.value.pot * 2;
      break;
  }
};

const confirmRaise = () => {
  if (raiseAmount.value >= minRaise.value) {
    playerAction('raise', raiseAmount.value);
    showRaiseModal.value = false;
  } else {
    alert(`加注金额不能小于 ${minRaise.value}`);
  }
};

// 生命周期
onMounted(() => {
  // 注册WebSocket事件监听器
  socketService.on('gameState', (message) => {
    gameStore.updateGameState(message);
  });
  
  socketService.on('playerAction', (message) => {
    gameStore.addChatMessage(
      `${message.playerNickname} 选择了 ${message.action}`,
      true
    );
  });
  
  socketService.on('stageChange', (message) => {
    gameStore.addChatMessage(
      `游戏阶段变化: ${message.stage}`,
      true
    );
  });
  
  socketService.on('gameStart', (message) => {
    gameStore.addChatMessage('游戏开始', true);
  });
  
  socketService.on('chatMessage', (message) => {
    gameStore.addChatMessage(
      message.message,
      false,
      message.sender,
      message.senderId
    );
  });
});

onUnmounted(() => {
  // 移除WebSocket事件监听器
  socketService.off('gameState');
  socketService.off('playerAction');
  socketService.off('stageChange');
  socketService.off('gameStart');
  socketService.off('chatMessage');
});
</script>

<style scoped>
.game-area {
  background-color: #0a4a0a;
  border-radius: 24px;
  padding: 20px;
  min-height: 600px;
  border: 8px solid #8b4513;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230a4a0a"/><path d="M0,0 L100,100 M100,0 L0,100" stroke="%230d5c0d" stroke-width="0.5" stroke-opacity="0.3"/></svg>');
  background-size: 50px 50px;
}

.ready-room-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  min-width: 350px;
  z-index: 100;
}

.ready-room-info h2 {
  color: #00d4aa;
  margin-bottom: 20px;
}

.ready-room-details {
  margin-bottom: 30px;
  color: white;
  font-size: 16px;
  line-height: 1.5;
}

.ready-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

/* 侧边栏 */
.sidebar {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 1000;
}

.sidebar-toggle {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border: none;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
}

.toggle-icon {
  font-size: 20px;
  color: #00d4aa;
}

.sidebar-content {
  width: 200px;
  max-height: 70vh;
  overflow-y: auto;
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 12px 0 0 12px;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.4);
  border-left: 4px solid #00d4aa;
}

.sidebar-btn {
  width: 100%;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.sidebar-btn:hover {
  background-color: #444;
  transform: translateY(-2px);
}

.sidebar-btn.danger {
  background-color: #f44336;
}

.sidebar-btn.danger:hover {
  background-color: #d32f2f;
}

.sidebar-ranking {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #444;
}

.sidebar-ranking h3 {
  color: white;
  margin-bottom: 12px;
  font-size: 16px;
}

.ranking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #333;
  border-radius: 4px;
  margin-bottom: 8px;
}

.rank {
  font-weight: bold;
  color: #ffcc00;
  width: 20px;
}

.player-name {
  flex: 1;
  margin-left: 10px;
  color: white;
}

.chips {
  color: #00d4aa;
  font-weight: bold;
}

/* 信息栏 */
.info-bar {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 999;
}

.info-bar-toggle {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.info-bar-content {
  width: 280px;
  max-height: 70vh;
  overflow-y: auto;
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 0 12px 12px 0;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.4);
  border-right: 4px solid #ffcc00;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-tabs {
  display: flex;
  gap: 4px;
}

.chat-tab {
  flex: 1;
  padding: 8px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.chat-tab.active {
  background-color: #00d4aa;
  color: black;
  font-weight: bold;
}

.chat-messages,
.log-messages {
  flex: 1;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
}

.message {
  margin-bottom: 8px;
}

.sender {
  color: #00d4aa;
  font-weight: bold;
  margin-right: 8px;
}

.message-content {
  color: white;
}

.log-message {
  margin-bottom: 8px;
  color: #ffcc00;
  font-style: italic;
}

.chat-controls {
  display: flex;
  gap: 8px;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
}

.send-btn {
  padding: 8px 16px;
  background-color: #00d4aa;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

/* 玩家区域 */
.players-area {
  display: flex;
  justify-content: flex-start;
  overflow-x: auto;
  margin-bottom: 24px;
  gap: 12px;
  padding-bottom: 12px;
}

.player-box {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  min-width: 150px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  backdrop-filter: blur(5px);
  padding: 12px;
}

.player-box:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.player-box.current {
  border-color: #ffcc00;
  box-shadow: 0 0 15px rgba(255, 204, 0, 0.7), inset 0 0 20px rgba(255, 204, 0, 0.2);
  background-color: rgba(255, 204, 0, 0.1);
}

.player-box.folded {
  opacity: 0.5;
  border-color: #666;
  background-color: rgba(102, 102, 102, 0.1);
}

.player-box.all-in {
  border-color: #ff6b6b;
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.7), inset 0 0 20px rgba(255, 107, 107, 0.2);
  background-color: rgba(255, 107, 107, 0.1);
}

.player-box.ready {
  border-color: #4ecdc4;
  box-shadow: 0 0 15px rgba(78, 205, 196, 0.7), inset 0 0 20px rgba(78, 205, 196, 0.2);
  background-color: rgba(78, 205, 196, 0.1);
}

.player-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: bold;
  color: #ffcc00;
  margin-bottom: 4px;
}

.player-badges {
  display: flex;
  gap: 4px;
}

.badge {
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
}

.badge.dealer {
  background-color: #ffd700;
  color: #000;
}

.badge.small-blind {
  background-color: #1e90ff;
  color: #fff;
}

.badge.big-blind {
  background-color: #ff4500;
  color: #fff;
}

.player-cards {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
}

.card {
  width: 40px;
  height: 56px;
  background-color: white;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  color: #000;
  transition: all 0.3s;
}

.card:hover {
  transform: translateY(-2px) rotate(2deg);
  box-shadow: 3px 4px 12px rgba(0, 0, 0, 0.4);
}

.card.hidden {
  background-color: #1e5799;
  color: white;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
}

.card.hidden::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 10px, rgba(255, 255, 255, 0.05) 10px, rgba(255, 255, 255, 0.05) 20px);
  transform: rotate(45deg);
  animation: shine 3s linear infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.player-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.player-chips {
  color: #00d4aa;
}

.player-bet {
  color: #ff9800;
}

/* 牌桌区域 */
.table-area {
  text-align: center;
  margin-bottom: 24px;
}

.community-cards {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pot {
  font-size: 24px;
  color: #ffcc00;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* 手牌区域 */
.hand-area {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.my-hand-label {
  font-size: 16px;
  font-weight: bold;
  color: #ffcc00;
}

.my-cards {
  display: flex;
  gap: 8px;
}

/* 操作区域 */
.action-area {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
}

.action-btn {
  padding: 15px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  transition: all 0.3s;
  width: 100%;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.action-btn.fold {
  background-color: #f44336;
  color: white;
}

.action-btn.check {
  background-color: #4CAF50;
  color: white;
}

.action-btn.call {
  background-color: #2196F3;
  color: white;
}

.action-btn.raise {
  background-color: #ff9800;
  color: white;
}

.action-btn.all-in {
  background-color: #9c27b0;
  color: white;
  grid-column: span 3;
}

/* 模态框 */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #2a2a2a;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #00d4aa, #ffcc00);
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 15px;
}

.close:hover {
  color: #fff;
}

.modal-content h2 {
  margin-bottom: 24px;
  color: #00d4aa;
  text-align: center;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  color: #ffffff;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #00d4aa;
  box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.2);
}

.chips-section {
  margin-bottom: 24px;
}

.chips-section h3 {
  color: #00d4aa;
  margin-bottom: 16px;
}

.chips-info {
  margin-bottom: 16px;
  color: white;
  line-height: 1.5;
}

.chips-buttons {
  display: flex;
  gap: 12px;
}

.raise-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.preset-btn {
  padding: 10px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.preset-btn:hover {
  background-color: #444;
  transform: translateY(-2px);
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

/* 按钮样式 */
.primary-btn {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #00d4aa;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
  flex: 1;
}

.primary-btn:hover:not(:disabled) {
  background-color: #00b890;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 212, 170, 0.4);
}

.secondary-btn {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #666;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.secondary-btn:hover {
  background-color: #555;
  transform: translateY(-2px);
}

.danger-btn {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.danger-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
}
</style>