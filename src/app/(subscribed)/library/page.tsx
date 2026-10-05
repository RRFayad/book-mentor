import { Library } from "@/components/subscribed/library/library";
import { listSources } from "@/lib/backend/sources";
import { getUsage } from "@/lib/backend/usage";

const LibraryPage = async () => {
  const [sources, usage] = await Promise.all([listSources(), getUsage()]);

  return <Library sources={sources} usage={usage} now={new Date()} />;
};

export default LibraryPage;
