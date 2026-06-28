import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="glass-card not-found-card">
        <p className="eyebrow">404</p>
        <h1>这片星图还没有记录</h1>
        <p>文章可能仍是草稿，也可能已经被重新归档。</p>
        <Link className="button primary" href="/">返回首页</Link>
      </section>
    </main>
  );
}
