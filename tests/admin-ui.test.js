import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('admin structured CMS UI wiring', () => {
  it('exposes structured projects, links, media, and upload controls', async () => {
    const [html, script] = await Promise.all([
      readFile('admin.html', 'utf8'),
      readFile('assets/js/admin.js', 'utf8')
    ]);

    assert.match(html, /data-panel="projectsPanel"/);
    assert.match(html, /data-panel="mediaPanel"/);
    assert.match(html, /role="tablist"/);
    assert.match(html, /role="tab"/);
    assert.match(html, /role="tabpanel"/);
    assert.match(html, /aria-selected="true"/);
    assert.match(html, /aria-controls="postsPanel"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /id="linksEditor"/);
    assert.match(html, /id="projectsEditor"/);
    assert.match(html, /id="musicEditor"/);
    assert.match(html, /id="galleryEditor"/);
    assert.match(html, /id="uploadFile"/);
    assert.match(html, /id="uploadTarget"/);
    assert.match(html, /id="uploadPath"/);
    assert.match(html, /id="copyUploadPathButton"/);
    assert.match(html, /id="linksInput"[^>]*readonly/);
    assert.match(html, /id="projectsInput"[^>]*readonly/);
    assert.match(html, /id="siteMusic"[^>]*readonly/);
    assert.match(html, /id="siteGallery"[^>]*readonly/);
    assert.equal((html.match(/id="siteMusic"/g) || []).length, 1);
    assert.equal((html.match(/id="siteGallery"/g) || []).length, 1);

    assert.ok(script.includes("linksEditor: document.querySelector('#linksEditor')"));
    assert.ok(script.includes("projectsEditor: document.querySelector('#projectsEditor')"));
    assert.ok(script.includes("musicEditor: document.querySelector('#musicEditor')"));
    assert.ok(script.includes("galleryEditor: document.querySelector('#galleryEditor')"));
    assert.match(script, /handlePanelKeydown/);
    assert.match(script, /getNextPanelIndex/);
    assert.match(script, /aria-selected/);
    assert.match(script, /panel\.hidden = !isActive/);
    assert.match(script, /role="listitem"/);
    assert.match(script, /aria-label="删除项目/);
    assert.match(script, /首页精选/);
    assert.match(script, /handleUploadImage/);
    assert.match(script, /handleCopyUploadPath/);
    assert.match(script, /setLastStructuredField/);
    assert.match(script, /inputs\.at\(-1\)/);
    assert.match(script, /addStructuredItem\(fallbackKind\)/);
    assert.ok(script.includes('/api/admin/uploads/image'));
    assert.match(script, /syncProjectsJsonFromEditor/);
    assert.match(script, /syncMediaJsonFromEditors/);
  });

  it('keeps keyboard focus states visible in the admin console', async () => {
    const css = await readFile('assets/css/admin.css', 'utf8');

    assert.match(css, /:focus-visible/);
    assert.match(css, /outline: 3px solid var\(--gold\)/);
    assert.match(css, /\.nav-button\[aria-selected="true"\]/);
  });
});
