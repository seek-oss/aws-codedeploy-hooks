export const eventSourceMappings = Object.freeze({
  WorkerALambdaFunctionAliasLive: {
    Type: 'AWS::Lambda::Alias',
    Properties: {
      FunctionVersion: {
        'Fn::GetAtt': ['WorkerALambdaVersion123', 'Version'],
      },
      FunctionName: {
        Ref: 'WorkerALambdaFunction',
      },
      Name: 'Live',
    },
  },
  WorkerBLambdaFunctionAliasLive: {
    Type: 'AWS::Lambda::Alias',
    Properties: {
      FunctionVersion: {
        'Fn::GetAtt': ['WorkerBLambdaVersion123', 'Version'],
      },
      FunctionName: {
        Ref: 'WorkerBLambdaFunction',
      },
      Name: 'Live',
    },
  },
  WorkerEventSourceMappingSQSQueueA: {
    Type: 'AWS::Lambda::EventSourceMapping',
    DependsOn: ['IamRoleLambdaExecution'],
    Properties: {
      BatchSize: 1,
      EventSourceArn: {
        'Fn::GetAtt': ['QueueA', 'Arn'],
      },
      FunctionName: {
        Ref: 'WorkerALambdaFunction',
      },
      Enabled: true,
    },
  },
  WorkerEventSourceMappingSQSQueueB: {
    Type: 'AWS::Lambda::EventSourceMapping',
    DependsOn: ['IamRoleLambdaExecution'],
    Properties: {
      BatchSize: 1,
      EventSourceArn: {
        'Fn::GetAtt': ['QueueB', 'Arn'],
      },
      FunctionName: {
        Ref: 'WorkerBLambdaFunction',
      },
      Enabled: true,
    },
  },
  WorkerEventSourceMappingSQSQueueC: {
    Type: 'AWS::Lambda::EventSourceMapping',
    DependsOn: ['IamRoleLambdaExecution'],
    Properties: {
      BatchSize: 1,
      EventSourceArn: {
        'Fn::GetAtt': ['QueueC', 'Arn'],
      },
      FunctionName: {
        Ref: 'WorkerALambdaFunction',
      },
      Enabled: true,
    },
  },
  WorkerEventSourceMappingSQSQueueD: {
    Type: 'AWS::Lambda::EventSourceMapping',
    DependsOn: ['IamRoleLambdaExecution'],
    Properties: {
      BatchSize: 1,
      EventSourceArn: {
        'Fn::GetAtt': ['QueueD', 'Arn'],
      },
      FunctionName: {
        Ref: 'WorkerDLambdaFunction',
      },
      Enabled: true,
    },
  },
});
