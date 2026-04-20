const path = require('path');

module.exports = {
    PORT: 8080,
    PUBLIC_DIR: path.join(__dirname, '../../public'),
    MAX_ROOMS: 5,
    MIN_PLAYERS_PER_ROOM: 4,
    MAX_PLAYERS_PER_ROOM: 12,
    AVATAR_DIR: path.join(__dirname, '../../public/avatars'),
    mimeTypes: {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    }
};