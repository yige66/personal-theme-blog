import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

type PageSceneStat = {
  label: string;
  value: string | number;
  caption: string;
};

type PageSceneAction = {
  href: string;
  label: string;
};

type PageSceneProps = {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  variant?: 'archive' | 'projects' | 'links' | 'tags' | 'gallery' | 'music' | 'moments' | 'about';
  stats?: PageSceneStat[];
  actions?: PageSceneAction[];
  signal?: string;
};

const sceneCoordinates: Record<NonNullable<PageSceneProps['variant']>, string> = {
  archive: 'Timeline / cards',
  projects: 'Workshop index',
  links: 'Friend map',
  tags: 'Topic nebula',
  gallery: 'Photo wall',
  music: 'Focus radio',
  moments: 'Daily stream',
  about: 'Profile room'
};

function renderAction(action: PageSceneAction, index: number) {
  const className = index === 0 ? 'page-scene-action primary' : 'page-scene-action';

  if (/^https?:\/\//i.test(action.href)) {
    return (
      <a className={className} href={action.href} target="_blank" rel="noreferrer" key={action.href}>
        {action.label}
      </a>
    );
  }

  return (
    <Link className={className} href={action.href} key={action.href}>
      {action.label}
    </Link>
  );
}

export function PageScene({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  variant = 'archive',
  stats = [],
  actions = [],
  signal
}: PageSceneProps) {
  const marquee = signal || [eyebrow, title, ...stats.map((item) => `${item.label} ${item.value}`)].join(' / ');
  const visualStyle = image ? ({ '--scene-image': `url(${image})` } as CSSProperties) : undefined;

  return (
    <header className={`page-scene main-shell page-scene-${variant}`} data-motion="portal-card">
      <div className="page-scene-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>
          <span>{title}</span>
        </h1>
        <p>{description}</p>
        {actions.length ? <div className="page-scene-actions">{actions.slice(0, 2).map(renderAction)}</div> : null}
      </div>

      <div className="page-scene-media" data-motion="image-scale" style={visualStyle}>
        {image ? (
          <Image src={image} alt={imageAlt || title} width={860} height={620} priority={false} />
        ) : (
          <div className="page-scene-abstract" aria-hidden="true" />
        )}
      </div>

      {stats.length ? (
        <div className="page-scene-stats" aria-label="页面数据">
          {stats.slice(0, 3).map((item) => (
            <div className="page-scene-stat" key={`${item.label}-${item.value}`}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </div>
          ))}
        </div>
      ) : null}

      <div className="page-scene-id" aria-hidden="true">
        <span>{variant}</span>
        <strong>{sceneCoordinates[variant]}</strong>
      </div>

      <div className="page-scene-marquee" aria-hidden="true">
        <span>{marquee}</span>
        <span>{marquee}</span>
      </div>
    </header>
  );
}
