import type { Note, Passage } from "./mentor.graph";

// Numbered, so the model can cite a passage like [2]. The number is the
// passage's position in the list, which is how its Citation is found again.
export const formatPassages = (passages: Passage[]) =>
  passages
    .map(
      (passage, index) =>
        `[${index + 1}] "${passage.title}" by ${passage.author}, p. ${passage.page}\n${passage.content}`,
    )
    .join("\n\n");

// No numbers, so the model can't cite a Note like a passage.
export const formatNotes = (notes: Note[]) =>
  notes
    .map(
      (note) =>
        `Notes on "${note.heading}" in "${note.title}" by ${note.author}, pp. ${note.firstPage}–${note.lastPage}\n${note.content}`,
    )
    .join("\n\n");
