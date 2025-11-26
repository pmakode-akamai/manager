import { capitalize } from '@linode/utilities';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { firewallPrefixListFactory } from 'src/factories';
import { renderWithTheme } from 'src/utilities/testHelpers';

import * as shared from '../../shared';
import { FirewallPrefixListDrawer } from './FirewallPrefixListDrawer';
import { PREFIXLIST_MARKED_FOR_DELETION_TEXT } from './shared';

import type { FirewallPrefixListDrawerProps } from './FirewallPrefixListDrawer';

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
    spy.mockReturnValue({ isFirewallRulesetsPrefixlistsEnabled: true });

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
    'renders correct Drawer title, labels, and button',
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

  it.each(deletionCases)('%s', async ({ deleted }) => {
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
});
