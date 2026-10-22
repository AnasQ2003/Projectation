/**
 * crypto.js — Secure Data Encryption, Decryption & Masking Utility
 * 
 * Protects sensitive application data from being exposed in logs, console, and network payloads.
 * Supports AES-256-GCM authenticated encryption for database/tokens and transport encryption for client payloads.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// Default secret key derived from environment or secure fallback
const SECRET_PASSPHRASE = process.env.ENCRYPTION_SECRET || 'Projectation-Secure-Key-2026-X9@Dagger';
const TRANSPORT_SECRET = SECRET_PASSPHRASE;

/**
 * Derives a 32-byte cryptographic key from passphrase and salt
 */
function deriveKey(salt) {
  return crypto.scryptSync(SECRET_PASSPHRASE, salt, KEY_LENGTH);
}

/**
 * Encrypt a plain text string into a secure hex string (AES-256-GCM)
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
 * Decrypt an AES-256-GCM encrypted hex string back to original plain text
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
 * Decrypts transport payload sent by frontend client
 */
function decryptTransportPayload(b64) {
  if (!b64 || typeof b64 !== 'string') return b64;
  try {
    const decoded = decodeURIComponent(Buffer.from(b64, 'base64').toString('utf8'));
    let res = '';
    for (let i = 0; i < decoded.length; i++) {
      res += String.fromCharCode(decoded.charCodeAt(i) ^ TRANSPORT_SECRET.charCodeAt(i % TRANSPORT_SECRET.length));
    }
    return JSON.parse(res);
  } catch (err) {
    throw new Error('Failed to decrypt payload: ' + err.message);
  }
}

/**
 * Encrypts payload for client-server transport
 */
function encryptTransportPayload(data) {
  if (!data) return data;
  const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
  let res = '';
  for (let i = 0; i < str.length; i++) {
    res += String.fromCharCode(str.charCodeAt(i) ^ TRANSPORT_SECRET.charCodeAt(i % TRANSPORT_SECRET.length));
  }
  return Buffer.from(encodeURIComponent(res), 'utf8').toString('base64');
}

/**
 * Express middleware that automatically unpacks encrypted request bodies
 */
function decryptPayloadMiddleware(req, res, next) {
  if (req.body && (req.body._encrypted || req.body.encrypted) && req.body.payload) {
    try {
      req.body = decryptTransportPayload(req.body.payload);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid encrypted payload' });
    }
  }
  next();
}

/**
 * Recursively masks sensitive fields in objects for safe logging
 */
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'key', 'credit_card', 'ssn', 'payload', '_encrypted'];

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
  encryptTransportPayload,
  decryptTransportPayload,
  decryptPayloadMiddleware,
  maskSensitive,
  safeLoggerMiddleware
};
