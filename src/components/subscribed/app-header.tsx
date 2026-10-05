"use client";

import Link from "next/link";
import { SquarePenIcon, StarIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";

type AppHeaderProps = {
  github: string;
};

const styles = {
  header: tw("flex h-14 items-center justify-between border-b px-4 lg:px-6"),
  start: tw("flex items-center gap-3"),
  mobileOnly: tw("md:hidden"),
  desktopSidebarTrigger: tw("hidden md:inline-flex"),
  actions: tw("flex items-center gap-2"),
};

export const AppHeader = ({ github }: AppHeaderProps) => {
  const { isMobile, state } = useSidebar();

  return (
    <header className={styles.header}>
      <div className={styles.start}>
        <SidebarTrigger className={styles.mobileOnly} />
        {!isMobile && state === "collapsed" && (
          <SidebarTrigger className={styles.desktopSidebarTrigger} />
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
        <Button
          variant="ghost"
          size="icon"
          className={styles.mobileOnly}
          asChild
        >
          <Link href={routes.conversations.new} aria-label="New Conversation">
            <SquarePenIcon />
          </Link>
        </Button>
      </div>
    </header>
  );
};
