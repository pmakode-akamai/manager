import { Paper, Typography } from '@linode/ui';
import React from 'react';

import { DiskEncryption } from './DiskEncryption';
import { UserData } from './UserData/UserData';

export const AdditionalOptions = () => {
  return (
    <Paper>
      <Typography variant="h2">Additional Options</Typography>
      <DiskEncryption />
      <UserData />
    </Paper>
  );
};
