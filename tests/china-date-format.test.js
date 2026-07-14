import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { formatChinaDate, formatChinaDateTime } from '../lib/china-date-format.ts';

describe('China-time date formatting', () => {
  it('formats absolute timestamps deterministically for the public site', () => {
    assert.equal(formatChinaDate('2026-07-04T08:00:00.000Z'), '2026/07/04');
    assert.equal(formatChinaDateTime('2026-07-04T08:00:00.000Z'), '2026-07-04 16:00');
    assert.equal(formatChinaDateTime('2026-07-10', '/'), '2026/07/10 08:00');
    assert.equal(formatChinaDateTime('invalid-date'), 'invalid-date');
  });

  it('interprets timezone-less timestamps as China time', () => {
    assert.equal(formatChinaDateTime('2026-07-10T12:30'), '2026-07-10 12:30');
    assert.equal(formatChinaDateTime('2026-07-10 12:30:45.5'), '2026-07-10 12:30');
  });

  it('rejects normalized calendar dates while accepting leap days', () => {
    assert.equal(formatChinaDate('2026-02-30'), '2026-02-30');
    assert.equal(formatChinaDateTime('2026-02-30T08:00:00Z'), '2026-02-30T08:00:00Z');
    assert.equal(formatChinaDate('2024-02-29'), '2024/02/29');
    assert.equal(formatChinaDate('2025-02-29'), '2025-02-29');
  });

  it('keeps hydrated archive and moment text on the shared formatter', async () => {
    const [archive, moments] = await Promise.all([
      readFile('components/ArchiveSwitchboard.tsx', 'utf8'),
      readFile('components/MomentsBoard.tsx', 'utf8')
    ]);

    assert.match(archive, /formatChinaDateTime/);
    assert.match(archive, /formatChinaDate/);
    assert.doesNotMatch(archive, /getFullYear\(|new Intl\.DateTimeFormat/);
    assert.match(moments, /formatChinaDateTime/);
    assert.doesNotMatch(moments, /new Intl\.DateTimeFormat/);
  });
});
