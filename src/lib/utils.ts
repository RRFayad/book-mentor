import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export {
  capitalize,
  getBooleanEnvVar,
  getEnvVar,
  getErrorMessageAndThrow,
} from "@app/shared/utils";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

// Identity helper that marks application class strings for Prettier sorting.
export const tw = (classes: string): string => classes;
