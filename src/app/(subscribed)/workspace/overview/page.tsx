import { Overview } from "@/components/subscribed/overview";
import { fetchDashboardData } from "@/lib/backend/dashboard";
import { requireCurrentUserSubscriptionPlan } from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";

const DashboardPage = async () => {
  await requireCurrentUserSubscriptionPlan(SubscriptionPlan.Basic);
  /// Mock data for demo purposes
  const dashboardData = await fetchDashboardData();

  return <Overview dashboardData={dashboardData} />;
};

export default DashboardPage;
