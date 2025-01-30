import logger from "../../helpers/logger";
import amqp from "amqplib";

console.log("[console log] RabbitMQ server is listening...");

const EXCHANGE = "user_events_exchange";
const QUEUE = "posts_service_queue";
const DLX_EXCHANGE = "user_events_dlx_exchange";
const DLX_QUEUE = "user_events_dlx_queue";
const MAX_RETRIES = 5;

async function getUserEvents() {
    try {
        logger.info("[RabbitMQ] Initializing connection to RabbitMQ...");
        
        // Establish a TCP connection
        const connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING!);
        logger.info("[RabbitMQ] Connection established successfully.");

        // Create a channel (communication line)
        const channel = await connection.createChannel();
        logger.info("[RabbitMQ] Channel created successfully.");

        // Create a main exchange (if not exists)
        await channel.assertExchange(EXCHANGE, "fanout", { durable: true });
        logger.info(`[RabbitMQ] Exchange '${EXCHANGE}' asserted.`);

        // Create a DLX (if not exists)
        await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
        logger.info(`[RabbitMQ] DLX '${DLX_EXCHANGE}' asserted.`);

        // Create a DLQ (if not exists)
        await channel.assertQueue(DLX_QUEUE, { durable: true });
        logger.info(`[RabbitMQ] DLQ '${DLX_QUEUE}' asserted.`);

        // Bind the DLQ to the DLX
        await channel.bindQueue(DLX_QUEUE, DLX_EXCHANGE, DLX_QUEUE);
        logger.info(`[RabbitMQ] DLQ '${DLX_QUEUE}' bound to DLX '${DLX_EXCHANGE}'.`);

        // Create the main queue with DLX configuration
        await channel.assertQueue(QUEUE, {
            durable: true,
            deadLetterExchange: DLX_EXCHANGE, 
            deadLetterRoutingKey: DLX_QUEUE, 
        });
        logger.info(`[RabbitMQ] Queue '${QUEUE}' asserted with DLX '${DLX_EXCHANGE}'.`);

        // Bind the main queue to the exchange
        await channel.bindQueue(QUEUE, EXCHANGE, "");
        logger.info(`[RabbitMQ] Queue '${QUEUE}' bound to exchange '${EXCHANGE}'.`);

        /* Consume messages from the main queue */
        channel.consume(QUEUE, async (message: any) => {
            if (message !== null) {
                try {
                    const userData = JSON.parse(message.content.toString());
                    logger.info(`[RabbitMQ] Received user event for userID: ${userData?.id}`);

                    const success = await processUserData(userData);

                    if (success) {
                        logger.info(`[RabbitMQ] Successfully processed event for userID: ${userData?.id}`);
                        channel.ack(message);
                    } else {
                        logger.warn(`[RabbitMQ] Processing failed for userID: ${userData?.id}. Sending to DLQ.`);
                        channel.nack(message, false, false); // Reject the message (do not requeue)
                    }
                } catch (error) {
                    logger.error(`[RabbitMQ] Error processing user event: `, { error });
                    channel.nack(message, false, false); // Reject the message (do not requeue)
                }
            }
        });

        /* Consume messages from the DLQ for retries */
        channel.consume(DLX_QUEUE, async (message: any) => {
            if (message !== null) {
                const userData = JSON.parse(message.content.toString());
                const retryCount = message.properties.headers['x-retry-count'] || 0;

                if (retryCount < MAX_RETRIES) {
                    logger.warn(`[RabbitMQ] Retrying event (${retryCount + 1}/${MAX_RETRIES}) for userID: ${userData?.userID}`);

                    const success = await processUserData(userData);

                    if (success) {
                        logger.info(`[RabbitMQ] Retry successful for userID: ${userData?.userID}`);
                        channel.ack(message);
                    } else {
                        logger.warn(`[RabbitMQ] Retry failed for userID: ${userData?.userID}. Republishing to DLQ...`);
                        // Increment retry count and republish to DLQ
                        channel.publish(EXCHANGE, "", Buffer.from(JSON.stringify(userData)), {
                            persistent: true,
                            headers: { 'x-retry-count': retryCount + 1 },
                        });
                        channel.ack(message);
                    }
                } else {
                    logger.error(`[RabbitMQ] Max retries reached for userID: ${userData?.userID}. Manual intervention required.`, { userData });
                    channel.ack(message);
                }
            }
        });

        logger.info("[RabbitMQ] Ready to consume messages...");
    } catch (error) {
        logger.error(`[RabbitMQ] Critical error in consumer setup: `, { error });
    }
}

/* Handle the processing of received data here */
async function processUserData(userData: any): Promise<boolean> {
    logger.info(`[RabbitMQ] Processing user data for userID: ${userData?.id}`);
    console.log(userData, " : User data");
    return true;
}

getUserEvents();
