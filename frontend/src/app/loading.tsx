import { Skeleton } from "@/components/ui/skeleton";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8 p-4 lg:p-6"),
  header: tw("space-y-3"),
  eyebrow: tw("h-4 w-24"),
  title: tw("h-8 w-72 max-w-full"),
  description: tw("h-5 w-full max-w-2xl"),
  cards: tw("grid gap-4 sm:grid-cols-2 xl:grid-cols-4"),
  card: tw("h-36 rounded-xl"),
  panels: tw("grid gap-6 xl:grid-cols-2"),
  panel: tw("h-72 rounded-xl"),
};

const Loading = () => {
  return (
    <main className={styles.page} aria-label="Loading page" aria-busy="true">
      <section className={styles.header}>
        <Skeleton className={styles.eyebrow} />
        <Skeleton className={styles.title} />
        <Skeleton className={styles.description} />
      </section>
      <section className={styles.cards}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className={styles.card} />
        ))}
      </section>
      <section className={styles.panels}>
        <Skeleton className={styles.panel} />
        <Skeleton className={styles.panel} />
      </section>
    </main>
  );
};

export default Loading;
