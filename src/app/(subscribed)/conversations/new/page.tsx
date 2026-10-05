import { PageHeader } from "@/components/subscribed/page-header";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
};

// Placeholder until the "New Conversation with the Source picker" ticket.
const NewConversationPage = () => {
  return (
    <main className={styles.page}>
      <PageHeader
        title="New Conversation"
        description="Pick up to 3 Sources from your Library, then ask your first question."
      />
    </main>
  );
};

export default NewConversationPage;
