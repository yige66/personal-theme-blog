import Image from 'next/image';
import Link from 'next/link';
import { ArticleExplorer } from '@/components/ArticleExplorer';
import { AssistantCard } from '@/components/AssistantCard';
import { ExperienceShowcase } from '@/components/ExperienceShowcase';
import { PostCard } from '@/components/PostCard';
import { GalleryTile, ProjectCard } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import {
  estimateReadingMinutes,
  formatDate,
  getBlogData,
  getBlogStats,
  getFeaturedProjects,
  getPublishedPosts
} from '@/lib/blog';
import { createWebsiteJsonLd, toJsonLd } from '@/lib/seo';

export default async function HomePage() {
  const [data, posts, stats, projects] = await Promise.all([getBlogData(), getPublishedPosts(), getBlogStats(), getFeaturedProjects()]);
  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const regularPosts = posts.filter((post) => post.id !== featuredPost?.id).slice(0, 4);
  const galleryPreview = data.site.gallery.slice(0, 3);
  const primaryGallery = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];
  const activeTrack = data.site.music[0];
  const latestNote = data.notes[0];
  const websiteJsonLd = createWebsiteJsonLd(data);
  const featuredImage = featuredPost?.cover || primaryGallery?.image || data.site.heroImage;
  const featuredTitle = featuredPost?.title || data.site.title;
  const featuredSummary = featuredPost?.summary || data.site.subtitle;
  const featuredHref = featuredPost ? `/posts/${featuredPost.slug}` : '/archive';
  const featuredMeta = featuredPost ? `${formatDate(featuredPost.updatedAt)} / ${estimateReadingMinutes(featuredPost.content)} min read` : '等待发布第一篇文章';

  return (
    <main className="xh-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }} />
      <section className="hero-stage xh-hero" id="top" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
        <SiteNav title={data.site.title} />

        <div className="main-shell xh-hero-shell">
          <article className="xh-profile-card" aria-labelledby="home-profile-name">
            <div className="xh-avatar-shell">
              <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={156} height={156} priority />
            </div>
            <p className="xh-greeting">Hi, I am</p>
            <h1 id="home-profile-name">{data.site.owner || data.site.title}</h1>
            <p className="xh-role">{data.site.role}</p>
            <p className="xh-motto">{data.site.motto}</p>

            <div className="xh-connect" aria-label="站点连接状态">
              <span className="xh-connect-dot" aria-hidden="true" />
              <strong>CONNECTING</strong>
              <small>{data.site.status}</small>
            </div>

            <div className="xh-profile-stats" aria-label="站点内容数据">
              <span><strong>{stats.posts}</strong><small>Articles</small></span>
              <span><strong>{stats.notes}</strong><small>Moments</small></span>
              <span><strong>{stats.gallery}</strong><small>Photos</small></span>
            </div>

            <div className="xh-profile-actions">
              <Link className="button primary" href="/archive">开始阅读</Link>
              <Link className="button ghost" href="/gallery">照片墙</Link>
              <a className="button ghost" href={data.site.github} target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </article>

          <aside className="xh-side-stack" aria-label="首页精选入口">
            <Link className="xh-insight-card" href={featuredHref}>
              <Image src={featuredImage} alt={`${featuredTitle} 封面`} width={820} height={460} priority />
              <div>
                <p className="eyebrow">Latest Insight</p>
                <h2>{featuredTitle}</h2>
                <span>{featuredSummary}</span>
                <small>{featuredMeta}</small>
              </div>
            </Link>

            <div className="xh-mini-grid">
              <Link className="xh-mini-card xh-photo-card" href="/gallery">
                <Image src={primaryGallery?.image || data.site.heroImage} alt={primaryGallery?.alt || primaryGallery?.title || '照片墙预览'} width={520} height={360} />
                <strong>{primaryGallery?.title || '照片墙'}</strong>
                <span>{primaryGallery?.description || '展示图片、头像与视觉素材可在后台维护。'}</span>
              </Link>
              <Link className="xh-mini-card" href="/moments">
                <strong>{latestNote?.title || 'Recent Record'}</strong>
                <span>{latestNote?.content || data.site.motto}</span>
                <small>{latestNote?.date || '等待第一条动态'}</small>
              </Link>
            </div>

            <div className="xh-runtime-grid">
              <Link className="xh-system-card" href="/music">
                <span>Now Playing</span>
                <strong>{activeTrack?.title || '歌单待添加'}</strong>
                <small>{activeTrack ? `${activeTrack.artist} / ${activeTrack.mood}` : '后台可维护音乐标题、封面和音频地址'}</small>
              </Link>
              <Link className="xh-system-card" href="/console">
                <span>Runtime</span>
                <strong>{data.site.streak} days</strong>
                <small>内容、头像、头图、音乐与照片均由后台数据驱动。</small>
              </Link>
            </div>
          </aside>
        </div>

        <div className="main-shell xh-tech-strip" aria-label="站点技术与发布状态">
          <span><strong>{data.site.title}</strong> / Deployable personal blog</span>
          <span>Next.js</span>
          <span>React</span>
          <span>GitHub</span>
          <span>Vercel</span>
          <span>JSON CMS</span>
        </div>
      </section>

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
