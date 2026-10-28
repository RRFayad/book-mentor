// The tests' own database on the local Docker Postgres, never the dev one.
// Override with TEST_DATABASE_URL to point elsewhere (e.g. in CI).
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/book_mentor_test";
