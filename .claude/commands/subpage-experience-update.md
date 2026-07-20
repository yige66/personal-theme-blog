---
name: subpage-experience-update
description: Workflow command scaffold for subpage-experience-update in personal-theme-blog.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /subpage-experience-update

Use this workflow when working on **subpage-experience-update** in `personal-theme-blog`.

## Goal

Update or refine the visual/UX experience of subpages (e.g. gallery, moments, projects, tags, etc) across the site.

## Common Files

- `app/*/page.tsx`
- `components/SectionBlocks.tsx`
- `components/MomentsBoard.tsx`
- `components/ChannelHeader.tsx`
- `app/globals.css`
- `app/home-overrides.css`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit multiple files in app/*/page.tsx (e.g. app/gallery/page.tsx, app/moments/page.tsx, etc)
- Update shared components (e.g. components/SectionBlocks.tsx, MomentsBoard.tsx, ChannelHeader.tsx)
- Adjust global or subpage-specific styles (e.g. app/globals.css, app/home-overrides.css)
- Update relevant tests (e.g. tests/subpage-experience.test.js, tests/experience-density.test.js)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.