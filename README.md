# 星屿手记 Personal Theme Blog

一个向 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 学习范式的个人博客：前台是可部署的 Next.js App Router 站点，内容通过 `data/blog.json` 进入版本库，再由 GitHub 和 Vercel 完成预览、构建与生产发布。

## 当前定位

- `沉浸式前台`：玻璃拟态首页、个人名片、等级经验、音乐挂件、AI 助手卡、文章星图、动态、灵境照片墙、文章详情页、自定义 404 和 SEO metadata。
- `站点型 IA`：归档、标签、项目、音乐、照片墙、动态/说说、友链、关于、发布工作流入口。
- `内容数据源`：`data/blog.json` 承载文章、草稿、动态、友链、站点资料、歌单、相册和项目。
- `发布方式`：内容直接进入版本库；线上交付以 GitHub 仓库、CI 质量门禁和 Vercel 部署为主。

## 运行

安装依赖：

```powershell
npm install
```

启动 Next.js 前台：

```powershell
npm run dev
```

## 部署

推荐生产流程：

1. 修改 `data/blog.json`、`public/assets/` 和源码。
2. 运行 `npm run check`。
3. 提交并推送到 GitHub。
4. 在 Vercel 导入 `https://github.com/yige66/personal-theme-blog`。
5. 设置环境变量 `NEXT_PUBLIC_SITE_URL` 为你的正式域名。
6. 让 Vercel 通过 GitHub push 自动生成 Preview 和 Production。

Vercel 推荐配置已写入 `vercel.json`：

- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `.next`

更多细节见 [docs/deployment.md](docs/deployment.md)。

## 项目结构

```text
personal-theme-blog/
├─ app/                    # Next.js App Router 前台
├─ components/             # 首页、文章和子页体验组件
├─ lib/blog.ts             # JSON 内容读取、统计和 Markdown 渲染
├─ public/assets/img/      # Next.js 静态资源
├─ data/blog.json          # 内容与站点配置
├─ docs/deployment.md      # 部署工作流说明
└─ .github/workflows/ci.yml # GitHub Actions 质量门禁
```

## 已向 XHBlogs 学习并落地的能力

- 高完成度玻璃拟态首页与响应式子页
- 个人名片、等级经验、连续写作天数
- 文章归档、标签云、项目集、动态/说说
- 音乐、灵境照片墙、友链、关于页
- 评论系统配置占位和 AI 助手提示词配置占位
- JSON 内容源 + GitHub/Vercel 发布工作流
- GitHub Actions CI、Vercel 构建配置和部署文档

## 验证

```powershell
node --test
npx tsc --noEmit
npm run build
npm run check
```

如果 PowerShell 禁止执行 `npm.ps1`，可以使用：

```powershell
npm.cmd run build
npm.cmd run check
```
