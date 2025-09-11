// import React, { useState } from "react";
// import AuthForm from "./components/AuthForm";

// import Navbar from "./Navbar";
// import FileUpload from "./FileUpload";
// import DecryptForm from "./DecryptForm";
// import KeyTools from "./KeyTools";

// export default function App() {
//   const [user, setUser] = useState(null);
//   const [showSignup, setShowSignup] = useState(false);

//   if (!user) {
//     return (
//       <>
//         <AuthForm
//           type={showSignup ? "signup" : "login"}
//           onSuccess={(data) => {
//             setUser(data.user); // store user in state
//             localStorage.setItem("token", data.token); // if backend returns JWT
//           }}
//         />
//         <div className="text-center mt-4">
//           <button
//             className="text-indigo-600 underline"
//             onClick={() => setShowSignup(!showSignup)}
//           >
//             {showSignup ? "Already have an account? Login" : "Need an account? Sign Up"}
//           </button>
//         </div>
//       </>
//     );
//   }

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-green-50">
//       <h1 className="text-3xl font-bold text-green-700">
//         Welcome, {user.name || user.email} 🎉
//       </h1>
//     </div>
//   );
// }




// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// import AuthForm from "./components/AuthForm";
// import Navbar from "./components/Navbar";
// import FileUpload from "./components/FileUpload";
// import DecryptForm from "./components/DecryptForm";
// import KeyTools from "./components/KeyTools";

// export default function App() {
//   const [user, setUser] = useState(null);
//   const [showSignup, setShowSignup] = useState(false);

//   const handleAuthSuccess = (data) => {
//     setUser(data.user || data); // save user
//     if (data.token) {
//       localStorage.setItem("token", data.token); // if backend sends JWT
//     }
//   };

//   const handleLogout = () => {
//     setUser(null);
//     localStorage.removeItem("token");
//   };

//   return (
//     <Router>
//       {user && <Navbar onLogout={handleLogout} />}

//       <Routes>
//         {!user ? (
//           <>
//             {/* Login & Signup forms */}
//             <Route
//               path="/"
//               element={
//                 <>
//                   <AuthForm
//                     type={showSignup ? "signup" : "login"}
//                     onSuccess={handleAuthSuccess}
//                   />
//                   <div className="text-center mt-4">
//                     <button
//                       className="text-indigo-600 underline"
//                       onClick={() => setShowSignup(!showSignup)}
//                     >
//                       {showSignup
//                         ? "Already have an account? Login"
//                         : "Need an account? Sign Up"}
//                     </button>
//                   </div>
//                 </>
//               }
//             />
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </>
//         ) : (
//           <>
//             {/* After login, protected routes */}
//             <Route path="/file-upload" element={<FileUpload />} />
//             <Route path="/decrypt" element={<DecryptForm />} />
//             <Route path="/key-tools" element={<KeyTools />} />
//             <Route path="*" element={<Navigate to="/file-upload" replace />} />
//           </>
//         )}
//       </Routes>
//     </Router>
//   );
// }


import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthForm from "./components/AuthForm";
import Navbar from "./components/Navbar";
import FileUpload from "./components/FileUpload";
import DecryptForm from "./components/DecryptForm";
import KeyTools from "./components/KeyTools";
import "./styles/styles.css"; // custom CSS file

export default function App() {
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  const handleAuthSuccess = (data) => {
    setUser(data.user || data);
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <Router>
      {user && <Navbar onLogout={handleLogout} />}

      <Routes>
        {!user ? (
          <>
            <Route
              path="/"
              element={
                <div>
                  <AuthForm type={showSignup ? "signup" : "login"} onSuccess={handleAuthSuccess} />
                  <div className="toggle-auth">
                    <button onClick={() => setShowSignup(!showSignup)}>
                      {showSignup ? "Already have an account? Login" : "Need an account? Sign Up"}
                    </button>
                  </div>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/file-upload" element={<FileUpload />} />
            <Route path="/decrypt" element={<DecryptForm />} />
            <Route path="/key-tools" element={<KeyTools />} />
            <Route path="*" element={<Navigate to="/file-upload" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
