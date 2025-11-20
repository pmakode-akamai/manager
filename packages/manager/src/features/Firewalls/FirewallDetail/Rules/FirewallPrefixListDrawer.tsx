import {
  useAllFirewallPrefixListsQuery,
  //   useFirewallRuleSetQuery,
} from '@linode/queries';
import { Box, Button, Chip, Drawer, Paper, TooltipIcon } from '@linode/ui';
import { capitalize } from '@linode/utilities';
import * as React from 'react';

import { CopyTooltip } from 'src/components/CopyTooltip/CopyTooltip';
import { DateTimeDisplay } from 'src/components/DateTimeDisplay';

import {
  ReferencedSuffix,
  useIsFirewallRulesetsPrefixlistsEnabled,
} from '../../shared';
import { getPrefixListType } from './shared';
import {
  StyledLabel,
  StyledListItem,
  StyledWarningIcon,
  useStyles,
} from './shared.styles';

import type { Category } from './shared';

export interface PrefixListDrawerReference {
  suffix: ReferencedSuffix;
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

    const isIPv4InUse =
      reference?.suffix === '(IPv4)' || reference?.suffix === '(IPv4, IPv6)';

    const isIPv6InUse =
      reference?.suffix === '(IPv6)' || reference?.suffix === '(IPv4, IPv6)';

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
          <StyledListItem paddingMultiplier={2}>
            <StyledLabel component="span">
              {reference?.type === 'ruleset' ? 'Prefix List Name' : 'Name'}:
            </StyledLabel>
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
