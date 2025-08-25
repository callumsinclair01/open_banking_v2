import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }
  return Buffer.from(raw, 'utf8');
}

export interface EncryptedData {
  ciphertext: string; // hex
  iv: string; // hex
  tag: string; // hex
}

/**
 * Encrypt sensitive data with AES-256-GCM
 */
export function encrypt(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypt sensitive data
 */
export function decrypt(data: EncryptedData): string {
  const iv = Buffer.from(data.iv, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(data.ciphertext, 'hex')),
    decipher.final(),
  ]).toString('utf8');
  return plaintext;
}

/**
 * Hash sensitive data (one-way)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/** Serialize helpers **/
export function encryptToString(value: string): string {
  return JSON.stringify(encrypt(value));
}

export function decryptFromString(payload: string): string {
  const parsed = JSON.parse(payload) as EncryptedData;
  return decrypt(parsed);
}

/** Account number helpers **/
export function encryptAccountNumber(accountNumber: string): string {
  return encryptToString(accountNumber);
}

export function decryptAndMaskAccountNumber(encryptedAccountNumber: string): string {
  try {
    const decrypted = decryptFromString(encryptedAccountNumber);
    if (decrypted.length <= 4) return '*'.repeat(decrypted.length);
    return '*'.repeat(decrypted.length - 4) + decrypted.slice(-4);
  } catch {
    return '****';
  }
}

/** Access token helpers **/
export function encryptAccessToken(token: string): string {
  return encryptToString(token);
}

export function decryptAccessToken(encryptedToken: string): string {
  return decryptFromString(encryptedToken);
}
