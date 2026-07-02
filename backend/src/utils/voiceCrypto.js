const crypto = require('crypto');

const ALGO = 'aes-256-cbc';
const SECRET = crypto.createHash('sha256').update(String(process.env.VOICE_ENCRYPTION_KEY || 'localwheels-voice-dev-key')).digest();

function encryptText(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, SECRET, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText || ''), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptText(payload) {
  try {
    const [ivHex, dataHex] = String(payload).split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, SECRET, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

module.exports = { encryptText, decryptText };
