import { makeStyles, tokens } from '@fluentui/react-components';
import NoteIcon from '@images/note-icon.svg';
import NoteIconLight from '@images/note-icon-light.svg';
import DisclaminerIcon from '@images/disclaimer-icon.svg';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  customBlockquote: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorBrandBackground3Static,
    padding: `${spacingToken.spacing24} ${spacingToken.spacing24} ${spacingToken.spacing24} ${spacingToken.spacing50}`,
    margin: `${spacingToken.spacing30} ${spacingToken.spacing0}`,
    borderRadius: '10px',

    '& p': {
      position: 'relative',
      '&::before': {
        content: `url(${NoteIcon.src})`,
        position: 'absolute',
        top: '-1px',
        left: '-35px',
      },

      '& em > code': {
        color: '#63d0ff',
      },

      '& strong': {
        position: 'relative',
        left: '-3px',
      },
    },
  },

  blockQuoteLightModeIcon: {
    '& p': {
      '&::before': {
        content: `url(${NoteIconLight.src})`,
      },
    },
  },

  customBlockquoteDisclaimer: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    color: tokens.colorPaletteYellowForeground1,

    '& p': {
      position: 'relative',
      textAlign: 'justify',
      '&::before': {
        content: `url(${DisclaminerIcon.src})`,
        position: 'absolute',
        top: '-1px',
        left: '-35px',
      },
    },
  },
});
