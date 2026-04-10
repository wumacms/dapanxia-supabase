# 在Vite项目中使用 TailwindCSS

将 Tailwind CSS 安装为 Vite 插件是将其与 Laravel、SvelteKit、React Router、Nuxt 和 SolidJS 等框架集成的最无缝方式。

#### 创建您的项目

如果您还没有 Vite 项目，请先创建一个新的 Vite 项目。最常用的方法是使用 [Create Vite 命令 ](https://vite.dev/guide/#scaffolding-your-first-vite-project)。

```shell
npm create vite@latest my-project
cd my-project
```

#### 安装 Tailwind CSS

通过 npm 安装 `tailwindcss` 和 `@tailwindcss/vite` 。

```shell
npm install tailwindcss @tailwindcss/vite
```

#### 配置 Vite 插件

将 `@tailwindcss/vite` 插件添加到您的 Vite 配置中。

```shell
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

#### 导入 Tailwind CSS

在你的 CSS 文件中添加 `@import` 语句，导入 Tailwind CSS。

```css
@import "tailwindcss";
```

#### 开始构建过程

使用 `npm run dev` 或 `package.json` 文件中配置的任何命令来运行构建过程。

```shell
npm run dev
```

#### 开始在你的 HTML 中使用 Tailwind

确保已编译的 CSS 包含在 `<head> 中 ` *（您的框架可能会为您处理此操作）* ，然后开始使用 Tailwind 的实用类来设置内容样式。

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="/src/style.css" rel="stylesheet">
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

