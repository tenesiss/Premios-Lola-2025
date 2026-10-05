import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

// Resolve from the module so dev and compiled startup work from any directory.
const moduleRoot = path.resolve(__dirname, '../..');
export const backendRoot = existsSync(path.join(moduleRoot, 'package.json'))
  ? moduleRoot
  : path.resolve(moduleRoot, '..');

config({
  path: [
    path.join(backendRoot, '.env.local'),
    path.join(backendRoot, '.env'),
    path.resolve(backendRoot, '../.env'),
  ],
  quiet: true,
});
