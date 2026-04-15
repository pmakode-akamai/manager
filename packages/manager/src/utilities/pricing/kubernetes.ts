import { getLinodeRegionPrice } from './linodes';
import { getPriceForInterval } from './priceInterval';

import type {
  CreateNodePoolData,
  KubeNodePoolResponse,
  LinodeType,
  Region,
} from '@linode/api-v4/lib';
import type { PricingInterval } from 'src/featureFlags';

interface KubernetesNodePriceOptions {
  count: number;
  /**
   * Billing interval driven by the LD flag.
   * Defaults to 'monthly' for backward compatibility.
   */
  interval?: PricingInterval;
  region: Region['id'] | undefined;
  type: LinodeType | string;
  types: LinodeType[];
}

interface TotalClusterPriceOptions {
  enterprisePrice?: number;
  highAvailabilityPrice?: number;
  /**
   * Billing interval driven by the LD flag.
   * Defaults to 'monthly' for backward compatibility.
   */
  interval?: PricingInterval;
  pools: (CreateNodePoolData | KubeNodePoolResponse)[];
  region: Region['id'] | undefined;
  types: LinodeType[];
}

/**
 * Calculates the price of a Kubernetes node pool based on region, types, and billing interval.
 * The interval is driven by the LD flag — pass `usePricingInterval()` from the caller.
 * @returns The price for the node pool at the given interval, or undefined if it cannot be calculated
 */
export const getKubernetesMonthlyPrice = ({
  count,
  interval = 'monthly',
  region,
  type,
  types,
}: KubernetesNodePriceOptions) => {
  if (!types || !type || !region) {
    return undefined;
  }
  const thisType = types.find((t) => t.id === type);

  const nodePrice = getPriceForInterval(
    getLinodeRegionPrice(thisType, region),
    interval
  );

  return nodePrice ? nodePrice * count : nodePrice;
};

/**
 * Calculates the total price of all pools in a cluster, plus HA if enabled.
 * The interval is driven by the LD flag — pass `usePricingInterval()` from the caller.
 * @returns The total cluster price at the given interval
 */
export const getTotalClusterPrice = ({
  enterprisePrice,
  highAvailabilityPrice,
  interval = 'monthly',
  pools,
  region,
  types,
}: TotalClusterPriceOptions) => {
  const price = pools.reduce((accumulator, node) => {
    const nodePrice = getKubernetesMonthlyPrice({
      count: node.count,
      interval,
      region,
      type: node.type,
      types,
    });
    return accumulator + (nodePrice ?? 0);
  }, 0);

  if (enterprisePrice) {
    return price + enterprisePrice;
  }
  if (highAvailabilityPrice) {
    return price + highAvailabilityPrice;
  }

  return price;
};
