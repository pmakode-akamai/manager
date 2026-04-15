import { useFlags } from 'src/hooks/useFlags';

import { getLabelForInterval, getPriceForInterval } from './priceInterval';

import type { PriceObject } from '@linode/api-v4';

/**
 * Reads the active billing interval from the `computePricing` LD flag and
 * returns pre-bound helpers for pricing display.
 *
 * Use this instead of reading the flag directly in components.
 *
 * @example
 * const { getPrice, priceLabel } = usePricingInterval();
 * <Currency quantity={getPrice(type.addons.backups.price)} /> per {priceLabel}
 */
export const usePricingInterval = () => {
  const { computePricing } = useFlags();
  const interval: keyof PriceObject = computePricing?.interval ?? 'monthly';

  return {
    /**
     * The active interval - (eg., `'hourly'`, `'monthly'`, etc.).
     */
    interval,
    /**
     * Gets the price value for the active interval from a PriceObject.
     */
    getPrice: (price: null | PriceObject | undefined) =>
      getPriceForInterval(price, interval),
    /**
     * Short label for the active interval - `'hr'` or `'mo'`.
     */
    priceLabel: getLabelForInterval(interval),
  };
};
