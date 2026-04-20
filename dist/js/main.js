// 版本号
const VERSION = '1.1.3';

// 检测iOS设备
function isiOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// 自定义alert函数，替代浏览器默认的alert弹窗
function customAlert(message) {
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');
    
    if (alertModal && alertMessage && alertOkBtn) {
        alertMessage.textContent = message;
        alertModal.style.display = 'block';
        
        // 点击确定按钮关闭模态框
        alertOkBtn.onclick = function() {
            alertModal.style.display = 'none';
        };
        
        // 点击模态框外部关闭
        alertModal.onclick = function(event) {
            if (event.target === alertModal) {
                alertModal.style.display = 'none';
            }
        };
    }
}

// 覆盖默认的alert函数
window.alert = customAlert;

// 更新公告
const UPDATE_NOTES = [
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

const STAGE_NAMES = {
    'ready': '准备中',
    'preflop': '盲注阶段',
    'flop': '翻牌',
    'turn': '转牌',
    'river': '河牌',
    'result': '比牌结果'
};

const AVATAR_COLORS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

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
        this.init();
    }

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
        
        this.loadSavedCredentials();
        this.checkVersionUpdate();
        this.setupUI();
        this.setupSidebar();
        this.setupInfoBar();
        this.setupProfileModal();
        // 初始化IndexedDB
        await this.initIndexedDB().catch(error => {
            console.error('IndexedDB初始化失败:', error);
        });
        // 清理旧数据
        this.cleanupOldData();
        this.connect();
    }
    
    checkVersionUpdate() {
        // 从localStorage获取上次的版本号
        const lastVersion = localStorage.getItem('texasHoldem_version');
        
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
            localStorage.setItem('texasHoldem_version', VERSION);
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
        const savedUsername = localStorage.getItem('texasHoldem_username');
        const savedPassword = localStorage.getItem('texasHoldem_password');
        const rememberMe = localStorage.getItem('texasHoldem_rememberMe') === 'true';
        
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
        if (remember) {
            localStorage.setItem('texasHoldem_username', username);
            localStorage.setItem('texasHoldem_password', password);
            localStorage.setItem('texasHoldem_rememberMe', 'true');
        } else {
            localStorage.removeItem('texasHoldem_username');
            localStorage.removeItem('texasHoldem_password');
            localStorage.removeItem('texasHoldem_rememberMe');
        }
    }
    
    // 初始化 IndexedDB
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            try {
                if (!window.indexedDB) {
                    reject('浏览器不支持 IndexedDB');
                    return;
                }
                
                const request = indexedDB.open('TexasHoldemDB', 3); // 版本号增加到3
                
                request.onerror = () => {
                    console.error('IndexedDB 打开失败');
                    reject('IndexedDB 初始化失败');
                };
                
                request.onsuccess = () => {
                    console.log('IndexedDB 初始化成功');
                    resolve(request.result);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    // 创建头像存储
                    if (!db.objectStoreNames.contains('avatars')) {
                        db.createObjectStore('avatars', { keyPath: 'userId' });
                    }
                    // 创建表情包存储
                    if (!db.objectStoreNames.contains('emojis')) {
                        db.createObjectStore('emojis', { keyPath: 'key' });
                    }
                    // 创建扑克牌皮肤存储
                    if (!db.objectStoreNames.contains('cardSkins')) {
                        db.createObjectStore('cardSkins', { keyPath: 'key' });
                    }
                };
            } catch (error) {
                console.error('IndexedDB 初始化异常:', error);
                reject('IndexedDB 初始化失败');
            }
        });
    }
    
    // 清理旧数据
    cleanupOldData() {
        // 清理 localStorage 中的旧头像数据
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('avatar_') || key.startsWith('emoji_'))) {
                localStorage.removeItem(key);
                console.log('清理旧数据:', key);
            }
        }
        
        // 清理 IndexedDB 中的使用次数缓存
        this.clearIndexedDBUsageData();
    }
    
    // 清理 IndexedDB 中的使用次数缓存
    async clearIndexedDBUsageData() {
        try {
            const db = await this.initIndexedDB();
            // 检查是否存在 usage 存储
            if (db.objectStoreNames.contains('usage')) {
                const transaction = db.transaction('usage', 'readwrite');
                const store = transaction.objectStore('usage');
                await store.clear();
                console.log('清理 IndexedDB 中的使用次数缓存成功');
            }
        } catch (error) {
            console.error('清理 IndexedDB 中的使用次数缓存失败:', error);
        }
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
        const commonPhrasesBtn = document.getElementById('common-phrases-btn');
        const emojiBtn = document.getElementById('emoji-btn');
        const commonPhrases = document.getElementById('common-phrases');
        const emojiPanel = document.getElementById('emoji-panel');
        
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
                this.generateEmojiButtons();
                // 确保常用语标签页激活，表情包标签页未激活
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
        
        // 加载常用语
        this.loadCommonPhrases().then(() => {
            // 生成常用语按钮
            this.generatePhraseButtons();
        });
        
        // 添加自定义常用语按钮点击事件
        const addPhraseBtn = document.getElementById('add-phrase-btn');
        if (addPhraseBtn) {
            addPhraseBtn.addEventListener('click', () => {
                const input = document.getElementById('custom-phrase-input');
                if (input && input.value.trim()) {
                    this.addCustomPhrase(input.value.trim());
                    input.value = '';
                }
            });
        }
        
        // 按Enter键添加自定义常用语
        const customPhraseInput = document.getElementById('custom-phrase-input');
        if (customPhraseInput) {
            customPhraseInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && customPhraseInput.value.trim()) {
                    this.addCustomPhrase(customPhraseInput.value.trim());
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
                this.handleAvatarUpload(e);
            });
        }
        
        if (cancelCropBtn) {
            cancelCropBtn.addEventListener('click', () => {
                avatarCropModal.style.display = 'none';
            });
        }
        
        if (confirmCropBtn) {
            confirmCropBtn.addEventListener('click', () => {
                this.cropAndUploadAvatar();
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
    
    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const cropImage = document.getElementById('crop-image');
                if (cropImage) {
                    cropImage.src = event.target.result;
                    this.tempAvatarFile = file;
                    document.getElementById('avatar-crop-modal').style.display = 'block';
                    this.addCropBox();
                    // 重置文件输入，以便可以再次选择同一文件
                    e.target.value = '';
                }
            };
            reader.readAsDataURL(file);
        }
    }
    
    cropAndUploadAvatar() {
        // 使用裁剪框的位置和大小进行裁剪
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const cropImage = document.getElementById('crop-image');
        const cropBox = document.getElementById('crop-box');
        
        // 设置画布尺寸为200x200
        canvas.width = 200;
        canvas.height = 200;
        
        if (cropBox) {
            // 获取裁剪框的位置和大小（相对于图片容器）
            const cropSize = parseInt(document.getElementById('crop-size').value) || 200;
            const cropLeft = parseInt(document.getElementById('crop-left').value) || 0;
            const cropTop = parseInt(document.getElementById('crop-top').value) || 0;
            
            // 计算相对于图片的裁剪位置（考虑图片的实际大小）
            const scaleX = cropImage.naturalWidth / cropImage.offsetWidth;
            const scaleY = cropImage.naturalHeight / cropImage.offsetHeight;
            
            const x = cropLeft * scaleX;
            const y = cropTop * scaleY;
            const width = cropSize * scaleX;
            const height = cropSize * scaleY;
            
            // 绘制裁剪后的图像
            ctx.drawImage(cropImage, x, y, width, height, 0, 0, 200, 200);
        } else {
            // 如果没有裁剪框，使用居中裁剪
            const size = Math.min(cropImage.naturalWidth, cropImage.naturalHeight);
            const x = (cropImage.naturalWidth - size) / 2;
            const y = (cropImage.naturalHeight - size) / 2;
            ctx.drawImage(cropImage, x, y, size, size, 0, 0, 200, 200);
        }
        
        // 转换为Blob并存储，等待保存按钮点击时上传
        canvas.toBlob((blob) => {
            if (blob) {
                this.croppedAvatarBlob = blob;
                console.log('裁剪成功，Blob大小:', blob.size);
                // 预览裁剪结果
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) {
                    const url = URL.createObjectURL(blob);
                    profileAvatar.style.background = 'none';
                    profileAvatar.style.backgroundImage = `url(${url})`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.style.backgroundPosition = 'center';
                    profileAvatar.textContent = '';
                }
                alert('裁剪成功，请点击保存按钮完成上传');
            } else {
                console.error('图片转换失败');
                alert('图片转换失败，请重试');
            }
            // 无论成功失败，都关闭模态框
            document.getElementById('avatar-crop-modal').style.display = 'none';
        }, 'image/png');
    }
    
    addCropBox() {
        const cropContainer = document.querySelector('#avatar-crop-modal .modal-content');
        const cropImage = document.getElementById('crop-image');
        const cropSizeInput = document.getElementById('crop-size');
        const cropLeftInput = document.getElementById('crop-left');
        const cropTopInput = document.getElementById('crop-top');
        
        // 移除已有的裁剪框
        const existingCropBox = document.getElementById('crop-box');
        if (existingCropBox) {
            existingCropBox.remove();
        }
        
        // 创建裁剪框
        const cropBox = document.createElement('div');
        cropBox.id = 'crop-box';
        cropBox.style.cssText = `
            position: absolute;
            border: 2px solid #00d4aa;
            background-color: rgba(0, 212, 170, 0.2);
            width: 200px;
            height: 200px;
            z-index: 10;
        `;
        
        // 计算初始位置
        setTimeout(() => {
            const imgRect = cropImage.getBoundingClientRect();
            const containerRect = cropContainer.getBoundingClientRect();
            
            const boxSize = Math.min(200, imgRect.width * 0.8, imgRect.height * 0.8);
            // 相对于图片左上角的坐标
            const relativeLeft = (imgRect.width - boxSize) / 2;
            const relativeTop = (imgRect.height - boxSize) / 2;
            // 相对于容器的坐标
            const absoluteLeft = imgRect.left - containerRect.left + relativeLeft;
            const absoluteTop = imgRect.top - containerRect.top + relativeTop;
            
            cropBox.style.width = `${boxSize}px`;
            cropBox.style.height = `${boxSize}px`;
            cropBox.style.left = `${absoluteLeft}px`;
            cropBox.style.top = `${absoluteTop}px`;
            
            // 更新输入框的值（使用相对于图片左上角的坐标）
            cropSizeInput.value = boxSize;
            cropLeftInput.value = Math.round(relativeLeft);
            cropTopInput.value = Math.round(relativeTop);
        }, 100);
        
        // 添加输入框事件监听器
        const updateCropBox = () => {
            const cropImage = document.getElementById('crop-image');
            const imgRect = cropImage.getBoundingClientRect();
            const containerRect = cropContainer.getBoundingClientRect();
            
            let size = parseInt(cropSizeInput.value) || 200;
            let relativeLeft = parseInt(cropLeftInput.value) || 0;
            let relativeTop = parseInt(cropTopInput.value) || 0;
            
            // 限制大小范围
            size = Math.max(50, Math.min(size, Math.min(imgRect.width, imgRect.height)));
            // 限制位置范围（相对于图片左上角）
            relativeLeft = Math.max(0, Math.min(relativeLeft, imgRect.width - size));
            relativeTop = Math.max(0, Math.min(relativeTop, imgRect.height - size));
            
            // 计算相对于容器的坐标
            const absoluteLeft = imgRect.left - containerRect.left + relativeLeft;
            const absoluteTop = imgRect.top - containerRect.top + relativeTop;
            
            // 更新裁剪框
            cropBox.style.width = `${size}px`;
            cropBox.style.height = `${size}px`;
            cropBox.style.left = `${absoluteLeft}px`;
            cropBox.style.top = `${absoluteTop}px`;
            
            // 更新输入框值（使用相对于图片左上角的坐标）
            cropSizeInput.value = size;
            cropLeftInput.value = relativeLeft;
            cropTopInput.value = relativeTop;
        };
        
        cropSizeInput.addEventListener('input', updateCropBox);
        cropLeftInput.addEventListener('input', updateCropBox);
        cropTopInput.addEventListener('input', updateCropBox);
        
        cropContainer.style.position = 'relative';
        cropContainer.appendChild(cropBox);
    }
    

    
    uploadAvatar(blob) {
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.png');
        
        fetch(`/upload-avatar?userId=${this.userId}`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.avatar = data.avatar;
                // 重新加载用户信息，获取最新的 avatarUpdatedAt
                this.loadUserInfo();
                alert('头像上传成功');
            } else {
                alert('头像上传失败');
            }
        })
        .catch(error => {
            console.error('上传失败:', error);
            alert('上传失败，请重试');
        });
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
        if (this.croppedAvatarBlob) {
            this.uploadAvatar(this.croppedAvatarBlob);
            // 上传后清空存储的blob
            this.croppedAvatarBlob = null;
        }
        
        document.getElementById('profile-modal').style.display = 'none';
    }
    
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
        this.updateAvatarDisplay(user.id, user.avatarUpdatedAt, user.nickname, userAvatar, profileAvatar);
        
        this.avatarUpdatedAt = user.avatarUpdatedAt;
    }
    
    async updateAvatarDisplay(userId, avatarUpdatedAt, nickname, ...avatarElements) {
        // 从 IndexedDB 获取头像
        const indexedDBAvatar = await this.getAvatarFromIndexedDB(userId);
        
        // 检查是否需要更新头像
        if (avatarUpdatedAt) {
            if (!indexedDBAvatar || indexedDBAvatar.updatedAt < avatarUpdatedAt) {
                // 需要从服务器获取头像
                this.fetchAvatar(userId, avatarUpdatedAt, nickname, avatarElements);
            } else {
                // 使用缓存的头像
                this.displayAvatar(indexedDBAvatar.avatar, nickname, ...avatarElements);
            }
        } else {
            // 没有自定义头像，使用默认文字头像
            this.displayDefaultAvatar(userId, nickname, ...avatarElements);
        }
    }
    
    // 清除头像旧资源
    clearAvatarResources(...avatarElements) {
        avatarElements.forEach(element => {
            if (element) {
                // 清除背景图片，释放内存
                element.style.backgroundImage = 'none';
                // 清除文本内容
                element.textContent = '';
            }
        });
    }
    
    fetchAvatar(userId, avatarUpdatedAt, nickname, avatarElements, callback) {
        // 从服务器获取头像
        fetch(`/avatars/${userId}.png?t=${avatarUpdatedAt}`)
            .then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error('头像不存在');
                }
            })
            .then(blob => {
                // 将 blob 转换为 base64 字符串进行缓存
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Avatar = reader.result;
                    // 存储到 IndexedDB
                    this.storeAvatarInIndexedDB(userId, base64Avatar, avatarUpdatedAt);
                    // 显示头像
                    this.displayAvatar(base64Avatar, nickname, ...avatarElements);
                    // 调用回调
                    if (callback) {
                        callback({ avatar: base64Avatar, updatedAt: avatarUpdatedAt });
                    }
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('获取头像失败:', error);
                // 使用默认头像
                this.displayDefaultAvatar(userId, nickname, ...avatarElements);
                // 调用回调
                if (callback) {
                    callback(null);
                }
            });
    }
    
    displayAvatar(avatarUrl, nickname, ...avatarElements) {
        avatarElements.forEach(element => {
            if (element) {
                element.style.background = 'none';
                element.style.backgroundImage = `url(${avatarUrl})`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                element.textContent = '';
            }
        });
    }
    
    displayDefaultAvatar(userId, nickname, ...avatarElements) {
        const avatarColor = this.getAvatarColor(userId);
        const avatarInitial = this.getAvatarInitial(nickname);
        
        avatarElements.forEach(element => {
            if (element) {
                element.style.background = avatarColor;
                element.style.backgroundImage = 'none';
                element.textContent = avatarInitial;
            }
        });
    }
    
    // 存储头像到 IndexedDB
    async storeAvatarInIndexedDB(userId, avatar, updatedAt) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('avatars', 'readwrite');
            const store = transaction.objectStore('avatars');
            await store.put({ userId, avatar, updatedAt });
            return true;
        } catch (error) {
            console.error('存储头像到 IndexedDB 失败:', error);
            return false;
        }
    }
    
    // 从 IndexedDB 获取头像
    async getAvatarFromIndexedDB(userId) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('avatars', 'readonly');
            const store = transaction.objectStore('avatars');
            const request = store.get(userId);
            
            return new Promise((resolve) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });
        } catch (error) {
            console.error('从 IndexedDB 获取头像失败:', error);
            return null;
        }
    }
    
    updateUserAvatarDisplay() {
        const userAvatar = document.getElementById('user-avatar');
        const profileAvatar = document.getElementById('profile-avatar');
        
        // 使用新的头像缓存和更新逻辑
        this.updateAvatarDisplay(this.userId, this.avatarUpdatedAt, this.nickname, userAvatar, profileAvatar);
    }
    
    // 加载使用次数
    loadUsageData() {
        try {
            // 从 localStorage 加载常用语使用次数
            const cachedPhraseUsage = localStorage.getItem('phraseUsage');
            this.phraseUsage = cachedPhraseUsage ? JSON.parse(cachedPhraseUsage) : {};
            
            // 从 localStorage 加载表情包使用次数
            const cachedEmojiUsage = localStorage.getItem('emojiUsage');
            this.emojiUsage = cachedEmojiUsage ? JSON.parse(cachedEmojiUsage) : {};
            
            console.log('从 localStorage 加载使用次数成功');
        } catch (error) {
            console.error('加载使用次数失败:', error);
            this.phraseUsage = {};
            this.emojiUsage = {};
        }
    }
    
    // 保存使用次数
    saveUsageData() {
        try {
            // 保存常用语使用次数到 localStorage
            localStorage.setItem('phraseUsage', JSON.stringify(this.phraseUsage));
            
            // 保存表情包使用次数到 localStorage
            localStorage.setItem('emojiUsage', JSON.stringify(this.emojiUsage));
            
            console.log('保存使用次数到 localStorage 成功');
        } catch (error) {
            console.error('保存使用次数失败:', error);
        }
    }
    
    sendMessageToChat() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (message) {
            this.sendMessage({
                type: 'chatMessage',
                message: message
            });
            messageInput.value = '';
        }
    }
    
    async addChatMessage(message, isSystem = false, sender = '', senderId = '') {
        if (isSystem) {
            const logMessages = document.getElementById('log-messages');
            if (logMessages) {
                const messageElement = document.createElement('p');
                messageElement.className = 'system-message';
                messageElement.textContent = message;
                logMessages.appendChild(messageElement);
                logMessages.scrollTop = logMessages.scrollHeight;
            }
        } else {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                const messageElement = document.createElement('p');
                messageElement.className = 'player-message';
                // 解析消息中的表情包
                const parsedMessage = await this.parseMessageWithEmojis(message);
                messageElement.innerHTML = `<span class="sender">${sender}:</span> ${parsedMessage}`;
                chatMessages.appendChild(messageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // 显示聊天气泡
            if (senderId) {
                this.showChatBubble(senderId, message);
            }
        }
    }
    
    async showChatBubble(playerId, message) {
        const playerBox = document.querySelector(`.player-box[data-player-id="${playerId}"]`) || 
                        Array.from(document.querySelectorAll('.player-box')).find(box => {
                            const avatarId = box.querySelector('.player-avatar')?.id;
                            return avatarId && avatarId.includes(playerId);
                        });
        
        if (playerBox) {
            // 移除已有的气泡
            const existingBubble = document.querySelector(`.chat-bubble[data-player-id="${playerId}"]`);
            if (existingBubble) {
                existingBubble.remove();
            }
            
            // 获取playerBox的位置和大小
            const rect = playerBox.getBoundingClientRect();
            
            // 计算气泡宽度为playerbox宽度的1.5倍
            let bubbleWidth = rect.width * 1.5;
            // 限制最大宽度为屏幕宽度的80%
            bubbleWidth = Math.min(bubbleWidth, window.innerWidth * 0.8);
            
            // 计算气泡位置，确保不超出屏幕范围
            let bubbleLeft = rect.left + rect.width / 2;
            const bubbleHalfWidth = bubbleWidth / 2;
            
            // 检查左边界
            if (bubbleLeft - bubbleHalfWidth < 10) {
                bubbleLeft = bubbleHalfWidth + 10;
            }
            // 检查右边界
            if (bubbleLeft + bubbleHalfWidth > window.innerWidth - 10) {
                bubbleLeft = window.innerWidth - bubbleHalfWidth - 10;
            }
            
            // 创建新气泡
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';
            bubble.dataset.playerId = playerId;
            
            // 解析消息中的表情包
            bubble.innerHTML = await this.parseMessageWithEmojis(message, rect.width * 1.2);
            
            // 计算文字大小，根据消息长度自适应
            let fontSize = 12;
            if (message.length > 20) {
                fontSize = 10;
            } else if (message.length > 10) {
                fontSize = 11;
            }
            
            bubble.style.cssText = `
                position: fixed;
                top: ${rect.bottom + 10}px;
                left: ${bubbleLeft}px;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: ${fontSize}px;
                max-width: ${bubbleWidth}px;
                word-wrap: break-word;
                z-index: 10;
                animation: bubble-up 0.3s ease-out forwards;
            `;
            
            // 添加气泡动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes bubble-up {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.body.appendChild(style);
            
            // 将气泡添加到body中
            document.body.appendChild(bubble);
            
            // 4秒后移除气泡
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.style.animation = 'bubble-up 0.3s ease-in reverse forwards';
                    setTimeout(() => {
                        bubble.remove();
                    }, 300);
                }
            }, 4000);
        }
    }
    
    // 下载表情包
    async downloadEmojis() {
        try {
            console.log('开始下载表情包');
            if (!this.emojiCollections) {
                const cachedCollections = localStorage.getItem('emojiCollections');
                if (cachedCollections) {
                    this.emojiCollections = JSON.parse(cachedCollections);
                } else {
                    console.error('表情包名录不存在');
                    return;
                }
            }
            
            // 计算需要下载的表情包总数
            const collections = this.emojiCollections.collections;
            let totalCount = 0;
            let currentCount = 0;
            const emojisToDownload = [];
            
            // 缓存检查结果，避免重复检查
            const emojiCacheStatus = new Map();
            
            for (const [collection, count] of Object.entries(collections)) {
                for (let i = 1; i <= count; i++) {
                    const emojiKey = `${collection}_${i}`;
                    
                    // 先检查缓存状态
                    if (!emojiCacheStatus.has(emojiKey)) {
                        try {
                            // 只检查IndexedDB中是否存在
                            const inIndexedDB = await this.getEmojiFromIndexedDB(emojiKey);
                            emojiCacheStatus.set(emojiKey, !!inIndexedDB);
                        } catch (error) {
                            console.error('检查表情包缓存失败:', emojiKey, error);
                            // 出错时假设不存在，避免阻止下载
                            emojiCacheStatus.set(emojiKey, false);
                        }
                    }
                    
                    if (!emojiCacheStatus.get(emojiKey)) {
                        totalCount++;
                        emojisToDownload.push({ collection, index: i });
                    }
                }
            }
            
            console.log(`需要下载的表情包数量: ${totalCount}`);
            
            if (totalCount > 0) {
                // 显示下载进度条
                this.showEmojiDownloadProgress();
            }
            
            // 开始下载表情包
            for (const emoji of emojisToDownload) {
                currentCount++;
                this.downloadEmoji(emoji.collection, emoji.index, totalCount, currentCount);
            }
        } catch (error) {
            console.error('下载表情包失败:', error);
        }
    }
    
    // 下载扑克牌皮肤
    async downloadCardSkin(skinId) {
        try {
            console.log(`开始下载扑克牌皮肤: ${skinId}`);
            
            // 默认皮肤不需要下载
            if (skinId === 'default') {
                console.log('使用默认皮肤，不需要下载');
                return;
            }
            
            // 检查皮肤是否已存在
            const skinExists = await this.getCardSkinFromIndexedDB(skinId);
            if (skinExists) {
                console.log(`扑克牌皮肤 ${skinId} 已存在，不需要下载`);
                return;
            }
            
            // 显示下载进度
            this.showCardSkinDownloadProgress();
            
            // 下载扑克牌皮肤文件
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            let totalCards = suits.length * ranks.length;
            let downloadedCards = 0;
            
            // 尝试的文件格式
            const extensions = ['gif', 'png', 'jpg', 'webp'];
            
            // 下载所有卡片
            for (const suit of suits) {
                for (const rank of ranks) {
                    const cardKey = `${skinId}_${suit}_${rank}`;
                    
                    // 尝试不同的文件格式
                    let downloaded = false;
                    for (const ext of extensions) {
                        // 尝试带空格和不带空格的文件名
                        const cardUrl1 = `/card-skins/${skinId}/cards/${suit}_${rank}.${ext}`;
                        const cardUrl2 = `/card-skins/${skinId}/cards/${suit}_ ${rank}.${ext}`;
                        
                        try {
                            // 先尝试不带空格的URL
                            const response = await fetch(cardUrl1);
                            if (response.ok) {
                                const blob = await response.blob();
                                const reader = new FileReader();
                                
                                reader.onloadend = async () => {
                                    const base64Card = reader.result;
                                    // 存储卡片到IndexedDB
                                    await this.storeCardSkinToIndexedDB(cardKey, base64Card);
                                    
                                    // 更新下载进度
                                    downloadedCards++;
                                    const progress = Math.round((downloadedCards / totalCards) * 100);
                                    this.updateCardSkinDownloadProgress(progress);
                                };
                                
                                reader.readAsDataURL(blob);
                                downloaded = true;
                                break;
                            } else {
                                // 尝试带空格的URL
                                const response2 = await fetch(cardUrl2);
                                if (response2.ok) {
                                    const blob = await response2.blob();
                                    const reader = new FileReader();
                                    
                                    reader.onloadend = async () => {
                                        const base64Card = reader.result;
                                        // 存储卡片到IndexedDB
                                        await this.storeCardSkinToIndexedDB(cardKey, base64Card);
                                        
                                        // 更新下载进度
                                        downloadedCards++;
                                        const progress = Math.round((downloadedCards / totalCards) * 100);
                                        this.updateCardSkinDownloadProgress(progress);
                                    };
                                    
                                    reader.readAsDataURL(blob);
                                    downloaded = true;
                                    break;
                                }
                            }
                        } catch (error) {
                            // 继续尝试下一个格式
                        }
                    }
                    
                    if (!downloaded) {
                        console.error(`下载卡片 ${cardKey} 失败: 所有格式都尝试过`);
                        // 继续下载其他卡片
                        downloadedCards++;
                        const progress = Math.round((downloadedCards / totalCards) * 100);
                        this.updateCardSkinDownloadProgress(progress);
                    }
                }
            }
            
            console.log(`扑克牌皮肤 ${skinId} 下载完成`);
        } catch (error) {
            console.error('下载扑克牌皮肤失败:', error);
        }
    }
    
    // 显示表情包下载进度条
    showEmojiDownloadProgress() {
        // 检查是否已存在进度条
        let progressContainer = document.getElementById('emoji-download-progress');
        if (!progressContainer) {
            // 创建进度条容器
            progressContainer = document.createElement('div');
            progressContainer.id = 'emoji-download-progress';
            progressContainer.style.position = 'fixed';
            progressContainer.style.top = '20px';
            progressContainer.style.left = '50%';
            progressContainer.style.transform = 'translateX(-50%)';
            progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            progressContainer.style.color = 'white';
            progressContainer.style.padding = '10px 20px';
            progressContainer.style.borderRadius = '5px';
            progressContainer.style.zIndex = '10000';
            progressContainer.style.display = 'flex';
            progressContainer.style.flexDirection = 'column';
            progressContainer.style.alignItems = 'center';
            progressContainer.style.minWidth = '200px';
            
            // 添加标题
            const title = document.createElement('div');
            title.textContent = '正在下载表情包...';
            title.style.marginBottom = '10px';
            progressContainer.appendChild(title);
            
            // 添加进度条
            const progressBar = document.createElement('div');
            progressBar.id = 'emoji-progress-bar';
            progressBar.style.width = '100%';
            progressBar.style.height = '20px';
            progressBar.style.backgroundColor = '#444';
            progressBar.style.borderRadius = '10px';
            progressBar.style.overflow = 'hidden';
            
            // 添加进度条填充
            const progressFill = document.createElement('div');
            progressFill.id = 'emoji-progress-fill';
            progressFill.style.width = '0%';
            progressFill.style.height = '100%';
            progressFill.style.backgroundColor = '#00d4aa';
            progressFill.style.transition = 'width 0.3s ease';
            progressBar.appendChild(progressFill);
            
            progressContainer.appendChild(progressBar);
            
            // 添加进度文本
            const progressText = document.createElement('div');
            progressText.id = 'emoji-progress-text';
            progressText.textContent = '0%';
            progressText.style.marginTop = '10px';
            progressText.style.fontSize = '14px';
            progressContainer.appendChild(progressText);
            
            document.body.appendChild(progressContainer);
        }
    }
    
    // 更新表情包下载进度
    updateEmojiDownloadProgress(progress) {
        const progressFill = document.getElementById('emoji-progress-fill');
        const progressText = document.getElementById('emoji-progress-text');
        const progressContainer = document.getElementById('emoji-download-progress');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // 下载完成后移除进度条
            if (progress === 100 && progressContainer) {
                setTimeout(() => {
                    if (progressContainer.parentNode) {
                        progressContainer.parentNode.removeChild(progressContainer);
                    }
                }, 1000);
            }
        }
    }
    
    // 下载单个表情包
    downloadEmoji(collection, index, totalCount, currentCount) {
        const emojiKey = `${collection}_${index}`;
        // 获取实际的目录名称
        let actualCollection = collection;
        // 获取显示名称（用于生成文件名）
        let displayCollection = collection;
        
        if (this.emojiCollections.collectionMap) {
            // 检查collection是否是目录名称
            let isDirectoryName = false;
            for (const [key, value] of Object.entries(this.emojiCollections.collectionMap)) {
                if (value === collection) {
                    // collection是目录名称，获取对应的显示名称
                    displayCollection = key;
                    isDirectoryName = true;
                    break;
                } else if (key === collection) {
                    // collection是显示名称，获取对应的目录名称
                    actualCollection = value;
                    isDirectoryName = false;
                    break;
                }
            }
            // 如果没有找到映射，使用collection作为默认值
            if (!isDirectoryName) {
                actualCollection = collection;
            }
        }
        
        // 尝试不同的文件命名格式
        const fileNames = [
            `#${displayCollection}${index}.gif` // 格式: #BC1.gif
        ];
        
        let currentFormatIndex = 0;
        
        const tryFormat = () => {
            if (currentFormatIndex >= fileNames.length) {
                console.error('所有格式都尝试失败，下载表情包失败:', collection, index);
                
                // 即使失败也更新进度
                if (totalCount > 0) {
                    const progress = Math.round((currentCount / totalCount) * 100);
                    this.updateEmojiDownloadProgress(progress);
                }
                return;
            }
            
            const fileName = fileNames[currentFormatIndex];
            const encodedFileName = encodeURIComponent(fileName);
            const emojiUrl = `/emojis/${actualCollection}/images/${encodedFileName}`;
            
            fetch(emojiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Not found');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Emoji = reader.result;
                        // 使用IndexedDB存储表情包
                        this.storeEmojiToIndexedDB(emojiKey, base64Emoji).catch(error => {
                            console.error('存储表情包到IndexedDB失败:', error);
                        });
                        
                        // 更新下载进度
                        if (totalCount > 0) {
                            const progress = Math.round((currentCount / totalCount) * 100);
                            this.updateEmojiDownloadProgress(progress);
                        }
                        
                        // 下载完成后更新表情包按钮
                        this.generateEmojiButtons();
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(error => {
                    console.error('下载表情包失败:', collection, index, fileName, error);
                    currentFormatIndex++;
                    tryFormat();
                });
        };
        
        tryFormat();
    }
    

    
    // 存储表情包到IndexedDB
    async storeEmojiToIndexedDB(emojiKey, base64Emoji) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('emojis', 'readwrite');
            const store = transaction.objectStore('emojis');
            await store.put({ key: emojiKey, data: base64Emoji, timestamp: Date.now() });
            return true;
        } catch (error) {
            console.error('存储表情包到 IndexedDB 失败:', error);
            return false;
        }
    }
    
    // 从 IndexedDB 获取表情包
    async getEmojiFromIndexedDB(emojiKey) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('emojis', 'readonly');
            const store = transaction.objectStore('emojis');
            const request = store.get(emojiKey);
            
            return new Promise((resolve) => {
                request.onsuccess = () => {
                    resolve(request.result ? request.result.data : null);
                };
                request.onerror = () => {
                    resolve(null);
                };
            });
        } catch (error) {
            console.error('从 IndexedDB 获取表情包失败:', error);
            return null;
        }
    }
    
    // 存储扑克牌皮肤到 IndexedDB
    async storeCardSkinToIndexedDB(cardKey, base64Card) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('cardSkins', 'readwrite');
            const store = transaction.objectStore('cardSkins');
            await store.put({ key: cardKey, data: base64Card, timestamp: Date.now() });
            return true;
        } catch (error) {
            console.error('存储扑克牌皮肤到 IndexedDB 失败:', error);
            return false;
        }
    }
    
    // 从 IndexedDB 获取扑克牌皮肤
    async getCardSkinFromIndexedDB(skinId) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('cardSkins', 'readonly');
            const store = transaction.objectStore('cardSkins');
            
            // 检查是否存在该皮肤的任何卡片
            const request = store.openCursor();
            
            return new Promise((resolve) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (cursor.key.startsWith(skinId)) {
                            resolve(true);
                        } else {
                            cursor.continue();
                        }
                    } else {
                        resolve(false);
                    }
                };
                request.onerror = () => {
                    resolve(false);
                };
            });
        } catch (error) {
            console.error('从 IndexedDB 获取扑克牌皮肤失败:', error);
            return false;
        }
    }
    
    // 从 IndexedDB 获取特定卡片
    async getCardFromIndexedDB(cardKey) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('cardSkins', 'readonly');
            const store = transaction.objectStore('cardSkins');
            const request = store.get(cardKey);
            
            return new Promise((resolve) => {
                request.onsuccess = () => {
                    resolve(request.result ? request.result.data : null);
                };
                request.onerror = () => {
                    resolve(null);
                };
            });
        } catch (error) {
            console.error('从 IndexedDB 获取卡片失败:', error);
            return null;
        }
    }
    
    // 显示扑克牌皮肤下载进度条
    showCardSkinDownloadProgress() {
        // 检查是否已存在进度条
        let progressContainer = document.getElementById('card-skin-download-progress');
        if (!progressContainer) {
            // 创建进度条容器
            progressContainer = document.createElement('div');
            progressContainer.id = 'card-skin-download-progress';
            progressContainer.style.position = 'fixed';
            progressContainer.style.top = '20px';
            progressContainer.style.left = '50%';
            progressContainer.style.transform = 'translateX(-50%)';
            progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            progressContainer.style.color = 'white';
            progressContainer.style.padding = '10px 20px';
            progressContainer.style.borderRadius = '5px';
            progressContainer.style.zIndex = '1000';
            progressContainer.innerHTML = '<div style="font-size: 14px; margin-bottom: 5px;">下载扑克牌皮肤中...</div><div style="width: 200px; height: 20px; background-color: #444;"><div id="card-skin-progress-bar" style="height: 100%; background-color: #00d4aa; width: 0%;"></div></div><div id="card-skin-progress-text" style="font-size: 12px; margin-top: 5px;">0%</div>';
            document.body.appendChild(progressContainer);
        }
    }
    
    // 更新扑克牌皮肤下载进度
    updateCardSkinDownloadProgress(progress) {
        const progressBar = document.getElementById('card-skin-progress-bar');
        const progressText = document.getElementById('card-skin-progress-text');
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // 下载完成后移除进度条
            if (progress === 100) {
                setTimeout(() => {
                    const progressContainer = document.getElementById('card-skin-download-progress');
                    if (progressContainer) {
                        progressContainer.remove();
                    }
                }, 1000);
            }
        }
    }
    
    // 解析消息中的表情包
    async parseMessageWithEmojis(message, maxWidth = null) {
        const matches = message.match(/#([A-Za-z]+)(\d+)/g) || [];
        let parsedMessage = message;
        
        for (const match of matches) {
            const parts = match.match(/#([A-Za-z]+)(\d+)/);
            if (parts) {
                const collection = parts[1];
                const index = parts[2];
                // 获取实际的collection名称
                const actualCollection = this.emojiCollections && this.emojiCollections.collectionMap ? this.emojiCollections.collectionMap[collection] : collection;
                const emojiKey = `${actualCollection}_${index}`;
                
                try {
                    // 只从IndexedDB获取表情包
                    const cachedEmoji = await this.getEmojiFromIndexedDB(emojiKey);
                    
                    if (cachedEmoji) {
                        let widthStyle = '';
                        if (maxWidth) {
                            widthStyle = `max-width: ${maxWidth}px;`;
                        } else {
                            widthStyle = 'max-width: 40%;';
                        }
                        parsedMessage = parsedMessage.replace(match, `<img src="${cachedEmoji}" style="${widthStyle} height: auto; vertical-align: middle; margin: 0 2px;">`);
                    }
                } catch (error) {
                    console.error('解析表情包失败:', emojiKey, error);
                }
            }
        }
        return parsedMessage;
    }
    
    // 加载常用语
    async loadCommonPhrases() {
        // 默认常用语
        const defaultPhrases = [
            "请和纪律做朋友。",
            "别急，最尊重牌型的一次。",
            "别跟我谈概率，我只信节奏。",
            "跟不跟？给你三秒，别浪费时间。",
            "跟注是给你面子，弃牌是给你活路。",
            "河牌？我早已看穿。",
            "加注不是为了赢，是让你难受。",
            "你确定要跟我拼运气？",
            "你在思考的时候，我已经知道你啥牌了。",
            "你这思考时间，比你牌还长。",
            "你这下注，像在给我发工资。",
            "弃吧，给彼此留条活路。",
            "劝你弃牌，是给你留最后体面。",
            "随便玩玩，没想到你这么配合。",
            "我这牌，你接不住。",
            "赢你不需要好牌，需要你看不懂我。",
            "运气而已，别往心里去。",
            "桌里有鱼，闭眼都赢。"
        ];
        
        // 从本地存储加载常用语
        const cachedPhrases = localStorage.getItem('commonPhrases');
        if (cachedPhrases) {
            this.commonPhrases = JSON.parse(cachedPhrases);
        } else {
            // 初始化默认常用语
            this.commonPhrases = defaultPhrases;
            localStorage.setItem('commonPhrases', JSON.stringify(this.commonPhrases));
        }
        
        // 加载使用次数
        await this.loadUsageData();
    }
    
    // 生成常用语按钮
    generatePhraseButtons() {
        const phrasesContainer = document.getElementById('common-phrases-container');
        if (!phrasesContainer) return;
        
        // 清空现有按钮
        phrasesContainer.innerHTML = '';
        
        // 按使用次数排序常用语
        const sortedPhrases = [...this.commonPhrases].sort((a, b) => {
            const usageA = this.phraseUsage[a] || 0;
            const usageB = this.phraseUsage[b] || 0;
            return usageB - usageA;
        });
        
        // 默认常用语列表
        const defaultPhrases = [
            "请和纪律做朋友。",
            "别急，最尊重牌型的一次。",
            "别跟我谈概率，我只信节奏。",
            "跟不跟？给你三秒，别浪费时间。",
            "跟注是给你面子，弃牌是给你活路。",
            "河牌？我早已看穿。",
            "加注不是为了赢，是让你难受。",
            "你确定要跟我拼运气？",
            "你在思考的时候，我已经知道你啥牌了。",
            "你这思考时间，比你牌还长。",
            "你这下注，像在给我发工资。",
            "弃吧，给彼此留条活路。",
            "劝你弃牌，是给你留最后体面。",
            "随便玩玩，没想到你这么配合。",
            "我这牌，你接不住。",
            "赢你不需要好牌，需要你看不懂我。",
            "运气而已，别往心里去。",
            "桌里有鱼，闭眼都赢。"
        ];
        
        // 生成按钮
        sortedPhrases.forEach(phrase => {
            const phraseBtn = document.createElement('button');
            phraseBtn.className = 'common-phrase-btn';
            phraseBtn.style.padding = '2px';
            phraseBtn.style.color = 'white';
            phraseBtn.style.border = 'none';
            phraseBtn.style.borderRadius = '5px';
            phraseBtn.style.cursor = 'pointer';
            phraseBtn.style.fontSize = '12px';
            phraseBtn.style.textAlign = 'center';
            phraseBtn.style.position = 'relative';
            phraseBtn.textContent = phrase;
            
            // 区分自定义常用语和预设常用语
            const isDefault = defaultPhrases.includes(phrase);
            if (isDefault) {
                // 预设常用语样式
                phraseBtn.style.backgroundColor = '#444';
                phraseBtn.style.border = '1px solid #666';
            } else {
                // 自定义常用语样式
                phraseBtn.style.backgroundColor = '#444';
                phraseBtn.style.border = '2px solid #00d4aa';
            }
            
            // 只有自定义常用语显示删除按钮
            if (!isDefault) {
                const deleteBtn = document.createElement('span');
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '0';
                deleteBtn.style.right = '0';
                deleteBtn.style.fontSize = '12px';
                deleteBtn.style.color = '#ff6b6b';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
                deleteBtn.style.borderRadius = '0 5px 0 5px';
                deleteBtn.style.padding = '0 3px';
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeCustomPhrase(phrase);
                });
                phraseBtn.appendChild(deleteBtn);
            }
            
            // 添加点击事件
            phraseBtn.addEventListener('click', () => {
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    messageInput.value = phrase;
                    // 更新使用次数
                    this.updatePhraseUsage(phrase);
                    // 重新生成按钮以更新排序
                    this.generatePhraseButtons();
                    // 自动发送消息
                    this.sendMessageToChat();
                    // 关闭模态框
                    const chatToolsModal = document.getElementById('chat-tools-modal');
                    if (chatToolsModal) {
                        chatToolsModal.style.display = 'none';
                    }
                }
            });
            
            phrasesContainer.appendChild(phraseBtn);
        });
    }
    
    // 添加自定义常用语
    addCustomPhrase(phrase) {
        // 检查是否已存在
        if (!this.commonPhrases.includes(phrase)) {
            this.commonPhrases.push(phrase);
            localStorage.setItem('commonPhrases', JSON.stringify(this.commonPhrases));
            this.generatePhraseButtons();
        }
    }
    
    // 删除自定义常用语
    removeCustomPhrase(phrase) {
        // 保留默认常用语，只删除自定义的
        const defaultPhrases = [
            "请和纪律做朋友。",
            "别急，最尊重牌型的一次。",
            "别跟我谈概率，我只信节奏。",
            "跟不跟？给你三秒，别浪费时间。",
            "跟注是给你面子，弃牌是给你活路。",
            "河牌？我早已看穿。",
            "加注不是为了赢，是让你难受。",
            "你确定要跟我拼运气？",
            "你在思考的时候，我已经知道你啥牌了。",
            "你这思考时间，比你牌还长。",
            "你这下注，像在给我发工资。",
            "弃吧，给彼此留条活路。",
            "劝你弃牌，是给你留最后体面。",
            "随便玩玩，没想到你这么配合。",
            "我这牌，你接不住。",
            "赢你不需要好牌，需要你看不懂我。",
            "运气而已，别往心里去。",
            "桌里有鱼，闭眼都赢。"
        ];
        
        if (!defaultPhrases.includes(phrase)) {
            this.commonPhrases = this.commonPhrases.filter(p => p !== phrase);
            localStorage.setItem('commonPhrases', JSON.stringify(this.commonPhrases));
            // 删除使用次数记录
            delete this.phraseUsage[phrase];
            localStorage.setItem('phraseUsage', JSON.stringify(this.phraseUsage));
            this.generatePhraseButtons();
        }
    }
    
    // 更新常用语使用次数
    updatePhraseUsage(phrase) {
        this.phraseUsage[phrase] = (this.phraseUsage[phrase] || 0) + 1;
        this.saveUsageData();
    }
    
    // 更新表情包使用次数
    updateEmojiUsage(emojiCode) {
        this.emojiUsage[emojiCode] = (this.emojiUsage[emojiCode] || 0) + 1;
        this.saveUsageData();
    }
    
    // 生成表情包按钮
    generateEmojiButtons() {
        const emojiContainer = document.getElementById('emoji-container');
        if (!emojiContainer) return;
        
        // 清空现有按钮
        emojiContainer.innerHTML = '';
        
        // 设置容器样式，一排显示六个按钮
        emojiContainer.style.display = 'grid';
        emojiContainer.style.gridTemplateColumns = 'repeat(6, 1fr)';
        emojiContainer.style.gap = '3px';
        
        if (!this.emojiCollections) {
            const cachedCollections = localStorage.getItem('emojiCollections');
            if (cachedCollections) {
                this.emojiCollections = JSON.parse(cachedCollections);
            } else {
                return;
            }
        }
        
        // 获取所有可用的表情包
        let allEmojis = [];
        const collections = this.emojiCollections.collections;
        for (const [collection, count] of Object.entries(collections)) {
            // 检查是否有映射关系
            const displayCollection = this.emojiCollections.collectionMap ? Object.keys(this.emojiCollections.collectionMap).find(key => this.emojiCollections.collectionMap[key] === collection) : collection;
            if (!displayCollection) continue;
            
            for (let i = 1; i <= count; i++) {
                const emojiKey = `${collection}_${i}`;
                const emojiCode = `#${displayCollection}${i}`;
                allEmojis.push({ collection, index: i, displayCollection, emojiKey, emojiCode });
            }
        }
        
        // 按使用次数排序表情包
        allEmojis.sort((a, b) => {
            const usageA = this.emojiUsage[a.emojiCode] || 0;
            const usageB = this.emojiUsage[b.emojiCode] || 0;
            return usageB - usageA;
        });
        
        // 生成按钮
        allEmojis.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.className = 'emoji-btn';
            emojiBtn.style.margin = '0';
            emojiBtn.style.padding = '5px';
            emojiBtn.style.backgroundColor = '#444';
            emojiBtn.style.border = 'none';
            emojiBtn.style.borderRadius = '3px';
            emojiBtn.style.cursor = 'pointer';
            emojiBtn.style.display = 'flex';
            emojiBtn.style.alignItems = 'center';
            emojiBtn.style.justifyContent = 'center';
            emojiBtn.style.width = '100%';
            emojiBtn.style.height = 'auto';
            emojiBtn.style.aspectRatio = '1';
            
            // 尝试获取缓存的表情包图片
            this.getEmojiFromIndexedDB(emoji.emojiKey).then(cachedEmoji => {
                if (!cachedEmoji) {
                    // 尝试从localStorage获取（兼容旧数据）
                    cachedEmoji = localStorage.getItem(`emoji_${emoji.emojiKey}`);
                }
                
                if (cachedEmoji) {
                    // 显示表情包图片
                    const img = document.createElement('img');
                    img.src = cachedEmoji;
                    img.style.width = '95%';
                    img.style.height = '95%';
                    img.style.objectFit = 'contain';
                    emojiBtn.appendChild(img);
                } else {
                    // 显示占位文本
                    emojiBtn.textContent = emoji.emojiCode;
                    emojiBtn.style.color = 'white';
                    emojiBtn.style.fontSize = '12px';
                }
            });
            
            // 存储表情包代码
            emojiBtn.dataset.emojiCode = emoji.emojiCode;
            
            // 添加点击事件
            emojiBtn.addEventListener('click', () => {
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    messageInput.value = emojiBtn.dataset.emojiCode;
                    // 更新使用次数
                    this.updateEmojiUsage(emojiBtn.dataset.emojiCode);
                    // 自动发送消息
                    this.sendMessageToChat();
                    // 关闭模态框
                    const chatToolsModal = document.getElementById('chat-tools-modal');
                    if (chatToolsModal) {
                        chatToolsModal.style.display = 'none';
                    }
                }
            });
            
            emojiContainer.appendChild(emojiBtn);
        });
    }
    
    clearChatMessages() {
        // 只清除日志消息，保留聊天消息
        const logMessages = document.getElementById('log-messages');
        if (logMessages) {
            logMessages.innerHTML = '';
        }
    }
    
    updateSidebarContent() {
        if (!this.gameState) return;
        
        const sidebarButtons = document.getElementById('sidebar-buttons');
        const sidebarRanking = document.getElementById('sidebar-ranking');
        const rankingList = document.getElementById('ranking-list');
        const resultReadyBtn = document.getElementById('result-ready-btn');
        
        // 检查房间是否已结束
        const isRoomEnded = this.currentRoom && this.currentRoom.isEnding && this.currentRoom.endTime && Date.now() >= this.currentRoom.endTime;
        
        if (this.gameState.stage === 'result') {
            sidebarButtons.style.display = 'block';
            sidebarRanking.style.display = 'none';
            
            // 重置房间按钮处理
            const resultResetBtn = document.getElementById('result-reset-btn');
            if (resultResetBtn) {
                resultResetBtn.onclick = () => {
                    this.requestResetRoom();
                };
            }
            
            if (isRoomEnded) {
                // 房间已结束，将准备按钮变成查看排行按钮
                resultReadyBtn.textContent = '查看排行';
                resultReadyBtn.onclick = () => {
                    this.showRoomRanking();
                };
            } else {
                // 房间未结束，保持准备按钮功能
                const myPlayer = this.gameState.players.find(p => p.id === this.playerId);
                const amIReady = myPlayer ? myPlayer.ready : false;
                resultReadyBtn.textContent = amIReady ? '取消准备' : '准备游戏';
                resultReadyBtn.onclick = () => {
                    this.toggleReady(!amIReady);
                };
            }
        } else {
            sidebarButtons.style.display = 'none';
            sidebarRanking.style.display = 'block';
            
            const sortedPlayers = [...this.gameState.players]
                .sort((a, b) => {
                const netA = (a.chips || 0) - (a.borrowedChips || 0);
                const netB = (b.chips || 0) - (b.borrowedChips || 0);
                return netB - netA;
            });
        
        let rankingHtml = '';
        sortedPlayers.forEach((player, index) => {
            const netChips = (player.chips || 0) - (player.borrowedChips || 0);
            const isMe = player.id === this.playerId;
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
            let playerStatus = '';
            if (player.isSpectator) {
                playerStatus = ' (观战)';
            } else if (player.left) {
                playerStatus = ' (离开)';
            }
            
            rankingHtml += `
                <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: ${rankColor}; font-weight: bold;">${index + 1}.</span>
                    <span style="color: ${isMe ? '#00d4aa' : '#fff'}; margin-left: 5px;">${player.name}${playerStatus}</span>
                    <div style="color: #aaa; font-size: 12px;">净: ${netChips}</div>
                </div>
            `;
        });
            rankingList.innerHTML = rankingHtml;
        }
    }
    
    showRoomRanking() {
        // 显示房间内所有玩家的净筹码排行，包括离开的玩家
        if (!this.gameState) return;
        
        // 对所有玩家（包括离开的）按净筹码排序
        const sortedPlayers = [...this.gameState.players]
            .sort((a, b) => {
                const netA = (a.chips || 0) - (a.borrowedChips || 0);
                const netB = (b.chips || 0) - (b.borrowedChips || 0);
                return netB - netA;
            });
        
        let rankingHtml = '<h3 style="color: white; margin: 0 0 10px 0; padding: 0; font-size: 16px;">房间排行</h3>';
        sortedPlayers.forEach((player, index) => {
            const netChips = (player.chips || 0) - (player.borrowedChips || 0);
            const isMe = player.id === this.playerId;
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
            let playerStatus = '';
            if (player.isSpectator) {
                playerStatus = ' (观战)';
            } else if (player.left) {
                playerStatus = ' (离开)';
            }
            
            rankingHtml += `
                <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: ${rankColor}; font-weight: bold;">${index + 1}.</span>
                    <span style="color: ${isMe ? '#00d4aa' : '#fff'}; margin-left: 5px;">${player.name}${playerStatus}</span>
                    <div style="color: #aaa; font-size: 12px;">净: ${netChips}</div>
                </div>
            `;
        });
        
        // 创建弹窗显示排行
        const rankingModal = document.createElement('div');
        rankingModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: #333;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
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
            document.body.removeChild(rankingModal);
        };
        
        modalContent.innerHTML = rankingHtml;
        modalContent.appendChild(closeBtn);
        rankingModal.appendChild(modalContent);
        document.body.appendChild(rankingModal);
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
    
    updateExtendVoteProgress(data) {
        const extendVoteProgress = document.getElementById('extend-vote-progress');
        const extendVotesList = document.getElementById('extend-votes-list');
        
        if (extendVoteProgress && extendVotesList) {
            extendVoteProgress.textContent = `${data.yesVotes + data.noVotes}/${data.totalPlayers}`;
            
            let votesHtml = '';
            votesHtml += `<p style="color: green;">同意: ${data.yesVotes}</p>`;
            votesHtml += `<p style="color: red;">不同意: ${data.noVotes}</p>`;
            votesHtml += `<p style="color: blue;">需要: ${data.requiredVotes} 票</p>`;
            
            extendVotesList.innerHTML = votesHtml;
        }
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

        // 更新卡片大小
        this.updateCardSize = function(size) {
            // 从本地存储获取卡片大小
            const handAreaSize = parseInt(localStorage.getItem('handCardSize'));
            const playboxSize = parseFloat(localStorage.getItem('playerBoxCardSize'));
            const communitySize = parseFloat(localStorage.getItem('communityCardSize'));
            
            // 处理 playbox 中的手牌
            const playboxCards = document.querySelectorAll('.player-cards .card');
            playboxCards.forEach(card => {
                // 直接设置宽度和高度，确保与设置值一致
                card.style.width = `${playboxSize}px`;
                card.style.height = `${playboxSize * 1.5}px`;
                card.style.minWidth = `${playboxSize}px`;
                card.style.minHeight = `${playboxSize * 1.5}px`;
                
                // 同时更新卡片内图片的大小
                const img = card.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                }
            });
            
            // 处理手牌区域的手牌
            const handAreaCards = document.querySelectorAll('#hand-area .card');
            handAreaCards.forEach(card => {
                // 直接设置宽度和高度，确保与设置值一致
                card.style.width = `${handAreaSize}px`;
                card.style.height = `${handAreaSize * 1.5}px`;
                card.style.minWidth = `${handAreaSize}px`;
                card.style.minHeight = `${handAreaSize * 1.5}px`;
                
                // 同时更新卡片内文字的大小
                card.style.fontSize = `${handAreaSize * 0.3}px`;
                
                // 同时更新卡片内图片的大小
                const img = card.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                }
            });
            
            // 处理公共牌
            const communityCards = document.querySelectorAll('#community-cards .card');
            communityCards.forEach(card => {
                // 直接设置宽度和高度，确保与设置值一致
                card.style.width = `${communitySize}px`;
                card.style.height = `${communitySize * 1.5}px`;
                card.style.minWidth = `${communitySize}px`;
                card.style.minHeight = `${communitySize * 1.5}px`;
                
                // 同时更新卡片内文字的大小
                card.style.fontSize = `${communitySize * 0.3}px`;
                
                // 同时更新卡片内图片的大小
                const img = card.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                }
            });
            
            // 处理跑马牌
            const runItCards = document.querySelectorAll('.run-it-cards .card');
            runItCards.forEach(card => {
                // 直接设置宽度和高度，确保与设置值一致
                card.style.width = `${communitySize}px`;
                card.style.height = `${communitySize * 1.5}px`;
                card.style.minWidth = `${communitySize}px`;
                card.style.minHeight = `${communitySize * 1.5}px`;
                
                // 同时更新卡片内文字的大小
                card.style.fontSize = `${communitySize * 0.3}px`;
                
                // 同时更新卡片内图片的大小
                const img = card.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                }
            });
        };

        // 应用皮肤设置
        this.applySkinSetting = function() {
            const useRoomSkin = localStorage.getItem('useRoomSkin') !== 'false';
            if (useRoomSkin) {
                // 使用房间皮肤
                // 这里不需要做任何操作，因为 gameState 中的 cardSkin 已经是房间设置的皮肤
                console.log('使用房间皮肤');
            } else {
                // 使用默认皮肤
                this.currentCardSkin = 'default';
                console.log('使用默认皮肤');
            }
            
            // 重新渲染游戏状态，应用皮肤设置
            if (this.gameState) {
                this.renderGameState();
            }
        };

        // 扑克大小设置
        if (cardSizeSlider && cardSizeValue) {
            // 从本地存储加载手牌大小，默认值改为70
            const savedHandCardSize = localStorage.getItem('handCardSize') || 70;
            cardSizeSlider.value = savedHandCardSize;
            cardSizeValue.textContent = `${savedHandCardSize}px`;

            // 添加滑块变化事件监听器
            cardSizeSlider.addEventListener('input', () => {
                const handSize = cardSizeSlider.value;
                cardSizeValue.textContent = `${handSize}px`;
                // 保存到本地存储
                localStorage.setItem('handCardSize', handSize);
                // 计算并缓存其他卡片大小
                const playerBoxSize = handSize * 0.6;
                const communitySize = handSize * 0.8;
                localStorage.setItem('playerBoxCardSize', playerBoxSize);
                localStorage.setItem('communityCardSize', communitySize);
                // 更新所有卡片大小
                this.updateCardSize(handSize);
            });

            // 初始更新卡片大小
            this.updateCardSize(savedHandCardSize);
        }

        // 皮肤设置
        if (useRoomSkinCheckbox) {
            // 从本地存储加载皮肤设置，默认使用房间皮肤
            const savedUseRoomSkin = localStorage.getItem('useRoomSkin');
            useRoomSkinCheckbox.checked = savedUseRoomSkin !== 'false';

            // 添加勾选框变化事件监听器
            useRoomSkinCheckbox.addEventListener('change', () => {
                const useRoomSkin = useRoomSkinCheckbox.checked;
                // 保存到本地存储
                localStorage.setItem('useRoomSkin', useRoomSkin);
                // 应用皮肤设置
                this.applySkinSetting();
            });
        }
        
        // 牌值文字显示设置
        const showCardTextCheckbox = document.getElementById('show-card-text');
        if (showCardTextCheckbox) {
            // 从本地存储加载设置，默认不显示
            const savedShowCardText = localStorage.getItem('showCardText');
            showCardTextCheckbox.checked = savedShowCardText === 'true';

            // 添加勾选框变化事件监听器
            showCardTextCheckbox.addEventListener('change', () => {
                const showCardText = showCardTextCheckbox.checked;
                // 保存到本地存储
                localStorage.setItem('showCardText', showCardText);
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
                        const savedCardSize = localStorage.getItem('cardSize') || 35;
                        cardSizeSlider.value = savedCardSize;
                        cardSizeValue.textContent = `${savedCardSize}px`;
                    }
                    
                    if (useRoomSkinCheckbox) {
                        // 确保勾选状态与本地存储一致
                        const savedUseRoomSkin = localStorage.getItem('useRoomSkin');
                        useRoomSkinCheckbox.checked = savedUseRoomSkin !== 'false';
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
                
                const savedUsername = localStorage.getItem('texasHoldem_username');
                const savedPassword = localStorage.getItem('texasHoldem_password');
                const rememberMe = localStorage.getItem('texasHoldem_rememberMe') === 'true';
                
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
                
                const savedUsername = localStorage.getItem('texasHoldem_username');
                const savedPassword = localStorage.getItem('texasHoldem_password');
                const rememberMe = localStorage.getItem('texasHoldem_rememberMe') === 'true';
                
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
                
                const savedUsername = localStorage.getItem('texasHoldem_username');
                const savedPassword = localStorage.getItem('texasHoldem_password');
                const rememberMe = localStorage.getItem('texasHoldem_rememberMe') === 'true';
                
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
                const savedHandCardSize = localStorage.getItem('handCardSize');
                if (!savedHandCardSize) {
                    localStorage.setItem('handCardSize', 70);
                    console.log('初始化手牌大小为70px');
                }
                
                // 计算并缓存其他卡片大小
                const handCardSize = parseInt(localStorage.getItem('handCardSize'));
                localStorage.setItem('playerBoxCardSize', handCardSize * 0.6);
                localStorage.setItem('communityCardSize', handCardSize * 0.8);
                // 存储表情包名录
                if (data.emojiCollections) {
                    localStorage.setItem('emojiCollections', JSON.stringify(data.emojiCollections));
                    this.emojiCollections = data.emojiCollections;
                    // 检查并下载表情包
                    this.downloadEmojis().catch(error => {
                        console.error('下载表情包失败:', error);
                    });
                    // 生成表情包按钮
                    this.generateEmojiButtons();
                }
                // 存储扑克牌皮肤信息
                if (data.cardSkins) {
                    this.cardSkins = data.cardSkins;
                    console.log('获取到扑克牌皮肤:', data.cardSkins);
                    // 更新创建房间模态框中的皮肤选择
                    this.updateCardSkinSelect();
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
                    console.log('更新扑克牌皮肤:', this.currentCardSkin);
                    // 下载扑克牌皮肤（如果需要）
                    this.downloadCardSkin(this.currentCardSkin).catch(error => {
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
                    this.addChatMessage(data.message, true);
                } else {
                    this.addChatMessage(data.message, false, data.sender, data.senderId);
                }
                break;
            case 'gameStart':
                this.addChatMessage('游戏开始！', true);
                break;
            case 'stageChange':
                this.addChatMessage(`阶段切换: ${data.stage}`, true);
                break;
            case 'playerAction':
                this.addChatMessage(`${data.playerName} ${data.action} ${data.amount ? `($${data.amount})` : ''}`, true);
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
        if (!this.gameState) return;
        const myPlayer = this.gameState.players.find(p => p.id === this.playerId);
        if (!myPlayer) return;
        
        const currentChips = myPlayer.chips || 0;
        const borrowedChips = myPlayer.borrowedChips || 0;
        const netChips = currentChips - borrowedChips;
        
        document.getElementById('current-chips').textContent = currentChips;
        document.getElementById('borrowed-chips').textContent = borrowedChips;
        document.getElementById('net-chips').textContent = netChips;
        
        const playersNetChipsList = document.getElementById('players-net-chips-list');
        let playersHtml = '';
        this.gameState.players.forEach(player => {
            const playerNetChips = (player.chips || 0) - (player.borrowedChips || 0);
            let playerStatus = '';
            if (player.isSpectator) {
                playerStatus = ' (观战)';
            } else if (player.left) {
                playerStatus = ' (离开)';
            }
            playersHtml += `<p style="color: white; margin: 5px 0;">${player.name}${playerStatus}: <span style="font-weight: bold; color: #00d4aa;">${playerNetChips}</span></p>`;
        });
        playersNetChipsList.innerHTML = playersHtml;
        
        const giftPlayerSelect = document.getElementById('gift-player-select');
        if (giftPlayerSelect) {
            giftPlayerSelect.innerHTML = '<option value="">选择玩家</option>';
            this.gameState.players
                .filter(p => !p.isSpectator && p.id !== this.playerId)
                .forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    giftPlayerSelect.appendChild(option);
                });
        }
        
        document.getElementById('chips-amount').value = '2000';
        if (document.getElementById('gift-amount')) {
            document.getElementById('gift-amount').value = '';
        }
    }

    voteRunIt(times) {
        this.sendMessage({ type: 'voteRunIt', times: times });
    }

    updateRunItModal() {
        if (!this.gameState) return;
        
        const runItModal = document.getElementById('run-it-modal');
        const voteProgress = document.getElementById('vote-progress');
        const votesList = document.getElementById('votes-list');
        const myVoteText = document.getElementById('my-vote-text');
        
        if (this.gameState.isWaitingForRunItVotes) {
            runItModal.style.display = 'block';
            
            voteProgress.textContent = `${this.gameState.totalRunItVotes}/${this.gameState.requiredRunItVotes}`;
            
            let votesHtml = '';
            if (this.gameState.runItVotes) {
                for (const [playerId, times] of Object.entries(this.gameState.runItVotes)) {
                    const player = this.gameState.players.find(p => p.id === playerId);
                    const playerName = player ? player.name : '未知';
                    votesHtml += `<p style="color: black;">${playerName}: 跑${times}次</p>`;
                }
            }
            votesList.innerHTML = votesHtml;
            
            if (this.gameState.myRunItVote) {
                myVoteText.textContent = `你已选择：跑${this.gameState.myRunItVote}次`;
            } else {
                myVoteText.textContent = '';
            }
            
            document.querySelectorAll('.run-it-btn').forEach(btn => {
                const times = parseInt(btn.dataset.times);
                if (this.gameState.myRunItVote === times) {
                    btn.style.opacity = '1';
                    btn.style.transform = 'scale(1.05)';
                } else {
                    btn.style.opacity = '0.7';
                    btn.style.transform = 'scale(1)';
                }
            });
        } else {
            runItModal.style.display = 'none';
        }
    }

    getAvatarColor(playerId) {
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    }

    getAvatarInitial(name) {
        return name ? name.charAt(0).toUpperCase() : '?';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                document.body.classList.add('fullscreen-mode');
            }).catch(err => {
                console.log('全屏请求失败:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                document.body.classList.remove('fullscreen-mode');
            });
        }
    }

    updateFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = '退出全屏';
        } else {
            fullscreenBtn.textContent = '全屏';
        }
    }

    renderRoomList(rooms) {
        const container = document.getElementById('rooms-container');
        container.innerHTML = '';

        if (rooms.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">暂无房间，请创建新房间</p>';
            return;
        }

        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card' + (room.playerCount >= room.maxPlayers ? ' full' : '');
            
            roomCard.innerHTML = `
                <h3>${room.name}</h3>
                <p>房间ID: ${room.id}</p>
                <p>人数: ${room.playerCount}/${room.maxPlayers}</p>
                <p>最少: ${room.minPlayers}人</p>
                ${room.gameActive ? '<p style="color: #00d4aa;">游戏进行中</p>' : ''}
            `;

            if (room.playerCount < room.maxPlayers && (!this.currentRoom || this.currentRoom.id !== room.id)) {
                const joinBtn = document.createElement('button');
                joinBtn.textContent = '加入房间';
                joinBtn.addEventListener('click', () => {
                    this.joinRoom(room.id);
                });
                roomCard.appendChild(joinBtn);
            } else if (room.playerCount >= room.maxPlayers) {
                const fullText = document.createElement('p');
                fullText.textContent = '房间已满';
                fullText.style.color = '#ff4444';
                fullText.style.marginTop = '10px';
                roomCard.appendChild(fullText);
            } else if (this.currentRoom && this.currentRoom.id === room.id) {
                const inText = document.createElement('p');
                inText.textContent = '当前房间';
                inText.style.color = '#00d4aa';
                inText.style.marginTop = '10px';
                roomCard.appendChild(inText);
            }

            container.appendChild(roomCard);
        });
    }

    showCurrentRoom() {
        const currentRoomDiv = document.getElementById('current-room');
        const roomInfo = document.getElementById('room-info');
        
        const playerCount = this.gameState ? this.gameState.players.length : this.currentRoom.playerCount;
        const readyCount = this.gameState ? this.gameState.players.filter(p => p.ready).length : 0;
        const myPlayer = this.gameState ? this.gameState.players.find(p => p.id === this.playerId) : null;
        const amIReady = myPlayer ? myPlayer.ready : false;
        
        roomInfo.innerHTML = `
            <p><strong>房间名称:</strong> ${this.currentRoom.name}</p>
            <p><strong>房间ID:</strong> ${this.currentRoom.id}</p>
            <p><strong>当前人数:</strong> ${playerCount}/${this.currentRoom.maxPlayers}</p>
            <p><strong>已准备:</strong> ${readyCount}/${playerCount} (需要至少${this.currentRoom.minPlayers}人且全部准备)</p>
            <div id="room-controls-game" style="margin-top: 15px;">
                <button id="ready-btn">${amIReady ? '取消准备' : '准备游戏'}</button>
            </div>
        `;
        
        currentRoomDiv.style.display = 'block';
        
        document.getElementById('ready-btn').addEventListener('click', () => {
            this.toggleReady(!amIReady);
        });
    }

    hideCurrentRoom() {
        const currentRoomDiv = document.getElementById('current-room');
        currentRoomDiv.style.display = 'none';
    }

    showGameArea() {
        document.getElementById('game-area').style.display = 'block';
        document.getElementById('room-management').style.display = 'none';
        document.querySelector('header').style.display = 'none';
        document.getElementById('connection-status').style.display = 'none';
        document.getElementById('chat-tools-btn').style.display = 'block';
        document.getElementById('room-end-time-display').style.display = 'block';
        document.body.classList.add('game-active');
    }

    hideGameArea() {
        document.getElementById('game-area').style.display = 'none';
        document.getElementById('room-management').style.display = 'block';
        document.querySelector('header').style.display = 'flex';
        document.getElementById('connection-status').style.display = 'flex';
        document.getElementById('chat-tools-btn').style.display = 'none';
        document.getElementById('room-end-time-display').style.display = 'none';
        document.body.classList.remove('game-active');
    }

    renderCard(card) {
        // 从本地存储获取手牌大小，默认值为70
        const handCardSize = parseInt(localStorage.getItem('handCardSize')) || 70;
        
        // 计算文字大小，与卡片大小成比例
        const fontSize = handCardSize * 0.3; // 文字大小为卡片宽度的30%
        
        // 直接使用设置的大小，避免卡片大小闪烁
        const cardHeight = handCardSize * 1.5;
        
        // 对于默认皮肤，显示文字卡片
        if (this.currentCardSkin === 'default') {
            const isRed = card.suit === '♥' || card.suit === '♦';
            return `<div class="card ${isRed ? 'red' : ''}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        } else {
            // 对于自定义皮肤，先显示文字卡片，然后在loadCardSkins中替换为图片
            // 这样至少不会显示空白，与旧版行为一致
            const isRed = card.suit === '♥' || card.suit === '♦';
            return `<div class="card ${isRed ? 'red' : ''}" data-rank="${card.rank}" data-suit="${card.suit}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        }
    }
    
    // 加载卡片皮肤图片
    // 预加载卡片皮肤
    async preloadCardSkins() {
        if (this.currentCardSkin !== 'default') {
            const suitMap = {
                '♥': 'hearts',
                '♦': 'diamonds',
                '♣': 'clubs',
                '♠': 'spades'
            };
            
            const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            const suits = ['♥', '♦', '♣', '♠'];
            
            for (const rank of ranks) {
                for (const suit of suits) {
                    const suitKey = suitMap[suit];
                    const cardKey = `${this.currentCardSkin}_${suitKey}_${rank}`;
                    try {
                        await this.getCardFromIndexedDB(cardKey);
                    } catch (error) {
                        console.error('预加载卡片皮肤失败:', error);
                    }
                }
            }
        }
    }
    
    // 预加载所有玩家的头像数据
    async preloadAvatars(players) {
        const avatarData = {};
        for (const player of players) {
            if (player.avatarUpdatedAt) {
                try {
                    const avatar = await this.getAvatarFromIndexedDB(player.id);
                    if (avatar) {
                        avatarData[player.id] = avatar;
                    } else {
                        // IndexedDB中没有头像数据，从服务器获取
                        await new Promise((resolve) => {
                            this.fetchAvatar(player.id, player.avatarUpdatedAt, player.name, [], (loadedAvatar) => {
                                if (loadedAvatar) {
                                    avatarData[player.id] = loadedAvatar;
                                }
                                resolve();
                            });
                        });
                    }
                } catch (error) {
                    console.error('预加载头像失败:', error);
                }
            }
        }
        return avatarData;
    }
    
    // 直接渲染带皮肤的卡片
    async renderCardWithSkin(card) {
        // 从本地存储获取手牌大小，默认值为70
        const handCardSize = parseInt(localStorage.getItem('handCardSize')) || 70;
        
        // 直接使用设置的大小，避免卡片大小闪烁
        const cardHeight = handCardSize * 1.5;
        
        if (this.currentCardSkin === 'default') {
            // 默认皮肤，直接显示文字卡片
            const isRed = card.suit === '♥' || card.suit === '♦';
            const fontSize = handCardSize * 0.4;
            return `<div class="card ${isRed ? 'red' : ''}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        } else {
            // 自定义皮肤，尝试直接加载皮肤图片
            const suitMap = {
                '♥': 'hearts',
                '♦': 'diamonds',
                '♣': 'clubs',
                '♠': 'spades'
            };
            
            const suitKey = suitMap[card.suit];
            if (suitKey) {
                const cardKey = `${this.currentCardSkin}_${suitKey}_${card.rank}`;
                try {
                    const cardImage = await this.getCardFromIndexedDB(cardKey);
                    if (cardImage) {
                        // 检查是否显示牌值文字
                        const showCardText = localStorage.getItem('showCardText') === 'true';
                        const isRed = card.suit === '♥' || card.suit === '♦';
                        const fontSize = handCardSize * 0.4;
                        
                        if (showCardText) {
                            // 显示牌值文字，添加覆盖层，文字大小改为1.5倍
                            const scaledFontSize = fontSize * 1.5;
                            return `<div class="card" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; position: relative;">
                                <img src="${cardImage}" style="width: 100%; height: 100%; object-fit: contain;">
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0.65; background-color: rgba(255, 255, 255, 0.1);">
                                    <span style="font-size: ${scaledFontSize}px; font-weight: bold; color: ${isRed ? 'red' : 'black'}; text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white; -webkit-text-stroke: 1px white; text-stroke: 1px white;">${card.rank}${card.suit}</span>
                                </div>
                            </div>`;
                        } else {
                            // 不显示牌值文字
                            return `<div class="card" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px;"><img src="${cardImage}" style="width: 100%; height: 100%; object-fit: contain;"></div>`;
                        }
                    }
                } catch (error) {
                    console.error('加载卡片皮肤失败:', error);
                }
            }
            
            // 加载失败，显示文字卡片
            const isRed = card.suit === '♥' || card.suit === '♦';
            const fontSize = handCardSize * 0.4;
            return `<div class="card ${isRed ? 'red' : ''}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        }
    }
    
    // 清除卡片旧资源
    clearCardResources(card) {
        // 移除所有子元素
        while (card.firstChild) {
            const child = card.firstChild;
            // 如果是图片元素，释放资源
            if (child.tagName === 'IMG') {
                // 清除图片源，释放内存
                child.src = '';
            }
            card.removeChild(child);
        }
    }

    async renderGameState() {
        if (!this.gameState) return;

        this.updateRunItModal();
        
        // 房间状态更新时，确保卡片大小使用本地存储的值
        const handCardSize = parseInt(localStorage.getItem('handCardSize')) || 70;
        
        // 应用皮肤设置
        const useRoomSkin = localStorage.getItem('useRoomSkin') !== 'false';
        if (useRoomSkin && this.gameState.cardSkin) {
            this.currentCardSkin = this.gameState.cardSkin;
        } else {
            this.currentCardSkin = 'default';
        }
        
        // 先设置卡片大小，再渲染游戏状态
        if (this.updateCardSize) {
            this.updateCardSize(handCardSize);
        }
        
        // 预加载卡片皮肤
        if (this.currentCardSkin !== 'default') {
            await this.preloadCardSkins();
        }
        
        // 预加载所有玩家的头像数据
        const avatarData = await this.preloadAvatars(this.gameState.players);
        
        if (this.gameState.isWaitingForShowdown && this.gameState.canChooseShowdown) {
            document.getElementById('showdown-modal').style.display = 'block';
        } else {
            document.getElementById('showdown-modal').style.display = 'none';
        }

        const gameControls = document.getElementById('game-controls');
        const sidebar = document.getElementById('sidebar');
        const readyRoomInfo = document.getElementById('ready-room-info');
        
        sidebar.style.display = 'block';
        this.updateSidebarContent();
        
        if (this.gameState.stage === 'result') {
            gameControls.style.display = 'none';
            
            // 游戏结束时清除消息记录
            this.clearChatMessages();
            
            const myPlayer = this.gameState.players.find(p => p.id === this.playerId);
            const amIReady = myPlayer ? myPlayer.ready : false;
            const readyBtn = document.getElementById('result-ready-btn');
            readyBtn.textContent = amIReady ? '取消准备' : '准备游戏';
            
            readyBtn.onclick = () => {
                this.toggleReady(!amIReady);
            };
            
            const leaveBtn = document.getElementById('result-leave-btn');
            leaveBtn.onclick = () => {
                this.leaveRoom();
            };
            
            const fullscreenBtn = document.getElementById('result-fullscreen-btn');
            fullscreenBtn.onclick = () => {
                this.toggleFullscreen();
            };
            
            const chipsBtn = document.getElementById('result-chips-btn');
            chipsBtn.onclick = () => {
                this.updateChipsModal();
                document.getElementById('chips-modal').style.display = 'block';
            };
            
            readyRoomInfo.style.display = 'none';
        } else if (this.gameState.stage === 'ready') {
            gameControls.style.display = 'none';
            
            readyRoomInfo.style.display = 'block';
            
            const playerCount = this.gameState.players.length;
            const readyCount = this.gameState.players.filter(p => p.ready).length;
            const myPlayer = this.gameState.players.find(p => p.id === this.playerId);
            const amIReady = myPlayer ? myPlayer.ready : false;
            
            const readyRoomDetails = document.getElementById('ready-room-details');
            readyRoomDetails.innerHTML = `
                <p><strong>房间名称:</strong> ${this.currentRoom.name}</p>
                <p><strong>房间ID:</strong> ${this.currentRoom.id}</p>
                <p><strong>当前人数:</strong> ${playerCount}/${this.currentRoom.maxPlayers}</p>
                <p><strong>已准备:</strong> ${readyCount}/${playerCount} (需要至少${this.currentRoom.minPlayers}人且全部准备)</p>
            `;
            
            const readyReadyBtn = document.getElementById('ready-ready-btn');
            readyReadyBtn.textContent = amIReady ? '取消准备' : '准备游戏';
            readyReadyBtn.onclick = () => {
                this.toggleReady(!amIReady);
            };
            
            const readyLeaveBtn = document.getElementById('ready-leave-btn');
            readyLeaveBtn.onclick = () => {
                this.leaveRoom();
            };
        } else {
            gameControls.style.display = 'block';
            readyRoomInfo.style.display = 'none';
            
            const gameFullscreenBtn = document.getElementById('game-fullscreen-btn');
            gameFullscreenBtn.onclick = () => {
                this.toggleFullscreen();
            };
        }

        const { stage, communityCards, pot, players, currentPlayerId, lastBet, minRaise, winners, runItTimes, initialCommunityCards, additionalCommunityCards, runResults } = this.gameState;
        console.log('调试信息:', {
            stage,
            runItTimes,
            initialCommunityCards,
            additionalCommunityCards,
            runResults
        });
        
        let potHtml = `底池: ${pot} 筹码 | 阶段: ${STAGE_NAMES[stage]}`;
        
        if (stage === 'result' && runResults && runResults.length > 0) {
            if (runResults.length > 1) {
                for (let i = 0; i < runResults.length; i++) {
                    const runResult = runResults[i];
                    const playerRankings = runResult.playerRankings || [];
                    
                    potHtml += `<br><div style="margin-top: 10px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap;">`;
                    potHtml += `<span style="color: #ffcc00; font-weight: bold;">第${i + 1}次牌力:</span>`;
                    potHtml += `<span style="color: #ffcc00; margin-left: 8px;">`;
                    
                    let rankingHtml = '';
                    let previousRank = -1;
                    for (let j = 0; j < playerRankings.length; j++) {
                        const ranking = playerRankings[j];
                        const separator = j > 0 ? (ranking.rank === previousRank ? '=' : '>') : '';
                        rankingHtml += `${separator}${ranking.playerName}(${ranking.handRankName})`;
                        previousRank = ranking.rank;
                    }
                    potHtml += rankingHtml;
                    potHtml += `</span></div>`;
                }
            } else {
                const playerRankings = runResults[0].playerRankings || [];
                
                potHtml += `<br><div style="margin-top: 10px; display: flex; align-items: center; flex-wrap: wrap;">`;
                potHtml += `<span style="color: #ffcc00; font-weight: bold;">牌力:</span>`;
                potHtml += `<span style="color: #ffcc00; margin-left: 8px;">`;
                
                let rankingHtml = '';
                let previousRank = -1;
                for (let j = 0; j < playerRankings.length; j++) {
                    const ranking = playerRankings[j];
                    const separator = j > 0 ? (ranking.rank === previousRank ? '=' : '>') : '';
                    rankingHtml += `${separator}${ranking.playerName}(${ranking.handRankName})`;
                    previousRank = ranking.rank;
                }
                potHtml += rankingHtml;
                potHtml += `</span></div>`;
            }
        } else if (winners && winners.length > 0) {
            const winnerNames = winners.map(w => w.name).join(', ');
            const handName = winners[0].handRankName;
            potHtml += `<br><span style="color: #ffcc00; font-size: 20px;">🎉 ${winnerNames} 获胜! (${handName})</span>`;
        }
        document.getElementById('pot').innerHTML = potHtml;
        
        const communityCardsDiv = document.getElementById('community-cards');
        let communityCardsHtml = '';
        
        console.log('显示跑马公共牌:', {
            stage,
            runItTimes,
            initialCommunityCards,
            additionalCommunityCards,
            additionalCommunityCardsLength: additionalCommunityCards?.length,
            runResults
        });
        
        if (stage === 'result' && initialCommunityCards && additionalCommunityCards) {
            for (let i = 0; i < runItTimes; i++) {
                const initialCards = initialCommunityCards;
                const additionalCards = additionalCommunityCards[i] || [];
                const allCardsForRun = [...initialCards, ...additionalCards];
                
                console.log(`第${i+1}次跑马:`, {
                    i,
                    initialCards,
                    additionalCards,
                    allCardsForRun
                });
                
                if (runItTimes > 1) {
                    let runCardsHtml = '';
                    for (const card of allCardsForRun) {
                        runCardsHtml += await this.renderCardWithSkin(card);
                    }
                    communityCardsHtml += `<div style="margin-bottom: 15px; display: flex; align-items: center; flex-wrap: wrap;">
                        <span style="color: #ffcc00; font-weight: bold; margin-right: 8px;">第${i + 1}次跑马:</span>
                        ${runCardsHtml}
                    </div>`;
                } else {
                    let runCardsHtml = '';
                    for (const card of allCardsForRun) {
                        runCardsHtml += await this.renderCardWithSkin(card);
                    }
                    communityCardsHtml += `<div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap;">
                        ${runCardsHtml}
                    </div>`;
                }
            }
        } else {
            let cardsHtml = '';
            for (const card of communityCards) {
                cardsHtml += await this.renderCardWithSkin(card);
            }
            communityCardsHtml = cardsHtml;
        }
        communityCardsDiv.innerHTML = communityCardsHtml;
        
        // 立即更新公共牌大小，避免闪烁
        const communitySize = parseFloat(localStorage.getItem('communityCardSize'));
        const communityCardElements = document.querySelectorAll('#community-cards .card');
        communityCardElements.forEach(card => {
            card.style.width = `${communitySize}px`;
            card.style.height = `${communitySize * 1.5}px`;
            card.style.minWidth = `${communitySize}px`;
            card.style.minHeight = `${communitySize * 1.5}px`;
            card.style.fontSize = `${communitySize * 0.4}px`;
            
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
        
        const playersArea = document.getElementById('players-area');
        
        // 保存当前折叠状态
        const collapsedStates = {};
        document.querySelectorAll('.player-box').forEach(playerBox => {
            const playerId = playerBox.dataset.playerId;
            collapsedStates[playerId] = playerBox.classList.contains('collapsed');
        });
        
        let playersHtml = '';
        for (const player of players) {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isMe = player.id === this.playerId;
            const avatarColor = this.getAvatarColor(player.id);
            const avatarInitial = this.getAvatarInitial(player.name);
            const spectatorClass = player.isSpectator ? ' spectator' : '';
            
            let badgesHtml = '';
            if (!player.isSpectator) {
                if (player.isDealer) {
                    badgesHtml += '<span class="player-badge dealer">D</span>';
                }
                if (player.isSmallBlind) {
                    badgesHtml += '<span class="player-badge small-blind">SB</span>';
                }
                if (player.isBigBlind) {
                    badgesHtml += '<span class="player-badge big-blind">BB</span>';
                }
            }
            
            const displayName = player.name.length > 5 ? player.name.substring(0, 5) + '...' : player.name;
            
            let playerCardsHtml = '';
            if (stage === 'result' && player.hand.length > 0) {
                let cardsHtml = '';
                for (const card of player.hand) {
                    cardsHtml += await this.renderCardWithSkin(card);
                }
                playerCardsHtml = `<div class="player-cards">${cardsHtml}</div>`;
            }
            
            // 构建头像HTML，直接使用预加载的头像数据
            const avatarId = `player-avatar-${player.id}`;
            let avatarHtml = '';
            if (avatarData[player.id]) {
                // 直接使用预加载的头像数据
                avatarHtml = `<div id="${avatarId}" class="player-avatar" style="background: none; background-image: url(${avatarData[player.id].avatar}); background-size: cover; background-position: center;"></div>`;
            } else {
                // 使用默认头像
                avatarHtml = `<div id="${avatarId}" class="player-avatar" style="background: ${avatarColor};">${avatarInitial}</div>`;
            }
            
            // 构建玩家状态类
            let playerStatusClasses = '';
            if (player.folded) playerStatusClasses += ' folded';
            if (player.allIn) playerStatusClasses += ' all-in';
            if (player.ready) playerStatusClasses += ' ready';
            
            // 恢复折叠状态
            const isCollapsed = collapsedStates[player.id] ? ' collapsed' : '';
            const contentCollapsed = collapsedStates[player.id] ? ' collapsed' : '';
            const toggleIcon = collapsedStates[player.id] ? '▶' : '▼';
            
            playersHtml += `
                <div class="player-box ${isCurrentPlayer ? 'current' : ''}${playerStatusClasses}${isCollapsed}${spectatorClass}" data-player-id="${player.id}">
                    <div class="player-box-header">
                        <div class="player-header-left">
                            ${avatarHtml}
                            <div class="player-name-and-badges">
                                <span class="player-name">${displayName} ${isMe ? '(你)' : ''}</span>
                                ${badgesHtml ? `<span class="player-badge-inline">${badgesHtml}</span>` : ''}
                            </div>
                        </div>
                        ${isMe ? `<button class="player-box-toggle-all" style="font-size: 12px;">${toggleIcon}</button>` : ''}
                    </div>
                    ${playerCardsHtml}
                    <div class="player-box-content${contentCollapsed}">
                        ${player.isSpectator ? '<div class="player-status" style="background-color: #999;">观战中</div>' : ''}
                        ${!player.isSpectator ? `
                            <div class="player-chips">筹码: ${player.chips}</div>
                            <div class="player-bet">本:${player.bet}/总:${player.totalBet || 0}</div>
                            ${player.folded ? '<div class="player-status">已弃牌</div>' : ''}
                            ${player.allIn ? '<div class="player-status all-in">ALL-IN</div>' : ''}
                            ${player.ready ? '<div class="player-status ready">已准备</div>' : ''}
                        ` : ''}
                    </div>
                    <div class="player-box-bet-info">
                        ${!player.isSpectator ? `
                            <div class="player-chips">筹码: ${player.chips}</div>
                            <div class="player-bet">本:${player.bet}</div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        playersArea.innerHTML = playersHtml;
        
        // 立即更新player-cards中的卡片大小，避免闪烁
        const playerBoxSize = parseFloat(localStorage.getItem('playerBoxCardSize'));
        const playerBoxCards = document.querySelectorAll('.player-cards .card');
        playerBoxCards.forEach(card => {
            card.style.width = `${playerBoxSize}px`;
            card.style.height = `${playerBoxSize * 1.5}px`;
            card.style.minWidth = `${playerBoxSize}px`;
            card.style.minHeight = `${playerBoxSize * 1.5}px`;
            card.style.fontSize = `${playerBoxSize * 0.4}px`;
            
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
        
        const handArea = document.getElementById('hand-area');
        const myPlayer = players.find(p => p.id === this.playerId);
        if (myPlayer && myPlayer.hand.length > 0) {
            let handCardsHtml = '';
            for (const card of myPlayer.hand) {
                handCardsHtml += await this.renderCardWithSkin(card);
            }
            handArea.innerHTML = `<div class="my-hand-label">我的手牌:</div>${handCardsHtml}`;
            
            // 立即更新手牌大小，避免闪烁
            const handCardSize = parseInt(localStorage.getItem('handCardSize'));
            const handAreaCards = document.querySelectorAll('#hand-area .card');
            handAreaCards.forEach(card => {
                card.style.width = `${handCardSize}px`;
                card.style.height = `${handCardSize * 1.5}px`;
                card.style.minWidth = `${handCardSize}px`;
                card.style.minHeight = `${handCardSize * 1.5}px`;
                card.style.fontSize = `${handCardSize * 0.4}px`;
                
                const img = card.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                }
            });
        } else {
            handArea.innerHTML = '';
        }
        
        const actionArea = document.getElementById('action-area');
        
        if (stage === 'result') {
            actionArea.innerHTML = '';
        } else {
            const isMyTurn = currentPlayerId === this.playerId;
            const myPlayerState = players.find(p => p.id === this.playerId);
            
            if (isMyTurn && myPlayerState && !myPlayerState.folded && !myPlayerState.allIn) {
                const callAmount = lastBet - myPlayerState.bet;
                const canCheck = callAmount === 0;
                
                const checkOrCallBtn = canCheck 
                    ? '<button class="action-btn" data-action="check">过牌</button>'
                    : `<button class="action-btn" data-action="call">跟注 (${callAmount})</button>`;
                
                actionArea.innerHTML = `
                    ${checkOrCallBtn}
                    <button class="action-btn" data-action="raise">加注</button>
                    <button class="action-btn" data-action="fold">弃牌</button>
                    <button class="action-btn all-in" data-action="allin">ALL-IN</button>
                `;
                
                document.querySelectorAll('.action-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = btn.dataset.action;
                        if (action === 'raise') {
                            this.showRaiseModal(minRaise);
                        } else if (action === 'fold') {
                            this.showFoldModal();
                        } else if (action === 'allin') {
                            this.showAllinModal();
                        } else if (action === 'call') {
                            const callAmount = lastBet - myPlayerState.bet;
                            this.showCallModal(callAmount);
                        } else {
                            this.playerAction(action, 0);
                        }
                    });
                });
            } else {
                actionArea.innerHTML = isMyTurn ? '<p>等待中...</p>' : `<p>等待 ${players.find(p => p.id === currentPlayerId)?.name || '其他玩家'} 行动...</p>`;
            }
        }
        
        // 为所有玩家的头像添加点击事件，实现发起踢出投票功能
        players.forEach(player => {
            const avatarElement = document.getElementById(`player-avatar-${player.id}`);
            if (avatarElement) {
                // 为头像添加点击事件，实现发起踢出投票功能
                avatarElement.onclick = () => {
                    // 不能踢出自己
                    if (player.id === this.playerId) return;
                    
                    // 显示踢出玩家确认模态框
                    const kickModal = document.getElementById('kick-player-modal');
                    const kickPlayerName = document.getElementById('kick-player-name');
                    if (kickModal && kickPlayerName) {
                        kickPlayerName.textContent = player.name;
                        kickModal.style.display = 'block';
                        
                        // 保存目标玩家ID
                        this.kickTargetPlayerId = player.id;
                        this.kickTargetPlayerName = player.name;
                    }
                };
            }
        });
        
        // 为自己的playerbox中的折叠控件添加点击事件，实现控制所有playerbox的折叠/展开功能
        document.querySelectorAll('.player-box-toggle-all').forEach(button => {
            button.onclick = () => {
                const playerBoxes = document.querySelectorAll('.player-box');
                const firstPlayerBox = playerBoxes[0];
                const shouldCollapse = !firstPlayerBox || !firstPlayerBox.classList.contains('collapsed');
                
                playerBoxes.forEach(playerBox => {
                    const content = playerBox.querySelector('.player-box-content');
                    
                    if (shouldCollapse) {
                        // 折叠
                        playerBox.classList.add('collapsed');
                        content.classList.add('collapsed');
                    } else {
                        // 展开
                        playerBox.classList.remove('collapsed');
                        content.classList.remove('collapsed');
                    }
                });
                
                // 更新按钮文本
                button.textContent = shouldCollapse ? '▶' : '▼';
            };
        });
        
        // 绑定踢出玩家确认模态框的按钮事件
        const cancelKickBtn = document.getElementById('cancel-kick-btn');
        const confirmKickBtn = document.getElementById('confirm-kick-btn');
        const kickModal = document.getElementById('kick-player-modal');
        
        if (cancelKickBtn) {
            cancelKickBtn.onclick = () => {
                if (kickModal) {
                    kickModal.style.display = 'none';
                }
            };
        }
        
        if (confirmKickBtn) {
            confirmKickBtn.onclick = () => {
                // 向服务器发送踢出投票申请
                this.sendMessage({
                    type: 'requestKickPlayer',
                    targetPlayerId: this.kickTargetPlayerId
                });
                
                if (kickModal) {
                    kickModal.style.display = 'none';
                }
            };
        }
        
        // 绑定踢出投票模态框的按钮事件
        document.querySelectorAll('.kick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.sendMessage({
                    type: 'voteKickPlayer',
                    vote: action
                });
            });
        });
    }
    
    // 更新扑克牌皮肤选择下拉框
    updateCardSkinSelect() {
        const cardSkinSelect = document.getElementById('card-skin-select');
        if (!cardSkinSelect) return;
        
        // 清空现有选项，保留默认选项
        while (cardSkinSelect.options.length > 1) {
            cardSkinSelect.remove(1);
        }
        
        // 添加用户有权限的皮肤
        for (const [skinId, skinInfo] of Object.entries(this.cardSkins)) {
            if (skinId !== 'default') {
                const option = document.createElement('option');
                option.value = skinId;
                option.textContent = skinInfo.name;
                cardSkinSelect.appendChild(option);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TexasHoldemClient();
});
