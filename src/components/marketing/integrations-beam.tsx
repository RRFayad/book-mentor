"use client";

import { useRef, type Ref } from "react";
import {
  BoxIcon,
  CloudIcon,
  CodeIcon,
  DatabaseIcon,
  MailIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";

import { AnimatedBeam } from "@/components/velora/animated-beam";
import { cn, tw } from "@/lib/utils";

const styles = {
  node: tw(
    "z-10 flex size-13 items-center justify-center rounded-full border bg-card shadow-lg [&_svg]:size-5",
  ),
  container: tw(
    "relative flex h-96 w-full items-center justify-between px-2 sm:px-8",
  ),
  nodeColumn: tw("flex h-full flex-col justify-between py-6"),
  mutedIcon: tw("text-muted-foreground"),
  centerNode: tw(
    "size-18 border-primary/40 bg-primary/10 shadow-primary/20 [&_svg]:size-8",
  ),
  primaryIcon: tw("text-primary"),
};

const Node = ({
  ref,
  className,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div ref={ref} className={cn(styles.node, className)}>
      {children}
    </div>
  );
};

/**
 * Six service nodes beaming into a central hub — the classic
 * integrations diagram, built from <AnimatedBeam />.
 */
export const IntegrationsBeam = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const left1 = useRef<HTMLDivElement>(null);
  const left2 = useRef<HTMLDivElement>(null);
  const left3 = useRef<HTMLDivElement>(null);
  const right1 = useRef<HTMLDivElement>(null);
  const right2 = useRef<HTMLDivElement>(null);
  const right3 = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={cn(styles.container, className)}>
      <div className={styles.nodeColumn}>
        <Node ref={left1}>
          <DatabaseIcon className={styles.mutedIcon} />
        </Node>
        <Node ref={left2}>
          <CodeIcon className={styles.mutedIcon} />
        </Node>
        <Node ref={left3}>
          <CloudIcon className={styles.mutedIcon} />
        </Node>
      </div>

      <Node ref={centerRef} className={styles.centerNode}>
        <SparklesIcon className={styles.primaryIcon} />
      </Node>

      <div className={styles.nodeColumn}>
        <Node ref={right1}>
          <MailIcon className={styles.mutedIcon} />
        </Node>
        <Node ref={right2}>
          <WalletIcon className={styles.mutedIcon} />
        </Node>
        <Node ref={right3}>
          <BoxIcon className={styles.mutedIcon} />
        </Node>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={left1}
        toRef={centerRef}
        curvature={-60}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={left2}
        toRef={centerRef}
        delay={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={left3}
        toRef={centerRef}
        curvature={60}
        delay={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={right1}
        toRef={centerRef}
        curvature={-60}
        reverse
        delay={0.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={right2}
        toRef={centerRef}
        reverse
        delay={1.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={right3}
        toRef={centerRef}
        curvature={60}
        reverse
        delay={2.5}
      />
    </div>
  );
};
