// import { Link } from "react-router-dom";

// export default function Navbar({ onLogout }) {
//   return (
//     <nav className="bg-indigo-600 text-white shadow-lg">
//       <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
//         <h1 className="text-xl font-bold">🔐 Secure Vault</h1>
//         <div className="space-x-4">
//           <Link
//             to="/file-upload"
//             className="hover:bg-indigo-700 px-3 py-2 rounded-lg"
//           >
//             Upload File
//           </Link>
//           <Link
//             to="/decrypt"
//             className="hover:bg-indigo-700 px-3 py-2 rounded-lg"
//           >
//             Decrypt File
//           </Link>
//           <Link
//             to="/key-tools"
//             className="hover:bg-indigo-700 px-3 py-2 rounded-lg"
//           >
//             Key Tools
//           </Link>
//           <button
//             onClick={onLogout}
//             className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg"
//           >
//             Logout
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }


import { Link } from "react-router-dom";
import "../styles/navbar.css";


export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <h1 className="navbar-logo">🔐 SecureVault</h1>

        {/* Links */}
        <div className="navbar-links">
          <Link to="/file-upload" className="nav-link">
            Upload File
          </Link>
          <Link to="/decrypt" className="nav-link">
            Decrypt File
          </Link>
          <Link to="/key-tools" className="nav-link">
            Key Tools
          </Link>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
