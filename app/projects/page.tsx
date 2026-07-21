import { ProjectShowcase } from '@/components/channels/ProjectShowcase';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getPageContent } from '@/lib/blog';
import { getGithubProjects } from '@/lib/github-projects';
import { parseGitHubRepository } from '@/lib/github-repository';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.projects;

type ProjectsPageProps = {
  searchParams?: Promise<{
    github_repo?: string | string[];
    github_star?: string | string[];
    projects_focus?: string | string[];
    projects_view?: string | string[];
  }>;
};

function firstQueryValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() || '';
}

function normalizeFocusRepo(value: string | string[] | undefined): string | undefined {
  const repository = parseGitHubRepository(`https://github.com/${firstQueryValue(value)}`);
  return repository ? `${repository.owner}/${repository.repo}`.toLowerCase() : undefined;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const data = await getBlogData();
  const page = getPageContent(data.site, 'projects');
  const githubProjects = await getGithubProjects(data.site, data.projects);
  const params = await searchParams;
  const initialViewMode = firstQueryValue(params?.projects_view) === 'catalog' || Boolean(firstQueryValue(params?.github_star))
    ? 'catalog'
    : 'game';
  const focusRepo = normalizeFocusRepo(params?.projects_focus) ?? normalizeFocusRepo(params?.github_repo);

  return (
    <main className="subpage projects-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ProjectShowcase
        page={page}
        projects={githubProjects.projects}
        source={githubProjects}
        initialViewMode={initialViewMode}
        focusRepo={focusRepo}
      />
    </main>
  );
}
