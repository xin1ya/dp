const fs = require('fs');
const path = require('path');

const roomsDir = path.join(__dirname, '../data/rooms');

if (!fs.existsSync(roomsDir)) {
    fs.mkdirSync(roomsDir, { recursive: true });
}

const getRoomFilePath = (roomId) => {
    return path.join(roomsDir, `room_${roomId}.json`);
};

const saveRoom = (roomId, roomData) => {
    const filePath = getRoomFilePath(roomId);
    fs.writeFileSync(filePath, JSON.stringify(roomData, null, 2));
};

const loadRoom = (roomId) => {
    const filePath = getRoomFilePath(roomId);
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    return null;
};

const deleteRoom = (roomId) => {
    const filePath = getRoomFilePath(roomId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const listRooms = () => {
    if (!fs.existsSync(roomsDir)) {
        return [];
    }
    return fs.readdirSync(roomsDir)
        .filter(file => file.startsWith('room_') && file.endsWith('.json'))
        .map(file => file.replace('room_', '').replace('.json', ''));
};

const clearAllRooms = () => {
    const roomFiles = listRooms();
    roomFiles.forEach(roomId => deleteRoom(roomId));
};

clearAllRooms();

module.exports = {
    saveRoom,
    loadRoom,
    deleteRoom,
    listRooms
};
