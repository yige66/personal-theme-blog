import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.console;

export default async function ConsolePage() {
  const data = await getBlogData();

  return (
    <main className="article-page console-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <section className="article-shell console-shell">
        <p className="eyebrow">Deploy Workflow</p>
        <h1>发布工作流控制台</h1>
        <p className="article-summary">
          站点以前台可部署为目标：内容进入本地数据文件，图片进入公开资源目录，GitHub 保存版本，Vercel 负责预览与生产构建。线上访客只看到公开内容，发布链路保持轻量可回滚。
        </p>
        <div className="console-steps">
          <span>1. 在后台操作系统里维护文章、动态、音乐、照片墙、友链和站点资料。</span>
          <span>2. 执行 npm run check，确认测试、类型检查和构建都能通过。</span>
          <span>3. 提交数据、public/assets 和源码变更，让每次发布都有可回滚版本。</span>
          <span>4. 推送到 GitHub 后，Vercel 自动生成 Preview；合入生产分支后发布正式站点。</span>
        </div>
        <div className="deploy-panels" aria-label="发布链路">
          <article>
            <strong>Content</strong>
            <span>后台表单承载文章、说说、音乐、照片墙、友链和站点资料。</span>
          </article>
          <article>
            <strong>Assets</strong>
            <span>封面图、头像、背景图和相册图片进入 public/assets，可以直接被前台访问。</span>
          </article>
          <article>
            <strong>Vercel</strong>
            <span>每次推送生成可访问预览，生产分支负责公开域名部署。</span>
          </article>
        </div>
        <div className="hero-actions">
          <Link className="button primary" href="/admin">打开后台操作系统</Link>
          <a className="button primary" href="https://github.com/yige66/personal-theme-blog" target="_blank" rel="noreferrer">打开 GitHub 仓库</a>
          <Link className="button ghost" href="/archive">查看文章归档</Link>
          <Link className="button ghost" href="/">返回首页</Link>
        </div>
      </section>
    </main>
  );
}
