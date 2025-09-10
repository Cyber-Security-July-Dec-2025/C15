// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App


import React, { useState, useEffect } from 'react';

const AES_ALGORITHM = { name: "AES-GCM", length: 256 };
const RSA_ALGORITHM = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: "SHA-256",
};

// Utility functions
const arrayBufferToHex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
const hexToArrayBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes.buffer;
};
const keyToHex = async (key, format) => arrayBufferToHex(await window.crypto.subtle.exportKey(format, key));
const hexToKey = async (hex, format, algorithm, usages) => window.crypto.subtle.importKey(format, hexToArrayBuffer(hex), algorithm, true, usages);

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [publicKeyHex, setPublicKeyHex] = useState(localStorage.getItem('rsa_public_key') || '');
  const [privateKeyHex, setPrivateKeyHex] = useState(localStorage.getItem('rsa_private_key') || ''); // NOTE: This is for local dev only, do not store private keys in local storage in production!
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // In a real app, this would check a local session token or make an API call
    setLoading(false);
  }, []);

  const handleLogin = (userObj) => {
    setUser(userObj);
    fetchFiles(userObj.token);
  };

  const handleLogout = () => {
    setUser(null);
    setFiles([]);
    setStatus('Logged out.');
  };

  const fetchFiles = async (token) => {
    setStatus('Fetching files...');
    try {
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setFiles(data.files);
        setStatus('Files fetched successfully.');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setStatus("Error fetching files. Check console.");
    }
  };
  
  // --- RSA Key Generation ---
  const generateKeys = async () => {
    try {
      setStatus('Generating RSA key pair...');
      const keyPair = await window.crypto.subtle.generateKey(RSA_ALGORITHM, true, ["encrypt", "wrapKey", "decrypt", "unwrapKey"]);
      const publicKeyJwkHex = await keyToHex(keyPair.publicKey, 'jwk');
      const privateKeyJwkHex = await keyToHex(keyPair.privateKey, 'jwk');
      setPublicKeyHex(publicKeyJwkHex);
      setPrivateKeyHex(privateKeyJwkHex);
      localStorage.setItem('rsa_public_key', publicKeyJwkHex);
      localStorage.setItem('rsa_private_key', privateKeyJwkHex);
      setStatus('RSA key pair generated successfully.');
    } catch (error) {
      console.error('Key generation failed:', error);
      setStatus('Error generating keys. Check the console for details.');
    }
  };

  // --- Encryption Logic ---
  const handleEncrypt = async () => {
    if (!file) { setStatus('Please select a file.'); return; }
    if (!publicKeyHex) { setStatus('Please generate or paste a public key.'); return; }
    if (!user) { setStatus('Please sign in to upload.'); return; }

    setStatus('Encrypting file...');
    try {
      const fileBuffer = await file.arrayBuffer();
      const aesKey = await window.crypto.subtle.generateKey(AES_ALGORITHM, true, ["encrypt", "decrypt"]);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const fileHashBuffer = await window.crypto.subtle.digest('SHA-256', fileBuffer);
      const dataToEncrypt = new Uint8Array(fileBuffer.byteLength + fileHashBuffer.byteLength);
      dataToEncrypt.set(new Uint8Array(fileBuffer), 0);
      dataToEncrypt.set(new Uint8Array(fileHashBuffer), fileBuffer.byteLength);

      const encryptedDataBuffer = await window.crypto.subtle.encrypt({ name: AES_ALGORITHM.name, iv }, aesKey, dataToEncrypt);
      const importedPublicKey = await hexToKey(publicKeyHex, 'jwk', RSA_ALGORITHM, ["encrypt"]);
      const aesKeyJwk = await window.crypto.subtle.exportKey('jwk', aesKey);
      const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(RSA_ALGORITHM, importedPublicKey, new TextEncoder().encode(JSON.stringify(aesKeyJwk)));

      setStatus('Uploading encrypted file to backend...');
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          encryptedAesKey: arrayBufferToHex(encryptedAesKeyBuffer),
          iv: arrayBufferToHex(iv),
          encryptedFile: arrayBufferToHex(encryptedDataBuffer),
        }),
      });

      if (response.ok) {
        setStatus('File uploaded and encrypted successfully!');
        fetchFiles(user.token); // Refresh file list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Encryption or upload failed:', error);
      setStatus('Error during encryption or upload. Check console.');
    }
  };

  // --- Decryption Logic ---
  const handleDecrypt = async (fileId) => {
    if (!privateKeyHex) { setStatus('Please paste your private key to decrypt.'); return; }
    if (!user) { setStatus('Please sign in to download.'); return; }

    setStatus('Downloading and decrypting file...');
    try {
      const response = await fetch(`/api/files/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      const encryptedAesKeyBuffer = hexToArrayBuffer(data.encryptedAesKey);
      const importedPrivateKey = await hexToKey(privateKeyHex, 'jwk', RSA_ALGORITHM, ["decrypt"]);
      const decryptedAesKeyJwkBuffer = await window.crypto.subtle.decrypt(RSA_ALGORITHM, importedPrivateKey, encryptedAesKeyBuffer);
      const decryptedAesKeyJwk = JSON.parse(new TextDecoder().decode(decryptedAesKeyJwkBuffer));
      const aesKey = await window.crypto.subtle.importKey('jwk', decryptedAesKeyJwk, AES_ALGORITHM, true, ["encrypt", "decrypt"]);
      
      const iv = hexToArrayBuffer(data.iv);
      const encryptedFileBuffer = hexToArrayBuffer(data.encryptedFile);
      const decryptedDataBuffer = await window.crypto.subtle.decrypt({ name: AES_ALGORITHM.name, iv }, aesKey, encryptedFileBuffer);

      const originalFileHashLength = 32;
      const originalFileBuffer = decryptedDataBuffer.slice(0, decryptedDataBuffer.byteLength - originalFileHashLength);
      const originalFileHashBuffer = decryptedDataBuffer.slice(decryptedDataBuffer.byteLength - originalFileHashLength);
      const calculatedFileHashBuffer = await window.crypto.subtle.digest('SHA-256', originalFileBuffer);

      const hashVerified = arrayBufferToHex(calculatedFileHashBuffer) === arrayBufferToHex(originalFileHashBuffer);
      
      if (hashVerified) {
        setStatus('Decryption successful! Hash verified. File integrity is intact.');
        const blob = new Blob([originalFileBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setStatus('Decryption successful, but hash verification failed! File integrity may be compromised.');
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      setStatus('Error during decryption. Check the console for details. (e.g., wrong private key, invalid data)');
    }
  };

  const handleDelete = async (fileId) => {
    if (!user) { setStatus('Please sign in to delete.'); return; }
    setStatus('Deleting file...');
    try {
      const response = await fetch(`/api/files/delete/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        setStatus('File deleted successfully!');
        fetchFiles(user.token);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      setStatus('Error deleting file. Check console.');
    }
  };

  // --- Auth Component ---
  const Auth = () => (
    <div className="bg-gray-700 p-6 rounded-lg shadow-inner space-y-4">
      <h2 className="text-2xl font-semibold text-center mb-4">
        Sign Up or Log In
      </h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex space-x-4">
        <button
          onClick={() => handleLogin({ id: 'mock-user-id', token: 'mock-token' })}
          className="w-1/2 py-3 px-6 font-bold rounded-lg transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Log In (Mock)
        </button>
        <button
          onClick={() => handleLogin({ id: 'mock-user-id', token: 'mock-token' })}
          className="w-1/2 py-3 px-6 font-bold rounded-lg transition-colors duration-200 bg-green-600 hover:bg-green-700 text-white"
        >
          Sign Up (Mock)
        </button>
      </div>
    </div>
  );

  // --- FileList Component ---
  const FileList = () => (
    <div className="bg-gray-700 p-6 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Your Encrypted Files
      </h2>
      {files.length === 0 ? (
        <p className="text-center text-gray-400">No files uploaded yet.</p>
      ) : (
        <ul className="space-y-4">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between bg-gray-900 p-4 rounded-lg shadow-md">
              <span className="text-white break-all flex-grow mr-4">
                {file.fileName}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDecrypt(file.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors duration-200"
                >
                  Decrypt
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8 font-sans">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-lg p-6 space-y-8">
        <h1 className="text-3xl font-bold text-center text-teal-400">
          Secure File Vault
        </h1>

        {!user ? (
          <Auth />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-center text-gray-400">
                Logged in as User ID: <span className="font-mono text-xs">{user.id}</span>
              </p>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-lg text-sm transition-colors duration-200"
              >
                Logout
              </button>
            </div>

            {/* --- RSA Key Management Section --- */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-inner">
              <h2 className="text-2xl font-semibold mb-4 text-center">
                Key Management
              </h2>
              <div className="space-y-4">
                <button
                  onClick={generateKeys}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Generate New RSA Key Pair
                </button>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Your Public Key (JWK Hex)
                  </label>
                  <textarea
                    value={publicKeyHex}
                    readOnly
                    className="w-full h-24 p-3 bg-gray-900 text-gray-300 rounded-lg text-xs font-mono break-all resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Public Key will appear here. It's safe to share this."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Your Private Key (JWK Hex)
                  </label>
                  <textarea
                    value={privateKeyHex}
                    onChange={(e) => setPrivateKeyHex(e.target.value)}
                    className="w-full h-24 p-3 bg-gray-900 text-gray-300 rounded-lg text-xs font-mono break-all resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste your private key here to decrypt. DO NOT SHARE."
                  />
                  <p className="text-red-400 text-sm mt-1">
                    <span className="font-bold">WARNING:</span> This is your RSA private key.
                    <br />
                    It is required to decrypt files.
                  </p>
                </div>
              </div>
            </div>
            
            {/* --- File Encryption Section --- */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-inner">
              <h2 className="text-2xl font-semibold mb-4 text-center">
                Upload & Encrypt a File
              </h2>
              <div className="flex flex-col items-center space-y-4">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />
                <button
                  onClick={handleEncrypt}
                  disabled={!file || !publicKeyHex}
                  className={`w-full py-3 px-6 font-bold rounded-lg transition-colors duration-200 ${
                    !file || !publicKeyHex ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  Encrypt & Upload File
                </button>
              </div>
            </div>

            {/* --- File List & Decryption Section --- */}
            <FileList />
          </div>
        )}

        {/* Status bar */}
        <div className="text-center font-medium text-lg mt-8">
          <p className={status.includes('Error') ? 'text-red-500' : 'text-green-500'}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
