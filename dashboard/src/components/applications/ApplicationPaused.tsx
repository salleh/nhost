import ApplicationInfo from '@/components/applications/ApplicationInfo';
import { ChangePlanModal } from '@/components/applications/ChangePlanModal';
import { StagingMetadata } from '@/components/applications/StagingMetadata';
import { useDialog } from '@/components/common/DialogProvider';
import Container from '@/components/layout/Container';
import { useCurrentWorkspaceAndProject } from '@/features/projects/common/hooks/useCurrentWorkspaceAndProject';
import { useIsCurrentUserOwner } from '@/features/projects/common/hooks/useIsCurrentUserOwner';
import {
  GetAllWorkspacesAndProjectsDocument,
  useGetFreeAndActiveProjectsQuery,
  useUnpauseApplicationMutation,
} from '@/generated/graphql';
import { Modal } from '@/ui';
import { Alert } from '@/ui/Alert';
import ActivityIndicator from '@/ui/v2/ActivityIndicator';
import Box from '@/ui/v2/Box';
import Button from '@/ui/v2/Button';
import Text from '@/ui/v2/Text';
import { MAX_FREE_PROJECTS } from '@/utils/CONSTANTS';
import { getToastStyleProps } from '@/utils/settings/settingsConstants';
import type { ApolloError } from '@apollo/client';
import { useUserData } from '@nhost/nextjs';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { RemoveApplicationModal } from './RemoveApplicationModal';

export default function ApplicationPaused() {
  const { openDialog } = useDialog();
  const { currentProject, refetch: refetchWorkspaceAndProject } =
    useCurrentWorkspaceAndProject();
  const isOwner = useIsCurrentUserOwner();
  const user = useUserData();

  const [showDeletingModal, setShowDeletingModal] = useState(false);
  const [unpauseApplication, { loading: changingApplicationStateLoading }] =
    useUnpauseApplicationMutation({
      refetchQueries: [GetAllWorkspacesAndProjectsDocument],
    });

  const { data, loading } = useGetFreeAndActiveProjectsQuery({
    variables: { userId: user?.id },
    fetchPolicy: 'cache-and-network',
    skip: !user,
  });

  const numberOfFreeAndLiveProjects = data?.freeAndActiveProjects.length || 0;
  const wakeUpDisabled = numberOfFreeAndLiveProjects >= MAX_FREE_PROJECTS;

  async function handleTriggerUnpausing() {
    try {
      await toast.promise(
        unpauseApplication({ variables: { appId: currentProject.id } }),
        {
          loading: 'Starting the project...',
          success: `The project has been started successfully.`,
          error: (arg: ApolloError) => {
            // we need to get the internal error message from the GraphQL error
            const { internal } = arg.graphQLErrors[0]?.extensions || {};
            const { message } = (internal as Record<string, any>)?.error || {};

            // we use the default Apollo error message if we can't find the
            // internal error message
            return (
              message ||
              arg.message ||
              'An error occurred while waking up the project. Please try again.'
            );
          },
        },
        getToastStyleProps(),
      );

      await refetchWorkspaceAndProject();
    } catch {
      // Note: The toast will handle the error.
    }
  }

  if (loading) {
    return <ActivityIndicator label="Loading user data..." delay={1000} />;
  }

  return (
    <>
      <Modal
        showModal={showDeletingModal}
        close={() => setShowDeletingModal(false)}
      >
        <RemoveApplicationModal
          close={() => setShowDeletingModal(false)}
          title={`Remove project ${currentProject.name}?`}
          description={`The project ${currentProject.name} will be removed. All data will be lost and there will be no way to
          recover the app once it has been deleted.`}
        />
      </Modal>

      <Container className="mx-auto mt-20 grid max-w-lg grid-flow-row gap-4 text-center">
        <div className="mx-auto flex w-centImage flex-col text-center">
          <Image
            src="/assets/PausedApp.svg"
            alt="Closed Eye"
            width={72}
            height={72}
          />
        </div>

        <Box className="grid grid-flow-row gap-1">
          <Text variant="h3" component="h1">
            {currentProject.name} is sleeping
          </Text>

          <Text>
            Starter projects stop responding to API calls after 7 days of
            inactivity. Upgrade to Pro to avoid autosleep.
          </Text>
        </Box>

        <Box className="grid grid-flow-row gap-2">
          {isOwner && (
            <Button
              className="mx-auto w-full max-w-[280px]"
              onClick={() => {
                openDialog({
                  component: <ChangePlanModal />,
                  props: {
                    PaperProps: { className: 'p-0' },
                    maxWidth: 'lg',
                  },
                });
              }}
            >
              Upgrade to Pro
            </Button>
          )}

          <div className="grid grid-flow-row gap-2">
            <Button
              variant="borderless"
              className="mx-auto w-full max-w-[280px]"
              loading={changingApplicationStateLoading}
              disabled={changingApplicationStateLoading || wakeUpDisabled}
              onClick={handleTriggerUnpausing}
            >
              Wake Up
            </Button>

            {wakeUpDisabled && (
              <Alert severity="warning" className="mx-auto max-w-xs text-left">
                Note: Only one free project can be active at any given time.
                Please pause your active free project before unpausing{' '}
                {currentProject.name}.
              </Alert>
            )}

            {isOwner && (
              <Button
                color="error"
                variant="borderless"
                className="mx-auto w-full max-w-[280px]"
                onClick={() => setShowDeletingModal(true)}
              >
                Delete Project
              </Button>
            )}
          </div>
        </Box>

        <StagingMetadata>
          <ApplicationInfo />
        </StagingMetadata>
      </Container>
    </>
  );
}
