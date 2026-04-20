// 聊天管理模块
import { StorageManager } from '../utils/storage.js';
import { DEFAULT_PHRASES } from '../utils/constants.js';

export class ChatManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.commonPhrases = [];
        this.phraseUsage = {};
        this.emojiUsage = {};
        this.emojiCollections = null;
    }

    // 初始化聊天管理器
    async init() {
        await this.loadCommonPhrases();
        this.loadUsageData();
    }

    // 加载常用语
    async loadCommonPhrases() {
        this.commonPhrases = this.storageManager.loadCommonPhrases();
    }

    // 加载使用次数
    loadUsageData() {
        const { phraseUsage, emojiUsage } = this.storageManager.loadUsageData();
        this.phraseUsage = phraseUsage;
        this.emojiUsage = emojiUsage;
    }

    // 保存使用次数
    saveUsageData() {
        this.storageManager.saveUsageData(this.phraseUsage, this.emojiUsage);
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
            const isDefault = DEFAULT_PHRASES.includes(phrase);
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
            this.storageManager.saveCommonPhrases(this.commonPhrases);
            this.generatePhraseButtons();
        }
    }

    // 删除自定义常用语
    removeCustomPhrase(phrase) {
        // 保留默认常用语，只删除自定义的
        if (!DEFAULT_PHRASES.includes(phrase)) {
            this.commonPhrases = this.commonPhrases.filter(p => p !== phrase);
            this.storageManager.saveCommonPhrases(this.commonPhrases);
            // 删除使用次数记录
            delete this.phraseUsage[phrase];
            this.saveUsageData();
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
            this.emojiCollections = this.storageManager.loadEmojiCollections();
            if (!this.emojiCollections) {
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
            this.storageManager.getEmojiFromIndexedDB(emoji.emojiKey).then(cachedEmoji => {
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

    // 发送消息到聊天
    sendMessageToChat() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (message) {
            // 这里需要通过主客户端实例发送消息
            // 暂时留空，由主类实现
            console.log('发送聊天消息:', message);
            messageInput.value = '';
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
                    const cachedEmoji = await this.storageManager.getEmojiFromIndexedDB(emojiKey);
                    
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

    // 下载表情包
    async downloadEmojis() {
        try {
            console.log('开始下载表情包');
            if (!this.emojiCollections) {
                this.emojiCollections = this.storageManager.loadEmojiCollections();
                if (!this.emojiCollections) {
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
                            const inIndexedDB = await this.storageManager.getEmojiFromIndexedDB(emojiKey);
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
                        this.storageManager.storeEmojiToIndexedDB(emojiKey, base64Emoji).catch(error => {
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

    // 清空聊天消息
    clearChatMessages() {
        // 只清除日志消息，保留聊天消息
        const logMessages = document.getElementById('log-messages');
        if (logMessages) {
            logMessages.innerHTML = '';
        }
    }

    // 添加聊天消息
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

    // 显示聊天气泡
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

    // 设置表情包名录
    setEmojiCollections(collections) {
        this.emojiCollections = collections;
        this.storageManager.saveEmojiCollections(collections);
        // 检查并下载表情包
        this.downloadEmojis().catch(error => {
            console.error('下载表情包失败:', error);
        });
        // 生成表情包按钮
        this.generateEmojiButtons();
    }
}