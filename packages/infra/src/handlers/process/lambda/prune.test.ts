import 'aws-sdk-client-mock-jest';

import {
  DeleteFunctionCommand,
  LambdaClient,
  ListAliasesCommand,
  ListVersionsByFunctionCommand,
} from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import { prune } from './prune';

const lambda = mockClient(LambdaClient);

beforeAll(() => {
  process.env.VERSIONS_TO_KEEP = '3';
});

afterAll(() => {
  delete process.env.VERSIONS_TO_KEEP;
});

afterEach(() => lambda.reset());

describe('prune', () => {
  it('deletes versions from one function', async () => {
    lambda
      .on(ListVersionsByFunctionCommand, { FunctionName: 'mock-name' })
      .resolves({
        Versions: ['5', '1', '4', '2', '3', '$LATEST', '6'].map((Version) => ({
          Version,
          FunctionName: 'mock-name',
        })),
      });

    lambda
      .on(ListAliasesCommand, { FunctionName: 'mock-name' })
      .resolves({ Aliases: [{ FunctionVersion: '5' }] });

    await expect(prune([{ name: 'mock-name' }])).resolves.toBeUndefined();

    expect(lambda).toHaveReceivedCommandTimes(DeleteFunctionCommand, 2);
    expect(lambda).toHaveReceivedCommandWith(DeleteFunctionCommand, {
      FunctionName: 'mock-name',
      Qualifier: '1',
    });

    expect(lambda).toHaveReceivedCommandWith(DeleteFunctionCommand, {
      FunctionName: 'mock-name',
      Qualifier: '2',
    });
  });

  it('deletes versions from multiple functions', async () => {
    lambda
      .on(ListVersionsByFunctionCommand, { FunctionName: 'mock-name-1' })
      .resolves({
        Versions: ['5', '1', '4', '2', '3', '$LATEST', '6'].map((Version) => ({
          Version,
          FunctionName: 'mock-name-1',
        })),
      });

    lambda
      .on(ListVersionsByFunctionCommand, { FunctionName: 'mock-name-2' })
      .resolves({
        Versions: ['10', '7', '8', '9', '$LATEST'].map((Version) => ({
          Version,
          FunctionName: 'mock-name-2',
        })),
      });

    lambda
      .on(ListAliasesCommand, { FunctionName: 'mock-name-1' })
      .resolves({ Aliases: [{ FunctionVersion: '5' }] });

    lambda
      .on(ListAliasesCommand, { FunctionName: 'mock-name-2' })
      .resolves({ Aliases: [] });

    await expect(
      prune([{ name: 'mock-name-1' }, { name: 'mock-name-2' }]),
    ).resolves.toBeUndefined();

    expect(lambda).toHaveReceivedCommandTimes(DeleteFunctionCommand, 3);
    expect(lambda).toHaveReceivedCommandWith(DeleteFunctionCommand, {
      FunctionName: 'mock-name-1',
      Qualifier: '1',
    });

    expect(lambda).toHaveReceivedCommandWith(DeleteFunctionCommand, {
      FunctionName: 'mock-name-1',
      Qualifier: '2',
    });

    expect(lambda).toHaveReceivedCommandWith(DeleteFunctionCommand, {
      FunctionName: 'mock-name-2',
      Qualifier: '7',
    });
  });

  it('paginates', async () => {
    lambda
      .on(ListVersionsByFunctionCommand, {
        FunctionName: 'mock-name',
        Marker: undefined,
      })
      .resolves({
        Versions: ['7', '2', '3', '4'].map((Version) => ({
          Version,
          FunctionName: 'mock-name',
        })),
        NextMarker: 'next',
      });

    lambda
      .on(ListVersionsByFunctionCommand, {
        FunctionName: 'mock-name',
        Marker: 'next',
      })
      .resolves({
        Versions: ['5', '6', '1', '$LATEST'].map((Version) => ({
          Version,
          FunctionName: 'mock-name',
        })),
      });

    lambda
      .on(ListAliasesCommand, { FunctionName: 'mock-name', Marker: undefined })
      .resolves({ Aliases: [{ FunctionVersion: '5' }], NextMarker: 'next' });

    lambda
      .on(ListAliasesCommand, { FunctionName: 'mock-name', Marker: 'next' })
      .resolves({
        Aliases: [{ FunctionVersion: '1' }, { FunctionVersion: 'not-used' }],
      });

    await expect(prune([{ name: 'mock-name' }])).resolves.toBeUndefined();

    expect(lambda).toHaveReceivedCommandTimes(DeleteFunctionCommand, 2);
    expect(lambda).toHaveReceivedCommandWith(DeleteFunctionCommand, {
      FunctionName: 'mock-name',
      Qualifier: '2',
    });

    expect(lambda).toHaveReceivedCommandWith(DeleteFunctionCommand, {
      FunctionName: 'mock-name',
      Qualifier: '3',
    });
  });

  it('skips if nothing to delete', async () => {
    lambda.on(ListVersionsByFunctionCommand).resolves({
      Versions: ['1', '2', '3', '4', '$LATEST'].map((Version) => ({
        Version,
        FunctionName: 'mock-name',
      })),
    });

    lambda
      .on(ListAliasesCommand)
      .resolves({ Aliases: [{ FunctionVersion: '3' }] });

    await expect(prune([{ name: 'mock-name' }])).resolves.toBeUndefined();

    expect(lambda).not.toHaveReceivedCommand(DeleteFunctionCommand);
  });

  it('handles empty responses', async () => {
    lambda.on(ListVersionsByFunctionCommand).resolves({});
    lambda
      .on(ListAliasesCommand)
      .resolvesOnce({ NextMarker: 'next' })
      .resolves({ Aliases: [{}] });

    await expect(prune([{ name: 'mock-name' }])).resolves.toBeUndefined();
    expect(lambda).not.toHaveReceivedCommand(DeleteFunctionCommand);
  });
});
