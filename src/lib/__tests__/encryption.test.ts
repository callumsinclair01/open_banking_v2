import { encrypt, decrypt, encryptToString, decryptFromString, encryptAccountNumber, decryptAndMaskAccountNumber } from '@/lib/encryption';

const OLD_ENV = process.env;

describe('encryption', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ENCRYPTION_KEY: '12345678901234567890123456789012' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('encrypts and decrypts roundtrip', () => {
    const plaintext = 'hello-world';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('serializes and deserializes correctly', () => {
    const s = encryptToString('secret');
    expect(decryptFromString(s)).toBe('secret');
  });

  it('masks account numbers correctly', () => {
    const payload = encryptAccountNumber('123456789');
    const masked = decryptAndMaskAccountNumber(payload);
    expect(masked.endsWith('6789')).toBe(true);
    expect(masked.replace(/\*/g, '').length).toBe(4);
  });
});

