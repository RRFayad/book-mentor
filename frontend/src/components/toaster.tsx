"use client";

import type { CSSProperties } from "react";
import {
  CircleCheckIcon,
  CircleXIcon,
  TriangleAlertIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { Toaster as SonnerToaster, toast } from "sonner";

import { cn, tw } from "@/lib/utils";

export type ToastType = "success" | "warning" | "error";

type ShowToastOptions = {
  type: ToastType;
  title: string;
  message?: string;
};

type ToastCardProps = ShowToastOptions & {
  id: string | number;
};

const icons: Record<ToastType, LucideIcon> = {
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  error: CircleXIcon,
};

const styles = {
  toast: tw(
    "flex w-full items-start gap-2.5 rounded-lg border py-3.5 pr-3 pl-4 shadow-md",
  ),
  icon: tw("mt-px size-4.5 shrink-0"),
  content: tw("flex min-w-0 flex-1 flex-col gap-0.5"),
  title: tw("text-sm leading-5 font-medium"),
  message: tw("text-[0.8125rem] leading-[1.125rem] opacity-90"),
  close: tw(
    "-mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current/40",
  ),
  closeIcon: tw("size-3.5"),
  types: {
    success: {
      toast: tw("border-success-border bg-success-surface text-success-text"),
      icon: tw("text-success"),
    },
    warning: {
      toast: tw("border-warning-border bg-warning-surface text-warning-text"),
      icon: tw("text-warning"),
    },
    error: {
      toast: tw(
        "border-destructive-border bg-destructive-surface text-destructive-text",
      ),
      icon: tw("text-destructive"),
    },
  },
};

const ToastCard = ({ id, type, title, message }: ToastCardProps) => {
  const Icon = icons[type];

  return (
    <div className={cn(styles.toast, styles.types[type].toast)}>
      <Icon className={cn(styles.icon, styles.types[type].icon)} />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        className={styles.close}
        onClick={() => toast.dismiss(id)}
      >
        <XIcon className={styles.closeIcon} />
      </button>
    </div>
  );
};

export const showToast = (options: ShowToastOptions) =>
  toast.custom((id) => <ToastCard id={id} {...options} />);

// Width applies above Sonner's 600px mobile breakpoint; below it toasts span
// the screen. Offsets place toasts 16px below the 56px app header, aligned
// with the header's right padding.
const toasterStyle = { "--width": "420px" } as CSSProperties;

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      visibleToasts={1}
      style={toasterStyle}
      offset={{ top: 72, right: 24 }}
      mobileOffset={{ top: 72, left: 16, right: 16 }}
    />
  );
};
