import { makeStyles } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  primaryCard: {
    display: 'flex',
    flexDirection: 'row',
    paddingLeft: '10%',
    [device.mobileAndTablet]: {
      flexDirection: 'column-reverse',
      padding: '25px',
      justifyContent: 'center',
    },
  },
  secondaryCard: {
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingRight: '8%',
    [device.mobileAndTablet]: {
      flexDirection: 'column-reverse',
      padding: '25px',
      justifyContent: 'center',
    },
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: 1,
    [device.mobileAndTablet]: {
      marginTop: '20px',
    },
  },
  imageContainer: {
    display: 'flex',
    flex: 1,
    position: 'relative',
    [device.mobileAndTablet]: {
      justifyContent: 'center',
    },
    [device.mobile]: {
      width: '45%',
    },
  },
});
