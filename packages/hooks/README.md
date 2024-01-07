# @seek/aws-codedeploy-hooks

[![npm package](https://img.shields.io/npm/v/%40seek/aws-codedeploy-hooks)](https://www.npmjs.com/package/@seek/aws-codedeploy-hooks)

Runtime helpers for working with AWS CodeDeploy Hooks.

It allows us to present applications with runtime helpers that identify requests originating from a CodeDeploy hook.
This could be used to drive specific behaviour;
for example, you may want a particular version of your application to _skip_ typical before allow traffic checks in a disaster recovery scenario where some of those checks are expected to fail while systems and dependencies are only partially available.

## Design

This package is designed to be lightweight, ideally with zero external dependencies, and to have infrequent changes to reduce maintenance burden.
