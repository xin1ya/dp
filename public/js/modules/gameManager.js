// 游戏管理模块

import { networkManager } from './network.js';
import { uiManager } from './ui.js';
import { VERSION, STAGE_NAMES, overrideAlert } from './utils.js';
import { loadSavedCredentials, saveCredentials, checkVersionUpdate, cleanupOldData } from './storage.js';

class GameManager {
    constructor() {
        this.playerId = null;
        this.userId = null;
        this.nickname = '';
        this.loggedIn = false;
        this.isRegisterMode = false;
        this.currentRoom = null;
        this.gameState = null;
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        this.loginConflictUserId = null;
        this.kicked = false;
        this.cardSkins = {};
        this.currentCardSkin = 'default';
        this.avatarUpdatedAt = null;
        this.phraseUsage = {};
        this.emojiUsage = {};
        this.tempAvatarFile = null;
        this.croppedAvatarBlob = null;
        this.UPDATE_NOTES = [
            {
                version: '1.1.3',
                title: '版本 1.1.3 更新公告',
                content: [
                    '1. 皮肤牌值文字限制移除最小值，现在文字大小完全由扑克牌大小决定',
                    '2. 修复房间内不显示其他玩家头像问题，现在所有玩家的自定义头像都会正确显示',
                    '3. 优化玩家盒子区域UI，增加折叠显示功能，折叠后只显示玩家昵称、身份标识和下注信息'
                ]
            },
            {
                version: '1.1.2',
                title: '版本 1.1.2 更新公告',
                content: [
                    '1. 新增扑克牌皮肤系统，支持自定义扑克牌外观',
                    '2. 实现皮肤权限管理，基于用户ID分配皮肤权限',
                    '3. 支持多种图片格式和自适应布局',
                    '4. 优化手牌显示效果，调整卡片大小和样式',
                    '5. 修复创建房间模态框关闭按钮问题'
                ]
            },
            {
                version: '1.1.1',
                title: '版本 1.1.1 更新公告',
                content: [
                    '1. 新增iOS设备支持，解决iOS无法连接WebSocket的问题',
                    '2. iOS设备使用SSE+HTTP POST通信方式，确保游戏功能完整可用',
                    '3. 实现iOS连接的心跳检测和自动重连机制',
                    '4. 优化版本公告显示逻辑，只显示最近3个版本更新'
                ]
            },
            {
                version: '1.1.0',
                title: '版本 1.1.0 更新公告',
                content: [
                    '1. 新增客户端自定义常用语功能，支持添加和删除自定义常用语',
                    '2. 实现常用语和表情包按使用次数排序功能，使用频率高的显示在前面',
                    '3. 区分自定义常用语和预设常用语，自定义常用语有青色描边和删除按钮',
                    '4. 优化常用语排序实时更新，点击后立即更新排序',
                ]
            },
            {
                version: '1.0.9',
                title: '版本 1.0.9 更新公告',
                content: [
                    '1. 新增踢出玩家投票功能，可通过投票将玩家切换为弃牌状态',
                    '2. 修复被投票弃牌后玩家还能行动的问题',
                    '3. 修复当行动人员状态被动切换为弃牌或离开时，客户端显示等待其他玩家行动的问题',
                    '4. 优化了筹码管理页面ui'
                ]
            },
            {
                version: '1.0.8',
                title: '版本 1.0.8 更新公告',
                content: [
                    '1. 将alert弹窗改为专门的提醒模态框，避免退出全屏状态',
                    '2. 优化净筹码排行榜，显示所有玩家（包括离开和观战玩家）',
                    '3. 升级筹码管理页面，调整布局和功能',
                    '4. 改进聊天工具界面，提升用户体验'
                ]
            },
            {
                version: '1.0.7',
                title: '版本 1.0.7 更新公告',
                content: [
                    '1. 优化聊天工具模态框，调整为0.8不透明度',
                    '2. 调整聊天工具按钮布局，改为一行6个按钮',
                    '3. 优化按钮间距，从8px调整为3px，提升界面紧凑度',
                    '4. 改进聊天气泡显示，支持玩家看到自己的聊天气泡',
                    '5. 增加新的表情包系列',
                    '6. 优化聊天工具入口位置，固定在游戏左下角'
                ]
            },
            {
                version: '1.0.6',
                title: '版本 1.0.6 更新公告',
                content: [
                    '1. 新增表情包功能，支持发送和显示表情包',
                    '2. 实现表情包下载和缓存机制，减少网络请求',
                    '3. 添加表情包下载进度条，提升用户体验',
                    '4. 优化聊天工具界面，表情包按钮显示图片预览',
                    '5. 调整常用语和表情包按钮布局，提升界面美观度'
                ]
            },
            {
                version: '1.0.5',
                title: '版本 1.0.5 更新公告',
                content: [
                    '1. 升级左侧伸缩栏的聊天系统，区分房间日志和聊天',
                    '2. 添加常用语和表情功能，点击即可自动发送',
                    '3. 实现聊天气泡功能，在对应玩家位置显示消息',
                    '4. 优化聊天消息存储，确保聊天记录持久化'
                ]
            },
            {
                version: '1.0.4',
                title: '版本 1.0.4 更新公告',
                content: [
                    '1. 新增个人信息修改功能，支持修改昵称和自定义头像',
                    '2. 实现头像缓存机制，减少网络请求',
                    '3. 优化重连玩家的房间信息同步',
                    '4. 改进版本公告系统，显示所有迭代版本的更新内容'
                ]
            },
            {
                version: '1.0.3',
                title: '版本 1.0.3 更新公告',
                content: [
                    '1. 新增重置房间功能，可通过投票重置所有玩家筹码为2000',
                    '2. 优化了iOS Safari上的点击事件处理',
                    '3. 改进了重连机制，确保玩家重连后能立即操作',
                    '4. 调整了投票系统的交互体验',
                    '5. 升级了游戏整体ui精美度'
                ]
            },
            {
                version: '1.0.2',
                title: '版本 1.0.2 更新公告',
                content: [
                    '1. 修复了结束时间显示位置问题，现在只在游戏房间页面显示',
                    '2. 修复了阶段切换消息重复显示的问题',
                    '3. 优化了断线重连机制，提供更宽松的重连时间窗口'
                ]
            },
            {
                version: '1.0.1',
                title: '版本 1.0.1 更新公告',
                content: [
                    '1. 新增房间结束时间设置功能',
                    '2. 优化了加注模态框，添加了预设下注额按钮',
                    '3. 新增弃牌并观战功能',
                    '4. 优化了赠送筹码的弹窗提示',
                    '5. 修复了一些已知问题'
                ]
            }
        ];
    }

    // 初始化游戏
    async init() {
        // 检查本地大小缓存，如果没有的话，添加本地大小缓存
        const savedHandCardSize = localStorage.getItem('handCardSize');
        if (!savedHandCardSize) {
            localStorage.setItem('handCardSize', 70);
            console.log('初始化手牌大小为70px');
        }
        
        // 计算并缓存其他卡片大小
        const handCardSize = parseInt(localStorage.getItem('handCardSize'));
        localStorage.setItem('playerBoxCardSize', handCardSize * 0.6);
        localStorage.setItem('communityCardSize', handCardSize * 0.8);
        
        // 覆盖默认的alert函数
        overrideAlert();
        
        // 加载保存的凭证
        const { savedUsername, savedPassword, rememberMe } = loadSavedCredentials();
        if (savedUsername && savedPassword && rememberMe) {
            const usernameInput = document.getElementById('username-input');
            const passwordInput = document.getElementById('password-input');
            const rememberMeCheckbox = document.getElementById('remember-me');
            
            if (usernameInput) usernameInput.value = savedUsername;
            if (passwordInput) passwordInput.value = savedPassword;
            if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
        }
        
        // 检查版本更新
        checkVersionUpdate(VERSION, this.UPDATE_NOTES, (versions) => {
            uiManager.showUpdateNotice(versions);
        });
        
        // 设置UI
        uiManager.setupSidebar();
        uiManager.setupInfoBar();
        uiManager.setupProfileModal();
        
        // 清理旧数据
        cleanupOldData();
        
        // 加载使用次数
        const { phraseUsage, emojiUsage } = loadUsageData();
        this.phraseUsage = phraseUsage;
        this.emojiUsage = emojiUsage;
        
        // 设置网络事件监听器
        this.setupNetworkListeners();
        
        // 连接到服务器
        networkManager.connect();
    }

    // 设置网络事件监听器
    setupNetworkListeners() {
        networkManager.on('connected', () => {
            console.log('连接成功');
            this.updateConnectionStatus(true);
        });

        networkManager.on('disconnected', () => {
            console.log('连接断开');
            this.updateConnectionStatus(false);
        });

        networkManager.on('message', (data) => {
            console.log('收到消息:', data);
        });

        networkManager.on('loginSuccess', (data) => {
            this.handleLoginSuccess(data);
        });

        networkManager.on('registerSuccess', (data) => {
            this.handleRegisterSuccess(data);
        });

        networkManager.on('roomList', (data) => {
            this.handleRoomList(data);
        });

        networkManager.on('roomCreated', (data) => {
            this.handleRoomCreated(data);
        });

        networkManager.on('roomJoined', (data) => {
            this.handleRoomJoined(data);
        });

        networkManager.on('roomLeft', (data) => {
            this.handleRoomLeft(data);
        });

        networkManager.on('gameState', (data) => {
            this.handleGameState(data);
        });

        networkManager.on('chatMessage', (data) => {
            this.handleChatMessage(data);
        });

        networkManager.on('error', (data) => {
            this.handleError(data);
        });

        networkManager.on('loginConflict', (data) => {
            this.handleLoginConflict(data);
        });

        networkManager.on('kicked', (data) => {
            this.handleKicked(data);
        });

        networkManager.on('roomEnding', (data) => {
            this.handleRoomEnding(data);
        });

        networkManager.on('roomExtended', (data) => {
            this.handleRoomExtended(data);
        });

        networkManager.on('roomEnded', (data) => {
            this.handleRoomEnded(data);
        });

        networkManager.on('playerAction', (data) => {
            this.handlePlayerAction(data);
        });

        networkManager.on('stageChange', (data) => {
            this.handleStageChange(data);
        });

        networkManager.on('gameStart', (data) => {
            this.handleGameStart(data);
        });

        networkManager.on('playerKicked', (data) => {
            this.handlePlayerKicked(data);
        });

        networkManager.on('roomReset', (data) => {
            this.handleRoomReset(data);
        });

        networkManager.on('resetRoomCancelled', (data) => {
            this.handleResetRoomCancelled(data);
        });

        networkManager.on('kickPlayerCancelled', (data) => {
            this.handleKickPlayerCancelled(data);
        });

        networkManager.on('extendVoteUpdate', (data) => {
            this.handleExtendVoteUpdate(data);
        });

        networkManager.on('resetVoteUpdate', (data) => {
            this.handleResetVoteUpdate(data);
        });

        networkManager.on('kickVoteUpdate', (data) => {
            this.handleKickVoteUpdate(data);
        });

        networkManager.on('runItVoteUpdate', (data) => {
            this.handleRunItVoteUpdate(data);
        });

        networkManager.on('userInfo', (data) => {
            this.handleUserInfo(data);
        });
    }

    // 发送消息
    sendMessage(message) {
        networkManager.send(message);
    }

    // 更新连接状态
    updateConnectionStatus(connected) {
        if (this.statusIndicator) {
            this.statusIndicator.className = connected ? 'connected' : '';
        }
        if (this.statusText) {
            this.statusText.textContent = connected ? '已连接' : '未连接';
        }
    }

    // 处理登录成功
    handleLoginSuccess(data) {
        this.userId = data.userId;
        this.playerId = data.playerId;
        this.nickname = data.nickname;
        this.loggedIn = true;
        this.avatarUpdatedAt = data.avatarUpdatedAt;
        this.cardSkins = data.cardSkins || {};
        
        // 更新用户信息显示
        this.updateUserInfoDisplay({ id: data.userId, nickname: data.nickname, avatarUpdatedAt: data.avatarUpdatedAt });
        
        // 隐藏登录模态框
        document.getElementById('auth-modal').style.display = 'none';
        
        // 加载房间列表
        this.sendMessage({ type: 'getRooms' });
    }

    // 处理注册成功
    handleRegisterSuccess(data) {
        this.userId = data.userId;
        this.playerId = data.playerId;
        this.nickname = data.nickname;
        this.loggedIn = true;
        this.avatarUpdatedAt = data.avatarUpdatedAt;
        
        // 更新用户信息显示
        this.updateUserInfoDisplay({ id: data.userId, nickname: data.nickname, avatarUpdatedAt: data.avatarUpdatedAt });
        
        // 隐藏登录模态框
        document.getElementById('auth-modal').style.display = 'none';
        
        // 加载房间列表
        this.sendMessage({ type: 'getRooms' });
    }

    // 处理房间列表
    handleRoomList(data) {
        const roomsContainer = document.getElementById('rooms-container');
        if (roomsContainer) {
            roomsContainer.innerHTML = '';
            data.rooms.forEach(room => {
                const roomCard = document.createElement('div');
                roomCard.className = `room-card ${room.playerCount >= room.maxPlayers ? 'full' : ''}`;
                roomCard.innerHTML = `
                    <h3>${room.name}</h3>
                    <p>玩家: ${room.playerCount}/${room.maxPlayers}</p>
                    <p>状态: ${STAGE_NAMES[room.stage] || room.stage}</p>
                    <button class="join-room-btn" data-room-id="${room.id}">加入</button>
                `;
                roomsContainer.appendChild(roomCard);
            });
            
            // 添加加入房间按钮事件
            document.querySelectorAll('.join-room-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const roomId = parseInt(btn.dataset.roomId);
                    this.sendMessage({ type: 'joinRoom', roomId: roomId });
                });
            });
        }
    }

    // 处理房间创建
    handleRoomCreated(data) {
        this.currentRoom = data.room;
        this.showGameArea();
    }

    // 处理房间加入
    handleRoomJoined(data) {
        this.currentRoom = data.room;
        this.showGameArea();
    }

    // 处理房间离开
    handleRoomLeft(data) {
        this.currentRoom = null;
        this.hideGameArea();
        this.sendMessage({ type: 'getRooms' });
    }

    // 处理游戏状态
    handleGameState(data) {
        this.gameState = data.state;
        // 这里可以添加更新游戏界面的逻辑
    }

    // 处理聊天消息
    handleChatMessage(data) {
        uiManager.addChatMessage(data.message, false, data.sender, data.senderId);
    }

    // 处理错误
    handleError(data) {
        alert(data.message || '未知错误');
    }

    // 处理登录冲突
    handleLoginConflict(data) {
        this.loginConflictUserId = data.userId;
        // 显示登录冲突模态框
        document.getElementById('login-conflict-modal').style.display = 'block';
    }

    // 处理被踢出
    handleKicked(data) {
        this.kicked = true;
        alert(data.message || '您被踢出房间');
        this.currentRoom = null;
        this.hideGameArea();
    }

    // 处理房间即将结束
    handleRoomEnding(data) {
        // 显示延长房间时间模态框
        document.getElementById('extend-room-modal').style.display = 'block';
    }

    // 处理房间延长
    handleRoomExtended(data) {
        alert(data.message);
        // 更新房间结束时间显示
        if (data.endTime) {
            const endTimeText = document.getElementById('end-time-text');
            if (endTimeText) {
                endTimeText.textContent = new Date(data.endTime).toLocaleString();
            }
        }
    }

    // 处理房间结束
    handleRoomEnded(data) {
        alert(data.message);
        this.currentRoom = null;
        this.hideGameArea();
    }

    // 处理玩家操作
    handlePlayerAction(data) {
        uiManager.addChatMessage(`${data.playerName} ${data.action} ${data.amount ? data.amount : ''}`, true);
    }

    // 处理阶段切换
    handleStageChange(data) {
        uiManager.addChatMessage(`游戏进入${data.stage}阶段`, true);
    }

    // 处理游戏开始
    handleGameStart(data) {
        uiManager.addChatMessage('游戏开始！', true);
    }

    // 处理玩家被踢出
    handlePlayerKicked(data) {
        uiManager.addChatMessage(data.message, true);
    }

    // 处理房间重置
    handleRoomReset(data) {
        alert(data.message);
    }

    // 处理重置房间取消
    handleResetRoomCancelled(data) {
        uiManager.addChatMessage(data.message, true);
    }

    // 处理踢出玩家取消
    handleKickPlayerCancelled(data) {
        uiManager.addChatMessage(data.message, true);
    }

    // 处理延长投票更新
    handleExtendVoteUpdate(data) {
        // 更新延长投票进度
        const voteProgress = document.getElementById('extend-vote-progress');
        if (voteProgress) {
            voteProgress.textContent = `${data.yesVotes}/${data.totalPlayers}`;
        }
        // 更新投票列表
        const votesList = document.getElementById('extend-votes-list');
        if (votesList) {
            // 这里可以添加更新投票列表的逻辑
        }
    }

    // 处理重置投票更新
    handleResetVoteUpdate(data) {
        // 更新重置投票进度
        const voteProgress = document.getElementById('reset-vote-progress');
        if (voteProgress) {
            voteProgress.textContent = `${data.yesVotes}/${data.totalPlayers}`;
        }
        // 更新投票列表
        const votesList = document.getElementById('reset-votes-list');
        if (votesList) {
            // 这里可以添加更新投票列表的逻辑
        }
    }

    // 处理踢出投票更新
    handleKickVoteUpdate(data) {
        // 更新踢出投票进度
        const voteProgress = document.getElementById('kick-vote-progress');
        if (voteProgress) {
            voteProgress.textContent = `${data.yesVotes}/${data.totalPlayers}`;
        }
        // 更新投票列表
        const votesList = document.getElementById('kick-votes-list');
        if (votesList) {
            // 这里可以添加更新投票列表的逻辑
        }
    }

    // 处理跑马投票更新
    handleRunItVoteUpdate(data) {
        // 更新跑马投票进度
        const voteProgress = document.getElementById('vote-progress');
        if (voteProgress) {
            voteProgress.textContent = `${data.totalVotes}/${data.requiredVotes}`;
        }
        // 更新投票列表
        const votesList = document.getElementById('votes-list');
        if (votesList) {
            // 这里可以添加更新投票列表的逻辑
        }
    }

    // 处理用户信息
    handleUserInfo(data) {
        this.updateUserInfoDisplay(data);
    }

    // 更新用户信息显示
    updateUserInfoDisplay(user) {
        const userNickname = document.getElementById('user-nickname');
        const userAvatar = document.getElementById('user-avatar');
        const profileNickname = document.getElementById('profile-nickname');
        const profileAvatar = document.getElementById('profile-avatar');
        
        if (userNickname) {
            userNickname.textContent = user.nickname || '未登录';
        }
        
        if (profileNickname) {
            profileNickname.value = user.nickname || '';
        }
        
        // 处理头像显示
        uiManager.updateAvatarDisplay(user.id, user.avatarUpdatedAt, user.nickname, userAvatar, profileAvatar);
        
        this.avatarUpdatedAt = user.avatarUpdatedAt;
    }

    // 显示游戏区域
    showGameArea() {
        document.getElementById('game-area').style.display = 'block';
        document.getElementById('room-management').style.display = 'none';
        document.getElementById('chat-tools-btn').style.display = 'block';
        document.getElementById('room-end-time-display').style.display = 'block';
    }

    // 隐藏游戏区域
    hideGameArea() {
        document.getElementById('game-area').style.display = 'none';
        document.getElementById('room-management').style.display = 'block';
        document.getElementById('chat-tools-btn').style.display = 'none';
        document.getElementById('room-end-time-display').style.display = 'none';
    }

    // 加载用户信息
    loadUserInfo() {
        this.sendMessage({ type: 'getUserInfo' });
    }

    // 保存个人资料
    saveProfile() {
        const nickname = document.getElementById('profile-nickname').value.trim();
        if (nickname) {
            this.sendMessage({
                type: 'updateUserInfo',
                nickname: nickname
            });
        }
        
        // 如果有裁剪后的头像，上传它
        if (this.croppedAvatarBlob) {
            uiManager.uploadAvatar(this.croppedAvatarBlob, this.userId);
            // 上传后清空存储的blob
            this.croppedAvatarBlob = null;
        }
        
        document.getElementById('profile-modal').style.display = 'none';
    }
}

export const gameManager = new GameManager();
