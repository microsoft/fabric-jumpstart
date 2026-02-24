import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  customTable: {
    marginTop: spacingToken.spacing16,
    borderSpacing: 0,
    width: '100%',
    maxWidth: '100%',
    tableLayout: 'auto',

    '& thead': {
      backgroundColor: tokens.colorBrandBackground4Static,
      color: tokens.colorNeutralForegroundStaticInverted,
      fontSize: tokens.fontSizeBase400,
    },

    '& thead th:first-child': {
      borderTopLeftRadius: '5px',
    },

    '& thead th:last-child': {
      borderTopRightRadius: '5px',
    },

    '& tbody tr:last-child td:first-child ': {
      borderBottomLeftRadius: '5px',
    },

    '& tbody tr:last-child td:last-child': {
      borderBottomRightRadius: '5px',
    },
    '& th': {
      whiteSpace: 'nowrap',
      width: 'auto',
    },
    '& td': {
      maxWidth: '20ch',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      whiteSpace: 'normal',
      [device.mobile]: {
        maxWidth: '100%',
        wordBreak: 'normal',
      },
    },
    '& th, & td': {
      padding: spacingToken.spacing10,
      border: `1px solid ${tokens.colorNeutralForegroundInvertedLink}`,

      '& code': {
        wordWrap: 'normal',
      },
    },
  },
  scrollable: {
    [device.mobile]: {
      overflowX: 'scroll',
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: tokens.colorNeutralForeground3,
      },
      '&::-webkit-scrollbar-thumb': {
        background: tokens.colorNeutralForegroundDisabled,
        borderRadius: '20px',
        width: '8px',
        height: '20px',
      },
    },
  },
});
