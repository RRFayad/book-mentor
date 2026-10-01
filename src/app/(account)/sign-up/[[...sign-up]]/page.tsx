import { SignUp } from "@clerk/nextjs";
import { tw } from "@/lib/utils";
import { routes } from "@/lib/routes";

const styles = {
  page: tw("flex min-h-screen items-center justify-center"),
};

const SignUpPage = () => {
  return (
    <div className={styles.page}>
      <SignUp
        fallbackRedirectUrl={routes.workspace.overview}
        signInFallbackRedirectUrl={routes.workspace.overview}
      />
    </div>
  );
};

export default SignUpPage;
