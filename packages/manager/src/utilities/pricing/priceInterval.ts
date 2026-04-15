import type { PriceObject } from '@linode/api-v4';

/**
 * Display labels for each billing interval.
 */
export const PRICING_INTERVAL_LABELS: Record<keyof PriceObject, string> = {
  hourly: 'hr',
  monthly: 'mo',
};

/**
 * Returns the price value for the given interval from a PriceObject.
 *
 * Falls back to `price.monthly` if the interval key doesn't exist yet on the
 * API response — this can happen when the LD flag is rolled out before the API
 * ships the new field.
 *
 * @example
 * getPriceForInterval(price, 'hourly'); // price.hourly
 */
export const getPriceForInterval = (
  price: null | PriceObject | undefined,
  interval: keyof PriceObject
): null | number | undefined => {
  if (!price) {
    return undefined;
  }
  return interval in price ? price[interval] : price.monthly;
};

/**
 * Returns the display label for a given interval — e.g. `'hr'` or `'mo'`.
 */
export const getLabelForInterval = (interval: keyof PriceObject): string =>
  PRICING_INTERVAL_LABELS[interval];
