import { Overview } from "@/components/subscribed/overview";
import { fetchDashboardData } from "@/lib/backend/dashboard";
import { requireCurrentUserSubscriptionPlan } from "@/lib/subscription/subscription";

const DashboardPage = async () => {
  await requireCurrentUserSubscriptionPlan("basic");
  /// Mock data for demo purposes
  const dashboardData = await fetchDashboardData();

  return <Overview dashboardData={dashboardData} />;
};

export default DashboardPage;
