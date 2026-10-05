// The sentence in the Delete Source confirmation. Deleting a Source affects
// its Conversations exactly as its Expiry would.
export const deleteImpactText = (conversationCount: number): string | null => {
  if (conversationCount === 0) {
    return null;
  }

  return conversationCount === 1
    ? "It's used in 1 Conversation. It'll carry on just as if the Source had expired."
    : `It's used in ${conversationCount} Conversations. They'll carry on just as if it had expired.`;
};
