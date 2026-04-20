// UI模块

import { getAvatarColor, getAvatarInitial } from './utils.js';
import { storeAvatarInIndexedDB, getAvatarFromIndexedDB } from './storage.js';

class UIManager {
    constructor() {
        this.chatMessages = [];
        this.logMessages = [];
    }

    // 设置侧边栏
    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (sidebar && sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }

    // 设置信息栏
    setupInfoBar() {
        const infoBar = document.getElementById('info-bar');
        const infoBarToggle = document.getElementById('info-bar-toggle');
        const messageInput = document.getElementById('message-input');
        const sendMessageBtn = document.getElementById('send-message-btn');
        const chatTab = document.getElementById('chat-tab');
        const logTab = document.getElementById('log-tab');
        const chatMessages = document.getElementById('chat-messages');
        const logMessages = document.getElementById('log-messages');
        
        if (infoBar && infoBarToggle) {
            infoBarToggle.addEventListener('click', () => {
                infoBar.classList.toggle('collapsed');
            });
        }
        
        if (messageInput && sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                this.sendMessageToChat();
            });
            
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessageToChat();
                }
            });
        }
        
        if (chatTab && logTab && chatMessages && logMessages) {
            const chatControls = document.getElementById('chat-controls');
            
            chatTab.addEventListener('click', () => {
                chatTab.classList.add('active');
                chatTab.style.backgroundColor = '#00d4aa';
                chatTab.style.color = 'black';
                logTab.classList.remove('active');
                logTab.style.backgroundColor = '#666';
                logTab.style.color = 'white';
                chatMessages.style.display = 'block';
                logMessages.style.display = 'none';
                if (chatControls) {
                    chatControls.style.display = 'flex';
                }
            });
            
            logTab.addEventListener('click', () => {
                logTab.classList.add('active');
                logTab.style.backgroundColor = '#00d4aa';
                logTab.style.color = 'black';
                chatTab.classList.remove('active');
                chatTab.style.backgroundColor = '#666';
                chatTab.style.color = 'white';
                logMessages.style.display = 'block';
                chatMessages.style.display = 'none';
                if (chatControls) {
                    chatControls.style.display = 'none';
                }
            });
        }
    }

    // 设置个人资料模态框
    setupProfileModal() {
        const profileModal = document.getElementById('profile-modal');
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const cancelProfileBtn = document.getElementById('cancel-profile-btn');
        const saveProfileBtn = document.getElementById('save-profile-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        const avatarUploadBtn = document.getElementById('avatar-upload-btn');
        const profileAvatar = document.getElementById('profile-avatar');
        const profileNickname = document.getElementById('profile-nickname');
        const avatarCropModal = document.getElementById('avatar-crop-modal');
        const cancelCropBtn = document.getElementById('cancel-crop-btn');
        const confirmCropBtn = document.getElementById('confirm-crop-btn');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                if (this.loggedIn) {
                    this.loadUserInfo();
                    profileModal.style.display = 'block';
                } else {
                    alert('请先登录');
                }
            });
        }
        
        if (cancelProfileBtn) {
            cancelProfileBtn.addEventListener('click', () => {
                profileModal.style.display = 'none';
            });
        }
        
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }
        
        if (avatarUploadBtn) {
            avatarUploadBtn.addEventListener('click', () => {
                avatarUpload.click();
            });
        }
        
        if (profileAvatar) {
            profileAvatar.addEventListener('click', () => {
                avatarUpload.click();
            });
        }
        
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }
        
        if (cancelCropBtn) {
            cancelCropBtn.addEventListener('click', () => {
                avatarCropModal.style.display = 'none';
            });
        }
        
        if (confirmCropBtn) {
            confirmCropBtn.addEventListener('click', () => {
                this.cropAndUploadAvatar();
            });
        }
        
        if (profileModal) {
            window.addEventListener('click', (event) => {
                if (event.target === profileModal) {
                    profileModal.style.display = 'none';
                }
            });
        }
        
        if (avatarCropModal) {
            window.addEventListener('click', (event) => {
                if (event.target === avatarCropModal) {
                    avatarCropModal.style.display = 'none';
                }
            });
        }
    }

    // 清理头像旧资源
    clearAvatarResources(...avatarElements) {
        avatarElements.forEach(element => {
            if (element) {
                // 清除背景图片，释放内存
                element.style.backgroundImage = 'none';
                // 清除文本内容
                element.textContent = '';
            }
        });
    }

    // 更新用户头像显示
    async updateAvatarDisplay(userId, avatarUpdatedAt, nickname, ...avatarElements) {
        // 从 IndexedDB 获取头像
        const indexedDBAvatar = await getAvatarFromIndexedDB(userId);
        
        // 检查是否需要更新头像
        if (avatarUpdatedAt) {
            if (!indexedDBAvatar || indexedDBAvatar.updatedAt < avatarUpdatedAt) {
                // 需要从服务器获取头像
                this.fetchAvatar(userId, avatarUpdatedAt, nickname, avatarElements);
            } else {
                // 使用缓存的头像
                this.displayAvatar(indexedDBAvatar.avatar, nickname, ...avatarElements);
            }
        } else {
            // 没有自定义头像，使用默认文字头像
            this.displayDefaultAvatar(userId, nickname, ...avatarElements);
        }
    }

    // 从服务器获取头像
    fetchAvatar(userId, avatarUpdatedAt, nickname, avatarElements, callback) {
        // 从服务器获取头像
        fetch(`/avatars/${userId}.png?t=${avatarUpdatedAt}`)
            .then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error('头像不存在');
                }
            })
            .then(blob => {
                // 将 blob 转换为 base64 字符串进行缓存
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Avatar = reader.result;
                    // 存储到 IndexedDB
                    storeAvatarInIndexedDB(userId, base64Avatar, avatarUpdatedAt);
                    // 显示头像
                    this.displayAvatar(base64Avatar, nickname, ...avatarElements);
                    // 调用回调
                    if (callback) {
                        callback({ avatar: base64Avatar, updatedAt: avatarUpdatedAt });
                    }
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('获取头像失败:', error);
                // 使用默认头像
                this.displayDefaultAvatar(userId, nickname, ...avatarElements);
                // 调用回调
                if (callback) {
                    callback(null);
                }
            });
    }

    // 显示头像
    displayAvatar(avatarUrl, nickname, ...avatarElements) {
        avatarElements.forEach(element => {
            if (element) {
                element.style.background = 'none';
                element.style.backgroundImage = `url(${avatarUrl})`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                element.textContent = '';
            }
        });
    }

    // 显示默认头像
    displayDefaultAvatar(userId, nickname, ...avatarElements) {
        const avatarColor = getAvatarColor(userId);
        const avatarInitial = getAvatarInitial(nickname);
        
        avatarElements.forEach(element => {
            if (element) {
                element.style.background = avatarColor;
                element.style.backgroundImage = 'none';
                element.textContent = avatarInitial;
            }
        });
    }

    // 上传头像
    uploadAvatar(blob, userId) {
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.png');
        
        fetch(`/upload-avatar?userId=${userId}`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.avatar = data.avatar;
                // 重新加载用户信息，获取最新的 avatarUpdatedAt
                this.loadUserInfo();
                alert('头像上传成功');
            } else {
                alert('头像上传失败');
            }
        })
        .catch(error => {
            console.error('上传失败:', error);
            alert('上传失败，请重试');
        });
    }

    // 处理头像上传
    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const cropImage = document.getElementById('crop-image');
                if (cropImage) {
                    cropImage.src = event.target.result;
                    this.tempAvatarFile = file;
                    document.getElementById('avatar-crop-modal').style.display = 'block';
                    this.addCropBox();
                    // 重置文件输入，以便可以再次选择同一文件
                    e.target.value = '';
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // 添加裁剪框
    addCropBox() {
        const cropContainer = document.querySelector('#avatar-crop-modal .modal-content');
        const cropImage = document.getElementById('crop-image');
        const cropSizeInput = document.getElementById('crop-size');
        const cropLeftInput = document.getElementById('crop-left');
        const cropTopInput = document.getElementById('crop-top');
        
        // 移除已有的裁剪框
        const existingCropBox = document.getElementById('crop-box');
        if (existingCropBox) {
            existingCropBox.remove();
        }
        
        // 创建裁剪框
        const cropBox = document.createElement('div');
        cropBox.id = 'crop-box';
        cropBox.style.cssText = `
            position: absolute;
            border: 2px solid #00d4aa;
            background-color: rgba(0, 212, 170, 0.2);
            width: 200px;
            height: 200px;
            z-index: 10;
        `;
        
        // 计算初始位置
        setTimeout(() => {
            const imgRect = cropImage.getBoundingClientRect();
            const containerRect = cropContainer.getBoundingClientRect();
            
            const boxSize = Math.min(200, imgRect.width * 0.8, imgRect.height * 0.8);
            // 相对于图片左上角的坐标
            const relativeLeft = (imgRect.width - boxSize) / 2;
            const relativeTop = (imgRect.height - boxSize) / 2;
            // 相对于容器的坐标
            const absoluteLeft = imgRect.left - containerRect.left + relativeLeft;
            const absoluteTop = imgRect.top - containerRect.top + relativeTop;
            
            cropBox.style.width = `${boxSize}px`;
            cropBox.style.height = `${boxSize}px`;
            cropBox.style.left = `${absoluteLeft}px`;
            cropBox.style.top = `${absoluteTop}px`;
            
            // 更新输入框的值（使用相对于图片左上角的坐标）
            cropSizeInput.value = boxSize;
            cropLeftInput.value = Math.round(relativeLeft);
            cropTopInput.value = Math.round(relativeTop);
        }, 100);
        
        // 添加输入框事件监听器
        const updateCropBox = () => {
            const cropImage = document.getElementById('crop-image');
            const imgRect = cropImage.getBoundingClientRect();
            const containerRect = cropContainer.getBoundingClientRect();
            
            let size = parseInt(cropSizeInput.value) || 200;
            let relativeLeft = parseInt(cropLeftInput.value) || 0;
            let relativeTop = parseInt(cropTopInput.value) || 0;
            
            // 限制大小范围
            size = Math.max(50, Math.min(size, Math.min(imgRect.width, imgRect.height)));
            // 限制位置范围（相对于图片左上角）
            relativeLeft = Math.max(0, Math.min(relativeLeft, imgRect.width - size));
            relativeTop = Math.max(0, Math.min(relativeTop, imgRect.height - size));
            
            // 计算相对于容器的坐标
            const absoluteLeft = imgRect.left - containerRect.left + relativeLeft;
            const absoluteTop = imgRect.top - containerRect.top + relativeTop;
            
            // 更新裁剪框
            cropBox.style.width = `${size}px`;
            cropBox.style.height = `${size}px`;
            cropBox.style.left = `${absoluteLeft}px`;
            cropBox.style.top = `${absoluteTop}px`;
            
            // 更新输入框值（使用相对于图片左上角的坐标）
            cropSizeInput.value = size;
            cropLeftInput.value = relativeLeft;
            cropTopInput.value = relativeTop;
        };
        
        cropSizeInput.addEventListener('input', updateCropBox);
        cropLeftInput.addEventListener('input', updateCropBox);
        cropTopInput.addEventListener('input', updateCropBox);
        
        cropContainer.style.position = 'relative';
        cropContainer.appendChild(cropBox);
    }

    // 裁剪并上传头像
    cropAndUploadAvatar() {
        // 使用裁剪框的位置和大小进行裁剪
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const cropImage = document.getElementById('crop-image');
        const cropBox = document.getElementById('crop-box');
        
        // 设置画布尺寸为200x200
        canvas.width = 200;
        canvas.height = 200;
        
        if (cropBox) {
            // 获取裁剪框的位置和大小（相对于图片容器）
            const cropSize = parseInt(document.getElementById('crop-size').value) || 200;
            const cropLeft = parseInt(document.getElementById('crop-left').value) || 0;
            const cropTop = parseInt(document.getElementById('crop-top').value) || 0;
            
            // 计算相对于图片的裁剪位置（考虑图片的实际大小）
            const scaleX = cropImage.naturalWidth / cropImage.offsetWidth;
            const scaleY = cropImage.naturalHeight / cropImage.offsetHeight;
            
            const x = cropLeft * scaleX;
            const y = cropTop * scaleY;
            const width = cropSize * scaleX;
            const height = cropSize * scaleY;
            
            // 绘制裁剪后的图像
            ctx.drawImage(cropImage, x, y, width, height, 0, 0, 200, 200);
        } else {
            // 如果没有裁剪框，使用居中裁剪
            const size = Math.min(cropImage.naturalWidth, cropImage.naturalHeight);
            const x = (cropImage.naturalWidth - size) / 2;
            const y = (cropImage.naturalHeight - size) / 2;
            ctx.drawImage(cropImage, x, y, size, size, 0, 0, 200, 200);
        }
        
        // 转换为Blob并存储，等待保存按钮点击时上传
        canvas.toBlob((blob) => {
            if (blob) {
                this.croppedAvatarBlob = blob;
                console.log('裁剪成功，Blob大小:', blob.size);
                // 预览裁剪结果
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) {
                    const url = URL.createObjectURL(blob);
                    profileAvatar.style.background = 'none';
                    profileAvatar.style.backgroundImage = `url(${url})`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.style.backgroundPosition = 'center';
                    profileAvatar.textContent = '';
                }
                alert('裁剪成功，请点击保存按钮完成上传');
            } else {
                console.error('图片转换失败');
                alert('图片转换失败，请重试');
            }
            // 无论成功失败，都关闭模态框
            document.getElementById('avatar-crop-modal').style.display = 'none';
        }, 'image/png');
    }

    // 发送聊天消息
    sendMessageToChat() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (message) {
            this.sendMessage({
                type: 'chatMessage',
                message: message
            });
            messageInput.value = '';
        }
    }

    // 添加聊天消息
    async addChatMessage(message, isSystem = false, sender = '', senderId = '') {
        if (isSystem) {
            const logMessages = document.getElementById('log-messages');
            if (logMessages) {
                const messageElement = document.createElement('p');
                messageElement.className = 'system-message';
                messageElement.textContent = message;
                logMessages.appendChild(messageElement);
                logMessages.scrollTop = logMessages.scrollHeight;
            }
        } else {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                const messageElement = document.createElement('p');
                messageElement.className = 'player-message';
                // 解析消息中的表情包
                const parsedMessage = await this.parseMessageWithEmojis(message);
                messageElement.innerHTML = `<span class="sender">${sender}:</span> ${parsedMessage}`;
                chatMessages.appendChild(messageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // 显示聊天气泡
            if (senderId) {
                this.showChatBubble(senderId, message);
            }
        }
    }

    // 显示聊天气泡
    async showChatBubble(playerId, message) {
        const playerBox = document.querySelector(`.player-box[data-player-id="${playerId}"]`) || 
                        Array.from(document.querySelectorAll('.player-box')).find(box => {
                            const avatarId = box.querySelector('.player-avatar')?.id;
                            return avatarId && avatarId.includes(playerId);
                        });
        
        if (playerBox) {
            // 移除已有的气泡
            const existingBubble = document.querySelector(`.chat-bubble[data-player-id="${playerId}"]`);
            if (existingBubble) {
                existingBubble.remove();
            }
            
            // 获取playerBox的位置和大小
            const rect = playerBox.getBoundingClientRect();
            
            // 计算气泡宽度为playerbox宽度的1.5倍
            let bubbleWidth = rect.width * 1.5;
            // 限制最大宽度为屏幕宽度的80%
            bubbleWidth = Math.min(bubbleWidth, window.innerWidth * 0.8);
            
            // 计算气泡位置，确保不超出屏幕范围
            let bubbleLeft = rect.left + rect.width / 2;
            const bubbleHalfWidth = bubbleWidth / 2;
            
            // 检查左边界
            if (bubbleLeft - bubbleHalfWidth < 10) {
                bubbleLeft = bubbleHalfWidth + 10;
            }
            // 检查右边界
            if (bubbleLeft + bubbleHalfWidth > window.innerWidth - 10) {
                bubbleLeft = window.innerWidth - bubbleHalfWidth - 10;
            }
            
            // 创建新气泡
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';
            bubble.dataset.playerId = playerId;
            
            // 解析消息中的表情包
            bubble.innerHTML = await this.parseMessageWithEmojis(message, rect.width * 1.2);
            
            // 计算文字大小，根据消息长度自适应
            let fontSize = 12;
            if (message.length > 20) {
                fontSize = 10;
            } else if (message.length > 10) {
                fontSize = 11;
            }
            
            bubble.style.cssText = `
                position: fixed;
                top: ${rect.bottom + 10}px;
                left: ${bubbleLeft}px;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: ${fontSize}px;
                max-width: ${bubbleWidth}px;
                word-wrap: break-word;
                z-index: 10;
                animation: bubble-up 0.3s ease-out forwards;
            `;
            
            // 添加气泡动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes bubble-up {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.body.appendChild(style);
            
            // 将气泡添加到body中
            document.body.appendChild(bubble);
            
            // 4秒后移除气泡
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.style.animation = 'bubble-up 0.3s ease-in reverse forwards';
                    setTimeout(() => {
                        bubble.remove();
                    }, 300);
                }
            }, 4000);
        }
    }

    // 解析消息中的表情包
    async parseMessageWithEmojis(message, maxWidth = 300) {
        // 简单的表情包解析逻辑
        return message;
    }

    // 显示更新公告
    showUpdateNotice(versions) {
        // 创建更新公告弹窗
        const updateModal = document.createElement('div');
        updateModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: #333;
            padding: 20px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;
        
        // 构建公告内容
        let contentHtml = '';
        
        // 显示所有需要的版本更新公告
        versions.forEach((update, index) => {
            contentHtml += `<h2 style="color: #00d4aa; margin-top: ${index === 0 ? '0' : '20px'};">${update.title}</h2>`;
            contentHtml += '<ul style="color: white; padding-left: 20px;">';
            update.content.forEach(item => {
                contentHtml += `<li style="margin-bottom: 10px;">${item}</li>`;
            });
            contentHtml += '</ul>';
            
            // 在版本之间添加分隔线
            if (index < versions.length - 1) {
                contentHtml += '<hr style="border: 1px solid rgba(255,255,255,0.2); margin: 20px 0;">';
            }
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '确定';
        closeBtn.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #00d4aa;
            color: black;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
        `;
        closeBtn.onclick = () => {
            document.body.removeChild(updateModal);
        };
        
        modalContent.innerHTML = contentHtml;
        modalContent.appendChild(closeBtn);
        updateModal.appendChild(modalContent);
        document.body.appendChild(updateModal);
    }
}

export const uiManager = new UIManager();
