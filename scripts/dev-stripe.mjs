// Runs the Stripe webhook listener during `npm run dev`, only when billing is
// enabled in frontend/.env.local. With billing off it exits right away, so projects
// without billing don't need the Stripe CLI.
import { spawn } from "node:child_process";

try {
  process.loadEnvFile("frontend/.env.local");
} catch {
  // No frontend/.env.local: billing counts as disabled.
}

if (process.env.BILLING_ENABLED !== "true") {
  console.log(
    "Billing is disabled (BILLING_ENABLED), so the Stripe listener is skipped.",
  );
  process.exit(0);
}

const listener = spawn("npm", ["run", "stripe:listen"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

listener.on("exit", (code) => process.exit(code ?? 0));
