const http = require('http');

// HTTP请求函数，用于调用机器人管理服务器API
function callBotManagerApi(endpoint, method, data, callback) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api${endpoint}`,
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(responseData);
                callback(null, parsedData);
            } catch (error) {
                callback(error, null);
            }
        });
    });

    req.on('error', (error) => {
        callback(error, null);
    });

    if (data) {
        req.write(JSON.stringify(data));
    }
    req.end();
}

// 处理特殊指令
function handleSpecialCommand(message, roomName, callback) {
    // 解析添加指令
    const addRegex = /^!bot\s+add\s*(\d*)$/;
    const addMatch = message.match(addRegex);
    
    // 解析移除指令（通过昵称）
    const removeRegex = /^!bot\s+remove\s+(.+)$/;
    const removeMatch = message.match(removeRegex);
    
    if (addMatch) {
        const count = addMatch[1] ? parseInt(addMatch[1]) : 1;
        // 调用添加机器人API
        callBotManagerApi('/bots/add', 'POST', { roomName, botCount: count }, callback);
    } else if (removeMatch) {
        const botNickname = removeMatch[1].trim();
        console.log(`Removing bot with nickname: ${botNickname}`);
        // 直接调用管理服务器的移除接口，传递昵称参数
        callBotManagerApi('/bots/remove-by-nickname', 'POST', { nickname: botNickname }, (error, result) => {
            if (error) {
                console.error(`Error removing bot: ${error}`);
                callback(error, null);
            } else {
                console.log(`Bot removed successfully: ${result.message}`);
                callback(null, result);
            }
        });
    } else {
        callback(new Error('Invalid command'), null);
    }
}

module.exports = {
    handleSpecialCommand
};