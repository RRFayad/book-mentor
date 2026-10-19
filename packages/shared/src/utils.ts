// ---------- Environment ----------

type GetEnvVar = {
  (name: string): string;
  (name: string, throwErr: true): string;
  (name: string, throwErr: false): string | undefined;
};

export const getEnvVar = ((
  name: string,
  throwErr = true,
): string | undefined => {
  const value = process.env[name];

  if (!value) {
    if (throwErr) {
      throw new Error(`${name} environment variable is not set`);
    }

    return undefined;
  }

  return value;
}) as GetEnvVar;

export const getBooleanEnvVar = (name: string): boolean => {
  const value = getEnvVar(name);

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${name} must be set to true or false`);
};

// ---------- Strings ----------

export const capitalize = (value: string, allWords = false): string => {
  if (!value) {
    return value;
  }

  if (!allWords) {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }

  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ---------- Errors ----------

export const getErrorMessageAndThrow = (
  logMessage: string,
  error: unknown,
): never => {
  let errorMessage;

  if (error instanceof Error) errorMessage = error.message;
  if (error && typeof error === "object" && "message" in error) {
    errorMessage = String(error.message);
  }
  if (typeof error === "string") errorMessage = error;
  if (!errorMessage) errorMessage = "Unknown error";

  console.error(logMessage, errorMessage);

  throw error;
};
