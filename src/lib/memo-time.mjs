export function getMemoTimestamp(memo) {
  return memo?.displayTime || memo?.createTime || memo?.updateTime || '';
}

export function formatMemoDateTime(memo) {
  const timestamp = typeof memo === 'string' ? memo : getMemoTimestamp(memo);
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getMemoDateKey(memo) {
  const timestamp = getMemoTimestamp(memo);
  if (typeof timestamp !== 'string') {
    return '';
  }

  const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
