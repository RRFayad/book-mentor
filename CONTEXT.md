# Book Mentor

Grounded conversations with books (and, later, blogs) the user owns, with an AI Mentor that never goes beyond what they say.

## Language

### Sources

**Source**: one book (from a PDF) or one blog (a site's posts; v1.1) added for the Mentor. A whole blog is one Source. Informally "a book".
_Avoid_: Document, File, Material

**Ingesting**: being added; not usable yet. A failed add is removed, never kept as failed.

**Ready**: fully added; usable in Conversations.

**Library**: a user's Sources.
_Avoid_: Shelf, Collection

**Expiry**: 7 days after a Source is added, it leaves the Library and isn't searched; a daily job then deletes its text (Chunks, Notes, One Page). The title stays, so Conversations show it as expired.

**Chunk**: a retrievable passage of a Source's text, with its page.
_Avoid_: Segment, Fragment

**Note**: the Mentor's outline of one book section, written during ingestion, every line with its page. Not Source text: mentioned by section and pages, never cited.
_Avoid_: Summary (that's the Conversation Summary)

**One Page**: the Mentor's big picture of a whole book, built from its Notes when it becomes Ready. Never cited.
_Avoid_: Summary, Overview

### Conversations

**Conversation**: a saved exchange with the Mentor, on a fixed set of 1 to 3 Sources chosen at the start (1 in v1).
_Avoid_: Chat, Thread, Session

**Mentor**: the AI guide. Says only what the Conversation's Sources support, including passages already cited after a Source's Expiry (v1.1).
_Avoid_: Assistant, Bot, Agent

**Citation**: a pointer from an answer to the Chunk(s) behind it, with a copy of the text, so it stays readable after Expiry.
_Avoid_: Reference, Footnote

**Conversation Summary**: the Mentor's summary of older messages, so long Conversations fit the prompt. Context, never evidence. "Summary" alone means this. Not in v1 (the last 3 questions and answers only).
_Avoid_: Memory, History
