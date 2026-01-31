import type { Context, SQSEvent } from 'aws-lambda';

import { isLambdaHook } from './lambda.js';

describe('isLambdaHook', () => {
  it('is compatible with @types/aws-lambda', () =>
    expect(
      isLambdaHook({} as unknown as SQSEvent, {} as unknown as Context),
    ).toBeDefined());

  it('recognises the Lambda hook', () =>
    expect(
      isLambdaHook({}, {
        clientContext: {
          Custom: {
            'user-agent': 'aws-codedeploy-hook-BeforeAllowTraffic/123',
          },
        },
      } as unknown as Context),
    ).toBe(true));

  it('ignores a non-empty event', () =>
    expect(
      isLambdaHook(
        {
          'some-property': undefined,
        },
        {
          clientContext: {
            Custom: {
              'user-agent': 'aws-codedeploy-hook-BeforeAllowTraffic/123',
            },
          },
        } as unknown as Context,
      ),
    ).toBe(false));

  it('accepts a lowercase custom field in clientContext', () =>
    expect(
      isLambdaHook({}, {
        clientContext: {
          custom: {
            'user-agent': 'aws-codedeploy-hook-BeforeAllowTraffic/123',
          },
        },
      } as unknown as Context),
    ).toBe(true));

  it.each(['Mozilla/5.0', null, undefined, true])(
    'ignores a %p user agent',
    () =>
      expect(
        isLambdaHook(
          {
            'some-property': undefined,
          },
          {
            clientContext: {
              Custom: { 'user-agent': 'Mozilla/5.0' },
            },
          } as unknown as Context,
        ),
      ).toBe(false),
  );

  it.each`
    description            | context
    ${'user-agent'}        | ${{ clientContext: { Custom: { 'some-property': true } } }}
    ${'custom properties'} | ${{ clientContext: { Custom: {} } }}
    ${'client context'}    | ${{ clientContext: {} }}
    ${'anything'}          | ${{}}
  `('ignores a context without $description', ({ context }) =>
    expect(isLambdaHook({}, context as unknown as Context)).toBe(false),
  );
});
