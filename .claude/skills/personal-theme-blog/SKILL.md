```markdown
# personal-theme-blog Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development conventions and workflows for the `personal-theme-blog` repository, a TypeScript-based Next.js project for a personal blog with custom themes, subpages, seasonal effects, music integration, and an admin CMS. You'll learn how to contribute using the project's coding standards, follow its modular workflow patterns, and use suggested commands to streamline common tasks.

---

## Coding Conventions

### File Naming

- Use **kebab-case** for file names.
  - Example: `home-effects.tsx`, `section-blocks.tsx`

### Import Style

- Use **alias imports** for modules.
  - Example:
    ```typescript
    import SectionBlocks from '@/components/section-blocks';
    import { getBlogData } from '@/lib/blog-admin';
    ```

### Export Style

- **Mixed exports** are used (both default and named).
  - Example:
    ```typescript
    // Default export
    export default function HomeWorld() { ... }

    // Named export
    export function getAdminData() { ... }
    ```

### Commit Messages

- Use **conventional commits** with prefixes: `fix`, `feat`, `refactor`.
  - Example: `feat: add snow effect to homepage`
  - Keep commit messages concise (average ~41 characters).

---

## Workflows

### Subpage Experience Update

**Trigger:** When you want to improve or unify the look and feel of multiple subpages (e.g., gallery, moments, projects, tags).

**Command:** `/update-subpages`

1. Edit relevant files in `app/*/page.tsx` (e.g., `app/gallery/page.tsx`).
2. Update shared components such as `components/SectionBlocks.tsx`, `MomentsBoard.tsx`, or `ChannelHeader.tsx`.
3. Adjust global or subpage-specific styles (`app/globals.css`, `app/home-overrides.css`).
4. Update or add related tests (`tests/subpage-experience.test.js`, `tests/experience-density.test.js`).

**Example:**
```typescript
// app/gallery/page.tsx
import SectionBlocks from '@/components/section-blocks';

export default function GalleryPage() {
  return <SectionBlocks title="Gallery" />;
}
```

---

### Homepage Experience Update

**Trigger:** When you want to enhance or restyle the homepage, including visual effects, navigation, or splash screens.

**Command:** `/update-homepage`

1. Edit `app/page.tsx` and/or `app/layout.tsx`.
2. Modify or add homepage-specific components (`HomeEffects.tsx`, `HomeWorld.tsx`, `SplashScreen.tsx`, `SiteNav.tsx`).
3. Update or add CSS (`app/globals.css`, `app/home-overrides.css`).
4. Update or add homepage-related tests (`tests/frontend-source.test.js`).

**Example:**
```typescript
// components/HomeEffects.tsx
export default function HomeEffects() {
  // Seasonal or animated effects here
}
```

---

### Admin CMS Workflow Update

**Trigger:** When you want to enhance or fix the admin CMS, including UI, media workflow, or accessibility.

**Command:** `/update-admin-cms`

1. Edit `admin.html` and/or `assets/js/admin.js`.
2. Update or add admin-related CSS (`assets/css/admin.css`).
3. Modify or add admin components (`components/admin/*`).
4. Update server logic if needed (`server.js`, `lib/blog-admin.ts`, `lib/admin-assets.ts`).
5. Update or add admin-related tests (`tests/admin-ui.test.js`, `tests/admin-system.test.js`).

**Example:**
```typescript
// components/admin/AdminPanel.tsx
export function AdminPanel() {
  // Admin dashboard UI
}
```

---

### Blog Content Curation

**Trigger:** When you want to curate, refine, or update blog content and metadata.

**Command:** `/curate-content`

1. Edit `data/blog.json`.
2. Optionally update friend links/components (`FriendsBoardClient.tsx`, `adminUtils.ts`).
3. Update or add content-related tests (`tests/content-quality.test.js`, `tests/admin-system.test.js`, `tests/social-music-comments.test.js`).

**Example:**
```json
// data/blog.json
[
  {
    "title": "First Post",
    "date": "2024-06-01",
    "tags": ["introduction", "welcome"]
  }
]
```

---

### Seasonal Effects Update

**Trigger:** When you want to add, refine, or rebuild seasonal visual effects (e.g., snow, petals) on the homepage.

**Command:** `/update-seasonal-effects`

1. Edit `app/home-overrides.css`.
2. Edit or add `components/HomeEffects.tsx`.
3. Add or update assets in `public/assets/seasonal/`.
4. Update or add related tests (`tests/frontend-source.test.js`).

**Example:**
```css
/* app/home-overrides.css */
.snow-effect {
  animation: snow-fall 10s linear infinite;
}
```

---

### Music and Comments Integration

**Trigger:** When you want to integrate or update music playback features and social comments.

**Command:** `/update-music-comments`

1. Edit or add music-related components (`components/music/*`, `MusicStudio.tsx`).
2. Edit or add comment-related components (`components/comments/GitHubComments.tsx`).
3. Edit or add music/comment API routes (`app/api/music/route.ts`, `app/api/github/route.ts`).
4. Update or add related tests (`tests/music-playback.test.js`, `tests/social-music-comments.test.js`).

**Example:**
```typescript
// components/music/Player.tsx
export default function Player({ src }: { src: string }) {
  return <audio controls src={src} />;
}
```

---

## Testing Patterns

- Test files use the pattern `*.test.js`.
- Testing framework is **unknown** (likely Jest or similar).
- Tests are located in the `tests/` directory and cover UI, experience, admin, content, and integration features.

**Example:**
```javascript
// tests/music-playback.test.js
test('music player loads and plays', () => {
  // ...test implementation
});
```

---

## Commands

| Command                  | Purpose                                                        |
|--------------------------|----------------------------------------------------------------|
| /update-subpages         | Update or unify subpage experiences (gallery, moments, etc)    |
| /update-homepage         | Enhance or restyle the homepage                               |
| /update-admin-cms        | Improve or fix admin CMS features                             |
| /curate-content          | Curate or update blog content and metadata                    |
| /update-seasonal-effects | Add or refine seasonal visual effects on homepage             |
| /update-music-comments   | Integrate or update music playback and social comments        |
```
