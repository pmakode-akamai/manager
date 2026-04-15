import type { PriceObject } from '@linode/api-v4';
import type { PricingInterval } from 'src/featureFlags';

/**
 * Maps a PricingInterval to its UI display label.
 */
export const PRICING_INTERVAL_LABELS: Record<PricingInterval, string> = {
  hourly: 'hr',
  minutely: 'min',
  monthly: 'mo',
};

/**
 * Pure function — no hooks, safe to call anywhere including non-React utilities.
 *
 * Extracts the correct price value from a PriceObject for a given interval.
 * Uses the interval as a direct key when the API supports it; falls back to
 * 'monthly' for intervals not yet present on PriceObject (e.g. 'minutely').
 * No map to maintain — when the API adds a new field and PriceObject is updated,
 * this just works.
 *
 * @example
 * const value = getPriceForInterval(price, 'hourly'); // price.hourly
 */
export const getPriceForInterval = (
  price: null | PriceObject | undefined,
  interval: PricingInterval
): null | number | undefined => {
  if (!price) {
    return undefined;
  }
  return interval in price
    ? price[interval as keyof PriceObject]
    : price.monthly;
};

/**
 * Returns the display label string for a given interval (e.g. 'hr', 'mo', 'min').
 */
export const getLabelForInterval = (interval: PricingInterval): string =>
  PRICING_INTERVAL_LABELS[interval];
