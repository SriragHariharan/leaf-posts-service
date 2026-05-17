import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: "post-service",
  brokers: brokers.length > 0 ? brokers : ["localhost:9092"],
});

export default kafka;
