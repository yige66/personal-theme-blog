import Image from 'next/image';
import Link from 'next/link';
import type { BlogData, BlogProject, BlogStats } from '@/lib/blog';

type ExperienceShowcaseProps = {
  data: BlogData;
  stats: BlogStats;
  projects: BlogProject[];
};

const fallbackImage = '/assets/img/hero-mountain.svg';

export function ExperienceShowcase({ data, stats, projects }: ExperienceShowcaseProps) {
  const galleryPreview = data.site.gallery.slice(0, 3);
  const primaryGallery = galleryPreview[0];
  const featuredProject = projects[0] ?? data.projects[0];
  const latestNote = data.notes[0];
  const activeTrack = data.site.music[0];
  const imageSrc = primaryGallery?.image || data.site.heroImage || fallbackImage;
  const imageAlt = primaryGallery?.alt || primaryGallery?.title || data.site.title;

  const signals = [
    { href: '/archive', label: '???', value: stats.posts, caption: '?????' },
    { href: '/projects', label: '???', value: stats.projects, caption: '?????' },
    { href: '/photowall', label: '???', value: stats.gallery, caption: '????' }
  ];

  return (
    <section className="experience-showcase" aria-labelledby="experience-title">
      <div className="main-shell experience-layout">
        <div className="experience-copy">
          <p className="eyebrow">Experience Console</p>
          <h2 id="experience-title">????????????????????????????</h2>
          <p>{data.site.status || data.site.subtitle}</p>
          <div className="experience-actions">
            <Link className="button primary" href="/archive">?????</Link>
            <Link className="button ghost" href="/photowall">?????</Link>
            <Link className="button ghost" href="/music">????</Link>
          </div>
        </div>

        <figure className="experience-media">
          <Image src={imageSrc} alt={imageAlt} width={860} height={560} priority={false} />
          <figcaption>
            <strong>{primaryGallery?.title || data.site.title}</strong>
            <span>{primaryGallery?.description || data.site.motto}</span>
          </figcaption>
        </figure>

        <div className="experience-stats" aria-label="??????">
          {signals.map((item) => (
            <Link className="experience-stat" href={item.href} key={item.href}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </Link>
          ))}
        </div>

        <div className="experience-current" aria-label="??????">
          <article className="experience-panel">
            <span>????</span>
            <strong>{latestNote?.content || data.site.motto}</strong>
            <Link href="/moments">?????</Link>
          </article>

          <article className="experience-panel">
            <span>????</span>
            <strong>{featuredProject?.title || 'Personal Blog Console'}</strong>
            <p>{featuredProject?.description || '??????????????????????'}</p>
            <Link href="/projects">?????</Link>
          </article>

          <article className="experience-panel">
            <span>????</span>
            <strong>{activeTrack?.title || '?????????'}</strong>
            <p>{activeTrack ? `${activeTrack.artist} / ${activeTrack.mood || '????'}` : '??????????????????????'}</p>
            <Link href="/music">?????</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
