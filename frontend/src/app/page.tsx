import {
  BookOpenIcon,
  CheckIcon,
  ClipboardListIcon,
  CodeIcon,
  LayersIcon,
  ListChecksIcon,
  PaletteIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { IntegrationsBeam } from "@/components/marketing/integrations-beam";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { AnimatedGradientText } from "@/components/velora/animated-gradient-text";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { BlurFade } from "@/components/velora/blur-fade";
import { GridPattern } from "@/components/velora/grid-pattern";
import { Particles } from "@/components/velora/particles";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { ShimmerButton } from "@/components/velora/shimmer-button";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { TextReveal } from "@/components/velora/text-reveal";
import { Typewriter } from "@/components/velora/typewriter";
import { siteConfig } from "@/lib/site-config";
import { featureFlags } from "@/lib/feature-flags";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";

const DESIGN_CANVAS_URL = "https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4";
const LINKEDIN_URL = "https://www.linkedin.com/in/rfayad/";

const repoLink = (path: string) => `${siteConfig.github}/blob/main/${path}`;

const MENTOR_FEATURES = [
  "Cited by design: only the book's passages are cited, enforced in code.",
  "Honest: says plainly when the book doesn't cover something.",
  "Corrective retries: not covered? It searches again with new queries.",
  "Knows the whole book: section Notes and a One Page summary steer the search.",
  "Follow-up questions: remembers the last 3 questions and answers.",
  "Exact search per book: PostgreSQL + pgvector, no approximate-index misses.",
];

const ROLES = [
  {
    icon: ClipboardListIcon,
    title: "Product",
    body: "Requirements from a product grill, a domain glossary, and a v1 / v1.1 / v2 cut.",
    href: repoLink("docs/v1-product.md"),
  },
  {
    icon: PaletteIcon,
    title: "Design",
    body: "A design canvas for the chat and sidebar, translated into theme tokens for light and dark.",
    href: DESIGN_CANVAS_URL,
  },
  {
    icon: ListChecksIcon,
    title: "Project management",
    body: "GitHub issues as vertical slices with blocking edges; the scope cut recorded on the tickets.",
    href: `${siteConfig.github}/issues?q=is%3Aissue`,
  },
  {
    icon: LayersIcon,
    title: "Architecture",
    body: "Decision records, an API contract, a data model, and the retrieval design.",
    href: `${siteConfig.github}/tree/main/docs/adr`,
  },
  {
    icon: CodeIcon,
    title: "Code",
    body: "A Next.js chat app, a Fastify API, and a LangGraph Mentor in one typed monorepo.",
    href: siteConfig.github,
  },
  {
    icon: ShieldCheckIcon,
    title: "QA",
    body: "API tests on a real Postgres, CI on every pull request, and an eval set for answer quality.",
    href: repoLink("docs/retrieval.md"),
  },
];

const styles = {
  page: tw("relative"),
  section: tw("relative py-16 lg:py-24"),
  teamSection: tw("relative pt-4 pb-16 lg:pt-8 lg:pb-24"),
  content: tw("mx-auto max-w-6xl px-4 lg:px-8"),
  sectionHeading: tw(
    "mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance lg:text-5xl",
  ),
  sectionDescription: tw(
    "mx-auto mt-4 max-w-xl text-center text-muted-foreground",
  ),
  accent: tw("text-primary"),
  featureCheck: tw(
    "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary",
  ),
  featureCheckIcon: tw("size-3"),
  hero: {
    section: tw("relative overflow-hidden pt-28 pb-24 lg:pt-36 lg:pb-28"),
    gridPattern: tw(
      "mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)] fill-transparent stroke-border/60",
    ),
    content: tw("relative mx-auto max-w-6xl px-4 text-center lg:px-8"),
    badge: tw(
      "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm backdrop-blur",
    ),
    badgeIcon: tw("size-3.5 text-primary"),
    badgeText: tw("font-medium"),
    title: tw(
      "mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-balance lg:text-7xl",
    ),
    description: tw(
      "mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground",
    ),
    actions: tw("mt-10 flex flex-wrap items-center justify-center gap-4"),
    actionIcon: tw("size-4"),
    note: tw(
      "mt-8 inline-flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
    ),
    noteIcon: tw("size-4 text-primary"),
    demo: tw(
      "mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10",
    ),
    demoImage: tw("h-auto w-full"),
  },
  mentor: {
    content: tw(
      "mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2 lg:gap-20 lg:px-8",
    ),
    eyebrow: tw("text-sm font-medium text-primary"),
    title: tw(
      "mt-3 text-3xl font-semibold tracking-tight text-balance lg:text-4xl",
    ),
    description: tw("mt-4 text-muted-foreground"),
    list: tw("mt-6 space-y-3 text-sm"),
    listItem: tw("flex items-center gap-3"),
  },
  roles: {
    grid: tw("mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"),
    link: tw("block h-full"),
    card: tw("h-full p-8"),
    icon: tw("size-6"),
    iconContainer: tw("mb-4 w-fit rounded-xl bg-primary/10 p-3 text-primary"),
    title: tw("text-lg font-semibold"),
    description: tw("mt-2 text-sm text-muted-foreground"),
    open: tw("mt-4 text-sm font-medium text-primary"),
  },
  callToAction: {
    section: tw("relative overflow-hidden py-16 lg:py-24"),
    content: tw("relative mx-auto max-w-4xl px-4 text-center lg:px-8"),
    heading: tw(
      "text-4xl font-semibold tracking-tight text-balance lg:text-6xl",
    ),
    description: tw("mx-auto mt-6 max-w-xl text-lg text-muted-foreground"),
    actions: tw("mt-10 flex flex-wrap items-center justify-center gap-4"),
    button: tw("h-14 px-10 text-base"),
    buttonIcon: tw("size-5"),
  },
};

const LandingPage = async () => {
  if (!featureFlags.landingPageEnabled) {
    redirect(routes.appHome);
  }

  const { userId } = await auth();

  if (userId) {
    redirect(routes.appHome);
  }

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <ScrollProgress />

        {/* Hero */}
        <section className={styles.hero.section}>
          <AuroraBackground intensity="subtle" />
          <GridPattern
            width={48}
            height={48}
            className={styles.hero.gridPattern}
          />
          <div className={styles.hero.content}>
            <h1 className={styles.hero.title}>
              <TextReveal text="Answers that are" />{" "}
              <AnimatedGradientText>
                <Typewriter words={["cited.", "grounded.", "verifiable."]} />
              </AnimatedGradientText>
            </h1>

            <BlurFade delay={0.35}>
              <p className={styles.hero.description}>
                A Retrieval-Augmented Generation (RAG) agent built with
                LangGraph: it searches your book, answers only from what it
                finds, cites the exact passage, and searches again when it
                misses.
              </p>
            </BlurFade>

            <BlurFade delay={0.5}>
              <div className={styles.hero.actions}>
                <form action={routes.signUp}>
                  <input type="hidden" name="demo" value="1" />
                  <ShimmerButton type="submit">
                    <RocketIcon className={styles.hero.actionIcon} />
                    Try the Live Demo
                  </ShimmerButton>
                </form>
                {siteConfig.github && (
                  <Button variant="ghost" size="lg" asChild>
                    <a href={siteConfig.github} rel="noopener" target="_blank">
                      View on GitHub
                    </a>
                  </Button>
                )}
              </div>
            </BlurFade>

            <BlurFade delay={0.6}>
              <Link
                href={`${routes.signUp}?demo=1`}
                className={styles.hero.note}
              >
                <BookOpenIcon className={styles.hero.noteIcon} />
                Try it with a demo account: no real email needed, the Shared
                Library is ready to ask
              </Link>
            </BlurFade>

            <BlurFade delay={0.75} offset={32}>
              <div className={styles.hero.demo}>
                <Image
                  src="/how-to-use.gif"
                  alt="Selecting Meditations, asking a question, and opening a Citation"
                  width={1280}
                  height={596}
                  unoptimized
                  priority
                  className={styles.hero.demoImage}
                />
              </div>
            </BlurFade>
          </div>
        </section>

        {/* The Mentor */}
        <section className={styles.section}>
          <div className={styles.mentor.content}>
            <BlurFade direction="right">
              <div>
                <span className={styles.mentor.eyebrow}>The Mentor</span>
                <h2 className={styles.mentor.title}>
                  Answers from the book.{" "}
                  <span className={styles.accent}>Never beyond it.</span>
                </h2>
                <p className={styles.mentor.description}>
                  A LangGraph agent writes searches in the book&apos;s own
                  words, retrieves passages, and answers only from them, then
                  searches again when it misses.
                </p>
                <ul className={styles.mentor.list}>
                  {MENTOR_FEATURES.map((item) => (
                    <li key={item} className={styles.mentor.listItem}>
                      <span className={styles.featureCheck}>
                        <CheckIcon className={styles.featureCheckIcon} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </BlurFade>
            <BlurFade direction="left" delay={0.15}>
              <IntegrationsBeam />
            </BlurFade>
          </div>
        </section>

        {/* One person, the whole tech team */}
        <section className={styles.teamSection}>
          <div className={styles.content}>
            <BlurFade>
              <h2 className={styles.sectionHeading}>
                One person.{" "}
                <span className={styles.accent}>The whole tech team.</span>
              </h2>
              <p className={styles.sectionDescription}>
                Every role left an artifact behind. Open any of them.
              </p>
            </BlurFade>
            <div className={styles.roles.grid}>
              {ROLES.map((role, i) => (
                <BlurFade key={role.title} delay={(i % 3) * 0.12}>
                  <a
                    href={role.href}
                    rel="noopener"
                    target="_blank"
                    className={styles.roles.link}
                  >
                    <SpotlightCard className={styles.roles.card}>
                      <div className={styles.roles.iconContainer}>
                        <role.icon className={styles.roles.icon} />
                      </div>
                      <h3 className={styles.roles.title}>{role.title}</h3>
                      <p className={styles.roles.description}>{role.body}</p>
                      <p className={styles.roles.open}>Open →</p>
                    </SpotlightCard>
                  </a>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.callToAction.section}>
          <AuroraBackground intensity="subtle" />
          <Particles quantity={50} />
          <div className={styles.callToAction.content}>
            <BlurFade>
              <h2 className={styles.callToAction.heading}>
                Built by Renan Fayad.{" "}
                <span className={styles.accent}>Let&apos;s talk.</span>
              </h2>
              <p className={styles.callToAction.description}>
                Frontend / Full Stack Engineer building AI applications across
                TypeScript and Python. Open to Full Stack AI Engineer roles.
              </p>
              <div className={styles.callToAction.actions}>
                <form action={routes.signUp}>
                  <input type="hidden" name="demo" value="1" />
                  <ShimmerButton
                    className={styles.callToAction.button}
                    type="submit"
                  >
                    <RocketIcon className={styles.callToAction.buttonIcon} />
                    Try the Live Demo
                  </ShimmerButton>
                </form>
                <Button
                  variant="outline"
                  size="lg"
                  className={styles.callToAction.button}
                  asChild
                >
                  <a href={LINKEDIN_URL} rel="noopener" target="_blank">
                    LinkedIn
                  </a>
                </Button>
              </div>
            </BlurFade>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
};

export default LandingPage;
