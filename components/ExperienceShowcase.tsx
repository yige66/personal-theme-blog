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
    { href: '/archive', label: '文章库', value: stats.posts, caption: '已发布内容' },
    { href: '/projects', label: '项目集', value: stats.projects, caption: '可展示作品' },
    { href: '/gallery', label: '照片墙', value: stats.gallery, caption: '视觉素材' }
  ];

  return (
    <section className="experience-showcase" aria-labelledby="experience-title">
      <div className="main-shell experience-layout">
        <div className="experience-copy">
          <p className="eyebrow">Experience Console</p>
          <h2 id="experience-title">把文章、项目、动态、音乐和照片墙汇成一个可运营的个人站点</h2>
          <p>{data.site.status || data.site.subtitle}</p>
          <div className="experience-actions">
            <Link className="button primary" href="/archive">进入文章库</Link>
            <Link className="button ghost" href="/gallery">浏览照片墙</Link>
            <Link className="button ghost" href="/music">播放歌单</Link>
          </div>
        </div>

        <figure className="experience-media">
          <Image src={imageSrc} alt={imageAlt} width={860} height={560} priority={false} />
          <figcaption>
            <strong>{primaryGallery?.title || data.site.title}</strong>
            <span>{primaryGallery?.description || data.site.motto}</span>
          </figcaption>
        </figure>

        <div className="experience-stats" aria-label="站点体验数据">
          {signals.map((item) => (
            <Link className="experience-stat" href={item.href} key={item.href}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </Link>
          ))}
        </div>

        <div className="experience-current" aria-label="当前内容焦点">
          <article className="experience-panel">
            <span>当前动态</span>
            <strong>{latestNote?.content || data.site.motto}</strong>
            <Link href="/moments">查看动态流</Link>
          </article>

          <article className="experience-panel">
            <span>精选项目</span>
            <strong>{featuredProject?.title || 'Personal Blog Console'}</strong>
            <p>{featuredProject?.description || '在后台补充项目后，这里会自动成为作品入口。'}</p>
            <Link href="/projects">进入项目集</Link>
          </article>

          <article className="experience-panel">
            <span>正在播放</span>
            <strong>{activeTrack?.title || '等待后台添加音乐'}</strong>
            <p>{activeTrack ? `${activeTrack.artist} / ${activeTrack.mood || '阅读背景'}` : '素材管理中可以维护音乐标题、作者与音频地址。'}</p>
            <Link href="/music">打开音乐页</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
