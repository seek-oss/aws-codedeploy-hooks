import { gantrySmokeTest } from './gantrySmokeTest';

export type Options = {
  applicationName: string;
  deploymentGroupName: string;
};

export const ecs = async (opts: Options): Promise<void> => {
  const { applicationName } = opts;

  if (!applicationName.startsWith('gantry-environment-')) {
    throw new Error(
      `CodeDeploy ECS application not configured by Gantry: ${applicationName}`,
    );
  }

  await gantrySmokeTest(opts);
};
