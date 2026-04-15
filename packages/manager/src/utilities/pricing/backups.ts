import { getPriceForInterval } from './priceInterval';

import type { ExtendedType } from '../extendType';
import type { Linode, LinodeType, PriceObject } from '@linode/api-v4';
import type { PricingInterval } from 'src/featureFlags';

/**
 * Gets the backup price of a Linode type for a specific region.
 *
 * @param type The Linode Type
 * @param regionId The region to get the price for
 * @returns backup pricing information for this specific linode type in a region
 */
export const getLinodeBackupPrice = (
  type: LinodeType,
  regionId: string
): PriceObject | undefined => {
  if (!type || !regionId) {
    return undefined;
  }
  const regionSpecificBackupPrice = type.addons.backups.region_prices?.find(
    (regionPrice) => regionPrice.id === regionId
  );

  if (regionSpecificBackupPrice) {
    return {
      hourly: regionSpecificBackupPrice.hourly,
      monthly: regionSpecificBackupPrice.monthly,
    };
  }

  return type.addons.backups.price;
};

interface BackupsPriceOptions {
  /**
   * Billing interval driven by the LD flag.
   * Defaults to 'monthly' for backward compatibility.
   */
  interval?: PricingInterval;
  region: string | undefined;
  type: ExtendedType | LinodeType | undefined;
}

/**
 * Returns the backup price for a single Linode at the given billing interval.
 * The interval is driven by the LD flag — pass `usePricingInterval()` from the caller.
 * If price cannot be calculated, returns undefined.
 */
export const getMonthlyBackupsPrice = ({
  interval = 'monthly',
  region,
  type,
}: BackupsPriceOptions): null | number | undefined => {
  if (!region || !type) {
    return undefined;
  }

  return getPriceForInterval(getLinodeBackupPrice(type, region), interval);
};

export interface TotalBackupsPriceOptions {
  /**
   * Billing interval driven by the LD flag.
   * Defaults to 'monthly' for backward compatibility.
   */
  interval?: PricingInterval;
  /**
   * List of linodes without backups enabled
   */
  linodes: Linode[];
  /**
   * List of types for the linodes without backups
   */
  types: LinodeType[];
}

/**
 * Returns the summed backup price for all Linodes without backups at the given billing interval.
 * The interval is driven by the LD flag — pass `usePricingInterval()` from the caller.
 * If price cannot be calculated, returns undefined.
 */
export const getTotalBackupsPrice = ({
  interval = 'monthly',
  linodes,
  types,
}: TotalBackupsPriceOptions) => {
  return linodes.reduce((prevValue: number | undefined, linode: Linode) => {
    const type = types.find((type) => type.id === linode.type);

    if (!type) {
      return undefined;
    }

    const backupsPrice = getMonthlyBackupsPrice({
      interval,
      region: linode.region,
      type,
    });

    if (backupsPrice === null || backupsPrice === undefined) {
      return undefined;
    }

    return prevValue !== undefined ? prevValue + backupsPrice : undefined;
  }, 0);
};
