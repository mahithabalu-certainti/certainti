import { ApolloClient, InMemoryCache } from '@apollo/client';

const accountClient = new ApolloClient({
  uri: import.meta.env.VITE_ACCOUNT_GRAPHQL_URL,
  cache: new InMemoryCache(),
});

export default accountClient;
