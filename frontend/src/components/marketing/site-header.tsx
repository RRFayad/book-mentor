import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { SparklesIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { siteConfig } from "@/lib/site-config";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";

const styles = {
  header: tw(
    "fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl",
  ),
  content: tw(
    "mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 lg:px-8",
  ),
  brand: tw("flex items-center font-semibold"),
  brandIcon: tw("mr-2 size-5 text-primary"),
  navigation: tw(
    "hidden items-center gap-6 text-sm text-muted-foreground md:flex",
  ),
  navigationLink: tw("transition-colors hover:text-foreground"),
  actions: tw("col-start-3 flex items-center gap-2 justify-self-end"),
};

export const SiteHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link href={routes.home} className={styles.brand}>
          <SparklesIcon className={styles.brandIcon} />
          {siteConfig.name}
        </Link>
        <Show when="signed-out">
          <nav className={styles.navigation}>
            <Link href={routes.signIn} className={styles.navigationLink}>
              Sign In
            </Link>
            <Link href={routes.signUp} className={styles.navigationLink}>
              Sign Up
            </Link>
          </nav>
        </Show>
        <div className={styles.actions}>
          <ThemeToggle />
          <Show when="signed-in">
            <UserButton />
          </Show>
          {siteConfig.github && (
            <Button variant="outline" size="sm" asChild>
              <a href={siteConfig.github} rel="noopener" target="_blank">
                <StarIcon />
                Github Repo
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
