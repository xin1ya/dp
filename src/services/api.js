class ApiService {
  constructor() {
    this.baseUrl = '';
  }

  async uploadAvatar(userId, file) {
    const formData = new FormData();
    formData.append('avatar', file, 'avatar.png');

    try {
      const response = await fetch(`${this.baseUrl}/upload-avatar?userId=${userId}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('头像上传失败:', error);
      throw error;
    }
  }

  async updateUserInfo(userId, nickname) {
    try {
      const response = await fetch(`${this.baseUrl}/update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          nickname
        })
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('用户信息更新失败:', error);
      throw error;
    }
  }

  async getEvents(clientId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/events?clientId=${clientId}`);
      return response;
    } catch (error) {
      console.error('获取事件流失败:', error);
      throw error;
    }
  }

  async sendMessage(clientId, type, data) {
    try {
      const response = await fetch(`${this.baseUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId,
          type,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export default new ApiService();