import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/subscribed/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { listConversations } from "@/lib/backend/conversations";
import { getUsage } from "@/lib/backend/usage";
import { featureFlags } from "@/lib/feature-flags";
import { siteConfig } from "@/lib/site-config";
import { requireCurrentUserSubscriptionPlan } from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";
import { tw } from "@/lib/utils";

type SubscribedLayoutProps = {
  children: ReactNode;
};

const styles = {
  inset: tw("min-h-svh"),
  content: tw("flex-1 bg-muted/70 p-4 lg:p-6 dark:bg-background"),
};

const SubscribedLayout = async ({ children }: SubscribedLayoutProps) => {
  await requireCurrentUserSubscriptionPlan(SubscriptionPlan.Basic);

  const [conversations, usage] = await Promise.all([
    listConversations(),
    getUsage(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar
        appName={siteConfig.name}
        billingEnabled={featureFlags.billingEnabled}
        conversations={conversations}
        usage={usage}
      />
      <SidebarInset className={styles.inset}>
        <AppHeader github={siteConfig.github} />
        <div className={styles.content}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SubscribedLayout;
