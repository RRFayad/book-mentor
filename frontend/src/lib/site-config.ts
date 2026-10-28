import { getEnvVar } from "@/lib/utils";

export const siteConfig = {
  name: "Book Mentor",
  url: getEnvVar("FRONTEND_URL").replace(/\/$/, ""),
  github: getEnvVar("NEXT_PUBLIC_GITHUB_URL", false) ?? "",
  tagline: "Have deep conversations with the content you own",
} as const;
