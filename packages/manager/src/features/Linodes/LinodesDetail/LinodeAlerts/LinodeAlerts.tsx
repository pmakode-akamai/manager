import { useGrants, usePreferences } from '@linode/queries';
import { Box, Notice } from '@linode/ui';
import * as React from 'react';
import { useParams } from 'react-router-dom';

import { useFlags } from 'src/hooks/useFlags';

import { AclpPreferenceToggle } from '../AclpPreferenceToggle';
import { LinodeSettingsAlertsPanel } from '../LinodeSettings/LinodeSettingsAlertsPanel';

interface Props {
  isAclpAlertsSupportedRegion: boolean;
}

const LinodeAlerts = (props: Props) => {
  const { isAclpAlertsSupportedRegion } = props;
  const { linodeId } = useParams<{ linodeId: string }>();
  const id = Number(linodeId);
  const flags = useFlags();
  const { data: grants } = useGrants();
  const { data: isAclpAlertsPreferenceBeta } = usePreferences(
    (preferences) => preferences?.isAclpAlertsBeta
  );

  const isReadOnly =
    grants !== undefined &&
    grants?.linode.find((grant) => grant.id === id)?.permissions ===
      'read_only';

  return (
    <Box>
      {flags.aclpIntegration ? (
        isAclpAlertsSupportedRegion ? (
          <AclpPreferenceToggle type="alerts" />
        ) : (
          <Notice variant="info">
            The resources/entities regions you have chosen are not supported for
            the new Alerts.
          </Notice>
        )
      ) : null}

      {flags.aclpIntegration &&
      isAclpAlertsSupportedRegion &&
      isAclpAlertsPreferenceBeta ? (
        // Beta ACLP Alerts View
        <Notice variant="info">ACLP Alerts Coming soon...</Notice>
      ) : (
        // Legacy Alerts View
        <LinodeSettingsAlertsPanel isReadOnly={isReadOnly} linodeId={id} />
      )}
    </Box>
  );
};

export default LinodeAlerts;
