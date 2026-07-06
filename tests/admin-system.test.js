import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import blogData from '../data/blog.json' with { type: 'json' };
import { validateBlogDataDraft } from '../lib/blog-admin.ts';
import { validateAdminAudioFile, validateAdminImageFile } from '../lib/admin-assets.ts';

describe('blog administration operating system', () => {
  it('ships an admin surface that can edit and persist the full blog data model', async () => {
    const [
      adminPage,
      appLayout,
      splashScreen,
      homeEffects,
      globalToolbox,
      adminConsole,
      adminFieldEditors,
      adminTypes,
      adminConfig,
      adminUtils,
      adminBlogApi,
      adminManagement,
      adminAssetsApi,
      adminLib,
      robots,
      css,
      homeCss
    ] = await Promise.all([
      readFile('app/admin/page.tsx', 'utf8'),
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/SplashScreen.tsx', 'utf8'),
      readFile('components/HomeEffects.tsx', 'utf8'),
      readFile('components/GlobalToolbox.tsx', 'utf8'),
      readFile('components/admin/BlogAdminConsole.tsx', 'utf8'),
      readFile('components/admin/AdminFieldEditors.tsx', 'utf8'),
      readFile('components/admin/adminTypes.ts', 'utf8'),
      readFile('components/admin/adminConfig.ts', 'utf8'),
      readFile('components/admin/adminUtils.ts', 'utf8'),
      readFile('app/api/admin/blog/route.ts', 'utf8'),
      readFile('lib/admin-management.ts', 'utf8'),
      readFile('app/api/admin/assets/route.ts', 'utf8'),
      readFile('lib/blog-admin.ts', 'utf8'),
      readFile('app/robots.ts', 'utf8'),
      readFile('app/globals.css', 'utf8'),
      readFile('app/home-overrides.css', 'utf8')
    ]);

    assert.match(adminPage, /BlogAdminConsole/);
    assert.match(adminPage, /getBlogData/);
    assert.match(adminPage, /getBlogStats/);
    assert.match(adminPage, /buildAdminManagementOverview/);
    assert.match(adminPage, /metadata/);
    assert.match(adminPage, /robots/);
    assert.match(adminPage, /admin-private-page/);
    assert.doesNotMatch(adminPage, /SiteNav/);
    assert.doesNotMatch(adminPage, /NODE_ENV !== 'production'/);
    assert.match(adminPage, /initialData=\{data\}/);
    assert.match(adminPage, /initialOverview=\{overview\}/);
    assert.match(appLayout, /<SplashScreen site=\{data\.site\}/);
    assert.match(splashScreen, /usePathname/);
    assert.match(splashScreen, /pathname\.startsWith\('\/admin'\)/);
    assert.match(splashScreen, /xh-splash-seen/);
    assert.match(homeEffects, /const isAdmin = pathname\.startsWith\('\/admin'\)/);
    assert.match(homeEffects, /if \(isAdmin \|\| !effects\.enabled\)/);
    assert.match(globalToolbox, /const isAdmin = pathname\.startsWith\('\/admin'\)/);
    assert.match(globalToolbox, /if \(isHome \|\| isAdmin\)/);

    assert.match(adminConsole, /columnWorkspaces/);
    assert.match(adminConsole, /仅限本人使用/);
    assert.match(adminConsole, /站点管理台/);
    assert.match(adminConsole, /fraud-admin-shell/);
    assert.doesNotMatch(adminConsole, /admin-plain-system/);
    assert.doesNotMatch(adminConsole, /Content Control Center/);
    assert.match(adminConsole, /AdminSidebar/);
    assert.match(adminConsole, /AdminToolPanel/);
    assert.match(adminFieldEditors, /PlainTextEditor/);
    assert.match(adminFieldEditors, /ImageUploadField/);
    assert.match(adminFieldEditors, /ImageListEditor/);
    assert.match(adminFieldEditors, /ImageCropDialog/);
    assert.match(adminFieldEditors, /createAspectCropArea/);
    assert.match(adminFieldEditors, /formatCropAspect/);
    assert.match(adminFieldEditors, /cropAspect/);
    assert.match(adminFieldEditors, /cropImageFile/);
    assert.match(adminFieldEditors, /canvas\.toBlob/);
    assert.match(adminFieldEditors, /data-crop-dialog/);
    assert.match(adminFieldEditors, /URL\.createObjectURL/);
    assert.match(adminFieldEditors, /accept="image\/jpeg,image\/png,image\/webp,image\/gif,image\/avif"/);
    assert.match(adminConsole, /handleImageUpload/);
    assert.match(adminConsole, /RecordListEditor/);
    assert.match(adminConsole, /handleSave/);
    assert.match(adminConsole, /handleExport/);
    assert.match(adminConsole, /handleImport/);
    assert.match(adminConsole, /管理分区/);
    assert.match(adminConsole, /页面展示/);
    assert.match(adminConsole, /内容管理/);
    assert.match(adminConsole, /辅助设置/);
    assert.match(adminConsole, /后台密码/);
    assert.match(adminConsole, /保存数据/);
    assert.match(adminConsole, /PathFieldSections/);
    assert.match(adminConsole, /FieldSectionLabel/);
    assert.match(adminConsole, /常用字段/);
    assert.match(adminConsole, /简单发布/);
    assert.match(adminConsole, /写新文章/);
    assert.match(adminConsole, /文章发布表单/);
    assert.match(adminConsole, /更多设置/);
    assert.match(adminConsole, /ProjectGitHubSourcePanel/);
    assert.match(adminConsole, /前台项目排序/);
    assert.match(adminConsole, /前台展示顺序/);
    assert.match(adminConsole, /site', 'projectOrder/);
    assert.match(adminConsole, /parseProjectOrderText/);
    assert.match(adminConsole, /每行一个 GitHub 仓库名/);
    assert.match(adminConsole, /不用手写项目/);
    assert.match(adminConsole, /项目更新后自动同步/);
    assert.match(adminConsole, /新增仓库会被 Vercel Cron 每日巡检同步到项目页/);
    assert.match(adminConsole, /\/api\/github\/projects/);
    assert.match(adminConsole, /GITHUB_PROJECTS_WEBHOOK_SECRET/);
    assert.match(adminConsole, /前台项目页会读取 GitHub 公开仓库/);
    assert.doesNotMatch(adminConsole, /projectFields/);
    assert.doesNotMatch(adminConsole, /path: \['projects'\]/);
    assert.match(adminFieldEditors, /字段说明/);
    assert.match(adminFieldEditors, /这个设置一般不用改/);
    assert.match(adminConsole, /recordSubtitle/);
    assert.doesNotMatch(adminConsole, /正文 Markdown/);
    assert.doesNotMatch(adminConsole, /原始对象 JSON/);
    assert.doesNotMatch(adminFieldEditors, /正文 Markdown/);
    assert.doesNotMatch(adminFieldEditors, /原始对象 JSON/);
    assert.doesNotMatch(adminConsole, /写入令牌/);
    assert.doesNotMatch(adminConsole, /正在保存到 data\/blog\.json/);
    assert.match(adminConsole, /AdminOperationState/);
    assert.match(adminConsole, /createApiErrorState/);
    assert.match(adminConsole, /createNetworkErrorState/);
    assert.match(adminConsole, /readAdminJson/);
    assert.match(adminConsole, /OperationStatusNotice/);
    assert.match(adminConsole, /错误原因/);
    assert.match(adminConsole, /下一步/);
    assert.match(adminConsole, /role=\{state\.status === 'error' \? 'alert' : 'status'\}/);
    assert.match(adminFieldEditors, /admin-field-error/);
    assert.match(adminFieldEditors, /getUploadErrorMessage/);

    assert.match(adminConfig, /site-profile/);
    assert.match(adminConfig, /site-visuals/);
    assert.match(adminConfig, /site-backgrounds/);
    assert.match(adminConfig, /site-entry/);
    assert.match(adminConfig, /posts/);
    assert.match(adminConfig, /projects/);
    assert.match(adminConfig, /GitHub 同步/);
    assert.match(adminConfig, /site\.github \/ GitHub 公开仓库 \/ site\.pages\.projects/);
    assert.match(adminConfig, /gallery/);
    assert.match(adminConfig, /links/);
    assert.match(adminConfig, /advanced: true/);
    assert.match(adminConfig, /brandSuffix/);
    assert.match(adminConfig, /createColumnFields/);
    assert.match(adminConfig, /createPageContentFields/);
    assert.match(adminConfig, /site', 'pages', pageId/);
    assert.match(adminConfig, /brandSuffix'.*advanced: true/);
    assert.match(adminConfig, /themeColor'.*advanced: true/);
    assert.match(adminConfig, /signal'.*advanced: true/);
    assert.match(adminConfig, /updatedAt'.*advanced: true/);
    assert.match(adminConfig, /cropAspect: 16 \/ 9/);
    assert.match(adminConfig, /cropAspect: 1/);
    assert.doesNotMatch(adminConfig, /cropAspect: 4 \/ 3/);
    const postFieldsBlock = adminConfig.match(/export const postFields[\s\S]*?export const projectFields/)?.[0] ?? '';
    const noteFieldsBlock = adminConfig.match(/export const noteFields[\s\S]*?export const chatterFields/)?.[0] ?? '';
    const chatterFieldsBlock = adminConfig.match(/export const chatterFields[\s\S]*?export const galleryFields/)?.[0] ?? '';
    const galleryFieldsBlock = adminConfig.match(/export const galleryFields[\s\S]*?export const musicFields/)?.[0] ?? '';
    assert.doesNotMatch(postFieldsBlock, /cropAspect/);
    assert.doesNotMatch(noteFieldsBlock, /cropAspect/);
    assert.doesNotMatch(chatterFieldsBlock, /cropAspect/);
    assert.doesNotMatch(galleryFieldsBlock, /cropAspect/);
    assert.doesNotMatch(noteFieldsBlock, /key: 'tags'/);
    assert.match(adminTypes, /'tag-list'/);
    assert.match(adminFieldEditors, /TagListEditor/);
    assert.match(adminFieldEditors, /tagOptions/);
    assert.match(adminFieldEditors, /onCreateTag/);
    assert.match(adminFieldEditors, /admin-selected-tag-chip/);
    assert.match(adminFieldEditors, /admin-tag-picker-popover/);
    assert.doesNotMatch(adminFieldEditors, /splitTagDraft/);
    assert.match(adminTypes, /cropAspect\?: number/);
    assert.match(adminTypes, /AdminManagementOverview/);
    assert.match(adminTypes, /AdminManagementModule/);

    assert.match(adminUtils, /updateAtPath/);
    assert.match(adminConsole, /createEmptyItem/);

    assert.match(adminManagement, /buildAdminManagementOverview/);
    assert.match(adminManagement, /moduleBlueprints/);
    assert.match(adminManagement, /背景图独立分区/);
    assert.match(adminManagement, /hasUnsafeSecret/);

    assert.match(adminBlogApi, /export async function GET/);
    assert.match(adminBlogApi, /export async function POST/);
    assert.match(adminBlogApi, /validateBlogDataDraft/);
    assert.match(adminBlogApi, /saveBlogData/);
    assert.match(adminBlogApi, /management: buildAdminManagementOverview/);
    assert.match(adminBlogApi, /revalidatePath\('\/', 'layout'\)/);
    assert.match(adminBlogApi, /ADMIN_WRITE_TOKEN/);

    assert.match(adminAssetsApi, /export async function POST/);
    assert.match(adminAssetsApi, /validateAdminImageFile/);
    assert.match(adminAssetsApi, /saveAdminImageFile/);
    assert.match(adminAssetsApi, /ADMIN_WRITE_TOKEN/);

    assert.match(adminLib, /validateBlogDataDraft/);
    assert.match(adminLib, /validateUniqueIds/);
    assert.match(adminLib, /createBlogDataBackup/);
    assert.match(adminLib, /writeFile/);
    assert.match(adminLib, /blog\.json/);

    assert.match(adminConsole, /getWorkspaceTools/);
    assert.match(adminConsole, /createPageContentFields\('tag-detail'\)/);
    assert.match(adminConsole, /TagLibraryPanel/);
    assert.match(adminConsole, /addTagToLibrary/);
    assert.match(adminConsole, /removeTagFromPosts/);
    assert.match(adminConsole, /removeTagFromChatters/);
    assert.match(adminConsole, /site', 'tags/);
    assert.doesNotMatch(adminConsole, /ContentTagsNoticePanel/);
    assert.match(adminConsole, /标签详情页/);
    assert.doesNotMatch(adminConsole, /ColumnNavigator/);
    assert.doesNotMatch(adminConsole, /WorkspaceToolPanel/);
    assert.doesNotMatch(adminConsole, /route: '\/console'/);
    assert.doesNotMatch(adminConfig, /column-console|发布栏目|\/console/);
    assert.match(robots, /'\/admin'/);
    assert.match(css, /\.admin-os/);
    assert.match(css, /\.admin-private-page/);
    assert.match(css, /body:has\(\.admin-private-page\) \.xh-background-slider/);
    assert.match(css, /body:has\(\.admin-private-page\) \.xh-floating-player/);
    assert.match(css, /body:has\(\.admin-private-page\) \.xh-global-toolbox/);
    assert.match(homeCss, /Admin readability lock/);
    assert.match(homeCss, /#xh-app-root:has\(\.admin-private-page\)/);
    assert.match(homeCss, /text-shadow: none !important/);
    assert.match(css, /\.fraud-admin-shell/);
    assert.match(css, /\.fraud-admin-layout/);
    assert.match(css, /\.fraud-tool-tabs/);
    assert.match(css, /\.fraud-admin-panel/);
    assert.match(css, /\.admin-soft-section/);
    assert.match(css, /\.admin-publish-guide/);
    assert.match(css, /\.admin-field-section-label/);
    assert.match(css, /\.admin-field/);
    assert.match(css, /\.admin-record-list/);
    assert.match(css, /\.admin-image-uploader/);
    assert.match(css, /\.admin-selected-tag-chip/);
    assert.match(css, /\.admin-tag-picker-popover/);
    assert.match(css, /\.admin-image-preview/);
    assert.match(css, /\.admin-image-preview img[\s\S]*height: auto/);
    assert.match(css, /\.admin-image-preview img[\s\S]*object-fit: contain/);
    assert.match(css, /\.admin-crop-dialog/);
    assert.match(css, /\.admin-crop-frame/);
    assert.match(css, /\.admin-crop-box/);
    assert.match(css, /\.admin-prose-editor/);
    assert.match(css, /\.admin-operation-status/);
    assert.match(css, /\.admin-operation-details/);
    assert.match(css, /\.admin-operation-suggestion/);
    assert.match(css, /\.admin-field-error/);
    assert.match(css, /data-status="error"/);
  });

  it('lets admin-managed background images drive the frontend without a count cap', async () => {
    const [layout, background, blog, adminConsole] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/BackgroundSlider.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('components/admin/BlogAdminConsole.tsx', 'utf8')
    ]);

    assert.match(layout, /export const dynamic = 'force-dynamic'/);
    assert.match(background, /return uniqueImages\(site\.backgroundImages \?\? \[\]\)/);
    assert.doesNotMatch(background, /\bsite\.heroImage\b/);
    assert.doesNotMatch(background, /\bsite\.avatar\b/);
    assert.doesNotMatch(background, /\bsite\.gallery\b/);
    assert.doesNotMatch(background, /\.slice\(0,\s*\d+\)/);
    assert.match(blog, /backgroundImages: normalizeAssetList\(siteInput\.backgroundImages, fallbackSite\.backgroundImages\)/);
    assert.doesNotMatch(blog, /normalizeAssetList\(siteInput\.backgroundImages, fallbackSite\.backgroundImages,\s*\d+\)/);
    assert.match(blog, /function normalizeAssetList\(value: unknown, fallback: string\[\]\): string\[\]/);
    assert.match(blog, /return Array\.isArray\(value\) \? assets : fallback/);
    assert.match(adminConsole, /function AssetPreview/);
    assert.match(adminConsole, /new Set\(data\.site\.backgroundImages\.filter\(Boolean\)\)/);
    assert.match(adminConsole, /aria-label="背景图预览"/);
    assert.doesNotMatch(adminConsole, /function collectImagePaths/);
  });

  it('lets the about page header image be managed independently from the homepage cover', async () => {
    const [aboutRoom, adminConfig, blog, blogAdmin] = await Promise.all([
      readFile('components/channels/AboutRoom.tsx', 'utf8'),
      readFile('components/admin/adminConfig.ts', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('lib/blog-admin.ts', 'utf8')
    ]);

    assert.match(blog, /aboutHeroImage: string/);
    assert.match(blog, /aboutHeroImage: '\/assets\/img\/hero-mountain\.svg'/);
    assert.match(blog, /aboutHeroImage: normalizeOptionalAsset\(siteInput\.aboutHeroImage\) \|\| normalizeOptionalAsset\(siteInput\.heroImage\) \|\| fallbackSite\.aboutHeroImage/);
    assert.match(adminConfig, /site', 'aboutHeroImage/);
    assert.match(adminConfig, /aboutHeroImage', label: '关于页头图'/);
    assert.match(blogAdmin, /validateOptionalAssetPath\(data\.site\.aboutHeroImage, 'site\.aboutHeroImage', errors\)/);
    assert.match(aboutRoom, /const aboutHeroImage = site\.aboutHeroImage \|\| site\.heroImage/);
    assert.match(aboutRoom, /src=\{aboutHeroImage\}/);
    assert.doesNotMatch(aboutRoom, /src=\{site\.heroImage\}/);
    assert.match(aboutRoom, /const activityHref = page\.primaryActionHref \|\| '\/about\?tab=activity'/);
    assert.match(aboutRoom, /href=\{activityHref\}/);
  });

  it('keeps admin-managed entry copy as the source of truth for the splash screen', async () => {
    const [splashScreen, adminConfig, blog] = await Promise.all([
      readFile('components/SplashScreen.tsx', 'utf8'),
      readFile('components/admin/adminConfig.ts', 'utf8'),
      readFile('lib/blog.ts', 'utf8')
    ]);

    assert.match(adminConfig, /site', 'entry', 'preloaderTitle/);
    assert.match(adminConfig, /site', 'entry', 'preloaderSubtitle/);
    assert.match(adminConfig, /site', 'entry', 'enterButton/);
    assert.match(blog, /preloaderTitle: textOrFallback\(source\.preloaderTitle/);
    assert.match(blog, /preloaderSubtitle: textOrFallback\(source\.preloaderSubtitle/);
    assert.match(blog, /enterButton: textOrFallback\(source\.enterButton/);

    assert.match(splashScreen, /entry\.preloaderTitle/);
    assert.match(splashScreen, /entry\.preloaderSubtitle/);
    assert.match(splashScreen, /entry\.enterButton/);
    assert.match(splashScreen, /entry\.original/);
    assert.match(splashScreen, /entry\.beyond/);
    assert.doesNotMatch(splashScreen, /const startCopy/);
    assert.doesNotMatch(splashScreen, /Now Loading\.\.\./);
    assert.doesNotMatch(splashScreen, /preparing your space/);
  });

  it('validates the blog draft before saving and rejects duplicate identifiers', () => {
    const valid = validateBlogDataDraft(blogData);
    assert.equal(valid.ok, true);

    const validPageActionData = JSON.parse(JSON.stringify(blogData));
    validPageActionData.site.pages = {
      projects: {
        primaryActionHref: '/projects?filter=featured',
        secondaryActionHref: '/projects#featured'
      },
      archive: {
        primaryActionHref: '#archive-top',
        secondaryActionHref: '/archive?tag=Next.js#results'
      },
      friends: {
        primaryActionHref: '#gitalk-container',
        secondaryActionHref: '/friends#gitalk-container'
      },
      about: {
        primaryActionHref: '/about?tab=activity',
        secondaryActionHref: '/friends'
      }
    };

    const validPageActions = validateBlogDataDraft(validPageActionData);
    assert.equal(validPageActions.ok, true);

    const duplicatePostData = {
      ...blogData,
      posts: [
        blogData.posts[0],
        { ...blogData.posts[1], id: blogData.posts[0].id, slug: blogData.posts[0].slug }
      ]
    };

    const invalid = validateBlogDataDraft(duplicatePostData);
    assert.equal(invalid.ok, false);
    if (!invalid.ok) {
      assert.match(invalid.errors.join('\n'), /重复/);
    }

    const invalidOperationalData = JSON.parse(JSON.stringify(blogData));
    invalidOperationalData.links = [{
      title: 'Unsafe Friend',
      url: 'https://example.com',
      description: 'Used to verify friend-link URL validation.',
      avatar: '/assets/img/avatar-orbit.svg'
    }];
    invalidOperationalData.links[0].url = 'javascript:alert(1)';
    invalidOperationalData.site.cloudMusicIds = ['not-a-number'];
    invalidOperationalData.site.comments.clientSecret = 'never-store-this';
    invalidOperationalData.site.projectOrder = ['personal-theme-blog', 'personal-theme-blog'];
    invalidOperationalData.site.pages = {
      about: {
        primaryActionHref: 'javascript:alert(1)'
      }
    };

    const invalidOperational = validateBlogDataDraft(invalidOperationalData);
    assert.equal(invalidOperational.ok, false);
    if (!invalidOperational.ok) {
      const errors = invalidOperational.errors.join('\n');
      assert.match(errors, /links\[0\]\.url/);
      assert.match(errors, /cloudMusicIds\[0\]/);
      assert.match(errors, /不允许保存 OAuth 密钥/);
      assert.match(errors, /site\.projectOrder\[1\]/);
      assert.match(errors, /site\.pages\.about\.primaryActionHref/);
    }

    const tagColumnData = JSON.parse(JSON.stringify(blogData));
    tagColumnData.site.tags = [...tagColumnData.site.tags, 'Column Tag'];
    tagColumnData.posts[0].tags = ['Column Tag'];
    tagColumnData.chatters[0].tags = ['Column Tag'];
    const tagColumn = validateBlogDataDraft(tagColumnData);
    assert.equal(tagColumn.ok, true);

    const invalidPostTagData = JSON.parse(JSON.stringify(blogData));
    invalidPostTagData.posts[0].tags = [...invalidPostTagData.posts[0].tags, 'Unlisted Tag'];
    const invalidPostTag = validateBlogDataDraft(invalidPostTagData);
    assert.equal(invalidPostTag.ok, false);
    if (!invalidPostTag.ok) {
      assert.match(invalidPostTag.errors.join('\n'), /posts\[0\]\.tags.*site\.tags/);
    }

    const invalidChatterTagData = JSON.parse(JSON.stringify(blogData));
    invalidChatterTagData.chatters[0].tags = [...invalidChatterTagData.chatters[0].tags, 'Unlisted Tag'];
    const invalidChatterTag = validateBlogDataDraft(invalidChatterTagData);
    assert.equal(invalidChatterTag.ok, false);
    if (!invalidChatterTag.ok) {
      assert.match(invalidChatterTag.errors.join('\n'), /chatters\[0\]\.tags.*site\.tags/);
    }

    const invalidMomentTagData = JSON.parse(JSON.stringify(blogData));
    invalidMomentTagData.notes[0].tags = ['Spring Boot'];
    const invalidMomentTag = validateBlogDataDraft(invalidMomentTagData);
    assert.equal(invalidMomentTag.ok, false);
    if (!invalidMomentTag.ok) {
      assert.match(invalidMomentTag.errors.join('\n'), /notes\[0\]\.tags/);
    }
  });

  it('supports richer friend-link records for adding other sites from the admin console', async () => {
    const [blogLib, adminConfig, adminUtils, friendsClient] = await Promise.all([
      readFile('lib/blog.ts', 'utf8'),
      readFile('components/admin/adminConfig.ts', 'utf8'),
      readFile('components/admin/adminUtils.ts', 'utf8'),
      readFile('components/FriendsBoardClient.tsx', 'utf8')
    ]);

    for (const field of ['category', 'owner', 'status', 'addedAt', 'reciprocal', 'note']) {
      assert.match(adminConfig, new RegExp(`key: '${field}'`), `missing admin friend field ${field}`);
      assert.match(blogLib, new RegExp(`${field}\\??:`), `missing BlogLink field ${field}`);
    }
    assert.match(adminUtils, /case 'link'/);
    assert.match(adminUtils, /category: '个人站'/);
    assert.match(adminUtils, /description: '待确认的友链申请。'/);
    assert.match(adminUtils, /status: 'pending'/);
    assert.match(adminUtils, /reciprocal: false/);
    assert.match(friendsClient, /link\.category/);
    assert.match(friendsClient, /link\.status/);
    assert.match(friendsClient, /link\.reciprocal/);

    const validFriendLinkData = JSON.parse(JSON.stringify(blogData));
    validFriendLinkData.links.push({
      title: 'Example Friend',
      url: 'https://example.com',
      description: '一个用于验证友链新增流程的外部站点。',
      avatar: 'https://example.com/avatar.png',
      themeColor: '#7cd9ff',
      category: '个人站',
      owner: 'Example',
      status: 'pending',
      addedAt: '2026-07-05',
      reciprocal: false,
      note: '通过后台新增，等待对方确认。'
    });

    assert.equal(validateBlogDataDraft(validFriendLinkData).ok, true);

    const { createEmptyItem } = await import('../components/admin/adminUtils.ts');
    const newFriendLinkData = JSON.parse(JSON.stringify(blogData));
    newFriendLinkData.links.push(createEmptyItem('link'));
    assert.equal(validateBlogDataDraft(newFriendLinkData).ok, true);
  });

  it('accepts only safe local image uploads for admin-managed assets', () => {
    const png = validateAdminImageFile({
      name: 'cover.png',
      type: 'image/png',
      size: 128 * 1024
    });
    assert.equal(png.ok, true);

    const svg = validateAdminImageFile({
      name: 'unsafe.svg',
      type: 'image/svg+xml',
      size: 10 * 1024
    });
    assert.equal(svg.ok, false);

    const large = validateAdminImageFile({
      name: 'large.jpg',
      type: 'image/jpeg',
      size: 8 * 1024 * 1024
    });
    assert.equal(large.ok, true);

    const huge = validateAdminImageFile({
      name: 'huge.jpg',
      type: 'image/jpeg',
      size: 26 * 1024 * 1024
    });
    assert.equal(huge.ok, false);
    if (!huge.ok) {
      assert.match(huge.error, /25MB/);
    }
  });

  it('lets the admin upload specified audio files for music playback', async () => {
    const [adminConfig, fieldEditors, assetsRoute, assetsLib] = await Promise.all([
      readFile('components/admin/adminConfig.ts', 'utf8'),
      readFile('components/admin/AdminFieldEditors.tsx', 'utf8'),
      readFile('app/api/admin/assets/route.ts', 'utf8'),
      readFile('lib/admin-assets.ts', 'utf8')
    ]);

    assert.match(adminConfig, /key: 'url', label: '音频地址', kind: 'audio'/);
    assert.match(adminConfig, /\/assets\/audio\/your-song\.mp3/);
    assert.match(fieldEditors, /AudioUploadField/);
    assert.match(fieldEditors, /accept="audio\/mpeg,audio\/mp4,audio\/ogg,audio\/wav,audio\/webm,audio\/flac"/);
    assert.match(fieldEditors, /uploadImage\(file, 'audio'\)/);
    assert.match(assetsRoute, /kindParam/);
    assert.match(assetsRoute, /validateAdminAudioFile/);
    assert.match(assetsRoute, /saveAdminAudioFile/);
    assert.match(assetsLib, /public', 'assets', 'audio'/);

    assert.equal(validateAdminAudioFile({ name: 'my-song.mp3', type: 'audio/mpeg', size: 5 * 1024 * 1024 }).ok, true);
    assert.equal(validateAdminAudioFile({ name: 'my-song.wav', type: 'audio/wav', size: 5 * 1024 * 1024 }).ok, true);
    assert.equal(validateAdminAudioFile({ name: 'my-song.txt', type: 'text/plain', size: 100 }).ok, false);
    assert.equal(validateAdminAudioFile({ name: 'huge-song.mp3', type: 'audio/mpeg', size: 101 * 1024 * 1024 }).ok, false);
  });
});
