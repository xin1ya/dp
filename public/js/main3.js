// 主客户端文件
import { VERSION, isiOS, customAlert, UPDATE_NOTES, STAGE_NAMES } from './modules/utils/constants.js';
import { StorageManager } from './modules/utils/storage.js';
import { ChatManager } from './modules/chat/chatManager.js';
import { AvatarManager } from './modules/avatar/avatarManager.js';
import { GameManager } from './modules/game/gameManager.js';

// 覆盖默认的alert函数
window.alert = customAlert;

class TexasHoldemClient {
    constructor() {
        this.ws = null;
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
        this.sseConnections = new Map();
        this.clientId = null;
        this.sendUrl = null;
        this.eventSource = null;
        this.heartbeatInterval = null;
        this.pongCheckInterval = null;
        this.lastPongTime = 0;
        this.reconnectAttempts = 0;
        
        // 初始化管理器
        this.storageManager = new StorageManager();
        this.chatManager = new ChatManager();
        this.avatarManager = new AvatarManager();
        this.gameManager = new GameManager();
        
        this.init();
    }

    async init() {
        // 检查本地大小缓存，如果没有的话，添加本地大小缓存
        const savedHandCardSize = this.storageManager.loadCardSize();
        
        this.loadSavedCredentials();
        this.checkVersionUpdate();
        this.setupUI();
        this.setupSidebar();
        this.setupInfoBar();
        this.setupProfileModal();
        // 初始化聊天管理器
        await this.chatManager.init();
        this.connect();
    }
    
    checkVersionUpdate() {
        // 从localStorage获取上次的版本号
        const lastVersion = this.storageManager.loadVersion();
        
        // 如果版本号不同，显示更新公告
        if (lastVersion !== VERSION) {
            // 确定需要显示哪些版本的更新公告
            const versionsToShow = [];
            let foundLastVersion = false;
            
            // 遍历更新公告，从最新版本开始，最多显示3个版本
            for (let i = 0; i < UPDATE_NOTES.length && versionsToShow.length < 3; i++) {
                const note = UPDATE_NOTES[i];
                // 如果找到用户上次使用的版本，停止添加
                if (note.version === lastVersion) {
                    foundLastVersion = true;
                    break;
                }
                // 添加版本到显示列表
                versionsToShow.push(note);
            }
            
            // 显示更新公告
            if (versionsToShow.length > 0) {
                this.showUpdateNotice(versionsToShow);
            }
            
            // 更新localStorage中的版本号
            this.storageManager.saveVersion(VERSION);
        }
    }
    
    showUpdateNotice(versions) {
        // 创建更新公告弹窗
        const updateModal = document.createElement('div');
        updateModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: #333;
            padding: 20px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;
        
        // 构建公告内容
        let contentHtml = '';
        
        // 显示所有需要的版本更新公告
        versions.forEach((update, index) => {
            contentHtml += `<h2 style="color: #00d4aa; margin-top: ${index === 0 ? '0' : '20px'};">${update.title}</h2>`;
            contentHtml += '<ul style="color: white; padding-left: 20px;">';
            update.content.forEach(item => {
                contentHtml += `<li style="margin-bottom: 10px;">${item}</li>`;
            });
            contentHtml += '</ul>';
            
            // 在版本之间添加分隔线
            if (index < versions.length - 1) {
                contentHtml += '<hr style="border: 1px solid rgba(255,255,255,0.2); margin: 20px 0;">';
            }
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '确定';
        closeBtn.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #00d4aa;
            color: black;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
        `;
        closeBtn.onclick = () => {
            document.body.removeChild(updateModal);
        };
        
        modalContent.innerHTML = contentHtml;
        modalContent.appendChild(closeBtn);
        updateModal.appendChild(modalContent);
        document.body.appendChild(updateModal);
    }
    
    loadSavedCredentials() {
        const { savedUsername, savedPassword, rememberMe } = this.storageManager.loadCredentials();
        
        if (savedUsername && savedPassword && rememberMe) {
            const usernameInput = document.getElementById('username-input');
            const passwordInput = document.getElementById('password-input');
            const rememberMeCheckbox = document.getElementById('remember-me');
            
            if (usernameInput) usernameInput.value = savedUsername;
            if (passwordInput) passwordInput.value = savedPassword;
            if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
        }
    }
    
    saveCredentials(username, password, remember) {
        this.storageManager.saveCredentials(username, password, remember);
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (sidebar && sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }
    
    setupInfoBar() {
        const infoBar = document.getElementById('info-bar');
        const infoBarToggle = document.getElementById('info-bar-toggle');
        const messageInput = document.getElementById('message-input');
        const sendMessageBtn = document.getElementById('send-message-btn');
        const chatTab = document.getElementById('chat-tab');
        const logTab = document.getElementById('log-tab');
        const chatMessages = document.getElementById('chat-messages');
        const logMessages = document.getElementById('log-messages');
        
        if (infoBar && infoBarToggle) {
            infoBarToggle.addEventListener('click', () => {
                infoBar.classList.toggle('collapsed');
            });
        }
        
        if (messageInput && sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                this.sendMessageToChat();
            });
            
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessageToChat();
                }
            });
        }
        
        if (chatTab && logTab && chatMessages && logMessages) {
            const chatControls = document.getElementById('chat-controls');
            
            chatTab.addEventListener('click', () => {
                chatTab.classList.add('active');
                chatTab.style.backgroundColor = '#00d4aa';
                chatTab.style.color = 'black';
                logTab.classList.remove('active');
                logTab.style.backgroundColor = '#666';
                logTab.style.color = 'white';
                chatMessages.style.display = 'block';
                logMessages.style.display = 'none';
                if (chatControls) {
                    chatControls.style.display = 'flex';
                }
            });
            
            logTab.addEventListener('click', () => {
                logTab.classList.add('active');
                logTab.style.backgroundColor = '#00d4aa';
                logTab.style.color = 'black';
                chatTab.classList.remove('active');
                chatTab.style.backgroundColor = '#666';
                chatTab.style.color = 'white';
                logMessages.style.display = 'block';
                chatMessages.style.display = 'none';
                if (chatControls) {
                    chatControls.style.display = 'none';
                }
            });
        }
        
        // 聊天工具模态框功能
        const chatToolsBtn = document.getElementById('chat-tools-btn');
        const chatToolsModal = document.getElementById('chat-tools-modal');
        
        if (chatToolsBtn && chatToolsModal) {
            // 打开模态框
            chatToolsBtn.addEventListener('click', () => {
                chatToolsModal.style.display = 'block';
                // 生成常用语和表情包按钮
                this.chatManager.generateEmojiButtons();
                // 确保常用语标签页激活，表情包标签页未激活
                const phrasesTab = document.getElementById('phrases-tab');
                const emojiTab = document.getElementById('emoji-tab');
                const phrasesContent = document.getElementById('common-phrases-container');
                const emojiContent = document.getElementById('emoji-container');
                
                if (phrasesTab && emojiTab && phrasesContent && emojiContent) {
                    phrasesTab.classList.add('active');
                    phrasesTab.style.backgroundColor = '#00d4aa';
                    phrasesTab.style.color = 'black';
                    emojiTab.classList.remove('active');
                    emojiTab.style.backgroundColor = '#666';
                    emojiTab.style.color = 'white';
                    // 确保常用语容器显示，表情包容器隐藏
                    phrasesContent.style.display = 'grid';
                    emojiContent.style.display = 'none';
                    // 确保自定义常用语输入区域显示
                    const customPhraseSection = document.querySelector('#common-phrases-container + div');
                    if (customPhraseSection) {
                        customPhraseSection.style.display = 'block';
                    }
                }
            });
            
            // 关闭模态框
            const closeBtn = chatToolsModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    chatToolsModal.style.display = 'none';
                });
            }
            
            // 点击模态框外部关闭
            window.addEventListener('click', (event) => {
                if (event.target === chatToolsModal) {
                    chatToolsModal.style.display = 'none';
                }
            });
            
            // 标签页切换功能
            const phrasesTab = document.getElementById('phrases-tab');
            const emojiTab = document.getElementById('emoji-tab');
            const phrasesContent = document.getElementById('common-phrases-container');
            const emojiContent = document.getElementById('emoji-container');
            
            if (phrasesTab && emojiTab && phrasesContent && emojiContent) {
                phrasesTab.addEventListener('click', () => {
                    // 激活常用语标签
                    phrasesTab.classList.add('active');
                    phrasesTab.style.backgroundColor = '#00d4aa';
                    phrasesTab.style.color = 'black';
                    // 取消激活表情标签
                    emojiTab.classList.remove('active');
                    emojiTab.style.backgroundColor = '#666';
                    emojiTab.style.color = 'white';
                    // 显示常用语内容，隐藏表情内容
                    phrasesContent.style.display = 'grid';
                    emojiContent.style.display = 'none';
                    // 显示自定义常用语输入区域
                    const customPhraseSection = document.querySelector('#common-phrases-container + div');
                    if (customPhraseSection) {
                        customPhraseSection.style.display = 'block';
                    }
                });
                
                emojiTab.addEventListener('click', () => {
                    // 激活表情标签
                    emojiTab.classList.add('active');
                    emojiTab.style.backgroundColor = '#00d4aa';
                    emojiTab.style.color = 'black';
                    // 取消激活常用语标签
                    phrasesTab.classList.remove('active');
                    phrasesTab.style.backgroundColor = '#666';
                    phrasesTab.style.color = 'white';
                    // 显示表情内容，隐藏常用语内容
                    emojiContent.style.display = 'grid';
                    phrasesContent.style.display = 'none';
                    // 隐藏自定义常用语输入区域
                    const customPhraseSection = document.querySelector('#common-phrases-container + div');
                    if (customPhraseSection) {
                        customPhraseSection.style.display = 'none';
                    }
                });
            }
        }
        
        // 生成常用语按钮
        this.chatManager.generatePhraseButtons();
        
        // 添加自定义常用语按钮点击事件
        const addPhraseBtn = document.getElementById('add-phrase-btn');
        if (addPhraseBtn) {
            addPhraseBtn.addEventListener('click', () => {
                const input = document.getElementById('custom-phrase-input');
                if (input && input.value.trim()) {
                    this.chatManager.addCustomPhrase(input.value.trim());
                    input.value = '';
                }
            });
        }
        
        // 按Enter键添加自定义常用语
        const customPhraseInput = document.getElementById('custom-phrase-input');
        if (customPhraseInput) {
            customPhraseInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && customPhraseInput.value.trim()) {
                    this.chatManager.addCustomPhrase(customPhraseInput.value.trim());
                    customPhraseInput.value = '';
                }
            });
        }
        
        // 表情按钮点击事件
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    messageInput.value = btn.textContent;
                    // 自动发送消息
                    this.sendMessageToChat();
                    // 关闭模态框
                    const chatToolsModal = document.getElementById('chat-tools-modal');
                    if (chatToolsModal) {
                        chatToolsModal.style.display = 'none';
                    }
                }
            });
        });
    }
    
    setupProfileModal() {
        const profileModal = document.getElementById('profile-modal');
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const cancelProfileBtn = document.getElementById('cancel-profile-btn');
        const saveProfileBtn = document.getElementById('save-profile-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        const avatarUploadBtn = document.getElementById('avatar-upload-btn');
        const profileAvatar = document.getElementById('profile-avatar');
        const profileNickname = document.getElementById('profile-nickname');
        const avatarCropModal = document.getElementById('avatar-crop-modal');
        const cancelCropBtn = document.getElementById('cancel-crop-btn');
        const confirmCropBtn = document.getElementById('confirm-crop-btn');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                if (this.loggedIn) {
                    this.loadUserInfo();
                    profileModal.style.display = 'block';
                } else {
                    alert('请先登录');
                }
            });
        }
        
        if (cancelProfileBtn) {
            cancelProfileBtn.addEventListener('click', () => {
                profileModal.style.display = 'none';
            });
        }
        
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }
        
        if (avatarUploadBtn) {
            avatarUploadBtn.addEventListener('click', () => {
                avatarUpload.click();
            });
        }
        
        if (profileAvatar) {
            profileAvatar.addEventListener('click', () => {
                avatarUpload.click();
            });
        }
        
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                this.avatarManager.handleAvatarUpload(e);
            });
        }
        
        if (cancelCropBtn) {
            cancelCropBtn.addEventListener('click', () => {
                avatarCropModal.style.display = 'none';
            });
        }
        
        if (confirmCropBtn) {
            confirmCropBtn.addEventListener('click', () => {
                this.avatarManager.cropAndUploadAvatar();
            });
        }
        
        if (profileModal) {
            window.addEventListener('click', (event) => {
                if (event.target === profileModal) {
                    profileModal.style.display = 'none';
                }
            });
        }
        
        if (avatarCropModal) {
            window.addEventListener('click', (event) => {
                if (event.target === avatarCropModal) {
                    avatarCropModal.style.display = 'none';
                }
            });
        }
    }
    
    loadUserInfo() {
        this.sendMessage({ type: 'getUserInfo' });
    }
    
    saveProfile() {
        const nickname = document.getElementById('profile-nickname').value.trim();
        if (nickname) {
            this.sendMessage({
                type: 'updateUserInfo',
                nickname: nickname
            });
        }
        
        // 如果有裁剪后的头像，上传它
        if (this.avatarManager.croppedAvatarBlob) {
            this.avatarManager.uploadAvatar(this.avatarManager.croppedAvatarBlob, this.userId);
            // 上传后清空存储的blob
            this.avatarManager.croppedAvatarBlob = null;
        }
        
        document.getElementById('profile-modal').style.display = 'none';
    }
    
    updateUserInfoDisplay(user) {
        this.avatarManager.updateUserInfoDisplay(user);
        this.avatarUpdatedAt = user.avatarUpdatedAt;
    }
    
    updateUserAvatarDisplay() {
        const userAvatar = document.getElementById('user-avatar');
        const profileAvatar = document.getElementById('profile-avatar');
        
        // 使用新的头像缓存和更新逻辑
        this.avatarManager.updateAvatarDisplay(this.userId, this.avatarUpdatedAt, this.nickname, userAvatar, profileAvatar);
    }

    setupUI() {
        const createRoomBtn = document.getElementById('create-room-btn');
        const refreshRoomsBtn = document.getElementById('refresh-rooms-btn');
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        const modal = document.getElementById('create-room-modal');
        const closeModal = modal ? modal.querySelector('.close') : null;
        const confirmCreateRoomBtn = document.getElementById('confirm-create-room-btn');
        const cardSizeSlider = document.getElementById('card-size-slider');
        const cardSizeValue = document.getElementById('card-size-value');
        const useRoomSkinCheckbox = document.getElementById('use-room-skin');
        const authModal = document.getElementById('auth-modal');
        const authBtn = document.getElementById('auth-btn');
        const authTitle = document.getElementById('auth-title');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        const nicknameInput = document.getElementById('nickname-input');
        const nicknameGroup = document.getElementById('nickname-group');
        const authSwitch = document.getElementById('auth-switch');
        const switchToRegister = document.getElementById('switch-to-register');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const chipsModal = document.getElementById('chips-modal');
        const chipsCloseBtn = chipsModal ? chipsModal.querySelector('.close') : null;
        const borrowBtn = document.getElementById('borrow-btn');
        const repayBtn = document.getElementById('repay-btn');
        const runItModal = document.getElementById('run-it-modal');
        const runItButtons = document.querySelectorAll('.run-it-btn');
        const raiseModal = document.getElementById('raise-modal');
        const cancelRaiseBtn = document.getElementById('cancel-raise-btn');
        const confirmRaiseBtn = document.getElementById('confirm-raise-btn');
        const foldModal = document.getElementById('fold-modal');
        const cancelFoldBtn = document.getElementById('cancel-fold-btn');
        const confirmFoldBtn = document.getElementById('confirm-fold-btn');
        const allinModal = document.getElementById('allin-modal');
        const cancelAllinBtn = document.getElementById('cancel-allin-btn');
        const confirmAllinBtn = document.getElementById('confirm-allin-btn');
        const callModal = document.getElementById('call-modal');
        const cancelCallBtn = document.getElementById('cancel-call-btn');
        const confirmCallBtn = document.getElementById('confirm-call-btn');
        const loginConflictModal = document.getElementById('login-conflict-modal');
        const cancelLoginBtn = document.getElementById('cancel-login-btn');
        const confirmLoginBtn = document.getElementById('confirm-login-btn');
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenButton();
        });

        if (createRoomBtn && modal) {
            createRoomBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        }

        if (refreshRoomsBtn) {
            refreshRoomsBtn.addEventListener('click', () => {
                this.getRooms();
            });
        }

        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => {
                this.leaveRoom();
            });
        }

        if (closeModal && modal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (modal) {
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        if (confirmCreateRoomBtn && modal) {
            confirmCreateRoomBtn.addEventListener('click', () => {
                const roomNameInput = document.getElementById('room-name-input');
                this.createRoom(roomNameInput.value || undefined);
                modal.style.display = 'none';
                if (roomNameInput) roomNameInput.value = '';
            });
        }

        // 扑克大小设置
        if (cardSizeSlider && cardSizeValue) {
            // 从本地存储加载手牌大小，默认值改为70
            const savedHandCardSize = this.storageManager.loadCardSize();
            cardSizeSlider.value = savedHandCardSize;
            cardSizeValue.textContent = `${savedHandCardSize}px`;

            // 添加滑块变化事件监听器
            cardSizeSlider.addEventListener('input', () => {
                const handSize = cardSizeSlider.value;
                cardSizeValue.textContent = `${handSize}px`;
                // 保存到本地存储
                this.storageManager.saveCardSize(handSize);
                // 更新所有卡片大小
                this.gameManager.updateCardSize(handSize);
            });

            // 初始更新卡片大小
            this.gameManager.updateCardSize(savedHandCardSize);
        }

        // 皮肤设置
        if (useRoomSkinCheckbox) {
            // 从本地存储加载皮肤设置，默认使用房间皮肤
            const savedUseRoomSkin = this.storageManager.loadSkinSetting();
            useRoomSkinCheckbox.checked = savedUseRoomSkin;

            // 添加勾选框变化事件监听器
            useRoomSkinCheckbox.addEventListener('change', () => {
                const useRoomSkin = useRoomSkinCheckbox.checked;
                // 保存到本地存储
                this.storageManager.saveSkinSetting(useRoomSkin);
                // 应用皮肤设置
                this.gameManager.applySkinSetting();
                // 重新渲染游戏状态，应用设置
                if (this.gameState) {
                    this.renderGameState();
                }
            });
        }
        
        // 牌值文字显示设置
        const showCardTextCheckbox = document.getElementById('show-card-text');
        if (showCardTextCheckbox) {
            // 从本地存储加载设置，默认不显示
            const savedShowCardText = this.storageManager.loadCardTextSetting();
            showCardTextCheckbox.checked = savedShowCardText;

            // 添加勾选框变化事件监听器
            showCardTextCheckbox.addEventListener('change', () => {
                const showCardText = showCardTextCheckbox.checked;
                // 保存到本地存储
                this.storageManager.saveCardTextSetting(showCardText);
                // 重新渲染游戏状态，应用设置
                if (this.gameState) {
                    this.renderGameState();
                }
            });
        }

        // 确保在排行榜显示时，设置项仍然能够正常工作
        const resultRankingBtn = document.getElementById('result-ranking-btn');
        if (resultRankingBtn) {
            resultRankingBtn.addEventListener('click', () => {
                // 延迟一下，确保DOM已经更新
                setTimeout(() => {
                    // 重新获取元素，因为它们现在在排行榜部分
                    const cardSizeSlider = document.getElementById('card-size-slider');
                    const cardSizeValue = document.getElementById('card-size-value');
                    const useRoomSkinCheckbox = document.getElementById('use-room-skin');
                    
                    if (cardSizeSlider && cardSizeValue) {
                        // 确保滑块值与本地存储一致
                        const savedCardSize = this.storageManager.loadCardSize();
                        cardSizeSlider.value = savedCardSize;
                        cardSizeValue.textContent = `${savedCardSize}px`;
                    }
                    
                    if (useRoomSkinCheckbox) {
                        // 确保勾选状态与本地存储一致
                        const savedUseRoomSkin = this.storageManager.loadSkinSetting();
                        useRoomSkinCheckbox.checked = savedUseRoomSkin;
                    }
                }, 100);
            });
        }

        const confirmPasswordGroup = document.getElementById('confirm-password-group');
        const confirmPasswordInput = document.getElementById('confirm-password-input');
        const inviteCodeGroup = document.getElementById('invite-code-group');
        const inviteCodeInput = document.getElementById('invite-code-input');

        const rememberMeGroup = document.getElementById('remember-me-group');
        
        const updateAuthMode = () => {
            if (authTitle && authBtn && nicknameGroup && confirmPasswordGroup && inviteCodeGroup && authSwitch && rememberMeGroup) {
                if (this.isRegisterMode) {
                    authTitle.textContent = '注册';
                    authBtn.textContent = '注册';
                    nicknameGroup.style.display = 'block';
                    confirmPasswordGroup.style.display = 'block';
                    inviteCodeGroup.style.display = 'block';
                    rememberMeGroup.style.display = 'none';
                    authSwitch.innerHTML = '已有账号？<a href="#" id="switch-to-register">立即登录</a>';
                } else {
                    authTitle.textContent = '登录';
                    authBtn.textContent = '登录';
                    nicknameGroup.style.display = 'none';
                    confirmPasswordGroup.style.display = 'none';
                    inviteCodeGroup.style.display = 'none';
                    rememberMeGroup.style.display = 'block';
                    authSwitch.innerHTML = '还没有账号？<a href="#" id="switch-to-register">立即注册</a>';
                }
                
                const newSwitchBtn = document.getElementById('switch-to-register');
                if (newSwitchBtn) {
                    newSwitchBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.isRegisterMode = !this.isRegisterMode;
                        updateAuthMode();
                    });
                }
            }
        };

        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.isRegisterMode = !this.isRegisterMode;
                updateAuthMode();
            });
        }

        if (authBtn && usernameInput && passwordInput) {
            authBtn.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                const password = passwordInput.value.trim();
                const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';
                const nickname = nicknameInput ? nicknameInput.value.trim() : '';
                const inviteCode = inviteCodeInput ? inviteCodeInput.value.trim() : '';
                const rememberMeCheckbox = document.getElementById('remember-me');
                const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

                if (!username || !password) {
                    alert('请填写账号和密码');
                    return;
                }

                if (this.isRegisterMode) {
                    if (!nickname) {
                        alert('请填写昵称');
                        return;
                    }
                    if (!inviteCode) {
                        alert('请填写邀请码');
                        return;
                    }
                    if (password !== confirmPassword) {
                        alert('两次输入的密码不一致');
                        return;
                    }
                    this.sendMessage({
                        type: 'register',
                        username: username,
                        password: password,
                        nickname: nickname,
                        inviteCode: inviteCode
                    });
                } else {
                    this.saveCredentials(username, password, rememberMe);
                    this.sendMessage({
                        type: 'login',
                        username: username,
                        password: password
                    });
                }
            });
        }

        if (usernameInput && authBtn) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    authBtn.click();
                }
            });
        }

        if (passwordInput && authBtn) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    authBtn.click();
                }
            });
        }

        if (nicknameInput && authBtn) {
            nicknameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    authBtn.click();
                }
            });
        }

        if (chipsModal) {
            window.addEventListener('click', (event) => {
                if (event.target === chipsModal) {
                    chipsModal.style.display = 'none';
                }
            });
        }

        if (chipsCloseBtn && chipsModal) {
            chipsCloseBtn.addEventListener('click', () => {
                chipsModal.style.display = 'none';
            });
        }

        if (borrowBtn) {
            borrowBtn.addEventListener('click', () => {
                const chipsAmountInput = document.getElementById('chips-amount');
                const amount = chipsAmountInput ? parseInt(chipsAmountInput.value) : 0;
                if (amount > 0) {
                    this.borrowChips(amount);
                }
            });
        }

        if (repayBtn) {
            repayBtn.addEventListener('click', () => {
                const chipsAmountInput = document.getElementById('chips-amount');
                const amount = chipsAmountInput ? parseInt(chipsAmountInput.value) : 0;
                if (amount > 0) {
                    this.repayChips(amount);
                }
            });
        }
        
        const giftBtn = document.getElementById('gift-btn');
        if (giftBtn) {
            giftBtn.addEventListener('click', () => {
                const giftPlayerSelect = document.getElementById('gift-player-select');
                const giftAmountInput = document.getElementById('gift-amount');
                const toPlayerId = giftPlayerSelect ? giftPlayerSelect.value : '';
                const amount = giftAmountInput ? parseInt(giftAmountInput.value) : 0;
                if (toPlayerId && amount > 0) {
                    this.giftChips(toPlayerId, amount);
                } else {
                    alert('请选择玩家并输入赠送金额');
                }
            });
        }

        const showHandBtn = document.getElementById('show-hand-btn');
        const hideHandBtn = document.getElementById('hide-hand-btn');
        
        if (showHandBtn) {
            showHandBtn.addEventListener('click', () => {
                this.chooseShowdown(true);
            });
        }
        
        if (hideHandBtn) {
            hideHandBtn.addEventListener('click', () => {
                this.chooseShowdown(false);
            });
        }

        runItButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const times = parseInt(btn.dataset.times);
                this.voteRunIt(times);
            });
        });
        
        if (raiseModal && cancelRaiseBtn && confirmRaiseBtn) {
            cancelRaiseBtn.addEventListener('click', () => {
                raiseModal.style.display = 'none';
            });
            
            window.addEventListener('click', (event) => {
                if (event.target === raiseModal) {
                    raiseModal.style.display = 'none';
                }
            });
        }
        
        if (foldModal && cancelFoldBtn && confirmFoldBtn) {
            cancelFoldBtn.addEventListener('click', () => {
                foldModal.style.display = 'none';
            });
            
            window.addEventListener('click', (event) => {
                if (event.target === foldModal) {
                    foldModal.style.display = 'none';
                }
            });
        }
        
        if (allinModal && cancelAllinBtn && confirmAllinBtn) {
            cancelAllinBtn.addEventListener('click', () => {
                allinModal.style.display = 'none';
            });
            
            window.addEventListener('click', (event) => {
                if (event.target === allinModal) {
                    allinModal.style.display = 'none';
                }
            });
        }
        
        if (callModal && cancelCallBtn && confirmCallBtn) {
            cancelCallBtn.addEventListener('click', () => {
                callModal.style.display = 'none';
            });
            
            window.addEventListener('click', (event) => {
                if (event.target === callModal) {
                    callModal.style.display = 'none';
                }
            });
        }
        
        if (loginConflictModal && cancelLoginBtn && confirmLoginBtn) {
            cancelLoginBtn.addEventListener('click', () => {
                loginConflictModal.style.display = 'none';
                this.sendMessage({ type: 'confirmLogin', confirm: false });
            });
            
            confirmLoginBtn.addEventListener('click', () => {
                loginConflictModal.style.display = 'none';
                this.sendMessage({ type: 'confirmLogin', confirm: true, userId: this.loginConflictUserId });
            });
            
            window.addEventListener('click', (event) => {
                if (event.target === loginConflictModal) {
                    loginConflictModal.style.display = 'none';
                    this.sendMessage({ type: 'confirmLogin', confirm: false });
                }
            });
        }
    }
    
    showRaiseModal(minRaise) {
        const raiseModal = document.getElementById('raise-modal');
        const raiseMin = document.getElementById('raise-min');
        const raiseModalAmount = document.getElementById('raise-modal-amount');
        const confirmRaiseBtn = document.getElementById('confirm-raise-btn');
        
        if (raiseModal && raiseMin && raiseModalAmount && confirmRaiseBtn) {
            raiseMin.textContent = minRaise;
            raiseModalAmount.value = minRaise;
            raiseModalAmount.min = minRaise;
            raiseModal.style.display = 'block';
            
            // 计算底池金额
            const pot = this.gameState ? this.gameState.pot : 0;
            
            // 预设下注金额按钮
            const presetButtons = document.querySelectorAll('.preset-raise-btn');
            presetButtons.forEach(btn => {
                btn.onclick = () => {
                    let amount = minRaise;
                    const type = btn.dataset.type;
                    
                    switch (type) {
                        case 'min':
                            amount = minRaise;
                            break;
                        case 'half-pot':
                            amount = Math.ceil(pot / 2);
                            break;
                        case 'pot':
                            amount = pot;
                            break;
                        case 'double-pot':
                            amount = pot * 2;
                            break;
                    }
                    
                    // 确保金额不低于最低下注额
                    amount = Math.max(amount, minRaise);
                    raiseModalAmount.value = amount;
                };
            });
            
            confirmRaiseBtn.onclick = () => {
                const amount = parseInt(raiseModalAmount.value);
                if (amount >= minRaise) {
                    this.playerAction('raise', amount);
                    raiseModal.style.display = 'none';
                } else {
                    alert(`加注金额不能低于 ${minRaise}`);
                }
            };
        }
    }
    
    showFoldModal() {
        const foldModal = document.getElementById('fold-modal');
        const confirmFoldBtn = document.getElementById('confirm-fold-btn');
        const foldSpectateBtn = document.getElementById('fold-spectate-btn');
        
        if (foldModal && confirmFoldBtn && foldSpectateBtn) {
            foldModal.style.display = 'block';
            
            confirmFoldBtn.onclick = () => {
                this.playerAction('fold', 0);
                foldModal.style.display = 'none';
            };
            
            foldSpectateBtn.onclick = () => {
                // 先执行弃牌操作
                this.playerAction('fold', 0);
                // 发送消息将玩家设置为观战状态
                this.sendMessage({
                    type: 'setSpectator',
                    isSpectator: true
                });
                // 关闭模态框
                foldModal.style.display = 'none';
            };
        }
    }
    
    showAllinModal() {
        const allinModal = document.getElementById('allin-modal');
        const confirmAllinBtn = document.getElementById('confirm-allin-btn');
        
        if (allinModal && confirmAllinBtn) {
            allinModal.style.display = 'block';
            
            confirmAllinBtn.onclick = () => {
                this.playerAction('allin', 0);
                allinModal.style.display = 'none';
            };
        }
    }
    
    showCallModal(amount) {
        const callModal = document.getElementById('call-modal');
        const callAmountElement = document.getElementById('call-amount');
        const confirmCallBtn = document.getElementById('confirm-call-btn');
        
        if (callModal && callAmountElement && confirmCallBtn) {
            callAmountElement.textContent = amount;
            callModal.style.display = 'block';
            
            confirmCallBtn.onclick = () => {
                this.playerAction('call', amount);
                callModal.style.display = 'none';
            };
        }
    }

    connect() {
        if (isiOS()) {
            // iOS设备使用SSE + HTTP POST
            this.connectWithSSE();
        } else {
            // 其他设备使用WebSocket
            this.connectWithWebSocket();
        }
    }

    connectWithWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.updateStatus('连接中...', false);
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket连接已建立');
                this.updateStatus('已连接', true);
                this.startHeartbeat();
                
                const { savedUsername, savedPassword, rememberMe } = this.storageManager.loadCredentials();
                
                if (savedUsername && savedPassword && rememberMe) {
                    console.log('自动登录中...');
                    this.sendMessage({
                        type: 'login',
                        username: savedUsername,
                        password: savedPassword
                    });
                }
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'pong') {
                        this.lastPongTime = Date.now();
                    } else {
                        this.handleMessage(data);
                    }
                } catch (error) {
                    console.error('解析消息失败:', error);
                }
            };
            
            this.ws.onclose = (event) => {
                console.log('WebSocket连接已关闭:', event.code, event.reason);
                this.updateStatus('连接已断开', false);
                this.stopHeartbeat();
                if (!this.kicked) {
                    setTimeout(() => this.connect(), 3000);
                } else {
                    console.log('账号被顶号，禁止重连');
                    this.updateStatus('账号已在其他设备登录', false);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket错误:', error);
                this.updateStatus('连接错误', false);
            };
        } catch (error) {
            console.error('创建WebSocket连接失败:', error);
            this.updateStatus('连接失败', false);
        }
    }

    connectWithSSE() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        this.clientId = Math.random().toString(36).substring(2, 15); // 生成固定的clientId
        const eventsUrl = `${protocol}//${host}/api/events?clientId=${this.clientId}`;
        const sendUrl = `${protocol}//${host}/api/send`;
        
        this.updateStatus('连接中...', false);
        
        try {
            this.sendUrl = sendUrl;
            this.eventSource = new EventSource(eventsUrl);
            
            this.eventSource.onopen = () => {
                console.log('SSE连接已建立');
                this.updateStatus('已连接', true);
                this.reconnectAttempts = 0; // 重置重连次数
                this.startHeartbeat();
                
                const { savedUsername, savedPassword, rememberMe } = this.storageManager.loadCredentials();
                
                if (savedUsername && savedPassword && rememberMe) {
                    console.log('自动登录中...');
                    this.sendMessage({
                        type: 'login',
                        username: savedUsername,
                        password: savedPassword
                    });
                }
            };
            
            this.eventSource.onmessage = (event) => {
                console.log('收到SSE消息:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    console.log('解析后的数据:', data);
                    if (data.type === 'pong') {
                        this.lastPongTime = Date.now();
                    } else {
                        this.handleMessage(data);
                    }
                } catch (error) {
                    console.error('解析SSE消息失败:', error, '原始消息:', event.data);
                }
            };
            
            this.eventSource.onerror = (error) => {
                console.error('SSE错误:', error);
                this.updateStatus('连接错误', false);
                this.stopHeartbeat();
                if (!this.kicked) {
                    // 指数退避重连
                    this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
                    const delay = Math.min(3000 * Math.pow(2, this.reconnectAttempts - 1), 30000); // 最大30秒
                    console.log(`SSE连接错误，${delay}ms后重连(第${this.reconnectAttempts}次)`);
                    setTimeout(() => this.connect(), delay);
                } else {
                    console.log('账号被顶号，禁止重连');
                    this.updateStatus('账号已在其他设备登录', false);
                }
            };
        } catch (error) {
            console.error('创建SSE连接失败:', error);
            this.updateStatus('连接失败', false);
        }
    }

    startHeartbeat() {
        // 统一心跳机制：定期发送ping消息
        this.heartbeatInterval = setInterval(() => {
            this.sendMessage({ type: 'ping' });
        }, 30000);
        
        this.lastPongTime = Date.now();
        this.pongCheckInterval = setInterval(() => {
            if (Date.now() - this.lastPongTime > 60000) {
                console.log('心跳超时，重新连接');
                if (isiOS()) {
                    // iOS：关闭SSE连接并重新连接
                    if (this.eventSource) {
                        this.eventSource.close();
                    }
                } else {
                    // 其他设备：关闭WebSocket连接
                    if (this.ws) {
                        this.ws.close();
                    }
                }
                this.connect();
            }
        }, 10000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.pongCheckInterval) {
            clearInterval(this.pongCheckInterval);
            this.pongCheckInterval = null;
        }
    }

    updateStatus(text, isConnected) {
        this.statusText.textContent = text;
        if (isConnected) {
            this.statusIndicator.classList.add('connected');
        } else {
            this.statusIndicator.classList.remove('connected');
        }
    }

    sendMessage(data) {
        if (isiOS()) {
            // iOS使用HTTP POST，添加clientId
            if (this.sendUrl) {
                fetch(this.sendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                        clientId: this.clientId // 添加clientId
                    })
                }).then(response => {
                    if (!response.ok) {
                        console.error('发送消息失败:', response.statusText);
                    }
                }).catch(error => {
                    console.error('发送消息失败:', error);
                });
                console.log('发送消息(HTTP POST):', data);
            } else {
                console.error('HTTP POST URL未设置，无法发送消息');
            }
        } else {
            // 其他设备使用WebSocket
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(data));
                console.log('发送消息(WebSocket):', data);
            } else {
                console.error('WebSocket未连接，无法发送消息');
            }
        }
    }

    handleMessage(data) {
        console.log('收到消息:', data);
        switch (data.type) {
            case 'welcome':
                this.playerId = data.playerId;
                console.log('服务器欢迎消息:', data.message);
                this.getRooms();
                
                const { savedUsername, savedPassword, rememberMe } = this.storageManager.loadCredentials();
                
                if (!savedUsername || !savedPassword || !rememberMe) {
                    document.getElementById('auth-modal').style.display = 'block';
                }
                break;
            case 'loginConflict':
                console.log('登录冲突:', data.message);
                this.loginConflictUserId = data.userId;
                document.getElementById('login-conflict-modal').style.display = 'block';
                break;
            case 'loginCancelled':
                console.log('登录已取消:', data.message);
                break;
            case 'kicked':
                console.log('被顶号:', data.message);
                this.kicked = true;
                alert(data.message);
                this.loggedIn = false;
                this.userId = null;
                this.nickname = '';
                document.getElementById('auth-modal').style.display = 'block';
                break;
            case 'registerSuccess':
            case 'loginSuccess':
                console.log('登录/注册成功:', data);
                this.userId = data.userId;
                if (data.playerId) {
                    this.playerId = data.playerId;
                }
                this.nickname = data.nickname;
                this.avatarUpdatedAt = data.avatarUpdatedAt;
                
                // 检查本地大小缓存，如果没有的话，添加本地大小缓存
                this.storageManager.loadCardSize();
                
                // 存储表情包名录
                if (data.emojiCollections) {
                    this.chatManager.setEmojiCollections(data.emojiCollections);
                }
                // 存储扑克牌皮肤信息
                if (data.cardSkins) {
                    this.cardSkins = data.cardSkins;
                    console.log('获取到扑克牌皮肤:', data.cardSkins);
                    // 更新创建房间模态框中的皮肤选择
                    this.gameManager.updateCardSkinSelect(data.cardSkins);
                }
                this.loggedIn = true;
                console.log('登录状态已设置为true');
                
                // iOS设备：更新clientId为userId，以便后续请求使用正确的ID
                if (isiOS() && data.userId) {
                    console.log('更新clientId:', this.clientId, '->', data.userId);
                    this.clientId = data.userId;
                }
                
                // 确保DOM元素存在
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    authModal.style.display = 'none';
                    console.log('关闭登录模态框');
                } else {
                    console.error('auth-modal元素未找到');
                }
                
                const loginConflictModal = document.getElementById('login-conflict-modal');
                if (loginConflictModal) {
                    loginConflictModal.style.display = 'none';
                }
                
                // 登录成功后检查版本更新
                this.checkVersionUpdate();
                // 更新头像显示
                this.updateUserAvatarDisplay();
                this.getRooms();
                // 加载用户信息
                this.loadUserInfo();
                
                // 登录成功后，如果有游戏状态，重新渲染
                if (this.gameState) {
                    console.log('登录成功后重新渲染游戏状态，使用新的playerId:', this.playerId);
                    this.renderGameState();
                }
                
                console.log('登录成功处理完成');
                break;
                
            case 'userInfo':
                this.updateUserInfoDisplay(data.user);
                break;
                
            case 'userInfoUpdated':
                if (data.success) {
                    alert('个人资料更新成功');
                    this.loadUserInfo();
                }
                break;
            case 'roomList':
                this.renderRoomList(data.rooms);
                break;
            case 'roomCreated':
                this.currentRoom = data.room;
                this.showCurrentRoom();
                this.showGameArea();
                this.updateEndTimeDisplay();
                break;
            case 'roomJoined':
                this.currentRoom = data.room;
                this.showCurrentRoom();
                this.showGameArea();
                this.updateEndTimeDisplay();
                break;
            case 'roomLeft':
                this.currentRoom = null;
                this.gameState = null;
                this.hideCurrentRoom();
                this.hideGameArea();
                break;
            case 'gameState':
                console.log('收到gameState消息:', data.state);
                this.gameState = data.state;
                // 更新当前扑克牌皮肤
                if (data.state.cardSkin) {
                    this.currentCardSkin = data.state.cardSkin;
                    this.gameManager.currentCardSkin = data.state.cardSkin;
                    console.log('更新扑克牌皮肤:', this.currentCardSkin);
                    // 下载扑克牌皮肤（如果需要）
                    this.gameManager.downloadCardSkin(this.currentCardSkin).catch(error => {
                        console.error('下载扑克牌皮肤失败:', error);
                    });
                }
                if (this.currentRoom) {
                    console.log('在房间中，始终显示游戏区域');
                    this.showGameArea();
                }
                this.renderGameState();
                break;
            case 'chatMessage':
                if (data.isSystem) {
                    this.chatManager.addChatMessage(data.message, true);
                } else {
                    this.chatManager.addChatMessage(data.message, false, data.sender, data.senderId);
                }
                break;
            case 'gameStart':
                this.chatManager.addChatMessage('游戏开始！', true);
                break;
            case 'stageChange':
                this.chatManager.addChatMessage(`阶段切换: ${data.stage}`, true);
                break;
            case 'playerAction':
                this.chatManager.addChatMessage(`${data.playerName} ${data.action} ${data.amount ? `($${data.amount})` : ''}`, true);
                break;
            case 'borrowSuccess':
            case 'repaySuccess':
                this.updateChipsModal();
                break;
            case 'giftSuccess':
                // 显示赠送成功弹窗
                alert(`赠送成功！\n你向 ${data.receiverName} 赠送了 ${data.amount} 筹码\n你的筹码: ${data.fromChips}\n${data.receiverName} 的筹码: ${data.toChips}`);
                break;
            case 'giftReceived':
                // 显示收到筹码弹窗
                alert(`收到筹码！\n${data.senderName} 向你赠送了 ${data.amount} 筹码\n你的筹码: ${data.toChips}`);
                break;
            case 'roomEnding':
                // 显示房间即将结束的投票弹窗
                this.showExtendRoomModal();
                break;
            case 'roomExtended':
                // 显示房间延长成功的弹窗
                alert(data.message);
                // 更新结束时间显示
                if (data.endTime) {
                    this.currentRoom.endTime = data.endTime;
                    this.updateEndTimeDisplay();
                }
                // 关闭延长时间投票模态框
                const extendModal = document.getElementById('extend-room-modal');
                if (extendModal) {
                    extendModal.style.display = 'none';
                }
                break;
            case 'roomEnded':
                // 显示房间结束的弹窗
                alert(data.message);
                // 关闭延长时间投票模态框
                const extendModal2 = document.getElementById('extend-room-modal');
                if (extendModal2) {
                    extendModal2.style.display = 'none';
                }
                // 关闭重置房间投票模态框
                const resetModal = document.getElementById('reset-room-modal');
                if (resetModal) {
                    resetModal.style.display = 'none';
                }
                break;
            case 'extendVoteUpdate':
                // 更新投票进度
                this.updateExtendVoteProgress(data);
                break;
            case 'resetRoomRequest':
                // 显示重置房间投票弹窗
                this.showResetRoomModal(data.requester);
                break;
            case 'resetVoteUpdate':
                // 更新重置房间投票进度
                this.updateResetVoteProgress(data);
                break;
            case 'roomReset':
                // 显示重置房间成功的弹窗
                alert(data.message);
                // 关闭重置房间投票模态框
                const resetModal2 = document.getElementById('reset-room-modal');
                if (resetModal2) {
                    resetModal2.style.display = 'none';
                }
                break;
            case 'resetRoomCancelled':
                // 显示重置房间取消的弹窗
                alert(data.message);
                // 关闭重置房间投票模态框
                const resetModal3 = document.getElementById('reset-room-modal');
                if (resetModal3) {
                    resetModal3.style.display = 'none';
                }
                break;
            case 'kickPlayerRequest':
                // 显示踢出玩家投票模态框
                this.showKickPlayerModal(data.requester, data.targetPlayerName);
                break;
            case 'kickVoteUpdate':
                // 更新踢出投票进度
                this.updateKickVoteProgress(data);
                break;
            case 'playerKicked':
                // 显示玩家被踢出的消息
                alert(data.message);
                // 关闭踢出投票模态框
                const kickModal = document.getElementById('kick-vote-modal');
                if (kickModal) {
                    kickModal.style.display = 'none';
                }
                break;
            case 'kickPlayerCancelled':
                // 显示踢出投票取消的消息
                alert(data.message);
                // 关闭踢出投票模态框
                const kickModal2 = document.getElementById('kick-vote-modal');
                if (kickModal2) {
                    kickModal2.style.display = 'none';
                }
                break;
            case 'error':
                alert(data.message);
                break;
            default:
                console.log('未知消息类型:', data.type);
        }
    }

    getRooms() {
        console.log('获取房间列表，登录状态:', this.loggedIn);
        this.sendMessage({ type: 'getRooms' });
    }

    createRoom(name) {
        const durationInput = document.getElementById('room-duration');
        const duration = durationInput ? parseInt(durationInput.value) : 5;
        
        // 获取选择的扑克牌皮肤
        const cardSkinSelect = document.getElementById('card-skin-select');
        const cardSkin = cardSkinSelect ? cardSkinSelect.value : 'default';
        
        // 计算结束时间：当前时间 + 输入的小时数
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + duration);
        
        // 格式化为ISO字符串，后端会处理
        const endTimeString = endTime.toISOString();
        
        this.sendMessage({ type: 'createRoom', name: name, endTime: endTimeString, cardSkin: cardSkin });
    }

    joinRoom(roomId) {
        this.sendMessage({ type: 'joinRoom', roomId: roomId });
    }

    leaveRoom() {
        this.sendMessage({ type: 'leaveRoom' });
    }
    
    requestResetRoom() {
        this.sendMessage({ type: 'requestResetRoom' });
    }

    toggleReady(ready) {
        // 检查房间是否已结束
        const isRoomEnded = this.currentRoom && this.currentRoom.isEnding && this.currentRoom.endTime && Date.now() >= this.currentRoom.endTime;
        if (isRoomEnded && ready) {
            alert('房间已结束，无法进行准备');
            return;
        }
        this.sendMessage({ type: 'toggleReady', ready: ready });
    }

    startGame() {
        this.sendMessage({ type: 'startGame' });
    }

    playerAction(action, amount = 0) {
        this.sendMessage({ type: 'playerAction', action: action, amount: amount });
    }

    chooseShowdown(showHand) {
        this.sendMessage({ type: 'chooseShowdown', showHand: showHand });
        document.getElementById('showdown-modal').style.display = 'none';
    }

    borrowChips(amount) {
        this.sendMessage({ type: 'borrowChips', amount: amount });
    }

    repayChips(amount) {
        this.sendMessage({ type: 'repayChips', amount: amount });
    }
    
    giftChips(toPlayerId, amount) {
        this.sendMessage({ type: 'giftChips', toPlayerId: toPlayerId, amount: amount });
    }

    updateChipsModal() {
        this.gameManager.updateChipsModal(this.gameState, this.playerId);
    }

    voteRunIt(times) {
        this.sendMessage({ type: 'voteRunIt', times: times });
    }

    showExtendRoomModal() {
        const extendModal = document.getElementById('extend-room-modal');
        const extendVoteProgress = document.getElementById('extend-vote-progress');
        const extendVotesList = document.getElementById('extend-votes-list');
        const myExtendVoteText = document.getElementById('my-extend-vote-text');
        
        if (extendModal && extendVoteProgress && extendVotesList && myExtendVoteText) {
            // 初始化投票进度
            extendVoteProgress.textContent = '0/0';
            extendVotesList.innerHTML = '';
            myExtendVoteText.textContent = '';
            
            extendModal.style.display = 'block';
            
            // 处理投票按钮点击
            document.querySelectorAll('.extend-btn').forEach(btn => {
                btn.onclick = () => {
                    const action = btn.dataset.action;
                    if (action === 'yes') {
                        this.sendMessage({ type: 'voteExtendRoom' });
                    } else {
                        this.sendMessage({ type: 'rejectExtendRoom' });
                    }
                    // 移除立即关闭逻辑，等待投票结果
                };
            });
        }
    }

    showResetRoomModal(requester) {
        const resetModal = document.getElementById('reset-room-modal');
        const resetRequester = document.getElementById('reset-requester');
        const resetVoteProgress = document.getElementById('reset-vote-progress');
        const resetVotesList = document.getElementById('reset-votes-list');
        const myResetVoteText = document.getElementById('my-reset-vote-text');
        
        if (resetModal && resetRequester && resetVoteProgress && resetVotesList && myResetVoteText) {
            // 初始化投票进度
            resetRequester.textContent = requester;
            resetVoteProgress.textContent = '0/0';
            resetVotesList.innerHTML = '';
            myResetVoteText.textContent = '';
            
            resetModal.style.display = 'block';
            
            // 处理投票按钮点击
            document.querySelectorAll('.reset-btn').forEach(btn => {
                btn.onclick = () => {
                    const action = btn.dataset.action;
                    if (action === 'yes') {
                        this.sendMessage({ type: 'voteResetRoom' });
                    } else {
                        this.sendMessage({ type: 'rejectResetRoom' });
                    }
                    // 移除立即关闭逻辑，等待投票结果
                };
            });
        }
    }

    updateResetVoteProgress(data) {
        const resetVoteProgress = document.getElementById('reset-vote-progress');
        const resetVotesList = document.getElementById('reset-votes-list');
        
        if (resetVoteProgress && resetVotesList) {
            resetVoteProgress.textContent = `${data.yesVotes + data.noVotes}/${data.totalPlayers}`;
            
            let votesHtml = '';
            votesHtml += `<p style="color: green;">同意: ${data.yesVotes}</p>`;
            votesHtml += `<p style="color: red;">不同意: ${data.noVotes}</p>`;
            votesHtml += `<p style="color: blue;">需要: ${data.requiredVotes} 票</p>`;
            
            resetVotesList.innerHTML = votesHtml;
        }
    }

    showKickPlayerModal(requester, targetPlayerName) {
        const kickModal = document.getElementById('kick-vote-modal');
        const kickRequester = document.getElementById('kick-requester');
        const kickTargetName = document.getElementById('kick-target-name');
        const kickVoteProgress = document.getElementById('kick-vote-progress');
        const kickVotesList = document.getElementById('kick-votes-list');
        const myKickVoteText = document.getElementById('my-kick-vote-text');
        
        if (kickModal && kickRequester && kickTargetName && kickVoteProgress && kickVotesList && myKickVoteText) {
            // 初始化投票进度
            kickRequester.textContent = requester;
            kickTargetName.textContent = targetPlayerName;
            kickVoteProgress.textContent = '0/0';
            kickVotesList.innerHTML = '';
            myKickVoteText.textContent = '';
            
            kickModal.style.display = 'block';
        }
    }

    updateKickVoteProgress(data) {
        const kickVoteProgress = document.getElementById('kick-vote-progress');
        const kickVotesList = document.getElementById('kick-votes-list');
        
        if (kickVoteProgress && kickVotesList) {
            kickVoteProgress.textContent = `${data.yesVotes + data.noVotes}/${data.totalPlayers}`;
            
            let votesHtml = '';
            votesHtml += `<p style="color: green;">同意: ${data.yesVotes}</p>`;
            votesHtml += `<p style="color: red;">不同意: ${data.noVotes}</p>`;
            votesHtml += `<p style="color: blue;">需要: ${data.requiredVotes} 票</p>`;
            
            kickVotesList.innerHTML = votesHtml;
        }
    }

    updateEndTimeDisplay() {
        const endTimeDisplay = document.getElementById('room-end-time-display');
        const endTimeText = document.getElementById('end-time-text');
        
        if (endTimeDisplay && endTimeText) {
            if (this.currentRoom && this.currentRoom.endTime) {
                const endTime = new Date(this.currentRoom.endTime);
                // 不显示年份，格式为：月/日 时:分:秒
                const month = endTime.getMonth() + 1;
                const day = endTime.getDate();
                const hours = endTime.getHours().toString().padStart(2, '0');
                const minutes = endTime.getMinutes().toString().padStart(2, '0');
                const seconds = endTime.getSeconds().toString().padStart(2, '0');
                endTimeText.textContent = `${month}/${day} ${hours}:${minutes}:${seconds}`;
                endTimeDisplay.style.display = 'block';
            } else {
                endTimeDisplay.style.display = 'none';
            }
        }
    }

    sendMessageToChat() {
        const messageInput = document.getElementById('message-input');
        if (messageInput && messageInput.value.trim()) {
            this.sendMessage({
                type: 'chat',
                message: messageInput.value.trim()
            });
            messageInput.value = '';
        }
    }

    showCurrentRoom() {
        const currentRoomElement = document.getElementById('current-room');
        const roomInfoElement = document.getElementById('room-info');
        if (currentRoomElement && roomInfoElement && this.currentRoom) {
            roomInfoElement.innerHTML = `<p>房间名称: ${this.currentRoom.name}</p><p>房间ID: ${this.currentRoom.id}</p>`;
            currentRoomElement.style.display = 'block';
        }
    }

    hideCurrentRoom() {
        const currentRoomElement = document.getElementById('current-room');
        if (currentRoomElement) {
            currentRoomElement.style.display = 'none';
        }
    }

    showGameArea() {
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.style.display = 'block';
        }
        // 显示聊天工具按钮
        const chatToolsBtn = document.getElementById('chat-tools-btn');
        if (chatToolsBtn) {
            chatToolsBtn.style.display = 'block';
        }
    }

    hideGameArea() {
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.style.display = 'none';
        }
        // 隐藏聊天工具按钮
        const chatToolsBtn = document.getElementById('chat-tools-btn');
        if (chatToolsBtn) {
            chatToolsBtn.style.display = 'none';
        }
    }

    renderRoomList(rooms) {
        const roomsContainer = document.getElementById('rooms-container');
        if (roomsContainer) {
            if (rooms.length === 0) {
                roomsContainer.innerHTML = '<p>暂无房间</p>';
                return;
            }

            let roomsHtml = '';
            rooms.forEach(room => {
                const endTime = room.endTime ? new Date(room.endTime) : null;
                const timeLeft = endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 0;
                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                const seconds = timeLeft % 60;
                const timeLeftStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                roomsHtml += `
                    <div class="room-item">
                        <h3>${room.name}</h3>
                        <p>房间ID: ${room.id}</p>
                        <p>玩家: ${room.players.length}/9</p>
                        <p>剩余时间: ${timeLeftStr}</p>
                        <button class="join-room-btn" data-room-id="${room.id}">加入</button>
                    </div>
                `;
            });

            roomsContainer.innerHTML = roomsHtml;

            // 添加加入房间按钮的点击事件
            document.querySelectorAll('.join-room-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const roomId = btn.dataset.roomId;
                    this.joinRoom(roomId);
                });
            });
        }
    }

    renderGameState() {
        this.gameManager.renderGameState(this.gameState, this.playerId, this.loggedIn);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`全屏错误: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    updateFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            if (document.fullscreenElement) {
                fullscreenBtn.textContent = '退出全屏';
            } else {
                fullscreenBtn.textContent = '全屏';
            }
        }
    }
}

// 初始化游戏客户端
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TexasHoldemClient();
    });
} else {
    new TexasHoldemClient();
}