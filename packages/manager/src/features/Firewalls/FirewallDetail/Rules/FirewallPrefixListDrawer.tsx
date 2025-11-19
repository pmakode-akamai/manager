import {
  useAllFirewallPrefixListsQuery,
  //   useFirewallRuleSetQuery,
} from '@linode/queries';
import { Box, Button, Chip, Drawer, Paper, TooltipIcon } from '@linode/ui';
import * as React from 'react';

import { CopyTooltip } from 'src/components/CopyTooltip/CopyTooltip';
import { DateTimeDisplay } from 'src/components/DateTimeDisplay';

import { useIsFirewallRulesetsPrefixlistsEnabled } from '../../shared';
import { getPrefixListType } from './shared';
import {
  StyledLabel,
  StyledListItem,
  StyledWarningIcon,
  useStyles,
} from './shared.styles';

import type { Category } from './shared';
import type { FirewallRuleType } from '@linode/api-v4';

export interface PrefixListDrawerReference {
  entity: FirewallRuleType;
  type: 'rule' | 'ruleset';
}
export interface FirewallPrefixListDrawerProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
  reference?: PrefixListDrawerReference;
  selectedPrefixListLabel: string | undefined;
}

export const FirewallPrefixListDrawer = React.memo(
  (props: FirewallPrefixListDrawerProps) => {
    const { onClose, reference, isOpen, selectedPrefixListLabel } = props;
    // const navigate = useNavigate();
    // const params = useParams({ from: '/firewalls/$id/rules' });
    // const hasRuleSetContext = location.pathname.includes('/ruleset');

    const { isFirewallRulesetsPrefixlistsEnabled } =
      useIsFirewallRulesetsPrefixlistsEnabled();
    const { classes } = useStyles();

    const { data, error } = useAllFirewallPrefixListsQuery(
      isFirewallRulesetsPrefixlistsEnabled,
      {},
      { name: selectedPrefixListLabel }
    );

    const prefixListDetails = data?.[0];

    const ipv4ReferenceStatus: 'in use' | 'not in use' = 'in use';
    const ipv6ReferenceStatus: 'in use' | 'not in use' = 'not in use';

    //@TODO - We may not need to pass reference prop, I think we could achieve InUse/NoInUse status in addresses utility itself

    // const { data: ruleSetDetails } = useFirewallRuleSetQuery(
    //   reference?.entity.ruleset ?? -1,
    //   isFirewallRulesetsPrefixlistsEnabled
    // );

    // const isIPv4InUse = reference?.type === 'rule'? reference?.entity.addresses?.ipv4?.includes(selectedPrefixListLabel ?? '') : null

    // const isIPv6InUse = reference?.type ===

    return (
      <Drawer
        error={error}
        onClose={onClose}
        open={isOpen}
        title={selectedPrefixListLabel ?? ''}
      >
        <Box mt={2}>
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">Name: </StyledLabel>
            {prefixListDetails?.name}
          </StyledListItem>
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">ID: </StyledLabel>
            {prefixListDetails?.id}
            <CopyTooltip
              className={classes.copyIcon}
              text={String(prefixListDetails?.id)}
            />
          </StyledListItem>
          <StyledListItem
            paddingMultiplier={2}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <StyledLabel component="span">Description</StyledLabel>
            {prefixListDetails?.description}
          </StyledListItem>
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">Type: </StyledLabel>
            {prefixListDetails?.name
              ? getPrefixListType(prefixListDetails.name)
              : null}
          </StyledListItem>
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">Visibility: </StyledLabel>
            {prefixListDetails?.visibility}
          </StyledListItem>
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">Version: </StyledLabel>
            {prefixListDetails?.version}
          </StyledListItem>
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">Created: </StyledLabel>
            {prefixListDetails?.created && (
              <DateTimeDisplay value={prefixListDetails.created} />
            )}
          </StyledListItem>
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">Updated: </StyledLabel>
            {prefixListDetails?.updated && (
              <DateTimeDisplay value={prefixListDetails.updated} />
            )}
          </StyledListItem>

          {prefixListDetails?.deleted && (
            <StyledListItem paddingMultiplier={2}>
              <StyledWarningIcon />
              <StyledLabel
                component="span"
                sx={(theme) => ({
                  color: theme.tokens.alias.Content.Text.Negative,
                })}
              >
                Marked for deletion:
              </StyledLabel>
              <DateTimeDisplay
                sx={(theme) => ({
                  color: theme.tokens.alias.Content.Text.Negative,
                })}
                value={prefixListDetails.deleted}
              />
              <TooltipIcon
                status="info"
                text="This Prefix List will be automatically deleted when it’s no longer referenced by other firewalls."
              />
            </StyledListItem>
          )}

          {prefixListDetails?.ipv4 !== null && (
            <Paper
              sx={(theme) => ({
                backgroundColor: theme.tokens.alias.Background.Neutral,
                padding: theme.spacingFunction(12),
                marginTop: theme.spacingFunction(8),
              })}
            >
              <StyledLabel
                sx={(theme) => ({
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacingFunction(4),
                })}
              >
                IPv4
                <Chip
                  label={ipv4ReferenceStatus}
                  sx={(theme) => ({
                    background:
                      ipv4ReferenceStatus === 'in use'
                        ? theme.tokens.component.Badge.Positive.Subtle
                            .Background
                        : theme.tokens.component.Badge.Neutral.Subtle
                            .Background,
                    color:
                      ipv4ReferenceStatus === 'in use'
                        ? theme.tokens.component.Badge.Positive.Subtle.Text
                        : theme.tokens.component.Badge.Neutral.Subtle.Text,
                    font: theme.font.bold,
                    fontSize: theme.tokens.font.FontSize.Xxxs,
                    marginRight: theme.spacingFunction(6),
                    flexShrink: 0,
                  })}
                />
              </StyledLabel>

              <StyledListItem component="span">
                {prefixListDetails?.ipv4?.join(', ')}
              </StyledListItem>
            </Paper>
          )}

          {prefixListDetails?.ipv6 !== null && (
            <Paper
              sx={(theme) => ({
                backgroundColor: theme.tokens.alias.Background.Neutral,
                padding: theme.spacingFunction(12),
                marginTop: theme.spacingFunction(8),
              })}
            >
              <StyledLabel
                sx={(theme) => ({
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacingFunction(4),
                  ...(ipv6ReferenceStatus === 'not in use'
                    ? {
                        color: theme.tokens.alias.Content.Text.Primary.Disabled,
                      }
                    : {}),
                })}
              >
                IPv6
                <Chip
                  label={ipv6ReferenceStatus}
                  sx={(theme) => ({
                    background: !ipv6ReferenceStatus
                      ? theme.tokens.component.Badge.Positive.Subtle.Background
                      : theme.tokens.component.Badge.Neutral.Subtle.Background,
                    color: !ipv6ReferenceStatus
                      ? theme.tokens.component.Badge.Positive.Subtle.Text
                      : theme.tokens.component.Badge.Neutral.Subtle.Text,
                    font: theme.font.bold,
                    fontSize: theme.tokens.font.FontSize.Xxxs,
                    marginRight: theme.spacingFunction(6),
                    flexShrink: 0,
                  })}
                />
              </StyledLabel>
              <StyledListItem
                component="span"
                sx={(theme) => ({
                  ...(ipv6ReferenceStatus === 'not in use'
                    ? {
                        color: theme.tokens.alias.Content.Text.Primary.Disabled,
                      }
                    : {}),
                })}
              >
                {prefixListDetails?.ipv6?.join(', ')}
              </StyledListItem>
            </Paper>
          )}
          <Button
            buttonType="outlined"
            onClick={onClose}
            sx={(theme) => ({ marginTop: theme.spacingFunction(16) })}
          >
            {reference?.type === 'ruleset' ? 'Back to Rule Set' : 'Back'}
          </Button>
        </Box>
      </Drawer>
    );
  }
);
