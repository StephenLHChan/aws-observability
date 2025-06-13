#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { XRayTracingStack } from "../lib/xray-tracing-stack";
import { PowertoolTracingStack } from "../lib/powertool-tracing-stack";

const app = new cdk.App();
new XRayTracingStack(app, "XRayTracingStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new PowertoolTracingStack(app, "PowertoolTracingStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
