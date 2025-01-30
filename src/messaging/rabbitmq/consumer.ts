console.log("[console log] RabbitMQ server is listening...");

const amqp = require('amqplib');

const EXCHANGE = "user_events_exchange";
const QUEUE = "posts_service_queue";
const DLX_EXCHANGE = "user_events_dlx_exchange";
const DLX_QUEUE = "user_events_dlx_queue";
const MAX_RETRIES = 5;

async function getUserEvents() {
    try {
        // Establish a TCP connection
        const connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING);

        // Create a channel (communication line)
        const channel = await connection.createChannel();

        // Create an exchange (if not exists)
        await channel.assertExchange(EXCHANGE, "fanout", { durable: true });

        // Create a DLX (if not exists)
        await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });

        // Create a DLQ (if not exists)
        await channel.assertQueue(DLX_QUEUE, { durable: true });

        // Bind the DLQ to the DLX
        await channel.bindQueue(DLX_QUEUE, DLX_EXCHANGE, DLX_QUEUE);

        // Create the main queue with DLX configuration
        await channel.assertQueue(QUEUE, {
            durable: true,
            deadLetterExchange: DLX_EXCHANGE, 
            deadLetterRoutingKey: DLX_QUEUE, 
        });

        // Bind the main queue to the exchange
        await channel.bindQueue(QUEUE, EXCHANGE, "");

        console.log("Waiting for user events...");

        /* Consume messages from the main queue */
        channel.consume(QUEUE, async (message: any) => {
            if (message !== null) {
                try {
                    const userData = JSON.parse(message.content.toString());
                    console.log("User data received:", userData);

                    const success = await processUserData(userData);

                    if (success) {
                        console.log("User data processed successfully");
                        channel.ack(message);
                    } else {
                        console.log("User data processing failed. Sending to DLQ...");
                        channel.nack(message, false, false); // Reject the message (do not requeue)
                    }
                } catch (error) {
                    console.error("Error processing user data:", error);
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
                    console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES}):`, userData);

                    const success = await processUserData(userData);

                    if (success) {
                        console.log("Retry successful");
                        channel.ack(message);
                    } else {
                        console.log("Retry failed. Republishing to DLQ...");
                        // Increment retry count and republish to DLQ
                        channel.publish(EXCHANGE, "", Buffer.from(JSON.stringify(userData)), {
                            persistent: true,
                            headers: { 'x-retry-count': retryCount + 1 },
                        });
                        channel.ack(message);
                    }
                } else {
                    console.error("Max retries reached. Logging for manual intervention:", userData);
                    channel.ack(message);
                }
            }
        });
    } catch (error) {
        console.error("Error in RabbitMQ consumer:", error);
    }
}

/* Handle the processing of received data here */
async function processUserData(userData: any): Promise<boolean> {
    console.log(userData, " : User data");
    return true;
}

getUserEvents();