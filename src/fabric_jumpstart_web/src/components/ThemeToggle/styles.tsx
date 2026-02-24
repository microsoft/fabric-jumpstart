import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  buttonContainer: {
    width: '52px',
    height: '26px',
    borderRadius: '20px',
    border: '1px solid white',
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0px 6px 0px 6px',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralCardBackground,
    cursor: 'pointer',
  },
  solidCircle: {
    top: '3px',
    left: '6px',
    position: 'absolute',
    borderRadius: '50%',
    height: '18px',
    width: '18px',
    backgroundColor: tokens.colorNeutralForeground2,
  },
  icons: {
    height: '100%',
  },
  translateBackward: {
    transform: `translateX(0px)`,
    transition: 'transform 0.5s ease',
  },
  translateFoward: {
    transform: `translateX(20px)`,
    transition: 'transform 0.5s ease',
  },
});
