import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SNS } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const sns = new SNS();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      body: event.body || "No message body provided",
    };

    await sns
      .publish({
        TopicArn: process.env.TOPIC_ARN!,
        Message: JSON.stringify(message),
        // MessageAttributes: {
        //   traceId: {
        //     DataType: "String",
        //     StringValue: event.headers["x-amzn-trace-id"] || "no-trace-id",
        //   },
        // },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Message published successfully",
        messageId: message.id,
      }),
    };
  } catch (error) {
    console.error("Error publishing message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error publishing message",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
