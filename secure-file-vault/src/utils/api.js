// src/utils/api.js
import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:5000/api', withCredentials: true });


export async function uploadEncryptedFile({ envelope, filename, metadata }) {
// envelope fields: ciphertext (base64), iv (base64), wrappedKey (base64)
return API.post('/files/upload', { envelope, filename, metadata });
}


export async function listFiles() {
return API.get('/files');
}


export async function downloadFile(id) {
return API.get(`/files/${id}`);
}


export default API;