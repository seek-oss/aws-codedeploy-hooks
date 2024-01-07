jest.mock('./gantrySmokeTest');

import { ecs } from './ecs';
import { gantrySmokeTest } from './gantrySmokeTest';

const gantrySmokeTestMock = jest.mocked(gantrySmokeTest);

afterEach(() => {
  gantrySmokeTestMock.mockReset();
});

describe('ecs', () => {
  it('executes a smoke test on Gantry application', async () => {
    await expect(
      ecs({
        applicationName: 'gantry-environment-env-foo',
        deploymentGroupName: 'svc-bar',
      }),
    ).resolves.toBeUndefined();

    expect(gantrySmokeTestMock).toHaveBeenCalledTimes(1);

    expect(gantrySmokeTestMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "applicationName": "gantry-environment-env-foo",
          "deploymentGroupName": "svc-bar",
        },
      ]
    `);
  });

  it('throws an error if application is not configured by Gantry', async () => {
    await expect(
      ecs({
        applicationName: 'non-gantry-application-name',
        deploymentGroupName: 'svc-bar',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"CodeDeploy ECS application not configured by Gantry: non-gantry-application-name"`,
    );
  });
});
