import { tokens, makeStyles } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  wrapper: {
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  container: {
    maxWidth: '1440px',
    width: '1440px',
    height: '100%',
    backgroundColor: 'transparent',
    paddingTop: '10px',
    [device.mobile]: {
      width: '100%',
    },
  },
});
