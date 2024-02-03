import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

export type Network =
  | {
      /**
       * A VPC in the Managed Network.
       */
      type: 'seek-managed-network';

      /**
       * The name of the Managed Network environment.
       */
      name: 'development' | 'production';
    }
  | {
      /**
       * A custom VPC.
       */
      type: 'vpc';

      /**
       * The ID of the VPC.
       */
      id: string;

      /**
       * A kebab-cased label for this network.
       *
       * This is used as a suffix for the Lambda function name and has a maximum
       * length of 21 characters.
       *
       * ```bash
       * aws-codedeploy-hook-BeforeAllowTraffic-vpc-${label}
       * ```
       */
      label: string;
    };

const SEEK_MANAGED_NETWORK_NAMES = {
  development: 'Gantry Development Managed Network',
  production: 'Gantry Production Managed Network',
};

const SEEK_MANAGED_NETWORK_SUFFIXES = {
  development: 'dev',
  production: 'prod',
};

export const getNetworkConfig = (
  scope: Construct,
  network: Network | null,
): {
  description: string;
  suffix: string;
  vpc: ec2.IVpc | undefined;
} => {
  switch (network?.type) {
    case 'seek-managed-network': {
      const name = SEEK_MANAGED_NETWORK_NAMES[network.name];

      const suffix = `-managed-network-${
        SEEK_MANAGED_NETWORK_SUFFIXES[network.name]
      }`;

      return {
        description: `BeforeAllowTraffic hook deployed to the ${network.name} managed network`,
        suffix,
        vpc: ec2.Vpc.fromLookup(scope, `Vpc${suffix}`, {
          tags: { Name: name },
          vpcName: name,
        }),
      };
    }

    case 'vpc': {
      const suffix = `-vpc-${network.label}`;

      return {
        description: `BeforeAllowTraffic hook deployed to the ${network.label} VPC (${network.id})`,
        suffix,
        vpc: ec2.Vpc.fromLookup(scope, `Vpc${suffix}`, {
          vpcId: network.id,
        }),
      };
    }

    case undefined: {
      return {
        description: 'BeforeAllowTraffic hook deployed outside of a VPC',
        suffix: '',
        vpc: undefined,
      };
    }
  }
};
