import 'fast-text-encoding';
import * as ExpoCrypto from 'expo-crypto';

// Hermes does not consistently provide WebCrypto. Supabase's PKCE helper
// otherwise falls back to Math.random/plain. Supply native CSPRNG and SHA-256.
const runtime = globalThis as any;
if (!runtime.crypto) runtime.crypto = {};
if (!runtime.crypto.getRandomValues) runtime.crypto.getRandomValues = ExpoCrypto.getRandomValues;
if (!runtime.crypto.subtle) runtime.crypto.subtle = {};
if (!runtime.crypto.subtle.digest) {
 runtime.crypto.subtle.digest = (algorithm: string | {name: string}, data: BufferSource) => {
  const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
  if (name.toUpperCase() !== 'SHA-256') return Promise.reject(Error('Unsupported digest algorithm'));
  return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data);
 };
}
