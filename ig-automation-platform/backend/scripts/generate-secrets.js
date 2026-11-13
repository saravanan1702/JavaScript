// Prints fresh random secrets to paste into backend/.env
//   npm run gen-secrets
import crypto from 'node:crypto';

console.log(`JWT_SECRET=${crypto.randomBytes(48).toString('base64url')}`);
console.log(`ENCRYPTION_KEY=${crypto.randomBytes(32).toString('base64')}`);
console.log(`META_WEBHOOK_VERIFY_TOKEN=${crypto.randomBytes(24).toString('hex')}`);
console.log('\n⚠️  Back up ENCRYPTION_KEY safely: if you lose it, stored Instagram tokens cannot be decrypted (you would just reconnect the account).');
