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

- **Pages:** 26 of 29 answers point to a page with the answer.
- **Not covered by the book:** 4 of 4 answered "couldn't find it".
- **Solved:** the emperor question → 1/5 (keywords) → 3/5 (sentences) → 10/10 (retries).
- **Known limit:** the Christians (p. 99) are never found → smaller chunks or hybrid search.
- **Not reported:** the LLM grader's counts, too unreliable ([#38](https://github.com/RRFayad/book-mentor/issues/38)).

## How the search was chosen (first test book)

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
