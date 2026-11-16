# How the Mentor finds answers

## What a book becomes

- **Chunks:** passages of the text. The only thing cited.
- **Notes:** an outline of each section, with pages.
- **One Page:** the whole book's big picture. Sent with every question.

## The flow

```
writeSearchQueries → retrieveFromSources → writeAnswer → covered, or off-topic? → end
        ↑                                                       │ no: retry (up to 2)
        └───────────────────────────────────────────────────────┘
```

1. **Write queries:** up to 2 short sentences, in the book's words. The One Page helps with situations the book never names.
2. **Retrieve:** the question + the queries, each searched in the book. Results merged in turns → 6 passages, 4 Notes.
3. **Answer:** from passages, Notes, and One Page. Also says `covered` and `offTopic`.
4. **Retry** (not covered, not off-topic):
   - different queries than before;
   - without the original question;
   - 10 passages instead of 6.

## Results (Meditations)

- **The eval:** 29 questions with known answers, plus 4 the book doesn't cover; 2 runs (2026-11-16).
- **Answered correctly:** 28/29 and 29/29.
  - 7–8 per run marked "partial" by the LLM grader, correct after human review (one detail left out) → better grader in [#38](https://github.com/RRFayad/book-mentor/issues/38).
  - The one miss: a very specific question, mentioned in a single line of the book → smaller chunks or hybrid search.
- **Pages:** 25 of 29 answers cite a page with the answer, in both runs.
- **Not covered by the book:** 4/4 answered "couldn't find it".

## How retrieval improved

- **One stubborn question** ("What warning does Marcus give himself about becoming emperor?", p. 51):
  1. keyword queries → found 1 in 5 runs;
  2. sentence queries → 3 in 5;
  3. varied retries (new queries, no original question, 10 passages) → 10 in 10, and in both eval runs.
- **The One Page steers the queries:** situations the book never names → its own ideas ("road rage" → "anger at others' wrongs").
- **Filtered vector search:** an approximate index (HNSW) ranked all books, then filtered by book → could drop the right passages → exact search per book ([ADR 0002](adr/0002-drizzle-owned-chunks-table.md)).
- **Search strategy:** chosen by measurement, below.
- **Smaller refinements:** prompt reviews, flow and search fixes along the way.

### How the search was chosen (first test book)

Did a page with the answer reach the model? 26 questions, 2 runs each:

| Option                              | Found (26) | Indirect (6) |
| ----------------------------------- | ---------- | ------------ |
| A. Question only                    | 24, 24     | 4, 4         |
| B. Rewritten queries only           | 22, 22     | 5, 5         |
| **C. Question + queries, in turns** | **25, 25** | **5, 5**     |
| D. Question + queries, rank fusion  | 24, 25     | 4, 5         |

- A misses indirect questions.
- B misses direct ones.
- **C keeps both → chosen.**
- D favored general passages → no better than C.
