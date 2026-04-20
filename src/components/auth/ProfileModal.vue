<template>
  <div class="modal" v-if="visible" @click="closeModal">
    <div class="modal-content" @click.stop>
      <span class="close" @click="closeModal">&times;</span>
      <h2>个人资料</h2>
      <div class="profile-form">
        <div class="form-group">
          <label>昵称</label>
          <input 
            type="text" 
            v-model="form.nickname" 
            placeholder="输入昵称" 
            maxlength="10"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>头像</label>
          <div class="avatar-upload">
            <div class="avatar-preview">
              <img :src="form.avatar" alt="头像" />
            </div>
            <input 
              type="file" 
              @change="handleAvatarUpload" 
              accept="image/*"
              class="avatar-input"
            />
            <button class="avatar-upload-btn">上传头像</button>
          </div>
        </div>
        <div class="form-group">
          <label>修改密码</label>
          <input 
            type="password" 
            v-model="form.password" 
            placeholder="输入新密码" 
            maxlength="20"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input 
            type="password" 
            v-model="form.confirmPassword" 
            placeholder="确认新密码" 
            maxlength="20"
            class="form-input"
          />
        </div>
        <button 
          class="primary-btn" 
          @click="handleSubmit" 
          :disabled="isLoading"
        >
          {{ isLoading ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../../stores/user';
import apiService from '../../services/api';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const userStore = useUserStore();
const isLoading = ref(false);

const form = reactive({
  nickname: '',
  avatar: '',
  password: '',
  confirmPassword: ''
});

onMounted(() => {
  // 初始化表单数据
  form.nickname = userStore.nickname || '';
  form.avatar = userStore.avatar || 'https://via.placeholder.com/100';
});

const closeModal = () => {
  emit('close');
};

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    isLoading.value = true;
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiService.uploadAvatar(formData);
      form.avatar = response.avatarUrl;
    } catch (error) {
      alert('头像上传失败，请重试');
    } finally {
      isLoading.value = false;
    }
  }
};

const handleSubmit = async () => {
  if (!form.nickname) {
    alert('请填写昵称');
    return;
  }

  if (form.password) {
    if (!form.confirmPassword) {
      alert('请确认密码');
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
  }

  isLoading.value = true;

  try {
    await userStore.updateProfile({
      nickname: form.nickname,
      avatar: form.avatar,
      password: form.password
    });
    alert('个人资料更新成功');
    closeModal();
  } catch (error) {
    alert(error.message || '更新失败，请重试');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
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

h2 {
  margin-bottom: 24px;
  color: #00d4aa;
  text-align: center;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: white;
  font-size: 14px;
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
}

.form-input:focus {
  outline: none;
  border-color: #00d4aa;
  box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.2);
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #00d4aa;
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-input {
  display: none;
}

.avatar-upload-btn {
  padding: 8px 16px;
  font-size: 14px;
  background-color: #00d4aa;
  color: #000000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.avatar-upload-btn:hover {
  background-color: #00b890;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
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

.primary-btn:disabled {
  background-color: #666666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>