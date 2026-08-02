import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.auth.bcryptRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate secure random tokens
export const generateToken = (bytes: number = 32): string => {
  return randomBytes(bytes).toString('hex');
};

// Generate API key (format: prefix_randomstring)
export const generateApiKey = (): { key: string; prefix: string; hash: string } => {
  const prefix = randomBytes(4).toString('hex');
  const secret = randomBytes(24).toString('hex');
  const key = `pk_${prefix}_${secret}`;
  const hash = createHash('sha256').update(key).digest('hex');
  
  return { key, prefix: `pk_${prefix}`, hash };
};

// Hash API key for storage
export const hashApiKey = (key: string): string => {
  return createHash('sha256').update(key).digest('hex');
};

// Generate session ID
export const generateSessionId = (): string => {
  return `sess_${randomBytes(16).toString('hex')}`;
};

// Generate visitor ID (persistent anonymous tracking)
export const generateVisitorId = (): string => {
  return `vis_${randomBytes(12).toString('hex')}`;
};

// Simple encryption for sensitive data at rest
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export const encrypt = (text: string, key: string = config.auth.jwtSecret): string => {
  const keyBuffer = createHash('sha256').update(key).digest();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText: string, key: string = config.auth.jwtSecret): string => {
  const keyBuffer = createHash('sha256').update(key).digest();
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Generate secure code for email verification, etc.
export const generateSecureCode = (length: number = 6): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  const bytes = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  return code;
};

// Hash content for caching (fast, not secure)
export const hashContent = (content: string): string => {
  return createHash('md5').update(content).digest('hex');
};
