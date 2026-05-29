import fs from "fs";
import { Kafka, type SASLOptions } from "kafkajs";

function parseBrokers(raw?: string): string[] {
  const brokers = (raw ?? "localhost:9092")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
  return brokers.length > 0 ? brokers : ["localhost:9092"];
}

function resolveMode(): "local" | "aiven" {
  const explicit = process.env.KAFKA_MODE?.trim().toLowerCase();
  if (explicit === "local" || explicit === "aiven") {
    return explicit;
  }
  if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
    return "aiven";
  }
  return "local";
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required in aiven mode`);
  }
  return value;
}

function loadCaPem(): string {
  const path = process.env.KAFKA_SSL_CA_PATH?.trim();
  if (path) {
    return fs.readFileSync(path, "utf-8");
  }
  const inline = process.env.KAFKA_SSL_CA?.trim();
  if (inline) {
    return inline.replace(/\\n/g, "\n");
  }
  throw new Error("aiven mode requires KAFKA_SSL_CA_PATH or KAFKA_SSL_CA");
}

function mapMechanism(raw: string): "plain" | "scram-sha-256" | "scram-sha-512" {
  const mechanism = raw.trim().toLowerCase();
  switch (mechanism) {
    case "scram-sha-256":
    case "scram-sha-512":
    case "plain":
      return mechanism;
    default:
      throw new Error(`unsupported KAFKA_SASL_MECHANISM: ${raw}`);
  }
}

function buildSaslOptions(): SASLOptions {
  const mechanism = mapMechanism(process.env.KAFKA_SASL_MECHANISM ?? "scram-sha-256");
  const username = requireEnv("KAFKA_SASL_USERNAME");
  const password = requireEnv("KAFKA_SASL_PASSWORD");

  switch (mechanism) {
    case "plain":
      return { mechanism, username, password };
    case "scram-sha-256":
      return { mechanism, username, password };
    case "scram-sha-512":
      return { mechanism, username, password };
  }
}

const brokers = parseBrokers(process.env.KAFKA_BROKERS);
const mode = resolveMode();

const kafka =
  mode === "local"
    ? new Kafka({ clientId: "post-service", brokers })
    : new Kafka({
        clientId: "post-service",
        brokers,
        ssl: { ca: [loadCaPem()], rejectUnauthorized: true },
        sasl: buildSaslOptions(),
      });

export default kafka;
