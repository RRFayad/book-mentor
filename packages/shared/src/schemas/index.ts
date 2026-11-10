// API contract shared by the backend and the frontend. The backend attaches
// these schemas to routes (response validation and Swagger docs); the frontend
// uses the inferred types for the data it receives.
// One file per feature; import everything from "@app/shared/schemas".

export * from "./common.schema";
export * from "./sources.schema";
export * from "./conversations.schema";
