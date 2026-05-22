import type { EachMessagePayload } from "kafkajs";
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
    return false;
  }

  if (!userData.username) {
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
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let userData: UserEventPayload;
  try {
    userData = JSON.parse(raw);
  } catch {
    return;
  }
  const success = await upsertUser(userData);
  if (!success) {
  }
}

async function startUserEventsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
  } catch (error) {
  }
}

startUserEventsConsumer();
