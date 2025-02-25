/* the producer is to send messages to the notification service */
/* Notification sent when a new post is created, liked or commented */

import * as amqp from 'amqplib';

// Define the exchange name and type
const EXCHANGE_NAME = 'notifications';
const EXCHANGE_TYPE = 'topic';

// Define routing keys for different events
const ROUTING_KEYS = {
  POST_CREATED: 'post.created',
  POST_LIKED: 'post.liked',
  POST_COMMENTED: 'post.commented',
};

// Function to send a message to the topic exchange
async function sendPostRelatedNotification(eventType: string, postOwnerID: string, postID: string, interactedUserID: string): Promise<void> {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING!);
    const channel = await connection.createChannel();

    // Assert the topic exchange
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

    // Determine the routing key based on the event type
    let routingKey: string;
    switch (eventType) {
      case 'post_created':
        routingKey = ROUTING_KEYS.POST_CREATED;
        break;
      case 'post_liked':
        routingKey = ROUTING_KEYS.POST_LIKED;
        break;
      case 'post_commented':
        routingKey = ROUTING_KEYS.POST_COMMENTED;
        break;
      default:
        throw new Error('Invalid event type');
    }

    // Send the message to the exchange with the appropriate routing key
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify({ type: eventType, postID, postOwnerID, interactedUserID })));

    // Close the connection
    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export default sendPostRelatedNotification;