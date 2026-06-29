import Image from 'next/image';
import Link from 'next/link';
import { LatestPostCarousel } from '@/components/LatestPostCarousel';
import { CloudPlayerCard } from '@/components/music/CloudPlayerCard';
import { LyricStrip } from '@/components/music/LyricStrip';
import { PortalSearch } from '@/components/PortalSearch';
import { SiteDashboard } from '@/components/SiteDashboard';
import { SpaceDock } from '@/components/SpaceDock';
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
  { id: 'photowall', title: '照片墙', intro: '把头图、相册和日常视觉整理成可回看的记忆入口。' },
  { id: 'friends', title: '友链星图', intro: '把朋友、同频站点和申请格式放在一个关系网络里。' },
  { id: 'chatter', title: '云端杂谈', intro: '收纳正式文章之外的设计想法、片段和站点复现记录。' },
  { id: 'timeline', title: '时间线', intro: '按时间串起文章、动态、项目和每一次迭代。' },
  { id: 'music', title: '夜航电台', intro: '音乐、歌词和写作状态在全站持续流动。' }
] as const;

function getRoute(id: string) {
  return experienceRoutes.find((route) => route.id === id);
}

export function HomeWorld({ data, featuredPost, posts, searchEntries, stats }: HomeWorldProps) {
  const latestPosts = posts.slice(0, 4);
  const primaryGallery = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];
  const latestNote = data.notes[0];
  const latestChatter = data.chatters[0];
  const featuredProject = data.projects.find((project) => project.featured) ?? data.projects[0];
  const githubIsExternal = data.site.github.startsWith('http');
  const featureTitle = featuredPost?.title ?? featuredProject?.title ?? data.site.title;
  const featureSummary = featuredPost?.summary ?? featuredProject?.description ?? data.site.status;
  const featureHref = featuredPost ? `/posts/${featuredPost.slug}` : featuredProject?.url ?? '/archive';

  return (
    <section className="main-shell xh-portal-grid xh-home-world" aria-label="个人博客首页门户">
      <div className="xh-home-world-frame" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="xh-home-search-panel">
        <PortalSearch entries={searchEntries} />
      </div>

      <aside className="xh-home-left-rail" aria-label="个人身份和站点入口">
        <article className="xh-portal-profile xh-profile-window" data-motion="portal-card">
          <div className="xh-profile-window-bar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="xh-avatar-shell">
            <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={132} height={132} priority />
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

        <SpaceDock data={data} stats={stats} />
      </aside>

      <main className="xh-home-main-deck" aria-label="XHBlogs 式内容门户">
        <section className="xh-home-feature-stack" data-motion="portal-card" aria-label="首页主推荐">
          <div className="xh-feature-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
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

        <section className="xh-home-feed-deck" aria-label="照片、动态和杂谈">
          <Link className="xh-photo-poster xh-window-tile is-photo" href="/photowall" data-motion="stack-card">
            <Image
              src={primaryGallery?.image || data.site.heroImage}
              alt={primaryGallery?.alt || primaryGallery?.title || '照片墙'}
              width={720}
              height={520}
              loading="eager"
              data-motion="image-scale"
            />
            <div>
              <p className="eyebrow">Photo Wall</p>
              <h2>{primaryGallery?.title || '照片墙'}</h2>
              <span>{primaryGallery?.description || '头像、头图、项目截图和日常素材都在这里归档。'}</span>
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
            <p>{latestChatter?.summary || '把正式文章之外的研究片段、设计想法和站点复现记录单独收进轻文章频道。'}</p>
          </Link>
        </section>
      </main>

      <aside className="xh-home-right-rail" aria-label="音乐、歌词和运行状态">
        <CloudPlayerCard fallbackImage={data.site.heroImage} />
        <LyricStrip />
        <SiteDashboard data={data} stats={stats} />
      </aside>

      <div className="xh-home-bottom-deck" aria-label="扩展入口和后台控制">
        <div className="xh-home-bottom-grid">
          <Link className="xh-mode-card xh-window-tile is-console" href="/console" data-motion="stack-card">
            <span aria-hidden="true" />
            <p className="eyebrow">Console</p>
            <h2>后台配置入口</h2>
            <p>站点名称、头像、背景、音乐、弹幕和友链都应从这里维护。</p>
          </Link>
          <Link className="xh-mode-card xh-window-tile is-friends" href="/friends" data-motion="stack-card">
            <span aria-hidden="true" />
            <p className="eyebrow">Friends</p>
            <h2>友链申请与星图</h2>
            <p>{data.site.friendLinkApplyFormat.split('\n')[0] || '把同频站点变成可以访问、可以维护的关系入口。'}</p>
          </Link>
          <Link className="xh-mode-card xh-window-tile is-archive" href="/timeline" data-motion="stack-card">
            <span aria-hidden="true" />
            <p className="eyebrow">Timeline</p>
            <h2>归档与探索</h2>
            <p>按时间回看文章、杂谈、动态和项目，让访客像目标站一样从年表进入内容。</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
