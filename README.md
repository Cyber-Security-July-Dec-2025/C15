# Secure File Vault

A simple project with a **Node.js backend** and a **frontend (React/Vite/Next/etc.)**.  
Follow these steps to run the project locally.

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
# Clone the repo
git clone <your-repo-url>
cd secure-file-vault

# Install backend dependencies
cd backend
npm install
node server

# Install frontend dependencies
cd ../frontend
npm install
npm run dev
```

## ⚙️ Environment Setup

Create a `.env` file inside the `backend/` folder.  
Add your environment variables there (example):

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
