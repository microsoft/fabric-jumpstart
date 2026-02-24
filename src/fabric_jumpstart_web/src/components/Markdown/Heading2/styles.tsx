import { makeStyles } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  h2container: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: spacingToken.spacing40,
    marginBottom: spacingToken.spacing24,
    '& h2': {
      scrollMarginTop: '150px',
      margin: spacingToken.spacing0,
      lineHeight: '2.1875rem',
      width: '98%',
      [device.mobile]: {
        width: '80%',
      },
      [device.mobileAndTablet]: {
        scrollMarginTop: '100px',
      },
    },
  },
  copyContainer: {
    width: '5%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'end',
    position: 'relative',
  },
});
