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

export function ChannelHeader({ description, eyebrow, stats = [], title }: ChannelHeaderProps) {
  return (
    <header className="main-shell channel-hero xh-reference-hero" data-motion="portal-card">
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
    </header>
  );
}
