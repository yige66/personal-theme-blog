'use client';

import type { CommentConfig } from '@/lib/blog';
import { GitHubComments } from './GitHubComments';

export function MomentComments({ config, term, title }: { config: CommentConfig; term: string; title: string }) {
  return (
    <div className="moment-comments-shell" id={`comment-${term.replace(/[^a-zA-Z0-9_-]+/g, '-')}`}>
      <GitHubComments compact config={config} term={term} title={title} />
    </div>
  );
}
