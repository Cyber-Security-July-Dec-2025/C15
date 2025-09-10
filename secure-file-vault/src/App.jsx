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


// src/App.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";

// Import your components
import FileUpload from "./components/FileUpload";
import DecryptForm from "./components/DecryptForm";
import KeyTools from "./components/KeyTools";

export default function App() {
  const [activeTab, setActiveTab] = useState("upload");

  const tabs = [
    { id: "upload", label: "📤 File Upload" },
    { id: "decrypt", label: "🔓 Decrypt File" },
    { id: "keys", label: "🔑 Key Tools" },
  ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-900 overflow-hidden text-white">
      {/* Particle Background */}
      <Particles
        options={{
          particles: {
            number: { value: 60 },
            size: { value: 3 },
            move: { speed: 1 },
            links: { enable: true, color: "#ffffff", opacity: 0.3 },
          },
        }}
        className="absolute inset-0 z-0"
      />

      {/* Main Showcase */}
      <motion.div
        className="relative z-10 text-center max-w-5xl p-6 w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 text-transparent bg-clip-text mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          🔐 Secure File Vault Playground
        </motion.h1>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Section */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl text-left"
        >
          {activeTab === "upload" && <FileUpload />}
          {activeTab === "decrypt" && <DecryptForm />}
          {activeTab === "keys" && <KeyTools />}
        </motion.div>
      </motion.div>
    </div>
  );
}
