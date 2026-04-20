<template>
  <div class="modal" v-if="visible" @click="closeModal">
    <div class="modal-content" @click.stop>
      <span class="close" @click="closeModal">&times;</span>
      <h2>{{ isRegisterMode ? '注册' : '登录' }}</h2>
      <div class="auth-form">
        <input 
          type="text" 
          v-model="form.username" 
          placeholder="账号" 
          maxlength="20"
          class="form-input"
        />
        <input 
          type="password" 
          v-model="form.password" 
          placeholder="密码" 
          maxlength="20"
          class="form-input"
        />
        <div v-if="isRegisterMode" class="form-group">
          <input 
            type="password" 
            v-model="form.confirmPassword" 
            placeholder="确认密码" 
            maxlength="20"
            class="form-input"
          />
        </div>
        <div v-if="isRegisterMode" class="form-group">
          <input 
            type="text" 
            v-model="form.nickname" 
            placeholder="昵称" 
            maxlength="10"
            class="form-input"
          />
        </div>
        <div v-if="isRegisterMode" class="form-group">
          <input 
            type="text" 
            v-model="form.inviteCode" 
            placeholder="邀请码" 
            maxlength="20"
            class="form-input"
          />
        </div>
        <div class="form-group" v-if="!isRegisterMode">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.rememberMe">
            记住密码
          </label>
        </div>
        <button 
          class="auth-btn" 
          @click="handleSubmit" 
          :disabled="isLoading"
        >
          {{ isLoading ? '处理中...' : (isRegisterMode ? '注册' : '登录') }}
        </button>
        <p class="auth-switch">
          {{ isRegisterMode ? '已有账号？' : '还没有账号？' }}
          <a href="#" @click.prevent="toggleMode">
            {{ isRegisterMode ? '立即登录' : '立即注册' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../../stores/user';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'login-success']);

const userStore = useUserStore();
const isRegisterMode = ref(false);
const isLoading = ref(false);

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  inviteCode: '',
  rememberMe: false
});

onMounted(() => {
  const saved = userStore.loadSavedCredentials();
  form.username = saved.username;
  form.password = saved.password;
  form.rememberMe = saved.rememberMe;
});

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  resetForm();
};

const resetForm = () => {
  if (isRegisterMode.value) {
    form.confirmPassword = '';
    form.nickname = '';
    form.inviteCode = '';
  }
};

const closeModal = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (!form.username || !form.password) {
    alert('请填写账号和密码');
    return;
  }

  if (isRegisterMode.value) {
    if (!form.confirmPassword) {
      alert('请确认密码');
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (!form.nickname) {
      alert('请填写昵称');
      return;
    }
    if (!form.inviteCode) {
      alert('请填写邀请码');
      return;
    }
  }

  isLoading.value = true;

  try {
    if (isRegisterMode.value) {
      await userStore.register(
        form.username,
        form.password,
        form.nickname,
        form.inviteCode
      );
    } else {
      await userStore.login(
        form.username,
        form.password,
        form.rememberMe
      );
    }
    emit('login-success');
    closeModal();
  } catch (error) {
    alert(error.message || '操作失败，请重试');
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-btn {
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

.auth-btn:hover:not(:disabled) {
  background-color: #00b890;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 212, 170, 0.4);
}

.auth-btn:disabled {
  background-color: #666666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth-switch {
  text-align: center;
  margin-top: 8px;
  color: #aaa;
  font-size: 14px;
}

.auth-switch a {
  color: #00d4aa;
  text-decoration: none;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>