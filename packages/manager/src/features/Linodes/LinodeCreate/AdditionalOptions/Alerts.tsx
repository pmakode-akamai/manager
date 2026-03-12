import { getFeatureChip } from '@linode/shared';
import { Accordion } from '@linode/ui';
import * as React from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Link } from 'src/components/Link';
import { AlertReusableComponent } from 'src/features/CloudPulse/Alerts/ContextualView/AlertReusableComponent';
import { AlertsPanel } from 'src/features/Linodes/LinodesDetail/LinodeAlerts/AlertsPanel';
import { useFlags } from 'src/hooks/useFlags';

import { AclpPreferenceToggle } from '../../AclpPreferenceToggle';
import { EMPTY_ACLP_ALERTS } from '../utilities';

import type { LinodeCreateFormValues } from '../utilities';
import type { CloudPulseAlertsPayload } from '@linode/api-v4';

interface AlertsProps {
  isAlertsAclpEnabledMode: boolean;
  onAlertsModeChange: (isAclpEnabled: boolean) => void;
}

export const Alerts = ({
  onAlertsModeChange,
  isAlertsAclpEnabledMode,
}: AlertsProps) => {
  const { aclpServices } = useFlags();

  const { control } = useFormContext<LinodeCreateFormValues>();
  const { field } = useController({
    control,
    name: 'alerts',
    defaultValue: EMPTY_ACLP_ALERTS,
  });

  const handleToggleAlert = (updatedAlerts: CloudPulseAlertsPayload) => {
    field.onChange(updatedAlerts);
  };

  const subHeading = isAlertsAclpEnabledMode ? (
    <>
      Receive notifications through System Alerts when metric thresholds are
      exceeded. After you&apos;ve created your Linode, you can create and manage
      associated alerts on the <strong>centralized Alerts</strong> page.{' '}
      <Link to="https://techdocs.akamai.com/cloud-computing/docs/configure-email-alerts-for-resource-usage-on-compute-instances">
        Learn more
      </Link>
      .
    </>
  ) : (
    'Configure the alert notifications to be sent when metric thresholds are exceeded.'
  );

  return (
    <Accordion
      detailProps={{ sx: { p: 0 } }}
      heading="Alerts"
      headingChip={
        isAlertsAclpEnabledMode
          ? getFeatureChip(aclpServices?.linode?.alerts ?? {})
          : null
      }
      subHeading={subHeading}
      summaryProps={{ sx: { p: 0 } }}
    >
      <AclpPreferenceToggle
        isAlertsAclpEnabledMode={isAlertsAclpEnabledMode}
        onAlertsModeChange={onAlertsModeChange}
        type="alerts"
      />
      {isAlertsAclpEnabledMode ? (
        // ACLP Alerts View
        <AlertReusableComponent
          onToggleAlert={handleToggleAlert}
          paperSx={{ p: 0 }}
          serviceType="linode"
        />
      ) : (
        // Legacy Alerts View (read-only with default values)
        <AlertsPanel paperSx={{ p: 0 }} />
      )}
    </Accordion>
  );
};
