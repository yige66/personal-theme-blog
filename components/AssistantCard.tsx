import { BlogSite, BlogPost, BlogNote } from '@/lib/blog';

export function AssistantCard({ site, posts, notes }: { site: BlogSite; posts: BlogPost[]; notes: BlogNote[] }) {
  const latestPost = posts[0];
  const latestNote = notes[0];

  return (
    <section className="glass-card assistant-card" aria-label="AI 助手配置">
      <p className="eyebrow">AI Assistant</p>
      <h3>{site.assistantName}</h3>
      <p>{site.assistantPrompt}</p>
      <div className="assistant-lines">
        <span>推荐阅读：{latestPost?.title ?? '等待第一篇文章'}</span>
        <span>最新动态：{latestNote?.content ?? '暂无动态'}</span>
      </div>
    </section>
  );
}
