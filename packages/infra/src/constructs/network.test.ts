import { Stack } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

import { processNetwork } from './network';

describe('processNetwork', () => {
  const fromLookup = jest
    .spyOn(Vpc, 'fromLookup')
    .mockImplementation((scope, id) => new Vpc(scope, id));

  afterEach(fromLookup.mockClear);

  it('processes the development Managed Network', () => {
    const construct = new Stack();

    expect(
      processNetwork(construct, {
        type: 'seek-managed-network',
        name: 'development',
      }),
    ).toMatchInlineSnapshot(
      { vpc: expect.any(Object) },
      `
        {
          "description": "BeforeAllowTraffic hook deployed to the development managed network",
          "suffix": "-managed-network-dev",
          "vpc": Any<Object>,
        }
      `,
    );

    expect(fromLookup).toHaveBeenCalledTimes(1);

    const [constructArg, ...restArgs] = fromLookup.mock.lastCall!;

    expect(constructArg).toBe(construct);
    expect(restArgs).toMatchInlineSnapshot(`
      [
        "Vpc-managed-network-dev",
        {
          "tags": {
            "Name": "Gantry Development Managed Network",
          },
          "vpcName": "Gantry Development Managed Network",
        },
      ]
    `);
  });

  it('processes the production Managed Network', () => {
    const construct = new Stack();

    expect(
      processNetwork(construct, {
        type: 'seek-managed-network',
        name: 'production',
      }),
    ).toMatchInlineSnapshot(
      { vpc: expect.any(Object) },
      `
        {
          "description": "BeforeAllowTraffic hook deployed to the production managed network",
          "suffix": "-managed-network-prod",
          "vpc": Any<Object>,
        }
      `,
    );

    expect(fromLookup).toHaveBeenCalledTimes(1);

    const [constructArg, ...restArgs] = fromLookup.mock.lastCall!;

    expect(constructArg).toBe(construct);
    expect(restArgs).toMatchInlineSnapshot(`
      [
        "Vpc-managed-network-prod",
        {
          "tags": {
            "Name": "Gantry Production Managed Network",
          },
          "vpcName": "Gantry Production Managed Network",
        },
      ]
    `);
  });

  it('processes a custom VPC', () => {
    const construct = new Stack();

    expect(
      processNetwork(construct, {
        type: 'vpc',
        id: 'mock-id',
        label: 'mock-label',
      }),
    ).toMatchInlineSnapshot(
      { vpc: expect.any(Object) },
      `
        {
          "description": "BeforeAllowTraffic hook deployed to the mock-label VPC (mock-id)",
          "suffix": "-vpc-mock-label",
          "vpc": Any<Object>,
        }
      `,
    );

    expect(fromLookup).toHaveBeenCalledTimes(1);

    const [constructArg, ...restArgs] = fromLookup.mock.lastCall!;

    expect(constructArg).toBe(construct);
    expect(restArgs).toMatchInlineSnapshot(`
      [
        "Vpc-vpc-mock-label",
        {
          "vpcId": "mock-id",
        },
      ]
    `);
  });

  it('processes null', () => {
    const construct = new Stack();

    expect(processNetwork(construct, null)).toMatchInlineSnapshot(`
      {
        "description": "BeforeAllowTraffic hook deployed outside of a VPC",
        "suffix": "",
        "vpc": undefined,
      }
    `);

    expect(fromLookup).not.toHaveBeenCalled();
  });
});
