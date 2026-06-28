import Image from 'next/image';
import Link from 'next/link';
import { ArticleExplorer } from '@/components/ArticleExplorer';
import { AssistantCard } from '@/components/AssistantCard';
import { ExperienceShowcase } from '@/components/ExperienceShowcase';
import { MusicWidget } from '@/components/MusicWidget';
import { PostCard } from '@/components/PostCard';
import { ProfileCard } from '@/components/ProfileCard';
import { GalleryTile, ProjectCard, StatPortal } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { formatDate, getBlogData, getBlogStats, getFeaturedProjects, getPublishedPosts } from '@/lib/blog';
import { createWebsiteJsonLd, toJsonLd } from '@/lib/seo';

export default async function HomePage() {
  const [data, posts, stats, projects] = await Promise.all([getBlogData(), getPublishedPosts(), getBlogStats(), getFeaturedProjects()]);
  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const regularPosts = posts.filter((post) => post.id !== featuredPost?.id).slice(0, 4);
  const galleryPreview = data.site.gallery.slice(0, 3);
  const websiteJsonLd = createWebsiteJsonLd(data);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }} />
      <section className="hero-stage" id="top" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
        <SiteNav title={data.site.title} />

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">XHBlogs Inspired Personal System</p>
            <h1>{data.site.title}</h1>
            <p>{data.site.subtitle}</p>
            <div className="hero-actions">
              <Link className="button primary" href="/archive">开始阅读</Link>
              <Link className="button ghost" href="/projects">查看项目</Link>
              <Link className="button ghost" href="/about">关于我</Link>
            </div>
            <div className="hero-metrics" aria-label="博客数据">
              <span><strong>{stats.posts}</strong>已发布</span>
              <span><strong>{stats.words}</strong>字数估算</span>
              <span><strong>{stats.projects}</strong>项目</span>
            </div>
          </div>

          <div className="hero-stack">
            <ProfileCard site={data.site} stats={stats} />
            <MusicWidget tracks={data.site.music} />
          </div>
        </div>
      </section>

      <StatPortal stats={stats} />

      <ExperienceShowcase data={data} stats={stats} projects={projects} />

      <section className="main-shell feature-grid">
        {featuredPost ? <PostCard post={featuredPost} featured /> : null}
        <AssistantCard site={data.site} posts={posts} notes={data.notes} />
      </section>

      <section className="main-shell post-teasers" aria-label="最新文章">
        {regularPosts.map((post) => <PostCard key={post.id} post={post} />)}
      </section>

      <section className="main-shell projects-section">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Projects</p>
            <h2>作品与实验场</h2>
          </div>
          <Link className="text-link" href="/projects">全部项目</Link>
        </div>
        <div className="project-grid">
          {projects.map((project) => <ProjectCard project={project} key={project.id} />)}
        </div>
      </section>

      <div className="main-shell">
        <ArticleExplorer posts={posts} />
      </div>

      <section className="main-shell moments-grid" id="moments">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Moments</p>
            <h2>近期动态</h2>
          </div>
          <Link className="text-link" href="/moments">查看动态流</Link>
        </div>
        <div className="moment-list">
          {data.notes.slice(0, 6).map((note) => (
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
            <p className="eyebrow">Gallery</p>
            <h2>灵境照片墙</h2>
          </div>
          <Link className="text-link" href="/gallery">打开相册</Link>
        </div>
        <div className="gallery-grid">
          {galleryPreview.map((item) => <GalleryTile item={item} key={item.title} />)}
        </div>
      </section>

      <section className="main-shell links-section">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Links</p>
            <h2>站内外入口</h2>
          </div>
          <Link className="text-link" href="/links">全部链接</Link>
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
