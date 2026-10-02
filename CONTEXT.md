# Book Mentor

Book Mentor lets a user hold deep, grounded conversations with content they own, such as books and blogs, guided by an AI Mentor that never goes beyond what that content says.

## Language

### Sources

**Source**:
One piece of content a user adds for the Mentor to draw on: a book (from a PDF) or a blog (a set of posts from one site). A whole blog is one Source, never one Source per post.
Informally called a "book" or a "blog".
_Avoid_: Document, File, Material

**Ingesting**:
The state of a Source whose content is still being added; it cannot be used in a Conversation yet. If adding fails, the Source is removed rather than kept in a failed state.

**Ready**:
The state of a Source whose content is fully added and usable in Conversations.

**Library**:
A user's collection of Sources.
_Avoid_: Shelf, Collection

**Expiry**:
The automatic deletion of a Source, with its Chunks, seven days after it was added. Conversations outlive the Expiry of their Sources.

**Chunk**:
A retrievable passage of a Source's text, tied to its location in that Source.
_Avoid_: Segment, Fragment

### Conversations

**Conversation**:
A persistent exchange between a user and the Mentor, bound to a fixed set of one to three Sources chosen when it starts.
_Avoid_: Chat, Thread, Session

**Mentor**:
The AI guide in a Conversation; it only says what the Conversation's Sources support, including passages already cited in that Conversation after a Source's Expiry.
_Avoid_: Assistant, Bot, Agent

**Citation**:
A pointer from a Mentor answer to the Chunk(s) it is grounded in, keeping a copy of the cited text so it stays readable after the Source's Expiry.
_Avoid_: Reference, Footnote
