import type { BlogData, BlogStats } from '@/lib/blog';

export type PathSegment = string | number;
export type JsonRecord = Record<string, unknown>;

export type AdminSectionId =
  | 'site-profile'
  | 'site-visuals'
  | 'site-entry'
  | 'site-columns'
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

export type UploadImage = (file: File) => Promise<string>;

export type BlogAdminConsoleProps = {
  initialData: BlogData | null;
  initialStats: BlogStats | null;
};
