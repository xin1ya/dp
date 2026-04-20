<template>
  <div class="room-management">
    <div class="room-controls">
      <button class="primary-btn" @click="showCreateRoomModal = true">创建房间</button>
      <button class="secondary-btn" @click="refreshRooms">刷新房间</button>
    </div>
    
    <div v-if="currentRoom" class="current-room">
      <h2>当前房间</h2>
      <div class="room-info">
        <p><strong>房间名称:</strong> {{ currentRoom.name }}</p>
        <p><strong>结束时间:</strong> {{ formatEndTime(currentRoom.endTime) }}</p>
        <p><strong>卡牌皮肤:</strong> {{ currentRoom.cardSkin }}</p>
      </div>
      <button class="danger-btn" @click="leaveRoom">离开房间</button>
    </div>
    
    <div class="rooms-list">
      <h2>房间列表</h2>
      <div class="rooms-container" v-if="rooms.length > 0">
        <div 
          v-for="room in rooms" 
          :key="room.id" 
          class="room-card"
          :class="{ full: room.players.length >= 12 }"
        >
          <h3>{{ room.name }}</h3>
          <p>玩家: {{ room.players.length }}/12</p>
          <p>结束时间: {{ formatEndTime(room.endTime) }}</p>
          <p>卡牌皮肤: {{ room.cardSkin }}</p>
          <button 
            class="join-btn" 
            @click="joinRoom(room.id)"
            :disabled="room.players.length >= 12"
          >
            {{ room.players.length >= 12 ? '已满' : '加入' }}
          </button>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>暂无可用房间</p>
      </div>
    </div>
    
    <!-- 创建房间模态框 -->
    <div class="modal" v-if="showCreateRoomModal" @click="showCreateRoomModal = false">
      <div class="modal-content" @click.stop>
        <span class="close" @click="showCreateRoomModal = false">&times;</span>
        <h2>创建新房间</h2>
        <input 
          type="text" 
          v-model="createRoomForm.name" 
          placeholder="输入房间名称"
          class="form-input"
        />
        <div class="form-group">
          <label>房间时长（小时）</label>
          <input 
            type="number" 
            v-model.number="createRoomForm.duration" 
            min="1" 
            max="24" 
            step="1"
            class="form-input"
          />
          <small>系统将自动计算结束时间（当前时间 + 输入小时数）</small>
        </div>
        <div class="form-group">
          <label>扑克牌皮肤</label>
          <select v-model="createRoomForm.cardSkin" class="form-input">
            <option value="default">默认皮肤</option>
            <option value="cat">猫咪主题皮肤</option>
          </select>
        </div>
        <button 
          class="primary-btn" 
          @click="createRoom"
          :disabled="!createRoomForm.name || !createRoomForm.duration"
        >
          创建
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useGameStore } from '../../stores/game';

const gameStore = useGameStore();
const showCreateRoomModal = ref(false);

const createRoomForm = reactive({
  name: '',
  duration: 5,
  cardSkin: 'default'
});

const rooms = computed(() => gameStore.rooms);
const currentRoom = computed(() => gameStore.currentRoom);

onMounted(() => {
  refreshRooms();
});

const refreshRooms = async () => {
  try {
    await gameStore.getRooms();
  } catch (error) {
    console.error('刷新房间列表失败:', error);
  }
};

const createRoom = async () => {
  if (!createRoomForm.name || !createRoomForm.duration) {
    alert('请填写房间名称和时长');
    return;
  }

  const endTime = new Date();
  endTime.setHours(endTime.getHours() + createRoomForm.duration);

  try {
    await gameStore.createRoom(
      createRoomForm.name,
      endTime.toISOString(),
      createRoomForm.cardSkin
    );
    showCreateRoomModal.value = false;
    // 重置表单
    createRoomForm.name = '';
    createRoomForm.duration = 5;
    createRoomForm.cardSkin = 'default';
  } catch (error) {
    alert(error.message || '创建房间失败');
  }
};

const joinRoom = async (roomId) => {
  try {
    await gameStore.joinRoom(roomId);
  } catch (error) {
    alert(error.message || '加入房间失败');
  }
};

const leaveRoom = async () => {
  try {
    await gameStore.leaveRoom();
  } catch (error) {
    alert(error.message || '离开房间失败');
  }
};

const formatEndTime = (endTime) => {
  if (!endTime) return '未设置';
  const date = new Date(endTime);
  return date.toLocaleString('zh-CN');
};
</script>

<style scoped>
.room-management {
  margin-bottom: 24px;
}

.room-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
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

.secondary-btn {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #666;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
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
}

.danger-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
}

.current-room {
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 2px solid #00d4aa;
}

.current-room h2 {
  margin-bottom: 16px;
  color: #00d4aa;
}

.room-info {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rooms-list h2 {
  margin-bottom: 16px;
  color: #00d4aa;
}

.rooms-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.room-card {
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #3a3a3a;
  transition: all 0.3s;
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: #00d4aa;
}

.room-card.full {
  opacity: 0.7;
  border-color: #ff4444;
}

.room-card h3 {
  margin-bottom: 12px;
  color: #00d4aa;
}

.room-card p {
  margin-bottom: 8px;
  font-size: 14px;
}

.join-btn {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background-color: #00d4aa;
  color: #000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.join-btn:hover:not(:disabled) {
  background-color: #00b890;
  transform: translateY(-2px);
}

.join-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background-color: #2a2a2a;
  border-radius: 12px;
  color: #aaa;
}

/* 模态框样式 */
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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  color: white;
  display: block;
  margin-bottom: 8px;
}

.form-group small {
  color: gray;
  display: block;
  margin-top: 4px;
  font-size: 12px;
}
</style>