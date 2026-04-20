// 游戏管理模块
import { StorageManager } from '../utils/storage.js';
import { STAGE_NAMES } from '../utils/constants.js';

export class GameManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.currentCardSkin = 'default';
    }

    // 下载扑克牌皮肤
    async downloadCardSkin(skinId) {
        try {
            console.log(`开始下载扑克牌皮肤: ${skinId}`);
            
            // 默认皮肤不需要下载
            if (skinId === 'default') {
                console.log('使用默认皮肤，不需要下载');
                return;
            }
            
            // 检查皮肤是否已存在
            const skinExists = await this.storageManager.getCardSkinFromIndexedDB(skinId);
            if (skinExists) {
                console.log(`扑克牌皮肤 ${skinId} 已存在，不需要下载`);
                return;
            }
            
            // 显示下载进度
            this.showCardSkinDownloadProgress();
            
            // 下载扑克牌皮肤文件
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            let totalCards = suits.length * ranks.length;
            let downloadedCards = 0;
            
            // 尝试的文件格式
            const extensions = ['gif', 'png', 'jpg', 'webp'];
            
            // 下载所有卡片
            for (const suit of suits) {
                for (const rank of ranks) {
                    const cardKey = `${skinId}_${suit}_${rank}`;
                    
                    // 尝试不同的文件格式
                    let downloaded = false;
                    for (const ext of extensions) {
                        // 尝试带空格和不带空格的文件名
                        const cardUrl1 = `/card-skins/${skinId}/cards/${suit}_${rank}.${ext}`;
                        const cardUrl2 = `/card-skins/${skinId}/cards/${suit}_ ${rank}.${ext}`;
                        
                        try {
                            // 先尝试不带空格的URL
                            const response = await fetch(cardUrl1);
                            if (response.ok) {
                                const blob = await response.blob();
                                const reader = new FileReader();
                                
                                reader.onloadend = async () => {
                                    const base64Card = reader.result;
                                    // 存储卡片到IndexedDB
                                    await this.storageManager.storeCardSkinToIndexedDB(cardKey, base64Card);
                                    
                                    // 更新下载进度
                                    downloadedCards++;
                                    const progress = Math.round((downloadedCards / totalCards) * 100);
                                    this.updateCardSkinDownloadProgress(progress);
                                };
                                
                                reader.readAsDataURL(blob);
                                downloaded = true;
                                break;
                            } else {
                                // 尝试带空格的URL
                                const response2 = await fetch(cardUrl2);
                                if (response2.ok) {
                                    const blob = await response2.blob();
                                    const reader = new FileReader();
                                    
                                    reader.onloadend = async () => {
                                        const base64Card = reader.result;
                                        // 存储卡片到IndexedDB
                                        await this.storageManager.storeCardSkinToIndexedDB(cardKey, base64Card);
                                        
                                        // 更新下载进度
                                        downloadedCards++;
                                        const progress = Math.round((downloadedCards / totalCards) * 100);
                                        this.updateCardSkinDownloadProgress(progress);
                                    };
                                    
                                    reader.readAsDataURL(blob);
                                    downloaded = true;
                                    break;
                                }
                            }
                        } catch (error) {
                            // 继续尝试下一个格式
                        }
                    }
                    
                    if (!downloaded) {
                        console.error(`下载卡片 ${cardKey} 失败: 所有格式都尝试过`);
                        // 继续下载其他卡片
                        downloadedCards++;
                        const progress = Math.round((downloadedCards / totalCards) * 100);
                        this.updateCardSkinDownloadProgress(progress);
                    }
                }
            }
            
            console.log(`扑克牌皮肤 ${skinId} 下载完成`);
        } catch (error) {
            console.error('下载扑克牌皮肤失败:', error);
        }
    }

    // 显示扑克牌皮肤下载进度条
    showCardSkinDownloadProgress() {
        // 检查是否已存在进度条
        let progressContainer = document.getElementById('card-skin-download-progress');
        if (!progressContainer) {
            // 创建进度条容器
            progressContainer = document.createElement('div');
            progressContainer.id = 'card-skin-download-progress';
            progressContainer.style.position = 'fixed';
            progressContainer.style.top = '20px';
            progressContainer.style.left = '50%';
            progressContainer.style.transform = 'translateX(-50%)';
            progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            progressContainer.style.color = 'white';
            progressContainer.style.padding = '10px 20px';
            progressContainer.style.borderRadius = '5px';
            progressContainer.style.zIndex = '1000';
            progressContainer.innerHTML = '<div style="font-size: 14px; margin-bottom: 5px;">下载扑克牌皮肤中...</div><div style="width: 200px; height: 20px; background-color: #444;"><div id="card-skin-progress-bar" style="height: 100%; background-color: #00d4aa; width: 0%;"></div></div><div id="card-skin-progress-text" style="font-size: 12px; margin-top: 5px;">0%</div>';
            document.body.appendChild(progressContainer);
        }
    }

    // 更新扑克牌皮肤下载进度
    updateCardSkinDownloadProgress(progress) {
        const progressBar = document.getElementById('card-skin-progress-bar');
        const progressText = document.getElementById('card-skin-progress-text');
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // 下载完成后移除进度条
            if (progress === 100) {
                setTimeout(() => {
                    const progressContainer = document.getElementById('card-skin-download-progress');
                    if (progressContainer) {
                        progressContainer.remove();
                    }
                }, 1000);
            }
        }
    }

    // 预加载卡片皮肤
    async preloadCardSkins() {
        if (this.currentCardSkin !== 'default') {
            const suitMap = {
                '♥': 'hearts',
                '♦': 'diamonds',
                '♣': 'clubs',
                '♠': 'spades'
            };
            
            const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            const suits = ['♥', '♦', '♣', '♠'];
            
            for (const rank of ranks) {
                for (const suit of suits) {
                    const suitKey = suitMap[suit];
                    const cardKey = `${this.currentCardSkin}_${suitKey}_${rank}`;
                    try {
                        await this.storageManager.getCardFromIndexedDB(cardKey);
                    } catch (error) {
                        console.error('预加载卡片皮肤失败:', error);
                    }
                }
            }
        }
    }

    // 渲染卡片
    renderCard(card) {
        // 从本地存储获取手牌大小，默认值为70
        const handCardSize = parseInt(localStorage.getItem('handCardSize')) || 70;
        
        // 计算文字大小，与卡片大小成比例
        const fontSize = handCardSize * 0.3; // 文字大小为卡片宽度的30%
        
        // 直接使用设置的大小，避免卡片大小闪烁
        const cardHeight = handCardSize * 1.5;
        
        // 对于默认皮肤，显示文字卡片
        if (this.currentCardSkin === 'default') {
            const isRed = card.suit === '♥' || card.suit === '♦';
            return `<div class="card ${isRed ? 'red' : ''}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        } else {
            // 对于自定义皮肤，先显示文字卡片，然后在loadCardSkins中替换为图片
            // 这样至少不会显示空白，与旧版行为一致
            const isRed = card.suit === '♥' || card.suit === '♦';
            return `<div class="card ${isRed ? 'red' : ''}" data-rank="${card.rank}" data-suit="${card.suit}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        }
    }

    // 直接渲染带皮肤的卡片
    async renderCardWithSkin(card) {
        // 从本地存储获取手牌大小，默认值为70
        const handCardSize = parseInt(localStorage.getItem('handCardSize')) || 70;
        
        // 直接使用设置的大小，避免卡片大小闪烁
        const cardHeight = handCardSize * 1.5;
        
        if (this.currentCardSkin === 'default') {
            // 默认皮肤，直接显示文字卡片
            const isRed = card.suit === '♥' || card.suit === '♦';
            const fontSize = handCardSize * 0.4;
            return `<div class="card ${isRed ? 'red' : ''}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        } else {
            // 自定义皮肤，尝试直接加载皮肤图片
            const suitMap = {
                '♥': 'hearts',
                '♦': 'diamonds',
                '♣': 'clubs',
                '♠': 'spades'
            };
            
            const suitKey = suitMap[card.suit];
            if (suitKey) {
                const cardKey = `${this.currentCardSkin}_${suitKey}_${card.rank}`;
                try {
                    const cardImage = await this.storageManager.getCardFromIndexedDB(cardKey);
                    if (cardImage) {
                        // 检查是否显示牌值文字
                        const showCardText = this.storageManager.loadCardTextSetting();
                        const isRed = card.suit === '♥' || card.suit === '♦';
                        const fontSize = handCardSize * 0.4;
                        
                        if (showCardText) {
                            // 显示牌值文字，添加覆盖层，文字大小改为1.5倍
                            const scaledFontSize = fontSize * 1.5;
                            return `<div class="card" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; position: relative;">
                                <img src="${cardImage}" style="width: 100%; height: 100%; object-fit: contain;">
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0.65; background-color: rgba(255, 255, 255, 0.1);">
                                    <span style="font-size: ${scaledFontSize}px; font-weight: bold; color: ${isRed ? 'red' : 'black'}; text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white; -webkit-text-stroke: 1px white; text-stroke: 1px white;">${card.rank}${card.suit}</span>
                                </div>
                            </div>`;
                        } else {
                            // 不显示牌值文字
                            return `<div class="card" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px;"><img src="${cardImage}" style="width: 100%; height: 100%; object-fit: contain;"></div>`;
                        }
                    }
                } catch (error) {
                    console.error('加载卡片皮肤失败:', error);
                }
            }
            
            // 加载失败，显示文字卡片
            const isRed = card.suit === '♥' || card.suit === '♦';
            const fontSize = handCardSize * 0.4;
            return `<div class="card ${isRed ? 'red' : ''}" style="width: ${handCardSize}px; height: ${cardHeight}px; min-width: ${handCardSize}px; min-height: ${cardHeight}px; font-size: ${fontSize}px;">${card.rank}${card.suit}</div>`;
        }
    }

    // 清除卡片旧资源
    clearCardResources(card) {
        // 移除所有子元素
        while (card.firstChild) {
            const child = card.firstChild;
            // 如果是图片元素，释放资源
            if (child.tagName === 'IMG') {
                // 清除图片源，释放内存
                child.src = '';
            }
            card.removeChild(child);
        }
    }

    // 更新卡片大小
    updateCardSize(size) {
        // 从本地存储获取卡片大小
        const handAreaSize = parseInt(localStorage.getItem('handCardSize'));
        const playboxSize = parseFloat(localStorage.getItem('playerBoxCardSize'));
        const communitySize = parseFloat(localStorage.getItem('communityCardSize'));
        
        // 处理 playbox 中的手牌
        const playboxCards = document.querySelectorAll('.player-cards .card');
        playboxCards.forEach(card => {
            // 直接设置宽度和高度，确保与设置值一致
            card.style.width = `${playboxSize}px`;
            card.style.height = `${playboxSize * 1.5}px`;
            card.style.minWidth = `${playboxSize}px`;
            card.style.minHeight = `${playboxSize * 1.5}px`;
            
            // 同时更新卡片内图片的大小
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
        
        // 处理手牌区域的手牌
        const handAreaCards = document.querySelectorAll('#hand-area .card');
        handAreaCards.forEach(card => {
            // 直接设置宽度和高度，确保与设置值一致
            card.style.width = `${handAreaSize}px`;
            card.style.height = `${handAreaSize * 1.5}px`;
            card.style.minWidth = `${handAreaSize}px`;
            card.style.minHeight = `${handAreaSize * 1.5}px`;
            
            // 同时更新卡片内文字的大小
            card.style.fontSize = `${handAreaSize * 0.3}px`;
            
            // 同时更新卡片内图片的大小
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
        
        // 处理公共牌
        const communityCards = document.querySelectorAll('#community-cards .card');
        communityCards.forEach(card => {
            // 直接设置宽度和高度，确保与设置值一致
            card.style.width = `${communitySize}px`;
            card.style.height = `${communitySize * 1.5}px`;
            card.style.minWidth = `${communitySize}px`;
            card.style.minHeight = `${communitySize * 1.5}px`;
            
            // 同时更新卡片内文字的大小
            card.style.fontSize = `${communitySize * 0.3}px`;
            
            // 同时更新卡片内图片的大小
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
        
        // 处理跑马牌
        const runItCards = document.querySelectorAll('.run-it-cards .card');
        runItCards.forEach(card => {
            // 直接设置宽度和高度，确保与设置值一致
            card.style.width = `${communitySize}px`;
            card.style.height = `${communitySize * 1.5}px`;
            card.style.minWidth = `${communitySize}px`;
            card.style.minHeight = `${communitySize * 1.5}px`;
            
            // 同时更新卡片内文字的大小
            card.style.fontSize = `${communitySize * 0.3}px`;
            
            // 同时更新卡片内图片的大小
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
    }

    // 应用皮肤设置
    applySkinSetting() {
        const useRoomSkin = this.storageManager.loadSkinSetting();
        if (useRoomSkin) {
            // 使用房间皮肤
            // 这里不需要做任何操作，因为 gameState 中的 cardSkin 已经是房间设置的皮肤
            console.log('使用房间皮肤');
        } else {
            // 使用默认皮肤
            this.currentCardSkin = 'default';
            console.log('使用默认皮肤');
        }
    }

    // 更新扑克牌皮肤选择下拉框
    updateCardSkinSelect(cardSkins) {
        const cardSkinSelect = document.getElementById('card-skin-select');
        if (!cardSkinSelect) return;
        
        // 清空现有选项，保留默认选项
        while (cardSkinSelect.options.length > 1) {
            cardSkinSelect.remove(1);
        }
        
        // 添加用户有权限的皮肤
        for (const [skinId, skinInfo] of Object.entries(cardSkins)) {
            if (skinId !== 'default') {
                const option = document.createElement('option');
                option.value = skinId;
                option.textContent = skinInfo.name;
                cardSkinSelect.appendChild(option);
            }
        }
    }

    // 渲染游戏状态
    async renderGameState(gameState, currentRoom, playerId, avatarData) {
        if (!gameState) return;

        this.updateRunItModal(gameState);
        
        // 房间状态更新时，确保卡片大小使用本地存储的值
        const handCardSize = parseInt(localStorage.getItem('handCardSize')) || 70;
        
        // 应用皮肤设置
        const useRoomSkin = this.storageManager.loadSkinSetting();
        if (useRoomSkin && gameState.cardSkin) {
            this.currentCardSkin = gameState.cardSkin;
        } else {
            this.currentCardSkin = 'default';
        }
        
        // 先设置卡片大小，再渲染游戏状态
        this.updateCardSize(handCardSize);
        
        // 预加载卡片皮肤
        if (this.currentCardSkin !== 'default') {
            await this.preloadCardSkins();
        }

        if (gameState.isWaitingForShowdown && gameState.canChooseShowdown) {
            document.getElementById('showdown-modal').style.display = 'block';
        } else {
            document.getElementById('showdown-modal').style.display = 'none';
        }

        const gameControls = document.getElementById('game-controls');
        const sidebar = document.getElementById('sidebar');
        const readyRoomInfo = document.getElementById('ready-room-info');
        
        sidebar.style.display = 'block';
        this.updateSidebarContent(gameState, playerId, currentRoom);
        
        if (gameState.stage === 'result') {
            gameControls.style.display = 'none';
            
            const myPlayer = gameState.players.find(p => p.id === playerId);
            const amIReady = myPlayer ? myPlayer.ready : false;
            const readyBtn = document.getElementById('result-ready-btn');
            readyBtn.textContent = amIReady ? '取消准备' : '准备游戏';
            
            readyBtn.onclick = () => {
                // 这里需要通过主客户端实例发送消息
                console.log('切换准备状态:', !amIReady);
            };
            
            const leaveBtn = document.getElementById('result-leave-btn');
            leaveBtn.onclick = () => {
                // 这里需要通过主客户端实例发送消息
                console.log('离开房间');
            };
            
            const fullscreenBtn = document.getElementById('result-fullscreen-btn');
            fullscreenBtn.onclick = () => {
                this.toggleFullscreen();
            };
            
            const chipsBtn = document.getElementById('result-chips-btn');
            chipsBtn.onclick = () => {
                this.updateChipsModal(gameState, playerId);
                document.getElementById('chips-modal').style.display = 'block';
            };
            
            readyRoomInfo.style.display = 'none';
        } else if (gameState.stage === 'ready') {
            gameControls.style.display = 'none';
            
            readyRoomInfo.style.display = 'block';
            
            const playerCount = gameState.players.length;
            const readyCount = gameState.players.filter(p => p.ready).length;
            const myPlayer = gameState.players.find(p => p.id === playerId);
            const amIReady = myPlayer ? myPlayer.ready : false;
            
            const readyRoomDetails = document.getElementById('ready-room-details');
            readyRoomDetails.innerHTML = `
                <p><strong>房间名称:</strong> ${currentRoom.name}</p>
                <p><strong>房间ID:</strong> ${currentRoom.id}</p>
                <p><strong>当前人数:</strong> ${playerCount}/${currentRoom.maxPlayers}</p>
                <p><strong>已准备:</strong> ${readyCount}/${playerCount} (需要至少${currentRoom.minPlayers}人且全部准备)</p>
            `;
            
            const readyReadyBtn = document.getElementById('ready-ready-btn');
            readyReadyBtn.textContent = amIReady ? '取消准备' : '准备游戏';
            readyReadyBtn.onclick = () => {
                // 这里需要通过主客户端实例发送消息
                console.log('切换准备状态:', !amIReady);
            };
            
            const readyLeaveBtn = document.getElementById('ready-leave-btn');
            readyLeaveBtn.onclick = () => {
                // 这里需要通过主客户端实例发送消息
                console.log('离开房间');
            };
        } else {
            gameControls.style.display = 'block';
            readyRoomInfo.style.display = 'none';
            
            const gameFullscreenBtn = document.getElementById('game-fullscreen-btn');
            gameFullscreenBtn.onclick = () => {
                this.toggleFullscreen();
            };
        }

        const { stage, communityCards, pot, players, currentPlayerId, lastBet, minRaise, winners, runItTimes, initialCommunityCards, additionalCommunityCards, runResults } = gameState;
        
        let potHtml = `底池: ${pot} 筹码 | 阶段: ${STAGE_NAMES[stage]}`;
        
        if (stage === 'result' && runResults && runResults.length > 0) {
            if (runResults.length > 1) {
                for (let i = 0; i < runResults.length; i++) {
                    const runResult = runResults[i];
                    const playerRankings = runResult.playerRankings || [];
                    
                    potHtml += `<br><div style="margin-top: 10px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap;">`;
                    potHtml += `<span style="color: #ffcc00; font-weight: bold;">第${i + 1}次牌力:</span>`;
                    potHtml += `<span style="color: #ffcc00; margin-left: 8px;">`;
                    
                    let rankingHtml = '';
                    let previousRank = -1;
                    for (let j = 0; j < playerRankings.length; j++) {
                        const ranking = playerRankings[j];
                        const separator = j > 0 ? (ranking.rank === previousRank ? '=' : '>') : '';
                        rankingHtml += `${separator}${ranking.playerName}(${ranking.handRankName})`;
                        previousRank = ranking.rank;
                    }
                    potHtml += rankingHtml;
                    potHtml += `</span></div>`;
                }
            } else {
                const playerRankings = runResults[0].playerRankings || [];
                
                potHtml += `<br><div style="margin-top: 10px; display: flex; align-items: center; flex-wrap: wrap;">`;
                potHtml += `<span style="color: #ffcc00; font-weight: bold;">牌力:</span>`;
                potHtml += `<span style="color: #ffcc00; margin-left: 8px;">`;
                
                let rankingHtml = '';
                let previousRank = -1;
                for (let j = 0; j < playerRankings.length; j++) {
                    const ranking = playerRankings[j];
                    const separator = j > 0 ? (ranking.rank === previousRank ? '=' : '>') : '';
                    rankingHtml += `${separator}${ranking.playerName}(${ranking.handRankName})`;
                    previousRank = ranking.rank;
                }
                potHtml += rankingHtml;
                potHtml += `</span></div>`;
            }
        } else if (winners && winners.length > 0) {
            const winnerNames = winners.map(w => w.name).join(', ');
            const handName = winners[0].handRankName;
            potHtml += `<br><span style="color: #ffcc00; font-size: 20px;">🎉 ${winnerNames} 获胜! (${handName})</span>`;
        }
        document.getElementById('pot').innerHTML = potHtml;
        
        const communityCardsDiv = document.getElementById('community-cards');
        let communityCardsHtml = '';
        
        if (stage === 'result' && initialCommunityCards && additionalCommunityCards) {
            for (let i = 0; i < runItTimes; i++) {
                const initialCards = initialCommunityCards;
                const additionalCards = additionalCommunityCards[i] || [];
                const allCardsForRun = [...initialCards, ...additionalCards];
                
                if (runItTimes > 1) {
                    let runCardsHtml = '';
                    for (const card of allCardsForRun) {
                        runCardsHtml += await this.renderCardWithSkin(card);
                    }
                    communityCardsHtml += `<div style="margin-bottom: 15px; display: flex; align-items: center; flex-wrap: wrap;">
                        <span style="color: #ffcc00; font-weight: bold; margin-right: 8px;">第${i + 1}次跑马:</span>
                        ${runCardsHtml}
                    </div>`;
                } else {
                    let runCardsHtml = '';
                    for (const card of allCardsForRun) {
                        runCardsHtml += await this.renderCardWithSkin(card);
                    }
                    communityCardsHtml += `<div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap;">
                        ${runCardsHtml}
                    </div>`;
                }
            }
        } else {
            let cardsHtml = '';
            for (const card of communityCards) {
                cardsHtml += await this.renderCardWithSkin(card);
            }
            communityCardsHtml = cardsHtml;
        }
        communityCardsDiv.innerHTML = communityCardsHtml;
        
        // 立即更新公共牌大小，避免闪烁
        const communitySize = parseFloat(localStorage.getItem('communityCardSize'));
        const communityCardElements = document.querySelectorAll('#community-cards .card');
        communityCardElements.forEach(card => {
            card.style.width = `${communitySize}px`;
            card.style.height = `${communitySize * 1.5}px`;
            card.style.minWidth = `${communitySize}px`;
            card.style.minHeight = `${communitySize * 1.5}px`;
            card.style.fontSize = `${communitySize * 0.4}px`;
            
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
        
        const playersArea = document.getElementById('players-area');
        
        // 保存当前折叠状态
        const collapsedStates = {};
        document.querySelectorAll('.player-box').forEach(playerBox => {
            const playerId = playerBox.dataset.playerId;
            collapsedStates[playerId] = playerBox.classList.contains('collapsed');
        });
        
        let playersHtml = '';
        for (const player of players) {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isMe = player.id === playerId;
            const spectatorClass = player.isSpectator ? ' spectator' : '';
            
            let badgesHtml = '';
            if (!player.isSpectator) {
                if (player.isDealer) {
                    badgesHtml += '<span class="player-badge dealer">D</span>';
                }
                if (player.isSmallBlind) {
                    badgesHtml += '<span class="player-badge small-blind">SB</span>';
                }
                if (player.isBigBlind) {
                    badgesHtml += '<span class="player-badge big-blind">BB</span>';
                }
            }
            
            const displayName = player.name.length > 5 ? player.name.substring(0, 5) + '...' : player.name;
            
            let playerCardsHtml = '';
            if (stage === 'result' && player.hand.length > 0) {
                let cardsHtml = '';
                for (const card of player.hand) {
                    cardsHtml += await this.renderCardWithSkin(card);
                }
                playerCardsHtml = `<div class="player-cards">${cardsHtml}</div>`;
            }
            
            // 构建头像HTML，直接使用预加载的头像数据
            const avatarId = `player-avatar-${player.id}`;
            let avatarHtml = '';
            if (avatarData[player.id]) {
                // 直接使用预加载的头像数据
                avatarHtml = `<div id="${avatarId}" class="player-avatar" style="background: none; background-image: url(${avatarData[player.id].avatar}); background-size: cover; background-position: center;"></div>`;
            } else {
                // 使用默认头像
                const avatarColor = this.getAvatarColor(player.id);
                const avatarInitial = this.getAvatarInitial(player.name);
                avatarHtml = `<div id="${avatarId}" class="player-avatar" style="background: ${avatarColor};">${avatarInitial}</div>`;
            }
            
            // 构建玩家状态类
            let playerStatusClasses = '';
            if (player.folded) playerStatusClasses += ' folded';
            if (player.allIn) playerStatusClasses += ' all-in';
            if (player.ready) playerStatusClasses += ' ready';
            
            // 恢复折叠状态
            const isCollapsed = collapsedStates[player.id] ? ' collapsed' : '';
            const contentCollapsed = collapsedStates[player.id] ? ' collapsed' : '';
            const toggleIcon = collapsedStates[player.id] ? '▶' : '▼';
            
            playersHtml += `
                <div class="player-box ${isCurrentPlayer ? 'current' : ''}${playerStatusClasses}${isCollapsed}${spectatorClass}" data-player-id="${player.id}">
                    <div class="player-box-header">
                        <div class="player-header-left">
                            ${avatarHtml}
                            <div class="player-name-and-badges">
                                <span class="player-name">${displayName} ${isMe ? '(你)' : ''}</span>
                                ${badgesHtml ? `<span class="player-badge-inline">${badgesHtml}</span>` : ''}
                            </div>
                        </div>
                        ${isMe ? `<button class="player-box-toggle-all" style="font-size: 12px;">${toggleIcon}</button>` : ''}
                    </div>
                    ${playerCardsHtml}
                    <div class="player-box-content${contentCollapsed}">
                        ${player.isSpectator ? '<div class="player-status" style="background-color: #999;">观战中</div>' : ''}
                        ${!player.isSpectator ? `
                            <div class="player-chips">筹码: ${player.chips}</div>
                            <div class="player-bet">本:${player.bet}/总:${player.totalBet || 0}</div>
                            ${player.folded ? '<div class="player-status">已弃牌</div>' : ''}
                            ${player.allIn ? '<div class="player-status all-in">ALL-IN</div>' : ''}
                            ${player.ready ? '<div class="player-status ready">已准备</div>' : ''}
                        ` : ''}
                    </div>
                    <div class="player-box-bet-info">
                        ${!player.isSpectator ? `
                            <div class="player-chips">筹码: ${player.chips}</div>
                            <div class="player-bet">本:${player.bet}</div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        playersArea.innerHTML = playersHtml;
        
        // 立即更新player-cards中的卡片大小，避免闪烁
        const playerBoxSize = parseFloat(localStorage.getItem('playerBoxCardSize'));
        const playerBoxCards = document.querySelectorAll('.player-cards .card');
        playerBoxCards.forEach(card => {
            card.style.width = `${playerBoxSize}px`;
            card.style.height = `${playerBoxSize * 1.5}px`;
            card.style.minWidth = `${playerBoxSize}px`;
            card.style.minHeight = `${playerBoxSize * 1.5}px`;
            card.style.fontSize = `${playerBoxSize * 0.4}px`;
            
            const img = card.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = '100%';
            }
        });
        
        const handArea = document.getElementById('hand-area');
        const myPlayer = players.find(p => p.id === playerId);
        if (myPlayer && myPlayer.hand.length > 0) {
            let handCardsHtml = '';
            for (const card of myPlayer.hand) {
                handCardsHtml += await this.renderCardWithSkin(card);
            }
            handArea.innerHTML = `<div class="my-hand-label">我的手牌:</div>${handCardsHtml}`;
            
            // 立即更新手牌大小，避免闪烁
            const handCardSize = parseInt(localStorage.getItem('handCardSize'));
            const handAreaCards = document.querySelectorAll('#hand-area .card');
            handAreaCards.forEach(card => {
                card.style.width = `${handCardSize}px`;
                card.style.height = `${handCardSize * 1.5}px`;
                card.style.minWidth = `${handCardSize}px`;
                card.style.minHeight = `${handCardSize * 1.5}px`;
                card.style.fontSize = `${handCardSize * 0.4}px`;
                
                const img = card.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                }
            });
        } else {
            handArea.innerHTML = '';
        }
        
        const actionArea = document.getElementById('action-area');
        
        if (stage === 'result') {
            actionArea.innerHTML = '';
        } else {
            const isMyTurn = currentPlayerId === playerId;
            const myPlayerState = players.find(p => p.id === playerId);
            
            if (isMyTurn && myPlayerState && !myPlayerState.folded && !myPlayerState.allIn) {
                const callAmount = lastBet - myPlayerState.bet;
                const canCheck = callAmount === 0;
                
                const checkOrCallBtn = canCheck 
                    ? '<button class="action-btn" data-action="check">过牌</button>'
                    : `<button class="action-btn" data-action="call">跟注 (${callAmount})</button>`;
                
                actionArea.innerHTML = `
                    ${checkOrCallBtn}
                    <button class="action-btn" data-action="raise">加注</button>
                    <button class="action-btn" data-action="fold">弃牌</button>
                    <button class="action-btn all-in" data-action="allin">ALL-IN</button>
                `;
                
                document.querySelectorAll('.action-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = btn.dataset.action;
                        if (action === 'raise') {
                            this.showRaiseModal(minRaise);
                        } else if (action === 'fold') {
                            this.showFoldModal();
                        } else if (action === 'allin') {
                            this.showAllinModal();
                        } else if (action === 'call') {
                            const callAmount = lastBet - myPlayerState.bet;
                            this.showCallModal(callAmount);
                        } else {
                            // 这里需要通过主客户端实例发送消息
                            console.log('玩家行动:', action);
                        }
                    });
                });
            } else {
                actionArea.innerHTML = isMyTurn ? '<p>等待中...</p>' : `<p>等待 ${players.find(p => p.id === currentPlayerId)?.name || '其他玩家'} 行动...</p>`;
            }
        }
    }

    // 更新侧边栏内容
    updateSidebarContent(gameState, playerId, currentRoom) {
        if (!gameState) return;
        
        const sidebarButtons = document.getElementById('sidebar-buttons');
        const sidebarRanking = document.getElementById('sidebar-ranking');
        const rankingList = document.getElementById('ranking-list');
        const resultReadyBtn = document.getElementById('result-ready-btn');
        
        // 检查房间是否已结束
        const isRoomEnded = currentRoom && currentRoom.isEnding && currentRoom.endTime && Date.now() >= currentRoom.endTime;
        
        if (gameState.stage === 'result') {
            sidebarButtons.style.display = 'block';
            sidebarRanking.style.display = 'none';
            
            // 重置房间按钮处理
            const resultResetBtn = document.getElementById('result-reset-btn');
            if (resultResetBtn) {
                resultResetBtn.onclick = () => {
                    // 这里需要通过主客户端实例发送消息
                    console.log('请求重置房间');
                };
            }
            
            if (isRoomEnded) {
                // 房间已结束，将准备按钮变成查看排行按钮
                resultReadyBtn.textContent = '查看排行';
                resultReadyBtn.onclick = () => {
                    this.showRoomRanking(gameState, playerId);
                };
            } else {
                // 房间未结束，保持准备按钮功能
                const myPlayer = gameState.players.find(p => p.id === playerId);
                const amIReady = myPlayer ? myPlayer.ready : false;
                resultReadyBtn.textContent = amIReady ? '取消准备' : '准备游戏';
                resultReadyBtn.onclick = () => {
                    // 这里需要通过主客户端实例发送消息
                    console.log('切换准备状态:', !amIReady);
                };
            }
        } else {
            sidebarButtons.style.display = 'none';
            sidebarRanking.style.display = 'block';
            
            const sortedPlayers = [...gameState.players]
                .sort((a, b) => {
                const netA = (a.chips || 0) - (a.borrowedChips || 0);
                const netB = (b.chips || 0) - (b.borrowedChips || 0);
                return netB - netA;
            });
        
        let rankingHtml = '';
        sortedPlayers.forEach((player, index) => {
            const netChips = (player.chips || 0) - (player.borrowedChips || 0);
            const isMe = player.id === playerId;
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
            let playerStatus = '';
            if (player.isSpectator) {
                playerStatus = ' (观战)';
            } else if (player.left) {
                playerStatus = ' (离开)';
            }
            
            rankingHtml += `
                <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: ${rankColor}; font-weight: bold;">${index + 1}.</span>
                    <span style="color: ${isMe ? '#00d4aa' : '#fff'}; margin-left: 5px;">${player.name}${playerStatus}</span>
                    <div style="color: #aaa; font-size: 12px;">净: ${netChips}</div>
                </div>
            `;
        });
            rankingList.innerHTML = rankingHtml;
        }
    }

    // 显示房间排行
    showRoomRanking(gameState, playerId) {
        // 显示房间内所有玩家的净筹码排行，包括离开的玩家
        if (!gameState) return;
        
        // 对所有玩家（包括离开的）按净筹码排序
        const sortedPlayers = [...gameState.players]
            .sort((a, b) => {
                const netA = (a.chips || 0) - (a.borrowedChips || 0);
                const netB = (b.chips || 0) - (b.borrowedChips || 0);
                return netB - netA;
            });
        
        let rankingHtml = '<h3 style="color: white; margin: 0 0 10px 0; padding: 0; font-size: 16px;">房间排行</h3>';
        sortedPlayers.forEach((player, index) => {
            const netChips = (player.chips || 0) - (player.borrowedChips || 0);
            const isMe = player.id === playerId;
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
            let playerStatus = '';
            if (player.isSpectator) {
                playerStatus = ' (观战)';
            } else if (player.left) {
                playerStatus = ' (离开)';
            }
            
            rankingHtml += `
                <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: ${rankColor}; font-weight: bold;">${index + 1}.</span>
                    <span style="color: ${isMe ? '#00d4aa' : '#fff'}; margin-left: 5px;">${player.name}${playerStatus}</span>
                    <div style="color: #aaa; font-size: 12px;">净: ${netChips}</div>
                </div>
            `;
        });
        
        // 创建弹窗显示排行
        const rankingModal = document.createElement('div');
        rankingModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: #333;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
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
            document.body.removeChild(rankingModal);
        };
        
        modalContent.innerHTML = rankingHtml;
        modalContent.appendChild(closeBtn);
        rankingModal.appendChild(modalContent);
        document.body.appendChild(rankingModal);
    }

    // 更新筹码模态框
    updateChipsModal(gameState, playerId) {
        if (!gameState) return;
        const myPlayer = gameState.players.find(p => p.id === playerId);
        if (!myPlayer) return;
        
        const currentChips = myPlayer.chips || 0;
        const borrowedChips = myPlayer.borrowedChips || 0;
        const netChips = currentChips - borrowedChips;
        
        document.getElementById('current-chips').textContent = currentChips;
        document.getElementById('borrowed-chips').textContent = borrowedChips;
        document.getElementById('net-chips').textContent = netChips;
        
        const playersNetChipsList = document.getElementById('players-net-chips-list');
        let playersHtml = '';
        gameState.players.forEach(player => {
            const playerNetChips = (player.chips || 0) - (player.borrowedChips || 0);
            let playerStatus = '';
            if (player.isSpectator) {
                playerStatus = ' (观战)';
            } else if (player.left) {
                playerStatus = ' (离开)';
            }
            playersHtml += `<p style="color: white; margin: 5px 0;">${player.name}${playerStatus}: <span style="font-weight: bold; color: #00d4aa;">${playerNetChips}</span></p>`;
        });
        playersNetChipsList.innerHTML = playersHtml;
        
        const giftPlayerSelect = document.getElementById('gift-player-select');
        if (giftPlayerSelect) {
            giftPlayerSelect.innerHTML = '<option value="">选择玩家</option>';
            gameState.players
                .filter(p => !p.isSpectator && p.id !== playerId)
                .forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    giftPlayerSelect.appendChild(option);
                });
        }
        
        document.getElementById('chips-amount').value = '2000';
        if (document.getElementById('gift-amount')) {
            document.getElementById('gift-amount').value = '';
        }
    }

    // 更新跑马模态框
    updateRunItModal(gameState) {
        if (!gameState) return;
        
        const runItModal = document.getElementById('run-it-modal');
        const voteProgress = document.getElementById('vote-progress');
        const votesList = document.getElementById('votes-list');
        const myVoteText = document.getElementById('my-vote-text');
        
        if (gameState.isWaitingForRunItVotes) {
            runItModal.style.display = 'block';
            
            voteProgress.textContent = `${gameState.totalRunItVotes}/${gameState.requiredRunItVotes}`;
            
            let votesHtml = '';
            if (gameState.runItVotes) {
                for (const [playerId, times] of Object.entries(gameState.runItVotes)) {
                    const player = gameState.players.find(p => p.id === playerId);
                    const playerName = player ? player.name : '未知';
                    votesHtml += `<p style="color: black;">${playerName}: 跑${times}次</p>`;
                }
            }
            votesList.innerHTML = votesHtml;
            
            if (gameState.myRunItVote) {
                myVoteText.textContent = `你已选择：跑${gameState.myRunItVote}次`;
            } else {
                myVoteText.textContent = '';
            }
            
            document.querySelectorAll('.run-it-btn').forEach(btn => {
                const times = parseInt(btn.dataset.times);
                if (gameState.myRunItVote === times) {
                    btn.style.opacity = '1';
                    btn.style.transform = 'scale(1.05)';
                } else {
                    btn.style.opacity = '0.7';
                    btn.style.transform = 'scale(1)';
                }
            });
        } else {
            runItModal.style.display = 'none';
        }
    }

    // 显示加注模态框
    showRaiseModal(minRaise) {
        const raiseModal = document.getElementById('raise-modal');
        const raiseMin = document.getElementById('raise-min');
        const raiseModalAmount = document.getElementById('raise-modal-amount');
        const confirmRaiseBtn = document.getElementById('confirm-raise-btn');
        
        if (raiseModal && raiseMin && raiseModalAmount && confirmRaiseBtn) {
            raiseMin.textContent = minRaise;
            raiseModalAmount.value = minRaise;
            raiseModalAmount.min = minRaise;
            raiseModal.style.display = 'block';
            
            // 计算底池金额
            const pot = this.gameState ? this.gameState.pot : 0;
            
            // 预设下注金额按钮
            const presetButtons = document.querySelectorAll('.preset-raise-btn');
            presetButtons.forEach(btn => {
                btn.onclick = () => {
                    let amount = minRaise;
                    const type = btn.dataset.type;
                    
                    switch (type) {
                        case 'min':
                            amount = minRaise;
                            break;
                        case 'half-pot':
                            amount = Math.ceil(pot / 2);
                            break;
                        case 'pot':
                            amount = pot;
                            break;
                        case 'double-pot':
                            amount = pot * 2;
                            break;
                    }
                    
                    // 确保金额不低于最低下注额
                    amount = Math.max(amount, minRaise);
                    raiseModalAmount.value = amount;
                };
            });
            
            confirmRaiseBtn.onclick = () => {
                const amount = parseInt(raiseModalAmount.value);
                if (amount >= minRaise) {
                    // 这里需要通过主客户端实例发送消息
                    console.log('加注:', amount);
                    raiseModal.style.display = 'none';
                } else {
                    alert(`加注金额不能低于 ${minRaise}`);
                }
            };
        }
    }

    // 显示弃牌模态框
    showFoldModal() {
        const foldModal = document.getElementById('fold-modal');
        const confirmFoldBtn = document.getElementById('confirm-fold-btn');
        const foldSpectateBtn = document.getElementById('fold-spectate-btn');
        
        if (foldModal && confirmFoldBtn && foldSpectateBtn) {
            foldModal.style.display = 'block';
            
            confirmFoldBtn.onclick = () => {
                // 这里需要通过主客户端实例发送消息
                console.log('弃牌');
                foldModal.style.display = 'none';
            };
            
            foldSpectateBtn.onclick = () => {
                // 先执行弃牌操作
                // 这里需要通过主客户端实例发送消息
                console.log('弃牌并观战');
                // 发送消息将玩家设置为观战状态
                // 这里需要通过主客户端实例发送消息
                console.log('设置为观战状态');
                // 关闭模态框
                foldModal.style.display = 'none';
            };
        }
    }

    // 显示全下模态框
    showAllinModal() {
        const allinModal = document.getElementById('allin-modal');
        const confirmAllinBtn = document.getElementById('confirm-allin-btn');
        
        if (allinModal && confirmAllinBtn) {
            allinModal.style.display = 'block';
            
            confirmAllinBtn.onclick = () => {
                // 这里需要通过主客户端实例发送消息
                console.log('全下');
                allinModal.style.display = 'none';
            };
        }
    }

    // 显示跟注模态框
    showCallModal(amount) {
        const callModal = document.getElementById('call-modal');
        const callAmountElement = document.getElementById('call-amount');
        const confirmCallBtn = document.getElementById('confirm-call-btn');
        
        if (callModal && callAmountElement && confirmCallBtn) {
            callAmountElement.textContent = amount;
            callModal.style.display = 'block';
            
            confirmCallBtn.onclick = () => {
                // 这里需要通过主客户端实例发送消息
                console.log('跟注:', amount);
                callModal.style.display = 'none';
            };
        }
    }

    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                document.body.classList.add('fullscreen-mode');
            }).catch(err => {
                console.log('全屏请求失败:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                document.body.classList.remove('fullscreen-mode');
            });
        }
    }

    // 更新全屏按钮
    updateFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = '退出全屏';
        } else {
            fullscreenBtn.textContent = '全屏';
        }
    }

    // 获取头像颜色
    getAvatarColor(playerId) {
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const AVATAR_COLORS = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        ];
        return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    }

    // 获取头像初始化字符
    getAvatarInitial(name) {
        return name ? name.charAt(0).toUpperCase() : '?';
    }

    // 设置当前卡片皮肤
    setCurrentCardSkin(skinId) {
        this.currentCardSkin = skinId;
        // 下载扑克牌皮肤（如果需要）
        this.downloadCardSkin(skinId).catch(error => {
            console.error('下载扑克牌皮肤失败:', error);
        });
    }
}