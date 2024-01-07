import { execFileSync } from 'child_process';

// TODO: handle bootstrap?

execFileSync('cdk', ['deploy'], { stdio: 'inherit' });
