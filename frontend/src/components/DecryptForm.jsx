// // src/components/DecryptForm.jsx
// import React, { useState, useEffect } from 'react';
// import {
//   importRSAPrivateKeyFromHex,
//   parseDownloadEnvelope,
//   unwrapAESKeyWithRSA,
//   decryptWithAESGCM,
//   sha256,
//   arrayBufferToHex,
//   secureClearString,
// } from '../utils/cryptoHelpers';
// import { downloadFile } from '../utils/api';

// export default function DecryptForm({ selectedFileIdFromList }) {
//   const [fileId, setFileId] = useState(selectedFileIdFromList ?? '');
//   const [privateHex, setPrivateHex] = useState('');
//   const [inProgress, setInProgress] = useState(false);

//   // If parent passes selectedFileIdFromList, update local state
//   useEffect(() => {
//     if (selectedFileIdFromList) setFileId(selectedFileIdFromList);
//   }, [selectedFileIdFromList]);

//   const handleDownloadAndDecrypt = async () => {
//     if (!fileId) return alert('Enter or select a File ID.');
//     if (!privateHex || !privateHex.trim()) return alert('Paste your PRIVATE RSA key (HEX).');

//     setInProgress(true);
//     try {
//       const resp = await downloadFile(fileId.trim());
//       // Expect backend: { envelope: { ciphertext, iv, wrappedKey }, filename }
//       if (!resp?.data?.envelope) throw new Error('Server response invalid: missing envelope.');

//       const envelope = resp.data.envelope;
//       const { ciphertext, iv, wrappedKey } = parseDownloadEnvelope(envelope);

//       // Import private key from HEX PKCS8
//       const privateKey = await importRSAPrivateKeyFromHex(privateHex.trim());

//       // Unwrap AES key (returns CryptoKey)
//       const aesKey = await unwrapAESKeyWithRSA(privateKey, wrappedKey);

//       // Decrypt file (plaintext includes appended digest)
//       const plainBuf = await decryptWithAESGCM(aesKey, iv, ciphertext);
//       const plainU8 = new Uint8Array(plainBuf);

//       if (plainU8.length < 32) throw new Error('Payload too small to contain SHA-256 digest.');

//       const digest = plainU8.slice(plainU8.length - 32);
//       const fileBytes = plainU8.slice(0, plainU8.length - 32);

//       const recomputed = await sha256(fileBytes.buffer);

//       const ok = arrayBufferToHex(recomputed) === arrayBufferToHex(digest);
//       if (!ok) throw new Error('Integrity check failed — SHA-256 mismatch.');

//       // Trigger download
//       const blob = new Blob([fileBytes]);
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = resp.data.filename || `file-${fileId}`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);

//       // Clear sensitive data references (best-effort)
//       secureClearString(privateHex);
//       setPrivateHex('');
//       alert('File decrypted and integrity verified ✅. Download should start automatically.');
//     } catch (err) {
//       console.error('Decrypt error:', err);
//       alert('Decryption failed: ' + (err?.message || err));
//     } finally {
//       setInProgress(false);
//     }
//   };

//   return (
//     <div className="p-4 rounded shadow bg-white">
//       <h3 className="text-lg font-semibold mb-3">Download & Decrypt</h3>

//       <label className="text-sm">File ID</label>
//       <input
//         value={fileId}
//         onChange={(e) => setFileId(e.target.value)}
//         placeholder="Enter File ID (or select from file list)"
//         className="w-full p-2 border rounded mt-1 mb-3"
//       />

//       <label className="text-sm">Your PRIVATE RSA key (HEX)</label>
//       <textarea
//         value={privateHex}
//         onChange={(e) => setPrivateHex(e.target.value)}
//         placeholder="Paste private key (PKCS8) as HEX — will NOT be stored"
//         rows={6}
//         className="w-full p-2 border rounded mt-1"
//       />

//       <div className="mt-3 flex gap-2">
//         <button
//           className="px-4 py-2 bg-green-600 text-white rounded"
//           onClick={handleDownloadAndDecrypt}
//           disabled={inProgress}
//         >
//           {inProgress ? 'Decrypting...' : 'Download & Decrypt'}
//         </button>
//         <button
//           className="px-3 py-2 border rounded"
//           onClick={() => {
//             setPrivateHex('');
//             setFileId('');
//           }}
//           disabled={inProgress}
//         >
//           Clear
//         </button>
//       </div>
//       <p className="text-xs text-gray-600 mt-3">
//         Security: Private key is used only in-memory. Do not store private keys in localStorage or share them.
//       </p>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import {
  importRSAPrivateKeyFromHex,
  parseDownloadEnvelope,
  unwrapAESKeyWithRSA,
  decryptWithAESGCM,
  sha256,
  arrayBufferToHex,
  secureClearString,
} from "../utils/cryptoHelpers";
import { downloadFile } from "../utils/api";

import "../styles/decryptform.css"; // <-- custom CSS

export default function DecryptForm({ selectedFileIdFromList }) {
  const [fileId, setFileId] = useState(selectedFileIdFromList ?? "");
  const [privateHex, setPrivateHex] = useState("");
  const [inProgress, setInProgress] = useState(false);

  // Sync fileId if parent passes prop
  useEffect(() => {
    if (selectedFileIdFromList) setFileId(selectedFileIdFromList);
  }, [selectedFileIdFromList]);

  const handleDownloadAndDecrypt = async () => {
    if (!fileId) return alert("Enter or select a File ID.");
    if (!privateHex || !privateHex.trim())
      return alert("Paste your PRIVATE RSA key (HEX).");

    setInProgress(true);
    try {
      const resp = await downloadFile(fileId.trim());
      if (!resp?.data?.envelope)
        throw new Error("Server response invalid: missing envelope.");

      const envelope = resp.data.envelope;
      const { ciphertext, iv, wrappedKey } = parseDownloadEnvelope(envelope);

      const privateKey = await importRSAPrivateKeyFromHex(privateHex.trim());
      const aesKey = await unwrapAESKeyWithRSA(privateKey, wrappedKey);

      const plainBuf = await decryptWithAESGCM(aesKey, iv, ciphertext);
      const plainU8 = new Uint8Array(plainBuf);

      if (plainU8.length < 32)
        throw new Error("Payload too small to contain SHA-256 digest.");

      const digest = plainU8.slice(plainU8.length - 32);
      const fileBytes = plainU8.slice(0, plainU8.length - 32);

      const recomputed = await sha256(fileBytes.buffer);

      const ok = arrayBufferToHex(recomputed) === arrayBufferToHex(digest);
      if (!ok) throw new Error("Integrity check failed — SHA-256 mismatch.");

      const blob = new Blob([fileBytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resp.data.filename || `file-${fileId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      secureClearString(privateHex);
      setPrivateHex("");
      alert(
        "File decrypted and integrity verified ✅. Download should start automatically."
      );
    } catch (err) {
      console.error("Decrypt error:", err);
      alert("Decryption failed: " + (err?.message || err));
    } finally {
      setInProgress(false);
    }
  };

  return (
    <div className="decrypt-container">
      <h3 className="decrypt-title">Download & Decrypt</h3>

      <label className="decrypt-label">File ID</label>
      <input
        value={fileId}
        onChange={(e) => setFileId(e.target.value)}
        placeholder="Enter File ID (or select from file list)"
        className="decrypt-input"
      />

      <label className="decrypt-label">Your Private RSA key (HEX)</label>
      <textarea
        value={privateHex}
        onChange={(e) => setPrivateHex(e.target.value)}
        placeholder="Paste private key (PKCS8) as HEX — will NOT be stored"
        rows={6}
        className="decrypt-textarea"
      />

      <div className="decrypt-buttons">
        <button
          className="decrypt-btn decrypt-btn-primary"
          onClick={handleDownloadAndDecrypt}
          disabled={inProgress}
        >
          {inProgress ? "Decrypting..." : "Download & Decrypt"}
        </button>
        <button
          className="decrypt-btn decrypt-btn-clear"
          onClick={() => {
            setPrivateHex("");
            setFileId("");
          }}
          disabled={inProgress}
        >
          Clear
        </button>
      </div>

      <p className="decrypt-hint">
        Security: Private key is used only in-memory. Do not store private keys
        in localStorage or share them.
      </p>
    </div>
  );
}

