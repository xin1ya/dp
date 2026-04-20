// 存储模块

// 初始化 IndexedDB
export function initIndexedDB() {
    return new Promise((resolve, reject) => {
        try {
            if (!window.indexedDB) {
                reject('浏览器不支持 IndexedDB');
                return;
            }
            
            const request = indexedDB.open('TexasHoldemDB', 3);
            
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

// 存储头像到 IndexedDB
export async function storeAvatarInIndexedDB(userId, avatar, updatedAt) {
    try {
        const db = await initIndexedDB();
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
export async function getAvatarFromIndexedDB(userId) {
    try {
        const db = await initIndexedDB();
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

// 清理旧数据
export function cleanupOldData() {
    // 清理 localStorage 中的旧头像数据
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('avatar_') || key.startsWith('emoji_'))) {
            localStorage.removeItem(key);
            console.log('清理旧数据:', key);
        }
    }
    
    // 清理 IndexedDB 中的使用次数缓存
    clearIndexedDBUsageData();
}

// 清理 IndexedDB 中的使用次数缓存
export async function clearIndexedDBUsageData() {
    try {
        const db = await initIndexedDB();
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

// 加载使用次数
export function loadUsageData() {
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
export function saveUsageData(phraseUsage, emojiUsage) {
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

// 加载保存的凭证
export function loadSavedCredentials() {
    const savedUsername = localStorage.getItem('texasHoldem_username');
    const savedPassword = localStorage.getItem('texasHoldem_password');
    const rememberMe = localStorage.getItem('texasHoldem_rememberMe') === 'true';
    
    return { savedUsername, savedPassword, rememberMe };
}

// 保存凭证
export function saveCredentials(username, password, remember) {
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

// 检查版本更新
export function checkVersionUpdate(VERSION, UPDATE_NOTES, showUpdateNotice) {
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
            showUpdateNotice(versionsToShow);
        }
        
        // 更新localStorage中的版本号
        localStorage.setItem('texasHoldem_version', VERSION);
    }
}
