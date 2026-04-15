import { useFlags } from 'src/hooks/useFlags';
import {
  getLabelForInterval,
  getPriceForInterval,
} from 'src/utilities/pricing/priceInterval';

import type { PriceObject } from '@linode/api-v4';
import type { PricingInterval } from 'src/featureFlags';

/**
 * Returns the active pricing interval driven by the LD flag `pricingDisplayInterval`.
 * Defaults to 'monthly' if the flag is not set.
 *
 * Flip the LD flag to switch between 'monthly', 'hourly', or 'minutely' (future)
 * without a code deploy.
 */
export const usePricingInterval = (): PricingInterval => {
  const flags = useFlags();
  return flags.pricingDisplayInterval?.interval ?? 'monthly';
};

/**
 * Returns the UI label string for the active pricing interval (e.g. 'hr', 'mo', 'min').
 * Use this for `<DisplayPrice interval={...}>` or inline `/${label}` patterns.
 */
export const usePricingIntervalLabel = (): string => {
  const interval = usePricingInterval();
  return getLabelForInterval(interval);
};

/**
 * Given a full PriceObject from the API, returns the correct price value
 * for the currently active pricing interval (from the LD flag).
 *
 * This is the primary hook for components that hold a PriceObject — they don't
 * need to know or care which interval is active.
 *
 * @example
 * const price = getLinodeRegionPrice(type, regionId);
 * const value = usePriceForInterval(price); // returns price.hourly or price.monthly etc.
 * <DisplayPrice interval={usePricingIntervalLabel()} price={value ?? 0} />
 */
export const usePriceForInterval = (
  price: null | PriceObject | undefined
): null | number | undefined => {
  const interval = usePricingInterval();
  return getPriceForInterval(price, interval);
};
