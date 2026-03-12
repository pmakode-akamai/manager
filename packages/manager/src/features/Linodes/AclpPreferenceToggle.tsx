import { useMutatePreferences, usePreferences } from '@linode/queries';
import { Button, Typography } from '@linode/ui';
import React, { type JSX } from 'react';

import { DismissibleBanner } from 'src/components/DismissibleBanner/DismissibleBanner';
import { Skeleton } from 'src/components/Skeleton';
import { useFlags } from 'src/hooks/useFlags';

export interface AclpPreferenceToggleType {
  /**
   * Alerts toggle state. Use only when type is `alerts`
   */
  isAlertsAclpEnabledMode?: boolean;
  /**
   * Handler for alerts toggle. Use only when type is `alerts`
   */
  onAlertsModeChange?: (isAclpEnabled: boolean) => void;
  /**
   * Toggle type: `alerts` or `metrics`
   */
  type: 'alerts' | 'metrics';
}

interface PreferenceConfigItem {
  getBannerText: (isAclp: boolean | undefined, isBeta?: boolean) => JSX.Element;
  getButtonText: (isAclp: boolean | undefined, isBeta?: boolean) => string;
  preferenceKey: string;
}

const preferenceConfig: Record<
  AclpPreferenceToggleType['type'],
  PreferenceConfigItem
> = {
  metrics: {
    preferenceKey: 'metrics-preference',
    getButtonText: (isAclp, isBeta) =>
      isAclp
        ? 'Switch to legacy Metrics'
        : `Try the ${isBeta ? 'Metrics (Beta)' : 'new Metrics'}`,
    getBannerText: (isAclp, isBeta) =>
      isAclp ? (
        <span>
          Welcome to{' '}
          <strong>{isBeta ? 'Metrics (Beta)' : 'new Metrics'}</strong> with more
          options and greater flexibility for better data analysis.
        </span>
      ) : (
        <span>
          Try the <strong>{isBeta ? 'Metrics (Beta)' : 'new Metrics'}</strong>{' '}
          with more options and greater flexibility for better data analysis.
          You can switch back to the current view at any time.
        </span>
      ),
  },
  alerts: {
    preferenceKey: 'alerts-preference',
    getButtonText: (isAclp, isBeta) =>
      isAclp
        ? 'Switch to legacy Alerts'
        : `Try ${isBeta ? 'Alerts (Beta)' : 'new Alerts'}`,
    getBannerText: (isAclp, isBeta) =>
      isAclp ? (
        <span>
          Welcome to <strong>{isBeta ? 'Alerts (Beta)' : 'new Alerts'}</strong>,
          designed for flexibility with features like customizable alerts.
        </span>
      ) : (
        <span>
          Try the <strong>{isBeta ? 'Alerts (Beta)' : 'new Alerts'}</strong>,
          featuring new options like customizable alerts. You can switch back to
          legacy Alerts at any time.
        </span>
      ),
  },
};

/**
 * - For Alerts, the toggle uses local state, not preferences. We do this because each Linode should manage its own alert mode individually.
 *   - Create Linode: Toggle defaults to false (legacy mode). It's a simple UI toggle with no persistence.
 *
 * - For Metrics, we use account-level preferences, since it's a global setting shared across all Linodes.
 */
export const AclpPreferenceToggle = (props: AclpPreferenceToggleType) => {
  const { isAlertsAclpEnabledMode, onAlertsModeChange, type } = props;

  const config = preferenceConfig[type];

  const { aclpServices } = useFlags();

  const isBeta = aclpServices?.linode?.[type]?.beta;

  // -------------------- Metrics related logic ------------------------
  const { data: isAclpMetricsBeta, isLoading: isAclpMetricsBetaLoading } =
    usePreferences((preferences) => {
      return preferences?.isAclpMetricsBeta;
    }, type === 'metrics');

  const { mutateAsync: updatePreferences } = useMutatePreferences();

  if (isAclpMetricsBetaLoading) {
    return (
      <Skeleton
        data-testid="metrics-preference-skeleton"
        height="90px"
        sx={(theme) => ({
          marginTop: `-${theme.tokens.spacing.S20}`,
        })}
      />
    );
  }
  // -------------------------------------------------------------------

  const isAclp =
    type === 'alerts' ? isAlertsAclpEnabledMode : isAclpMetricsBeta;
  const handleBetaToggle = () => {
    if (type === 'alerts' && onAlertsModeChange) {
      onAlertsModeChange(!isAclp);
    } else {
      updatePreferences({ isAclpMetricsBeta: !isAclp });
    }
  };

  return (
    <DismissibleBanner
      actionButton={
        <Button
          buttonType="primary"
          onClick={handleBetaToggle}
          sx={{ textTransform: 'none' }}
        >
          {config.getButtonText(isAclp, isBeta)}
        </Button>
      }
      dismissible={false}
      forceImportantIconVerticalCenter
      preferenceKey={config.preferenceKey}
      variant="info"
    >
      <Typography data-testid={`${type}-preference-banner-text`}>
        {config.getBannerText(isAclp, isBeta)}
      </Typography>
    </DismissibleBanner>
  );
};
