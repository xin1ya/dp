const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/users.json');

const initDb = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2));
    }
    cleanOldUsers();
};

const readDb = () => {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
};

const writeDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const cleanOldUsers = () => {
    const db = readDb();
    if (db.users.length > 100) {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        db.users = db.users.filter(user => {
            const lastLogin = user.lastLoginAt || user.createdAt;
            return lastLogin >= sevenDaysAgo;
        });
        writeDb(db);
        console.log(`已清理7天未登录用户，剩余${db.users.length}个账号`);
    }
};

const createUser = (id, username, password, nickname) => {
    const db = readDb();
    if (db.users.find(u => u.username === username)) {
        return false;
    }
    const now = Date.now();
    db.users.push({
        id,
        username,
        password,
        nickname,
        avatar: null,
        avatarUpdatedAt: null,
        createdAt: now,
        lastLoginAt: now,
        online: false
    });
    writeDb(db);
    return true;
};

const getUserByUsername = (username) => {
    const db = readDb();
    return db.users.find(u => u.username === username);
};

const getUserById = (id) => {
    const db = readDb();
    return db.users.find(u => u.id === id);
};

const updateLastLogin = (username) => {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
        db.users[userIndex].lastLoginAt = Date.now();
        writeDb(db);
    }
};

const updateUserOnline = (userId, online) => {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        db.users[userIndex].online = online;
        writeDb(db);
    }
};

const updateUserAvatar = (userId, avatar) => {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        db.users[userIndex].avatar = avatar;
        db.users[userIndex].avatarUpdatedAt = Date.now();
        writeDb(db);
        return true;
    }
    return false;
};

const updateUserNickname = (userId, nickname) => {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        db.users[userIndex].nickname = nickname;
        writeDb(db);
        return true;
    }
    return false;
};

initDb();

module.exports = {
    createUser,
    getUserByUsername,
    getUserById,
    updateLastLogin,
    updateUserOnline,
    updateUserAvatar,
    updateUserNickname
};
