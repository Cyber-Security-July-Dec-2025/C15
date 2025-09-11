// // src/components/FileUpload.jsx
// import React, { useState } from 'react';
// import {
// generateAESKey,
// sha256,
// encryptWithAESGCM,
// wrapAESKeyWithRSA,
// importRSAPublicKeyFromHex,
// makeUploadEnvelope,
// arrayBufferToHex,
// generateRSAKeyPairHex,
// } from '../utils/cryptoHelpers';
// import { uploadEncryptedFile } from '../utils/api';


// export default function FileUpload() {
// const [file, setFile] = useState(null);
// const [pubHex, setPubHex] = useState('');
// const [loading, setLoading] = useState(false);


// const handleEncryptAndUpload = async () => {
// if (!file) return alert('Choose a file');
// if (!pubHex) return alert('Provide recipient public key (HEX)');


// setLoading(true);
// try {
// const ab = await file.arrayBuffer();
// const digest = await sha256(ab);


// // Combine file + digest (so digest is encrypted with the content)
// const combined = new Uint8Array(ab.byteLength + digest.byteLength);
// combined.set(new Uint8Array(ab), 0);
// combined.set(digest, ab.byteLength);


// const aesKey = await generateAESKey();
// const { iv, ciphertext } = await encryptWithAESGCM(aesKey, combined.buffer);


// const publicKey = await importRSAPublicKeyFromHex(pubHex.trim());
// const wrapped = await wrapAESKeyWithRSA(publicKey, aesKey);


// const envelope = makeUploadEnvelope(ciphertext, iv, wrapped);


// await uploadEncryptedFile({ envelope, filename: file.name });


// // clear sensitive variables
// // cannot truly zero AES CryptoKey, but clear arrays
// setFile(null);
// setPubHex('');


// alert('Uploaded securely. File encrypted client-side.');
// } catch (err) {
// console.error(err);
// alert('Encryption/upload failed: ' + (err.message || err));
// } finally {
// setLoading(false);
// }
// };


// const handleGeneratePair = async () => {
// const pair = await generateRSAKeyPairHex();
// // show to user (for test) — warn about private key
// alert('PUBLIC HEX (store public anywhere):\n' + pair.publicKeyHex.slice(0, 200) + '...\n\nPRIVATE HEX (DO NOT STORE):\n' + pair.privateKeyHex.slice(0, 200) + '...');
// };


// return (
// <div className="p-4 rounded shadow bg-white">
// <h3 className="text-lg font-semibold mb-2">Encrypt & Upload</h3>
// <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
// <textarea
// placeholder="Paste recipient RSA public key (HEX)"
// value={pubHex}
// onChange={(e) => setPubHex(e.target.value)}
// className="w-full mt-2 p-2 border rounded"
// rows={6}
// />
// <div className="flex gap-2 mt-3">
// <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleEncryptAndUpload} disabled={loading}>
// {loading ? 'Encrypting...' : 'Encrypt & Upload'}
// </button>
// <button className="px-3 py-2 border rounded" onClick={handleGeneratePair}>Generate Test RSA Pair</button>
// </div>
// </div>
// );
// }

import React, { useState } from "react";
import {
  generateAESKey,
  sha256,
  encryptWithAESGCM,
  wrapAESKeyWithRSA,
  importRSAPublicKeyFromHex,
  makeUploadEnvelope,
  generateRSAKeyPairHex,
} from "../utils/cryptoHelpers";
import { uploadEncryptedFile } from "../utils/api";
import "../styles/layout.css"; 
import "../styles/fileupload.css"; // <-- custom styles

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [pubHex, setPubHex] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEncryptAndUpload = async () => {
    if (!file) return alert("Choose a file");
    if (!pubHex) return alert("Provide recipient public key (HEX)");

    setLoading(true);
    try {
      const ab = await file.arrayBuffer();
      const digest = await sha256(ab);

      // Combine file + digest (so digest is encrypted with the content)
      const combined = new Uint8Array(ab.byteLength + digest.byteLength);
      combined.set(new Uint8Array(ab), 0);
      combined.set(digest, ab.byteLength);

      const aesKey = await generateAESKey();
      const { iv, ciphertext } = await encryptWithAESGCM(aesKey, combined.buffer);

      const publicKey = await importRSAPublicKeyFromHex(pubHex.trim());
      const wrapped = await wrapAESKeyWithRSA(publicKey, aesKey);

      const envelope = makeUploadEnvelope(ciphertext, iv, wrapped);

      await uploadEncryptedFile({ envelope, filename: file.name });

      // clear sensitive variables
      setFile(null);
      setPubHex("");

      alert("Uploaded securely. File encrypted client-side ✅");
    } catch (err) {
      console.error(err);
      alert("Encryption/upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePair = async () => {
    const pair = await generateRSAKeyPairHex();
    alert(
      "PUBLIC HEX (store anywhere safely):\n" +
        pair.publicKeyHex.slice(0, 200) +
        "...\n\nPRIVATE HEX (DO NOT SHARE):\n" +
        pair.privateKeyHex.slice(0, 200) +
        "..."
    );
  };

  return (
    <div className="fileupload-container">
      <h3 className="fileupload-title">Encrypt & Upload</h3>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="fileupload-input"
      />

      <textarea
        placeholder="Paste recipient RSA public key (HEX)"
        value={pubHex}
        onChange={(e) => setPubHex(e.target.value)}
        className="fileupload-textarea"
        rows={6}
      />

      <div className="fileupload-buttons">
        <button
          className="fileupload-btn fileupload-btn-primary"
          onClick={handleEncryptAndUpload}
          disabled={loading}
        >
          {loading ? "Encrypting..." : "Encrypt & Upload"}
        </button>

        <button
          className="fileupload-btn fileupload-btn-secondary"
          onClick={handleGeneratePair}
        >
          Generate Test RSA Pair
        </button>
      </div>
    </div>
  );
}



