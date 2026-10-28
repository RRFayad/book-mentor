import type { ReactNode } from "react";

import { tw } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

const styles = {
  wrapper: tw("flex flex-col justify-between gap-4 sm:flex-row sm:items-end"),
  title: tw("text-2xl font-semibold tracking-tight"),
  description: tw("mt-2 max-w-2xl text-sm text-muted-foreground"),
  action: tw("w-fit"),
};

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <section className={styles.wrapper}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
};
