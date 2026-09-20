const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns a hex string: iv:authTag:ciphertext
 */
function encrypt(text) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a previously encrypted string (iv:authTag:ciphertext).
 */
function decrypt(encryptedText) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a cryptographically secure random OTP (6 digits).
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a secure random token (for QR connections, etc.).
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = { encrypt, decrypt, generateOTP, generateToken };
