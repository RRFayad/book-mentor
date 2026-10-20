const workspace = {
  overview: "/workspace/overview",
  // For a dynamic path, add a function and a matching [param]/page.tsx folder:
  // item: (itemId: string) => `/workspace/items/${encodeURIComponent(itemId)}`,
} as const;

export const routes = {
  home: "/",
  appHome: workspace.overview, // Where signed-in users land / overall redirects
  pricing: "/pricing",
  signIn: "/sign-in",
  signUp: "/sign-up",
  payment: {
    success: "/payment/success",
    cancelled: "/payment/cancelled",
  },
  workspace,
  settings: {
    account: "/settings/account",
    billing: "/settings/billing",
  },
} as const;
