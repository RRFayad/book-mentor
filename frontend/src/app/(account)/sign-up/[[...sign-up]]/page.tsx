import { randomUUID } from "node:crypto";
import { ClerkLoaded, SignUp } from "@clerk/nextjs";

import { BlurFade } from "@/components/velora/blur-fade";
import { tw } from "@/lib/utils";
import { routes } from "@/lib/routes";

// Clerk test mode (development keys): +clerk_test emails verify with this code.
const DEMO_VERIFICATION_CODE = "424242";

const styles = {
  page: tw("flex min-h-screen flex-col items-center justify-center gap-4 p-4"),
  demoHintSlot: tw("flex min-h-20 items-end"),
  demoHint: tw(
    "max-w-sm rounded-xl border bg-card px-4 py-3 text-center text-sm text-foreground",
  ),
  demoCode: tw("font-semibold"),
};

const createDemoEmail = () =>
  `reader-${randomUUID().slice(0, 8)}+clerk_test@example.com`;

const SignUpPage = () => {
  const initialValues = { emailAddress: createDemoEmail() };

  return (
    <div className={styles.page}>
      <div className={styles.demoHintSlot}>
        <ClerkLoaded>
          <BlurFade delay={0.3}>
            <p className={styles.demoHint}>
              <b>Demo:</b> any <code>name+clerk_test@example.com</code> works,
              no inbox needed. The verification code is{" "}
              <span className={styles.demoCode}>{DEMO_VERIFICATION_CODE}</span>.
            </p>
          </BlurFade>
        </ClerkLoaded>
      </div>
      <SignUp
        fallbackRedirectUrl={routes.appHome}
        signInFallbackRedirectUrl={routes.appHome}
        initialValues={initialValues}
      />
    </div>
  );
};

export default SignUpPage;
