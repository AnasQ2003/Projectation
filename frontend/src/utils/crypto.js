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
 * Global console protection — intercepts all console calls in the browser
 * Redacts passwords, tokens, and raw confidential payloads globally
 */
export function installGlobalConsoleProtection() {
  if (typeof window === 'undefined' || window.__consoleProtectionInstalled) return;
  window.__consoleProtectionInstalled = true;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.log = (...args) => {
    const safe = args.map(arg => (typeof arg === 'object' ? maskSensitive(arg) : arg));
    originalLog(...safe);
  };

  console.warn = (...args) => {
    // Filter out useless React or CSS warnings to keep console clean and professional
    const firstStr = typeof args[0] === 'string' ? args[0] : '';
    if (
      firstStr.includes('React Router') ||
      firstStr.includes('React does not recognize') ||
      firstStr.includes('Extra attributes from the server')
    ) {
      return;
    }
    const safe = args.map(arg => (typeof arg === 'object' ? maskSensitive(arg) : arg));
    originalWarn(...safe);
  };

  console.error = (...args) => {
    const safe = args.map(arg => (typeof arg === 'object' ? maskSensitive(arg) : arg));
    originalError(...safe);
  };
}
