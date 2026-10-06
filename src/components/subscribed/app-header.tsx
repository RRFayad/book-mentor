"use client";

import Link from "next/link";
import { SquarePenIcon, StarIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import type { ConversationSummary } from "@/lib/backend/types";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";

type AppHeaderProps = {
  github: string;
  conversations: ConversationSummary[];
};

const styles = {
  header: tw(
    "flex h-14 items-center justify-between gap-4 border-b px-4 lg:px-6",
  ),
  start: tw("flex min-w-0 items-center gap-3"),
  title: tw("truncate text-sm font-medium"),
  mobileOnly: tw("md:hidden"),
  desktopSidebarTrigger: tw("hidden md:inline-flex"),
  actions: tw("flex shrink-0 items-center gap-2"),
};

export const AppHeader = ({ github, conversations }: AppHeaderProps) => {
  const pathname = usePathname();
  const { isMobile, state } = useSidebar();
  const conversationTitle = conversations.find(
    (conversation) => routes.conversations.detail(conversation.id) === pathname,
  )?.title;

  return (
    <header className={styles.header}>
      <div className={styles.start}>
        <SidebarTrigger className={styles.mobileOnly} />
        {!isMobile && state === "collapsed" && (
          <SidebarTrigger className={styles.desktopSidebarTrigger} />
        )}
        {conversationTitle && (
          <h1 className={styles.title}>{conversationTitle}</h1>
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
