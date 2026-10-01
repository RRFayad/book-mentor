"use server";

import { fetchBackendData } from "./client";

/* These are mock types and mock data for demo purposes */

export type DashboardMetricIcon =
  "revenue" | "customers" | "conversion" | "refunds";

export type DashboardData = {
  user_email: string;
  metrics: {
    label: string;
    value: string;
    change: string;
    icon: DashboardMetricIcon;
    positive: boolean;
  }[];
  revenue_activity: {
    total: string;
    points: {
      label: string;
      value: number;
    }[];
  };
  recent_activity: {
    customer: string;
    action: string;
    amount: string;
  }[];
};

export const fetchDashboardData = async (): Promise<DashboardData | null> => {
  return fetchBackendData<DashboardData>("/dashboard/");
};
