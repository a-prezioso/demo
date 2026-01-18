// Minimal shims to allow TypeScript compilation without @types/node or external lib types
// NOTE: This is only to satisfy the compiler in this demo setup.
// Runtime requires actual packages to be installed (express, pg, argon2/bcrypt, etc.).

declare var process: any;
declare function require(name: string): any;

declare module 'argon2';
declare module 'bcrypt';
declare module 'bcryptjs';
declare module 'pg';
