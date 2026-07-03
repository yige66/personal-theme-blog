import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import blogData from '../data/blog.json' with { type: 'json' };
import { validateBlogDataDraft } from '../lib/blog-admin.ts';
import { validateAdminImageFile } from '../lib/admin-assets.ts';

describe('blog administration operating system', () => {
  it('ships an admin surface that can edit and persist the full blog data model', async () => {
    const [
      adminPage,
      appLayout,
      splashScreen,
      adminConsole,
      adminFieldEditors,
      adminTypes,
      adminConfig,
      adminUtils,
      adminBlogApi,
      adminAssetsApi,
      adminLib,
      consolePage,
      css
    ] = await Promise.all([
      readFile('app/admin/page.tsx', 'utf8'),
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/SplashScreen.tsx', 'utf8'),
      readFile('components/admin/BlogAdminConsole.tsx', 'utf8'),
      readFile('components/admin/AdminFieldEditors.tsx', 'utf8'),
      readFile('components/admin/adminTypes.ts', 'utf8'),
      readFile('components/admin/adminConfig.ts', 'utf8'),
      readFile('components/admin/adminUtils.ts', 'utf8'),
      readFile('app/api/admin/blog/route.ts', 'utf8'),
      readFile('app/api/admin/assets/route.ts', 'utf8'),
      readFile('lib/blog-admin.ts', 'utf8'),
      readFile('app/console/page.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(adminPage, /BlogAdminConsole/);
    assert.match(adminPage, /getBlogData/);
    assert.match(adminPage, /getBlogStats/);
    assert.match(adminPage, /metadata/);
    assert.doesNotMatch(adminPage, /NODE_ENV !== 'production'/);
    assert.match(adminPage, /initialData=\{data\}/);
    assert.match(appLayout, /<SplashScreen site=\{data\.site\}/);
    assert.match(splashScreen, /usePathname/);
    assert.match(splashScreen, /pathname\.startsWith\('\/admin'\)/);
    assert.match(splashScreen, /xh-splash-seen/);

    assert.match(adminConsole, /ADMIN_SECTIONS/);
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
    assert.match(adminConsole, /选择内容/);
    assert.match(adminConsole, /填写修改/);
    assert.match(adminConsole, /保存生效/);
    assert.match(adminConsole, /后台密码/);
    assert.match(adminConsole, /保存到博客/);
    assert.match(adminConsole, /更多设置/);
    assert.match(adminFieldEditors, /字段说明/);
    assert.match(adminFieldEditors, /这个设置一般不用改/);
    assert.match(adminConsole, /recordSubtitle/);
    assert.doesNotMatch(adminConsole, /正文 Markdown/);
    assert.doesNotMatch(adminConsole, /原始对象 JSON/);
    assert.doesNotMatch(adminFieldEditors, /正文 Markdown/);
    assert.doesNotMatch(adminFieldEditors, /原始对象 JSON/);
    assert.doesNotMatch(adminConsole, /写入令牌/);
    assert.doesNotMatch(adminConsole, /正在保存到 data\/blog\.json/);

    assert.match(adminConfig, /site-profile/);
    assert.match(adminConfig, /site-visuals/);
    assert.match(adminConfig, /site-entry/);
    assert.match(adminConfig, /posts/);
    assert.match(adminConfig, /projects/);
    assert.match(adminConfig, /gallery/);
    assert.match(adminConfig, /links/);
    assert.match(adminConfig, /advanced: true/);
    assert.match(adminConfig, /brandSuffix/);
    assert.match(adminConfig, /cropAspect: 16 \/ 9/);
    assert.match(adminConfig, /cropAspect: 4 \/ 3/);
    assert.match(adminConfig, /cropAspect: 1/);
    assert.match(adminTypes, /cropAspect\?: number/);

    assert.match(adminUtils, /updateAtPath/);
    assert.match(adminConsole, /createEmptyItem/);

    assert.match(adminBlogApi, /export async function GET/);
    assert.match(adminBlogApi, /export async function POST/);
    assert.match(adminBlogApi, /validateBlogDataDraft/);
    assert.match(adminBlogApi, /saveBlogData/);
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

    assert.match(consolePage, /href="\/admin"/);
    assert.match(css, /\.admin-os/);
    assert.match(css, /\.admin-os-grid/);
    assert.match(css, /\.admin-field/);
    assert.match(css, /\.admin-record-list/);
    assert.match(css, /\.admin-image-uploader/);
    assert.match(css, /\.admin-image-preview/);
    assert.match(css, /\.admin-crop-dialog/);
    assert.match(css, /\.admin-crop-frame/);
    assert.match(css, /\.admin-crop-box/);
    assert.match(css, /\.admin-prose-editor/);
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
    assert.match(adminConsole, /collectBackgroundImagePaths/);
    assert.match(adminConsole, /aria-label="背景图预览"/);
    assert.doesNotMatch(adminConsole, /function collectImagePaths/);
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
      assert.match(invalid.errors.join('\n'), /duplicates/);
    }

    const invalidOperationalData = JSON.parse(JSON.stringify(blogData));
    invalidOperationalData.links[0].url = 'javascript:alert(1)';
    invalidOperationalData.site.cloudMusicIds = ['not-a-number'];
    invalidOperationalData.site.comments.clientSecret = 'never-store-this';

    const invalidOperational = validateBlogDataDraft(invalidOperationalData);
    assert.equal(invalidOperational.ok, false);
    if (!invalidOperational.ok) {
      const errors = invalidOperational.errors.join('\n');
      assert.match(errors, /links\[0\]\.url/);
      assert.match(errors, /cloudMusicIds\[0\]/);
      assert.match(errors, /must not store OAuth secrets/);
    }
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
});
