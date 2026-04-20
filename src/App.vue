<template>
  <div class="app">
    <header class="app-header">
      <h1>德州扑克</h1>
      <div class="user-info-area" v-if="userStore.loggedIn">
        <div class="user-avatar">{{ userStore.nickname.charAt(0) }}</div>
        <div class="user-details">
          <div class="user-nickname">{{ userStore.nickname }}</div>
          <button class="edit-profile-btn" @click="showProfileModal = true">编辑</button>
        </div>
      </div>
      <div class="user-info-area" v-else>
        <button class="login-btn" @click="showAuthModal = true">登录/注册</button>
      </div>
      <button class="fullscreen-btn" @click="toggleFullscreen">全屏</button>
    </header>
    
    <main class="app-main">
      <div class="connection-status">
        <span class="status-indicator" :class="{ connected: gameStore.isConnected }"></span>
        <span class="status-text">{{ gameStore.connectionStatus === 'connected' ? '已连接' : '未连接' }}</span>
      </div>
      
      <div v-if="userStore.loggedIn">
        <RoomManagement v-if="!gameStore.currentRoom" />
        <GameTable v-else />
      </div>
      <div v-else class="welcome-screen">
        <h2>欢迎来到德州扑克</h2>
        <p>请登录或注册以开始游戏</p>
        <button class="primary-btn" @click="showAuthModal = true">登录/注册</button>
      </div>
    </main>
    
    <!-- 认证模态框 -->
    <AuthModal 
      :visible="showAuthModal" 
      @close="showAuthModal = false"
      @login-success="handleLoginSuccess"
    />
    
    <!-- 个人资料模态框 -->
    <ProfileModal 
      :visible="showProfileModal" 
      @close="showProfileModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AuthModal from './components/auth/AuthModal.vue';
import ProfileModal from './components/auth/ProfileModal.vue';
import RoomManagement from './components/room/RoomManagement.vue';
import GameTable from './components/game/GameTable.vue';
import { useUserStore } from './stores/user';
import { useGameStore } from './stores/game';
import socketService from './services/socket';

const userStore = useUserStore();
const gameStore = useGameStore();

const showAuthModal = ref(false);
const showProfileModal = ref(false);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

const handleLoginSuccess = () => {
  // 登录成功后连接WebSocket
  socketService.connect().then(() => {
    gameStore.setConnectionStatus('connected');
  }).catch(error => {
    console.error('WebSocket连接失败:', error);
    gameStore.setConnectionStatus('disconnected');
  });
};

onMounted(() => {
  // 尝试连接WebSocket
  socketService.connect().then(() => {
    gameStore.setConnectionStatus('connected');
  }).catch(error => {
    console.error('WebSocket连接失败:', error);
    gameStore.setConnectionStatus('disconnected');
  });
  
  // 监听连接状态
  socketService.on('connect', () => {
    gameStore.setConnectionStatus('connected');
  });
  
  socketService.on('disconnect', () => {
    gameStore.setConnectionStatus('disconnected');
  });
});

onUnmounted(() => {
  // 断开WebSocket连接
  socketService.disconnect();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #1a1a1a;
  color: #ffffff;
  min-height: 100vh;
  overflow-x: hidden;
}

.app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  padding: 20px;
  background-color: #2a2a2a;
  border-bottom: 2px solid #00d4aa;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.app-header h1 {
  color: #00d4aa;
  font-size: 28px;
  font-weight: bold;
}

.user-info-area {
  position: absolute;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
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

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-nickname {
  font-weight: bold;
  color: #ffcc00;
  margin-bottom: 4px;
}

.edit-profile-btn {
  padding: 2px 8px;
  font-size: 10px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-profile-btn:hover {
  background-color: #f57c00;
}

.login-btn {
  padding: 8px 16px;
  background-color: #00d4aa;
  color: black;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.login-btn:hover {
  background-color: #00b890;
  transform: translateY(-2px);
}

.fullscreen-btn {
  position: absolute;
  right: 20px;
  padding: 8px 16px;
  font-size: 14px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.fullscreen-btn:hover {
  background-color: #f57c00;
  transform: translateY(-2px);
}

.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #2a2a2a;
  border-radius: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: #ff4444;
  transition: all 0.3s;
}

.status-indicator.connected {
  background-color: #44ff44;
  box-shadow: 0 0 10px rgba(68, 255, 68, 0.5);
}

.status-text {
  font-size: 14px;
  color: #ccc;
}

.welcome-screen {
  text-align: center;
  padding: 60px 20px;
  background-color: #2a2a2a;
  border-radius: 12px;
  margin-top: 60px;
}

.welcome-screen h2 {
  color: #00d4aa;
  margin-bottom: 20px;
  font-size: 24px;
}

.welcome-screen p {
  color: #ccc;
  margin-bottom: 30px;
  font-size: 16px;
}

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
}

.primary-btn:hover:not(:disabled) {
  background-color: #00b890;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 212, 170, 0.4);
}

@media (max-width: 768px) {
  .app-header {
    padding: 15px;
  }
  
  .app-header h1 {
    font-size: 24px;
  }
  
  .user-info-area {
    left: 10px;
    gap: 8px;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .fullscreen-btn {
    right: 10px;
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .app-main {
    padding: 10px;
  }
  
  .welcome-screen {
    padding: 40px 10px;
    margin-top: 40px;
  }
}
</style>