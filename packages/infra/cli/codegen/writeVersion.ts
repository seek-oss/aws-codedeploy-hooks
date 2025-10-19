import fs from 'fs';
import path from 'path';

import git from 'isomorphic-git';

import { packageDir } from './dir.js';

export const writeVersion = async () => {
  const [
    [commit],
    {
      default: { version },
    },
  ] = await Promise.all([
    git.log({
      dir: path.join(packageDir, '..', '..'),
      fs,
      depth: 1,
      ref: 'HEAD',
    }),
    import('../../package.json'),
  ]);

  if (!commit?.oid) {
    throw new Error('No commit found in Git history');
  }

  if (!version) {
    throw new Error('No version found in package.json');
  }

  const filepath = path.join(packageDir, 'src', 'version.ts');

  console.log(
    `Writing ${version}-${commit.oid} to ${path.relative(
      process.cwd(),
      filepath,
    )}...`,
  );

  await fs.promises.writeFile(
    filepath,
    `
export const commit = '${commit.oid}';

export const version = '${version}';
`.trimStart(),
  );
};
