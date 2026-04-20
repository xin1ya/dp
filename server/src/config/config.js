// 配置文件

const path = require('path');

// 服务器配置
const PORT = 8080;

// 目录配置
const PUBLIC_DIR = path.join(__dirname, '../../public');
const AVATAR_DIR = path.join(__dirname, '../../public/avatars');

// 房间配置
const MAX_ROOMS = 5;
const MIN_PLAYERS_PER_ROOM = 4;
const MAX_PLAYERS_PER_ROOM = 12;

// 超时配置
const PLAYER_TIMEOUT = 1200000; // 20分钟
const SSE_TIMEOUT = 1200000; // 20分钟
const RECONNECT_TIMEOUT = 30000; // 30秒
const ROOM_ACTIVITY_TIMEOUT = 600000; // 10分钟

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

module.exports = {
    PORT,
    PUBLIC_DIR,
    AVATAR_DIR,
    MAX_ROOMS,
    MIN_PLAYERS_PER_ROOM,
    MAX_PLAYERS_PER_ROOM,
    PLAYER_TIMEOUT,
    SSE_TIMEOUT,
    RECONNECT_TIMEOUT,
    ROOM_ACTIVITY_TIMEOUT,
    mimeTypes
};
