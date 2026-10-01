import type { ReactNode } from "react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

type MarketingLayoutProps = {
  children: ReactNode;
};

const MarketingLayout = ({ children }: MarketingLayoutProps) => {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
};

export default MarketingLayout;
