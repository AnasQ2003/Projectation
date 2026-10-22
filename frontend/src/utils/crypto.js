/**
 * crypto.js — Client-side Encryption & Safe Logging Utility
 *
 * Protects sensitive application data from being exposed in browser devtools,
 * network request payloads, console logs, and local persistence.
 */

// Shared transport encryption secret matching backend
const TRANSPORT_SECRET = 'Projectation-Secure-Key-2026-X9@Dagger';
const CLIENT_SECRET = TRANSPORT_SECRET;

/**
 * Encrypts payload for client-to-server network transmission
 * Obscures sensitive fields (like passwords) from DevTools Network Inspection
 */
export function encryptTransportPayload(data) {
  if (!data) return data;
  const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ TRANSPORT_SECRET.charCodeAt(i % TRANSPORT_SECRET.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(encodeURIComponent(result));
}

/**
 * Decrypts transport payload received from server
 */
export function decryptTransportPayload(encoded) {
  if (!encoded) return encoded;
  try {
    const decoded = decodeURIComponent(atob(encoded));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ TRANSPORT_SECRET.charCodeAt(i % TRANSPORT_SECRET.length);
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
 * Simple reversible XOR-Base64 cipher for client-side storage obfuscation
 */
export function encryptClientData(text) {
  return encryptTransportPayload(text);
}

export function decryptClientData(encoded) {
  return decryptTransportPayload(encoded);
}

/**
 * Redacts sensitive credentials from being printed to browser console
 */
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'key', 'payload', '_encrypted'];

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
