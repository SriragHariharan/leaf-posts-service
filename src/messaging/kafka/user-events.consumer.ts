import type { EachMessagePayload } from "kafkajs";
import logger from "../../helpers/logger";
import prisma from "../../helpers/prisma";
import ElasticSearchRepository from "../../repositories/elastic.repository";
import kafka from "./kafka";

const TOPIC = "user.events";
const consumer = kafka.consumer({ groupId: "post-service-user-events" });
const esRepository = new ElasticSearchRepository();

interface UserEventPayload {
  userID?: string;
  username?: string;
  profilePicture?: string | null;
}

async function upsertUser(userData: UserEventPayload): Promise<boolean> {
  if (!userData.userID) {
    logger.error("[Kafka] Invalid user data: Missing userID");
    return false;
  }

  if (!userData.username) {
    logger.error("[Kafka] Invalid user data: Missing username");
    return false;
  }

  const profilepic = userData.profilePicture ?? null;

  try {
    await prisma.user.upsert({
      where: { userID: userData.userID },
      update: {
        username: userData.username,
        profilepic,
      },
      create: {
        userID: userData.userID,
        username: userData.username,
        profilepic,
      },
    });

    try {
      await esRepository.indexUser(userData.userID, userData.username, profilepic);
    } catch (esError) {
      logger.error(`[Kafka] Prisma upsert succeeded but Elasticsearch index failed for userID: ${userData.userID}`, { error: esError });
      return false;
    }

    logger.info(`[Database] Successfully upserted user with userID: ${userData.userID}`);
    return true;
  } catch (error) {
    logger.error("[Kafka] Error upserting user", { error });
    return false;
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let userData: UserEventPayload;
  try {
    userData = JSON.parse(raw);
  } catch {
    logger.warn("[Kafka] skipped invalid user.events message");
    return;
  }

  logger.info(`[Kafka] Received user event for userID: ${userData.userID}`);
  const success = await upsertUser(userData);
  if (!success) {
    logger.warn(`[Kafka] Processing failed for userID: ${userData.userID}`);
  }
}

async function startUserEventsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
    logger.info("[Kafka] Ready to consume user.events");
  } catch (error) {
    logger.error("[Kafka] Critical error in consumer setup", { error });
  }
}

startUserEventsConsumer();
