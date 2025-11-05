/* eslint-disable sonarjs/no-hardcoded-ip */

import { prop, sortBy } from 'ramda';

import type { APIError } from '@linode/api-v4/lib/types';
export type Category = 'inbound' | 'outbound';
export type FirewallRuleTableRowType = 'rule' | 'ruleset';

export interface FirewallRuleError {
  category: string;
  formField: string;
  idx: number;
  ip?: {
    idx: number;
    type: string;
  };
  reason: string;
}

// This is not the most efficient or elegant data structure ever,
// but it makes it easier to test and work with presets without having to .find()
// in multiple places.
export const PORT_PRESETS = {
  '22': { label: 'SSH (22)', value: '22' },
  '53': { label: 'DNS (53)', value: '53' },
  '80': { label: 'HTTP (80)', value: '80' },
  '443': { label: 'HTTPS (443)', value: '443' },
  '3306': { label: 'MySQL (3306)', value: '3306' },
  ALL: { label: 'Allow All', value: '1-65535' },
  CUSTOM: { label: 'Custom', value: 'CUSTOM' },
};

export const PORT_PRESETS_ITEMS = sortBy(
  prop('label'),
  Object.values(PORT_PRESETS)
);

/**
 * The API returns very good Firewall error messages that look like this:
 *
 *   {
 *     "reason": "Must contain only valid IPv4 addresses or networks",
 *     "field": "rules.inbound[0].addresses.ipv4[0]"
 *   }
 *
 * This function parses the "field" into a data structure usable by downstream components.
 */
export const parseFirewallRuleError = (
  error: APIError
): FirewallRuleError | null => {
  const { field, reason } = error;

  if (!field) {
    return null;
  }

  const category = field.match(/inbound|outbound/)?.[0];
  const idx = field.match(/\d+/)?.[0];
  const formField = field.match(/ports|protocol|addresses/)?.[0];
  const ipType = field.match(/ipv4|ipv6/)?.[0];
  const ipIdx = field.match(/(ipv4|ipv6)\[(\d+)\]/)?.[2];

  if (!category || !idx || !formField) {
    return null;
  }

  const result: FirewallRuleError = {
    category,
    formField,
    idx: +idx,
    reason,
  };

  if (ipType && ipIdx) {
    result.ip = {
      idx: +ipIdx,
      type: ipType,
    };
  }

  return result;
};

/**
 * Sorts ports string returned by the API into something more intuitive for users.
 * Examples:
 * "80, 22" --> "22, 80"
 * "443, 22, 80-81" --> "22, 80-81, 443"
 */
export const sortPortString = (portString: string) => {
  try {
    const ports = portString.split(',');
    return ports
      .sort(sortString)
      .map((port) => port.trim())
      .join(', ');
  } catch {
    // API responses should always work with this logic,
    // but in case we get bad input, return the unsorted/unaltered string.
    return portString;
  }
};

// Custom sort helper for working with port strings
export const sortString = (_a: string, _b: string) => {
  const a = Number(stripHyphen(_a));
  const b = Number(stripHyphen(_b));
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
};

// If a port range is included (80-1000) return the first element of the range
const stripHyphen = (str: string) => {
  return str.match(/-/) ? str.split('-')[0] : str;
};

//  API response using rulesetid
export const rulesetResponse = {
  created: '2018-01-01T00:01:01',
  id: 123,
  version: 2,
  label: 'ruleset123',
  description: 'An example Rule Set description',
  type: 'inbound',
  is_service_defined: false,
  rules: [
    {
      action: 'ACCEPT',
      addresses: {
        ipv6: [
          'pl:system:resolvers:us-iad:staging',
          '2001:DB8::/128',
          'pl:system:object-storage:no-osl-1',
        ],
      },
      description: 'An example firewall rule description',
      label: 'ruleset rule-1',
      ports: '22-24, 80, 443, 6443',
      protocol: 'TCP',
    },
    {
      action: 'ACCEPT',
      addresses: {
        ipv4: ['198.51.100.2/32'],
        ipv6: ['pl::vpcs:1234', '2001:DB8::/128', '2001:DB8::/256'],
      },
      description: 'An example firewall rule 2 description',
      label: 'ruleset rule-2',
      ports: '80, 443, 6443',
      protocol: 'UDP',
    },
    {
      action: 'ACCEPT',
      addresses: {
        ipv4: ['198.51.100.2/32'],
      },
      description: 'An example firewall rule 3 description',
      label: 'ruleset rule-3',
      ports: '80, 443, 6443',
      protocol: 'UDP',
    },
  ],
  updated: '2019-01-01T00:01:01',
  deleted: null,
};

export const firewallRuleCreateOptions = [
  {
    label: 'Create a Rule',
    purpose: 'rule',
    description: 'Create a new firewall rule',
  },
  {
    label: 'Reference ruleset',
    purpose: 'ruleset',
    description: 'Reference a ruleset to the firewall',
  },
] as const;
