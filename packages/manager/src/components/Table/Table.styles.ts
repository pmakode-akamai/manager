import { styled } from '@mui/material/styles';

import { omittedProps } from 'src/utilities/omittedProps';

import type { TableProps } from './Table';

export const StyledTableWrapper = styled('div', {
  label: 'StyledTableWrapper',
  shouldForwardProp: omittedProps([
    'noBorder',
    'noOverflow',
    'rowHoverState',
    'spacingBottom',
    'spacingTop',
  ]),
})<TableProps>(({ theme, ...props }) => ({
  '& thead': {
    '& th': {
      '&:first-of-type': {
        borderLeft: 'none',
      },
      '&:last-of-type': {
        borderRight: 'none',
      },
      backgroundColor: theme.bg.tableHeader,
      borderBottom: `1px solid ${theme.borderColors.borderTable}`,
      borderRight: `1px solid ${theme.borderColors.borderTable}`,
      borderTop: `1px solid ${theme.borderColors.borderTable}`,
      fontFamily: theme.font.bold,
      padding: '10px 15px',
    },
  },
  marginBottom: props.spacingBottom !== undefined ? props.spacingBottom : 0,
  marginTop: props.spacingTop !== undefined ? props.spacingTop : 0,
  ...(!props.noOverflow && {
    overflowX: 'auto',
    overflowY: 'hidden',
  }),
  ...(props.noBorder && {
    '& thead th': {
      border: 0,
    },
  }),
}));
