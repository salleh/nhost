import { useCurrentWorkspaceAndProject } from '@/features/projects/common/hooks/useCurrentWorkspaceAndProject';
import generateAppServiceUrl from '@/utils/common/generateAppServiceUrl';
import { getHasuraAdminSecret } from '@/utils/env';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { useMemo } from 'react';

/**
 * It creates a new Apollo Client instance that connects to the remote application's GraphQL endpoint
 * @returns A function that returns a new ApolloClient instance.
 */
export function useRemoteApplicationGQLClient() {
  const { currentProject, loading } = useCurrentWorkspaceAndProject();

  const userApplicationClient = useMemo(() => {
    if (loading) {
      return new ApolloClient({ cache: new InMemoryCache() });
    }

    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: generateAppServiceUrl(
          currentProject?.subdomain,
          currentProject?.region,
          'graphql',
        ),
        headers: {
          'x-hasura-admin-secret':
            process.env.NEXT_PUBLIC_ENV === 'dev'
              ? getHasuraAdminSecret()
              : currentProject?.config?.hasura.adminSecret,
        },
      }),
    });
  }, [
    loading,
    currentProject?.subdomain,
    currentProject?.region,
    currentProject?.config?.hasura.adminSecret,
  ]);

  return userApplicationClient;
}

export default useRemoteApplicationGQLClient;
