import { ChannelHeader } from '@/components/ChannelHeader';
import { ProjectShowcase } from '@/components/channels/ProjectShowcase';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.projects;

export default async function ProjectsPage() {
  const data = await getBlogData();

  return (
    <main className="subpage projects-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow="Projects"
        title="项目星港"
        description="把练习、系统、文章工程和长期实验整理成可查看、可追踪的作品停靠区。"
        stats={[
          { label: '项目', value: data.projects.length },
          { label: '精选', value: data.projects.filter((project) => project.featured).length },
          { label: '维护', value: 'Git' }
        ]}
        actions={[
          { href: '/console', label: '管理项目' },
          { href: '/archive', label: '阅读记录' }
        ]}
        signal="project starport / deploy traces / long-term experiments"
      />
      <ProjectShowcase projects={data.projects} />
    </main>
  );
}
