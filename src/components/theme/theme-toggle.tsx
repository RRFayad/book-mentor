"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { tw } from "@/lib/utils";

const styles = {
  sunIcon: tw("hidden dark:block"),
  moonIcon: tw("dark:hidden"),
};

/**
 * Renders both icons and lets CSS pick one, so server and client
 * markup match without a mounted guard.
 */
export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className={styles.sunIcon} />
      <MoonIcon className={styles.moonIcon} />
    </Button>
  );
};
