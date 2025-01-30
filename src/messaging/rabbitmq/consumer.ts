console.log("[console log] RabbitMQ server is listening...")

const amqp = require('amqplib');

const EXCHANGE  = "user_events_exchange";
const QUEUE     = "posts_service_queue";

async function getUserEvents(){
    try {
        //establish a tcp connection
        const connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING);

        //create a channel(communcation line)
        const channel = await connection.createChannel();

        //create an exchange(if not exists)
        await channel.assertExchange(EXCHANGE, "fanout", { durable: true });

        //create a queue if not exists
        await channel.assertQueue(QUEUE, {durable: true});

        //binding queue with channel
        await channel.bindQueue(QUEUE, EXCHANGE);

        channel.consume(QUEUE, (message: any) => {
            console.log("user data recieved: ", JSON.parse(message.content))
            channel.ack(message);
        })

    } catch (error) {
        console.error(error);
    }
}

getUserEvents();