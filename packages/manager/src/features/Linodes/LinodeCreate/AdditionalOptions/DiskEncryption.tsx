import { useRegionsQuery } from '@linode/queries';
import { Accordion, Divider } from '@linode/ui';
import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import {
  DISK_ENCRYPTION_DEFAULT_DISTRIBUTED_INSTANCES,
  DISK_ENCRYPTION_DISTRIBUTED_DESCRIPTION,
  DISK_ENCRYPTION_GENERAL_DESCRIPTION,
  DISK_ENCRYPTION_UNAVAILABLE_IN_REGION_COPY,
} from 'src/components/Encryption/constants';
import { Encryption } from 'src/components/Encryption/Encryption';
import { useIsDiskEncryptionFeatureEnabled } from 'src/components/Encryption/utils';
import { getIsDistributedRegion } from 'src/components/RegionSelect/RegionSelect.utils';

import type { CreateLinodeRequest } from '@linode/api-v4';

export const DiskEncryption = () => {
  const { control } = useFormContext<CreateLinodeRequest>();
  const { data: regions } = useRegionsQuery();
  const regionId = useWatch({ control, name: 'region' });
  const { isDiskEncryptionFeatureEnabled } =
    useIsDiskEncryptionFeatureEnabled();

  if (!isDiskEncryptionFeatureEnabled) {
    return null;
  }

  const selectedRegion = regions?.find((r) => r.id === regionId);

  // "Disk Encryption" indicates general availability and "LA Disk Encryption" indicates limited availability
  const regionSupportsDiskEncryption =
    selectedRegion?.capabilities.includes('Disk Encryption') ||
    selectedRegion?.capabilities.includes('LA Disk Encryption');

  const isDistributedRegion = getIsDistributedRegion(
    regions ?? [],
    selectedRegion?.id ?? ''
  );

  return (
    <>
      <Accordion
        detailProps={{ sx: { p: 0 } }}
        heading="Disk Encryption"
        summaryProps={{ sx: { p: 0 } }}
      >
        <Controller
          control={control}
          name="disk_encryption"
          render={({ field, fieldState }) => (
            <Encryption
              descriptionCopy={
                isDistributedRegion
                  ? DISK_ENCRYPTION_DISTRIBUTED_DESCRIPTION
                  : DISK_ENCRYPTION_GENERAL_DESCRIPTION
              }
              disabled={isDistributedRegion || !regionSupportsDiskEncryption}
              disabledReason={
                isDistributedRegion
                  ? DISK_ENCRYPTION_DEFAULT_DISTRIBUTED_INSTANCES
                  : DISK_ENCRYPTION_UNAVAILABLE_IN_REGION_COPY
              }
              error={fieldState.error?.message}
              isEncryptEntityChecked={
                isDistributedRegion || field.value === 'enabled'
              }
              onChange={(checked) =>
                field.onChange(checked ? 'enabled' : 'disabled')
              }
              showHeader={false}
            />
          )}
        />
      </Accordion>
      <Divider />
    </>
  );
};
