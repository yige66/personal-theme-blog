# 星屿手记 Personal Theme Blog

一个向 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 靠齐的个人博客系统：前台已升级为可部署的 Next.js App Router 博客，后台保留本地控制台用于文章、草稿、动态、友链、站点资料和备份管理。

## 当前定位

- `Next.js 前台`：玻璃拟态首页、个人名片、等级经验、音乐挂件、AI 助手卡、文章星图、动态、灵境照片墙、文章详情页、自定义 404、SEO metadata。
- `本地控制台`：沿用原本 Node.js CMS，支持登录保护、CSRF、文章 CRUD、草稿、站点配置、歌单/照片墙 JSON、动态、友链和导入导出。
- `数据源`：`data/blog.json`。本地控制台写入数据，Next.js 前台读取同一份数据用于构建与部署。

## 运行

安装依赖：

```powershell
npm install
```

启动可部署前台：

```powershell
npm run dev
```

默认打开：`http://localhost:3000`

启动本地内容控制台：

```powershell
npm run cms
```

默认打开：

- 前台旧静态预览：`http://localhost:4173/`
- 本地控制台：`http://localhost:4173/admin.html`

## 构建与部署

```powershell
npm run build
npm run start
```

部署到 Vercel 时，选择 Next.js 项目即可。当前版本没有把后台写入接口部署为线上 CMS；推荐流程是：

1. 本地运行 `npm run cms` 写文章、改配置、导出备份。
2. 确认 `data/blog.json` 已更新。
3. 运行 `npm run build` 检查 Next 前台。
4. 将项目推送到 GitHub，由 Vercel 构建部署。

## 项目结构

```text
personal-theme-blog/
├─ app/                    # Next.js App Router 前台
├─ components/             # 首页和文章组件
├─ lib/blog.ts             # JSON 内容读取、统计和 Markdown 渲染
├─ public/assets/img/      # Next.js 静态资源
├─ admin.html              # 本地控制台页面
├─ server.js               # 本地 CMS/API 服务
├─ assets/                 # 本地控制台和旧前台资源
├─ data/blog.json          # 内容与站点配置
└─ tests/server.test.js    # 本地 CMS API 测试
```

## 已向 XHBlogs 同步的能力

- 高颜值玻璃拟态首页
- 独立本地后台控制台
- Markdown 文章与草稿
- 个人名片、等级经验、连续写作天数
- 动态/说说区
- 音乐挂件数据结构
- 灵境/照片墙数据结构
- 评论系统配置占位
- AI 助手提示词配置占位
- 可部署 Next.js 前台与 Vercel 构建脚本

## 验证

```powershell
node --check server.js
node --test
npm run build
```

如果 PowerShell 禁止执行 `npm.ps1`，可以使用：

```powershell
npm.cmd run build
npm.cmd run check
```
