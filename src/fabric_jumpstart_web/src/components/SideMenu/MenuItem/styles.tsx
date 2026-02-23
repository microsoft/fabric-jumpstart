import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  menuItem: {
    color: tokens.colorNeutralForeground1,
    maxWidth: '250px',
    padding: `${spacingToken.spacing8} ${spacingToken.spacing20}`,
    border: '1px solid transparent',
  },
  menuItemLink: {
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    '& svg': {
      marginRight: spacingToken.spacing10,
      verticalAlign: 'center',
    },
  },

  menuItemLeaf: {
    '&:hover': {
      border: `1px solid ${tokens.colorPaletteBeigeBorderActive}`,
      borderRadius: '4px',
    },
  },

  menuChild: {
    marginLeft: spacingToken.spacing20,
  },

  menuItemActiveLeaf: {
    border: `1px solid ${tokens.colorPaletteBeigeBorderActive}`,
    borderRadius: '4px',
  },
});
