// import { useNodeBalancerQuery } from '@linode/queries';
import { Box } from '@linode/ui';
import { useParams } from '@tanstack/react-router';
import * as React from 'react';

import { CloudPulseDashboardWithFilters } from 'src/features/CloudPulse/Dashboard/CloudPulseDashboardWithFilters';
// import { useIsAclpSupportedRegion } from 'src/features/CloudPulse/Utils/utils';
// import { useFlags } from 'src/hooks/useFlags';

export const NodebalancerMetrics = () => {
  const { id: nodebalancerId } = useParams({
    from: '/nodebalancers/$id/metrics',
  });
  const nodebalancerDashboardId = 3;

  return (
    <Box>
      <CloudPulseDashboardWithFilters
        dashboardId={nodebalancerDashboardId}
        resource={nodebalancerId}
      />
    </Box>
  );
};
