// src/utils/cryptoHelpers.js
// High-quality WebCrypto helpers for Secure File Vault


const enc = new TextEncoder();
const dec = new TextDecoder();


// --- conversions ---
export function arrayBufferToBase64(buf) {
const bytes = new Uint8Array(buf);
let binary = "";
for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
return btoa(binary);
}


export function base64ToArrayBuffer(b64) {
const binary = atob(b64);
const len = binary.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
return bytes.buffer;
}


export function hexToArrayBuffer(hex) {
if (!hex) return new ArrayBuffer(0);
const clean = hex.replace(/[^0-9a-fA-F]/g, "");
const l = clean.length / 2;
const bytes = new Uint8Array(l);
for (let i = 0; i < l; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
return bytes.buffer;
}


export function arrayBufferToHex(buffer) {
const bytes = new Uint8Array(buffer);
return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}


// wipe a Uint8Array (best-effort)
function zeroize(u8) {
if (!u8) return;
for (let i = 0; i < u8.length; i++) u8[i] = 0;
}


// --- AES helpers ---
export async function generateAESKey() {
return await crypto.subtle.generateKey(
{ name: 'AES-GCM', length: 256 },
true, // extractable == true for wrapping below; consider false if you keep keys ephemeral
['encrypt', 'decrypt']
);
}


export async function exportRawKey(key) {
return await crypto.subtle.exportKey('raw', key); // ArrayBuffer
}


export async function importAESKeyFromRaw(raw) {
return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}


export async function sha256(buffer) {
const hash = await crypto.subtle.digest('SHA-256', buffer);
return new Uint8Array(hash);
}


export async function encryptWithAESGCM(aesKey, plaintextArrayBuffer) {
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
{ name: 'AES-GCM', iv },
aesKey,
plaintextArrayBuffer
);
return { iv: iv.buffer, ciphertext };
}


}


export async function wrapAESKeyWithRSA(publicKey, aesKey) {
// export raw AES, encrypt with RSA-OAEP
const raw = await exportRawKey(aesKey);
try {
const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, raw);
// zero raw
zeroize(new Uint8Array(raw));
return wrapped; // ArrayBuffer
} catch (e) {
zeroize(new Uint8Array(raw));
throw e;
}
}


export async function unwrapAESKeyWithRSA(privateKey, wrappedArrayBuffer) {
const raw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, wrappedArrayBuffer);
try {
const key = await importAESKeyFromRaw(raw);
zeroize(new Uint8Array(raw));
return key;
} catch (e) {
zeroize(new Uint8Array(raw));
throw e;
}
}


// --- Key generation helper (for testing only) ---
export async function generateRSAKeyPairHex() {
const keyPair = await crypto.subtle.generateKey(
{ name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
true,
['encrypt', 'decrypt']
);
const pub = await crypto.subtle.exportKey('spki', keyPair.publicKey);
const priv = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
return { publicKeyHex: arrayBufferToHex(pub), privateKeyHex: arrayBufferToHex(priv) };
}


// --- helpers to build envelope ---
export function makeUploadEnvelope(ciphertextBuf, ivBuf, wrappedAESBuf) {
return {
ciphertext: arrayBufferToBase64(ciphertextBuf),
iv: arrayBufferToBase64(ivBuf),
wrappedKey: arrayBufferToBase64(wrappedAESBuf),
};
}


export function parseDownloadEnvelope(envelope) {
return {
ciphertext: base64ToArrayBuffer(envelope.ciphertext),
iv: base64ToArrayBuffer(envelope.iv),
wrappedKey: base64ToArrayBuffer(envelope.wrappedKey),
};
}


// zeroize exported sensitive strings (best-effort)
export function secureClearString(str) {
// Can't truly zero JS strings. Encourage GC by overwriting references.
str = null;
}