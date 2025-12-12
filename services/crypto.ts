/**
 * Cryptographic service using native Web Crypto API for AES-GCM.
 * This ensures military-grade encryption without external heavyweight libraries.
 */

interface SecurePayload {
  content: string;
  expiresAt: number | null; // Timestamp in ms, or null if no expiry
}

// Generate a key from a password
async function getKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts a text message using AES-256-GCM.
 * Supports an optional TTL (Time To Live) in seconds for self-destructing messages.
 */
export const encryptMessage = async (message: string, password: string, ttlSeconds: number = 0): Promise<string> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await getKeyFromPassword(password, salt);
  const enc = new TextEncoder();

  // Create payload with expiry
  const payload: SecurePayload = {
    content: message,
    expiresAt: ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null
  };
  
  const serializedPayload = JSON.stringify(payload);
  const encodedMessage = enc.encode(serializedPayload);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encodedMessage
  );

  // Pack everything into a JSON string to hide in the image
  const bundle = {
    s: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(ciphertext)
  };

  return JSON.stringify(bundle);
};

/**
 * Decrypts the JSON string bundle using the password.
 * Checks for expiration and throws "MESSAGE_EXPIRED" if the TTL has passed.
 */
export const decryptMessage = async (encryptedBundle: string, password: string): Promise<string> => {
  try {
    const bundle = JSON.parse(encryptedBundle);
    if (!bundle.s || !bundle.iv || !bundle.data) {
      throw new Error("Invalid encrypted data format");
    }

    const salt = new Uint8Array(base64ToArrayBuffer(bundle.s));
    const iv = new Uint8Array(base64ToArrayBuffer(bundle.iv));
    const data = base64ToArrayBuffer(bundle.data);

    const key = await getKeyFromPassword(password, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      data
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decrypted);
    
    // Parse Payload
    try {
        const payload: SecurePayload = JSON.parse(jsonString);
        
        // Check Self-Destruct
        if (payload.expiresAt && Date.now() > payload.expiresAt) {
            throw new Error("MESSAGE_EXPIRED");
        }
        
        return payload.content;
    } catch (e) {
        if ((e as Error).message === "MESSAGE_EXPIRED") throw e;
        // If it's not JSON (legacy messages), return raw string
        return jsonString;
    }

  } catch (error) {
    if ((error as Error).message === "MESSAGE_EXPIRED") {
        throw error;
    }
    // This usually happens when the tag verification fails (wrong password or tampered data)
    throw new Error("Decryption failed. Wrong Security Key or corrupted data.");
  }
};