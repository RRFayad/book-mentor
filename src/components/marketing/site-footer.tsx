import Link from "next/link";

import { routes } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";
import { tw } from "@/lib/utils";

const groups = [
  ...(siteConfig.github
    ? [
        {
          title: "Resources",
          links: [
            { text: "GitHub", href: siteConfig.github },
            {
              text: "README",
              href: `${siteConfig.github}/blob/main/README.md`,
            },
          ],
        },
      ]
    : []),
];

const styles = {
  footer: tw("border-t border-border/40 py-14"),
  content: tw("mx-auto grid max-w-6xl gap-10 px-4 lg:px-8"),
  contentWithResources: tw("md:grid-cols-[1.6fr_1fr]"),
  brand: tw("font-semibold"),
  description: tw("mt-3 max-w-xs text-sm text-muted-foreground"),
  navigation: tw("md:justify-self-end"),
  groupTitle: tw("text-sm font-semibold"),
  links: tw("mt-4 space-y-2.5 text-sm text-muted-foreground"),
  link: tw("transition-colors hover:text-foreground"),
  footerBar: tw(
    "mx-auto mt-12 flex max-w-6xl flex-col items-center gap-2 border-t border-border/40 px-4 pt-6 text-xs text-muted-foreground md:flex-row md:justify-end lg:px-8",
  ),
};

export const SiteFooter = () => {
  const contentStyles = siteConfig.github
    ? `${styles.content} ${styles.contentWithResources}`
    : styles.content;

  return (
    <footer className={styles.footer}>
      <div className={contentStyles}>
        <div>
          <Link href={routes.home} className={styles.brand}>
            {siteConfig.name}
          </Link>
          <p className={styles.description}>
            A full-stack foundation for building and shipping modern SaaS
            products.
          </p>
        </div>
        {groups.map((group) => (
          <nav
            key={group.title}
            aria-label={group.title}
            className={styles.navigation}
          >
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <ul className={styles.links}>
              {group.links.map((link) => (
                <li key={link.text}>
                  <a href={link.href} rel="noopener" className={styles.link}>
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={styles.footerBar}>
        <span>© 2026 Renan Fayad</span>
      </div>
    </footer>
  );
};
