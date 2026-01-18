// Optional setup for integration tests
// Could be used to set deterministic envs, e.g., scrypt work factors
process.env.SCRYPT_N = process.env.SCRYPT_N || '2048';
process.env.SCRYPT_r = process.env.SCRYPT_r || '8';
process.env.SCRYPT_p = process.env.SCRYPT_p || '1';
process.env.SCRYPT_KEYLEN = process.env.SCRYPT_KEYLEN || '32';
