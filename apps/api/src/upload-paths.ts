import { mkdirSync } from 'fs';
import { join } from 'path';

const fromEnv = process.env.UPLOADS_DIR;

export const UPLOADS_ROOT = fromEnv || join(__dirname, '..', 'uploads');
export const UNIVERSITY_UPLOADS_DIR = join(UPLOADS_ROOT, 'universities');

export function ensureUploadDirs() {
  mkdirSync(UNIVERSITY_UPLOADS_DIR, { recursive: true });
}
