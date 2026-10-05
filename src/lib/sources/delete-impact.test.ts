import { describe, expect, it } from "vitest";

import { deleteImpactText } from "@/lib/sources/delete-impact";

describe("deleteImpactText", () => {
  it("names how many Conversations use the Source", () => {
    expect(deleteImpactText(2)).toBe(
      "It's used in 2 Conversations. They'll carry on just as if it had expired.",
    );
    expect(deleteImpactText(1)).toBe(
      "It's used in 1 Conversation. It'll carry on just as if the Source had expired.",
    );
  });

  it("says nothing when no Conversation uses the Source", () => {
    expect(deleteImpactText(0)).toBeNull();
  });
});
