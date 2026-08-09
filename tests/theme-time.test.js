import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { describe, it } from 'node:test';
import ts from 'typescript';

async function loadThemeClockHelpers() {
  const source = await readFile('components/HomeEffects.tsx', 'utf8');
  const start = source.indexOf('function getThemeModeForDate');
  const end = source.indexOf('function getNextSeason');

  assert.notEqual(start, -1, 'theme clock helper start not found');
  assert.notEqual(end, -1, 'theme clock helper end not found');

  const snippet = `${source.slice(start, end)}
module.exports = { getNextThemeBoundary, getSeasonForDate, getThemeModeForDate, shouldAutoSwitchTheme };
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

describe('local theme clock', () => {
  it('uses 19:00 and 07:00 for the browser-local initial mode', async () => {
    const [layout, effects] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/HomeEffects.tsx', 'utf8')
    ]);

    assert.match(layout, /now\.getHours\(\) >= 19 \|\| now\.getHours\(\) < 7/);
    assert.match(effects, /function getThemeModeForDate/);
    assert.match(effects, /date\.getHours\(\) >= 19 \|\| date\.getHours\(\) < 7/);
  });

  it('schedules one automatic check at the next local day/night boundary', async () => {
    const effects = await readFile('components/HomeEffects.tsx', 'utf8');

    assert.match(effects, /const themeBoundaryTimerRef/);
    assert.match(effects, /function getNextThemeBoundary/);
    assert.match(effects, /function shouldAutoSwitchTheme/);
    assert.match(effects, /window\.setTimeout/);
    assert.match(effects, /startThemeTransition\(getThemeModeForDate\(new Date\(\)\)\)/);
  });

  it('maps local clock boundaries and calendar months to the requested states', async () => {
    const { getSeasonForDate, getThemeModeForDate } = await loadThemeClockHelpers();

    assert.equal(getThemeModeForDate(new Date(2026, 7, 8, 6, 59)), 'night');
    assert.equal(getThemeModeForDate(new Date(2026, 7, 8, 7, 0)), 'day');
    assert.equal(getThemeModeForDate(new Date(2026, 7, 8, 18, 59)), 'day');
    assert.equal(getThemeModeForDate(new Date(2026, 7, 8, 19, 0)), 'night');
    assert.equal(getSeasonForDate(new Date(2026, 2, 8)), 'spring');
    assert.equal(getSeasonForDate(new Date(2026, 5, 8)), 'summer');
    assert.equal(getSeasonForDate(new Date(2026, 8, 8)), 'autumn');
    assert.equal(getSeasonForDate(new Date(2026, 11, 8)), 'winter');
  });

  it('does not repeat an automatic switch when the current mode already matches local time', async () => {
    const { getNextThemeBoundary, shouldAutoSwitchTheme } = await loadThemeClockHelpers();
    const beforeNight = new Date(2026, 7, 8, 18, 59, 30);
    const nightBoundary = getNextThemeBoundary(beforeNight);
    const afterNight = new Date(2026, 7, 8, 19, 0);
    const dayBoundary = getNextThemeBoundary(afterNight);

    assert.equal(nightBoundary.getHours(), 19);
    assert.equal(nightBoundary.getDate(), beforeNight.getDate());
    assert.equal(dayBoundary.getHours(), 7);
    assert.equal(dayBoundary.getDate(), afterNight.getDate() + 1);
    assert.equal(shouldAutoSwitchTheme('day', afterNight), true);
    assert.equal(shouldAutoSwitchTheme('night', afterNight), false);
    assert.equal(shouldAutoSwitchTheme('night', new Date(2026, 7, 8, 7, 0)), true);
    assert.equal(shouldAutoSwitchTheme('day', new Date(2026, 7, 8, 7, 0)), false);
  });
});
