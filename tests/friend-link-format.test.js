import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseFriendLinkApplication } from '../lib/friend-link-format.ts';

describe('friend link application import', () => {
  it('parses the four lines copied from the public application panel', () => {
    const result = parseFriendLinkApplication([
      '名称：Example Blog',
      '简介：记录代码与生活。',
      '链接：https://example.com',
      '头像：https://example.com/avatar.png'
    ].join('\n'));

    assert.deepEqual(result, {
      ok: true,
      data: {
        title: 'Example Blog',
        description: '记录代码与生活。',
        url: 'https://example.com',
        avatar: 'https://example.com/avatar.png'
      }
    });
  });

  it('rejects incomplete or unsafe applications before creating a record', () => {
    assert.equal(parseFriendLinkApplication('名称：Example Blog').ok, false);
    assert.equal(parseFriendLinkApplication([
      '名称：Example Blog',
      '简介：说明',
      '链接：javascript:alert(1)',
      '头像：https://example.com/avatar.png'
    ].join('\n')).ok, false);
  });
});
