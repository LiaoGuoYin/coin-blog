import assert from 'node:assert/strict';
import test from 'node:test';

process.env.TZ = 'Asia/Shanghai';

const { formatMemoDateTime, getMemoDateKey, getMemoTimestamp } = await import('../src/lib/memo-time.mjs');

test('falls back to createTime when displayTime is missing', () => {
  const memo = {
    displayTime: null,
    createTime: '2026-04-18T03:12:33Z',
    updateTime: '2026-04-18T03:12:33Z',
  };

  assert.equal(getMemoTimestamp(memo), '2026-04-18T03:12:33Z');
  assert.equal(formatMemoDateTime(memo), '2026-04-18 11:12');
  assert.equal(getMemoDateKey(memo), '2026-04-18');
});

test('does not render NaN for invalid memo timestamps', () => {
  assert.equal(formatMemoDateTime({}), '');
  assert.equal(getMemoDateKey({}), '');
});
