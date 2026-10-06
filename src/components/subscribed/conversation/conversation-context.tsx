"use client";

import { createContext, useContext } from "react";

import type { ConversationSource } from "@/lib/backend/types";

// A Citation is identified by its answer and its number inside that answer.
export type CitationKey = {
  answerId: string;
  number: number;
};

type ConversationContextValue = {
  sources: ConversationSource[];
  selectedCitation: CitationKey | null;
  selectCitation: (citation: CitationKey | null) => void;
};

export const ConversationContext = createContext<ConversationContextValue>({
  sources: [],
  selectedCitation: null,
  selectCitation: () => {},
});

export const useConversation = () => useContext(ConversationContext);
