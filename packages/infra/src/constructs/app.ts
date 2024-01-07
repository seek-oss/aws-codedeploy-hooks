import { App, Tags } from 'aws-cdk-lib';

import { HookStack } from './stack';

const app = new App();

Tags.of(app).add('seek', 'TODO');

// eslint-disable-next-line no-new
new HookStack(app);

app.synth();
