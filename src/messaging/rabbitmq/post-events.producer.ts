/* 
 * Producer file used to publish events when a new post is added. 
 * This event is sent to the feeds service to generate and update user feeds.
 */

import { closeRabbitMQConnection, getRabbitMQConnection } from './rabbitmq.config';

const EXCHANGE = "post_events_exchange";

async function sendPostEvents(postID: string, imageURL: string|null, content: string, ownerID: string): Promise<void> {
    try {
        // Create a TCP connection
        const connection = await getRabbitMQConnection();

        // Create a channel (communication line within tcp connection)
        const channel = await connection.createChannel();

        // Create an exchange if not present
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        // Convert userDetails to a buffer
        const bufferMessage = Buffer.from(JSON.stringify({postID, imageURL, content, ownerID}));

        // Send message to the exchange(No routing key needed for fanout exchange)
        await channel.publish(EXCHANGE, "post.created", bufferMessage);
        console.log("post event sent successfully");

        // Close the channel
        await channel.close();
    } catch (error) {
        console.error("Error sending user event:", error);
        throw error;
    }finally{
        await closeRabbitMQConnection();
    }
}

export default sendPostEvents;