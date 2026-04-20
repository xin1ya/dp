import { defineStore } from 'pinia';
import socketService from '../services/socket';

export const useGameStore = defineStore('game', {
  state: () => ({
    rooms: [],
    currentRoom: null,
    gameState: null,
    connectionStatus: 'disconnected',
    cardSkins: {},
    currentCardSkin: 'default',
    chatMessages: [],
    logMessages: []
  }),

  getters: {
    isConnected: (state) => state.connectionStatus === 'connected',
    isInRoom: (state) => !!state.currentRoom,
    activePlayers: (state) => {
      if (!state.gameState || !state.gameState.players) return [];
      return state.gameState.players.filter(player => !player.folded && !player.left);
    }
  },

  actions: {
    async getRooms() {
      return new Promise((resolve, reject) => {
        socketService.send({ type: 'getRooms' });

        const roomListHandler = (message) => {
          this.rooms = message.rooms;
          socketService.off('roomList', roomListHandler);
          resolve(message.rooms);
        };

        socketService.on('roomList', roomListHandler);
      });
    },

    async createRoom(name, endTime, cardSkin) {
      return new Promise((resolve, reject) => {
        socketService.send({
          type: 'createRoom',
          name,
          endTime,
          cardSkin
        });

        const roomCreatedHandler = (message) => {
          this.currentRoom = message.room;
          socketService.off('roomCreated', roomCreatedHandler);
          socketService.off('error', errorHandler);
          resolve(message.room);
        };

        const errorHandler = (message) => {
          socketService.off('roomCreated', roomCreatedHandler);
          socketService.off('error', errorHandler);
          reject(new Error(message.message || '创建房间失败'));
        };

        socketService.on('roomCreated', roomCreatedHandler);
        socketService.on('error', errorHandler);
      });
    },

    async joinRoom(roomId) {
      return new Promise((resolve, reject) => {
        socketService.send({
          type: 'joinRoom',
          roomId
        });

        const roomJoinedHandler = (message) => {
          this.currentRoom = message.room;
          socketService.off('roomJoined', roomJoinedHandler);
          socketService.off('error', errorHandler);
          resolve(message.room);
        };

        const errorHandler = (message) => {
          socketService.off('roomJoined', roomJoinedHandler);
          socketService.off('error', errorHandler);
          reject(new Error(message.message || '加入房间失败'));
        };

        socketService.on('roomJoined', roomJoinedHandler);
        socketService.on('error', errorHandler);
      });
    },

    async leaveRoom() {
      return new Promise((resolve, reject) => {
        socketService.send({ type: 'leaveRoom' });

        const roomLeftHandler = (message) => {
          this.currentRoom = null;
          this.gameState = null;
          socketService.off('roomLeft', roomLeftHandler);
          resolve(message);
        };

        socketService.on('roomLeft', roomLeftHandler);
      });
    },

    async toggleReady(ready) {
      socketService.send({
        type: 'toggleReady',
        ready
      });
    },

    async playerAction(action, amount = 0) {
      socketService.send({
        type: 'playerAction',
        action,
        amount
      });
    },

    async borrowChips(amount) {
      socketService.send({
        type: 'borrowChips',
        amount
      });
    },

    async repayChips(amount) {
      socketService.send({
        type: 'repayChips',
        amount
      });
    },

    setConnectionStatus(status) {
      this.connectionStatus = status;
    },

    updateGameState(state) {
      this.gameState = state;
    },

    updateRoom(room) {
      this.currentRoom = room;
    },

    addChatMessage(message, isSystem = false, sender = '', senderId = '') {
      if (isSystem) {
        this.logMessages.push({
          id: Date.now(),
          message,
          timestamp: new Date(),
          type: 'system'
        });
      } else {
        this.chatMessages.push({
          id: Date.now(),
          message,
          sender,
          senderId,
          timestamp: new Date(),
          type: 'player'
        });
      }
    },

    clearMessages() {
      this.chatMessages = [];
      this.logMessages = [];
    },

    setCardSkin(skin) {
      this.currentCardSkin = skin;
    },

    loadCardSkins(skins) {
      this.cardSkins = skins;
    }
  }
});