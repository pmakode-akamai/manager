import React from 'react';

import { renderWithTheme } from 'src/utilities/testHelpers';

import { firewallRuleToRowData } from './FirewallRuleTable';

import type { ExtendedFirewallRule } from './firewallRuleEditor';

describe('Firewall rule table tests', () => {
  describe('firewallRuleToRowData', () => {
    it('transforms a FirewallRuleType to the appropriate row', () => {
      const rule: ExtendedFirewallRule = {
        action: 'ACCEPT',
        addresses: { ipv4: ['0.0.0.0/0'], ipv6: ['::/0'] },
        originalIndex: 0,
        ports: '22',
        protocol: 'TCP',
        status: 'NOT_MODIFIED',
      };
      const rowData = firewallRuleToRowData([rule])[0];

      expect(rowData).toHaveProperty('type', 'SSH');
      expect(rowData).toHaveProperty('protocol', 'TCP');
      expect(rowData).toHaveProperty('ports', '22');

      // eslint-disable-next-line react/jsx-no-useless-fragment
      const { getByText } = renderWithTheme(<>{rowData.addresses}</>);
      expect(getByText('All IPv4, All IPv6')).toBeVisible();
    });
  });
});
