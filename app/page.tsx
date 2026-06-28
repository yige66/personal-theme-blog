import Image from 'next/image';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import {
  estimateReadingMinutes,
  formatDate,
  getBlogData,
  getBlogStats,
  getPublishedPosts
} from '@/lib/blog';
import { createWebsiteJsonLd, toJsonLd } from '@/lib/seo';

export default async function HomePage() {
  const [data, posts, stats] = await Promise.all([getBlogData(), getPublishedPosts(), getBlogStats()]);
  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const latestPosts = posts.slice(0, 4);
  const activeTrack = data.site.music[0];
  const primaryGallery = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];
  const latestNote = data.notes[0];
  const websiteJsonLd = createWebsiteJsonLd(data);
  const githubIsExternal = data.site.github.startsWith('http');

  return (
    <main className="xh-home" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }} />
      <SiteNav title={data.site.title} />

      <section className="main-shell xh-portal-grid" aria-label="首页入口">
        <article className="xh-portal-profile" data-motion="portal-card">
          <div className="xh-avatar-shell">
            <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={132} height={132} priority />
          </div>
          <h1>{data.site.owner || data.site.title}</h1>
          <p className="xh-role">{data.site.role}</p>
          <p className="xh-motto">{data.site.bio || data.site.motto}</p>
          <div className="xh-profile-stats" aria-label="站点数据">
            <span><strong>{stats.posts}</strong><small>文章</small></span>
            <span><strong>{stats.notes}</strong><small>动态</small></span>
            <span><strong>{stats.gallery}</strong><small>相册</small></span>
          </div>
          <div className="xh-profile-actions">
            <Link href="/about">关于我</Link>
            <a href={data.site.github} target={githubIsExternal ? '_blank' : undefined} rel={githubIsExternal ? 'noreferrer' : undefined}>GitHub</a>
          </div>
        </article>

        <Link className="xh-cloud-player-card" href="/music" data-motion="portal-card" aria-label="打开音乐页">
          <div className="xh-disc-cover">
            <Image src={activeTrack?.cover || data.site.heroImage} alt={`${activeTrack?.title || '音乐'} 封面`} width={220} height={220} priority />
          </div>
          <div className="xh-cloud-copy">
            <p className="eyebrow">Cloud Music</p>
            <h2>{activeTrack?.title || '歌单待补充'}</h2>
            <p>{activeTrack?.artist || 'Local Playlist'}</p>
            <strong>{activeTrack?.note || '把写作、阅读和编码时的背景音乐收进这里。'}</strong>
          </div>
          <div className="xh-player-progress" aria-hidden="true">
            <span>00:00</span>
            <i><b /></i>
            <span>02:40</span>
          </div>
        </Link>

        <div className="xh-lyric-strip" data-motion="portal-card" aria-label="当前歌词">
          <span>{activeTrack?.note || data.site.motto}</span>
        </div>

        <section className="xh-latest-card" data-motion="stack-card" aria-label="最新文章">
          <Image
            src={featuredPost?.cover || data.site.heroImage}
            alt={`${featuredPost?.title || data.site.title} 封面`}
            width={960}
            height={720}
            priority
            data-motion="image-scale"
          />
          <div>
            <p className="eyebrow">Latest Post</p>
            <time>{featuredPost ? formatDate(featuredPost.updatedAt) : 'Soon'}</time>
            <h2>{featuredPost?.title || '第一篇文章正在准备中'}</h2>
            <span>{featuredPost?.summary || data.site.subtitle}</span>
            <small>{featuredPost ? `${estimateReadingMinutes(featuredPost.content)} min read` : '等待后台发布'}</small>
            <Link href={featuredPost ? `/posts/${featuredPost.slug}` : '/archive'}>继续阅读</Link>
            <nav aria-label="近期文章">
              {latestPosts.map((post) => (
                <Link href={`/posts/${post.slug}`} key={post.id}>{post.title}</Link>
              ))}
            </nav>
          </div>
        </section>

        <div className="xh-composite-grid">
          <Link className="xh-photo-poster" href="/gallery" data-motion="stack-card">
            <Image src={primaryGallery?.image || data.site.heroImage} alt={primaryGallery?.alt || primaryGallery?.title || '照片墙'} width={720} height={520} data-motion="image-scale" />
            <div>
              <p className="eyebrow">Photo Wall</p>
              <h2>{primaryGallery?.title || '照片墙'}</h2>
              <span>{primaryGallery?.description || '头像、头图、项目截图和日常素材都在这里归档。'}</span>
            </div>
          </Link>

          <Link className="xh-record-card" href="/moments" data-motion="stack-card">
            <p className="eyebrow">Moments</p>
            <time>{latestNote?.date ? formatDate(latestNote.date) : 'Soon'}</time>
            <h2>{latestNote?.title || '近期动态'}</h2>
            <p>{latestNote?.content || data.site.status}</p>
          </Link>

          <Link className="xh-mode-card" href="/console" data-motion="stack-card">
            <span aria-hidden="true" />
            <p className="eyebrow">Console</p>
            <h2>后台配置入口</h2>
            <p>站点名称、头像、背景、音乐、弹幕和友链都应从这里维护。</p>
          </Link>
        </div>

        <section className="xh-site-dashboard" data-motion="portal-card" aria-label="站点运行状态">
          <div><strong>{data.site.streak} days</strong><span>持续维护</span></div>
          <div><strong>{stats.words}</strong><span>内容字数</span></div>
          <div><strong>{stats.projects}</strong><span>项目入口</span></div>
          <div className="xh-stack-list">
            <span>Next.js 16</span>
            <span>React 19</span>
            <span>GitHub</span>
            <span>Vercel</span>
          </div>
        </section>
      </section>
    </main>
  );
}
