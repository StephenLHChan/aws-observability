import json
import os
import uuid
from datetime import datetime
from typing import Any, Dict

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.utilities.data_classes import APIGatewayProxyEvent

# Initialize Powertools
tracer = Tracer()
logger = Logger()

# Initialize AWS clients
sns = boto3.client("sns")

@logger.inject_lambda_context
@tracer.capture_lambda_handler
def handler(event: APIGatewayProxyEvent, context: LambdaContext) -> Dict[str, Any]:
    try:
        # Create message
        message = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "body": event.get("body", "No message body provided"),
        }

        # Publish to SNS
        with tracer.provider.in_subsegment("publish_to_sns") as subsegment:
            response = sns.publish(
                TopicArn=os.environ["TOPIC_ARN"],
                Message=json.dumps(message),
            )
            subsegment.put_annotation("message_id", message["id"])

        logger.info("Message published successfully", extra={"message_id": message["id"]})

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Message published successfully",
                "messageId": message["id"],
            }),
        }
    except Exception as e:
        logger.exception("Error publishing message")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": "Error publishing message",
                "error": str(e),
            }),
        } 