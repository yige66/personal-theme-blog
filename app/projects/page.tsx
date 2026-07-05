import { ProjectShowcase } from '@/components/channels/ProjectShowcase';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getPageContent } from '@/lib/blog';
import { getGithubProjects } from '@/lib/github-projects';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.projects;

export default async function ProjectsPage() {
  const data = await getBlogData();
  const page = getPageContent(data.site, 'projects');
  const githubProjects = await getGithubProjects(data.site, data.projects);

  return (
    <main className="subpage projects-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ProjectShowcase page={page} projects={githubProjects.projects} source={githubProjects} />
    </main>
  );
}
