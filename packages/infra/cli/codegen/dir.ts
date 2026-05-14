import path from 'path';

export const packageDir = path.join(import.meta.dirname, '..', '..');

export const assetDir = path.join(packageDir, 'src', 'assets');

export const repoDir = path.join(packageDir, '..', '..');
