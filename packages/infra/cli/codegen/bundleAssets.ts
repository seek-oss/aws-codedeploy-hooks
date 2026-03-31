import fs from 'fs';
import path from 'path';

import { rolldown } from 'rolldown';

import { assetDir, packageDir } from './dir.js';

export const bundleAssets = async () => {
  console.log(`Clearing ${path.relative(process.cwd(), assetDir)}...`);

  await fs.promises.rm(assetDir, { force: true, recursive: true });

  console.log(
    `Bundling handlers into ${path.relative(process.cwd(), assetDir)}...`,
  );

  const build = await rolldown({
    input: {
      'handlers/index': path.join(packageDir, 'src', 'handlers', 'index.ts'),
    },
    external: [
      // Rely on AWS SDK V3 built in to the Lambda runtime.
      /^@aws-sdk\//,
    ],
    platform: 'node',
    logLevel: 'debug',
  });

  await build.write({
    dir: assetDir,
    format: 'esm',
    entryFileNames: '[name].mjs',
    sourcemap: true,
  });
};
