import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('additional-data'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('additional-data'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
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

/**
 * Encrypt account number for storage
 */
export function encryptAccountNumber(accountNumber: string): string {
  const encrypted = encrypt(accountNumber);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt account number for display (masked)
 */
export function decryptAndMaskAccountNumber(encryptedAccountNumber: string): string {
  try {
    const encryptedData = JSON.parse(encryptedAccountNumber) as EncryptedData;
    const decrypted = decrypt(encryptedData);
    
    // Mask all but last 4 digits
    if (decrypted.length <= 4) return '*'.repeat(decrypted.length);
    return '*'.repeat(decrypted.length - 4) + decrypted.slice(-4);
  } catch (error) {
    console.error('Failed to decrypt account number:', error);
    return '****';
  }
}

/**
 * Encrypt access token for storage
 */
export function encryptAccessToken(token: string): string {
  const encrypted = encrypt(token);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt access token for API calls
 */
export function decryptAccessToken(encryptedToken: string): string {
  const encryptedData = JSON.parse(encryptedToken) as EncryptedData;
  return decrypt(encryptedData);
}
