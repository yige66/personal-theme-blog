import Image from 'next/image';
import Link from 'next/link';
import type { BlogSite, BlogStats } from '@/lib/blog';

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
  site: BlogSite;
  stats: BlogStats;
};

const aboutStats = [
  ['posts', '文章'],
  ['chatters', '杂谈'],
  ['notes', '说说'],
  ['gallery', '相册']
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

export function AboutRoom({ activeTab, activities, site, stats }: AboutRoomProps) {
  const activityCells = createHeatmapCells(activities);
  const recentActivities = activities.slice(0, 8);

  return (
    <section className="main-shell about-room about-profile-panel" aria-label="关于我">
      <div className="about-room-toolbar" aria-hidden="true">
        <span />
        <span />
        <span />
        <strong>Profile Room</strong>
      </div>

      <div className="about-room-cover">
        <Image src={site.heroImage} alt={`${site.title} 头图`} width={1180} height={560} priority />
      </div>

      <div className="about-room-avatar">
        <Image src={site.avatar} alt={`${site.owner} 的头像`} width={180} height={180} />
      </div>

      <div className="about-room-heading">
        <div className="about-room-copy">
          <h1>关于我</h1>
          <p>Hello World, I&apos;m {site.owner}</p>
        </div>

        <nav className="about-room-tabs" aria-label="关于栏目切换">
          <Link aria-current={activeTab === 'intro' ? 'page' : undefined} className={activeTab === 'intro' ? 'is-active' : ''} href="/about?tab=intro">
            自我介绍
          </Link>
          <Link aria-current={activeTab === 'activity' ? 'page' : undefined} className={activeTab === 'activity' ? 'is-active' : ''} href="/about?tab=activity">
            研究动态
          </Link>
        </nav>
      </div>

      <div className="about-room-rule" aria-hidden="true" />

      <div className="about-room-console" aria-label="站点统计">
        {aboutStats.map(([key, label]) => (
          <span key={key}>
            <strong>{stats[key]}</strong>
            {label}
          </span>
        ))}
      </div>

      {activeTab === 'intro' ? (
        <div className="about-room-pane about-room-intro" id="about-intro">
          <article className="about-prose">
            <p className="about-section-label">个人简介</p>
            <p>你好，我是 {site.owner}。</p>
            <p>{site.bio}</p>

            <h2>研究与创作方向</h2>
            <ul>
              <li><strong>系统工程：</strong>{site.role}</li>
              <li><strong>内容生态：</strong>{site.status}</li>
              <li><strong>长期目标：</strong>{site.motto}</li>
            </ul>

            <h2>软件工程能力</h2>
            <ul>
              <li><strong>前端体验：</strong>围绕 Next.js、React 与内容数据源，构建可持续维护的个人站点。</li>
              <li><strong>发布工作流：</strong>使用 GitHub 与 Vercel 串联内容版本、预览、构建和正式发布。</li>
              <li><strong>信息组织：</strong>把文章、杂谈、动态、音乐、照片墙和友链拆成不同的访问入口。</li>
            </ul>

            <p className="about-room-welcome">欢迎各位朋友联系交流~</p>
          </article>

          <aside className="about-contact-card" aria-label="联系信息">
            <p className="about-section-label">Contact</p>
            <h2>找到我</h2>
            <dl>
              <div>
                <dt>位置</dt>
                <dd>{site.location}</dd>
              </div>
              <div>
                <dt>邮箱</dt>
                <dd><a href={`mailto:${site.email}`}>{site.email}</a></dd>
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
