import { Divider, Paper, Typography } from '@linode/ui';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { UserSSHKeyPanel } from 'src/components/AccessPanel/UserSSHKeyPanel';
import { Skeleton } from 'src/components/Skeleton';
import { useRestrictedGlobalGrantCheck } from 'src/hooks/useRestrictedGlobalGrantCheck';

import type { CreateLinodeRequest } from '@linode/api-v4';

const PasswordInput = React.lazy(() =>
  import('src/components/PasswordInput/PasswordInput').then((module) => ({
    default: module.PasswordInput,
  }))
);

export const Security = () => {
  const { control } = useFormContext<CreateLinodeRequest>();

  const isLinodeCreateRestricted = useRestrictedGlobalGrantCheck({
    globalGrantType: 'add_linodes',
  });

  return (
    <Paper>
      <Typography sx={{ mb: 2 }} variant="h2">
        Security
      </Typography>
      <React.Suspense
        fallback={
          <Skeleton
            sx={(theme) => ({ height: '89px', maxWidth: theme.inputMaxWidth })}
          />
        }
      >
        <Controller
          control={control}
          name="root_pass"
          render={({ field, fieldState }) => (
            <PasswordInput
              autoComplete="off"
              disabled={isLinodeCreateRestricted}
              errorText={fieldState.error?.message}
              id="linode-password"
              label="Root Password"
              name="password"
              noMarginTop
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="Enter a password."
              value={field.value ?? ''}
            />
          )}
        />
      </React.Suspense>
      <Divider spacingBottom={20} spacingTop={24} />
      <Controller
        control={control}
        name="authorized_users"
        render={({ field }) => (
          <UserSSHKeyPanel
            authorizedUsers={field.value ?? []}
            disabled={isLinodeCreateRestricted}
            setAuthorizedUsers={field.onChange}
          />
        )}
      />
    </Paper>
  );
};
