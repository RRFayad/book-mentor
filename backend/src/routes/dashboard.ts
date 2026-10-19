import type { FastifyInstance } from "fastify";

// Sample endpoint: mock dashboard data plus the signed-in user's email, which
// proves authentication and database access work end to end. Use it as the
// template for real product routes, then delete it.
export const dashboardRoutes = async (app: FastifyInstance) => {
  app.get("/dashboard", async (request) => {
    return {
      user_email: request.user.email,
      metrics: [
        {
          label: "Monthly revenue",
          value: "$24,680",
          change: "+12.5%",
          icon: "revenue",
          positive: true,
        },
        {
          label: "Active customers",
          value: "1,284",
          change: "+8.2%",
          icon: "customers",
          positive: true,
        },
        {
          label: "Conversion rate",
          value: "4.86%",
          change: "+0.6%",
          icon: "conversion",
          positive: true,
        },
        {
          label: "Refunds",
          value: "$284",
          change: "-4.1%",
          icon: "refunds",
          positive: false,
        },
      ],
      revenue_activity: {
        total: "$6,842",
        points: [
          { label: "Mon", value: 46 },
          { label: "Tue", value: 62 },
          { label: "Wed", value: 54 },
          { label: "Thu", value: 78 },
          { label: "Fri", value: 69 },
          { label: "Sat", value: 88 },
          { label: "Sun", value: 76 },
        ],
      },
      recent_activity: [
        {
          customer: "Morgan Lee",
          action: "Upgraded to Premium",
          amount: "+$29.00",
        },
        {
          customer: "Avery Shah",
          action: "Started a trial",
          amount: "$0.00",
        },
        {
          customer: "Jamie Cruz",
          action: "Renewed subscription",
          amount: "+$12.00",
        },
        {
          customer: "Taylor Chen",
          action: "Purchased Basic",
          amount: "+$12.00",
        },
      ],
    };
  });
};
