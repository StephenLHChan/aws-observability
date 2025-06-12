# AWS Observability Testing

This repository contains various AWS observability testing scenarios, focusing on X-Ray tracing and other AWS observability services.

## Project Structure

```
aws-observability/
├── infrastructure/           # CDK infrastructure code
│   ├── lib/                 # CDK stack definitions
│   └── bin/                 # CDK app entry points
├── src/                     # Application source code
│   ├── api/                # API Gateway handlers
│   ├── functions/          # Lambda functions
│   └── shared/             # Shared code and utilities
├── tests/                   # Test files
└── docs/                    # Documentation
```

## Current Test Scenario: X-Ray Tracing Chain

The current implementation demonstrates a complete X-Ray tracing chain:

1. API Gateway with active tracing
2. Lambda function with passthrough tracing
3. SNS topic with passthrough tracing
4. SQS queue subscribed to SNS
5. Lambda consumer with passthrough tracing

## Setup and Deployment

1. Install dependencies:

   ```bash
   npm install
   ```

2. Deploy the infrastructure:
   ```bash
   npm run cdk deploy
   ```

## Development

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run tests
- `npm run cdk synth` - Synthesize CloudFormation template
- `npm run cdk deploy` - Deploy to AWS
