# How the Mentor finds answers

Each book is stored at three levels: **chunks** (passages of its text, the only thing cited), **Notes** (an outline of each section, with pages) and a **One Page** (the whole book's big picture, sent with every question).

Before searching, the model rewrites the question into up to two search queries, one per part of the question, in the book's likely words. The question is searched too, and the results are merged in turns: each search's best result, then each one's second best, until 6 passages and 4 Notes.

## Result

Full answers to the answer key's 30 questions, written as in the app and graded automatically against reference answers, two runs each. Four of the questions are about things the book doesn't cover:

| Option                              | Wrong (of 26) | Not-covered questions handled (of 4) |
| ----------------------------------- | ------------- | ------------------------------------ |
| A. The question only                | 5, 5          | 4, 4                                 |
| B. Rewritten queries only           | 2, 4          | 4, 4                                 |
| **C. Question + rewritten queries** | **2, 2**      | **4, 4**                             |

The other answers were correct or missed only a secondary detail of the reference. C's remaining mistakes: a table that exists only as an image in the PDF, an indirect question retrieval misses, and two neighboring passages the model merged. No option answered a not-covered question as if the book covered it.

## How this was chosen

Four options were compared on 26 questions with known answer pages (`backend/evals/`). Six of them are indirect, like "which scientist…" instead of the scientist's name. Found means a passage or Note from an answer page reached the model. Two runs each:

| Option                                               | Found (26) | Indirect (6) |
| ---------------------------------------------------- | ---------- | ------------ |
| A. The question only                                 | 24, 24     | 4, 4         |
| B. Rewritten queries only                            | 22, 22     | 5, 5         |
| **C. Question + rewritten queries, merged in turns** | **25, 25** | **5, 5**     |
| D. Question + rewritten queries, rank fusion (RRF)   | 24, 25     | 4, 5         |

- **A** misses indirect questions; **B** misses direct ones, where rewrites drift from the book's wording. **C** keeps the wins of both.
- **D** scores passages by how many searches found them (the question weighted ×1.5). Agreement favored general passages over specific answers found by a single search, so it did no better than C and its answers weren't graded.
