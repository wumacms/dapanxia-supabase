# Vite Supabase - Vue 3 + TypeScript 全栈应用模板

一个现代化的全栈 Web 应用模板，使用 Vue 3 + TypeScript + Vite 构建前端，Supabase 作为后端服务。

## ✨ 特性

- ⚡️ **Vue 3 + Vite** - 极速的开发体验
- 🦾 **TypeScript** - 类型安全的开发
- 🎨 **Element Plus** - 优雅的 UI 组件库
- 🔐 **Supabase** - 完整的后端即服务 (BaaS)
- 📦 **Pinia** - 现代化状态管理
- 🎯 **Vue Router** - 路由管理
- 🎨 **Tailwind CSS** - 实用优先的 CSS 框架
- 🔧 **ESLint + TypeScript** - 代码质量保证

## 🚀 快速开始

### 前置要求

- Node.js 18+ 或 20+
- [Supabase 账户](https://supabase.com/) (免费)

### 1. 克隆项目

```bash
git clone <repository-url>
cd vite-supabase
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入你的 Supabase 配置：

```env
# Supabase 配置
VITE_SUPABASE_URL=你的_Supabase_项目_URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=你的_Supabase_匿名密钥
```

### 4. 启动开发服务器

```bash
pnpm dev
```

应用将在 [http://localhost:5173](http://localhost:5173) 启动。

### 5. 构建生产版本

```bash
pnpm build
```

构建完成后，可以使用 `pnpm preview` 预览生产版本。

## 📁 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 可复用组件
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
│   └── auth.ts      # 认证状态管理
├── utils/           # 工具函数
│   └── supabase.ts  # Supabase 客户端配置
├── views/           # 页面组件
│   ├── HomeView.vue     # 首页
│   ├── LoginView.vue    # 登录页
│   └── RegisterView.vue # 注册页
├── App.vue          # 根组件
├── main.js          # 应用入口
└── style.css        # 全局样式
```

## 🔐 认证功能

项目已集成完整的认证流程：

- ✅ 用户注册
- ✅ 用户登录
- ✅ 路由守卫
- ✅ 持久化会话
- ✅ 自动刷新令牌

### 认证流程

1. **未认证用户**：只能访问登录页 (`/login`) 和注册页 (`/register`)
2. **已认证用户**：可以访问首页 (`/`) 和其他受保护页面
3. **路由守卫**：自动重定向到对应页面

## 📸 头像上传功能

项目集成了基于 Supabase Storage 的用户头像上传功能：

- ✅ 头像上传到 Supabase Storage
- ✅ 支持 JPG、PNG、GIF、WebP 格式
- ✅ 文件大小限制 2MB
- ✅ 自动生成缩略图 URL
- ✅ 用户头像预览
- ✅ 实时上传进度

### 数据库配置

完整的 Supabase 配置已整理在 [`supabase-config.sql`](./supabase-config.sql) 文件中，包含：

- **profiles 表** - 存储用户头像 URL
- **Storage avatars Bucket** - 存储头像文件
- **RLS 策略** - 确保用户数据隔离

**配置步骤：**

1. 进入 Supabase Dashboard → **SQL Editor**
2. 打开 [`supabase-config.sql`](./supabase-config.sql) 文件
3. 复制全部内容并执行
4. 进入 **Storage** → 确认 `avatars` bucket 已创建且为 **Public**

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/) (Composition API)
- **构建工具**: [Vite](https://vitejs.dev/)
- **类型系统**: [TypeScript](https://www.typescriptlang.org/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **CSS 框架**: [Tailwind CSS](https://tailwindcss.com/)
- **后端服务**: [Supabase](https://supabase.com/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由**: [Vue Router](https://router.vuejs.org/)
- **图标**: [Element Plus Icons](https://element-plus.org/en-US/component/icon.html)

## 📦 可用脚本

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm preview` - 预览生产版本
- `pnpm type-check` - 运行 TypeScript 类型检查

## 🔧 环境变量

| 变量名 | 描述 | 必填 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | 是 |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase 匿名密钥 | 是 |

## 📝 如何获取 Supabase 配置

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 创建新项目或选择现有项目
3. 进入 **Project Settings** → **API**
4. 复制：
   - **Project URL** → 作为 `VITE_SUPABASE_URL`
   - **anon public** 密钥 → 作为 `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE)
