import Image from 'next/image';
import Link from 'next/link';
import type { BlogProject } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

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
      <header className="project-workshop-header">
        <div>
          <small>Projects Matrix</small>
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
          <article className="project-card project-exhibit" key={project.id} data-motion="stack-card">
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
