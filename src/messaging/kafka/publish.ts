import kafka from "./kafka";

export async function publish(topic: string, payload: unknown, key?: string): Promise<void> {
  const producer = kafka.producer();
  await producer.connect();
  try {
    await producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(payload) }],
    });
  } finally {
    await producer.disconnect();
  }
}
