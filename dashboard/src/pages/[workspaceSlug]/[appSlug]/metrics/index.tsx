import { UnlockFeatureByUpgrading } from '@/components/applications/UnlockFeatureByUpgrading';
import Container from '@/components/layout/Container';
import ProjectLayout from '@/components/layout/ProjectLayout';
import { useCurrentWorkspaceAndProject } from '@/features/projects/common/hooks/useCurrentWorkspaceAndProject';
import ActivityIndicator from '@/ui/v2/ActivityIndicator';
import Box from '@/ui/v2/Box';
import Button from '@/ui/v2/Button/Button';
import Divider from '@/ui/v2/Divider';
import IconButton from '@/ui/v2/IconButton';
import Text from '@/ui/v2/Text';
import ArrowSquareOutIcon from '@/ui/v2/icons/ArrowSquareOutIcon';
import CopyIcon from '@/ui/v2/icons/CopyIcon';
import generateAppServiceUrl from '@/utils/common/generateAppServiceUrl';
import { copy } from '@/utils/copy';
import Image from 'next/image';
import type { ReactElement } from 'react';

export default function MetricsPage() {
  const { currentProject, loading } = useCurrentWorkspaceAndProject();
  const adminPassword =
    currentProject?.config?.observability?.grafana?.adminPassword;

  if (loading) {
    return (
      <Container>
        <ActivityIndicator label="Loading project..." delay={1000} />
      </Container>
    );
  }

  if (currentProject.plan.isFree) {
    return (
      <Container>
        <UnlockFeatureByUpgrading message="Unlock metrics by upgrading your project to the Pro plan." />
      </Container>
    );
  }

  return (
    <Container>
      <div className="mx-auto w-full max-w-md px-6 py-4 text-left">
        <div className="grid grid-flow-row gap-1">
          <div className="mx-auto">
            <Image
              src="/assets/grafana.svg"
              width={72}
              height={72}
              alt="Grafana"
            />
          </div>

          <Text variant="h3" component="h1" className="text-center">
            Open Grafana
          </Text>

          <Text className="text-center">
            Grafana is the observability dashboard for your project. Here you
            will be able to see various metrics about its usage and performance.
            Copy the admin password to your clipboard and enter it in the next
            screen.
          </Text>

          <Box className="mt-6 grid grid-flow-row gap-0 border-y-1">
            <div className="grid w-full grid-cols-1 place-content-between items-center py-2 sm:grid-cols-3">
              <Text className="col-span-1 text-center font-medium sm:justify-start sm:text-left">
                Username
              </Text>

              <div className="col-span-1 grid grid-flow-col items-center justify-center gap-2 sm:col-span-2 sm:justify-end">
                <Text color="secondary" className="text-sm">
                  admin
                </Text>
              </div>
            </div>

            <Divider />

            <div className="grid w-full grid-cols-1 place-content-between items-center py-2 sm:grid-cols-3">
              <Text className="col-span-1 text-center font-medium sm:justify-start sm:text-left">
                Password
              </Text>

              <div className="col-span-1 grid grid-flow-col items-center justify-center gap-2 sm:col-span-2 sm:justify-end">
                <Text className="font-medium" variant="subtitle2">
                  {adminPassword
                    ? Array(adminPassword.length).fill('•').join('')
                    : 'N/A'}
                </Text>

                {adminPassword && (
                  <IconButton
                    onClick={() => copy(adminPassword, 'Grafana password')}
                    variant="borderless"
                    color="secondary"
                    className="min-w-0 p-1"
                    aria-label="Copy password"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </IconButton>
                )}
              </div>
            </div>
          </Box>

          <div className="mt-6 grid grid-flow-row gap-2">
            <Button
              href={generateAppServiceUrl(
                currentProject.subdomain,
                currentProject.region,
                'grafana',
              )}
              // Both `target` and `rel` are available when `href` is set. This is
              // a limitation of MUI.
              // @ts-ignore
              target="_blank"
              rel="noreferrer noopener"
              endIcon={<ArrowSquareOutIcon className="h-4 w-4" />}
            >
              Open Grafana
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

MetricsPage.getLayout = function getLayout(page: ReactElement) {
  return <ProjectLayout>{page}</ProjectLayout>;
};
