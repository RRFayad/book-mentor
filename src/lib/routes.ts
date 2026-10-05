const newConversation = "/conversations/new";

export const routes = {
  home: "/",
  pricing: "/pricing",
  signIn: "/sign-in",
  signUp: "/sign-up",
  payment: {
    success: "/payment/success",
    cancelled: "/payment/cancelled",
  },
  // Where signed-in users land. Change the first screen of the app here only.
  appHome: newConversation,
  conversations: {
    new: newConversation,
    // A dynamic path is a function with a matching [param]/page.tsx folder.
    detail: (conversationId: string) =>
      `/conversations/${encodeURIComponent(conversationId)}`,
  },
  library: "/library",
  settings: {
    account: "/settings/account",
    billing: "/settings/billing",
  },
} as const;
