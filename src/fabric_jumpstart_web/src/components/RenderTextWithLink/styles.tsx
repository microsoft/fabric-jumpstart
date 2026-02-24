import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  previewLinks: {
    margin: `0 ${spacingToken.spacing2}`,
    color: tokens.colorPaletteBlueForeground2,
    textDecoration: 'none',

    '&:hover': {
      textDecoration: 'underline',
    },
  },
  previewNoteLinks: {
    margin: `0 ${spacingToken.spacing2}`,
    color: tokens.colorPaletteBlueForeground2,
    textDecoration: 'underline',

    '&:hover': {
      textDecoration: 'underline',
    },
  },
});
