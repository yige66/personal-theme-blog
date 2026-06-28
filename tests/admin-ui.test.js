import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('admin project management UI wiring', () => {
  it('exposes a projects panel and binds it in the admin script', async () => {
    const [html, script] = await Promise.all([
      readFile('admin.html', 'utf8'),
      readFile('assets/js/admin.js', 'utf8')
    ]);

    assert.match(html, /data-panel="projectsPanel"/);
    assert.match(html, /id="projectsPanel"/);
    assert.match(html, /id="projectsForm"/);
    assert.match(html, /id="projectsInput"/);
    assert.match(script, /projectsForm: document\.querySelector\('#projectsForm'\)/);
    assert.match(script, /projectsInput: document\.querySelector\('#projectsInput'\)/);
    assert.match(script, /handleSaveProjects/);
    assert.match(script, /\/api\/admin\/projects/);
  });
});
