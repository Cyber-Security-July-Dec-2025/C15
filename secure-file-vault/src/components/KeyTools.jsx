// src/components/KeyTools.jsx
import React, { useState } from "react";
import { generateRSAKeyPairHex } from "../utils/cryptoHelpers";

const KeyTools = () => {
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const handleGenerateKeys = async () => {
    const { publicKeyHex, privateKeyHex } = await generateRSAKeyPairHex();
    setPublicKey(publicKeyHex);
    setPrivateKey(privateKeyHex);
  };

  const handleClearKeys = () => {
    setPublicKey("");
    setPrivateKey("");
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard ✅");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-xl font-bold mb-4 text-gray-800">🔑 Key Tools</h2>

      <div className="space-x-4 mb-4">
        <button
          onClick={handleGenerateKeys}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Generate Key Pair
        </button>
        <button
          onClick={handleClearKeys}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Clear Keys
        </button>
      </div>

      {publicKey && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700">Public Key</h3>
          <textarea
            readOnly
            value={publicKey}
            className="w-full h-24 p-2 border rounded-lg bg-gray-100 text-xs"
          />
          <button
            onClick={() => handleCopy(publicKey)}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Copy Public Key
          </button>
        </div>
      )}

      {privateKey && (
        <div>
          <h3 className="font-semibold text-gray-700">Private Key</h3>
          <textarea
            readOnly
            value={privateKey}
            className="w-full h-24 p-2 border rounded-lg bg-gray-100 text-xs"
          />
          <button
            onClick={() => handleCopy(privateKey)}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Copy Private Key
          </button>
        </div>
      )}
    </div>
  );
};

export default KeyTools;
