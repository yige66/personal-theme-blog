import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ArchiveGroup, BlogChatter, BlogLink, BlogPost, BlogProject, BlogSite, BlogTreeNode, TagSummary, TimelineItem } from '@/lib/blog';
import { estimateReadingMinutes, formatDate } from '@/lib/blog';
import { EmptyState } from './SectionBlocks';

export function ArchiveConstellation({ groups }: { groups: ArchiveGroup[] }) {
  if (groups.length === 0) {
    return (
      <section className="main-shell archive-world">
        <EmptyState title="暂无归档文章" description="在后台发布文章后，这里会自动生成按年份组织的时间航道。" />
      </section>
    );
  }

  return (
    <section className="main-shell archive-world" aria-label="文章时间航道">
      <div className="archive-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {groups.map((group) => (
        <article className="archive-year" key={group.year}>
          <header>
            <small>Year</small>
            <h2>{group.year}</h2>
            <span>{group.posts.length} posts</span>
          </header>
          <div className="article-list">
            {group.posts.map((post, index) => (
              <Link className="article-row archive-rune" href={`/posts/${post.slug}`} key={post.id}>
                <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{post.title}</strong>
                  <small>{post.summary}</small>
                </span>
                <span className="row-meta">{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</span>
              </Link>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

export function ProjectShowcase({ projects }: { projects: BlogProject[] }) {
  if (projects.length === 0) {
    return (
      <section className="main-shell project-world">
        <EmptyState title="暂无项目" description="在后台新增项目后，这里会自动生成作品展柜。" />
      </section>
    );
  }

  const statuses = Array.from(new Set(projects.map((project) => project.status)));
  const featuredProject = projects.find((project) => project.featured) ?? projects[0];
  const galleryProjects = projects.filter((project) => project.id !== featuredProject.id);

  return (
    <section className="main-shell project-world" aria-label="项目作品展柜">
      <div className="project-world-rail" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <header className="project-workshop-header">
        <div>
          <small>Workshop Board</small>
          <strong>{featuredProject.title}</strong>
          <span>{featuredProject.description}</span>
        </div>
        <Link href={featuredProject.url || '#'}>Open Featured</Link>
      </header>
      <article className="project-featured-console" data-motion="portal-card">
        <Link className="project-featured-cover" href={featuredProject.url || '#'}>
          <Image src={featuredProject.cover} alt={`${featuredProject.title} 主展台`} width={1180} height={720} priority />
        </Link>
        <div className="project-featured-copy">
          <p className="eyebrow">Featured Build</p>
          <h2>{featuredProject.title}</h2>
          <p>{featuredProject.description}</p>
          <div className="tag-row">
            {featuredProject.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className="project-featured-meter" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </article>
      <div className="project-status-rack" aria-label="项目状态">
        {statuses.map((status) => (
          <span key={status}>
            <strong>{projects.filter((project) => project.status === status).length}</strong>
            {status}
          </span>
        ))}
      </div>
      <div className="project-exhibit-grid">
        {(galleryProjects.length ? galleryProjects : projects).map((project, index) => (
          <article className={`project-card project-exhibit exhibit-${index % 3}`} key={project.id} data-motion="stack-card">
            <span className="project-exhibit-light" aria-hidden="true" />
            <Link className="project-cover" href={project.url || '#'}>
              <Image src={project.cover} alt={`${project.title} 封面`} width={860} height={560} />
            </Link>
            <div className="project-copy">
              <div className="project-coordinate">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <small>{project.status}</small>
              </div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="tag-row">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className="project-actions">
                <Link href={project.url || '#'}>进入作品</Link>
                {project.repo ? <a href={project.repo} target="_blank" rel="noreferrer">Repository</a> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LinkStarMap({ links }: { links: BlogLink[] }) {
  if (links.length === 0) {
    return (
      <section className="main-shell link-world">
        <EmptyState title="暂无友链" description="在后台添加链接后，这里会形成可维护的关系星图。" />
      </section>
    );
  }

  return (
    <section className="main-shell link-world" aria-label="友链关系星图">
      <div className="link-constellation-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="link-map-stage">
        <div className="link-map-core">
          <small>Friends</small>
          <strong>{links.length}</strong>
          <span>links online</span>
        </div>
        {links.map((link, index) => {
          const external = link.url.startsWith('http');
          const angle = -90 + (360 / links.length) * index;
          return (
            <a
              className={`link-card link-node node-${index % 6}`}
              style={{ '--node-angle': `${angle}deg`, '--node-radius': `${190 + (index % 3) * 22}px` } as CSSProperties}
              href={link.url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              key={link.title}
            >
              <span>{link.title.slice(0, 1).toUpperCase()}</span>
              <strong>{link.title}</strong>
              <small>{external ? new URL(link.url).hostname : '站内入口'}</small>
              <p>{link.description}</p>
            </a>
          );
        })}
      </div>
      <div className="link-grid link-list-fallback" aria-label="友链列表">
        {links.map((link) => {
          const external = link.url.startsWith('http');
          return (
            <a href={link.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} key={`${link.title}-fallback`}>
              <strong>{link.title}</strong>
              <small>{external ? new URL(link.url).hostname : '站内入口'}</small>
            </a>
          );
        })}
      </div>
    </section>
  );
}

export function FriendsBoard({ links }: { links: BlogLink[] }) {
  if (links.length === 0) {
    return (
      <section className="main-shell friends-board">
        <EmptyState title="暂无友链节点" description="添加朋友站点后，这里会形成更接近 XHBlogs 的头像友链矩阵。" />
      </section>
    );
  }

  return (
    <section className="main-shell friends-board" aria-label="友链头像矩阵">
      <div className="friends-board-grid">
        {links.map((link, index) => {
          const external = link.url.startsWith('http');
          return (
            <a
              className="friend-node-card"
              href={link.url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              style={{ '--friend-theme': link.themeColor || `hsl(${(index * 48) % 360} 82% 74%)` } as CSSProperties}
              key={`${link.title}-${index}`}
            >
              <span className="friend-avatar">
                {link.avatar ? <Image src={link.avatar} alt="" width={96} height={96} /> : link.title.slice(0, 1).toUpperCase()}
              </span>
              <strong>{link.title}</strong>
              <small>{link.badge || (external ? new URL(link.url).hostname : '站内入口')}</small>
              <p>{link.description}</p>
              {link.since ? <em>{link.since}</em> : null}
            </a>
          );
        })}
      </div>
      <aside className="friend-apply-card">
        <span>Friend Link</span>
        <strong>交换格式</strong>
        <p>名称 / 简介 / 链接 / 头像。这里保留 XHBlogs 的友链申请区角色，但使用本站自己的身份信息。</p>
      </aside>
    </section>
  );
}

export function ChatterMasonry({ chatters }: { chatters: BlogChatter[] }) {
  if (chatters.length === 0) {
    return (
      <section className="main-shell chatter-board">
        <EmptyState title="暂无杂谈" description="补充 chatter 内容后，这里会显示更接近 XHBlogs 的轻文章瀑布流。" />
      </section>
    );
  }

  const tags = Array.from(new Set(chatters.flatMap((chatter) => chatter.tags)));

  return (
    <section className="main-shell chatter-board" aria-label="云端杂谈瀑布">
      <div className="chatter-filter-rail">
        <span>全部</span>
        {tags.slice(0, 8).map((tag) => <span key={tag}>#{tag}</span>)}
      </div>
      <div className="chatter-masonry">
        {chatters.map((chatter, index) => (
          <Link className={`chatter-card chatter-${index % 5}`} href={`/chatter/${chatter.slug}`} key={chatter.id}>
            {chatter.cover ? (
              <span className="chatter-cover">
                <Image src={chatter.cover} alt="" width={680} height={420} />
              </span>
            ) : null}
            <small>{formatDate(chatter.date)} / {chatter.mood || 'Chatter'}</small>
            <strong>{chatter.title}</strong>
            <p>{chatter.summary || chatter.content}</p>
            <span className="chatter-tags">
              {chatter.tags.slice(0, 4).map((tag) => <em key={tag}>#{tag}</em>)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TimelineArchive({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <section className="main-shell timeline-world">
        <EmptyState title="暂无时间线" description="发布文章、动态、杂谈或项目后，这里会自动汇成时间线。" />
      </section>
    );
  }

  const types = Array.from(new Set(items.map((item) => item.type)));

  return (
    <section className="main-shell timeline-world" aria-label="内容聚合时间线">
      <div className="timeline-toolbar">
        {types.map((type) => <span key={type}>{type}</span>)}
      </div>
      <div className="timeline-spine">
        {items.map((item, index) => (
          <Link className={`timeline-node timeline-node-${item.type}`} href={item.href} key={`${item.type}-${item.id}-${index}`}>
            <time>{formatDate(item.date)}</time>
            <span>{item.accent || item.type}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
            <small>{item.tags.slice(0, 4).map((tag) => `#${tag}`).join(' ')}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function KnowledgeTree({ nodes }: { nodes: BlogTreeNode[] }) {
  if (nodes.length === 0) {
    return (
      <section className="main-shell tree-world">
        <EmptyState title="暂无灵境节点" description="补充 tree 数据后，这里会形成实验室、工坊和内容树入口。" />
      </section>
    );
  }

  const groups = nodes.reduce<Map<string, BlogTreeNode[]>>((map, node) => {
    map.set(node.group, [...(map.get(node.group) ?? []), node]);
    return map;
  }, new Map());

  return (
    <section className="main-shell tree-world" aria-label="灵境内容树">
      <div className="tree-canopy" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {[...groups.entries()].map(([group, groupNodes], groupIndex) => (
        <article className="tree-branch" key={group}>
          <header>
            <small>{String(groupIndex + 1).padStart(2, '0')}</small>
            <strong>{group}</strong>
          </header>
          <div>
            {groupNodes.map((node, index) => (
              <Link className="tree-node" href={node.href || '#'} key={node.id} style={{ '--tree-weight': node.weight ?? index + 1 } as CSSProperties}>
                <span>{node.status || 'online'}</span>
                <strong>{node.title}</strong>
                <p>{node.description}</p>
                <small>{node.tags?.map((tag) => `#${tag}`).join(' ')}</small>
              </Link>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

export function TagNebula({ tags }: { tags: TagSummary[] }) {
  if (tags.length === 0) {
    return (
      <section className="main-shell tag-world">
        <EmptyState title="暂无标签" description="发布带标签的文章后，标签星云会自动出现。" />
      </section>
    );
  }

  const maxCount = Math.max(...tags.map((tag) => tag.count), 1);

  return (
    <section className="main-shell tag-world" aria-label="标签星云">
      <div className="tag-nebula-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="tag-cloud-page">
        {tags.map((tag, index) => {
          const heat = Math.max(1, Math.round((tag.count / maxCount) * 5));
          return (
            <Link
              className={`tag-cloud-card heat-${heat}`}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              style={{ '--tag-index': index, '--tag-tilt': `${(index % 7) * 2 - 6}deg` } as CSSProperties}
              key={tag.name}
            >
              <small>{String(index + 1).padStart(2, '0')}</small>
              <strong>#{tag.name}</strong>
              <span>{tag.count} 篇文章</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function TagReadingDock({ tag, posts }: { tag: string; posts: BlogPost[] }) {
  return (
    <section className="main-shell tag-reading-dock" aria-label={`${tag} 标签文章`}>
      <aside>
        <small>Selected Tag</small>
        <strong>#{tag}</strong>
        <span>{posts.length} posts connected</span>
      </aside>
      <div className="article-list">
        {posts.map((post, index) => (
          <Link className="article-row archive-rune" href={`/posts/${post.slug}`} key={post.id}>
            <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{post.title}</strong>
              <small>{post.summary}</small>
            </span>
            <span className="row-meta">{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AboutRoom({ site, stats }: { site: BlogSite; stats: { posts: number; projects: number; notes: number; gallery: number } }) {
  const activityCells = Array.from({ length: 35 }, (_item, index) => ({
    id: `activity-${index}`,
    level: ((index * 7 + stats.posts + stats.notes) % 5) + 1
  }));

  return (
    <section className="main-shell about-room" aria-label="个人房间">
      <div className="about-room-lightmap" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
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
      <div className="about-room-copy">
        <p className="eyebrow">Now</p>
        <h2>{site.role}</h2>
        <p>{site.status}</p>
        <p>{site.motto}</p>
        <div className="project-actions">
          <a href={site.github} target="_blank" rel="noreferrer">GitHub</a>
          <Link href="/links">友链</Link>
        </div>
      </div>
      <div className="about-room-console">
        <span><strong>{stats.posts}</strong>文章</span>
        <span><strong>{stats.projects}</strong>项目</span>
        <span><strong>{stats.notes}</strong>动态</span>
        <span><strong>{stats.gallery}</strong>图片</span>
      </div>
      <div className="about-room-activity" aria-label="创作活跃度">
        <small>Activity Grid</small>
        <div>
          {activityCells.map((cell) => <i data-level={cell.level} key={cell.id} />)}
        </div>
      </div>
    </section>
  );
}
