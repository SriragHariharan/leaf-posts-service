import { publish } from "./publish";

async function sendPostCreatedEvent(
  postID: string,
  imageURL: string | null,
  content: string,
  ownerID: string,
): Promise<void> {
  try {
    await publish("post.created", { postID, imageURL, content, ownerID });
    console.log("post created event sent successfully");
  } catch (error) {
    console.error("Error sending post created event:", error);
    throw error;
  }
}

async function sendPostDeletedEvent(postID: string): Promise<void> {
  try {
    await publish("post.deleted", { postID });
    console.log("post deleted event sent successfully");
  } catch (error) {
    console.error("Error sending post deleted event:", error);
    throw error;
  }
}

export { sendPostCreatedEvent, sendPostDeletedEvent };
