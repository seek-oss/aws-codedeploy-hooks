import fs from 'fs';
import path from 'path';

import esbuild from 'esbuild';

import { rootdir } from './rootdir';

const outdir = path.join(rootdir, 'src', 'assets');

export const bundleAssets = async () => {
  console.log(`Clearing ${path.relative(process.cwd(), outdir)}...`);

  await fs.promises.rm(outdir, { force: true, recursive: true });

  console.log(
    `Bundling handlers into ${path.relative(process.cwd(), outdir)}...`,
  );

  await esbuild.build({
    bundle: true,
    charset: 'utf8',
    entryPoints: [
      {
        in: path.join(rootdir, 'src', 'handlers', 'index.ts'),
        out: 'handlers/index',
      },
    ],
    external: [
      // Rely on AWS SDK V3 built in to the Lambda runtime.
      '@aws-sdk/*',
    ],
    format: 'esm',
    logLevel: 'debug',
    outdir,
    platform: 'node',
    sourcemap: true,
    target: 'node20',
  });
};
