import type { InteractionEvent } from "../../interfaces/interaction.interface";
import logger from "../../helpers/logger";
import { publish } from "./publish";

const TOPIC = "interaction.events";

export async function publishInteractionEvent(event: InteractionEvent): Promise<void> {
  try {
    await publish(TOPIC, event, event.postId);
    logger.info(`Published interaction event: ${event.eventType}`, {
      layer: "kafka",
      postId: event.postId,
      eventType: event.eventType,
    });
  } catch (error) {
    logger.error(`Failed to publish interaction event: ${event.eventType}`, {
      error,
      layer: "kafka",
      postId: event.postId,
    });
  }
}
