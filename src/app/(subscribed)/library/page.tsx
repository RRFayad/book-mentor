import { PageHeader } from "@/components/subscribed/page-header";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
};

// Placeholder until the "Library page (view only)" ticket.
const LibraryPage = () => {
  return (
    <main className={styles.page}>
      <PageHeader
        title="Library"
        description="The books and blogs your Mentor draws on."
      />
    </main>
  );
};

export default LibraryPage;
