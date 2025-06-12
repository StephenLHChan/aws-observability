import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from "path";

export class XRayTracingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS Topic
    const topic = new sns.Topic(this, "XRayTracingTopic", {
      tracingConfig: sns.TracingConfig.PASS_THROUGH,
    });

    // Create SQS Queue
    const queue = new sqs.Queue(this, "XRayTracingQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Subscribe SQS to SNS
    topic.addSubscription(new subscriptions.SqsSubscription(queue));

    // Create Lambda functions
    const producerLambda = new lambda.Function(this, "ProducerFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../src/functions/producer/dist")
      ),
      // tracing: lambda.Tracing.ACTIVE,
      environment: {
        TOPIC_ARN: topic.topicArn,
      },
    });

    // Add X-Ray write access to producer Lambda
    producerLambda.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess")
    );

    const consumerLambda = new lambda.Function(this, "ConsumerFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../src/functions/consumer/dist")
      ),
      tracing: lambda.Tracing.ACTIVE,
    });

    consumerLambda.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess")
    );

    // Grant permissions
    topic.grantPublish(producerLambda);
    queue.grantConsumeMessages(consumerLambda);

    // Add event source mapping for SQS to Lambda
    new lambda.EventSourceMapping(this, "ConsumerQueueMapping", {
      target: consumerLambda,
      eventSourceArn: queue.queueArn,
      batchSize: 1,
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, "XRayTracingApi", {
      restApiName: "XRay Tracing API",
      deployOptions: {
        tracingEnabled: true,
      },
    });

    // Add API Gateway integration
    const integration = new apigateway.LambdaIntegration(producerLambda, {
      proxy: true,
    });

    api.root.addResource("message").addMethod("POST", integration);
  }
}
