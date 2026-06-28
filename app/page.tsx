import Image from 'next/image';
import Link from 'next/link';
import { ArticleExplorer } from '@/components/ArticleExplorer';
import { AssistantCard } from '@/components/AssistantCard';
import { MusicWidget } from '@/components/MusicWidget';
import { PostCard } from '@/components/PostCard';
import { ProfileCard } from '@/components/ProfileCard';
import { formatDate, getBlogData, getBlogStats, getPublishedPosts } from '@/lib/blog';

export default async function HomePage() {
  const [data, posts, stats] = await Promise.all([getBlogData(), getPublishedPosts(), getBlogStats()]);
  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const regularPosts = posts.filter((post) => post.id !== featuredPost?.id).slice(0, 4);

  return (
    <main>
      <section className="hero-stage" id="top" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
        <nav className="top-nav" aria-label="主导航">
          <Link className="brand" href="#top">{data.site.title}</Link>
          <div>
            <Link href="#posts">文章</Link>
            <Link href="#moments">动态</Link>
            <Link href="#gallery">灵境</Link>
            <Link href="/console">控制台</Link>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">XHBlogs Inspired</p>
            <h1>{data.site.title}</h1>
            <p>{data.site.subtitle}</p>
            <div className="hero-actions">
              <Link className="button primary" href="#posts">开始阅读</Link>
              <Link className="button ghost" href="/console">内容控制台</Link>
            </div>
            <div className="hero-metrics" aria-label="博客数据">
              <span><strong>{stats.posts}</strong>已发布</span>
              <span><strong>{stats.words}</strong>字数估算</span>
              <span><strong>{stats.categories}</strong>分类</span>
            </div>
          </div>

          <div className="hero-stack">
            <ProfileCard site={data.site} stats={stats} />
            <MusicWidget tracks={data.site.music} />
          </div>
        </div>
      </section>

      <section className="main-shell feature-grid">
        {featuredPost ? <PostCard post={featuredPost} featured /> : null}
        <AssistantCard site={data.site} posts={posts} notes={data.notes} />
      </section>

      <section className="main-shell post-teasers" aria-label="最新文章">
        {regularPosts.map((post) => <PostCard key={post.id} post={post} />)}
      </section>

      <div className="main-shell">
        <ArticleExplorer posts={posts} />
      </div>

      <section className="main-shell moments-grid" id="moments">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Moments</p>
            <h2>个人关于动态</h2>
          </div>
          <p>{data.site.status}</p>
        </div>
        <div className="moment-list">
          {data.notes.map((note) => (
            <article className="glass-card moment-card" key={note.id}>
              <time dateTime={note.date}>{note.date}</time>
              <p>{note.content}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="main-shell gallery-section" id="gallery">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Workshop</p>
            <h2>灵境照片墙</h2>
          </div>
          <p>用可配置图片块承载项目截图、生活照片与作品集入口。</p>
        </div>
        <div className="gallery-grid">
          {data.site.gallery.map((item) => (
            <article className="gallery-item" key={item.title}>
              <Image src={item.image} alt={item.title} width={540} height={360} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="main-shell links-section">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Links</p>
            <h2>友链与入口</h2>
          </div>
          <p>保留 XHBlogs 式个人站入口，也兼容当前本地 CMS 管理。</p>
        </div>
        <div className="link-grid">
          {data.links.map((link) => (
            <a className="glass-card link-card" href={link.url} key={link.title} target={link.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              <strong>{link.title}</strong>
              <span>{link.description}</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {data.site.title}</span>
        <span>Last content sync: {posts[0] ? formatDate(posts[0].updatedAt) : '未发布'}</span>
      </footer>
    </main>
  );
}

