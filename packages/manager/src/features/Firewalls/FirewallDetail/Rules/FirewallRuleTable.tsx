import {
  closestCorners,
  DndContext,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Box, LinkButton, Typography } from '@linode/ui';
import { Autocomplete } from '@linode/ui';
import { Hidden } from '@linode/ui';
import { capitalize } from '@linode/utilities';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { prop, uniqBy } from 'ramda';
import * as React from 'react';

import Undo from 'src/assets/icons/undo.svg';
import { MaskableText } from 'src/components/MaskableText/MaskableText';
import { Table } from 'src/components/Table';
import { TableBody } from 'src/components/TableBody';
import { TableCell } from 'src/components/TableCell';
import { TableHead } from 'src/components/TableHead';
import { TableRow } from 'src/components/TableRow';
import { TableRowEmpty } from 'src/components/TableRowEmpty/TableRowEmpty';
import {
  generateAddressesLabel,
  generateRuleLabel,
  predefinedFirewallFromRule as ruleToPredefinedFirewall,
} from 'src/features/Firewalls/shared';
import { CustomKeyboardSensor } from 'src/utilities/CustomKeyboardSensor';

import { FirewallRuleActionMenu } from './FirewallRuleActionMenu';
import {
  StyledButtonDiv,
  StyledDragIndicator,
  StyledErrorDiv,
  StyledFirewallRuleButton,
  StyledFirewallTableButton,
  StyledHeaderDiv,
  StyledTableRow,
} from './FirewallRuleTable.styles';
import { rulesetResponse, sortPortString } from './shared';
import { SortableRow } from './SortableRow';

import type { FirewallRuleDrawerMode } from './FirewallRuleDrawer.types';
import type { ExtendedFirewallRule, RuleStatus } from './firewallRuleEditor';
import type {
  Category,
  FirewallRuleError,
  FirewallRuleTableRowType,
} from './shared';
import type { DragEndEvent } from '@dnd-kit/core';
import type { FirewallPolicyType } from '@linode/api-v4/lib/firewalls/types';
import type { FirewallOptionItem } from 'src/features/Firewalls/shared';

interface RuleRow {
  action?: null | string;
  addresses?: string;
  description?: null | string;
  errors?: FirewallRuleError[];
  id: number;
  index: number;
  label?: null | string;
  originalIndex: number;
  ports: string;
  protocol?: null | string;
  rowType: FirewallRuleTableRowType;
  ruleset?: null | number; // If the rule is a ruleset
  status: RuleStatus;
  type: string;
}

// =============================================================================
// <FirewallRuleTable />
// =============================================================================

interface RowActionHandlers {
  handleCloneFirewallRule: (idx: number) => void;
  handleDeleteFirewallRule: (idx: number) => void;
  handleOpenRuleDrawerForEditing: (idx: number) => void;
  handleReorder: (startIdx: number, endIdx: number) => void;
  handleUndo: (idx: number) => void;
}

interface FirewallRuleTableProps extends RowActionHandlers {
  category: Category;
  disabled: boolean;
  handlePolicyChange: (
    category: Category,
    newPolicy: FirewallPolicyType
  ) => void;
  openRuleDrawer: (category: Category, mode: FirewallRuleDrawerMode) => void;
  policy: FirewallPolicyType;
  rulesWithStatus: ExtendedFirewallRule[];
}

export const FirewallRuleTable = (props: FirewallRuleTableProps) => {
  const {
    category,
    disabled,
    handleCloneFirewallRule,
    handleDeleteFirewallRule,
    handleOpenRuleDrawerForEditing,
    handlePolicyChange,
    handleReorder,
    handleUndo,
    openRuleDrawer,
    policy,
    rulesWithStatus,
  } = props;

  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'));

  const addressColumnLabel =
    category === 'inbound' ? 'sources' : 'destinations';

  const rowData = firewallRuleToRowData(rulesWithStatus);

  const openDrawerForCreating = React.useCallback(() => {
    openRuleDrawer(category, 'create');
  }, [openRuleDrawer, category]);

  const zeroRulesMessage = `No ${category} rules have been added.`;

  // const screenReaderMessage =
  //   'Some screen readers may require you to enter focus mode to interact with firewall rule list items. In focus mode, press spacebar to begin a drag or tab to access item actions.';

  const getRowDataIndex = React.useMemo(() => {
    return (id: number) => rowData.findIndex((data) => data.id === id);
  }, [rowData]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const sourceIndex = getRowDataIndex(Number(active.id));
      const destinationIndex = getRowDataIndex(Number(over.id));
      handleReorder(sourceIndex, destinationIndex);
    }

    // Remove focus from the initial position when the drag ends.
    if (document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
  };

  const onPolicyChange = (newPolicy: FirewallPolicyType) => {
    handlePolicyChange(category, newPolicy);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor),
    useSensor(CustomKeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // Check how to replace `sortableKeyboardCoordinates` to custom for variable row height
    })
  );

  return (
    <>
      <StyledHeaderDiv>
        <Typography variant="h2">{`${capitalize(category)} Rules`}</Typography>
        <StyledFirewallTableButton
          buttonType="primary"
          disabled={disabled}
          onClick={openDrawerForCreating}
        >
          Add an {capitalize(category)} Rule
        </StyledFirewallTableButton>
      </StyledHeaderDiv>
      <Box
        aria-label={`${category} Rules List`}
        sx={{ margin: 0, width: '100%' }}
      >
        <DndContext
          collisionDetection={closestCorners}
          onDragEnd={onDragEnd}
          sensors={sensors}
        >
          <Table noOverflow>
            <TableHead aria-label={`${category} Rules List Headers`}>
              <TableRow>
                <TableCell
                  sx={{
                    width: smDown ? '64%' : lgDown ? '28%' : '24%',
                  }}
                >
                  Label
                </TableCell>
                <Hidden lgDown>
                  <TableCell sx={{ width: '8%' }}>Protocol</TableCell>
                </Hidden>
                <Hidden smDown>
                  <TableCell sx={{ width: '15%' }}>Port Range</TableCell>
                  <TableCell sx={{ width: '24%' }}>
                    {capitalize(addressColumnLabel)}
                  </TableCell>
                </Hidden>
                <TableCell sx={{ width: '8%' }}>Action</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>

            {rowData.length === 0 ? (
              <TableBody>
                <TableRowEmpty
                  colSpan={6}
                  data-testid={'table-row-empty'}
                  message={zeroRulesMessage}
                />
              </TableBody>
            ) : (
              <SortableContext
                items={rowData.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                {rowData.map((thisRuleRow: RuleRow) => {
                  const commonProps = {
                    disabled,
                    handleDeleteFirewallRule,
                    handleUndo,
                    ...thisRuleRow,
                    id: thisRuleRow.id,
                    rowType: thisRuleRow.rowType,
                  };

                  const rulesProps: FirewallRuleTableRowProps = {
                    ...commonProps,
                    handleOpenRuleDrawerForEditing,
                    handleCloneFirewallRule,
                  };

                  const rulesetProps: FirewallRuleSetTableRowProps = {
                    ...commonProps,
                  };

                  return (
                    <SortableRow id={thisRuleRow.id} key={thisRuleRow.id}>
                      {thisRuleRow.rowType === 'ruleset' ? (
                        <FirewallRuleSetTableRow {...rulesetProps} />
                      ) : (
                        <FirewallRuleTableRow {...rulesProps} />
                      )}
                    </SortableRow>
                  );
                })}
              </SortableContext>
            )}
          </Table>
        </DndContext>
        <PolicyRow
          category={category}
          disabled={disabled}
          handlePolicyChange={onPolicyChange}
          policy={policy}
        />
      </Box>
    </>
  );
};

// =============================================================================
// <FirewallRuleTableRow />
// =============================================================================
interface RowActionHandlersWithDisabled
  extends Omit<RowActionHandlers, 'triggerReorder'> {
  disabled: boolean;
}

export interface FirewallRuleTableRowProps extends RuleRow {
  disabled: RowActionHandlersWithDisabled['disabled'];
  handleCloneFirewallRule: RowActionHandlersWithDisabled['handleCloneFirewallRule'];
  handleDeleteFirewallRule: RowActionHandlersWithDisabled['handleDeleteFirewallRule'];
  handleOpenRuleDrawerForEditing: RowActionHandlersWithDisabled['handleOpenRuleDrawerForEditing'];
  handleUndo: RowActionHandlersWithDisabled['handleUndo'];
}

export interface FirewallRuleSetTableRowProps
  extends Omit<
    FirewallRuleTableRowProps,
    'handleCloneFirewallRule' | 'handleOpenRuleDrawerForEditing'
  > {}

const FirewallRuleTableRow = React.memo((props: FirewallRuleTableRowProps) => {
  const {
    action,
    addresses,
    disabled,
    errors,
    handleCloneFirewallRule,
    handleDeleteFirewallRule,
    handleOpenRuleDrawerForEditing,
    handleUndo,
    index,
    label,
    ports,
    protocol,
    rowType,
    status,
    id,
    originalIndex,
  } = props;

  const actionMenuProps = {
    disabled: status === 'PENDING_DELETION' || disabled,
    handleCloneFirewallRule,
    handleDeleteFirewallRule,
    handleOpenRuleDrawerForEditing,
    idx: index,
    rowType,
  };

  return (
    <StyledTableRow
      aria-label={label ?? `firewall rule ${id}`}
      disabled={disabled}
      key={id}
      originalIndex={originalIndex}
      rowType={rowType}
      ruleIndex={index}
      status={status}
    >
      <TableCell aria-label={`Label: ${label}`}>
        <StyledDragIndicator aria-label="Drag indicator icon" />
        {label || (
          <LinkButton
            disabled={disabled}
            onClick={() => handleOpenRuleDrawerForEditing(index)}
          >
            Add a label
          </LinkButton>
        )}
      </TableCell>
      <Hidden lgDown>
        <TableCell aria-label={`Protocol: ${protocol}`}>
          {protocol}
          <ConditionalError errors={errors} formField="protocol" />
        </TableCell>
      </Hidden>
      <Hidden smDown>
        <TableCell aria-label={`Ports: ${ports}`}>
          {ports === '1-65535' ? 'All Ports' : ports}
          <ConditionalError errors={errors} formField="ports" />
        </TableCell>
        <TableCell aria-label={`Addresses: ${addresses}`}>
          <MaskableText text={addresses} />
          <ConditionalError errors={errors} formField="addresses" />
        </TableCell>
      </Hidden>
      <TableCell aria-label={`Action: ${action}`}>
        {capitalize(action?.toLocaleLowerCase() ?? '')}
      </TableCell>
      <TableCell>
        <Box sx={{ float: 'right' }}>
          {status !== 'NOT_MODIFIED' ? (
            <StyledButtonDiv>
              <StyledFirewallRuleButton
                aria-label="Undo change to Firewall Rule"
                disabled={disabled}
                onClick={() => handleUndo(index)}
                status={status}
              >
                <Undo />
              </StyledFirewallRuleButton>
              <FirewallRuleActionMenu {...actionMenuProps} />
            </StyledButtonDiv>
          ) : (
            <FirewallRuleActionMenu {...actionMenuProps} />
          )}
        </Box>
      </TableCell>
    </StyledTableRow>
  );
});

const FirewallRuleSetTableRow = React.memo(
  (props: FirewallRuleSetTableRowProps) => {
    const {
      disabled,
      errors,
      handleDeleteFirewallRule,
      handleUndo,
      id,
      index,
      label,
      originalIndex,
      rowType,
      status,
    } = props;

    const actionMenuProps = {
      disabled: status === 'PENDING_DELETION' || disabled,
      handleDeleteFirewallRule,
      idx: index,
      rowType,
    };

    // Call ruleset api using ruleset id here.

    return (
      <>
        <StyledTableRow
          aria-label={label ?? `firewall ruleset ${id}`}
          disabled={disabled}
          key={id}
          originalIndex={originalIndex}
          rowType={rowType}
          ruleIndex={index}
          status={status}
        >
          {/* First column merged vertically */}
          <TableCell
            rowSpan={rulesetResponse.rules.length}
            sx={{ verticalAlign: 'top' }}
          >
            <StyledDragIndicator aria-label="Drag indicator icon" />
            {rulesetResponse.label}
            <Box
              style={{
                fontSize: '0.85rem',
                marginTop: '4px',
                marginLeft: '22px',
              }}
            >
              Rule Set ID: {rulesetResponse.id}
            </Box>
          </TableCell>
          {/* Columns from the first child row */}
          {rulesetResponse.rules[0] && (
            <>
              <Hidden lgDown>
                <TableCell
                  aria-label={`Protocol: ${rulesetResponse.rules[0].protocol}`}
                  sx={{ borderBottom: 'none' }}
                >
                  {rulesetResponse.rules[0].protocol}
                  <ConditionalError errors={errors} formField="protocol" />
                </TableCell>
              </Hidden>
              <Hidden smDown>
                <TableCell
                  aria-label={`Ports: ${rulesetResponse.rules[0].ports}`}
                  sx={{ borderBottom: 'none' }}
                >
                  {rulesetResponse.rules[0].ports === '1-65535'
                    ? 'All Ports'
                    : rulesetResponse.rules[0].ports}
                  <ConditionalError errors={errors} formField="ports" />
                </TableCell>
                <TableCell
                  aria-label={`Addresses: ${generateAddressesLabel(rulesetResponse.rules[0].addresses)}`}
                  sx={{ borderBottom: 'none' }}
                >
                  <MaskableText
                    text={generateAddressesLabel(
                      rulesetResponse.rules[0].addresses
                    )}
                  />
                  <ConditionalError errors={errors} formField="addresses" />
                </TableCell>
              </Hidden>
              <TableCell
                aria-label={`Action: ${rulesetResponse.rules[0].action}`}
                sx={{ borderBottom: 'none' }}
              >
                {capitalize(
                  rulesetResponse.rules[0].action?.toLocaleLowerCase() ?? ''
                )}
              </TableCell>
            </>
          )}
          <TableCell
            rowSpan={rulesetResponse.rules.length}
            sx={{ verticalAlign: 'top' }}
          >
            <Box sx={{ float: 'right' }}>
              {status !== 'NOT_MODIFIED' ? (
                <StyledButtonDiv>
                  <StyledFirewallRuleButton
                    aria-label="Undo change to Firewall Rule"
                    disabled={disabled}
                    onClick={() => handleUndo(index)}
                    status={status}
                  >
                    <Undo />
                  </StyledFirewallRuleButton>
                  <FirewallRuleActionMenu {...actionMenuProps} />
                </StyledButtonDiv>
              ) : (
                <FirewallRuleActionMenu {...actionMenuProps} />
              )}
            </Box>
          </TableCell>
        </StyledTableRow>

        {/* Only the remaining child rows columns */}
        {rulesetResponse.rules.slice(1).map((rule, idx) => {
          const addresses = generateAddressesLabel(rule.addresses);
          const isLastRow = rulesetResponse.rules.length - 1 === idx + 1;
          return (
            <StyledTableRow
              aria-label={label ?? `firewall ruleset rule ${idx + 1}`}
              disabled={disabled}
              key={idx + 1}
              originalIndex={originalIndex}
              rowType={rowType}
              ruleIndex={index}
              status={status}
            >
              <Hidden lgDown>
                <TableCell
                  aria-label={`Protocol: ${rule.protocol}`}
                  sx={{ borderBottom: isLastRow ? undefined : 'none' }}
                >
                  {rule.protocol}
                  <ConditionalError errors={errors} formField="protocol" />
                </TableCell>
              </Hidden>
              <Hidden smDown>
                <TableCell
                  aria-label={`Ports: ${rule.ports}`}
                  sx={{ borderBottom: isLastRow ? undefined : 'none' }}
                >
                  {rule.ports === '1-65535' ? 'All Ports' : rule.ports}
                  <ConditionalError errors={errors} formField="ports" />
                </TableCell>
                <TableCell
                  aria-label={`Addresses: ${addresses}`}
                  sx={{ borderBottom: isLastRow ? undefined : 'none' }}
                >
                  <MaskableText text={addresses} />
                  <ConditionalError errors={errors} formField="addresses" />
                </TableCell>
              </Hidden>
              <TableCell
                aria-label={`Action: ${rule.action}`}
                sx={{ borderBottom: isLastRow ? undefined : 'none' }}
              >
                {capitalize(rule.action?.toLocaleLowerCase() ?? '')}
              </TableCell>
            </StyledTableRow>
          );
        })}
      </>
    );
  }
);

interface PolicyRowProps {
  category: Category;
  disabled: boolean;
  handlePolicyChange: (newPolicy: FirewallPolicyType) => void;
  policy: FirewallPolicyType;
}

const policyOptions: FirewallOptionItem<FirewallPolicyType>[] = [
  { label: 'Accept', value: 'ACCEPT' },
  { label: 'Drop', value: 'DROP' },
];

export const PolicyRow = React.memo((props: PolicyRowProps) => {
  const { category, disabled, handlePolicyChange, policy } = props;
  const theme = useTheme();
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'));

  const helperText = lgDown ? (
    <strong>{capitalize(category)} policy:</strong>
  ) : (
    <span>
      <strong>Default {category} policy:</strong> This policy applies to any
      traffic not covered by the {category} rules listed above.
    </span>
  );

  // Using a grid here to keep the Select and the helper text aligned
  // with the Action column for screens < 'md', and with the last column for screens >= 'md'.
  const sxBoxGrid = {
    alignItems: 'center',
    backgroundColor: theme.bg.bgPaper,
    border: `1px solid ${theme.borderColors.borderTable}`,
    color: theme.textColors.tableStatic,
    display: 'grid',
    fontSize: '.875rem',
    gridTemplateAreas: `'one two three four five six'`,
    gridTemplateColumns: '26% 10% 15% 15% 10% 120px',
    height: '40px',
    marginTop: '10px',
    [theme.breakpoints.down('lg')]: {
      gridTemplateAreas: `'one two three four five'`,
      gridTemplateColumns: '32% 15% 15% 10% 120px',
    },
    [theme.breakpoints.down('md')]: {
      gridTemplateAreas: `'one two three four'`,
      gridTemplateColumns: '50% 15% 15% 20%',
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateAreas: `'one two'`,
      gridTemplateColumns: '65% 35%',
    },
    width: '100%',
  };

  const sxBoxPolicyText = {
    gridArea: '1 / 1 / 1 / 6',
    padding: '0px 15px 0px 15px',
    textAlign: 'right',
    [theme.breakpoints.down('lg')]: {
      gridArea: '1 / 1 / 1 / 5',
    },
    [theme.breakpoints.down('md')]: {
      gridArea: '1 / 1 / 1 / 4',
    },
    [theme.breakpoints.down('sm')]: {
      gridArea: 'one',
    },
  };

  const sxBoxPolicySelect = {
    gridArea: 'six',
    [theme.breakpoints.down('lg')]: {
      gridArea: 'five',
    },
    [theme.breakpoints.down('md')]: {
      gridArea: 'four',
    },
    [theme.breakpoints.down('sm')]: {
      gridArea: 'two',
    },
  };

  return (
    <Box sx={sxBoxGrid}>
      <Box sx={sxBoxPolicyText}>{helperText}</Box>
      <Box sx={sxBoxPolicySelect}>
        <Autocomplete
          autoHighlight
          disableClearable
          disabled={disabled}
          label={`${category} policy`}
          onChange={(_, selected) => handlePolicyChange(selected?.value)}
          options={policyOptions}
          textFieldProps={{
            hideLabel: true,
          }}
          value={policyOptions.find(
            (thisOption) => thisOption.value === policy
          )}
        />
      </Box>
    </Box>
  );
});

interface ConditionalErrorProps {
  errors?: FirewallRuleError[];
  formField: string;
}

export const ConditionalError = React.memo((props: ConditionalErrorProps) => {
  const { errors, formField } = props;

  // It's possible to have multiple IP errors, but we only want to display ONE in the table row.
  const uniqueByFormField = uniqBy(prop('formField'), errors ?? []);

  return (
    <>
      {uniqueByFormField.map((thisError) => {
        if (formField !== thisError.formField || !thisError.reason) {
          return null;
        }
        return (
          <StyledErrorDiv key={thisError.idx}>
            <Typography variant="body1">{thisError.reason}</Typography>
          </StyledErrorDiv>
        );
      })}
    </>
  );
});

// =============================================================================
// Utilities
// =============================================================================
/**
 * Transforms Extended Firewall Rules to the higher-level RuleRow. We do this so
 * downstream components don't have worry about transforming individual pieces
 * of data. This also allows us to sort each column of the RuleTable.
 */
export const firewallRuleToRowData = (
  firewallRules: ExtendedFirewallRule[]
): RuleRow[] => {
  return firewallRules.map((thisRule, idx) => {
    const ruleType = ruleToPredefinedFirewall(thisRule);
    const rowType = thisRule.ruleset ? 'ruleset' : 'rule';
    return {
      ...thisRule,
      addresses: generateAddressesLabel(thisRule.addresses),
      id: idx + 1, // ids are 1-indexed, as id given to the useSortable hook cannot be 0
      index: idx,
      ports: sortPortString(thisRule.ports || ''),
      type: generateRuleLabel(ruleType),
      rowType,
    };
  });
};
