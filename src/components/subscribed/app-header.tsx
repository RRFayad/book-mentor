"use client";

import { ChevronRightIcon, StarIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";

type AppHeaderProps = {
  github: string;
};

const routeContext = {
  [routes.workspace.overview]: { section: "Workspace", page: "Overview" },
  [routes.settings.billing]: { section: "Settings", page: "Billing" },
  [routes.settings.account]: { section: "Settings", page: "Account" },
} as const;

const styles = {
  header: tw("flex h-14 items-center justify-between border-b px-4 lg:px-6"),
  start: tw("flex items-center gap-3"),
  mobileSidebarTrigger: tw("md:hidden"),
  desktopSidebarTrigger: tw("hidden md:inline-flex"),
  breadcrumb: tw("hidden items-center gap-2 text-sm md:flex"),
  breadcrumbSection: tw("text-muted-foreground"),
  breadcrumbIcon: tw("size-3.5 text-muted-foreground"),
  breadcrumbPage: tw("font-medium"),
  actions: tw("flex items-center gap-2"),
};

export const AppHeader = ({ github }: AppHeaderProps) => {
  const pathname = usePathname();
  const { isMobile, state } = useSidebar();
  const context = routeContext[pathname as keyof typeof routeContext];

  return (
    <header className={styles.header}>
      <div className={styles.start}>
        <SidebarTrigger className={styles.mobileSidebarTrigger} />
        {!isMobile && state === "collapsed" && (
          <SidebarTrigger className={styles.desktopSidebarTrigger} />
        )}
        {context && (
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <span className={styles.breadcrumbSection}>{context.section}</span>
            <ChevronRightIcon className={styles.breadcrumbIcon} />
            <span className={styles.breadcrumbPage}>{context.page}</span>
          </nav>
        )}
      </div>
      <div className={styles.actions}>
        <ThemeToggle />
        {github && (
          <Button variant="ghost" size="sm" asChild>
            <a href={github} rel="noopener" target="_blank">
              <StarIcon />
              View on GitHub
            </a>
          </Button>
        )}
      </div>
    </header>
  );
};
