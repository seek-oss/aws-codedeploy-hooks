import fs from 'fs';
import path from 'path';

import esbuild from 'esbuild';

import { assetDir, packageDir } from './dir.js';

export const bundleAssets = async () => {
  console.log(`Clearing ${path.relative(process.cwd(), assetDir)}...`);

  await fs.promises.rm(assetDir, { force: true, recursive: true });

  console.log(
    `Bundling handlers into ${path.relative(process.cwd(), assetDir)}...`,
  );

  await esbuild.build({
    bundle: true,
    charset: 'utf8',
    entryPoints: [
      {
        in: path.join(packageDir, 'src', 'handlers', 'index.ts'),
        out: 'handlers/index',
      },
    ],
    external: [
      // Rely on AWS SDK V3 built in to the Lambda runtime.
      '@aws-sdk/*',
    ],
    format: 'esm',
    logLevel: 'debug',
    outExtension: { '.js': '.mjs' },
    outdir: assetDir,
    platform: 'node',
    sourcemap: true,
    target: 'node24',
  });
};
