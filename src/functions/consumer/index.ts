import { SQSEvent, SQSRecord } from "aws-lambda";

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    for (const record of event.Records) {
      await processMessage(record);
    }
  } catch (error) {
    console.error("Error processing messages:", error);
    throw error;
  }
};

async function processMessage(record: SQSRecord): Promise<void> {
  try {
    const message = JSON.parse(record.body);
    console.log("Processing message:", {
      messageId: message.id,
      timestamp: message.timestamp,
      body: message.body,
      traceId: record.attributes?.AWSTraceHeader || "no-trace-id",
    });

    // Add your message processing logic here
    // For example, you could store the message in DynamoDB, call another service, etc.
  } catch (error) {
    console.error("Error processing individual message:", error);
    throw error;
  }
}
