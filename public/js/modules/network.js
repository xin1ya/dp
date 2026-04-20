// 网络模块

import { isiOS } from './utils.js';

class NetworkManager {
    constructor() {
        this.ws = null;
        this.sseRes = null;
        this.clientId = null;
        this.isConnected = false;
        this.messageHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    // 连接到服务器
    connect() {
        if (isiOS()) {
            this.connectWithSSE();
        } else {
            this.connectWithWebSocket();
        }
    }

    // 使用WebSocket连接
    connectWithWebSocket() {
        try {
            this.ws = new WebSocket('ws://' + window.location.host);
            
            this.ws.onopen = () => {
                console.log('WebSocket连接已建立');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.triggerHandler('connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('解析WebSocket消息失败:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket连接已关闭');
                this.isConnected = false;
                this.triggerHandler('disconnected');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket错误:', error);
                this.triggerHandler('error', error);
            };
        } catch (error) {
            console.error('创建WebSocket连接失败:', error);
            this.triggerHandler('error', error);
        }
    }

    // 使用SSE连接（iOS设备）
    connectWithSSE() {
        try {
            this.clientId = Math.random().toString(36).substring(2, 15);
            const url = `/api/events?clientId=${this.clientId}`;
            
            this.sseRes = new EventSource(url);
            
            this.sseRes.onopen = () => {
                console.log('SSE连接已建立');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.triggerHandler('connected');
            };

            this.sseRes.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.playerId) {
                        this.clientId = data.playerId;
                    }
                    this.handleMessage(data);
                } catch (error) {
                    console.error('解析SSE消息失败:', error);
                }
            };

            this.sseRes.onerror = () => {
                console.error('SSE错误');
                this.isConnected = false;
                this.triggerHandler('disconnected');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('创建SSE连接失败:', error);
            this.triggerHandler('error', error);
        }
    }

    // 发送消息
    send(message) {
        if (isiOS()) {
            this.sendWithHTTP(message);
        } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('连接未建立，无法发送消息');
        }
    }

    // 使用HTTP POST发送消息（iOS设备）
    sendWithHTTP(message) {
        fetch('/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: this.clientId,
                ...message
            })
        })
        .then(response => response.json())
        .catch(error => {
            console.error('发送HTTP消息失败:', error);
        });
    }

    // 处理消息
    handleMessage(data) {
        this.triggerHandler('message', data);
        if (data.type) {
            this.triggerHandler(data.type, data);
        }
    }

    // 注册消息处理器
    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(handler);
    }

    // 触发消息处理器
    triggerHandler(type, data) {
        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`处理${type}消息时出错:`, error);
                }
            });
        }
    }

    // 尝试重连
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
        } else {
            console.error('重连失败，已达到最大尝试次数');
        }
    }

    // 断开连接
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.sseRes) {
            this.sseRes.close();
            this.sseRes = null;
        }
        this.isConnected = false;
    }

    // 检查连接状态
    getConnectionStatus() {
        return this.isConnected;
    }
}

export const networkManager = new NetworkManager();
