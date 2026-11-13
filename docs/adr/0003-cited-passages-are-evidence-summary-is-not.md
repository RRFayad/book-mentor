# Cited passages are evidence; the Conversation Summary is not

> v1 (2026-11-13): no Conversation Summary yet (only the last 3 questions and answers, as context), and cited passages aren't reused after Expiry yet (v1.1). The rules on Notes and the One Page hold.

- **Conversations stay open after Expiry,** never read-only.
- **Evidence = verbatim Source text only:**
  - the Chunks of the remaining Sources;
  - the passages saved in the Conversation's Citations.
- **Context only, never evidence:** the Conversation Summary and message history. They're the model's paraphrase → answers would drift from the Sources.
- **Notes and the One Page are paraphrase too → never cited.**
  - The Mentor may still state what they conclude: "all the steps of this method" or "the book's main argument" live in no single Chunk.
  - It names the section and pages in parentheses instead of a Citation marker.
  - So the reader can tell interpretation (pages, no marker) from the book's words (a marker that opens the quote).

## Considered Options

- **Read-only once all Sources expire:** simple, but ends Conversations that still hold real evidence.
- **Answer from the Summary and history after Expiry:** keeps it alive, but grounds answers on model-written text.
- **Cite Notes like passages:** one mechanism, but puts paraphrase where the book's words go.
- **Notes only steer retrieval:** verbatim answers only, but a section's outline could never be stated.
