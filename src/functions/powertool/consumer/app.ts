import { SQSEvent, Context } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";

// Initialize Powertools
const logger = new Logger();
const tracer = new Tracer();

interface Message {
  id: string;
  timestamp: string;
  body: string;
}

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  logger.info("Received event", { event });

  try {
    for (const record of event.Records) {
      await processMessage(record);
    }
  } catch (error) {
    logger.error("Error processing messages", { error });
    throw error;
  }
};

const processMessage = async (
  record: SQSEvent["Records"][0]
): Promise<void> => {
  try {
    const message: Message = JSON.parse(record.body);

    logger.info("Processing message", {
      messageId: message.id,
      timestamp: message.timestamp,
      body: message.body,
      traceId: record.attributes?.AWSTraceHeader || "no-trace-id",
    });

    // Add your message processing logic here
    // For example, you could store the message in DynamoDB, call another service, etc.
  } catch (error) {
    logger.error("Error processing individual message", { error });
    throw error;
  }
};
