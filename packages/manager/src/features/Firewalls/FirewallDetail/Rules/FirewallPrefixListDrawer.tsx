import { useAllFirewallPrefixListsQuery } from '@linode/queries';
import { Box, Button, Chip, Drawer, Paper, TooltipIcon } from '@linode/ui';
import { capitalize } from '@linode/utilities';
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

import type { FirewallIPPrefixListReference } from '../../shared';
import type { Category } from './shared';

export interface PrefixListDrawerReference {
  plFirewallIPRef: FirewallIPPrefixListReference;
  type: 'rule' | 'ruleset';
}
export interface FirewallPrefixListDrawerProps {
  category: Category;
  isOpen: boolean;
  onClose: (options?: { closeAll: boolean }) => void;
  reference?: PrefixListDrawerReference;
  selectedPrefixListLabel: string | undefined;
}

export const FirewallPrefixListDrawer = React.memo(
  (props: FirewallPrefixListDrawerProps) => {
    const { category, onClose, reference, isOpen, selectedPrefixListLabel } =
      props;

    const { isFirewallRulesetsPrefixlistsEnabled } =
      useIsFirewallRulesetsPrefixlistsEnabled();
    const { classes } = useStyles();

    const { data, error } = useAllFirewallPrefixListsQuery(
      isFirewallRulesetsPrefixlistsEnabled,
      {},
      { name: selectedPrefixListLabel }
    );

    const prefixListDetails = data?.[0];

    const isIPv4InUse =
      reference?.plFirewallIPRef === '(IPv4)' ||
      reference?.plFirewallIPRef === '(IPv4, IPv6)';

    const isIPv6InUse =
      reference?.plFirewallIPRef === '(IPv6)' ||
      reference?.plFirewallIPRef === '(IPv4, IPv6)';

    return (
      <Drawer
        error={error}
        onClose={() => onClose({ closeAll: true })}
        open={isOpen}
        title={
          reference?.type === 'ruleset'
            ? `${capitalize(category)} Rule Set details`
            : 'Prefix List details'
        }
      >
        <Box mt={2}>
          {[
            {
              label:
                reference?.type === 'ruleset' ? 'Prefix List Name' : 'Name',
              value: prefixListDetails?.name,
            },
            {
              label: 'ID',
              value: prefixListDetails?.id,
              copy: true,
            },
            {
              label: 'Description',
              value: prefixListDetails?.description,
              column: true,
            },
            {
              label: 'Type',
              value: prefixListDetails?.name
                ? getPrefixListType(prefixListDetails.name)
                : null,
            },
            {
              label: 'Visibility',
              value: prefixListDetails?.visibility,
            },
            {
              label: 'Version',
              value: prefixListDetails?.version,
            },
            {
              label: 'Created',
              value: prefixListDetails?.created && (
                <DateTimeDisplay value={prefixListDetails.created} />
              ),
            },
            {
              label: 'Updated',
              value: prefixListDetails?.updated && (
                <DateTimeDisplay value={prefixListDetails.updated} />
              ),
            },
          ].map((item, idx) => (
            <StyledListItem
              key={`item-${idx}`}
              paddingMultiplier={2}
              sx={
                item.column
                  ? { flexDirection: 'column', alignItems: 'flex-start' }
                  : {}
              }
            >
              {item.label && (
                <StyledLabel component="span">{item.label}: </StyledLabel>
              )}

              {item.value}

              {item.copy && (
                <CopyTooltip
                  className={classes.copyIcon}
                  text={String(item.value)}
                />
              )}
            </StyledListItem>
          ))}

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
                  label={isIPv4InUse ? 'in use' : 'not in use'}
                  sx={(theme) => ({
                    background: isIPv4InUse
                      ? theme.tokens.component.Badge.Positive.Subtle.Background
                      : theme.tokens.component.Badge.Neutral.Subtle.Background,
                    color: isIPv4InUse
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
                  ...(!isIPv6InUse
                    ? {
                        color: theme.tokens.alias.Content.Text.Primary.Disabled,
                      }
                    : {}),
                })}
              >
                IPv6
                <Chip
                  label={isIPv6InUse ? 'in use' : 'not in use'}
                  sx={(theme) => ({
                    background: isIPv6InUse
                      ? theme.tokens.component.Badge.Positive.Subtle.Background
                      : theme.tokens.component.Badge.Neutral.Subtle.Background,
                    color: isIPv6InUse
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
                  ...(!isIPv6InUse
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
            onClick={() => onClose({ closeAll: false })}
            sx={(theme) => ({ marginTop: theme.spacingFunction(16) })}
          >
            {reference?.type === 'ruleset' ? 'Back to Rule Set' : 'Back'}
          </Button>
        </Box>
      </Drawer>
    );
  }
);
