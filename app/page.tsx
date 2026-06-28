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
  const primaryGallery = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];
  const secondaryGallery = data.site.gallery.find((item) => item.title !== primaryGallery?.title) ?? data.site.gallery[1] ?? primaryGallery;
  const activeTrack = data.site.music[0];
  const latestNote = data.notes[0];
  const websiteJsonLd = createWebsiteJsonLd(data);
  const featuredImage = featuredPost?.cover || primaryGallery?.image || data.site.heroImage;
  const featuredTitle = featuredPost?.title || '暂无文章';
  const featuredSummary = featuredPost?.summary || data.site.subtitle;
  const featuredHref = featuredPost ? `/posts/${featuredPost.slug}` : '/archive';
  const featuredMeta = featuredPost ? `${formatDate(featuredPost.updatedAt)} / ${estimateReadingMinutes(featuredPost.content)} min read` : '等待发布第一篇文章';
  const recordTitle = latestNote?.title || 'Recent Record';
  const recordText = latestNote?.content || data.site.status || data.site.motto;
  const githubHref = data.site.github || '/about';
  const githubIsExternal = githubHref.startsWith('http');

  return (
    <main className="xh-home xh-portal-home xh-scene-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }} />

      <section className="xh-portal-stage xh-scene-stage" id="top" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
        <SiteNav title={data.site.title} />

        <div className="main-shell xh-scene-shell">
          <form className="xh-search-orbit" role="search" aria-label="站内搜索入口" data-motion="portal-card">
            <span aria-hidden="true">⌕</span>
            <input type="search" name="q" placeholder="搜寻标题、标签、照片或灵感碎片..." />
          </form>

          <div className="xh-intro-row">
            <article className="xh-profile-panel" data-motion="portal-card" aria-labelledby="home-profile-name">
              <div className="xh-profile-identity">
                <div className="xh-avatar-shell">
                  <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={132} height={132} priority />
                </div>
                <div>
                  <h1 id="home-profile-name">{data.site.owner || data.site.title}</h1>
                  <p>{data.site.bio || data.site.motto}</p>
                </div>
              </div>

              <div className="xh-profile-foot">
                <div className="xh-profile-stats" aria-label="站点内容数据">
                  <span><strong>{stats.posts}</strong><small>文章</small></span>
                  <span><strong>{data.notes.length}</strong><small>说说</small></span>
                  <span><strong>{stats.gallery}</strong><small>照片</small></span>
                </div>
                <div className="xh-profile-actions">
                  <Link href="/about">About</Link>
                  <a href={githubHref} target={githubIsExternal ? '_blank' : undefined} rel={githubIsExternal ? 'noreferrer' : undefined}>GitHub</a>
                  <span>{data.site.location || 'Location not set'}</span>
                </div>
              </div>
            </article>

            <Link className="xh-music-panel" data-motion="portal-card" href="/music" aria-label="打开音乐页">
              <div className="xh-disc-cover">
                <Image src={activeTrack?.cover || data.site.heroImage} alt={`${activeTrack?.title || '音乐'} 封面`} width={220} height={220} priority />
              </div>
              <div className="xh-cloud-copy">
                <p className="eyebrow">Cloud Music</p>
                <h2>{activeTrack?.title || '歌单待添加'}</h2>
                <p>{activeTrack?.artist || 'Local Playlist'}</p>
                <strong>{activeTrack?.note || '把写作、阅读和编码时的背景音乐收进这里。'}</strong>
              </div>
              <div className="xh-player-progress" aria-hidden="true">
                <span>00:00</span>
                <i><b /></i>
                <span>02:40</span>
              </div>
            </Link>
          </div>

          <div className="xh-lyric-strip xh-scene-lyric" data-motion="portal-card" aria-label="当前歌词">
            <span>{activeTrack?.note || data.site.motto}</span>
          </div>

          <div className="xh-feature-board">
            <Link className="xh-feature-card xh-feature-main" data-motion="stack-card" href={featuredHref}>
              <Image src={featuredImage} alt={`${featuredTitle} 封面`} width={900} height={640} data-motion="image-scale" priority />
              <div>
                <p className="eyebrow">Latest Insight</p>
                <time>{featuredPost ? formatDate(featuredPost.updatedAt) : 'Soon'}</time>
                <h2>{featuredTitle}</h2>
                <span>{featuredSummary}</span>
                <small>{featuredMeta}</small>
              </div>
            </Link>

            <Link className="xh-feature-card xh-gallery-wide" data-motion="stack-card" href="/gallery">
              <Image src={primaryGallery?.image || data.site.heroImage} alt={primaryGallery?.alt || primaryGallery?.title || '照片墙预览'} width={900} height={420} data-motion="image-scale" />
              <div>
                <h2>{primaryGallery?.title || '照片墙'}</h2>
                <p>{primaryGallery?.description || '头像、头图、项目截图和日常视觉素材都在这里归档。'}</p>
              </div>
            </Link>

            <Link className="xh-feature-card xh-record-wide" data-motion="stack-card" href="/moments">
              <Image src={secondaryGallery?.image || data.site.heroImage} alt={secondaryGallery?.alt || secondaryGallery?.title || '动态背景'} width={680} height={360} data-motion="image-scale" />
              <div>
                <p className="eyebrow">Records</p>
                <time>{latestNote?.date || '等待第一条动态'}</time>
                <h2>{recordTitle}</h2>
                <span>{recordText}</span>
              </div>
            </Link>

            <Link className="xh-mode-tile" data-motion="stack-card" href="/console">
              <span aria-hidden="true">✦</span>
              <h2>夜间模式</h2>
              <p>流萤飞舞的深空</p>
            </Link>
          </div>

          <div className="xh-runtime-dock" data-motion="portal-card" aria-label="站点运行状态">
            <span><strong>{data.site.streak} days</strong> 系统已稳定运行</span>
            <span><strong>{stats.words}</strong> 字内容估算</span>
            <span><strong>{stats.projects}</strong> 项目入口</span>
            <span>Next.js 16 / React 19 / GitHub / Vercel</span>
          </div>
        </div>
      </section>
    </main>
  );
}
