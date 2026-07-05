import Link from 'next/link';

export type ChannelHeaderStat = {
  label: string;
  value: string | number;
};

export type ChannelHeaderAction = {
  href: string;
  label: string;
};

type ChannelHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats?: ChannelHeaderStat[];
  actions?: ChannelHeaderAction[];
  signal?: string;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function renderAction(action: ChannelHeaderAction, index: number) {
  const className = index === 0 ? 'button primary' : 'button ghost';

  if (isExternalHref(action.href)) {
    return (
      <a className={className} href={action.href} key={`${action.href}-${action.label}`} target="_blank" rel="noreferrer">
        {action.label}
      </a>
    );
  }

  return (
    <Link className={className} href={action.href || '#'} key={`${action.href}-${action.label}`}>
      {action.label}
    </Link>
  );
}

export function ChannelHeader({ actions = [], description, eyebrow, signal = '', stats = [], title }: ChannelHeaderProps) {
  return (
    <header className="main-shell channel-hero xh-reference-hero" data-motion="portal-card">
      <div className="channel-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {actions.length ? (
          <div className="channel-hero-actions">
            {actions.slice(0, 3).map(renderAction)}
          </div>
        ) : null}
      </div>

      {stats.length ? (
        <div className="channel-hero-stats" aria-label="栏目数据">
          {stats.slice(0, 4).map((stat) => (
            <span key={`${stat.label}-${stat.value}`}>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </span>
          ))}
        </div>
      ) : null}

      {signal ? <p className="channel-hero-signal">{signal}</p> : null}
    </header>
  );
}
