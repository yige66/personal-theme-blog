import Image from 'next/image';
import Link from 'next/link';
import { LatestPostCarousel } from '@/components/LatestPostCarousel';
import { CloudPlayerCard } from '@/components/music/CloudPlayerCard';
import { LyricStrip } from '@/components/music/LyricStrip';
import { PortalSearch } from '@/components/PortalSearch';
import { SiteDashboard } from '@/components/SiteDashboard';
import { SpaceDock } from '@/components/SpaceDock';
import { ThemeSceneCard } from '@/components/ThemeSceneCard';
import { experienceRoutes } from '@/lib/experience';
import { formatDate, type BlogData, type BlogPost, type BlogStats } from '@/lib/blog';
import type { PortalSearchEntry } from '@/lib/portal-index';

type HomeWorldProps = {
  data: BlogData;
  stats: BlogStats;
  posts: BlogPost[];
  featuredPost?: BlogPost;
  searchEntries: PortalSearchEntry[];
};

const routeSpotlight = [
  { id: 'photowall', title: '照片墙', intro: '相册、封面和日常视觉归档。' },
  { id: 'friends', title: '友链', intro: '朋友站点与申请格式。' },
  { id: 'chatter', title: '杂谈', intro: '文章之外的轻记录。' },
  { id: 'timeline', title: '时间线', intro: '按年份回看更新。' },
  { id: 'music', title: '音乐', intro: '播放、歌词与歌单。' }
] as const;

function getRoute(id: string) {
  return experienceRoutes.find((route) => route.id === id);
}

export function HomeWorld({ data, featuredPost, posts, searchEntries, stats }: HomeWorldProps) {
  const latestPosts = posts.slice(0, 5);
  const primaryGallery = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];
  const latestNote = data.notes[0];
  const latestChatter = data.chatters[0];
  const featuredProject = data.projects.find((project) => project.featured) ?? data.projects[0];
  const githubIsExternal = data.site.github.startsWith('http');
  const featureTitle = featuredPost?.title ?? featuredProject?.title ?? data.site.title;
  const featureSummary = featuredPost?.summary ?? featuredProject?.description ?? data.site.status;
  const featureHref = featuredPost ? `/posts/${featuredPost.slug}` : featuredProject?.url ?? '/archive';

  return (
    <section className="main-shell xh-home-world xh-home-minimal" aria-label="个人博客首页">
      <div className="xh-home-search-panel">
        <PortalSearch entries={searchEntries} />
      </div>

      <main className="xh-home-stack" aria-label="XHBlogs 风格首页内容">
        <section className="xh-home-row xh-home-row-primary">
          <article className="xh-portal-profile xh-profile-window" data-motion="portal-card">
            <div className="xh-profile-window-bar" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="xh-avatar-shell">
              <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={120} height={120} priority />
            </div>
            <p className="eyebrow">Profile</p>
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

          <CloudPlayerCard fallbackImage={data.site.heroImage} />
        </section>

        <div className="xh-home-lyric-row">
          <LyricStrip />
        </div>

        <section className="xh-home-row xh-home-row-secondary">
          <div className="xh-home-main-deck">
            <section className="xh-home-feature-stack" data-motion="portal-card" aria-label="首页推荐">
              <div className="xh-feature-hero-copy">
                <p className="eyebrow">Personal Portal</p>
                <h2>{featureTitle}</h2>
                <p>{featureSummary}</p>
                <div className="xh-feature-actions">
                  <Link href={featureHref}>进入推荐</Link>
                  <Link href="/archive">文章归档</Link>
                </div>
              </div>
              <LatestPostCarousel posts={latestPosts} fallbackImage={data.site.heroImage} />
            </section>

            <section className="xh-home-feed-deck" aria-label="照片、动态和杂谈">
              <Link className="xh-photo-poster xh-window-tile is-photo" href="/photowall" data-motion="stack-card">
                <Image
                  src={primaryGallery?.image || data.site.heroImage}
                  alt={primaryGallery?.alt || primaryGallery?.title || '照片墙'}
                  width={720}
                  height={420}
                  loading="eager"
                />
                <div>
                  <p className="eyebrow">Photo Wall</p>
                  <h2>{primaryGallery?.title || '照片墙'}</h2>
                  <span>{primaryGallery?.description || '头像、相册和日常素材归档。'}</span>
                </div>
              </Link>

              <Link className="xh-record-card xh-window-tile is-note" href="/moments" data-motion="stack-card">
                <p className="eyebrow">Moments</p>
                <time>{latestNote?.date ? formatDate(latestNote.date) : 'Soon'}</time>
                <h2>{latestNote?.title || '近期动态'}</h2>
                <p>{latestNote?.content || data.site.status}</p>
              </Link>

              <Link className="xh-mode-card xh-window-tile is-chatter" href={latestChatter ? `/chatter/${latestChatter.slug}` : '/chatter'} data-motion="stack-card">
                <span aria-hidden="true" />
                <p className="eyebrow">Chatter</p>
                <h2>{latestChatter?.title || '云端杂谈'}</h2>
                <p>{latestChatter?.summary || '把正式文章之外的研究片段和站点复现记录单独收进轻文章频道。'}</p>
              </Link>
            </section>
          </div>

          <aside className="xh-home-side-deck" aria-label="主题与站点状态">
            <ThemeSceneCard />
            <SpaceDock data={data} stats={stats} />
          </aside>
        </section>

        <section className="xh-home-route-cluster" aria-label="站点核心入口">
          {routeSpotlight.map((item, index) => {
            const route = getRoute(item.id);
            return (
              <Link
                className={`xh-route-orb tone-${route?.tone.toLowerCase() ?? item.id}`}
                href={route?.href ?? '/'}
                data-motion="stack-card"
                key={item.id}
              >
                <span>{route?.coordinate ?? String(index + 1).padStart(2, '0')}</span>
                <strong>{item.title}</strong>
                <small>{item.intro}</small>
              </Link>
            );
          })}
        </section>

        <div className="xh-home-bottom-deck" aria-label="站点运行面板">
          <SiteDashboard data={data} stats={stats} />
        </div>
      </main>
    </section>
  );
}
