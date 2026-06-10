import { describe, it, expect } from 'vitest';
import {
  sha256Bytes,
  sha256Hex,
  hmacSha256Hex,
  toHex,
  utf8,
} from '@/utils/crypto';

describe('sha256', () => {
  // Published NIST/FIPS-180 known-answer vectors.
  it.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    ],
  ])('hashes %j correctly', (input, expected) => {
    expect(sha256Hex(input)).toBe(expected);
  });

  it('produces a 32-byte digest', () => {
    expect(sha256Bytes(utf8('anything')).length).toBe(32);
  });

  it('is deterministic', () => {
    expect(sha256Hex('seed')).toBe(sha256Hex('seed'));
  });

  it('handles multi-block input (> 64 bytes)', () => {
    const long = 'a'.repeat(200);
    expect(sha256Hex(long)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('hmacSha256', () => {
  it('matches the RFC test vector (key/fox)', () => {
    expect(hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    );
  });

  it('handles a key longer than the block size (64 bytes)', () => {
    expect(hmacSha256Hex('k'.repeat(100), 'msg')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs from a plain hash of the message', () => {
    expect(hmacSha256Hex('key', 'msg')).not.toBe(sha256Hex('msg'));
  });
});

describe('hex/utf8 helpers', () => {
  it('round-trips bytes to lowercase hex', () => {
    expect(toHex(new Uint8Array([0, 15, 16, 255]))).toBe('000f10ff');
  });

  it('utf8-encodes strings', () => {
    expect(Array.from(utf8('AB'))).toEqual([65, 66]);
  });
});
