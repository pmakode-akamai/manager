import { Paper, Typography } from '@linode/ui';
import React from 'react';

import Alerts from './Alerts/Alerts';

export const AdditionalOptions = () => {
  return (
    <Paper>
      <Typography
        sx={(theme) => ({ mb: theme.spacingFunction(16) })}
        variant="h2"
      >
        Additional Options
      </Typography>
      <Alerts />
    </Paper>
  );
};
