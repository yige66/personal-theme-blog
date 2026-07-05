import type { BlogData, BlogStats } from '@/lib/blog';

export type PathSegment = string | number;
export type JsonRecord = Record<string, unknown>;

export type AdminRiskLevel = '正常' | '注意' | '需处理';

export type AdminCaseSummary = {
  id: string;
  label: string;
  value: number | string;
  hint: string;
};

export type AdminManagementModule = {
  id: string;
  label: string;
  group: string;
  route: string;
  pageId: string;
  dataPath: string;
  count: number | string;
  riskLevel: AdminRiskLevel;
  riskText: string;
  checklist: string[];
};

export type AdminManagementOverview = {
  generatedAt: string;
  summaries: AdminCaseSummary[];
  modules: AdminManagementModule[];
  warnings: string[];
};

export type AdminSectionId =
  | 'site-profile'
  | 'site-visuals'
  | 'site-backgrounds'
  | 'site-entry'
  | 'site-columns'
  | 'column-home'
  | 'column-projects'
  | 'column-archive'
  | 'column-photowall'
  | 'column-gallery'
  | 'column-music'
  | 'column-moments'
  | 'column-chatter'
  | 'column-tags'
  | 'column-friends'
  | 'column-about'
  | 'posts'
  | 'projects'
  | 'notes'
  | 'chatters'
  | 'gallery'
  | 'music'
  | 'links'
  | 'ai-settings'
  | 'comments-effects';

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  hint: string;
  frontend: {
    label: string;
    routes: Array<{
      label: string;
      href: string;
    }>;
    dataPath: string;
    impact: string;
  };
};

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'prose'
  | 'number'
  | 'boolean'
  | 'list'
  | 'image'
  | 'image-list'
  | 'image-items'
  | 'audio'
  | 'datetime'
  | 'date'
  | 'select';

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldConfig = {
  key: string;
  label: string;
  kind?: FieldKind;
  rows?: number;
  placeholder?: string;
  options?: FieldOption[];
  help?: string;
  advanced?: boolean;
  cropAspect?: number;
};

export type PathFieldConfig = FieldConfig & {
  path: PathSegment[];
};

export type SaveState =
  | { status: 'idle'; message: string }
  | { status: 'saving'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export type RecordKind = 'post' | 'project' | 'note' | 'chatter' | 'gallery' | 'music' | 'link' | 'column';

export type UploadImage = (file: File, kind?: 'image' | 'audio') => Promise<string>;

export type BlogAdminConsoleProps = {
  initialData: BlogData | null;
  initialStats: BlogStats | null;
  initialOverview?: AdminManagementOverview | null;
};
