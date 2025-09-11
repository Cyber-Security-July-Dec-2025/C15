import { useState } from "react";
import API from "../utils/api"; // <-- your axios instance

export default function AuthForm({ type = "login", onSuccess }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = type === "signup";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convert ArrayBuffer -> HEX
  const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Save private key in IndexedDB
  const savePrivateKey = async (privateKeyHex, email) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("secure-vault-db", 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys", { keyPath: "email" });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction("keys", "readwrite");
        const store = tx.objectStore("keys");
        store.put({ email, privateKeyHex });
        tx.oncomplete = () => resolve(true);
      };

      request.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let payload = { ...formData };

      if (isSignup) {
        // 1. Generate RSA key pair
        const keyPair = await window.crypto.subtle.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
          },
          true,
          ["encrypt", "decrypt"]
        );

        // 2. Export public & private
        const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const priv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

        const publicKeyHex = bufferToHex(pub);
        const privateKeyHex = bufferToHex(priv);

        // 3. Attach public key to signup payload
        payload.publicKeyHex = publicKeyHex;

        // 4. Save private key locally (IndexedDB)
        await savePrivateKey(privateKeyHex, formData.email);
        console.log("Private key saved locally in IndexedDB ✅");
      }

      // 5. Send to backend
      const url = isSignup ? "/signup" : "/login";
      const { data } = await API.post(url, payload);

      console.log("Auth success:", data);

      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {isSignup ? "Create Account" : "Login"}
        </h2>

        {isSignup && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-indigo-300"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-indigo-300"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-indigo-300"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
        >
          {loading ? "Processing..." : isSignup ? "Sign Up" : "Login"}
        </button>
      </form>
    </div>
  );
}
