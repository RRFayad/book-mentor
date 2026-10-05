import { notFound } from "next/navigation";

import { ConversationThread } from "@/components/subscribed/conversation/conversation-thread";
import { getConversation } from "@/lib/backend/conversations";
import { tw } from "@/lib/utils";

const styles = {
  // The thread fills the content area edge to edge: undo the layout's padding
  // and take the height below the 3.5rem header.
  thread: tw("-m-4 h-[calc(100svh-3.5rem)] lg:-m-6"),
};

const ConversationPage = async ({
  params,
}: PageProps<"/conversations/[id]">) => {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    notFound();
  }

  return (
    <div className={styles.thread}>
      <ConversationThread conversation={conversation} />
    </div>
  );
};

export default ConversationPage;
