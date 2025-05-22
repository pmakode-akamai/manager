import { Paper, Typography } from '@linode/ui';
import React from 'react';

import Alerts from '../Alerts/Alerts';
import { DiskEncryption } from './DiskEncryption';
import { UserData } from './UserData/UserData';

export const AdditionalOptions = () => {
  return (
    <Paper>
      <Typography
        sx={(theme) => ({ mb: theme.spacingFunction(16) })}
        variant="h2"
      >
        Additional Options
      </Typography>
      <DiskEncryption />
      <Alerts />
      <UserData />
    </Paper>
  );
};
