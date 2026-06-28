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
    assert.match(html, /id="linksEditor"/);
    assert.match(html, /id="projectsEditor"/);
    assert.match(html, /id="musicEditor"/);
    assert.match(html, /id="galleryEditor"/);
    assert.match(html, /id="uploadFile"/);
    assert.match(html, /id="uploadTarget"/);
    assert.match(html, /id="uploadPath"/);
    assert.equal((html.match(/id="siteMusic"/g) || []).length, 1);
    assert.equal((html.match(/id="siteGallery"/g) || []).length, 1);

    assert.ok(script.includes("linksEditor: document.querySelector('#linksEditor')"));
    assert.ok(script.includes("projectsEditor: document.querySelector('#projectsEditor')"));
    assert.ok(script.includes("musicEditor: document.querySelector('#musicEditor')"));
    assert.ok(script.includes("galleryEditor: document.querySelector('#galleryEditor')"));
    assert.match(script, /handleUploadImage/);
    assert.ok(script.includes('/api/admin/uploads/image'));
    assert.match(script, /syncProjectsJsonFromEditor/);
    assert.match(script, /syncMediaJsonFromEditors/);
  });
});
