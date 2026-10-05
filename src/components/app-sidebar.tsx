"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { CreditCardIcon, LibraryIcon, SquarePenIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { ConversationSummary, Usage } from "@/lib/backend/types";
import { groupConversationsByDate } from "@/lib/conversations/group-by-date";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";

const styles = {
  header: tw("flex-row items-center justify-between pt-3"),
  brand: tw(
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold",
  ),
  brandMark: tw(
    "flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] text-primary-foreground",
  ),
  brandLabel: tw("truncate group-data-[collapsible=icon]:hidden"),
  desktopSidebarTrigger: tw("hidden md:inline-flex"),
  conversations: tw("border-t group-data-[collapsible=icon]:hidden"),
  conversationTitle: tw("truncate"),
  account: tw("flex items-center gap-2 rounded-md px-2 py-1.5"),
  accountContent: tw("min-w-0 group-data-[collapsible=icon]:hidden"),
  accountLabel: tw("truncate text-sm font-medium text-sidebar-foreground"),
  accountEmail: tw("mt-0.5 truncate text-xs text-sidebar-foreground/60"),
};

// Grouping by date needs the user's local time, which the server does not
// know. The groups render only in the browser, so the server HTML and the
// first browser render always match.
const subscribeToNothing = () => () => {};
const useIsBrowser = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

type AppSidebarProps = {
  appName: string;
  billingEnabled: boolean;
  conversations: ConversationSummary[];
  usage: Usage;
};

export const AppSidebar = ({
  appName,
  billingEnabled,
  conversations,
  usage,
}: AppSidebarProps) => {
  const pathname = usePathname();
  const { user } = useUser();
  const { isMobile, state } = useSidebar();
  const isBrowser = useIsBrowser();
  const conversationGroups = isBrowser
    ? groupConversationsByDate(conversations, new Date())
    : [];
  const accountName = user?.fullName ?? user?.firstName ?? "Signed in";
  const accountEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={styles.header}>
        <Link href={routes.appHome} className={styles.brand}>
          <span aria-hidden className={styles.brandMark}>
            B
          </span>
          <span className={styles.brandLabel}>{appName}</span>
        </Link>
        {!isMobile && state === "expanded" && (
          <SidebarTrigger className={styles.desktopSidebarTrigger} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === routes.conversations.new}
                  render={<Link href={routes.conversations.new} />}
                  tooltip="New Conversation"
                >
                  <SquarePenIcon />
                  <span>New Conversation</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === routes.library}
                  render={<Link href={routes.library} />}
                  tooltip="Library"
                >
                  <LibraryIcon />
                  <span>Library</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>
                  {usage.activeSources} of {usage.sourceLimit}
                </SidebarMenuBadge>
              </SidebarMenuItem>
              {billingEnabled && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === routes.settings.billing}
                    render={<Link href={routes.settings.billing} />}
                    tooltip="Billing"
                  >
                    <CreditCardIcon />
                    <span>Billing</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <nav aria-label="Conversations" className={styles.conversations}>
          {conversationGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.conversations.map((conversation) => {
                    const href = routes.conversations.detail(conversation.id);

                    return (
                      <SidebarMenuItem key={conversation.id}>
                        <SidebarMenuButton
                          isActive={pathname === href}
                          render={<Link href={href} />}
                        >
                          <span className={styles.conversationTitle}>
                            {conversation.title}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <div className={styles.account}>
          <UserButton
            userProfileMode="navigation"
            userProfileUrl={routes.settings.account}
          />
          <div className={styles.accountContent}>
            <p className={styles.accountLabel}>{accountName}</p>
            {accountEmail && (
              <p className={styles.accountEmail}>{accountEmail}</p>
            )}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
