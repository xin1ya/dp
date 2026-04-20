// 头像管理模块
import { StorageManager } from '../utils/storage.js';
import { AVATAR_COLORS } from '../utils/constants.js';

export class AvatarManager {
    constructor() {
        this.storageManager = new StorageManager();
    }

    // 获取头像颜色
    getAvatarColor(playerId) {
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    }

    // 获取头像初始化字符
    getAvatarInitial(name) {
        return name ? name.charAt(0).toUpperCase() : '?';
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
                // 这里需要通过主客户端实例发送消息
                console.log('头像上传成功');
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

    // 更新用户信息显示
    updateUserInfoDisplay(user) {
        const userNickname = document.getElementById('user-nickname');
        const userAvatar = document.getElementById('user-avatar');
        const profileNickname = document.getElementById('profile-nickname');
        const profileAvatar = document.getElementById('profile-avatar');
        
        if (userNickname) {
            userNickname.textContent = user.nickname || '未登录';
        }
        
        if (profileNickname) {
            profileNickname.value = user.nickname || '';
        }
        
        // 处理头像显示
        this.updateAvatarDisplay(user.id, user.avatarUpdatedAt, user.nickname, userAvatar, profileAvatar);
    }

    // 更新头像显示
    async updateAvatarDisplay(userId, avatarUpdatedAt, nickname, ...avatarElements) {
        // 从 IndexedDB 获取头像
        const indexedDBAvatar = await this.storageManager.getAvatarFromIndexedDB(userId);
        
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

    // 清除头像旧资源
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
                    this.storageManager.storeAvatarInIndexedDB(userId, base64Avatar, avatarUpdatedAt);
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
        const avatarColor = this.getAvatarColor(userId);
        const avatarInitial = this.getAvatarInitial(nickname);
        
        avatarElements.forEach(element => {
            if (element) {
                element.style.background = avatarColor;
                element.style.backgroundImage = 'none';
                element.textContent = avatarInitial;
            }
        });
    }

    // 预加载所有玩家的头像数据
    async preloadAvatars(players) {
        const avatarData = {};
        for (const player of players) {
            if (player.avatarUpdatedAt) {
                try {
                    const avatar = await this.storageManager.getAvatarFromIndexedDB(player.id);
                    if (avatar) {
                        avatarData[player.id] = avatar;
                    } else {
                        // IndexedDB中没有头像数据，从服务器获取
                        await new Promise((resolve) => {
                            this.fetchAvatar(player.id, player.avatarUpdatedAt, player.name, [], (loadedAvatar) => {
                                if (loadedAvatar) {
                                    avatarData[player.id] = loadedAvatar;
                                }
                                resolve();
                            });
                        });
                    }
                } catch (error) {
                    console.error('预加载头像失败:', error);
                }
            }
        }
        return avatarData;
    }
}