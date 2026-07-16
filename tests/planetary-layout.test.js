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
module.exports = { getCameraProfile, getDetailMapHeight, getDetailNodeSide, getDetailOrbitProfiles, getDetailSlots, getLayoutMode, getOrbitProfiles, getOrbitSlot };
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

    let previousOrbitHeight = 0;

    for (const total of [6, 12, 36, 54]) {
      const profiles = getOrbitProfiles(total);
      const camera = getCameraProfile(total, profiles, getLayoutMode(total));
      const assigned = profiles.reduce((sum, profile) => sum + profile.size, 0);
      const outer = profiles[profiles.length - 1];

      assert.equal(getLayoutMode(total), 'orbit');
      assert.equal(assigned, total);
      assert.ok(profiles.every((profile) => profile.size <= profile.capacity));
      assert.ok(profiles[0].capacity <= 6);
      assert.ok(outer.radiusX >= 28 + (profiles.length - 1) * 10);
      assert.ok(outer.radiusX <= 28 + (profiles.length - 1) * 10.5);
      assert.ok(outer.radiusY >= 18.5 + (profiles.length - 1) * 7.5);
      assert.ok(camera.mapHeight >= 820);
      assert.ok(camera.mapHeight <= 1900);
      assert.ok(camera.mapHeight >= previousOrbitHeight);
      assert.ok(camera.cameraScale >= 0.56);
      previousOrbitHeight = camera.mapHeight;

      for (let index = 0; index < total; index += 1) {
        const slot = getOrbitSlot(index, total, profiles);
        const visibleX = 50 + (slot.x - 50) * camera.cameraScale;
        const visibleY = 50 + (slot.y - 50) * camera.cameraScale;

        assert.ok(visibleX > 8 && visibleX < 92, `x visible with breathing room for ${total}/${index}`);
        assert.ok(visibleY > 12 && visibleY < 88, `y visible with breathing room for ${total}/${index}`);
        assert.ok(Math.abs(visibleX - 50) <= 40, `x orbit remains near center for ${total}/${index}`);
        assert.ok(Math.abs(visibleY - 50) <= 32, `y orbit remains near center for ${total}/${index}`);
      }
    }

    assert.equal(getLayoutMode(72), 'atlas');
    assert.equal(getLayoutMode(120), 'atlas');

    const atlasProfiles = getOrbitProfiles(12);
    const atlasCamera = getCameraProfile(12, atlasProfiles, 'atlas');

    assert.equal(atlasCamera.cameraScale, 1);
    assert.ok(atlasCamera.mapHeight >= 880);
  });

  it('expands detailed orbits for longer entries and keeps cards opening away from the core', async () => {
    const { getDetailMapHeight, getDetailNodeSide, getDetailOrbitProfiles, getDetailSlots } = await loadPlanetaryLayoutHelpers();

    const shortItems = Array.from({ length: 10 }, (_, index) => ({
      id: `short-${index}`,
      label: 'tag',
      meta: '1 item',
      detail: 'short summary',
      href: '/'
    }));
    const longItems = Array.from({ length: 10 }, (_, index) => ({
      id: `long-${index}`,
      label: 'detailed tag',
      meta: '12 entries',
      detail: 'A deliberately long description for testing adaptive detail-card spacing. '.repeat(8),
      href: '/',
      tags: ['layout', 'readability']
    }));

    const compactProfiles = getDetailOrbitProfiles(shortItems);
    const expandedProfiles = getDetailOrbitProfiles(longItems);
    const compactOuter = compactProfiles[compactProfiles.length - 1];
    const expandedOuter = expandedProfiles[expandedProfiles.length - 1];

    assert.ok(expandedProfiles.length >= compactProfiles.length);
    assert.ok(expandedOuter.radiusX >= compactOuter.radiusX);
    assert.ok(expandedOuter.radiusY >= compactOuter.radiusY);
    assert.ok(getDetailMapHeight(expandedProfiles, longItems) > getDetailMapHeight(compactProfiles, shortItems));
    assert.equal(getDetailNodeSide(82, 50), 'right');
    assert.equal(getDetailNodeSide(18, 50), 'left');
    assert.equal(getDetailNodeSide(50, 18), 'above');
    assert.equal(getDetailNodeSide(50, 82), 'below');

    const detailLayout = getDetailSlots(longItems, getDetailMapHeight(expandedProfiles, longItems));
    assert.equal(detailLayout.slots.size, longItems.length);
    for (const side of ['left', 'right']) {
      const sideSlots = [...detailLayout.slots.values()].filter((slot) => slot.side === side).sort((a, b) => Number.parseInt(a.y, 10) - Number.parseInt(b.y, 10));
      for (let index = 1; index < sideSlots.length; index += 1) {
        const prior = sideSlots[index - 1];
        const current = sideSlots[index];
        const priorY = Number.parseInt(prior.y, 10);
        const currentY = Number.parseInt(current.y, 10);
        assert.ok(currentY - priorY >= (prior.cardHeight + current.cardHeight) / 2 + 32);
      }
    }
  });
});
