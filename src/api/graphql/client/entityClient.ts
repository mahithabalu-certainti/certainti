import { ApolloClient, InMemoryCache } from '@apollo/client';

const entityClient = new ApolloClient({
  uri: import.meta.env.VITE_ENTITY_GRAPHQL_URL,
  cache: new InMemoryCache(),
});

export default entityClient;
