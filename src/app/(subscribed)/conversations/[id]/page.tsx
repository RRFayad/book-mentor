import { PageHeader } from "@/components/subscribed/page-header";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
};

// Placeholder until the "Conversation thread on assistant-ui" ticket.
const ConversationPage = async ({
  params,
}: PageProps<"/conversations/[id]">) => {
  const { id } = await params;

  return (
    <main className={styles.page}>
      <PageHeader title="Conversation" description={`Conversation ${id}`} />
    </main>
  );
};

export default ConversationPage;
