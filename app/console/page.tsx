import Link from 'next/link';

export default function ConsolePage() {
  return (
    <main className="article-page">
      <nav className="article-nav">
        <Link href="/">返回首页</Link>
        <a href="http://localhost:4173/admin.html">打开本地控制台</a>
      </nav>
      <section className="article-shell console-shell">
        <p className="eyebrow">Local Console</p>
        <h1>双轨内容控制台</h1>
        <p className="article-summary">
          这个部署前台读取 data/blog.json 构建内容；文章、草稿、动态、歌单、照片墙和站点资料继续通过本地控制台维护。
        </p>
        <div className="console-steps">
          <span>1. npm run cms</span>
          <span>2. 打开 http://localhost:4173/admin.html</span>
          <span>3. 保存内容后执行 npm run build</span>
          <span>4. 推送到 GitHub / Vercel 部署</span>
        </div>
      </section>
    </main>
  );
}
