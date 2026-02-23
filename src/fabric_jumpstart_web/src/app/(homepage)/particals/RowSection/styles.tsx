import { makeStyles } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  card0: {
    marginBottom: '80px',
    marginTop: '30px',
    [device.mobile]: {
      margin: '0px',
    },
  },
  card1: {
    marginBottom: '100px',
    [device.mobileAndTablet]: {
      margin: '0px',
    },
  },
  card2: {
    margin: '200px 0px',
    [device.mobileAndTablet]: {
      margin: '0px',
    },
  },
  image0: {
    maxWidth: '80%',
    height: 'auto',
    transform: 'scale(1.8)',
    marginTop: '40px',
    [device.mobileAndTablet]: {
      height: 'auto',
    },
    [device.tablet]: {
      maxWidth: '50%',
      marginTop: '0px',
    },
    [device.mobile]: {
      maxWidth: '100%',
      marginTop: '40px',
      transform: 'scale(3.0)',
      marginBottom: '50px',
      marginRight: '-85%',
    },
  },
  image1: {
    marginLeft: '-30px',
    maxWidth: '80%',
    height: 'auto',
    transform: 'scale(1.9)',
    marginTop: '180px',
    [device.mobileAndTablet]: {
      height: 'auto',
      marginBottom: '100px',
    },
    [device.tablet]: {
      maxWidth: '50%',
      marginTop: '0px',
    },
    [device.mobile]: {
      maxWidth: '100%',
      marginTop: '80px',
      transform: 'scale(3.0)',
      marginRight: '-50%',
    },
  },
  image2: {
    maxWidth: '100%',
    height: 'auto',
    transform: 'scale(1.8)',
    marginRight: '-100px',
    [device.mobileAndTablet]: {
      maxWidth: '50%',
      height: 'auto',
      marginBottom: '100px',
    },
    [device.mobile]: {
      maxWidth: '100%',
      marginTop: '20px',
      transform: 'scale(2.5)',
      marginRight: '-88%',
    },
  },
  textContainer0: {
    width: '48%',
    [device.mobileAndTablet]: {
      width: '100%',
    },
  },
  textContainer1: {
    width: '46%',
    [device.mobileAndTablet]: {
      width: '100%',
    },
    [device.mobile]: {
      '& a': {
        width: 'auto',
      },
    },
  },
  textContainer2: {
    width: '47%',
    marginRight: '80px',
    [device.mobileAndTablet]: {
      width: '100%',
    },
    [device.mobile]: {
      '& a': {
        width: 'auto',
        padding: '1.5% 1%',
      },
    },
  },
});
