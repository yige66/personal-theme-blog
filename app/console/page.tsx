import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.console;

export default async function ConsolePage() {
  const data = await getBlogData();

  return (
    <main className="article-page console-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <section className="article-shell console-shell">
        <p className="eyebrow">Deploy Workflow</p>
        <h1>发布工作流控制台</h1>
        <p className="article-summary">
          站点以前台可部署为第一目标：内容进入 data/blog.json，GitHub 保存版本，Vercel 负责预览与生产构建。本地写作后台保留为编辑辅助，线上访客只看到公开内容。
        </p>
        <div className="console-steps">
          <span>1. 使用本地后台或直接编辑 data/blog.json，维护文章、动态、音乐、照片墙、友链和站点资料。</span>
          <span>2. 执行 npm run check，确认测试、构建和内容数据都能通过。</span>
          <span>3. 提交 data、public/assets 和源码变更，让每次发布都有可回滚版本。</span>
          <span>4. 推送到 GitHub 后，Vercel 自动生成 Preview；合入生产分支后发布正式站点。</span>
        </div>
        <div className="deploy-panels" aria-label="发布链路">
          <article>
            <strong>Content</strong>
            <span>JSON 数据承载文章、说说、音乐、照片墙、友链和站点资料。</span>
          </article>
          <article>
            <strong>GitHub</strong>
            <span>仓库保存源码和内容版本，支持审查、回滚和自动化质量门禁。</span>
          </article>
          <article>
            <strong>Vercel</strong>
            <span>每次推送生成可访问预览，生产分支负责公开域名部署。</span>
          </article>
        </div>
        <div className="hero-actions">
          <a className="button primary" href="https://github.com/yige66/personal-theme-blog" target="_blank" rel="noreferrer">打开 GitHub 仓库</a>
          <Link className="button ghost" href="/archive">查看文章归档</Link>
          <Link className="button ghost" href="/">返回首页</Link>
        </div>
      </section>
    </main>
  );
}
