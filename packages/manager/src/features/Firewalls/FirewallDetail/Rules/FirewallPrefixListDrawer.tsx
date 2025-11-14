import { Box, Button, Drawer } from '@linode/ui';
import { useNavigate, useParams } from '@tanstack/react-router';
import * as React from 'react';

export interface FirewallPrefixListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPrefixListLabel: string | undefined;
}

export const FirewallPrefixListDrawer = React.memo(
  (props: FirewallPrefixListDrawerProps) => {
    const { onClose, isOpen, selectedPrefixListLabel } = props;
    const navigate = useNavigate();
    const params = useParams({ strict: false });

    const hasRuleSetContext = location.pathname.includes('/ruleset');

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

              if (hasRuleSetContext) {
                navigate({
                  to: '/firewalls/$id/rules/view/$category/ruleset/$ruleId',
                  params: {
                    category: params.category as string,
                    id: params.id as string,
                    ruleId: String(params.ruleId),
                  },
                });
              }
            }}
          >
            Back {hasRuleSetContext ? 'To Ruleset' : null}
          </Button>
        </Box>
      </Drawer>
    );
  }
);
