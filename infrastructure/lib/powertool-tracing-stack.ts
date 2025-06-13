import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from "path";

export class PowertoolTracingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS Topic
    const topic = new sns.Topic(this, "PowertoolTracingTopic", {
      tracingConfig: sns.TracingConfig.PASS_THROUGH,
    });

    // Create SQS Queue
    const queue = new sqs.Queue(this, "PowertoolTracingQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Subscribe SQS to SNS
    topic.addSubscription(new subscriptions.SqsSubscription(queue));

    // Get the latest Powertools layer version for Python
    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "PowertoolsLayer",
      `arn:aws:lambda:${this.region}:017000801446:layer:AWSLambdaPowertoolsPythonV2:78`
    );

    // Create Lambda functions
    const producerLambda = new lambda.Function(this, "ProducerPythonFunction", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "app.handler",
      code: lambda.Code.fromAsset("src/functions/powertool/producer"),
      tracing: lambda.Tracing.PASS_THROUGH,
      environment: {
        TOPIC_ARN: topic.topicArn,
        POWERTOOLS_SERVICE_NAME: "producer-service",
        POWERTOOLS_METRICS_NAMESPACE: "PowertoolTracing",
        LOG_LEVEL: "INFO",
      },
      layers: [powertoolsLayer],
    });

    // Add X-Ray write access to producer Lambda
    producerLambda.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess")
    );

    const consumerLambda = new lambda.Function(this, "ConsumerFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../src/functions/x-ray/consumer/dist")
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
    const api = new apigateway.RestApi(this, "PowertoolTracingApi", {
      restApiName: "Powertool Tracing API",
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
