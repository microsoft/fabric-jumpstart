import { makeStyles, tokens } from '@fluentui/react-components';
import NoteIcon from '@images/note-icon.svg';
import DisclaminerIcon from '@images/disclaimer-info.svg';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  wrapper: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorBrandBackground3Static,
    padding: `${spacingToken.spacing10} ${spacingToken.spacing20} ${spacingToken.spacing10} ${spacingToken.spacing50}`,
    margin: `${spacingToken.spacing30} ${spacingToken.spacing0}`,
    fontSize: tokens.fontSizeBase300,
    borderRadius: '4px',
  },
  noteText: {
    position: 'relative',
    '&::before': {
      content: `url(${NoteIcon.src})`,
      position: 'absolute',
      top: '-3px',
      left: '-35px',
    },
  },
  label: {
    '&::after': {
      content: `": "`,
    },
  },

  disclaimerWrapper: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    color: tokens.colorPaletteYellowForeground1,
  },
  disclaimerText: {
    position: 'relative',
    '&::before': {
      content: `url(${DisclaminerIcon.src})`,
      position: 'absolute',
      top: '2px',
      left: '-35px',
    },
  },
  dropViewStylesWrapper: {
    padding: `${spacingToken.spacing30} ${spacingToken.spacing20} ${spacingToken.spacing30} ${spacingToken.spacing50}`,
  },
});
