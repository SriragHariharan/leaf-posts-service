import { publish } from "./publish";

const TOPICS: Record<string, string> = {
  post_created: "notification.post.created",
};

async function sendPostRelatedNotification(
  eventType: string,
  postOwnerID: string,
  postID: string,
  interactedUserID: string,
): Promise<void> {
  const topic = TOPICS[eventType];
  if (!topic) {
    console.error("Invalid event type:", eventType);
    return;
  }

  try {
    await publish(topic, { type: eventType, postID, postOwnerID, interactedUserID });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export default sendPostRelatedNotification;
