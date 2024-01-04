/**
 * The event supplied to a CodeDeploy lifecycle hook Lambda function.
 *
 * {@link https://docs.aws.amazon.com/codedeploy/latest/userguide/tutorial-ecs-with-hooks-create-hooks.html}
 */
export type CodeDeployLifecycleHookEvent = {
  DeploymentId: string;
  LifecycleEventHookExecutionId: string;
};
