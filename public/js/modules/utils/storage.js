// 存储管理模块
export class StorageManager {
    constructor() {
        this.db = null;
    }

    // 初始化 IndexedDB
    async initIndexedDB() {
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
                    this.db = request.result;
                    resolve(this.db);
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
                request.onerror = () => resolve(null);
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
                request.onerror = () => resolve(null);
            });
        } catch (error) {
            console.error('从 IndexedDB 获取卡片失败:', error);
            return null;
        }
    }

    // 加载使用次数
    loadUsageData() {
        try {
            // 从 localStorage 加载常用语使用次数
            const cachedPhraseUsage = localStorage.getItem('phraseUsage');
            const phraseUsage = cachedPhraseUsage ? JSON.parse(cachedPhraseUsage) : {};
            
            // 从 localStorage 加载表情包使用次数
            const cachedEmojiUsage = localStorage.getItem('emojiUsage');
            const emojiUsage = cachedEmojiUsage ? JSON.parse(cachedEmojiUsage) : {};
            
            console.log('从 localStorage 加载使用次数成功');
            return { phraseUsage, emojiUsage };
        } catch (error) {
            console.error('加载使用次数失败:', error);
            return { phraseUsage: {}, emojiUsage: {} };
        }
    }
    
    // 保存使用次数
    saveUsageData(phraseUsage, emojiUsage) {
        try {
            // 保存常用语使用次数到 localStorage
            localStorage.setItem('phraseUsage', JSON.stringify(phraseUsage));
            
            // 保存表情包使用次数到 localStorage
            localStorage.setItem('emojiUsage', JSON.stringify(emojiUsage));
            
            console.log('保存使用次数到 localStorage 成功');
        } catch (error) {
            console.error('保存使用次数失败:', error);
        }
    }

    // 加载常用语
    loadCommonPhrases() {
        // 从本地存储加载常用语
        const cachedPhrases = localStorage.getItem('commonPhrases');
        if (cachedPhrases) {
            return JSON.parse(cachedPhrases);
        } else {
            // 初始化默认常用语
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
            localStorage.setItem('commonPhrases', JSON.stringify(defaultPhrases));
            return defaultPhrases;
        }
    }

    // 保存常用语
    saveCommonPhrases(phrases) {
        localStorage.setItem('commonPhrases', JSON.stringify(phrases));
    }

    // 加载凭证
    loadCredentials() {
        const savedUsername = localStorage.getItem('texasHoldem_username');
        const savedPassword = localStorage.getItem('texasHoldem_password');
        const rememberMe = localStorage.getItem('texasHoldem_rememberMe') === 'true';
        return { savedUsername, savedPassword, rememberMe };
    }

    // 保存凭证
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

    // 加载版本信息
    loadVersion() {
        return localStorage.getItem('texasHoldem_version');
    }

    // 保存版本信息
    saveVersion(version) {
        localStorage.setItem('texasHoldem_version', version);
    }

    // 加载表情包名录
    loadEmojiCollections() {
        const cachedCollections = localStorage.getItem('emojiCollections');
        return cachedCollections ? JSON.parse(cachedCollections) : null;
    }

    // 保存表情包名录
    saveEmojiCollections(collections) {
        localStorage.setItem('emojiCollections', JSON.stringify(collections));
    }

    // 加载卡片大小设置
    loadCardSize() {
        const handCardSize = localStorage.getItem('handCardSize');
        if (!handCardSize) {
            localStorage.setItem('handCardSize', 70);
            localStorage.setItem('playerBoxCardSize', 70 * 0.6);
            localStorage.setItem('communityCardSize', 70 * 0.8);
            return 70;
        }
        return parseInt(handCardSize);
    }

    // 保存卡片大小设置
    saveCardSize(size) {
        localStorage.setItem('handCardSize', size);
        localStorage.setItem('playerBoxCardSize', size * 0.6);
        localStorage.setItem('communityCardSize', size * 0.8);
    }

    // 加载皮肤设置
    loadSkinSetting() {
        return localStorage.getItem('useRoomSkin') !== 'false';
    }

    // 保存皮肤设置
    saveSkinSetting(useRoomSkin) {
        localStorage.setItem('useRoomSkin', useRoomSkin);
    }

    // 加载牌值文字显示设置
    loadCardTextSetting() {
        return localStorage.getItem('showCardText') === 'true';
    }

    // 保存牌值文字显示设置
    saveCardTextSetting(showCardText) {
        localStorage.setItem('showCardText', showCardText);
    }
}