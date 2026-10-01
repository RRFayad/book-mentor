"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage = ({ reset }: ErrorPageProps) => {
  return (
    <main>
      <h1>Something went wrong</h1>
      <p>Unable to load this page. Please try again.</p>
      <button onClick={() => reset()}>Try again</button>
    </main>
  );
};

export default ErrorPage;
