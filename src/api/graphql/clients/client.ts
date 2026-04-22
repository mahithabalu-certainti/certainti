import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const createClient = (uri: string) => {
  const httpLink = createHttpLink({
    uri,
  });

  // Create the auth link
  const authLink = setContext((_, { headers }) => {
    const auth = localStorage.getItem('auth');
    const { authToken, userId } = auth ? JSON.parse(auth) : {};
    return {
      headers: {
        ...headers,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {}),
      },
    };
  });

  // Combine auth and http link
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
};

const ACCOUNT_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_ACCOUNT_URL}/graphql`;
const USER_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_USER_URL}/graphql`;
const RESOURCE_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_RESOURCE_URL}/graphql`;
const TASK_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_RESOURCE_URL}/graphql`;
const CASE_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_CASE_URL}/graphql`;

// Create clients
export const accountClient = createClient(ACCOUNT_URL);
export const userClient = createClient(USER_URL);
export const resourceClient = createClient(RESOURCE_URL);
export const taskClient = createClient(TASK_URL);
export const caseClient = createClient(CASE_URL);
