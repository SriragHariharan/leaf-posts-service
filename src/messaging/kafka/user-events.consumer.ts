import type { EachMessagePayload } from "kafkajs";
import esClient from "../../helpers/elastic-search";
import logger from "../../helpers/logger";
import prisma from "../../helpers/prisma";
import kafka from "./kafka";

const TOPIC = "user.events";
const consumer = kafka.consumer({ groupId: "post-service-user-events" });

interface UserData {
  userID: string;
  username?: string;
  profilePicture?: string;
  type: "user" | "username" | "picture";
}

async function processUserData(userData: UserData): Promise<boolean> {
  if (!userData.userID) {
    logger.error("[Kafka] Invalid user data: Missing userID");
    return false;
  }

  try {
    if (userData.type === "user") {
      return await createUser(userData);
    }
    if (userData.type === "username" && userData.username) {
      return await updateUsername(userData.userID, userData.username);
    }
    if (userData.type === "picture" && userData.profilePicture) {
      return await updateProfilePicture(userData.userID, userData.profilePicture);
    }
    logger.warn(`[Kafka] Unknown user event type: ${userData.type}`);
    return false;
  } catch (error) {
    logger.error("[Kafka] Error processing user event", { error });
    return false;
  }
}

async function createUser(user: UserData): Promise<boolean> {
  try {
    await esClient.index({
      index: "users",
      id: user.userID,
      body: {
        userID: user.userID,
        username: user.username,
        profilepic: user.profilePicture ?? null,
      },
    });

    await prisma.user.create({
      data: {
        userID: user.userID,
        username: user.username ?? "",
        profilepic: user.profilePicture ?? null,
      },
    });

    logger.info(`[Database] Successfully created user with userID: ${user.userID}`);
    return true;
  } catch (error) {
    logger.error("[Database] Error creating user", { error });
    return false;
  }
}

async function updateUsername(userID: string, newUsername: string): Promise<boolean> {
  try {
    await prisma.user.update({ where: { userID }, data: { username: newUsername } });
    await esClient.update({ index: "users", id: userID, body: { doc: { username: newUsername } } });
    logger.info(`[Database] Updated username for userID: ${userID}`);
    return true;
  } catch (error) {
    logger.error("[Database] Error updating username", { error });
    return false;
  }
}

async function updateProfilePicture(userID: string, newProfilePicture: string): Promise<boolean> {
  try {
    await prisma.user.update({ where: { userID }, data: { profilepic: newProfilePicture } });
    await esClient.update({ index: "users", id: userID, body: { doc: { profilepic: newProfilePicture } } });
    logger.info(`[Database] Updated profile picture for userID: ${userID}`);
    return true;
  } catch (error) {
    logger.error("[Database] Error updating profile picture", { error });
    return false;
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let userData: UserData;
  try {
    userData = JSON.parse(raw) as UserData;
  } catch {
    logger.warn("[Kafka] skipped invalid user.events message");
    return;
  }

  logger.info(`[Kafka] Received user event for userID: ${userData.userID}`);
  const success = await processUserData(userData);
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
