# 网盘资源发布系统

一个基于Vue3、TypeScript、Element Plus和Supabase的网盘资源发布系统，支持资源发布、购买、支付和管理功能。

## 功能特性

### 用户功能
- ✅ 无需登录即可浏览所有已发布资源
- ✅ 注册和登录系统
- ✅ 发布和管理个人资源
- ✅ 购买付费资源（微信扫码支付）
- ✅ 查看订单记录和购买历史
- ✅ 下载已购买资源

### 资源管理
- ✅ 资源分类（软件、游戏、教育、娱乐等）
- ✅ 网盘平台支持（百度网盘、阿里云盘等）
- ✅ 付费/免费资源设置
- ✅ 草稿和发布状态管理
- ✅ 资源标签系统
- ✅ 资源统计（浏览量、购买量）

### 支付系统
- ✅ 微信扫码支付集成（蓝兔支付）
- ✅ 订单状态跟踪
- ✅ 支付状态轮询
- ✅ 支付成功回调处理

### 管理功能
- ✅ 个人资源统计
- ✅ 订单管理
- ✅ 用户购买记录
- ✅ 资源审核和管理

## 技术栈

### 前端
- Vue 3 (Composition API)
- TypeScript
- Element Plus UI组件库
- Pinia 状态管理
- Vue Router 路由管理
- Tailwind CSS 样式框架

### 后端/数据库
- Supabase (PostgreSQL数据库)
- Supabase Auth (用户认证)
- Supabase Storage (文件存储)
- Row Level Security (行级安全)

### 支付集成
- 蓝兔支付API
- 微信扫码支付
- 支付回调处理

## 快速开始

### 1. 环境配置

复制环境变量配置文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下参数：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key

# 蓝兔支付配置（需要注册蓝兔支付账号）
VITE_LANTUZ_MCH_ID=your_lantuz_mch_id
VITE_LANTUZ_API_KEY=your_lantuz_api_key
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 3. 数据库初始化

在Supabase控制台中运行以下SQL脚本：

1. 首先运行 `supabase-config.sql` 创建基本表结构
2. 然后运行 `supabase-resources.sql` 创建资源相关表结构

### 4. 存储桶配置

在Supabase控制台中创建以下存储桶：

1. `avatars` - 用户头像（设置为公开）
2. `resource-covers` - 资源封面图片（设置为公开）

### 5. 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

访问 http://localhost:5173

## 数据库结构

### 主要表结构

#### resources 资源表
- `id` - UUID主键
- `user_id` - 用户ID（关联auth.users）
- `title` - 资源标题
- `description` - 资源描述（Markdown格式）
- `cover_url` - 封面图片URL
- `resource_url` - 资源链接（受保护）
- `category` - 资源分类
- `platform` - 网盘平台
- `price` - 价格
- `is_free` - 是否免费
- `status` - 状态（draft/published）
- `is_visible` - 显示状态
- `view_count` - 浏览量
- `purchase_count` - 购买量

#### orders 订单表
- `id` - UUID主键
- `order_no` - 订单号
- `user_id` - 用户ID
- `resource_id` - 资源ID
- `amount` - 订单金额
- `payment_channel` - 支付渠道
- `payment_status` - 支付状态
- `external_order_no` - 外部订单号
- `qr_code_url` - 支付二维码URL
- `expires_at` - 订单过期时间

#### user_purchases 用户购买记录表
- `id` - UUID主键
- `user_id` - 用户ID
- `resource_id` - 资源ID
- `order_id` - 订单ID
- `resource_url` - 购买时的资源链接

### 枚举类型
- `resource_category` - 资源分类枚举
- `cloud_platform` - 网盘平台枚举
- `resource_status` - 资源状态枚举
- `order_status` - 订单状态枚举
- `payment_channel` - 支付渠道枚举

## API服务

### ResourceService 资源服务
- `getResources()` - 获取资源列表
- `getResource()` - 获取资源详情
- `createResource()` - 创建资源
- `updateResource()` - 更新资源
- `deleteResource()` - 删除资源
- `getUserResources()` - 获取用户资源
- `getUserResourceStats()` - 获取用户资源统计

### OrderService 订单服务
- `createOrder()` - 创建订单
- `getOrder()` - 获取订单详情
- `getUserOrders()` - 获取用户订单
- `updatePaymentStatus()` - 更新支付状态
- `getOrderStats()` - 获取订单统计

### LantuzPayService 支付服务
- `createNativePayment()` - 创建扫码支付
- `queryOrder()` - 查询订单状态
- `handlePaymentCallback()` - 处理支付回调
- `pollOrderStatus()` - 轮询订单状态

## 项目结构

```
src/
├── components/          # 公共组件
│   └── resources/      # 资源相关组件
│       └── ResourceCard.vue
├── services/           # API服务
│   ├── resourceService.ts
│   ├── orderService.ts
│   └── lantuzPayService.ts
├── stores/             # Pinia状态管理
│   ├── auth.ts        # 认证状态
│   └── avatar.ts      # 头像状态
├── types/              # TypeScript类型定义
│   └── resources.ts   # 资源相关类型
├── utils/              # 工具函数
│   └── supabase.ts    # Supabase客户端
└── views/              # 页面组件
    ├── resources/      # 资源相关页面
    │   ├── ResourcesView.vue        # 资源列表
    │   ├── ResourceDetailView.vue   # 资源详情
    │   ├── CreateResourceView.vue   # 创建资源
    │   ├── EditResourceView.vue     # 编辑资源
    │   └── MyResourcesView.vue      # 我的资源
    ├── orders/         # 订单相关页面
    │   ├── OrdersView.vue          # 订单列表
    │   └── OrderDetailView.vue     # 订单详情
    └── HomeView.vue    # 主页
```

## 部署指南

### 构建生产版本

```bash
npm run build
# 或
pnpm build
# 或
yarn build
```

### 部署到Vercel

1. 安装Vercel CLI：`npm i -g vercel`
2. 运行 `vercel` 命令部署
3. 配置环境变量

### 部署到Netlify

1. 连接GitHub仓库到Netlify
2. 配置构建命令：`npm run build`
3. 配置发布目录：`dist`
4. 设置环境变量

## 支付配置

### 蓝兔支付注册
1. 访问 https://www.ltzf.cn 注册账号
2. 完成商户认证
3. 获取商户号和API密钥

### 支付回调配置
1. 在蓝兔支付后台配置支付回调URL
2. 回调URL格式：`https://your-domain.com/api/payment/callback`
3. 确保服务器能处理POST请求

### 安全配置
1. 在蓝兔支付后台配置IP白名单
2. 设置API密钥访问权限
3. 定期更新API密钥

## 开发指南

### 添加新的资源分类
1. 在 `src/types/resources.ts` 中添加枚举值
2. 更新数据库枚举类型
3. 更新前端显示映射

### 添加新的网盘平台
1. 在 `src/types/resources.ts` 中添加平台枚举
2. 更新数据库枚举类型
3. 更新前端显示映射

### 自定义样式
系统使用Tailwind CSS，可以通过以下方式自定义：

1. 修改 `tailwind.config.js` 配置文件
2. 在组件中使用CSS模块
3. 覆盖Element Plus主题

## 常见问题

### Q: 支付二维码不显示？
A: 检查以下配置：
1. 蓝兔支付配置是否正确
2. 是否设置了IP白名单
3. API密钥是否有支付权限

### Q: 资源链接无法访问？
A: 检查以下配置：
1. Supabase RLS策略是否正确
2. 用户是否已购买资源
3. 资源是否为免费资源

### Q: 图片上传失败？
A: 检查以下配置：
1. Supabase Storage是否配置正确
2. 文件大小是否超过限制
3. 文件格式是否支持

### Q: 数据库查询缓慢？
A: 建议：
1. 为常用查询字段添加索引
2. 优化SQL查询语句
3. 使用数据库连接池

## 安全注意事项

1. **API密钥安全**：不要将API密钥提交到版本控制系统
2. **SQL注入防护**：使用参数化查询
3. **XSS防护**：对用户输入进行转义
4. **CSRF防护**：使用CSRF令牌
5. **文件上传限制**：限制文件类型和大小
6. **支付安全**：验证支付回调签名

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 项目维护者邮箱

---

**感谢使用网盘资源发布系统！**