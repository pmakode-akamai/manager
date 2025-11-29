import { capitalize } from '@linode/utilities';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { firewallPrefixListFactory } from 'src/factories';
import { renderWithTheme } from 'src/utilities/testHelpers';

import * as shared from '../../shared';
import { FirewallPrefixListDrawer } from './FirewallPrefixListDrawer';
import { PREFIXLIST_MARKED_FOR_DELETION_TEXT } from './shared';

import type { FirewallPrefixListDrawerProps } from './FirewallPrefixListDrawer';
import type { FirewallPrefixList } from '@linode/api-v4';

const queryMocks = vi.hoisted(() => ({
  useAllFirewallPrefixListsQuery: vi.fn().mockReturnValue({}),
}));

vi.mock('@linode/queries', async () => {
  const actual = await vi.importActual('@linode/queries');
  return {
    ...actual,
    useAllFirewallPrefixListsQuery: queryMocks.useAllFirewallPrefixListsQuery,
  };
});

vi.mock('@linode/utilities', async () => {
  const actual = await vi.importActual('@linode/utilities');
  return {
    ...actual,
    getUserTimezone: vi.fn().mockReturnValue('utc'),
  };
});

const spy = vi.spyOn(shared, 'useIsFirewallRulesetsPrefixlistsEnabled');

//
// Helper to compute expected UI values/text
//
const computeExpected = (
  category: 'inbound' | 'outbound',
  reference: FirewallPrefixListDrawerProps['reference']
) => {
  let title = 'Prefix List details';
  let button = 'Cancel';
  let label = 'Name:';

  if (reference?.type === 'ruleset' && reference.modeViewedFrom === 'create') {
    title = `Add an ${capitalize(category)} Rule or Rule Set`;
    button = `Back to ${capitalize(category)} Rule Set`;
    label = 'Prefix List Name:';
  }

  if (reference?.type === 'ruleset' && reference.modeViewedFrom === 'view') {
    title = `${capitalize(category)} Rule Set details`;
    button = 'Back to the Rule Set';
    label = 'Prefix List Name:';
  }

  if (reference?.type === 'rule' && reference.modeViewedFrom === 'edit') {
    title = 'Edit Rule';
    button = 'Back to Rule';
    label = 'Prefix List Name:';
  }

  // Default: Especially when there is no drawer reference
  // (for eg., type === rule and modeViewFrom === undefined)
  return { title, button, label };
};

describe('PrefixListDrawer', () => {
  beforeEach(() => {
    spy.mockReturnValue({
      isFirewallRulesetsPrefixlistsFeatureEnabled: true,
      isFirewallRulesetsPrefixListsBetaEnabled: false,
      isFirewallRulesetsPrefixListsLAEnabled: false,
      isFirewallRulesetsPrefixListsGAEnabled: false,
    });

    queryMocks.useAllFirewallPrefixListsQuery.mockReturnValue({
      data: [firewallPrefixListFactory.build()],
    });
  });

  // Default/base props
  const baseProps: Omit<
    FirewallPrefixListDrawerProps,
    'category' | 'reference'
  > = {
    isOpen: true,
    onClose: () => {},
    selectedPrefixListLabel: 'pl-test',
  };

  const drawerProps: FirewallPrefixListDrawerProps[] = [
    {
      ...baseProps,
      category: 'inbound',
      reference: {
        type: 'ruleset',
        modeViewedFrom: 'create',
        plRuleRefTag: '(IPv4, IPv6)',
      },
    },
    {
      ...baseProps,
      category: 'outbound',
      reference: {
        type: 'ruleset',
        modeViewedFrom: 'view',
        plRuleRefTag: '(IPv4)',
      },
    },
    {
      ...baseProps,
      category: 'inbound',
      reference: {
        type: 'rule',
        modeViewedFrom: 'edit',
        plRuleRefTag: '(IPv6)',
      },
    },
    {
      ...baseProps,
      category: 'outbound',
      reference: { type: 'rule', plRuleRefTag: '(IPv4, IPv6)' },
    },
  ];

  it.each(drawerProps)(
    'renders correct UI for category:$category, referenceType:$reference.type and modeViewedFrom:$reference.modeViewedFrom',
    ({ category, reference }) => {
      const { getByText, getByRole } = renderWithTheme(
        <FirewallPrefixListDrawer
          category={category}
          isOpen={true}
          onClose={vi.fn()}
          reference={reference}
          selectedPrefixListLabel="pl-test"
        />
      );

      // Compute expectations
      const { title, button, label } = computeExpected(category, reference);

      // Title
      expect(getByText(title)).toBeVisible();

      // First label (Prefix List Name: OR Name:)
      expect(getByText(label)).toBeVisible();

      // Static detail labels
      [
        'ID:',
        'Description:',
        'Type:',
        'Visibility:',
        'Version:',
        'Created:',
        'Updated:',
      ].forEach((l) => expect(getByText(l)).toBeVisible());

      // Back or Cancel button
      expect(getByRole('button', { name: button })).toBeVisible();
    }
  );

  // Marked for deletion tests
  const deletionCases = [
    {
      description:
        'should not display "Marked for deletion" when prefix list is active',
      deleted: null,
    },
    {
      description:
        'should display "Marked for deletion" when prefix list is deleted',
      deleted: '2025-07-24T04:23:17',
    },
  ];

  it.each(deletionCases)('$description', async ({ deleted }) => {
    const prefixList = firewallPrefixListFactory.build({ deleted });

    queryMocks.useAllFirewallPrefixListsQuery.mockReturnValue({
      data: [prefixList],
    });

    const { getByText, getByTestId, findByText, queryByText } = renderWithTheme(
      <FirewallPrefixListDrawer
        category="inbound"
        isOpen={true}
        onClose={vi.fn()}
        reference={{ type: 'rule', plRuleRefTag: '(IPv6)' }}
        selectedPrefixListLabel="pl-test"
      />
    );

    if (deleted) {
      expect(getByText('Marked for deletion:')).toBeVisible();
      const tooltip = getByTestId('tooltip-info-icon');
      await userEvent.hover(tooltip);
      expect(
        await findByText(PREFIXLIST_MARKED_FOR_DELETION_TEXT)
      ).toBeVisible();
    } else {
      expect(queryByText('Marked for deletion:')).not.toBeInTheDocument();
    }
  });

  const prefixListVariants: Partial<FirewallPrefixList>[] = [
    { name: 'pl::supports-both', ipv4: ['1.1.1.0/24'], ipv6: ['::1/128'] },
    { name: 'pl::supports-only-ipv4', ipv4: ['1.1.1.0/24'], ipv6: null },
    { name: 'pl::supports-only-ipv6', ipv4: null, ipv6: ['::1/128'] },
    { name: 'pl::supports-both-but-ipv4-empty', ipv4: [], ipv6: ['::1/128'] },
    {
      name: 'pl::supports-both-but-ipv6-empty',
      ipv4: ['1.1.1.0/24'],
      ipv6: [],
    },
    { name: 'pl::supports-both-but-both-empty', ipv4: [], ipv6: [] },
  ];

  const ruleReferences: FirewallPrefixListDrawerProps['reference'][] = [
    { plRuleRefTag: '(IPv4)', type: 'rule' },
    { plRuleRefTag: '(IPv6)', type: 'rule' },
    { plRuleRefTag: '(IPv4, IPv6)', type: 'rule' },
  ];

  const rulesSectionCases = [
    // PL supports both
    {
      prefixList: prefixListVariants[0],
      reference: ruleReferences[0],
      expectedIPv4: 'in use',
      expectedIPv6: 'not in use',
    },
    {
      prefixList: prefixListVariants[0],
      reference: ruleReferences[1],
      expectedIPv4: 'not in use',
      expectedIPv6: 'in use',
    },
    {
      prefixList: prefixListVariants[0],
      reference: ruleReferences[2],
      expectedIPv4: 'in use',
      expectedIPv6: 'in use',
    },
    // PL supports only IPv4
    {
      prefixList: prefixListVariants[1],
      reference: ruleReferences[0],
      expectedIPv4: 'in use',
    },
    // PL supports only IPv6
    {
      prefixList: prefixListVariants[2],
      reference: ruleReferences[1],
      expectedIPv6: 'in use',
    },
    // PL IPv4 empty
    {
      prefixList: prefixListVariants[3],
      reference: ruleReferences[0],
      expectedIPv4: 'in use',
      expectedIPv6: 'not in use',
    },
    {
      prefixList: prefixListVariants[3],
      reference: ruleReferences[1],
      expectedIPv4: 'not in use',
      expectedIPv6: 'in use',
    },
    // PL IPv6 empty
    {
      prefixList: prefixListVariants[4],
      reference: ruleReferences[0],
      expectedIPv4: 'in use',
      expectedIPv6: 'not in use',
    },
    {
      prefixList: prefixListVariants[4],
      reference: ruleReferences[1],
      expectedIPv4: 'not in use',
      expectedIPv6: 'in use',
    },
    // PL both empty
    {
      prefixList: prefixListVariants[5],
      reference: ruleReferences[0],
      expectedIPv4: 'in use',
      expectedIPv6: 'not in use',
    },
    {
      prefixList: prefixListVariants[5],
      reference: ruleReferences[1],
      expectedIPv4: 'not in use',
      expectedIPv6: 'in use',
    },
  ];

  // rulesSectionCases.forEach(
  it.each(rulesSectionCases)(
    'shows correct chips for PL $prefixList.name with reference $reference.plRuleRefTag',
    ({ prefixList, reference, expectedIPv4, expectedIPv6 }) => {
      const { getByTestId } = renderWithTheme(
        <FirewallPrefixListDrawer
          category="inbound"
          isOpen={true}
          onClose={vi.fn()}
          reference={reference}
          selectedPrefixListLabel={prefixList.name}
        />
      );

      if (prefixList.ipv4 && expectedIPv4) {
        const ipv4Chip = getByTestId('ipv4-chip');
        expect(ipv4Chip).toBeVisible();
        expect(ipv4Chip).toHaveTextContent(expectedIPv4);

        // Check IPv4 addresses
        // const ipv4Content = prefixList.ipv4.length
        //   ? prefixList.ipv4.join(', ')
        //   : 'no IP addresses';
        // expect(getByText(ipv4Content)).toBeVisible();
      }

      if (prefixList.ipv6 && expectedIPv6) {
        const ipv6Chip = getByTestId('ipv6-chip');
        expect(ipv6Chip).toBeVisible();
        expect(ipv6Chip).toHaveTextContent(expectedIPv6);

        // Check IPv6 addresses
        // const ipv6Content = prefixList.ipv6.length
        //   ? prefixList.ipv6.join(', ')
        //   : 'no IP addresses';
        // expect(getByText(ipv6Content)).toBeVisible();
      }
    }
  );
});
