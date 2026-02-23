import React, { useState, useRef } from 'react';
import Image from 'next/image';
import ClipboardRegular from '@images/clipboard-regular.svg';
import ClipboardFilled from '@images/clipboard-filled.svg';
import ClipboardLightRegular from '@images/clipboard-lightregular.svg';
import { mergeClasses } from '@fluentui/react-components';
import { useStyles } from './styles';
import { useThemeContext } from '@components/Providers/themeProvider';
import { themeType } from '@constants/common';

const IconState = {
  rest: 'rest',
  hover: 'hover',
};

const Copy = ({
  onClick,
  altText,
  ariaLabel,
}: {
  onClick: (e: any) => typeof e;
  altText: string;
  ariaLabel: string;
}) => {
  const [state, setState] = useState(IconState.rest);
  const buttonRef = useRef<HTMLDivElement>(null);
  const styles = useStyles();
  const { theme } = useThemeContext();
  const isDarkMode = theme.key === themeType.dark;
  const darkModeIcon =
    state === IconState.rest ? ClipboardRegular : ClipboardFilled;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Only trigger on Enter or Space, not on arrow keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
      // set focus again after click
      setTimeout(() => {
        buttonRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div
      ref={buttonRef}
      onMouseEnter={() => setState(IconState.hover)}
      onMouseLeave={() => setState(IconState.rest)}
      onClick={onClick}
      tabIndex={0}
      className={styles.copyIcon}
      role="button"
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
    >
      <Image
        src={isDarkMode ? darkModeIcon : ClipboardLightRegular}
        alt={altText ?? ariaLabel}
      />
    </div>
  );
};

export const CopyToaster = ({
  text,
  show,
}: {
  text: string;
  show: boolean;
}) => {
  const styles = useStyles();
  return (
    <span className={mergeClasses(styles.toast, show && styles.visibleToast)}>
      {text}
    </span>
  );
};

export default Copy;
