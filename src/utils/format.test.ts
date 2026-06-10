import { describe, it, expect } from 'vitest';
import { formatCurrency, formatMultiplier, truncateSeed } from '@/utils/format';

describe('formatCurrency', () => {
  it('renders two decimals with thousands separators', () => {
    expect(formatCurrency(1234.5)).toBe('1,234.50');
    expect(formatCurrency(0)).toBe('0.00');
    expect(formatCurrency(1000000)).toBe('1,000,000.00');
  });
});

describe('formatMultiplier', () => {
  it('renders two decimals with a × suffix', () => {
    expect(formatMultiplier(1)).toBe('1.00×');
    expect(formatMultiplier(2.3456)).toBe('2.35×');
  });
});

describe('truncateSeed', () => {
  it('shortens long seeds with an ellipsis', () => {
    expect(truncateSeed('abcdef0123456789', 4)).toBe('abcd…6789');
  });

  it('leaves short seeds intact', () => {
    expect(truncateSeed('abc', 6)).toBe('abc');
  });
});
