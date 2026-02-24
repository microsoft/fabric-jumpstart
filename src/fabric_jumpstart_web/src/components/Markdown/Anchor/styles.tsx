import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  link: {
    color: tokens.colorPaletteBlueForeground2,
    textDecoration: 'none',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    wordWrap: 'break-word',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});
