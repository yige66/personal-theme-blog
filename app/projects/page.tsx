import { EmptyState, PageHero, PageInsightBar, ProjectCard } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.projects;

export default async function ProjectsPage() {
  const data = await getBlogData();

  return (
    <main className="subpage projects-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Projects" title="项目与作品" description="把练习、系统、文章工程和长期实验整理成可查看、可追踪的作品矩阵。" />
      <PageInsightBar
        items={[
          { label: '项目', value: data.projects.length, caption: '作品矩阵' },
          { label: '精选', value: data.projects.filter((project) => project.featured).length, caption: '首页展示' },
          { label: '维护', value: 'CMS', caption: '后台可编辑' }
        ]}
        action={{ href: '/console', label: '管理项目' }}
      />
      <section className="main-shell project-grid">
        {data.projects.length === 0 ? <EmptyState title="暂无项目" description="在后台新增项目后，这里会自动生成项目卡片。" /> : null}
        {data.projects.map((project) => <ProjectCard project={project} key={project.id} />)}
      </section>
    </main>
  );
}
