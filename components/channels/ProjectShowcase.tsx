'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ProjectStarButton } from '@/components/projects/ProjectStarButton';
import type { BlogProject, PageContent } from '@/lib/blog';
import { parseGitHubRepository } from '@/lib/github-repository';

/**
 * 保留原项目目录作为主结构，并在宝箱交互完成后切换到目录视图。
 * 地图、路线、角色与宝箱共用同一场景坐标系，避免动态缩放造成视觉错位。
 */

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
type WorldPhase = 'idle' | 'walking' | 'opening' | 'opened';
type ViewMode = 'game' | 'catalog';
type CatalogChestPhase = 'open' | 'closing';
type Point = { x: number; y: number };
type CatalogLink = { id: string; d: string };

const projectVisualIcons: ProjectVisualIcon[] = ['sabres', 'lantern', 'flower', 'moon', 'compass'];
// 路线先沿石桥铺装中心线前进，再接入庭院主路。
const journeyStart: Point = { x: 12.5, y: 89 };
const chestPoint: Point = { x: 74, y: 41.5 };
const heroStopPoint: Point = { x: 67.6, y: 47.5 };
const chestOpeningDuration = 1320;
const journeyPathD = 'M12.5 89 C18 84.5 25 73.5 34 64.5 C40 60.2 47 56.6 54 54.5 C59 52.3 64 49.2 67.6 47.5';
const journeySegments: Array<[Point, Point, Point, Point]> = [
  [journeyStart, { x: 18, y: 84.5 }, { x: 25, y: 73.5 }, { x: 34, y: 64.5 }],
  [{ x: 34, y: 64.5 }, { x: 40, y: 60.2 }, { x: 47, y: 56.6 }, { x: 54, y: 54.5 }],
  [{ x: 54, y: 54.5 }, { x: 59, y: 52.3 }, { x: 64, y: 49.2 }, heroStopPoint]
];

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
  const classNames: Record<ProjectVisualIcon, string> = {
    sabres: 'project-wax-seal-sabres',
    lantern: 'project-wax-seal-lantern',
    flower: 'project-wax-seal-flower',
    moon: 'project-wax-seal-moon',
    compass: 'project-wax-seal-compass'
  };

  return (
    <span className={`project-anime-icon project-wax-seal ${classNames[kind]}`} aria-hidden="true">
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

/** 返回一段三次贝塞尔曲线上的归一化坐标。 */
function cubicPoint(segment: [Point, Point, Point, Point], progress: number): Point {
  const inverse = 1 - progress;
  return {
    x: inverse ** 3 * segment[0].x
      + 3 * inverse ** 2 * progress * segment[1].x
      + 3 * inverse * progress ** 2 * segment[2].x
      + progress ** 3 * segment[3].x,
    y: inverse ** 3 * segment[0].y
      + 3 * inverse ** 2 * progress * segment[1].y
      + 3 * inverse * progress ** 2 * segment[2].y
      + progress ** 3 * segment[3].y
  };
}

/** 按绘制路线预采样弧长，使角色经过桥面弯道时仍保持均匀速度。 */
const journeySamples: Array<{ point: Point; distance: number }> = [{ point: journeyStart, distance: 0 }];
for (const segment of journeySegments) {
  for (let index = 1; index <= 48; index += 1) {
    const point = cubicPoint(segment, index / 48);
    const previous = journeySamples[journeySamples.length - 1]?.point ?? point;
    const previousDistance = journeySamples[journeySamples.length - 1]?.distance ?? 0;
    journeySamples.push({
      point,
      distance: previousDistance + Math.hypot(point.x - previous.x, point.y - previous.y)
    });
  }
}
const journeyTotalLength = journeySamples[journeySamples.length - 1]?.distance ?? 1;

/** 将行程进度转换为当前道路坐标。 */
function sampleJourney(progress: number): Point {
  const targetDistance = Math.max(0, Math.min(1, progress)) * journeyTotalLength;
  let low = 1;
  let high = journeySamples.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (journeySamples[middle].distance < targetDistance) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  const next = journeySamples[low] ?? journeySamples[journeySamples.length - 1];
  const previous = journeySamples[Math.max(0, low - 1)] ?? next;
  const distanceSpan = next.distance - previous.distance || 1;
  const localProgress = (targetDistance - previous.distance) / distanceSpan;
  return {
    x: previous.point.x + (next.point.x - previous.point.x) * localProgress,
    y: previous.point.y + (next.point.y - previous.point.y) * localProgress
  };
}

function AdventurerSprite({ phase }: { phase: WorldPhase }) {
  const frames = phase === 'walking'
      ? [
        '/assets/projects/project-rpg-jiangnan-pixel-adventurer-walk-a-tight-v12.png',
        '/assets/projects/project-rpg-jiangnan-pixel-adventurer-walk-b-tight-v12.png'
      ]
      : phase === 'opening'
        ? [
          '/assets/projects/project-rpg-jiangnan-pixel-adventurer-interact-a-tight-v12.png',
          '/assets/projects/project-rpg-jiangnan-pixel-adventurer-interact-b-tight-v12.png'
        ]
      : phase === 'opened'
        ? ['/assets/projects/project-rpg-jiangnan-pixel-adventurer-interact-b-tight-v12.png']
      : [
        '/assets/projects/project-rpg-jiangnan-pixel-adventurer-idle-a-tight-v12.png',
        '/assets/projects/project-rpg-jiangnan-pixel-adventurer-idle-b-tight-v12.png'
      ];

  return (
    <span className={`project-game-adventurer is-${phase}`} aria-hidden="true">
      {frames.map((src, index) => <img key={src} className={`project-game-adventurer-frame frame-${index}`} src={src} alt="" draggable={false} />)}
    </span>
  );
}

function ChestArtwork({ phase }: { phase: WorldPhase }) {
  const isOpening = phase === 'opening';
  const isOpen = phase === 'opened';
  return (
    <span className={`project-game-chest-art is-${phase}`} aria-hidden="true">
      <img className="project-game-chest-frame chest-closed is-visible" src="/assets/projects/project-rpg-jiangnan-pixel-chest-closed-tight-v12.png" alt="" draggable={false} />
      <img className={`project-game-chest-frame chest-open${isOpening || isOpen ? ' is-visible' : ''}`} src="/assets/projects/project-rpg-jiangnan-pixel-chest-open-tight-v12.png" alt="" draggable={false} />
    </span>
  );
}

function CatalogChestArtwork({ phase }: { phase: CatalogChestPhase }) {
  return (
    <span className={`project-catalog-chest-art is-${phase}`} aria-hidden="true">
      <img className="project-catalog-chest-frame chest-closed" src="/assets/projects/project-rpg-jiangnan-pixel-chest-closed-tight-v12.png" alt="" draggable={false} />
      <img className="project-catalog-chest-frame chest-open" src="/assets/projects/project-rpg-jiangnan-pixel-chest-open-tight-v12.png" alt="" draggable={false} />
    </span>
  );
}

type ProjectShowcaseProps = {
  page: PageContent;
  projects: BlogProject[];
  source?: ProjectSourceInfo;
  initialViewMode?: ViewMode;
  focusRepo?: string;
};

export function ProjectShowcase({ page, projects, initialViewMode = 'game', focusRepo }: ProjectShowcaseProps) {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [worldPhase, setWorldPhase] = useState<WorldPhase>(initialViewMode === 'catalog' ? 'opened' : 'idle');
  const [heroPosition, setHeroPosition] = useState<Point>(journeyStart);
  const [catalogChestPhase, setCatalogChestPhase] = useState<CatalogChestPhase>('open');
  const [catalogLinks, setCatalogLinks] = useState<CatalogLink[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const journeyFrame = useRef<number | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const gameViewRef = useRef<HTMLDivElement | null>(null);
  const catalogViewRef = useRef<HTMLDivElement | null>(null);
  const catalogChestRef = useRef<HTMLButtonElement | null>(null);
  const projectCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const focusHandledRef = useRef(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = useMemo(
    () => projects.filter((project) => projectMatchesQuery(project, normalizedQuery)),
    [projects, normalizedQuery]
  );
  const projectVisualMap = useMemo(() => createProjectVisualMap(filteredProjects), [filteredProjects]);
  const actions = getPageActions(page);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener('change', updateMotion);
    return () => mediaQuery.removeEventListener('change', updateMotion);
  }, []);

  useEffect(() => {
    if (viewMode !== 'catalog' || focusHandledRef.current) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const normalizedFocusRepo = focusRepo?.toLowerCase();
      const focusProject = normalizedFocusRepo
        ? filteredProjects.find((project) => {
          const repository = parseGitHubRepository(project.repo);
          return repository && `${repository.owner}/${repository.repo}`.toLowerCase() === normalizedFocusRepo;
        })
        : undefined;

      if (normalizedFocusRepo && !focusProject) {
        return;
      }

      focusHandledRef.current = true;
      if (focusProject) {
        projectCardRefs.current.get(focusProject.id)?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }

      const url = new URL(window.location.href);
      url.searchParams.delete('projects_view');
      url.searchParams.delete('projects_focus');
      window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [filteredProjects, focusRepo, viewMode]);

  useEffect(() => {
    if (worldPhase !== 'walking') {
      return undefined;
    }

    const startTime = performance.now();
    const duration = reducedMotion ? 24 : 5000;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      setHeroPosition(sampleJourney(progress));
      if (progress < 1) {
        journeyFrame.current = window.requestAnimationFrame(animate);
        return;
      }

      setHeroPosition(heroStopPoint);
      setWorldPhase('opening');
    };

    journeyFrame.current = window.requestAnimationFrame(animate);
    return () => {
      if (journeyFrame.current !== null) {
        window.cancelAnimationFrame(journeyFrame.current);
      }
    };
  }, [reducedMotion, worldPhase]);

  useEffect(() => {
    if (worldPhase !== 'opening') {
      return undefined;
    }

    openTimer.current = window.setTimeout(() => {
      setCatalogChestPhase('open');
      setViewMode('catalog');
      setWorldPhase('opened');
    }, reducedMotion ? 24 : chestOpeningDuration);

    return () => {
      if (openTimer.current !== null) {
        window.clearTimeout(openTimer.current);
        openTimer.current = null;
      }
    };
  }, [reducedMotion, worldPhase]);

  useEffect(() => () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
  }, []);

  useLayoutEffect(() => {
    if (viewMode !== 'catalog') {
      setCatalogLinks([]);
      return undefined;
    }

    let frame = 0;
    const updateLinks = () => {
      frame = window.requestAnimationFrame(() => {
        const container = catalogViewRef.current;
        const chest = catalogChestRef.current;
        if (!container || !chest) {
          setCatalogLinks([]);
          return;
        }

        const containerRect = container.getBoundingClientRect();
        const chestRect = chest.getBoundingClientRect();
        const chestX = chestRect.left + chestRect.width / 2 - containerRect.left;
        const chestY = chestRect.top - containerRect.top + 12;
        const nextLinks = filteredProjects.flatMap((project) => {
          const card = projectCardRefs.current.get(project.id);
          if (!card) {
            return [];
          }

          const cardRect = card.getBoundingClientRect();
          const startX = cardRect.left + cardRect.width / 2 - containerRect.left;
          const startY = cardRect.bottom - containerRect.top + 10;
          const midY = startY + Math.max(54, (chestY - startY) * 0.45);
          return [{
            id: project.id,
            d: `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${startX.toFixed(1)} ${midY.toFixed(1)} ${chestX.toFixed(1)} ${midY.toFixed(1)} ${chestX.toFixed(1)} ${chestY.toFixed(1)}`
          }];
        });
        setCatalogLinks(nextLinks);
      });
    };

    updateLinks();
    window.addEventListener('resize', updateLinks);
    return () => {
      window.removeEventListener('resize', updateLinks);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [filteredProjects, viewMode]);

  const handleGameChestClick = () => {
    if (viewMode === 'game' && worldPhase === 'idle') {
      setWorldPhase('walking');
    }
  };

  const handleCatalogChestClick = () => {
    if (catalogChestPhase === 'closing') {
      return;
    }

    setCatalogChestPhase('closing');
    closeTimer.current = window.setTimeout(() => {
      setViewMode('game');
      setWorldPhase('idle');
      setHeroPosition(journeyStart);
      setCatalogChestPhase('open');
      window.requestAnimationFrame(() => {
        gameViewRef.current?.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    }, reducedMotion ? 24 : 720);
  };

  const gameStyle = {
    '--hero-x': `${heroPosition.x}%`,
    '--hero-y': `${heroPosition.y}%`,
    '--chest-x': `${chestPoint.x}%`,
    '--chest-y': `${chestPoint.y}%`
  } as CSSProperties;

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

      {viewMode === 'game' ? (
        <div ref={gameViewRef} className={`project-game-box project-game-box-${worldPhase}`} style={gameStyle} data-world-phase={worldPhase} aria-label="像素森林寻宝场景">
          <div className="project-game-stage">
            <img className="project-game-map" src="/assets/projects/project-rpg-jiangnan-pixel-background-v15.png" alt="" aria-hidden="true" />
            <div className="project-game-map-shade" aria-hidden="true" />
            <div className="project-game-ambience" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ '--ambient-index': index } as CSSProperties} />)}
            </div>
            <div className="project-game-route" aria-hidden="true">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <path className="route-shadow" d={journeyPathD} />
                <path className="route-road" d={journeyPathD} />
                <path className="route-line" d={journeyPathD} />
                <path className="route-approach" d={`M${heroStopPoint.x} ${heroStopPoint.y} L${chestPoint.x} ${chestPoint.y}`} />
              </svg>
            </div>
            <div className="project-game-hero" aria-hidden="true">
              <AdventurerSprite phase={worldPhase} />
            </div>
            <button
              className={`project-game-chest project-game-chest-${worldPhase}`}
              type="button"
              onClick={handleGameChestClick}
              disabled={worldPhase !== 'idle'}
              aria-label="打开项目宝箱"
              title="打开项目宝箱"
            >
              <ChestArtwork phase={worldPhase} />
            </button>
            <span className="project-game-contact" aria-hidden="true" />
            <div className="project-game-particles" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => <i key={index} style={{ '--particle-index': index } as CSSProperties} />)}
            </div>
          </div>
        </div>
      ) : (
        <div className={`project-catalog-view project-catalog-view-${catalogChestPhase}`} ref={catalogViewRef}>
          <svg className="project-catalog-link-web" aria-hidden="true">
            {catalogLinks.map((link) => (
              <path d={link.d} key={link.id} />
            ))}
          </svg>

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
                    data-project-repo={project.repo || undefined}
                    ref={(node) => {
                      if (node) {
                        projectCardRefs.current.set(project.id, node);
                        return;
                      }
                      projectCardRefs.current.delete(project.id);
                    }}
                  >
                    <ProjectActionLink className="project-matrix-card" href={primaryHref} ariaLabel={`打开 ${project.title} GitHub 页面`}>
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

          <div className="project-catalog-spine" aria-hidden="true">
            <span className="project-catalog-spine-node" />
          </div>

          <div className="project-catalog-chest-dock">
            <button
              className="project-catalog-chest"
              type="button"
              ref={catalogChestRef}
              onClick={handleCatalogChestClick}
              disabled={catalogChestPhase === 'closing'}
              aria-label="关闭宝箱并返回森林地图"
              title="关闭宝箱并返回森林地图"
            >
              <CatalogChestArtwork phase={catalogChestPhase} />
            </button>
          </div>
        </div>
      )}

      {viewMode === 'game' && projects.length === 0 ? (
        <div className="project-matrix-empty" role="status">
          <strong>{page.emptyTitle}</strong>
          <span>{page.emptyDescription}</span>
        </div>
      ) : null}

      {viewMode === 'game' && projects.length > 0 && filteredProjects.length === 0 ? (
        <div className="project-matrix-empty" role="status">
          <strong>{page.searchEmptyTitle}</strong>
          <span>{page.searchEmptyDescription}</span>
        </div>
      ) : null}
    </section>
  );
}
