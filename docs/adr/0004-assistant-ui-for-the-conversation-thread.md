# assistant-ui for the Conversation thread, on a custom-backend runtime

The Conversation view is built on assistant-ui's primitives, so time goes into the backend rather than into chat plumbing (scrolling while streaming, composer behaviour, markdown rendering). Its LangGraph runtime is not used even though the backend uses LangGraph: that runtime needs a LangGraph Cloud or self-hosted LangGraph server, while Book Mentor's graph runs inside its own FastAPI. The thread therefore uses one of assistant-ui's custom-backend runtimes, chosen in the engineering grill. The sidebar, Library, Source picker and Citation panel stay app-owned.

## Considered Options

- Hand-built chat UI: full control, but days spent on plumbing that teaches nothing this project is for.
- assistant-ui's LangGraph runtime: would require running a LangGraph server as a second backend.

## Consequences

- The thread components are written in the repo on assistant-ui's primitives, adapted from its registry thread, rather than installed with the shadcn CLI. The registry thread also brings attachments, images, reasoning, tool UI, follow-up suggestions, and shadcn components that would replace this repo's Base UI ones; v1 needs none of them.
- A Mentor answer travels to assistant-ui as one custom `answer` data part, so assistant-ui's own Copy action (text parts only) does not apply; the thread uses its own Copy button over the answer's plain text.
- assistant-ui offers message editing, regeneration and branching. v1 leaves them off by not providing their handlers, because they rewrite history that the rolling summary, saved Citations and message limits depend on.
