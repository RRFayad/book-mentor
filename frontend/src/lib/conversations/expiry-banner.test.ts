import { describe, expect, it } from "vitest";

import type { ConversationSource } from "@/lib/backend/types";
import { expiryBannerText } from "@/lib/conversations/expiry-banner";

const source = (title: string, expired: boolean): ConversationSource => ({
  id: title,
  kind: "book",
  title,
  author: "Mike Mentzer",
  expired,
});

const KEEP_GOING =
  "You can keep going: the Mentor can still use passages already cited here, but it can't search the expired Sources for anything new.";

describe("expiryBannerText", () => {
  it("names the only Source when it has expired", () => {
    expect(expiryBannerText([source("Heavy Duty II", true)])).toEqual({
      title: "Heavy Duty II has expired.",
      text: KEEP_GOING,
    });
  });

  it("speaks of all Sources when there are several and all have expired", () => {
    expect(expiryBannerText([source("A", true), source("B", true)])).toEqual({
      title: "All Sources in this Conversation have expired.",
      text: KEEP_GOING,
    });
  });

  it("shows nothing while at least one Source has not expired", () => {
    expect(
      expiryBannerText([source("A", true), source("B", false)]),
    ).toBeNull();
    expect(expiryBannerText([source("A", false)])).toBeNull();
  });
});
