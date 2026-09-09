import { toLocalTimestamp } from '../time';

describe('toLocalTimestamp', () => {
  it('serialises the wall-clock time the user picked, not the UTC equivalent', () => {
    // 10:00 AM local — the first slot the picker offers
    const slot = new Date(2026, 8, 9, 10, 0, 0, 0);
    expect(toLocalTimestamp(slot)).toBe('2026-09-09T10:00:00');
  });

  it('zero-pads single-digit months, days, hours and minutes', () => {
    const slot = new Date(2026, 0, 5, 9, 5, 0, 0);
    expect(toLocalTimestamp(slot)).toBe('2026-01-05T09:05:00');
  });

  it('does not shift the date across a midnight boundary the way toISOString can', () => {
    // In any timezone ahead of UTC, toISOString() rolls this back to the 8th
    const slot = new Date(2026, 8, 9, 1, 0, 0, 0);
    expect(toLocalTimestamp(slot)).toBe('2026-09-09T01:00:00');
  });
});
