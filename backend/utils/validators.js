// utils/validators.js
exports.isValidEmail = (email) => {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
};
