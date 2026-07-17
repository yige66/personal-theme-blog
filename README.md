#  Personal Theme Blog



## 当前定位

- `沉浸式前台`：玻璃拟态首页、个人名片、等级经验、音乐挂件、AI 助手卡、文章星图、动态、灵境照片墙、文章详情页、自定义 404 和 SEO metadata。
- `站点型 IA`：归档、标签、项目、音乐、照片墙、动态/说说、友链、关于、发布工作流入口。
- `内容数据源`：生产环境从私有 Vercel Blob 读取文章、草稿、动态、友链、站点资料、歌单、相册和项目；`data/blog.json` 作为本地开发和初始种子。
- `发布方式`：源码通过 GitHub/Vercel 发布；内容和媒体可在 `/admin` 鉴权后保存到 Blob，无需为每次内容修改重新提交代码。

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

1. 将仓库连接到 Vercel，并让 GitHub push 自动生成 Preview 和 Production。
2. 连接一个私有 Blob 存储用于博客 JSON，并连接一个公共 Blob 存储用于图片和音频。
3. 配置 `ADMIN_WRITE_TOKEN`、`BLOB_READ_WRITE_TOKEN`、`BLOB_PUBLIC_STORE_ID` 和 `NEXT_PUBLIC_SITE_URL`。
4. 打开 `/admin`，输入后台密码并读取线上数据。
5. 编辑后点击“保存数据”，前台下一次请求会读取最新内容。
6. 源码变更仍需运行 `npm run check` 后提交并推送到 GitHub。

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
├─ lib/blog.ts             # Blob/本地内容读取、统计和 Markdown 渲染
├─ public/assets/img/      # Next.js 静态资源
├─ data/blog.json          # 本地开发回退与 Blob 初始种子
├─ docs/deployment.md      # 部署工作流说明
└─ .github/workflows/ci.yml # GitHub Actions 质量门禁
```

## 已向 XHBlogs 学习并落地的能力

- 高完成度玻璃拟态首页与响应式子页
- 个人名片、等级经验、连续写作天数
- 文章归档、标签云、项目集、动态/说说
- 音乐、灵境照片墙、友链、关于页
- 评论系统配置占位和 AI 助手提示词配置占位
- Vercel Blob 在线后台内容源 + GitHub/Vercel 代码发布工作流
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

## AI runtime configuration

Production deployments must define `DEEPSEEK_API_KEY` on the server, plus
`DEEPSEEK_PET_MODEL=deepseek-v4-flash` (or `DEEPSEEK_MODEL` as the fallback). Do not
use a `NEXT_PUBLIC_` prefix for the API key. After deployment, use `/admin` to load
the DeepSeek settings and confirm that the key source is `backend` or `env`.
