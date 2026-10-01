import { getEnvVar } from "@/lib/utils";

export const siteConfig = {
  name: "SaaS Starter Kit",
  url: getEnvVar("FRONTEND_URL").replace(/\/$/, ""),
  github: getEnvVar("NEXT_PUBLIC_GITHUB_URL", false) ?? "",
  tagline: "A full-stack foundation for modern SaaS products",
} as const;
