import Image from 'next/image';
import Link from 'next/link';
import { formatPageText, getPageStatLabel, type BlogSite, type BlogStats, type PageContent } from '@/lib/blog';

type AboutActivity = {
  id: string;
  type: '文章' | '杂谈' | '说说';
  title: string;
  date: string;
  href: string;
};

type AboutRoomProps = {
  activeTab: 'intro' | 'activity';
  activities: AboutActivity[];
  page: PageContent;
  site: BlogSite;
  stats: BlogStats;
};

const aboutStats = [
  { key: 'posts', fallback: '文章' },
  { key: 'chatters', fallback: '杂谈' },
  { key: 'notes', fallback: '说说' },
  { key: 'gallery', fallback: '相册' }
] as const;

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function createHeatmapCells(activities: AboutActivity[]) {
  const counts = activities.reduce<Map<string, number>>((map, activity) => {
    const date = new Date(activity.date);

    if (Number.isNaN(date.getTime())) {
      return map;
    }

    const key = date.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map());

  return Array.from({ length: 84 }, (_item, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (83 - index));
    const key = date.toISOString().slice(0, 10);
    const count = counts.get(key) ?? 0;

    return {
      count,
      key,
      level: Math.min(4, count)
    };
  });
}

export function AboutRoom({ activeTab, activities, page, site, stats }: AboutRoomProps) {
  const activityCells = createHeatmapCells(activities);
  const recentActivities = activities.slice(0, 8);
  const pageVariables = {
    owner: site.owner,
    role: site.role,
    status: site.status,
    motto: site.motto,
    activityCount: activities.length
  };
  const aboutHeroImage = site.aboutHeroImage || site.heroImage;
  const activityHref = page.primaryActionHref || '/about?tab=activity';
  const publicEmail = site.email.includes('@') ? site.email : '';

  return (
    <section className="main-shell about-room about-profile-panel" aria-label={page.title}>
      <div className="about-room-toolbar" aria-hidden="true">
        <span />
        <span />
        <span />
        <strong>{page.signal || 'Profile Room'}</strong>
      </div>

      <div className="about-room-cover">
        <Image src={aboutHeroImage} alt={`${site.title} 头图`} width={1180} height={560} priority />
      </div>

      <div className="about-room-avatar">
        <Image src={site.avatar} alt={`${site.owner} 的头像`} width={180} height={180} />
      </div>

      <div className="about-room-heading">
        <div className="about-room-copy">
          <h1>{page.title}</h1>
          <p>{formatPageText(page.description, pageVariables)}</p>
        </div>

        <nav className="about-room-tabs" aria-label="关于栏目切换">
          <Link aria-current={activeTab === 'intro' ? 'page' : undefined} className={activeTab === 'intro' ? 'is-active' : ''} href="/about?tab=intro">
            {page.panelOneTitle || '自我介绍'}
          </Link>
          <Link aria-current={activeTab === 'activity' ? 'page' : undefined} className={activeTab === 'activity' ? 'is-active' : ''} href={activityHref}>
            {page.primaryActionLabel || '活动时间线'}
          </Link>
        </nav>
      </div>

      <div className="about-room-rule" aria-hidden="true" />

      <div className="about-room-console" aria-label="站点统计">
        {aboutStats.map((stat, index) => (
          <span key={stat.key}>
            <strong>{stats[stat.key]}</strong>
            {getPageStatLabel(page, index, stat.fallback)}
          </span>
        ))}
      </div>

      {activeTab === 'intro' ? (
        <div className="about-room-pane about-room-intro" id="about-intro">
          <article className="about-prose">
            <p className="about-section-label">{page.panelOneTitle}</p>
            <p>{formatPageText(page.panelOneDescription, pageVariables)}</p>
            <p>{site.bio}</p>

            {page.panelTwoTitle ? <h2>{page.panelTwoTitle}</h2> : null}
            {page.panelTwoDescription ? <p>{formatPageText(page.panelTwoDescription, pageVariables)}</p> : null}
            {page.detailLines.length ? (
              <ul>
                {page.detailLines.map((line) => <li key={line}>{formatPageText(line, pageVariables)}</li>)}
              </ul>
            ) : null}

            {page.panelThreeDescription ? (
              <p className="about-room-welcome">{formatPageText(page.panelThreeDescription, pageVariables)}</p>
            ) : null}
          </article>

          <aside className="about-contact-card" aria-label="联系信息">
            <p className="about-section-label">{page.panelThreeTitle}</p>
            {page.panelThreeDescription ? <h2>{page.panelThreeDescription}</h2> : null}
            <dl>
              {site.location && site.location !== '不公开' ? (
                <div>
                  <dt>位置</dt>
                  <dd>{site.location}</dd>
                </div>
              ) : null}
              <div>
                <dt>邮箱</dt>
                <dd>{publicEmail ? <a href={`mailto:${publicEmail}`}>{publicEmail}</a> : '通过 GitHub 或评论区联系'}</dd>
              </div>
              <div>
                <dt>GitHub</dt>
                <dd><a href={site.github} target="_blank" rel="noreferrer">yige66</a></dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : (
        <div className="about-room-pane about-room-activity" id="about-activity" aria-label="创作活跃度">
          <section className="about-heatmap-card">
            <header>
              <p className="about-section-label">Activity Grid</p>
              <h2>{activities.length} contributions in the content archive</h2>
            </header>
            <div className="about-heatmap" role="img" aria-label="最近 84 天内容维护热力图">
              {activityCells.map((cell) => <i data-level={cell.level} key={cell.key} title={`${cell.key}: ${cell.count} 次更新`} />)}
            </div>
            <div className="about-heatmap-scale" aria-hidden="true">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => <i data-level={level} key={level} />)}
              <span>More</span>
            </div>
          </section>

          <section className="about-timeline" aria-label="最近动态">
            {recentActivities.map((activity) => (
              <Link className="about-timeline-item" href={activity.href} key={activity.id}>
                <Image src={site.avatar} alt="" width={44} height={44} />
                <span>
                  <strong>{site.owner}</strong>
                  <em>{activity.type === '说说' ? '发布了说说' : `更新了${activity.type}`}</em>
                </span>
                <b>{activity.type === '说说' ? activity.title : `《${activity.title}》`}</b>
                <time dateTime={activity.date}>{formatActivityDate(activity.date)}</time>
              </Link>
            ))}
          </section>
        </div>
      )}
    </section>
  );
}
