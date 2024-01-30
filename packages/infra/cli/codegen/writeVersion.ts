import fs from 'fs';
import path from 'path';

import { rootdir } from './rootdir';

export const writeVersion = async () => {
  const { version } = await import('../../package.json');

  if (!version) {
    throw new Error('No version found in package.json');
  }

  const filepath = path.join(rootdir, 'src', 'version.ts');

  console.log(
    `Writing ${version} to ${path.relative(process.cwd(), filepath)}...`,
  );

  await fs.promises.writeFile(
    filepath,
    `export const version = '${version}';\n`,
  );
};
