/**
 * crypto.js — Client-side Encryption & Safe Logging Utility
 *
 * Protects sensitive application data from being exposed in browser devtools,
 * console logs, and local persistence.
 */

// Secret key for obfuscation / encryption in frontend storage
const CLIENT_SECRET = 'Projectation-Client-Key-2026-X9@Dagger';

/**
 * Simple reversible XOR-Base64 cipher for client-side storage obfuscation
 */
export function encryptClientData(text) {
  if (!text) return text;
  const str = typeof text === 'object' ? JSON.stringify(text) : String(text);
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ CLIENT_SECRET.charCodeAt(i % CLIENT_SECRET.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(encodeURIComponent(result));
}

export function decryptClientData(encoded) {
  if (!encoded) return encoded;
  try {
    const decoded = decodeURIComponent(atob(encoded));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ CLIENT_SECRET.charCodeAt(i % CLIENT_SECRET.length);
      result += String.fromCharCode(charCode);
    }
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  } catch {
    return encoded;
  }
}

/**
 * Redacts sensitive credentials from being printed to browser console
 */
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'key'];

export function maskSensitive(data) {
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
 * Safe console logger that prevents sensitive data leaks
 */
export const safeConsole = {
  log: (...args) => {
    const safeArgs = args.map(a => (typeof a === 'object' ? maskSensitive(a) : a));
    console.log(...safeArgs);
  },
  warn: (...args) => {
    const safeArgs = args.map(a => (typeof a === 'object' ? maskSensitive(a) : a));
    console.warn(...safeArgs);
  },
  error: (...args) => {
    const safeArgs = args.map(a => (typeof a === 'object' ? maskSensitive(a) : a));
    console.error(...safeArgs);
  }
};
