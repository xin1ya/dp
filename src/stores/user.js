import { defineStore } from 'pinia';
import socketService from '../services/socket';
import apiService from '../services/api';

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    username: '',
    nickname: '',
    avatar: null,
    avatarUpdatedAt: null,
    loggedIn: false,
    isRegisterMode: false,
    loginConflictUserId: null,
    kicked: false
  }),

  getters: {
    isLoggedIn: (state) => state.loggedIn,
    userInfo: (state) => ({
      userId: state.userId,
      username: state.username,
      nickname: state.nickname,
      avatar: state.avatar,
      avatarUpdatedAt: state.avatarUpdatedAt
    })
  },

  actions: {
    async login(username, password, rememberMe) {
      return new Promise((resolve, reject) => {
        socketService.send({
          type: 'login',
          username,
          password
        });

        const loginSuccessHandler = (message) => {
          this.userId = message.userId;
          this.username = username;
          this.nickname = message.nickname;
          this.avatarUpdatedAt = message.avatarUpdatedAt;
          this.loggedIn = true;
          
          if (rememberMe) {
            localStorage.setItem('texasHoldem_username', username);
            localStorage.setItem('texasHoldem_password', password);
            localStorage.setItem('texasHoldem_rememberMe', 'true');
          } else {
            localStorage.removeItem('texasHoldem_username');
            localStorage.removeItem('texasHoldem_password');
            localStorage.removeItem('texasHoldem_rememberMe');
          }

          socketService.off('loginSuccess', loginSuccessHandler);
          socketService.off('error', errorHandler);
          resolve(message);
        };

        const errorHandler = (message) => {
          socketService.off('loginSuccess', loginSuccessHandler);
          socketService.off('error', errorHandler);
          reject(new Error(message.message || '登录失败'));
        };

        socketService.on('loginSuccess', loginSuccessHandler);
        socketService.on('error', errorHandler);
      });
    },

    async register(username, password, nickname, inviteCode) {
      return new Promise((resolve, reject) => {
        socketService.send({
          type: 'register',
          username,
          password,
          nickname,
          inviteCode
        });

        const registerSuccessHandler = (message) => {
          this.userId = message.userId;
          this.username = username;
          this.nickname = nickname;
          this.loggedIn = true;

          socketService.off('registerSuccess', registerSuccessHandler);
          socketService.off('error', errorHandler);
          resolve(message);
        };

        const errorHandler = (message) => {
          socketService.off('registerSuccess', registerSuccessHandler);
          socketService.off('error', errorHandler);
          reject(new Error(message.message || '注册失败'));
        };

        socketService.on('registerSuccess', registerSuccessHandler);
        socketService.on('error', errorHandler);
      });
    },

    async updateUserInfo(nickname) {
      try {
        const response = await apiService.updateUserInfo(this.userId, nickname);
        if (response.success) {
          this.nickname = nickname;
          return response;
        } else {
          throw new Error('更新失败');
        }
      } catch (error) {
        throw error;
      }
    },

    async uploadAvatar(file) {
      try {
        const response = await apiService.uploadAvatar(this.userId, file);
        if (response.success) {
          this.avatar = response.avatar;
          this.avatarUpdatedAt = Date.now();
          return response;
        } else {
          throw new Error('上传失败');
        }
      } catch (error) {
        throw error;
      }
    },

    loadSavedCredentials() {
      const savedUsername = localStorage.getItem('texasHoldem_username');
      const savedPassword = localStorage.getItem('texasHoldem_password');
      const rememberMe = localStorage.getItem('texasHoldem_rememberMe') === 'true';

      return {
        username: savedUsername || '',
        password: savedPassword || '',
        rememberMe
      };
    },

    logout() {
      this.userId = null;
      this.username = '';
      this.nickname = '';
      this.avatar = null;
      this.avatarUpdatedAt = null;
      this.loggedIn = false;
      this.loginConflictUserId = null;
      this.kicked = false;
    },

    setLoginConflict(userId) {
      this.loginConflictUserId = userId;
    },

    setKicked(value) {
      this.kicked = value;
    }
  }
});