# 德州扑克游戏系统

## 项目概述

这是一个基于Node.js和WebSocket的德州扑克游戏系统，包含完整的前端界面和后端服务器。系统支持多人实时游戏、房间管理、用户认证、头像上传等功能。

## 技术栈

- **后端**：Node.js, WebSocket (ws), multer
- **前端**：HTML, CSS, JavaScript
- **数据存储**：JSON文件

## 项目结构

```
├── public/             # 前端静态文件
│   ├── avatars/        # 用户头像
│   ├── card-skins/     # 扑克牌皮肤
│   ├── css/            # 样式文件
│   ├── emojis/         # 表情包
│   ├── js/             # 前端JavaScript
│   └── index.html      # 主页面
├── server/             # 后端服务器
│   ├── data/           # 数据存储
│   ├── node_modules/   # 依赖包
│   ├── src/            # 服务器源码
│   │   ├── db.js       # 用户数据管理
│   │   ├── game.js     # 游戏逻辑
│   │   ├── roomStorage.js # 房间存储
│   │   └── server.js   # 服务器主文件
│   ├── package.json    # 项目配置
│   └── package-lock.json
├── .gitignore          # Git忽略文件
└── README.md           # 项目说明
```

## 部署步骤

### 1. 环境准备

- 安装 Node.js (v14+)
- 克隆项目代码：
  ```bash
  git clone https://github.com/xin1ya/dp.git
  cd dp
  ```

### 2. 安装依赖

```bash
cd server
npm install
```

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:8080` 启动

### 4. 访问游戏

打开浏览器，访问 `http://localhost:8080` 即可进入游戏

## 主要功能

### 用户系统
- 注册（需要邀请码：xuerma）
- 登录
- 头像上传
- 昵称修改

### 房间系统
- 创建房间（可设置结束时间和卡牌皮肤）
- 加入房间
- 离开房间
- 房间列表查看

### 游戏系统
- 德州扑克完整规则
- 玩家准备
- 下注操作（弃牌、过牌、跟注、加注、全下）
- 筹码管理（借筹码、还筹码）
- 游戏状态实时更新

### 其他功能
- 聊天系统
- 表情包
- 卡牌皮肤
- 房间延长投票
- 房间重置投票
- 踢出玩家投票

## API接口

### HTTP接口

#### 1. 头像上传
- **URL**：`/upload-avatar?userId={userId}`
- **方法**：POST
- **参数**：
  - `userId`：用户ID（URL参数）
  - `avatar`：头像文件（form-data）
- **返回**：
  ```json
  {
    "success": true,
    "avatar": "/avatars/{userId}.png"
  }
  ```

#### 2. 用户信息更新
- **URL**：`/update-user`
- **方法**：POST
- **参数**：
  ```json
  {
    "userId": "用户ID",
    "nickname": "新昵称"
  }
  ```
- **返回**：
  ```json
  {
    "success": true
  }
  ```

#### 3. SSE事件流
- **URL**：`/api/events?clientId={clientId}`
- **方法**：GET
- **说明**：用于iOS设备的实时通信

#### 4. 消息发送（iOS设备）
- **URL**：`/api/send`
- **方法**：POST
- **参数**：
  ```json
  {
    "clientId": "客户端ID",
    "type": "消息类型",
    "...": "其他参数"
  }
  ```
- **返回**：
  ```json
  {
    "success": true
  }
  ```

### WebSocket消息类型

#### 客户端发送

1. **register**：注册
   ```json
   {
     "type": "register",
     "username": "用户名",
     "password": "密码",
     "nickname": "昵称",
     "inviteCode": "邀请码"
   }
   ```

2. **login**：登录
   ```json
   {
     "type": "login",
     "username": "用户名",
     "password": "密码"
   }
   ```

3. **confirmLogin**：确认顶号
   ```json
   {
     "type": "confirmLogin",
     "confirm": true,
     "userId": "用户ID"
   }
   ```

4. **getRooms**：获取房间列表
   ```json
   {
     "type": "getRooms"
   }
   ```

5. **createRoom**：创建房间
   ```json
   {
     "type": "createRoom",
     "name": "房间名称",
     "endTime": "结束时间",
     "cardSkin": "卡牌皮肤"
   }
   ```

6. **joinRoom**：加入房间
   ```json
   {
     "type": "joinRoom",
     "roomId": 1
   }
   ```

7. **leaveRoom**：离开房间
   ```json
   {
     "type": "leaveRoom"
   }
   ```

8. **toggleReady**：切换准备状态
   ```json
   {
     "type": "toggleReady",
     "ready": true
   }
   ```

9. **playerAction**：玩家操作
   ```json
   {
     "type": "playerAction",
     "action": "fold|check|call|raise|allin",
     "amount": 100
   }
   ```

10. **borrowChips**：借筹码
    ```json
    {
      "type": "borrowChips",
      "amount": 1000
    }
    ```

11. **repayChips**：还筹码
    ```json
    {
      "type": "repayChips",
      "amount": 500
    }
    ```

#### 服务器发送

1. **welcome**：欢迎消息
2. **loginSuccess**：登录成功
3. **registerSuccess**：注册成功
4. **error**：错误消息
5. **roomList**：房间列表
6. **roomCreated**：房间创建成功
7. **roomJoined**：加入房间成功
8. **roomLeft**：离开房间成功
9. **gameState**：游戏状态
10. **playerAction**：玩家操作通知
11. **stageChange**：游戏阶段变化
12. **gameStart**：游戏开始
13. **roomEnding**：房间即将结束
14. **roomExtended**：房间时间延长
15. **roomEnded**：房间已结束
16. **roomReset**：房间重置成功
17. **playerKicked**：玩家被踢出

## 游戏规则

### 德州扑克基本规则
1. 每个玩家发2张底牌
2. 公共牌：翻牌（3张）、转牌（1张）、河牌（1张）
3. 下注轮次：盲注、翻牌、转牌、河牌
4. 牌型大小：皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌

### 房间规则
- 最小玩家数：4人
- 最大玩家数：12人
- 初始筹码：2000
- 支持设置房间结束时间
- 支持投票延长房间时间
- 支持投票重置房间（重置所有玩家筹码）
- 支持投票踢出玩家

## 卡牌皮肤

系统支持多种卡牌皮肤，默认提供：
- default：默认皮肤
- cat：猫咪主题皮肤

## 表情包

系统内置多种表情包：
- blackA
- blackcat
- gentu

## 注意事项

1. 注册需要邀请码：`xuerma`
2. 服务器默认端口：8080
3. 数据存储在JSON文件中，重启服务器后数据会保留
4. 支持WebSocket和SSE两种通信方式，适配不同设备

## 开发说明

### 服务器配置
- 端口：8080
- 最大房间数：5
- 静态文件目录：public/
- 头像存储目录：public/avatars/

### 扩展功能
- 可添加新的卡牌皮肤到 public/card-skins/ 目录
- 可添加新的表情包到 public/emojis/ 目录
- 可修改 server/data/cardSkins.json 和 server/data/emojiCollections.json 配置文件

## 故障排除

1. **服务器启动失败**：检查端口是否被占用，尝试使用其他端口
2. **WebSocket连接失败**：检查网络连接，确保服务器正在运行
3. **头像上传失败**：检查文件大小和格式，确保服务器有写入权限
4. **游戏状态不同步**：尝试刷新页面或重新连接

## 许可证

ISC License
