import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/toaster";
import { siteConfig } from "@/lib/site-config";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { tw } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const styles = {
  html: tw(`${geistSans.variable} ${geistMono.variable} h-full antialiased`),
  body: tw("flex min-h-full flex-col"),
};

export const metadata: Metadata = {
  title: siteConfig.name,
  description: "A full-stack foundation for modern SaaS products.",
  icons: {
    icon: "/icon.svg",
  },
};

const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <html lang="en" suppressHydrationWarning className={styles.html}>
      <body className={styles.body}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
};

export default RootLayout;
