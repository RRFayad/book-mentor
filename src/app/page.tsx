import {
  CheckIcon,
  LayersIcon,
  RocketIcon,
  SparklesIcon,
  StarIcon,
  ZapIcon,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { IntegrationsBeam } from "@/components/marketing/integrations-beam";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { AnimatedGradientText } from "@/components/velora/animated-gradient-text";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { AvatarCircles } from "@/components/velora/avatar-circles";
import { BlurFade } from "@/components/velora/blur-fade";
import { GridPattern } from "@/components/velora/grid-pattern";
import { NumberTicker } from "@/components/velora/number-ticker";
import { Particles } from "@/components/velora/particles";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { ShimmerButton } from "@/components/velora/shimmer-button";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { TextReveal } from "@/components/velora/text-reveal";
import { TiltCard } from "@/components/velora/tilt-card";
import { Typewriter } from "@/components/velora/typewriter";
import { siteConfig } from "@/lib/site-config";
import { featureFlags } from "@/lib/feature-flags";
import { routes } from "@/lib/routes";
import { getAvailableStripePlans } from "@/lib/stripe/config";
import { tw } from "@/lib/utils";

const stats = [
  { value: 8, suffix: "h", prefix: "", label: "saved with payments" },
  { value: 4, suffix: "h", prefix: "", label: "saved with login" },
  { value: 4, suffix: "h", prefix: "", label: "saved with database" },
  { value: 2, suffix: "h", prefix: "", label: "saved with styling" },
];

const testimonials = [
  {
    quote: "Add some customer review here",
    name: "Customer Name",
    role: "Customer role, Company",
  },
  {
    quote: "Add some customer review here",
    name: "Customer Name",
    role: "Customer role, Company",
  },
  {
    quote: "Add some customer review here",
    name: "Customer Name",
    role: "Customer role, Company",
  },
  {
    quote: "Add some customer review here",
    name: "Customer Name",
    role: "Customer role, Company",
  },
  {
    quote: "Add some customer review here",
    name: "Customer Name",
    role: "Customer role, Company",
  },
  {
    quote: "Add some customer review here",
    name: "Customer Name",
    role: "Customer role, Company",
  },
];

const faqs = [
  {
    q: "What is included in the starter?",
    a: "Authentication, user synchronization, subscriptions, authorization, billing management, PostgreSQL persistence, a FastAPI backend, and a responsive SaaS UI — already integrated and ready to extend.",
  },
  {
    q: "Why Next.js and FastAPI?",
    a: "Next.js handles the web application and SaaS infrastructure, while FastAPI provides a dedicated Python backend for product and domain logic. This keeps the stack flexible and provides a natural foundation for Python-based AI applications.",
  },
  {
    q: "How does authentication work?",
    a: "Clerk handles authentication and user management. Clerk webhooks synchronize users with PostgreSQL, and authenticated requests to FastAPI are validated using Clerk tokens.",
  },
  {
    q: "How are subscriptions handled?",
    a: "Stripe handles Checkout and billing, while webhooks synchronize the current subscription state with PostgreSQL. The application uses that local state for authorization instead of querying Stripe on every request.",
  },
  {
    q: "Can I use it for AI applications?",
    a: "Yes. The FastAPI backend provides a natural place for Python-based AI and product logic. AI-specific infrastructure such as LangChain, LangGraph, conversations, streaming, and usage tracking is planned separately rather than being bundled into the core SaaS foundation.",
  },
];

const styles = {
  page: tw("relative"),
  section: tw("relative py-16 lg:py-24"),
  content: tw("mx-auto max-w-6xl px-4 lg:px-8"),
  sectionHeading: tw(
    "mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance lg:text-5xl",
  ),
  sectionDescription: tw(
    "mx-auto mt-4 max-w-xl text-center text-muted-foreground",
  ),
  accent: tw("text-primary"),
  featureCheck: tw(
    "flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary",
  ),
  featureCheckIcon: tw("size-3"),
  hero: {
    section: tw("relative overflow-hidden pt-40 pb-24 lg:pt-48 lg:pb-28"),
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
      "mx-auto mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-balance lg:text-7xl",
    ),
    description: tw(
      "mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground",
    ),
    actions: tw("mt-10 flex flex-wrap items-center justify-center gap-4"),
    actionIcon: tw("size-4"),
    socialProof: tw(
      "mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row",
    ),
    socialProofContent: tw("flex flex-col items-center gap-0.5 sm:items-start"),
    socialProofStars: tw("flex gap-0.5 text-amber-400"),
    socialProofStar: tw("size-4 fill-current"),
    socialProofText: tw("text-sm text-muted-foreground"),
    mockup: tw("mt-20"),
    stats: tw("mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 lg:grid-cols-4"),
    stat: tw("flex flex-col items-center gap-1"),
    statValue: tw("text-4xl font-semibold tracking-tight"),
    statLabel: tw("text-sm text-muted-foreground"),
  },
  integrations: {
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
  cards: {
    grid: tw("grid gap-6 md:grid-cols-3"),
    card: tw("h-full p-8"),
    icon: tw("size-6"),
    iconContainer: tw("mb-4 w-fit rounded-xl bg-primary/10 p-3 text-primary"),
    title: tw("text-lg font-semibold"),
    description: tw("mt-2 text-sm text-muted-foreground"),
  },
  testimonials: {
    grid: tw("mt-16 columns-1 gap-6 *:mb-6 md:columns-2 lg:columns-3"),
    item: tw("break-inside-avoid"),
    card: tw("rounded-2xl border bg-card p-6"),
    stars: tw("flex gap-0.5 text-amber-400"),
    star: tw("size-3.5 fill-current"),
    quote: tw("mt-4 text-sm text-card-foreground"),
    figcaption: tw("mt-4 flex items-center gap-3"),
    avatar: tw("[&>span]:size-8 [&>span]:text-[10px]"),
    name: tw("text-sm font-medium"),
    role: tw("text-xs text-muted-foreground"),
  },
  faq: {
    section: tw("py-16 lg:py-24"),
    container: tw("mx-auto max-w-3xl px-4 lg:px-8"),
    heading: tw(
      "text-center text-3xl font-semibold tracking-tight lg:text-4xl",
    ),
    accordion: tw("mt-12"),
    trigger: tw("text-left text-base"),
    answer: tw("text-muted-foreground"),
  },
  callToAction: {
    section: tw("relative overflow-hidden py-16 lg:py-24"),
    content: tw("relative mx-auto max-w-4xl px-4 text-center lg:px-8"),
    heading: tw(
      "text-4xl font-semibold tracking-tight text-balance lg:text-6xl",
    ),
    description: tw("mx-auto mt-6 max-w-xl text-lg text-muted-foreground"),
    action: tw("mt-10"),
    button: tw("h-14 px-10 text-base"),
    buttonIcon: tw("size-5"),
  },
};

const LandingPage = async () => {
  if (!featureFlags.landingPageEnabled) {
    redirect(routes.workspace.overview);
  }

  const { userId } = await auth();

  if (userId) {
    redirect(routes.workspace.overview);
  }

  const availablePlans = featureFlags.billingEnabled
    ? getAvailableStripePlans()
    : [];

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
            <BlurFade delay={0} direction="down">
              <span className={styles.hero.badge}>
                <SparklesIcon className={styles.hero.badgeIcon} />
                <span className={styles.hero.badgeText}>
                  Full-Stack SaaS Starter Kit
                </span>
              </span>
            </BlurFade>

            <h1 className={styles.hero.title}>
              <TextReveal text="Everything you need to build your SaaS." />{" "}
              <br />
              <TextReveal text="Build" />{" "}
              <AnimatedGradientText>
                <Typewriter words={["faster.", "smarter.", "better."]} />
              </AnimatedGradientText>
            </h1>

            <BlurFade delay={0.35}>
              <p className={styles.hero.description}>
                A production-ready foundation with Next.js, FastAPI, PostgreSQL,
                Clerk, and Stripe — authentication, subscriptions, database
                synchronization, and backend integration already set up.
              </p>
            </BlurFade>

            <BlurFade delay={0.5}>
              <div className={styles.hero.actions}>
                <form action={routes.workspace.overview}>
                  <ShimmerButton type="submit">
                    <RocketIcon className={styles.hero.actionIcon} />
                    View Live Demo
                  </ShimmerButton>
                </form>
                {siteConfig.github && (
                  <Button variant="ghost" size="lg" asChild>
                    <a href={siteConfig.github} rel="noopener" target="_blank">
                      View on Github
                    </a>
                  </Button>
                )}
              </div>
            </BlurFade>

            <BlurFade delay={0.6}>
              <div className={styles.hero.socialProof}>
                <AvatarCircles
                  people={[
                    "Maya Chen",
                    "Tom Okafor",
                    "Sofia Lindqvist",
                    "Dan Romero",
                    "Aisha Patel",
                  ]}
                  extra={100}
                />
                <div className={styles.hero.socialProofContent}>
                  <span className={styles.hero.socialProofStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={styles.hero.socialProofStar}
                      />
                    ))}
                  </span>
                  <span className={styles.hero.socialProofText}>
                    Social proof disclaimer
                  </span>
                </div>
              </div>
            </BlurFade>

            {/* Product mockup */}
            <BlurFade delay={0.75} offset={32}>
              <HeroMockup className={styles.hero.mockup} />
            </BlurFade>

            {/* Stats */}
            <div className={styles.hero.stats}>
              {stats.map((stat, i) => (
                <BlurFade key={stat.label} delay={i * 0.1}>
                  <div className={styles.hero.stat}>
                    <span className={styles.hero.statValue}>
                      <NumberTicker
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </span>
                    <span className={styles.hero.statLabel}>{stat.label}</span>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations beam */}
        <section className={styles.section}>
          <div className={styles.integrations.content}>
            <BlurFade direction="right">
              <div>
                <span className={styles.integrations.eyebrow}>
                  Full-stack foundation
                </span>
                <h2 className={styles.integrations.title}>
                  Your SaaS infrastructure,{" "}
                  <span className={styles.accent}>already connected.</span>
                </h2>
                <p className={styles.integrations.description}>
                  Skip the repetitive setup. Authentication, billing,
                  persistence, and your application backend are already
                  integrated — so you can focus on building the product.
                </p>
                <ul className={styles.integrations.list}>
                  {[
                    "Authentication ready — Clerk auth synchronized with PostgreSQL.",
                    "Billing built in — Stripe subscriptions, webhooks, and Customer Portal.",
                    "Python backend — FastAPI connected to Next.js and PostgreSQL.",
                    "Database ready — PostgreSQL with Drizzle and SQLAlchemy.",
                    "Modern UI — shadcn/ui,  Velora components and Tailwind CSS.",
                    "AI-ready architecture — Python foundation ready for your AI stack.",
                  ].map((item) => (
                    <li key={item} className={styles.integrations.listItem}>
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

        {/* Spotlight cards */}
        <section className={styles.section}>
          <div className={styles.content}>
            <div className={styles.cards.grid}>
              {[
                {
                  icon: <RocketIcon className={styles.cards.icon} />,
                  title: "Built for real SaaS",
                  body: "Authentication, subscriptions, authorization, webhooks, and user synchronization — implemented as real production flows, not mocked examples.",
                },
                {
                  icon: <LayersIcon className={styles.cards.icon} />,
                  title: "Full-stack by design",
                  body: "Next.js owns the SaaS layer. FastAPI owns your product logic. Both share PostgreSQL with clear domain boundaries.",
                },
                {
                  icon: <ZapIcon className={styles.cards.icon} />,
                  title: "Made to be cloned",
                  body: "Standard technologies, minimal abstractions, and a focused foundation designed to become your next product — not another framework to learn.",
                },
              ].map((card, i) => (
                <BlurFade key={card.title} delay={i * 0.12}>
                  <SpotlightCard className={styles.cards.card}>
                    <div className={styles.cards.iconContainer}>
                      {card.icon}
                    </div>
                    <h3 className={styles.cards.title}>{card.title}</h3>
                    <p className={styles.cards.description}>{card.body}</p>
                  </SpotlightCard>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className={styles.section}>
          <div className={styles.content}>
            <BlurFade>
              <h2 className={styles.sectionHeading}>
                What customers <span className={styles.accent}>are saying</span>
              </h2>
              <p className={styles.sectionDescription}>
                A ready-to-customize testimonial section for customer stories,
                reviews, and social proof.
              </p>
            </BlurFade>
            <div className={styles.testimonials.grid}>
              {testimonials.map((t, i) => (
                <BlurFade
                  key={`${i}_${t.name}`}
                  delay={(i % 3) * 0.1}
                  className={styles.testimonials.item}
                >
                  <TiltCard>
                    <figure className={styles.testimonials.card}>
                      <span className={styles.testimonials.stars}>
                        {Array.from({ length: 5 }).map((_, s) => (
                          <StarIcon
                            key={s}
                            className={styles.testimonials.star}
                          />
                        ))}
                      </span>
                      <blockquote className={styles.testimonials.quote}>
                        “{t.quote}”
                      </blockquote>
                      <figcaption className={styles.testimonials.figcaption}>
                        <AvatarCircles
                          people={[t.name]}
                          className={styles.testimonials.avatar}
                        />
                        <div>
                          <p className={styles.testimonials.name}>{t.name}</p>
                          <p className={styles.testimonials.role}>{t.role}</p>
                        </div>
                      </figcaption>
                    </figure>
                  </TiltCard>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {featureFlags.billingEnabled && (
          <section id="pricing" className={styles.section}>
            <div className={styles.content}>
              <BlurFade>
                <h2 className={styles.sectionHeading}>
                  Plans built for{" "}
                  <span className={styles.accent}>your product.</span>
                </h2>
                <p className={styles.sectionDescription}>
                  Customizable plans already wired to real Stripe data -
                  Checkout, webhooks, subscription synchronization, and billing
                  management.{" "}
                </p>
              </BlurFade>

              <PricingCards plans={availablePlans} />
            </div>
          </section>
        )}

        {/* FAQ */}
        <section id="faq" className={styles.faq.section}>
          <div className={styles.faq.container}>
            <BlurFade>
              <h2 className={styles.faq.heading}>Frequently asked questions</h2>
            </BlurFade>
            <BlurFade delay={0.15}>
              <Accordion
                type="single"
                collapsible
                className={styles.faq.accordion}
              >
                {faqs.map((faq) => (
                  <AccordionItem key={faq.q} value={faq.q}>
                    <AccordionTrigger className={styles.faq.trigger}>
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className={styles.faq.answer}>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </BlurFade>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.callToAction.section}>
          <AuroraBackground intensity="subtle" />
          <Particles quantity={50} />
          <div className={styles.callToAction.content}>
            <BlurFade>
              <h2 className={styles.callToAction.heading}>
                Start with the foundation.{" "}
                <span className={styles.accent}>Focus on what matters.</span>
              </h2>
              <p className={styles.callToAction.description}>
                Skip the repetitive SaaS setup and start with authentication,
                billing, persistence, and backend integration already connected.
              </p>
              <div className={styles.callToAction.action}>
                <form action={routes.workspace.overview}>
                  <ShimmerButton
                    className={styles.callToAction.button}
                    type="submit"
                  >
                    <RocketIcon className={styles.callToAction.buttonIcon} />
                    View Live Demo
                  </ShimmerButton>
                </form>
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
