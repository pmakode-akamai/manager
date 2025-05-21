import { useMutatePreferences, usePreferences } from '@linode/queries';
import { Button, Typography } from '@linode/ui';
import React from 'react';

import { DismissibleBanner } from 'src/components/DismissibleBanner/DismissibleBanner';
import { Skeleton } from 'src/components/Skeleton';

import type { ManagerPreferences } from '@linode/utilities';

export interface AclpPreferenceToggleType {
  linodeId?: number;
  type: 'alerts' | 'metrics';
}

interface PreferenceConfigItem {
  getBannerText: (isBeta: boolean | undefined) => JSX.Element;
  getButtonText: (isBeta: boolean | undefined) => string;
  getUpdatePayload: (
    isCurrentBeta: boolean | undefined,
    linodeId: number | undefined,
    currentPreferences: ManagerPreferences | undefined
  ) => any;
  preferenceKey: string;
  usePreferenceSelector: (
    preferences: ManagerPreferences | undefined,
    linodeId?: number
  ) => boolean | undefined;
}

const preferenceConfig: Record<
  AclpPreferenceToggleType['type'],
  PreferenceConfigItem
> = {
  metrics: {
    usePreferenceSelector: (preferences, linodeId) => {
      return linodeId !== undefined
        ? preferences?.aclpBetaMetricsPreferences?.edit_flows[linodeId]
        : preferences?.aclpBetaMetricsPreferences?.create_flows;
    },
    preferenceKey: 'metrics-preference',
    getUpdatePayload: (isCurrentBeta, linodeId, currentPreferences) => {
      if (linodeId !== undefined) {
        return {
          aclpBetaMetricsPreferences: {
            ...currentPreferences?.aclpBetaMetricsPreferences,
            edit_flows: {
              ...currentPreferences?.aclpBetaMetricsPreferences?.edit_flows,
              [linodeId]: !isCurrentBeta,
            },
          },
        };
      }
      return {
        aclpBetaMetricsPreferences: {
          ...currentPreferences?.aclpBetaMetricsPreferences,
          create_flows: !isCurrentBeta,
        },
      };
    },
    getButtonText: (isBeta) =>
      isBeta ? 'Switch to legacy Metrics' : 'Try the Metrics (Beta)',
    getBannerText: (isBeta) =>
      isBeta ? (
        <span>
          Welcome to <strong>Metrics (Beta)</strong> with more options and
          greater flexibility for better data analysis.
        </span>
      ) : (
        <span>
          Try the new <strong>Metrics (Beta)</strong> with more options and
          greater flexibility for better data analysis. You can switch back to
          the current view at any time.
        </span>
      ),
  },
  alerts: {
    usePreferenceSelector: (preferences, linodeId) => {
      return linodeId !== undefined
        ? preferences?.aclpBetaAlertsPreferences?.edit_flows[linodeId]
        : preferences?.aclpBetaAlertsPreferences?.create_flows;
    },
    preferenceKey: 'alerts-preference',
    getUpdatePayload: (isCurrentBeta, linodeId, currentPreferences) => {
      if (linodeId !== undefined) {
        return {
          aclpBetaAlertsPreferences: {
            ...currentPreferences?.aclpBetaAlertsPreferences,
            edit_flows: {
              ...currentPreferences?.aclpBetaAlertsPreferences?.edit_flows,
              [linodeId]: !isCurrentBeta,
            },
          },
        };
      }
      return {
        aclpBetaAlertsPreferences: {
          ...currentPreferences?.aclpBetaAlertsPreferences,
          create_flows: !isCurrentBeta,
        },
      };
    },
    getButtonText: (isBeta) =>
      isBeta ? 'Switch to legacy Alerts' : 'Try Alerts (Beta)',
    getBannerText: (isBeta) =>
      isBeta ? (
        <span>
          Welcome to <strong>Alerts (Beta)</strong> with more options and
          greater flexibility.
        </span>
      ) : (
        <span>
          Try the new <strong>Alerts (Beta)</strong> for more options, including
          customizable alerts. You can switch back to the current view at any
          time.
        </span>
      ),
  },
};

export const AclpPreferenceToggle = ({
  type,
  linodeId,
}: AclpPreferenceToggleType) => {
  const config = preferenceConfig[type];

  const { data: preferences, isLoading } = usePreferences();
  const isBeta = config.usePreferenceSelector(preferences, linodeId);

  const { mutateAsync: updatePreferences } = useMutatePreferences();

  if (isLoading) {
    return (
      <Skeleton
        data-testid={`${type}-preference-skeleton`}
        height="90px"
        sx={(theme) => ({
          marginTop: `-${theme.tokens.spacing.S20}`,
        })}
      />
    );
  }

  return (
    <DismissibleBanner
      actionButton={
        <Button
          buttonType="primary"
          onClick={() =>
            updatePreferences(
              config.getUpdatePayload(isBeta, linodeId, preferences)
            )
          }
          sx={{ textTransform: 'none' }}
        >
          {config.getButtonText(isBeta)}
        </Button>
      }
      dismissible={false}
      forceImportantIconVerticalCenter
      preferenceKey={config.preferenceKey}
      variant="info"
    >
      <Typography data-testid={`${type}-preference-banner-text`}>
        {config.getBannerText(isBeta)}
      </Typography>
    </DismissibleBanner>
  );
};
