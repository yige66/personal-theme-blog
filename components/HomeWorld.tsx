import Image from 'next/image';
import Link from 'next/link';
import { LatestPostCarousel } from '@/components/LatestPostCarousel';
import { CloudPlayerCard } from '@/components/music/CloudPlayerCard';
import { LyricStrip } from '@/components/music/LyricStrip';
import { PortalSearch } from '@/components/PortalSearch';
import { SiteDashboard } from '@/components/SiteDashboard';
import { ThemeSceneCard } from '@/components/ThemeSceneCard';
import { experienceRoutes } from '@/lib/experience';
import { formatDate, getPageActions, getPageContent, getPageStatLabel, type BlogData, type BlogPost, type BlogStats } from '@/lib/blog';
import { createContentExcerpt } from '@/lib/text';
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

function getSpotlightCount(id: string, stats: BlogStats) {
  const counts: Record<string, number> = {
    archive: stats.posts,
    posts: stats.posts,
    photowall: stats.gallery,
    gallery: stats.gallery,
    music: stats.tracks,
    moments: stats.notes,
    chatter: stats.chatters,
    friends: stats.links,
    tags: stats.tags,
    projects: stats.projects
  };
  const count = counts[id];
  return typeof count === 'number' ? String(count).padStart(2, '0') : null;
}

function getSpotlightColumns(data: BlogData, stats: BlogStats) {
  const byId = new Map(data.site.columns.map((column) => [column.id, column]));
  const configured = data.site.columns
    .filter((column) => column.visible && column.homeVisible)
    .map((column) => {
      const route = getRoute(column.id);
      const count = getSpotlightCount(column.id, stats);
      return {
        id: column.id,
        href: column.href || route?.href || '/',
        title: column.title || column.label,
        intro: column.intro,
        coordinate: count ?? column.coordinate ?? route?.coordinate ?? '',
        tone: (column.tone || route?.tone || column.id).toLowerCase()
      };
    });

  if (configured.length > 0) {
    return configured;
  }

  return routeSpotlight.map((item, index) => {
    const route = getRoute(item.id);
    const column = byId.get(item.id);
    const count = getSpotlightCount(item.id, stats);
    return {
      id: item.id,
      href: column?.href || route?.href || '/',
      title: column?.title || item.title,
      intro: column?.intro || item.intro,
      coordinate: count ?? column?.coordinate ?? route?.coordinate ?? String(index + 1).padStart(2, '0'),
      tone: (column?.tone || route?.tone || item.id).toLowerCase()
    };
  });
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function HomeWorld({ data, posts, searchEntries, stats }: HomeWorldProps) {
  const homePage = getPageContent(data.site, 'home');
  const homeActions = getPageActions(homePage);
  const profileActions = data.site.github
    ? [...homeActions, { href: data.site.github, label: 'GitHub' }]
    : homeActions;
  const latestPosts = posts.slice(0, 5);
  const primaryGallery = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];
  const latestNote = data.notes[0];
  const latestChatter = data.chatters[0];
  const spotlightColumns = getSpotlightColumns(data, stats);
  const noteCover = latestNote?.images?.[0] || data.site.gallery[1]?.image || primaryGallery?.image || data.site.heroImage;
  const chatterCover = latestChatter?.cover || data.site.gallery[2]?.image || primaryGallery?.image || data.site.heroImage;

  return (
    <section className="main-shell xh-clean-home" aria-label={homePage.title}>
      <div className="xh-clean-home__search">
        <PortalSearch entries={searchEntries} />
      </div>

      <main className="xh-clean-home__grid" aria-label="博客首页内容">
        <section className="xh-clean-home__identity" aria-label="个人资料与音乐">
          <article className="xh-clean-card xh-clean-profile xh-profile-window" data-motion="portal-card">
            <Link className="xh-profile-card-open" href="/about" aria-label="打开关于页面" />
            <div className="xh-profile-window-bar" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="xh-avatar-shell">
              <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={120} height={120} priority />
            </div>
            <p className="eyebrow">{homePage.eyebrow}</p>
            <h1>{data.site.title}</h1>
            <p className="xh-role">{data.site.role}</p>
            <p className="xh-motto">{data.site.subtitle || data.site.bio || data.site.motto}</p>
            <div className="xh-profile-stats" aria-label="站点数据">
              <span><strong>{stats.posts}</strong><small>{getPageStatLabel(homePage, 0, '文章')}</small></span>
              <span><strong>{stats.notes}</strong><small>{getPageStatLabel(homePage, 1, '动态')}</small></span>
              <span><strong>{stats.gallery}</strong><small>{getPageStatLabel(homePage, 2, '相册')}</small></span>
            </div>
            <div className="xh-profile-actions">
              {profileActions.map((action) => (
                isExternalHref(action.href) ? (
                  <a href={action.href} key={`${action.href}-${action.label}`} target="_blank" rel="noreferrer"><span>{action.label}</span></a>
                ) : (
                  <Link href={action.href} key={`${action.href}-${action.label}`}><span>{action.label}</span></Link>
                )
              ))}
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
                <h2>{primaryGallery?.title || homePage.panelOneTitle}</h2>
                <span>{primaryGallery?.description || homePage.panelOneDescription}</span>
              </div>
            </Link>

            <div className="xh-clean-home__mini-grid">
              <Link className="xh-window-tile xh-record-card is-note" href="/moments" data-motion="stack-card">
                <Image
                  className="xh-card-cover"
                  src={noteCover}
                  alt={latestNote?.title || '动态封面'}
                  width={420}
                  height={260}
                  loading="lazy"
                />
                <div className="xh-card-copy">
                  <p className="eyebrow">Moments</p>
                  <time>{latestNote?.date ? formatDate(latestNote.date) : 'Soon'}</time>
                  <h2>{latestNote?.title || homePage.panelTwoTitle}</h2>
                  <p>{latestNote?.content || data.site.status}</p>
                </div>
              </Link>

              <Link className="xh-window-tile xh-mode-card is-chatter" href={latestChatter ? `/chatter/${latestChatter.slug}` : '/chatter'} data-motion="stack-card">
                <Image
                  className="xh-card-cover"
                  src={chatterCover}
                  alt={latestChatter?.title || '杂谈封面'}
                  width={420}
                  height={260}
                  loading="lazy"
                />
                <div className="xh-card-copy">
                  <p className="eyebrow">Chatter</p>
                  <h2>{latestChatter?.title || homePage.panelThreeTitle}</h2>
                  <p>{latestChatter ? createContentExcerpt(latestChatter.content, 72) : homePage.panelThreeDescription}</p>
                </div>
              </Link>
            </div>

            <ThemeSceneCard />
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
