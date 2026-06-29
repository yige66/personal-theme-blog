import { KnowledgeTree } from '@/components/ChannelWorlds';
import { PageScene } from '@/components/PageScene';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getTreeNodes } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.tree;

export default async function TreePage() {
  const [data, nodes] = await Promise.all([getBlogData(), getTreeNodes()]);
  const groups = new Set(nodes.map((node) => node.group));

  return (
    <main className="subpage tree-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageScene
        eyebrow="Tree"
        title="灵境内容树"
        description="复现 XHBlogs 的实验树/灵境入口：把文章、项目、相册、音乐和后台能力组织成可探索的树状实验室。"
        image={data.site.avatar}
        imageAlt={`${data.site.owner} tree`}
        variant="tags"
        stats={[
          { label: '节点', value: nodes.length, caption: '内容入口' },
          { label: '分支', value: groups.size, caption: '主题组' },
          { label: '状态', value: 'Lab', caption: '实验空间' }
        ]}
        actions={[
          { href: '/timeline', label: '时间线' },
          { href: '/projects', label: '项目工坊' }
        ]}
        signal="tree / lab / workshop / content graph"
      />
      <KnowledgeTree nodes={nodes} />
    </main>
  );
}
