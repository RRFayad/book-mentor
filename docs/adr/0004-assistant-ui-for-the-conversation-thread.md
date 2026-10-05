# assistant-ui for the Conversation thread, on a custom-backend runtime

The Conversation view is built from assistant-ui components, copied into the repo through its shadcn registry, so time goes into the backend rather than into chat plumbing (scrolling while streaming, composer behaviour, markdown rendering). Its LangGraph runtime is not used even though the backend uses LangGraph: that runtime needs a LangGraph Cloud or self-hosted LangGraph server, while Book Mentor's graph runs inside its own FastAPI. The thread therefore uses one of assistant-ui's custom-backend runtimes, chosen in the engineering grill. The sidebar, Library, Source picker and Citation panel stay app-owned.

## Considered Options

- Hand-built chat UI: full control, but days spent on plumbing that teaches nothing this project is for.
- assistant-ui's LangGraph runtime: would require running a LangGraph server as a second backend.

## Consequences

- assistant-ui offers message editing, regeneration and branching. v1 leaves them off by not providing their handlers, because they rewrite history that the rolling summary, saved Citations and message limits depend on.
