-- Saved answers had their text under a "What the Source says" (or "What it
-- means", "How to apply it") section. Those sections are gone: turn them into
-- plain text parts, so older Conversations still match the API contract.
UPDATE "messages"
SET "parts" = (
  SELECT jsonb_agg(
    CASE
      WHEN part->>'type' = 'section'
        AND part->>'section' IN ('source-says', 'meaning', 'application')
      THEN jsonb_build_object('type', 'text', 'content', part->'content')
      ELSE part
    END
    ORDER BY position
  )
  FROM jsonb_array_elements("parts") WITH ORDINALITY AS parts(part, position)
)
WHERE "parts" IS NOT NULL AND jsonb_array_length("parts") > 0;
