// 主入口文件

import { gameManager } from './modules/gameManager.js';

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    gameManager.init();
    
    // 登录/注册相关事件
    setupAuthEvents();
    
    // 房间管理相关事件
    setupRoomEvents();
    
    // 游戏操作相关事件
    setupGameEvents();
});

// 设置登录/注册相关事件
function setupAuthEvents() {
    const authModal = document.getElementById('auth-modal');
    const authBtn = document.getElementById('auth-btn');
    const switchToRegister = document.getElementById('switch-to-register');
    const authTitle = document.getElementById('auth-title');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const nicknameGroup = document.getElementById('nickname-group');
    const inviteCodeGroup = document.getElementById('invite-code-group');
    const authSwitch = document.getElementById('auth-switch');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const nicknameInput = document.getElementById('nickname-input');
    const inviteCodeInput = document.getElementById('invite-code-input');
    const rememberMe = document.getElementById('remember-me');
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    const confirmLoginBtn = document.getElementById('confirm-login-btn');
    
    // 切换到注册模式
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            gameManager.isRegisterMode = true;
            authTitle.textContent = '注册';
            authBtn.textContent = '注册';
            confirmPasswordGroup.style.display = 'block';
            nicknameGroup.style.display = 'block';
            inviteCodeGroup.style.display = 'block';
            authSwitch.innerHTML = '已有账号？<a href="#" id="switch-to-login">立即登录</a>';
            
            // 添加切换到登录的事件
            document.getElementById('switch-to-login').addEventListener('click', (e) => {
                e.preventDefault();
                gameManager.isRegisterMode = false;
                authTitle.textContent = '登录';
                authBtn.textContent = '登录';
                confirmPasswordGroup.style.display = 'none';
                nicknameGroup.style.display = 'none';
                inviteCodeGroup.style.display = 'none';
                authSwitch.innerHTML = '还没有账号？<a href="#" id="switch-to-register">立即注册</a>';
                setupAuthEvents(); // 重新设置事件
            });
        });
    }
    
    // 登录/注册按钮点击事件
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (gameManager.isRegisterMode) {
                const confirmPassword = confirmPasswordInput.value.trim();
                const nickname = nicknameInput.value.trim();
                const inviteCode = inviteCodeInput.value.trim();
                
                if (!username || !password || !confirmPassword || !nickname || !inviteCode) {
                    alert('请填写所有字段');
                    return;
                }
                
                if (password !== confirmPassword) {
                    alert('两次密码输入不一致');
                    return;
                }
                
                gameManager.sendMessage({
                    type: 'register',
                    username: username,
                    password: password,
                    nickname: nickname,
                    inviteCode: inviteCode
                });
            } else {
                if (!username || !password) {
                    alert('请填写账号和密码');
                    return;
                }
                
                gameManager.sendMessage({
                    type: 'login',
                    username: username,
                    password: password
                });
                
                // 保存凭证
                if (rememberMe.checked) {
                    gameManager.saveCredentials(username, password, true);
                } else {
                    gameManager.saveCredentials('', '', false);
                }
            }
        });
    }
    
    // 登录冲突处理
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', () => {
            document.getElementById('login-conflict-modal').style.display = 'none';
        });
    }
    
    if (confirmLoginBtn) {
        confirmLoginBtn.addEventListener('click', () => {
            gameManager.sendMessage({
                type: 'confirmLogin',
                confirm: true,
                userId: gameManager.loginConflictUserId
            });
            document.getElementById('login-conflict-modal').style.display = 'none';
        });
    }
}

// 设置房间管理相关事件
function setupRoomEvents() {
    const createRoomBtn = document.getElementById('create-room-btn');
    const refreshRoomsBtn = document.getElementById('refresh-rooms-btn');
    const createRoomModal = document.getElementById('create-room-modal');
    const closeModalBtns = document.querySelectorAll('.close');
    const confirmCreateRoomBtn = document.getElementById('confirm-create-room-btn');
    const roomNameInput = document.getElementById('room-name-input');
    const roomDuration = document.getElementById('room-duration');
    const cardSkinSelect = document.getElementById('card-skin-select');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    const readyReadyBtn = document.getElementById('ready-ready-btn');
    const readyLeaveBtn = document.getElementById('ready-leave-btn');
    
    // 打开创建房间模态框
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            createRoomModal.style.display = 'block';
        });
    }
    
    // 刷新房间列表
    if (refreshRoomsBtn) {
        refreshRoomsBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'getRooms' });
        });
    }
    
    // 关闭模态框
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // 创建房间
    if (confirmCreateRoomBtn) {
        confirmCreateRoomBtn.addEventListener('click', () => {
            const roomName = roomNameInput.value.trim() || `房间 ${Math.floor(Math.random() * 1000)}`;
            const duration = parseInt(roomDuration.value) || 5;
            const cardSkin = cardSkinSelect.value || 'default';
            
            const endTime = new Date();
            endTime.setHours(endTime.getHours() + duration);
            
            gameManager.sendMessage({
                type: 'createRoom',
                name: roomName,
                endTime: endTime.toISOString(),
                cardSkin: cardSkin
            });
            
            createRoomModal.style.display = 'none';
            roomNameInput.value = '';
        });
    }
    
    // 离开房间
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'leaveRoom' });
        });
    }
    
    // 准备游戏
    if (readyReadyBtn) {
        readyReadyBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'toggleReady', ready: true });
        });
    }
    
    // 离开房间（准备界面）
    if (readyLeaveBtn) {
        readyLeaveBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'leaveRoom' });
        });
    }
}

// 设置游戏操作相关事件
function setupGameEvents() {
    const resultReadyBtn = document.getElementById('result-ready-btn');
    const resultLeaveBtn = document.getElementById('result-leave-btn');
    const resultChipsBtn = document.getElementById('result-chips-btn');
    const chipsModal = document.getElementById('chips-modal');
    const borrowBtn = document.getElementById('borrow-btn');
    const repayBtn = document.getElementById('repay-btn');
    const giftBtn = document.getElementById('gift-btn');
    const chipsAmount = document.getElementById('chips-amount');
    const giftAmount = document.getElementById('gift-amount');
    const giftPlayerSelect = document.getElementById('gift-player-select');
    const resultResetBtn = document.getElementById('result-reset-btn');
    const runItBtns = document.querySelectorAll('.run-it-btn');
    const showHandBtn = document.getElementById('show-hand-btn');
    const hideHandBtn = document.getElementById('hide-hand-btn');
    const raiseModal = document.getElementById('raise-modal');
    const cancelRaiseBtn = document.getElementById('cancel-raise-btn');
    const confirmRaiseBtn = document.getElementById('confirm-raise-btn');
    const raiseModalAmount = document.getElementById('raise-modal-amount');
    const presetRaiseBtns = document.querySelectorAll('.preset-raise-btn');
    const foldModal = document.getElementById('fold-modal');
    const cancelFoldBtn = document.getElementById('cancel-fold-btn');
    const confirmFoldBtn = document.getElementById('confirm-fold-btn');
    const foldSpectateBtn = document.getElementById('fold-spectate-btn');
    const allinModal = document.getElementById('allin-modal');
    const cancelAllinBtn = document.getElementById('cancel-allin-btn');
    const confirmAllinBtn = document.getElementById('confirm-allin-btn');
    const callModal = document.getElementById('call-modal');
    const cancelCallBtn = document.getElementById('cancel-call-btn');
    const confirmCallBtn = document.getElementById('confirm-call-btn');
    const extendBtns = document.querySelectorAll('.extend-btn');
    const resetBtns = document.querySelectorAll('.reset-btn');
    const kickBtns = document.querySelectorAll('.kick-btn');
    const confirmKickBtn = document.getElementById('confirm-kick-btn');
    const cancelKickBtn = document.getElementById('cancel-kick-btn');
    
    // 准备游戏（结果界面）
    if (resultReadyBtn) {
        resultReadyBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'toggleReady', ready: true });
        });
    }
    
    // 离开房间（结果界面）
    if (resultLeaveBtn) {
        resultLeaveBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'leaveRoom' });
        });
    }
    
    // 打开筹码管理模态框
    if (resultChipsBtn) {
        resultChipsBtn.addEventListener('click', () => {
            chipsModal.style.display = 'block';
        });
    }
    
    // 借取筹码
    if (borrowBtn) {
        borrowBtn.addEventListener('click', () => {
            const amount = parseInt(chipsAmount.value) || 2000;
            gameManager.sendMessage({ type: 'borrowChips', amount: amount });
        });
    }
    
    // 归还筹码
    if (repayBtn) {
        repayBtn.addEventListener('click', () => {
            const amount = parseInt(chipsAmount.value) || 2000;
            gameManager.sendMessage({ type: 'repayChips', amount: amount });
        });
    }
    
    // 赠送筹码
    if (giftBtn) {
        giftBtn.addEventListener('click', () => {
            const playerId = giftPlayerSelect.value;
            const amount = parseInt(giftAmount.value) || 100;
            if (playerId) {
                gameManager.sendMessage({ type: 'giftChips', playerId: playerId, amount: amount });
            } else {
                alert('请选择要赠送的玩家');
            }
        });
    }
    
    // 重置房间
    if (resultResetBtn) {
        resultResetBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'resetRoom' });
        });
    }
    
    // 跑马投票
    runItBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const times = parseInt(btn.dataset.times);
            gameManager.sendMessage({ type: 'voteRunIt', times: times });
        });
    });
    
    // 展示底牌
    if (showHandBtn) {
        showHandBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'chooseShowdown', showHand: true });
        });
    }
    
    // 不展示底牌
    if (hideHandBtn) {
        hideHandBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'chooseShowdown', showHand: false });
        });
    }
    
    // 取消加注
    if (cancelRaiseBtn) {
        cancelRaiseBtn.addEventListener('click', () => {
            raiseModal.style.display = 'none';
        });
    }
    
    // 确认加注
    if (confirmRaiseBtn) {
        confirmRaiseBtn.addEventListener('click', () => {
            const amount = parseInt(raiseModalAmount.value) || 0;
            gameManager.sendMessage({ type: 'playerAction', action: 'raise', amount: amount });
            raiseModal.style.display = 'none';
        });
    }
    
    // 预设加注金额
    presetRaiseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            // 这里可以添加预设金额的逻辑
        });
    });
    
    // 取消弃牌
    if (cancelFoldBtn) {
        cancelFoldBtn.addEventListener('click', () => {
            foldModal.style.display = 'none';
        });
    }
    
    // 确认弃牌
    if (confirmFoldBtn) {
        confirmFoldBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'playerAction', action: 'fold' });
            foldModal.style.display = 'none';
        });
    }
    
    // 弃牌并观战
    if (foldSpectateBtn) {
        foldSpectateBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'playerAction', action: 'fold', spectate: true });
            foldModal.style.display = 'none';
        });
    }
    
    // 取消全下
    if (cancelAllinBtn) {
        cancelAllinBtn.addEventListener('click', () => {
            allinModal.style.display = 'none';
        });
    }
    
    // 确认全下
    if (confirmAllinBtn) {
        confirmAllinBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'playerAction', action: 'allin' });
            allinModal.style.display = 'none';
        });
    }
    
    // 取消跟注
    if (cancelCallBtn) {
        cancelCallBtn.addEventListener('click', () => {
            callModal.style.display = 'none';
        });
    }
    
    // 确认跟注
    if (confirmCallBtn) {
        confirmCallBtn.addEventListener('click', () => {
            gameManager.sendMessage({ type: 'playerAction', action: 'call' });
            callModal.style.display = 'none';
        });
    }
    
    // 延长房间时间投票
    extendBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            gameManager.sendMessage({ type: 'voteExtend', action: action });
        });
    });
    
    // 重置房间投票
    resetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            gameManager.sendMessage({ type: 'voteReset', action: action });
        });
    });
    
    // 踢出玩家投票
    kickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            gameManager.sendMessage({ type: 'voteKick', action: action });
        });
    });
    
    // 确认踢出玩家
    if (confirmKickBtn) {
        confirmKickBtn.addEventListener('click', () => {
            const kickPlayerName = document.getElementById('kick-player-name').textContent;
            // 这里可以添加踢出玩家的逻辑
        });
    }
    
    // 取消踢出玩家
    if (cancelKickBtn) {
        cancelKickBtn.addEventListener('click', () => {
            document.getElementById('kick-player-modal').style.display = 'none';
        });
    }
}
