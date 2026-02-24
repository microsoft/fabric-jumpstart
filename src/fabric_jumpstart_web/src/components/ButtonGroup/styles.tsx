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
      flexDirection: 'column', // Stack vertically on mobile
      width: '100%',
      maxWidth: '430px',
      '& > *:first-child': {
        width: '100%',
        maxWidth: '430px',
        marginBottom: tokens.spacingVerticalM,
      },
    },
    '& a': {
      padding: '1.5% 8%',

      [device.mobile]: {
        padding: '1.5% 4%',
        width: '100%',
      },
      [device.tablet]: {
        width: '100%',
      },
    },
  },
});
