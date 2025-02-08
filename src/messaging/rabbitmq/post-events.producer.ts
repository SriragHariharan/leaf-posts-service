/* 
 * Producer file used to publish events when a new post is added or deleted. 
 * These events are sent to the feeds service to generate and update user feeds.
 */

import { closeRabbitMQConnection, getRabbitMQConnection } from './rabbitmq.config';

const EXCHANGE = "post_events_exchange";

async function sendPostCreatedEvent(postID: string, imageURL: string|null, content: string, ownerID: string): Promise<void> {
    try {
        // Create a TCP connection
        const connection = await getRabbitMQConnection();

        // Create a channel (communication line within tcp connection)
        const channel = await connection.createChannel();

        // Create an exchange if not present
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        // Convert userDetails to a buffer
        const bufferMessage = Buffer.from(JSON.stringify({postID, imageURL, content, ownerID}));

        // Send message to the exchange with the post.created routing key
        await channel.publish(EXCHANGE, "post.created", bufferMessage);
        console.log("post created event sent successfully");

        // Close the channel
        await channel.close();
    } catch (error) {
        console.error("Error sending post created event:", error);
        throw error;
    }finally{
        await closeRabbitMQConnection();
    }
}

async function sendPostDeletedEvent(postID: string): Promise<void> {
    try {
        // Create a TCP connection
        const connection = await getRabbitMQConnection();

        // Create a channel (communication line within tcp connection)
        const channel = await connection.createChannel();

        // Create an exchange if not present
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        // Convert userDetails to a buffer
        const bufferMessage = Buffer.from(JSON.stringify({postID}));

        // Send message to the exchange with the post.deleted routing key
        await channel.publish(EXCHANGE, "post.deleted", bufferMessage);
        console.log("post deleted event sent successfully");

        // Close the channel
        await channel.close();
    } catch (error) {
        console.error("Error sending post deleted event:", error);
        throw error;
    }finally{
        await closeRabbitMQConnection();
    }
}

export { sendPostCreatedEvent, sendPostDeletedEvent };