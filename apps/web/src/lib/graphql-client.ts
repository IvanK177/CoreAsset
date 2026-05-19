import { GraphQLClient } from "graphql-request";

// Next.js only reads .env* files from the project directory (apps/web/).
// NEXT_PUBLIC_ prefix makes the variable available in client-side code at build time.
const GRAPHQL_API_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:4000/graphql";

export const graphqlClient = new GraphQLClient(GRAPHQL_API_URL);

// Auth token management — call setAuthToken() after login to attach
// Authorization header to all subsequent requests.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    graphqlClient.setHeader("Authorization", `Bearer ${token}`);
  } else {
    graphqlClient.setHeaders({});
  }
}

// Helper function for GraphQL queries
export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  return graphqlClient.request<T>(query, variables);
}