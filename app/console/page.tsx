import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function ConsolePage() {
  const data = await getBlogData();

  return (
    <main className="article-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <section className="article-shell console-shell">
        <p className="eyebrow">Local Console</p>
        <h1>双轨内容控制台</h1>
        <p className="article-summary">
          部署前台读取 data/blog.json 构建内容；文章、草稿、动态、歌单、照片墙、项目、友链和站点资料继续通过本地控制台维护。
        </p>
        <div className="console-steps">
          <span>1. npm run cms</span>
          <span>2. 打开 http://localhost:4173/admin.html</span>
          <span>3. 保存内容后执行 npm run build</span>
          <span>4. 推送到 GitHub / Vercel 部署</span>
        </div>
        <div className="hero-actions">
          <a className="button primary" href="http://localhost:4173/admin.html">打开本地控制台</a>
          <Link className="button ghost" href="/">返回首页</Link>
        </div>
      </section>
    </main>
  );
}
