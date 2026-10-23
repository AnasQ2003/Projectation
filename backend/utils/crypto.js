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
 * Byte-safe XOR Transport Encryption matching frontend TextEncoder / Uint8Array
 */
function encryptTransportPayload(data) {
  if (data === null || data === undefined) return data;
  const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const buf = Buffer.from(str, 'utf8');
  const keyBuf = Buffer.from(TRANSPORT_SECRET, 'utf8');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ keyBuf[i % keyBuf.length];
  }
  return out.toString('base64');
}

/**
 * Byte-safe XOR Transport Decryption matching frontend TextDecoder / Uint8Array
 */
function decryptTransportPayload(b64) {
  if (!b64 || typeof b64 !== 'string') return b64;
  try {
    const buf = Buffer.from(b64, 'base64');
    const keyBuf = Buffer.from(TRANSPORT_SECRET, 'utf8');
    const out = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
      out[i] = buf[i] ^ keyBuf[i % keyBuf.length];
    }
    const decodedStr = out.toString('utf8');
    try {
      return JSON.parse(decodedStr);
    } catch {
      return decodedStr;
    }
  } catch (err) {
    throw new Error('Failed to decrypt payload: ' + err.message);
  }
}

/**
 * Express middleware that automatically unpacks encrypted request bodies
 */
function decryptPayloadMiddleware(req, res, next) {
  if (req.headers['x-encrypted-transport'] === '1') {
    req.isEncryptedClient = true;
  }

  if (req.body && (req.body._encrypted || req.body.encrypted) && req.body.payload) {
    req.isEncryptedClient = true;
    try {
      req.body = decryptTransportPayload(req.body.payload);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid encrypted payload' });
    }
  }
  next();
}

/**
 * Express middleware that automatically wraps JSON responses in transport encryption
 * whenever the client uses encrypted transport
 */
function encryptResponseMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    const isEncrypted = req.isEncryptedClient ||
                        req.headers['x-encrypted-transport'] === '1' ||
                        (req.body && (req.body._encrypted || req.body.encrypted));

    if (isEncrypted && data !== undefined && data !== null) {
      if (typeof data === 'object' && data._encrypted) {
        return originalJson(data);
      }
      res.setHeader('X-Encrypted-Transport', '1');
      return originalJson({
        _encrypted: true,
        payload: encryptTransportPayload(data)
      });
    }
    return originalJson(data);
  };

  next();
}

/**
 * Recursively masks sensitive fields in objects for safe logging
 */
const SENSITIVE_KEYS = [
  'password', 'token', 'authorization', 'secret', 'key', 
  'credit_card', 'ssn', 'payload', '_encrypted'
];

function maskSensitive(data, seen = new WeakSet(), depth = 0) {
  if (!data || depth > 4) return data;
  if (typeof data !== 'object') return data;
  if (seen.has(data)) return '[Circular]';
  seen.add(data);

  if (Array.isArray(data)) {
    return data.map(item => maskSensitive(item, seen, depth + 1));
  }

  const masked = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k));
    if (isSensitive) {
      masked[key] = '[PROTECTED_ENCRYPTED]';
    } else if (value && typeof value === 'object') {
      masked[key] = maskSensitive(value, seen, depth + 1);
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
  if (process.env.NODE_ENV !== 'production') {
    const method = req.method;
    const url = req.originalUrl || req.url;
    console.log(`[${timestamp}] ${method} ${url} [Encrypted Transport]`);
  }
  next();
}

module.exports = {
  encrypt,
  decrypt,
  encryptTransportPayload,
  decryptTransportPayload,
  decryptPayloadMiddleware,
  encryptResponseMiddleware,
  maskSensitive,
  safeLoggerMiddleware
};
