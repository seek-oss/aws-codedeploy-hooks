import { bundleAssets } from './bundleAssets';
import { writeVersion } from './writeVersion';

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
