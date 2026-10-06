import { NewConversation } from "@/components/subscribed/conversation/new-conversation";
import { listSources } from "@/lib/backend/sources";

const NewConversationPage = async () => {
  const sources = await listSources();

  return <NewConversation sources={sources} />;
};

export default NewConversationPage;
