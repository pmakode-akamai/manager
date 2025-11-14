import { Box, Button, Drawer } from '@linode/ui';
import { useNavigate, useParams } from '@tanstack/react-router';
import * as React from 'react';

import type { Drawer as RuleDrawerType } from './FirewallRulesLanding';

export interface FirewallPrefixListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prevRuleDrawerData: RuleDrawerType;
  selectedPrefixListLabel: string | undefined;
}

export const FirewallPrefixListDrawer = React.memo(
  (props: FirewallPrefixListDrawerProps) => {
    const { onClose, isOpen, selectedPrefixListLabel, prevRuleDrawerData } =
      props;
    const navigate = useNavigate();
    const params = useParams({ from: '/firewalls/$id/rules' });

    // Call APi to get PrefixList by label here

    return (
      <Drawer
        onClose={onClose}
        open={isOpen}
        title={selectedPrefixListLabel ?? ''}
      >
        {selectedPrefixListLabel}
        <Box marginTop={4}>
          <Button
            buttonType="primary"
            onClick={() => {
              onClose();

              if (prevRuleDrawerData.ruleIdx !== undefined) {
                navigate({
                  to: '/firewalls/$id/rules/view/$category/ruleset/$ruleId',
                  params: {
                    category: prevRuleDrawerData.category,
                    id: params.id,
                    ruleId: String(prevRuleDrawerData.ruleIdx),
                  },
                });
              }
            }}
          >
            Back{' '}
            {prevRuleDrawerData.ruleIdx !== undefined ? 'To Ruleset' : null}
          </Button>
        </Box>
      </Drawer>
    );
  }
);
