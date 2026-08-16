import { mkdirSync } from 'fs';
import { join } from 'path';

export const UPLOADS_ROOT = join(__dirname, '..', 'uploads');
export const UNIVERSITY_UPLOADS_DIR = join(UPLOADS_ROOT, 'universities');

export function ensureUploadDirs() {
  mkdirSync(UNIVERSITY_UPLOADS_DIR, { recursive: true });
}
