# assistant-ui for the Conversation thread, on a custom-backend runtime

- **Decision:** the Conversation thread is built on assistant-ui's primitives → time goes into the backend, not chat plumbing (scrolling, composer, Markdown).
- **Not its LangGraph runtime:** that needs a LangGraph Cloud or self-hosted server; our graph runs inside our own API (Fastify).
- **Runtime used:** ExternalStoreRuntime. The app keeps the messages in React state and gives assistant-ui callbacks.
- App-owned: the sidebar, Library, Source picker, Citation panel.

## Considered Options

- **A hand-built chat UI:** full control, days of plumbing that teach nothing this project is for.
- **assistant-ui's LangGraph runtime:** a second backend to run.

## Consequences

- Thread components are written in the repo on the primitives, adapted from the registry thread, not installed with the shadcn CLI.
  - The registry brings attachments, reasoning, tool UI, and shadcn components that would replace our Base UI ones; v1 needs none.
- An answer is one custom `answer` data part → assistant-ui's Copy (text parts only) doesn't apply; the thread has its own Copy button.
- No edit, regenerate, or branch handlers: they'd rewrite history that the Summary, saved Citations, and the message limit depend on.
- No cancel handler either, since v1 doesn't stream → no Stop button until #20.
