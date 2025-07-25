import crypto from 'crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

const newHash = hashPassword('danny');
console.log('New password hash for danny:', newHash);

// Test the existing one
const existingHash = '10095599d23301bcec7c19ebb00370587c6dffe134ad92d97bba717f54205ad5c7229d88150a2d8bd5b36020fd9625313dd167a456f13462eba0eba4e1c6000b.d17e7fdd124a170bc2e977e5632e5545';
const [hash, salt] = existingHash.split('.');
const testHash = crypto.scryptSync('danny', salt, 64).toString('hex');
console.log('Password matches existing hash:', hash === testHash);