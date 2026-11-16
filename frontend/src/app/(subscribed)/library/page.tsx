import { Library } from "@/components/subscribed/library/library";
import { countConversationsBySource, listSources } from "@/lib/backend/sources";
import { getUsage } from "@/lib/backend/usage";
import { isCurrentUserAdmin } from "@/lib/user/user";

const LibraryPage = async () => {
  const [sources, usage, conversationCounts, isAdmin] = await Promise.all([
    listSources(),
    getUsage(),
    countConversationsBySource(),
    isCurrentUserAdmin(),
  ]);

  return (
    <Library
      sources={sources}
      usage={usage}
      now={new Date()}
      conversationCounts={conversationCounts}
      isAdmin={isAdmin}
    />
  );
};

export default LibraryPage;
