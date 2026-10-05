import { Library } from "@/components/subscribed/library/library";
import { countConversationsBySource, listSources } from "@/lib/backend/sources";
import { getUsage } from "@/lib/backend/usage";

const LibraryPage = async () => {
  const [sources, usage, conversationCounts] = await Promise.all([
    listSources(),
    getUsage(),
    countConversationsBySource(),
  ]);

  return (
    <Library
      sources={sources}
      usage={usage}
      now={new Date()}
      conversationCounts={conversationCounts}
    />
  );
};

export default LibraryPage;
