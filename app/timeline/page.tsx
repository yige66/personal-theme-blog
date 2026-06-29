import { TimelineArchive } from '@/components/ChannelWorlds';
import { PageScene } from '@/components/PageScene';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getTimelineItems } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.timeline;

export default async function TimelinePage() {
  const [data, items] = await Promise.all([getBlogData(), getTimelineItems()]);
  const types = new Set(items.map((item) => item.type));

  return (
    <main className="subpage timeline-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageScene
        eyebrow="Timeline"
        title="归档与探索"
        description="把文章、说说、杂谈和项目揉成一条可搜索的内容年表，补齐 XHBlogs 里 timeline 的站内探索角色。"
        image={data.site.heroImage}
        imageAlt={`${data.site.title} timeline`}
        variant="archive"
        stats={[
          { label: '节点', value: items.length, caption: '聚合内容' },
          { label: '类型', value: types.size, caption: '文章/动态/项目/杂谈' },
          { label: '视图', value: 'Spine', caption: '时间线' }
        ]}
        actions={[
          { href: '/archive', label: '文章归档' },
          { href: '/chatter', label: '云端杂谈' }
        ]}
        signal="timeline / posts / moments / projects / chatter"
      />
      <TimelineArchive items={items} />
    </main>
  );
}
