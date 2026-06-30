import Image from 'next/image';
import Link from 'next/link';
import { LatestPostCarousel } from '@/components/LatestPostCarousel';
import { CloudPlayerCard } from '@/components/music/CloudPlayerCard';
import { LyricStrip } from '@/components/music/LyricStrip';
import { PortalSearch } from '@/components/PortalSearch';
import { SiteDashboard } from '@/components/SiteDashboard';
import { ThemeSceneCard } from '@/components/ThemeSceneCard';
import { experienceRoutes } from '@/lib/experience';
import { formatDate, type BlogData, type BlogPost, type BlogStats } from '@/lib/blog';
import type { PortalSearchEntry } from '@/lib/portal-index';

type HomeWorldProps = {
  data: BlogData;
  stats: BlogStats;
  posts: BlogPost[];
  searchEntries: PortalSearchEntry[];
};

const routeSpotlight = [
  { id: 'photowall', title: '照片墙', intro: '相册、封面和日常视觉归档。' },
  { id: 'friends', title: '友链', intro: '朋友站点、申请格式与长期互访。' },
  { id: 'chatter', title: '杂谈', intro: '文章之外的轻记录与碎片想法。' },
  { id: 'archive', title: '归档', intro: '按年份回看文章、笔记和里程碑。' },
  { id: 'music', title: '音乐', intro: '云端歌单、歌词与播放状态。' }
] as const;

function getRoute(id: string) {
  return experienceRoutes.find((route) => route.id === id);
}

function getSpotlightColumns(data: BlogData) {
  const byId = new Map(data.site.columns.map((column) => [column.id, column]));
  const configured = data.site.columns
    .filter((column) => column.visible && column.homeVisible)
    .map((column) => {
      const route = getRoute(column.id);
      return {
        id: column.id,
        href: column.href || route?.href || '/',
        title: column.title || column.label,
        intro: column.intro,
        coordinate: column.coordinate || route?.coordinate || '',
        tone: (column.tone || route?.tone || column.id).toLowerCase()
      };
    });

  if (configured.length > 0) {
    return configured;
  }

  return routeSpotlight.map((item, index) => {
    const route = getRoute(item.id);
    const column = byId.get(item.id);
    return {
      id: item.id,
      href: column?.href || route?.href || '/',
      title: column?.title || item.title,
      intro: column?.intro || item.intro,
      coordinate: column?.coordinate || route?.coordinate || String(index + 1).padStart(2, '0'),
      tone: (column?.tone || route?.tone || item.id).toLowerCase()
    };
  });
}

export function HomeWorld({ data, posts, searchEntries, stats }: HomeWorldProps) {
  const latestPosts = posts.slice(0, 5);
  const primaryGallery = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];
  const latestNote = data.notes[0];
  const latestChatter = data.chatters[0];
  const githubIsExternal = data.site.github.startsWith('http');
  const spotlightColumns = getSpotlightColumns(data);

  return (
    <section className="main-shell xh-clean-home" aria-label="个人博客首页">
      <div className="xh-clean-home__search">
        <PortalSearch entries={searchEntries} />
      </div>

      <main className="xh-clean-home__grid" aria-label="XHBlogs 风格首页内容">
        <section className="xh-clean-home__identity" aria-label="个人资料与音乐">
          <article className="xh-clean-card xh-clean-profile xh-profile-window" data-motion="portal-card">
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

        <div className="xh-clean-home__lyrics">
          <LyricStrip />
        </div>

        <section className="xh-clean-home__showcase" aria-label="文章、照片、动态和主题">
          <div className="xh-clean-home__posts">
            <LatestPostCarousel posts={latestPosts} fallbackImage={data.site.heroImage} />
          </div>

          <div className="xh-clean-home__media">
            <Link className="xh-window-tile xh-photo-poster is-photo" href="/photowall" data-motion="stack-card">
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

            <div className="xh-clean-home__mini-grid">
              <Link className="xh-window-tile xh-record-card is-note" href="/moments" data-motion="stack-card">
                <p className="eyebrow">Moments</p>
                <time>{latestNote?.date ? formatDate(latestNote.date) : 'Soon'}</time>
                <h2>{latestNote?.title || '近期动态'}</h2>
                <p>{latestNote?.content || data.site.status}</p>
              </Link>

              <ThemeSceneCard />
            </div>

            <Link className="xh-window-tile xh-mode-card is-chatter" href={latestChatter ? `/chatter/${latestChatter.slug}` : '/chatter'} data-motion="stack-card">
              <span aria-hidden="true" />
              <p className="eyebrow">Chatter</p>
              <h2>{latestChatter?.title || '云端杂谈'}</h2>
              <p>{latestChatter?.summary || '把正式文章之外的研究片段和站点复现记录单独收进轻文章频道。'}</p>
            </Link>
          </div>
        </section>

        <section className="xh-clean-routes" aria-label="站点核心入口">
          {spotlightColumns.map((item) => {
            return (
              <Link
                className={`xh-clean-route tone-${item.tone}`}
                href={item.href}
                data-motion="stack-card"
                key={item.id}
              >
                <span>{item.coordinate}</span>
                <strong>{item.title}</strong>
                <small>{item.intro}</small>
              </Link>
            );
          })}
        </section>

        <div className="xh-clean-dashboard" aria-label="站点运行面板">
          <SiteDashboard data={data} stats={stats} />
        </div>
      </main>
    </section>
  );
}
