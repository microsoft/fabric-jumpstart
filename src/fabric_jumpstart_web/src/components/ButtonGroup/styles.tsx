import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  buttonContainer: {
    display: 'flex',
    marginTop: tokens.spacingHorizontalS,
    '& > *:first-child': {
      marginRight: tokens.spacingVerticalM,
    },
    [device.mobile]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      '& > *:first-child': {
        marginBottom: tokens.spacingVerticalM,
      },
    },
    '& a': {
      padding: '8px 24px',
      whiteSpace: 'nowrap',
    },
  },
});
