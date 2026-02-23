import { makeStaticStyles } from '@fluentui/react-components';

export const useGlobalStyles = makeStaticStyles({
  body: {
    backgroundColor: 'var(--colorNeutralBackground1)',
  },
  'body::-webkit-scrollbar': {
    width: '10px',
    height: '10px',
  },
  'body::-webkit-scrollbar-track': {
    backgroundColor: 'var(--colorNeutralBackground1)',
  },
  'body::-webkit-scrollbar-thumb': {
    background: 'var(--scrollbarThumbBg)',
    borderRadius: '20px',
    width: '9px',
    height: '60px',
  },
  '& iframe': {
    width: '100% !important',
    height: '100% !important',
  },
});
