/**
 * crypto.js — Secure Data Encryption, Decryption & Masking Utility
 * 
 * Protects sensitive application data from being exposed in logs and console.
 * Uses AES-256-GCM authenticated encryption for maximum security.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// Default secret key derived from environment or secure fallback
const SECRET_PASSPHRASE = process.env.ENCRYPTION_SECRET || 'Projectation-Secure-Key-2026-X9@Dagger';

/**
 * Derives a 32-byte cryptographic key from passphrase and salt
 */
function deriveKey(salt) {
  return crypto.scryptSync(SECRET_PASSPHRASE, salt, KEY_LENGTH);
}

/**
 * Encrypt a plain text string into a secure hex string
 * Returns format: salt:iv:authTag:encryptedData
 */
function encrypt(text) {
  if (text === null || text === undefined) return text;
  const str = typeof text === 'object' ? JSON.stringify(text) : String(text);

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(str, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted hex string back to original plain text
 */
function decrypt(cipherString) {
  if (!cipherString || typeof cipherString !== 'string') return cipherString;
  const parts = cipherString.split(':');
  if (parts.length !== 4) {
    // Not in encrypted format, return as is
    return cipherString;
  }

  const [saltHex, ivHex, authTagHex, encryptedData] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

/**
 * Recursively masks sensitive fields in objects for safe logging
 * Replaces values of password, token, authorization, etc. with [ENCRYPTED/MASKED]
 */
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'key', 'credit_card', 'ssn'];

function maskSensitive(data) {
  if (!data) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => maskSensitive(item));
  }

  const masked = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k));
    if (isSensitive) {
      masked[key] = '[PROTECTED_ENCRYPTED]';
    } else if (value && typeof value === 'object') {
      masked[key] = maskSensitive(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

/**
 * Express Middleware to safely log requests without revealing sensitive information
 */
function safeLoggerMiddleware(req, res, next) {
  const timestamp = new Date().toISOString();
  const safeBody = maskSensitive(req.body);
  const safeQuery = maskSensitive(req.query);

  if (process.env.NODE_ENV !== 'production') {
    const hasBody = req.body && Object.keys(req.body).length > 0;
    const bodyStr = hasBody ? JSON.stringify(safeBody) : '';
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url} ${bodyStr}`);
  }

  next();
}

module.exports = {
  encrypt,
  decrypt,
  maskSensitive,
  safeLoggerMiddleware
};
