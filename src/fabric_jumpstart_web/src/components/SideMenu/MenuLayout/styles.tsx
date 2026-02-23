import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  layoutWrapper: {
    display: 'flex',
    marginTop: spacingToken.spacing0,
    paddingTop: spacingToken.spacing50,
    height: '100%',
    [device.mobileAndTablet]: {
      paddingTop: spacingToken.spacing5,
    },

    '& section': {
      width: '100%',
    },
  },
});
