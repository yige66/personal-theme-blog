# GitHub / Gitalk 评论部署指南

本站评论系统对齐 XingHuiSama 参考页的 Gitalk 形态：页面渲染标准 `.gt-container`、`.gt-header-textarea`、`.gt-btn-login` 和 GitHub Issues 评论列表。参考站使用独立评论仓库 `XHSBlogComment`，本站也建议使用一个专门的公开 Issues 仓库承载评论。

## 1. 创建评论仓库

在你的 GitHub 账号下创建一个公开仓库，例如：

```text
yige66/personal-theme-blog-comments
```

进入仓库 `Settings`，确保 `Features -> Issues` 已开启。Gitalk 会把每个页面映射到一个 Issue，访客登录 GitHub 后在对应 Issue 下评论。

## 2. 创建 GitHub OAuth App

在 GitHub 进入 `Settings` -> `Developer settings` -> `OAuth Apps` -> `New OAuth App`。

- `Application name`：例如 `Yuki Blog Comments`
- `Homepage URL`：你的站点域名，例如 `https://your-vercel-domain.vercel.app`
- `Authorization callback URL`：同一个正式域名，例如 `https://your-vercel-domain.vercel.app`

创建后复制 `Client ID`，再生成一个 `Client Secret`。`Client ID` 可以公开，`Client Secret` 只能放在服务端环境变量里。不要复用 XingHuiSama 站点 bundle 里暴露的 OAuth 凭证，那属于对方的应用。

## 3. 配置站点环境变量

本地 `.env.local` 或 Vercel Project Environment Variables 至少需要：

```env
NEXT_PUBLIC_GITALK_OWNER=yige66
NEXT_PUBLIC_GITALK_REPO=personal-theme-blog-comments
NEXT_PUBLIC_GITALK_ADMIN=yige66
NEXT_PUBLIC_GITALK_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITALK_ALLOWED_CALLBACK_ORIGIN=https://your-vercel-domain.vercel.app
GITHUB_COMMENTS_PROXY=/api/github
```

`/api/github` 是服务端 OAuth token 交换代理，会校验请求体、`client_id` 和允许的回调来源，再把服务端 `GITHUB_CLIENT_SECRET` 注入给 GitHub。这样可以得到参考站一样的 Gitalk 体验，同时避免把 secret 写进前端 bundle。

项目页和其他页面的 GitHub `Star` 使用同一个 OAuth App，但会走站点自己的 PKCE 登录回调，并把访问令牌放在 HttpOnly cookie 中。OAuth App 的 callback URL 保持为站点根地址，例如 `https://your-vercel-domain.vercel.app/`；Star 流程需要允许 `public_repo` scope。`GITHUB_STAR_OWNER` 用于限制可由站点代点 Star 的仓库所有者，默认是 `yige66`。

## 4. 验证

部署前运行：

```powershell
npm run check
```

上线后打开任意文章页、说说页或友链页，确认评论区出现：

- `未登录用户`
- `说点什么`
- `支持 Markdown 语法`
- `预览`
- `使用 GitHub 登录`

如果仍提示 Gitalk OAuth 未配置，优先检查 `NEXT_PUBLIC_GITALK_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、评论仓库 owner/repo 以及 OAuth App callback URL。
