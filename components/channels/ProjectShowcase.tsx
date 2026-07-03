'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import type { BlogProject } from '@/lib/blog';

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

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function ProjectActionLink({ href, className, children, ariaLabel }: { href: string; className?: string; children: ReactNode; ariaLabel?: string }) {
  if (isExternalHref(href)) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer" aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href || '#'} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

function projectMatchesQuery(project: BlogProject, query: string) {
  if (!query) {
    return true;
  }

  const searchableText = [
    project.title,
    project.description,
    project.status,
    project.startedAt,
    ...project.tags
  ].join(' ').toLowerCase();

  return searchableText.includes(query);
}

export function ProjectShowcase({ projects }: { projects: BlogProject[] }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = useMemo(
    () => projects.filter((project) => projectMatchesQuery(project, normalizedQuery)),
    [projects, normalizedQuery]
  );

  return (
    <section className="main-shell project-world project-matrix xh-reference-surface" aria-label="项目矩阵">
      <header className="project-matrix-hero">
        <h1>项目星港</h1>
        <p>把练习、系统、文章工程和长期实验整理成可查看、可追踪的作品停靠区。</p>
      </header>

      <label className="project-matrix-search">
        <span className="project-search-icon" aria-hidden="true" />
        <span className="project-search-label">搜索项目</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索项目名称、描述或技术栈..."
          aria-label="搜索项目名称、描述或技术栈"
        />
      </label>

      {projects.length === 0 ? (
        <div className="project-matrix-empty" role="status">
          <strong>暂无项目</strong>
          <span>在数据源新增项目后，这里会自动生成项目矩阵。</span>
        </div>
      ) : null}

      {projects.length > 0 && filteredProjects.length === 0 ? (
        <div className="project-matrix-empty" role="status">
          <strong>没有匹配项目</strong>
          <span>换一个关键词试试，标题、描述、状态和标签都可以搜索。</span>
        </div>
      ) : null}

      {filteredProjects.length > 0 ? (
        <div className="project-matrix-grid" aria-live="polite">
          {filteredProjects.map((project, index) => {
            const primaryHref = project.url || project.repo || '#';

            return (
              <article className="project-matrix-card" key={project.id} data-motion="stack-card">
                <div className="project-matrix-card-head">
                  <span className="project-matrix-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <div className="project-matrix-title">
                    <h2>{project.title}</h2>
                    <span>{formatProjectStatus(project.status)}{project.startedAt ? ` / ${project.startedAt}` : ''}</span>
                  </div>
                  {project.repo ? (
                    <a className="project-repo-link" href={project.repo} target="_blank" rel="noreferrer" aria-label={`${project.title} GitHub 仓库`}>
                      GitHub
                    </a>
                  ) : null}
                </div>

                <p>{project.description}</p>

                <div className="tag-row">
                  {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>

                <div className="project-matrix-actions">
                  <ProjectActionLink href={primaryHref} ariaLabel={`查看 ${project.title}`}>
                    查看项目
                  </ProjectActionLink>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
