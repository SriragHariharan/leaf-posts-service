import type { InteractionEvent } from "../../interfaces/interaction.interface";
import { publish } from "./publish";

const TOPIC = "interaction.events";

export async function publishInteractionEvent(event: InteractionEvent): Promise<void> {
  try {
    await publish(TOPIC, event, event.postId);
  } catch (error) {
  }
}
