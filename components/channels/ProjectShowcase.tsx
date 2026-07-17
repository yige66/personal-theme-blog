'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { ProjectStarButton } from '@/components/projects/ProjectStarButton';
import type { BlogProject, PageContent } from '@/lib/blog';

const projectStatusLabels: Record<string, string> = {
  active: '进行中',
  planning: '规划中',
  archived: '已归档',
  maintenance: '维护中',
  draft: '草稿'
};

type ProjectSourceInfo = {
  error?: string;
  source: 'github' | 'fallback';
  username: string;
};

type ProjectVisualIcon = 'sabres' | 'lantern' | 'flower' | 'moon' | 'compass';

const projectVisualIcons: ProjectVisualIcon[] = ['sabres', 'lantern', 'flower', 'moon', 'compass'];

const projectVisualIconClassNames: Record<ProjectVisualIcon, string> = {
  sabres: 'project-wax-seal-sabres',
  lantern: 'project-wax-seal-lantern',
  flower: 'project-wax-seal-flower',
  moon: 'project-wax-seal-moon',
  compass: 'project-wax-seal-compass'
};

function formatProjectStatus(status: string) {
  return projectStatusLabels[status.toLowerCase()] ?? status;
}

function getProjectVisualIcon(project: BlogProject, index: number): ProjectVisualIcon {
  const searchable = `${project.title} ${project.description} ${project.tags.join(' ')}`.toLowerCase();
  if (/ai|game|life|sim|galgame|deepseek|creative|story/.test(searchable)) {
    return pickProjectIcon(project, index, 2);
  }
  if (/cloud|next|react|web|app|blog|server|api/.test(searchable)) {
    return pickProjectIcon(project, index, 1);
  }
  if (/chem|tool|compute|science|java|python|lab|system|cli|backend|delivery/.test(searchable)) {
    return pickProjectIcon(project, index, 4);
  }
  return pickProjectIcon(project, index, 0);
}

function pickProjectIcon(project: BlogProject, index: number, offset: number): ProjectVisualIcon {
  const seed = `${project.id}|${project.title}|${project.repo}|${project.url}`;
  const hash = [...seed].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 9973, 17);
  return projectVisualIcons[(hash + index + offset) % projectVisualIcons.length];
}

function createProjectVisualMap(projects: BlogProject[]): Map<string, ProjectVisualIcon> {
  const usage = new Map<ProjectVisualIcon, number>();
  let previousIcon: ProjectVisualIcon | null = null;

  return new Map(projects.map((project, index) => {
    const primaryIcon = getProjectVisualIcon(project, index);
    const primaryIndex = projectVisualIcons.indexOf(primaryIcon);
    const candidates = projectVisualIcons.map((_, offset) => projectVisualIcons[(primaryIndex + offset) % projectVisualIcons.length]);
    const icon = [...candidates].sort((a, b) => {
      const previousPenalty = Number(a === previousIcon) - Number(b === previousIcon);
      if (previousPenalty !== 0) {
        return previousPenalty;
      }
      return (usage.get(a) ?? 0) - (usage.get(b) ?? 0);
    })[0] ?? primaryIcon;

    usage.set(icon, (usage.get(icon) ?? 0) + 1);
    previousIcon = icon;
    return [project.id, icon];
  }));
}

function ProjectAnimeIcon({ kind }: { kind: ProjectVisualIcon }) {
  return (
    <span className={`project-anime-icon project-wax-seal ${projectVisualIconClassNames[kind]}`} aria-hidden="true">
      <span className="project-wax-seal-aura" />
      <span className="project-wax-seal-frame" />
      <span className="project-wax-seal-core" />
      <span className="project-rpg-glyph" />
      <span className="project-wax-seal-gloss" />
    </span>
  );
}

function GitHubGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.5 9.5 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2Z" />
    </svg>
  );
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

function getPageActions(page: PageContent) {
  return [
    { href: page.primaryActionHref, label: page.primaryActionLabel },
    { href: page.secondaryActionHref, label: page.secondaryActionLabel }
  ].filter((action) => action.href && action.label);
}

export function ProjectShowcase({ page, projects }: { page: PageContent; projects: BlogProject[]; source?: ProjectSourceInfo }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = useMemo(
    () => projects.filter((project) => projectMatchesQuery(project, normalizedQuery)),
    [projects, normalizedQuery]
  );
  const projectVisualMap = useMemo(() => createProjectVisualMap(filteredProjects), [filteredProjects]);
  const actions = getPageActions(page);

  return (
    <section className="main-shell project-world project-matrix xh-reference-surface" aria-label="项目矩阵">
      <header className="project-matrix-hero">
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        {actions.length ? (
          <div className="hero-actions">
            {actions.map((action, index) => (
              <ProjectActionLink className={index === 0 ? 'button primary' : 'button ghost'} href={action.href} key={`${action.href}-${action.label}`}>
                {action.label}
              </ProjectActionLink>
            ))}
          </div>
        ) : null}
        {page.signal ? <p className="channel-hero-signal">{page.signal}</p> : null}
      </header>

      <label className="project-matrix-search">
        <span className="project-search-icon" aria-hidden="true" />
        <span className="project-search-label">搜索项目</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={page.searchPlaceholder}
          aria-label={page.searchPlaceholder || '搜索项目'}
        />
      </label>

      {projects.length === 0 ? (
        <div className="project-matrix-empty" role="status">
          <strong>{page.emptyTitle}</strong>
          <span>{page.emptyDescription}</span>
        </div>
      ) : null}

      {projects.length > 0 && filteredProjects.length === 0 ? (
        <div className="project-matrix-empty" role="status">
          <strong>{page.searchEmptyTitle}</strong>
          <span>{page.searchEmptyDescription}</span>
        </div>
      ) : null}

      {filteredProjects.length > 0 ? (
        <div className="project-matrix-grid" aria-live="polite">
          {filteredProjects.map((project, index) => {
            const primaryHref = project.repo || project.url || '#';

            return (
              <article
                className="project-matrix-card-shell"
                key={project.id}
              >
                <ProjectActionLink className="project-matrix-card" href={primaryHref} key={project.id} ariaLabel={`打开 ${project.title} GitHub 页面`}>
                <div className="project-matrix-card-head">
                  <span className="project-matrix-index" aria-hidden="true">
                    <ProjectAnimeIcon kind={projectVisualMap.get(project.id) ?? getProjectVisualIcon(project, index)} />
                  </span>
                  <div className="project-matrix-title">
                    <h2>{project.title}</h2>
                    <span>{formatProjectStatus(project.status)}{project.startedAt ? ` / ${project.startedAt}` : ''}</span>
                  </div>
                  {project.repo ? (
                    <span className="project-repo-link" aria-hidden="true">
                      <GitHubGlyph />
                    </span>
                  ) : null}
                </div>

                <p>{project.description}</p>

                <div className="tag-row">
                  {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>

                </ProjectActionLink>

                {project.repo ? <ProjectStarButton repo={project.repo} /> : null}
                <div className="project-matrix-actions">
                  <span>打开 GitHub</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
