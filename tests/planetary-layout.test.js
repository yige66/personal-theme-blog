import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { describe, it } from 'node:test';
import ts from 'typescript';

async function loadPlanetaryLayoutHelpers() {
  const source = await readFile('components/channels/PlanetaryOrbitMap.tsx', 'utf8');
  const start = source.indexOf('function clamp');
  const end = source.indexOf('function getNodeSide');

  assert.notEqual(start, -1, 'layout helper start not found');
  assert.notEqual(end, -1, 'layout helper end not found');

  const snippet = `${source.slice(start, end)}
module.exports = { getCameraProfile, getLayoutMode, getOrbitProfiles, getOrbitSlot };
`;
  const transpiled = ts.transpileModule(snippet, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;
  const sandbox = { module: { exports: {} }, exports: {} };

  vm.runInNewContext(transpiled, sandbox);
  return sandbox.module.exports;
}

describe('planetary adaptive layout math', () => {
  it('keeps orbit counts expandable and falls back to atlas before the orbit gets cramped', async () => {
    const { getCameraProfile, getLayoutMode, getOrbitProfiles, getOrbitSlot } = await loadPlanetaryLayoutHelpers();

    for (const total of [6, 12, 36, 54]) {
      const profiles = getOrbitProfiles(total);
      const camera = getCameraProfile(total, profiles, getLayoutMode(total));
      const assigned = profiles.reduce((sum, profile) => sum + profile.size, 0);
      const outer = profiles[profiles.length - 1];

      assert.equal(getLayoutMode(total), 'orbit');
      assert.equal(assigned, total);
      assert.ok(profiles.every((profile) => profile.size <= profile.capacity));
      assert.ok(profiles[0].capacity <= 6);
      assert.ok(outer.radiusX >= 32 + (profiles.length - 1) * 11);
      assert.ok(camera.mapHeight >= 768);
      assert.ok(camera.cameraScale >= 0.46);

      for (let index = 0; index < total; index += 1) {
        const slot = getOrbitSlot(index, total, profiles);
        const visibleX = 50 + (slot.x - 50) * camera.cameraScale;
        const visibleY = 50 + (slot.y - 50) * camera.cameraScale;

        assert.ok(visibleX > 4 && visibleX < 96, `x visible for ${total}/${index}`);
        assert.ok(visibleY > 5 && visibleY < 95, `y visible for ${total}/${index}`);
      }
    }

    assert.equal(getLayoutMode(72), 'atlas');
    assert.equal(getLayoutMode(120), 'atlas');
  });
});
