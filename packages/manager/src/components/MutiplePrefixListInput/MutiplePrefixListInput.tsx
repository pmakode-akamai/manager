import { useAllFirewallPrefixListsQuery } from '@linode/queries';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CloseIcon,
  IconButton,
  InputLabel,
  LinkButton,
  Notice,
  SelectedIcon,
  Stack,
  //   TextField,
  TooltipIcon,
  Typography,
} from '@linode/ui';
import Grid from '@mui/material/Grid';
import * as React from 'react';
import { makeStyles } from 'tss-react/mui';

import { StyledLinkButtonBox } from 'src/components/SelectFirewallPanel/SelectFirewallPanel';
import { useIsFirewallRulesetsPrefixlistsEnabled } from 'src/features/Firewalls/shared';

import type { InputBaseProps } from '@mui/material/InputBase';
import type { Theme } from '@mui/material/styles';
import type { ExtendedPL } from 'src/utilities/ipUtils';

const useStyles = makeStyles()((theme: Theme) => ({
  addIP: {
    '& span:first-of-type': {
      justifyContent: 'flex-start',
    },
    paddingLeft: 0,
    paddingTop: theme.spacing(1.5),
  },
  button: {
    '& > span': {
      padding: 2,
    },
    marginLeft: `-${theme.spacing()}`,
    marginTop: 4,
    minHeight: 'auto',
    minWidth: 'auto',
    padding: 0,
  },
  helperText: {
    marginBottom: theme.spacing(),
  },
  input: {
    'nth-child(n+2)': {
      marginTop: theme.spacing(),
    },
  },
  ipNetmaskTooltipSection: {
    display: 'flex',
    flexDirection: 'row',
  },
  required: {
    font: theme.font.normal,
  },
  root: {
    marginTop: theme.spacing(),
  },
}));

export interface MultiplePrefixListInputProps {
  /**
   * Tightens spacing when used in VPC Dual Stack contexts.
   * @default false
   */
  adjustSpacingForVPCDualStack?: boolean;

  /**
   * Text displayed on the button.
   */
  buttonText?: string;

  /**
   * Custom CSS class for additional styling.
   */
  className?: string;

  /**
   * Disables the component (non-interactive).
   * @default false
   */
  disabled?: boolean;

  /**
   * Error message for invalid input.
   */
  error?: string;

  /**
   * Indicates if the input relates to database access controls.
   * @default false
   */
  forDatabaseAccessControls?: boolean;

  /**
   * Indicates if the input is for Prefix Lists (This will be an Autocomplete field).
   * @default false
   */
  forPLs?: boolean;

  /**
   * Indicates if the input is for VPC IPv4 ranges.
   * @default false
   */
  forVPCIPRanges?: boolean;

  /**
   * Helper text for additional guidance.
   */
  helperText?: string;

  /**
   * Custom input properties passed to the underlying input component.
   */
  inputProps?: InputBaseProps;

  /**
   * Styles the button as a link.
   * @default false
   */
  isLinkStyled?: boolean;

  //   /**
  //    * Callback triggered when the input loses focus, passing updated `ips`.
  //    */
  //   onBlur?: (ips: ExtendedIP[]) => void;

  /**
   * Callback triggered when IPs change, passing updated `ips`.
   */
  onChange: (ips: ExtendedPL[]) => void;

  /**
   * Placeholder text for an empty input field.
   */
  placeholder?: string;

  /**
   * Array of `ExtendedPL` objects representing managed PLs.
   */
  pls: ExtendedPL[];

  /**
   * Indicates if the input is required for form submission.
   * @default false
   */
  required?: boolean;

  /**
   * Title or label for the input field.
   */
  title: string;

  /**
   * Tooltip text for extra info on hover.
   */
  tooltip?: string;
}

export const MultiplePrefixListInput = React.memo(
  (props: MultiplePrefixListInputProps) => {
    const {
      adjustSpacingForVPCDualStack,
      buttonText,
      className,
      disabled,
      error,
      forDatabaseAccessControls,
      forVPCIPRanges,
      //   forPLs,
      helperText,
      pls,
      isLinkStyled,
      //   onBlur,
      onChange,
      //   placeholder,
      required,
      title,
      tooltip,
    } = props;
    const { classes, cx } = useStyles();
    const { isFirewallRulesetsPrefixlistsEnabled } =
      useIsFirewallRulesetsPrefixlistsEnabled();
    const { data, isLoading } = useAllFirewallPrefixListsQuery(
      isFirewallRulesetsPrefixlistsEnabled
    );

    const prefixLists = data ?? [];

    // const prefixLists: Partial<FirewallPrefixList>[] = [
    //   { id: 1, name: 'pl:system:test-1', ipv4: ['192.168.0.0'], ipv6: [] },
    //   { id: 2, name: 'pl:system:test-2', ipv4: null, ipv6: [] },
    //   {
    //     id: 3,
    //     name: 'pl:system:test-3',
    //     ipv4: ['192.168.0'],
    //     ipv6: ['133.0.0.0.0'],
    //   },
    //   { id: 4, name: 'pl:system:test-4', ipv4: null, ipv6: null },
    // ];

    const prefixListDropdownOptions = React.useMemo(
      () =>
        prefixLists
          .filter((pl) => {
            const isUnsupported =
              (pl.ipv4 === null || pl.ipv4 === undefined) &&
              (pl.ipv6 === null || pl.ipv6 === undefined);

            // const isAlreadySelected = pls?.some((p) => p.address === pl.name);

            // Keep only when supported AND not selected
            // return isSupported && !isAlreadySelected;
            return !isUnsupported;
          })
          .map((pl) => ({
            label: pl.name,
            value: pl.id,
            notSupportedDetails: {
              isPLIPv4NotSupported: pl.ipv4 === null || pl.ipv4 === undefined,
              isPLIPv6NotSupported: pl.ipv6 === null || pl.ipv6 === undefined,
            },
          })),
      [prefixLists]
    );

    const handleChange = (pl: string, idx: number) => {
      const newPLs = [...pls];
      newPLs[idx].address = pl;
      newPLs[idx].ipv4 = false;
      newPLs[idx].ipv6 = false;
      onChange(newPLs);
    };

    const handleChangeIPv4 = (hasIPv4: boolean, idx: number) => {
      const newPLs = [...pls];
      newPLs[idx].ipv4 = hasIPv4;
      onChange(newPLs);
    };

    const handleChangeIPv6 = (hasIPv6: boolean, idx: number) => {
      const newPLs = [...pls];
      newPLs[idx].ipv6 = hasIPv6;
      onChange(newPLs);
    };

    // const handleBlur = (
    //   e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    //   idx: number
    // ) => {
    //   if (!onBlur || e.target.value === '') {
    //     return;
    //   }

    //   const newIPs = [...ips];
    //   newIPs[idx].address = e.target.value;
    //   onBlur(newIPs);
    // };

    const addNewInput = () => {
      onChange([...pls, { address: '', ipv4: false, ipv6: false }]);
    };

    const removeInput = (idx: number) => {
      const _pls = [...pls];
      _pls.splice(idx, 1);
      onChange(_pls);
    };

    if (!pls) {
      return null;
    }

    const addIPButton =
      forVPCIPRanges || isLinkStyled ? (
        <StyledLinkButtonBox
          sx={{
            marginTop:
              adjustSpacingForVPCDualStack && pls.length === 0
                ? '0px'
                : isLinkStyled
                  ? '8px'
                  : '12px',
          }}
        >
          <LinkButton disabled={disabled} onClick={addNewInput}>
            {buttonText}
          </LinkButton>
        </StyledLinkButtonBox>
      ) : (
        <Button
          buttonType="secondary"
          className={classes.addIP}
          compactX
          disabled={disabled}
          onClick={addNewInput}
        >
          {buttonText ?? 'Add a Prefix List'}
        </Button>
      );

    return (
      <div className={cx(classes.root, className)}>
        {tooltip && title ? (
          <div className={classes.ipNetmaskTooltipSection}>
            <InputLabel>{title}</InputLabel>
            <TooltipIcon
              status="info"
              sxTooltipIcon={{
                marginLeft: '-4px',
                marginTop: '-15px',
              }}
              text={tooltip}
              tooltipPosition="right"
            />
          </div>
        ) : (
          // There are a couple of instances in the codebase where an empty string is passed as the title so a title isn't displayed.
          // Having this check ensures we don't render an empty label element (which can still impact spacing) in those cases.
          title && (
            <InputLabel sx={{ margin: 0 }}>
              {title}
              {required ? (
                <span className={classes.required}> (required)</span>
              ) : null}
            </InputLabel>
          )
        )}
        {helperText && (
          <Typography className={classes.helperText}>{helperText}</Typography>
        )}
        {error && <Notice spacingTop={8} text={error} variant="error" />}
        <Stack spacing={1}>
          {pls.map((thisPL, idx) => (
            <Grid
              container
              data-testid="domain-transfer-input"
              direction="row"
              key={`domain-transfer-ip-${idx}`}
              spacing={2}
              sx={{
                justifyContent: 'center',
                maxWidth: forVPCIPRanges ? '415px' : undefined,
              }}
            >
              <Grid size={11}>
                {/* <TextField
                  className={classes.input}
                  errorText={thisIP.error}
                  hideLabel
                  InputProps={{
                    'aria-label': `${title} ip-address-${idx}`,
                    disabled,
                    ...props.inputProps,
                  }}
                  // Prevent unique ID errors, since TextField sets the input element's ID to the label
                  label={`domain-transfer-ip-${idx}`}
                  onBlur={(e) => handleBlur(e, idx)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e, idx)
                  }
                  placeholder={placeholder}
                  value={thisIP.address}
                /> */}
                <Autocomplete
                  disableClearable={prefixLists.length > 0}
                  errorText={thisPL.error}
                  label=""
                  loading={isLoading}
                  noMarginTop
                  onChange={(_, selectedPrefixList) => {
                    handleChange(selectedPrefixList?.label ?? '', idx);
                  }}
                  options={prefixListDropdownOptions}
                  placeholder="Type to search or select a Rule Set"
                  renderOption={(props, option, { selected }) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Stack
                          alignItems="center"
                          direction="row"
                          justifyContent="space-between"
                          width="100%"
                        >
                          <Stack direction="column">
                            <Box
                              sx={(theme) => ({
                                // eslint-disable-next-line @linode/cloud-manager/no-custom-fontWeight
                                fontWeight:
                                  theme.tokens.font.FontWeight.Semibold,
                              })}
                            >
                              {option.label}
                            </Box>
                            <Box
                              sx={(theme) => ({
                                color:
                                  theme.tokens.component.Dropdown.Text
                                    .Description,
                              })}
                            >
                              ID: {option.value}
                            </Box>
                          </Stack>
                          {selected && <SelectedIcon visible />}
                        </Stack>
                      </li>
                    );
                  }}
                  value={
                    prefixListDropdownOptions.find(
                      (o) => o.label === thisPL.address
                    ) ?? null
                  }
                />
                {thisPL.address.length !== 0 && (
                  <Box gap={2} sx={{ display: 'flex', ml: 0.4 }}>
                    <Checkbox
                      checked={thisPL.ipv4}
                      disabled={
                        prefixListDropdownOptions.find(
                          (o) => o.label === thisPL.address
                        )?.notSupportedDetails.isPLIPv4NotSupported
                      }
                      onChange={() => handleChangeIPv4(!thisPL.ipv4, idx)}
                      text="IPv4"
                    />
                    <Checkbox
                      checked={thisPL.ipv6}
                      disabled={
                        prefixListDropdownOptions.find(
                          (o) => o.label === thisPL.address
                        )?.notSupportedDetails.isPLIPv6NotSupported
                      }
                      onChange={() => handleChangeIPv6(!thisPL.ipv6, idx)}
                      text="IPv6"
                    />
                  </Box>
                )}
              </Grid>
              {/** Don't show the button for the first input since it won't do anything, unless this component is
               * used in DBaaS or for Linode VPC interfaces
               */}
              <Grid size={1}>
                {(idx > 0 || forDatabaseAccessControls || forVPCIPRanges) && (
                  <IconButton
                    aria-disabled={disabled}
                    className={classes.button}
                    data-testid="button"
                    disabled={disabled}
                    onClick={() => removeInput(idx)}
                    sx={(theme) => ({
                      height: 20,
                      width: 20,
                      marginTop: `${theme.spacingFunction(16)} !important`,
                    })}
                  >
                    <CloseIcon data-testid={`delete-pl-${idx}`} />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
        </Stack>
        {addIPButton}
      </div>
    );
  }
);
