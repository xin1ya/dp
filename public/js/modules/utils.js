// 工具函数模块

// 检测iOS设备
export function isiOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// 自定义alert函数，替代浏览器默认的alert弹窗
export function customAlert(message) {
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
export function overrideAlert() {
    window.alert = customAlert;
}

// 版本号
export const VERSION = '1.1.3';

// 游戏阶段名称
export const STAGE_NAMES = {
    'ready': '准备中',
    'preflop': '盲注阶段',
    'flop': '翻牌',
    'turn': '转牌',
    'river': '河牌',
    'result': '比牌结果'
};

// 头像颜色
export const AVATAR_COLORS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

// 获取头像颜色
export function getAvatarColor(userId) {
    const index = parseInt(userId.replace(/[^0-9]/g, '')) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

// 获取头像首字母
export function getAvatarInitial(nickname) {
    if (!nickname) return '?';
    return nickname.charAt(0).toUpperCase();
}

// 解析消息中的表情包
export async function parseMessageWithEmojis(message, maxWidth = 300) {
    // 简单的表情包解析逻辑
    return message;
}
