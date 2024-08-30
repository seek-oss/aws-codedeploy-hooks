import type { Context, SQSEvent } from 'aws-lambda';

import { isLambdaHook } from './lambda';

describe('isLambdaHook', () => {
  it('is compatible with @types/aws-lambda', () =>
    expect(
      isLambdaHook({} as unknown as SQSEvent, {} as unknown as Context),
    ).toBeDefined());

  it('recognises the Lambda hook', () =>
    expect(
      isLambdaHook(
        {},
        {
          clientContext: {
            custom: {
              'user-agent': 'aws-codedeploy-hook-BeforeAllowTraffic/123',
            },
          },
        },
      ),
    ).toBe(true));

  it('ignores a non-empty event', () =>
    expect(
      isLambdaHook(
        {
          'some-property': undefined,
        },
        {
          clientContext: {
            custom: {
              'user-agent': 'aws-codedeploy-hook-BeforeAllowTraffic/123',
            },
          },
        },
      ),
    ).toBe(false));

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
              custom: { 'user-agent': 'Mozilla/5.0' },
            },
          },
        ),
      ).toBe(false),
  );

  it.each`
    description            | context
    ${'user-agent'}        | ${{ clientContext: { custom: { 'some-property': true } } }}
    ${'custom properties'} | ${{ clientContext: { custom: {} } }}
    ${'client context'}    | ${{ clientContext: {} }}
    ${'anything'}          | ${{}}
  `('ignores a context without $description', ({ context }) =>
    expect(isLambdaHook({}, context)).toBe(false),
  );
});
