import { ProjectShowcase } from '@/components/ChannelWorlds';
import { PageScene } from '@/components/PageScene';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.projects;

export default async function ProjectsPage() {
  const data = await getBlogData();
  const featuredProject = data.projects.find((project) => project.featured) ?? data.projects[0];

  return (
    <main className="subpage projects-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageScene
        eyebrow="Projects"
        title="项目与作品"
        description="把练习、系统、文章工程和长期实验整理成可查看、可追踪的作品展柜。"
        image={featuredProject?.cover || data.site.heroImage}
        imageAlt={featuredProject ? `${featuredProject.title} 项目封面` : `${data.site.title} 项目背景`}
        variant="projects"
        stats={[
          { label: '项目', value: data.projects.length, caption: '作品矩阵' },
          { label: '精选', value: data.projects.filter((project) => project.featured).length, caption: '首页展示' },
          { label: '维护', value: 'CMS', caption: '后台可编辑' }
        ]}
        actions={[
          { href: '/console', label: '管理项目' },
          { href: '/archive', label: '阅读记录' }
        ]}
        signal="project exhibit / deploy traces / long-term experiments"
      />
      <ProjectShowcase projects={data.projects} />
    </main>
  );
}
