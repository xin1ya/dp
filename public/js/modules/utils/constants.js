// 版本号
export const VERSION = '1.1.3';

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
window.alert = customAlert;

// 更新公告
export const UPDATE_NOTES = [
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
            '4. 优化常用语排序实时更新，点击后立即更新排序'
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

export const STAGE_NAMES = {
    'ready': '准备中',
    'preflop': '盲注阶段',
    'flop': '翻牌',
    'turn': '转牌',
    'river': '河牌',
    'result': '比牌结果'
};

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

// 默认常用语
export const DEFAULT_PHRASES = [
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