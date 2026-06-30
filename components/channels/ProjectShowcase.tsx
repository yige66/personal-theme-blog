import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { BlogProject } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

const projectStatusLabels: Record<string, string> = {
  active: '进行中',
  planning: '规划中',
  archived: '已归档',
  maintenance: '维护中',
  draft: '草稿'
};

function formatProjectStatus(status: string) {
  return projectStatusLabels[status.toLowerCase()] ?? status;
}

export function ProjectShowcase({ projects }: { projects: BlogProject[] }) {
  if (projects.length === 0) {
    return (
      <section className="main-shell project-world project-starport xh-reference-surface">
        <EmptyState title="暂无项目" description="在数据源新增项目后，这里会自动生成作品星港。" />
      </section>
    );
  }

  const statuses = Array.from(new Set(projects.map((project) => project.status)));
  const featuredProject = projects.find((project) => project.featured) ?? projects[0];
  const galleryProjects = projects.filter((project) => project.id !== featuredProject.id);

  return (
    <section className="main-shell project-world project-starport xh-reference-surface" aria-label="项目星港与作品矩阵">
      <header className="project-workshop-header">
        <div>
          <small>Project Starport</small>
          <strong>项目星港</strong>
          <span>把长期实验、部署链路和可维护作品分区停靠。</span>
        </div>
        <Link href={featuredProject.url || '#'}>进入精选</Link>
      </header>

      <div className="project-orbit-layout">
        <article className="project-featured-console" data-motion="portal-card">
          <Link className="project-featured-cover" href={featuredProject.url || '#'}>
            <Image src={featuredProject.cover} alt={`${featuredProject.title} 主展示`} width={1180} height={720} priority />
          </Link>
          <div className="project-featured-copy">
            <p className="eyebrow">Featured Build</p>
            <h2>{featuredProject.title}</h2>
            <p>{featuredProject.description}</p>
            <div className="tag-row">
              {featuredProject.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <div className="project-featured-meta">
              <span>{formatProjectStatus(featuredProject.status)}</span>
              <span>{featuredProject.startedAt || '长期维护'}</span>
              {featuredProject.repo ? <span>Repository</span> : null}
            </div>
          </div>
        </article>

        <aside className="project-status-rack" aria-label="项目状态轨道">
          <span>
            <strong>{projects.length}</strong>
            全部作品
          </span>
          {statuses.map((status, index) => (
            <span key={status} style={{ '--status-index': index } as CSSProperties}>
              <strong>{projects.filter((project) => project.status === status).length}</strong>
              {formatProjectStatus(status)}
            </span>
          ))}
        </aside>
      </div>

      <div className="project-exhibit-grid">
        {(galleryProjects.length ? galleryProjects : projects).map((project, index) => (
          <article className="project-card project-exhibit" key={project.id} data-motion="stack-card">
            <Link className="project-cover" href={project.url || '#'} aria-label={`查看 ${project.title}`}>
              <Image src={project.cover} alt={`${project.title} 封面`} width={860} height={560} />
            </Link>
            <div className="project-copy">
              <div className="project-coordinate">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <small>{formatProjectStatus(project.status)}</small>
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
