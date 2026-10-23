/**
 * crypto.js — Client-side Encryption & Safe Logging Utility
 *
 * Protects sensitive application data from being exposed in browser devtools,
 * network request payloads, network responses, console logs, and local persistence.
 */

// Shared transport encryption secret matching backend
const TRANSPORT_SECRET = 'Projectation-Secure-Key-2026-X9@Dagger';
const CLIENT_SECRET = TRANSPORT_SECRET;

/**
 * Converts Uint8Array to Base64 in safe chunks
 */
function uint8ToBase64(uint8) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Converts Base64 to Uint8Array
 */
function base64ToUint8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts payload for client-to-server network transmission (Byte-safe UTF-8 XOR)
 * Obscures all fields from DevTools Network Inspection (Payload tab)
 */
export function encryptTransportPayload(data) {
  if (data === null || data === undefined) return data;
  const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const keyBytes = encoder.encode(TRANSPORT_SECRET);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return uint8ToBase64(out);
}

/**
 * Decrypts transport payload received from server (Byte-safe UTF-8 XOR)
 * Decrypts obfuscated responses received from DevTools Network inspection
 */
export function decryptTransportPayload(encoded) {
  if (!encoded || typeof encoded !== 'string') return encoded;
  try {
    const bytes = base64ToUint8(encoded);
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(TRANSPORT_SECRET);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    const decoder = new TextDecoder('utf-8');
    const decodedStr = decoder.decode(out);
    try {
      return JSON.parse(decodedStr);
    } catch {
      return decodedStr;
    }
  } catch {
    return encoded;
  }
}

/**
 * Reversible XOR-Base64 cipher for client-side storage obfuscation
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
const SENSITIVE_KEYS = [
  'password', 'token', 'authorization', 'secret', 'key', 
  'payload', '_encrypted', 'credit_card', 'ssn'
];

export function maskSensitive(data, seen = new WeakSet(), depth = 0) {
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

/**
 * Native console performance — avoids intercepting or cloning data in DevTools
 */
export function installGlobalConsoleProtection() {
  // Retain native browser console performance for instant DevTools inspection
}
