import { UserProfile } from "@clerk/nextjs";

import { PageHeader } from "@/components/subscribed/page-header";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
  profile: tw("flex w-full justify-center rounded-xl"),
  clerkProfileCard: tw("max-h-150"),
};

const AccountPage = () => {
  return (
    <main className={styles.page}>
      <PageHeader
        title="Manage your account"
        description={
          <>
            Your profile and security settings are securely managed by Clerk,
            our authentication provider. We only store the account details
            required to operate this application.
          </>
        }
      />
      <section className={styles.profile}>
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              cardBox: styles.clerkProfileCard,
            },
          }}
        />
      </section>
    </main>
  );
};

export default AccountPage;
