import { GraphQLClient } from "graphql-request";

const GRAPHQL_API_URL = process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:4000/graphql";

export const graphqlClient = new GraphQLClient(GRAPHQL_API_URL, {
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function for GraphQL queries
export async function graphqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  return graphqlClient.request<T>(query, variables);
}