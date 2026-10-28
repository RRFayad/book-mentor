import { notFound } from "next/navigation";

import { ConversationThread } from "@/components/subscribed/conversation/conversation-thread";
import { getConversation } from "@/lib/backend/conversations";
import { getUsage } from "@/lib/backend/usage";
import { tw } from "@/lib/utils";

const styles = {
  // The thread fills the content area edge to edge: undo the layout's padding
  // and take the height below the 3.5rem header.
  thread: tw("-m-4 h-[calc(100svh-3.5rem)] lg:-m-6"),
};

const ConversationPage = async ({
  params,
  searchParams,
}: PageProps<"/conversations/[id]">) => {
  const { id } = await params;
  const { ask } = await searchParams;
  const [conversation, usage] = await Promise.all([
    getConversation(id),
    getUsage(),
  ]);

  if (!conversation) {
    notFound();
  }

  return (
    <div className={styles.thread}>
      <ConversationThread
        conversation={conversation}
        initialUsage={usage}
        pendingQuestion={typeof ask === "string" ? ask : undefined}
      />
    </div>
  );
};

export default ConversationPage;
