import { UserDataProvider } from '@/context/UserDataContext';
import type { Project } from '@/types/application';
import { ApplicationStatus } from '@/types/application';
import type { Workspace } from '@/types/workspace';
import nhostGraphQLLink from '@/utils/msw/mocks/graphql/nhostGraphQLLink';
import { render, screen, waitForElementToBeRemoved } from '@/utils/testUtils';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, vi } from 'vitest';
import OverviewDeployments from '.';

vi.mock('next/router', () => ({
  useRouter: vi.fn().mockReturnValue({
    basePath: '',
    pathname: '/test-workspace/test-application',
    route: '/[workspaceSlug]/[appSlug]',
    asPath: '/test-workspace/test-application',
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    query: {
      workspaceSlug: 'test-workspace',
      appSlug: 'test-application',
    },
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
  }),
}));

const mockApplication: Project = {
  id: '1',
  name: 'Test Application',
  slug: 'test-application',
  appStates: [],
  subdomain: '',
  isProvisioned: true,
  region: {
    awsName: 'us-east-1',
    city: 'New York',
    countryCode: 'US',
    id: '1',
  },
  createdAt: new Date().toISOString(),
  deployments: [],
  desiredState: ApplicationStatus.Live,
  featureFlags: [],
  providersUpdated: true,
  githubRepository: { fullName: 'test/git-project' },
  repositoryProductionBranch: null,
  nhostBaseFolder: null,
  plan: null,
  config: {
    hasura: {
      adminSecret: 'nhost-admin-secret',
    },
  },
};

const mockWorkspace: Workspace = {
  id: '1',
  name: 'Test Workspace',
  slug: 'test-workspace',
  members: [],
  applications: [mockApplication],
};

const server = setupServer(
  rest.get('https://local.graphql.nhost.run/v1', (_req, res, ctx) =>
    res(ctx.status(200)),
  ),
  nhostGraphQLLink.operation(async (_req, res, ctx) =>
    res(
      ctx.data({
        deployments: [],
      }),
    ),
  ),
);

beforeAll(() => {
  process.env.NEXT_PUBLIC_NHOST_PLATFORM = 'true';
  process.env.NEXT_PUBLIC_ENV = 'production';
  server.listen();
});

afterEach(() => server.resetHandlers());

afterAll(() => {
  server.close();
  vi.restoreAllMocks();
});

test('should render an empty state when GitHub is not connected', () => {
  render(
    <UserDataProvider
      initialWorkspaces={[
        {
          ...mockWorkspace,
          applications: [{ ...mockApplication, githubRepository: null }],
        },
      ]}
    >
      <OverviewDeployments />
    </UserDataProvider>,
  );

  expect(screen.getByText(/no deployments/i)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /connect to github/i }),
  ).toBeInTheDocument();
});

test('should render an empty state when GitHub is connected, but there are no deployments', async () => {
  render(
    <UserDataProvider initialWorkspaces={[mockWorkspace]}>
      <OverviewDeployments />
    </UserDataProvider>,
  );

  expect(screen.getByText(/^deployments$/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /view all/i })).toBeInTheDocument();

  await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));

  expect(screen.getByText(/no deployments/i)).toBeInTheDocument();
  expect(screen.getByText(/test\/git-project/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute(
    'href',
    '/test-workspace/test-application/settings/git',
  );
});

test('should render a list of deployments', async () => {
  server.use(
    nhostGraphQLLink.operation(async (req, res, ctx) => {
      const requestPayload = await req.json();

      if (requestPayload.operationName === 'ScheduledOrPendingDeploymentsSub') {
        return res(ctx.data({ deployments: [] }));
      }

      return res(
        ctx.data({
          deployments: [
            {
              id: '1',
              commitSHA: 'abc123',
              deploymentStartedAt: '2021-08-01T00:00:00.000Z',
              deploymentEndedAt: '2021-08-01T00:05:00.000Z',
              deploymentStatus: 'DEPLOYED',
              commitUserName: 'test.user',
              commitUserAvatarUrl: 'http://images.example.com/avatar.png',
              commitMessage: 'Test commit message',
            },
          ],
        }),
      );
    }),
  );

  render(
    <UserDataProvider initialWorkspaces={[mockWorkspace]}>
      <OverviewDeployments />
    </UserDataProvider>,
  );

  await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));

  expect(screen.getByText(/test commit message/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/avatar/i)).toHaveStyle(
    'background-image: url(http://images.example.com/avatar.png)',
  );
  expect(
    screen.getByRole('link', {
      name: /test commit message/i,
    }),
  ).toHaveAttribute('href', '/test-workspace/test-application/deployments/1');
  expect(screen.getByText(/5m 0s/i)).toBeInTheDocument();
  expect(screen.getByText(/live/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /redeploy/i })).not.toBeDisabled();
});

test('should disable redeployments if a deployment is already in progress', async () => {
  server.use(
    nhostGraphQLLink.operation(async (req, res, ctx) => {
      const requestPayload = await req.json();

      if (requestPayload.operationName === 'ScheduledOrPendingDeploymentsSub') {
        return res(
          ctx.data({
            deployments: [
              {
                id: '2',
                commitSHA: 'abc234',
                deploymentStartedAt: '2021-08-02T00:00:00.000Z',
                deploymentEndedAt: null,
                deploymentStatus: 'PENDING',
                commitUserName: 'test.user',
                commitUserAvatarUrl: 'http://images.example.com/avatar.png',
                commitMessage: 'Test commit message',
              },
            ],
          }),
        );
      }

      return res(
        ctx.data({
          deployments: [
            {
              id: '1',
              commitSHA: 'abc123',
              deploymentStartedAt: '2021-08-01T00:00:00.000Z',
              deploymentEndedAt: '2021-08-01T00:05:00.000Z',
              deploymentStatus: 'DEPLOYED',
              commitUserName: 'test.user',
              commitUserAvatarUrl: 'http://images.example.com/avatar.png',
              commitMessage: 'Test commit message',
            },
          ],
        }),
      );
    }),
  );

  render(
    <UserDataProvider initialWorkspaces={[mockWorkspace]}>
      <OverviewDeployments />
    </UserDataProvider>,
  );

  await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
  expect(screen.getByRole('button', { name: /redeploy/i })).toBeDisabled();
});
