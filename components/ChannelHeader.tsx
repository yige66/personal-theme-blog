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

function renderAction(action: ChannelHeaderAction, index: number) {
  const className = index === 0 ? 'channel-hero-action primary' : 'channel-hero-action';

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

export function ChannelHeader({ actions = [], description, eyebrow, signal, stats = [], title }: ChannelHeaderProps) {
  return (
    <header className="main-shell channel-hero" data-motion="portal-card">
      <div className="channel-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
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

      <div className="channel-hero-foot">
        <span>{signal}</span>
        {actions.length ? <nav aria-label={`${title} 相关入口`}>{actions.slice(0, 3).map(renderAction)}</nav> : null}
      </div>
    </header>
  );
}
