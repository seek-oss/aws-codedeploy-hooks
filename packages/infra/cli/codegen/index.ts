import { bundleAssets } from './bundleAssets.js';
import { writeVersion } from './writeVersion.js';

const main = async () => {
  console.log(
    `
===============
Bundling assets
===============
`.trimEnd(),
  );

  await bundleAssets();

  console.log('Complete.');

  console.log(
    `
===============
Writing version
===============
`.trimEnd(),
  );

  await writeVersion();

  console.log('Complete.');
};

main().catch((err) => {
  throw err;
});
